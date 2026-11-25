'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useOrganization } from '@/context/OrganizationContext';
import { resolvePlan, PLANS } from '@/config/plans';
import { useAuth } from '@/hooks/useAuth';
import { useScrollToHash } from '@/hooks/useScrollToHash';
import api from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Users,
  Crown,
  Shield,
  Trash2,
  ExternalLink,
  Copy,
  Check,
  Mail,
  Loader2,
} from 'lucide-react';
import { OrganizationSkeleton, MembersTableSkeleton } from '@/components/admin/OrganizationSkeleton';
import { InviteMemberModal } from '@/components/organization/InviteMemberModal';
import { PendingInvitations } from '@/components/organization/PendingInvitations';
import { JobRolesTab } from '@/components/organization/JobRolesTab';
import dynamic from 'next/dynamic';
const WebhooksPage = dynamic(() => import('@/app/admin/webhooks/page'), { ssr: false });
const WidgetsPage = dynamic(() => import('@/app/admin/widgets/page'), { ssr: false });
const IntegrationsPage = dynamic(() => import('@/app/admin/settings/integrations/page'), { ssr: false });
const ApiKeysPage = dynamic(() => import('@/app/admin/api-keys/page'), { ssr: false });
const TrackedUsersPage = dynamic(() => import('@/app/admin/tracked-users/page'), { ssr: false });
import { ProfileTab } from '@/components/organization/ProfileTab';
// Billing components moved from old BillingSection
import paddleService, { SubscriptionInfo, Invoice } from '@/services/paddleService';
import { PlanCard } from '@/components/billing/PlanCard';
import { UpgradeDialog } from '@/components/UpgradeDialog';
import { CancelFlow } from '@/components/billing/CancelFlow';
import { InvoiceHistory } from '@/components/billing/InvoiceHistory';
import { CustomDomainSettings } from '@/components/organization/CustomDomainSettings';
import { PlanWeightsSection } from '@/components/organization/PlanWeightsSection';
import { RevenueSettingsSection } from '@/components/organization/RevenueSettingsSection';
import { BrandingSection } from '@/components/organization/BrandingSection';
import { NotificationsTab } from '@/components/organization/NotificationsTab';
import { ProFeatureGate } from '@/components/ProFeatureGate';

interface Member {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  organization_role: string;
  job_role?: string;
  created_at: string;
  joined_at?: string;
}

function OrganizationSettingsInner() {
  const router = useRouter();
  const { toast } = useToast();
  const { organization, organizations, organizationRole, loading, orgsFetchStatus, refreshOrganization } = useOrganization();
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [saving, setSaving] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [inviting, setInviting] = useState(false);
  const [copiedSubdomain, setCopiedSubdomain] = useState(false);
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') || 'general';
  const setActiveTab = (tab: string) => router.replace(`/admin/organization?tab=${tab}`);

  // Invitation modal state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [invitationRefreshTrigger, setInvitationRefreshTrigger] = useState(0);

  // Remove member confirmation dialog state
  const [removeMemberTarget, setRemoveMemberTarget] = useState<{ id: string; name: string } | null>(null);

  // Billing state
  const [billingSubscription, setBillingSubscription] = useState<SubscriptionInfo | null>(null);
  const [billingInvoices, setBillingInvoices] = useState<Invoice[]>([]);
  const [billingLoading, setBillingLoading] = useState(true);
  const [billingActionLoading, setBillingActionLoading] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [showCancelFlow, setShowCancelFlow] = useState(false);
  const [removing, setRemoving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    website: '',
    industry: '',
  });

  // ?tab=general#revenue-data → scroll to the Revenue data card once the tab
  // is active and the card has mounted (it can mount late behind the plan
  // gate; on Free it never mounts — the hook gives up silently).
  useScrollToHash('revenue-data', activeTab === 'revenue' && !loading);

  useEffect(() => {
    // Wait for AuthContext to finish loading before making any redirect decisions.
    // On reload, isAuthenticated is false until checkAuth() completes — redirecting
    // immediately would send the user to /login even though they have a valid session.
    if (authLoading) return;

    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    // Only redirect if fetch genuinely completed and confirmed zero orgs
    if (orgsFetchStatus === 'success' && !organization && organizations.length === 0) {
      toast({
        title: 'No organization',
        description: 'You need to create an organization first.',
        variant: 'destructive',
      });
      router.push('/onboarding');
    }
  }, [isAuthenticated, authLoading, loading, orgsFetchStatus, organization, organizations, router, toast]);

  useEffect(() => {
    if (organization) {
      setFormData({
        name: organization.name || '',
        description: organization.description || '',
        website: organization.website || '',
        industry: organization.industry || '',
      });
      fetchMembers();
    }
  }, [organization]);

  // Load billing data
  useEffect(() => {
    if (activeTab === 'billing') {
      loadBillingData();
    }
  }, [activeTab]);

  const loadBillingData = async () => {
    try {
      setBillingLoading(true);
      // Invoices are owner/admin only on the backend — skip the call for members
      // so the open subscription fetch isn't dragged down by a 403.
      const canViewInvoices = ['owner', 'admin'].includes(organizationRole ?? '');
      const [subResponse, invoicesResponse] = await Promise.all([
        paddleService.getSubscription(),
        canViewInvoices
          ? paddleService.getInvoices(10)
          : Promise.resolve({ success: false, data: { invoices: [] } }),
      ]);

      if (subResponse.success) {
        setBillingSubscription(subResponse.data);
      } else {
        setBillingSubscription({
          status: 'free',
          plan: 'free',
          trialEndsAt: null,
          currentPeriodStart: null,
          currentPeriodEnd: null,
          cancelAtPeriodEnd: false,
          hasActiveSubscription: false,
          billingProvider: 'paddle',
        });
      }

      if (invoicesResponse.success && invoicesResponse.data.invoices) {
        setBillingInvoices(invoicesResponse.data.invoices);
      }
    } catch (error) {
      console.error('Error loading billing data:', error);
      setBillingSubscription({
        status: 'free',
        plan: 'free',
        trialEndsAt: null,
        currentPeriodStart: null,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
        hasActiveSubscription: false,
        billingProvider: 'paddle',
      });
    } finally {
      setBillingLoading(false);
    }
  };

  const fetchMembers = async () => {
    if (!organization) return;

    try {
      setLoadingMembers(true);
      console.log('🔍 Fetching members for organization:', organization.id);

      const response = await api.get(`/api/organizations/${organization.id}/members`);
      console.log('✅ Members data received:', response.data);
      setMembers(response.data.data.members);
    } catch (error: any) {
      console.error('❌ Failed to fetch members:', error);
      toast({
        title: 'Error',
        description: error?.response?.data?.error || 'Failed to load members',
        variant: 'destructive',
      });
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleUpdateOrganization = async () => {
    if (!organization) return;
    if (organizationRole !== 'owner') {
      toast({
        title: 'Unauthorized',
        description: 'Only organization owners can update settings.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSaving(true);
      await api.put(`/api/organizations/${organization.id}`, formData);
      toast({
        title: 'Success',
        description: 'Organization settings updated successfully.',
      });
      await refreshOrganization();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.response?.data?.error || 'Failed to update organization settings.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInviteUser = async () => {
    if (!organization || !inviteEmail) return;

    try {
      setInviting(true);
      await api.post(`/api/organizations/${organization.id}/members`, {
        email: inviteEmail,
        role: inviteRole,
      });
      toast({
        title: 'Invitation sent',
        description: `Invitation sent to ${inviteEmail}`,
      });
      setInviteEmail('');
      setInviteRole('member');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.response?.data?.error || 'Failed to send invitation.',
        variant: 'destructive',
      });
    } finally {
      setInviting(false);
    }
  };

  const handleUpdateMemberRole = async (memberId: string, newRole: string) => {
    if (!organization) return;
    if (organizationRole !== 'owner') {
      toast({
        title: 'Unauthorized',
        description: 'Only organization owners can change member roles.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await api.put(`/api/organizations/${organization.id}/members/${memberId}`, {
        role: newRole,
      });

      toast({
        title: 'Success',
        description: 'Member role updated successfully.',
      });
      await fetchMembers(); // Refresh the members list
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.response?.data?.error || 'Failed to update member role.',
        variant: 'destructive',
      });
    }
  };

  /**
   * Initiates the remove-member flow by storing the target and opening the
   * confirmation dialog. Actual deletion happens in confirmRemoveMember.
   *
   * Guards:
   *  - Only admins/owners can see the Remove button (enforced in the JSX).
   *  - Owners are never shown a Remove button (enforced in the JSX).
   *  - Self-removal is caught by the backend (returns 400 with a clear message).
   */
  const handleRemoveMember = (memberId: string, memberName: string) => {
    setRemoveMemberTarget({ id: memberId, name: memberName });
  };

  const confirmRemoveMember = async () => {
    if (!organization || !removeMemberTarget) return;

    try {
      setRemoving(true);
      await api.delete(
        `/api/organizations/${organization.id}/members/${removeMemberTarget.id}`
      );
      toast({
        title: 'Member removed',
        description: `${removeMemberTarget.name} has been removed from the organization.`,
      });
      setRemoveMemberTarget(null);
      await fetchMembers();
    } catch (error: any) {
      const message =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        'Failed to remove member.';
      toast({
        title: 'Could not remove member',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setRemoving(false);
    }
  };

  const copySubdomain = () => {
    if (!organization) return;
    const url = `https://${organization.subdomain}.faddy.online`;
    navigator.clipboard.writeText(url);
    setCopiedSubdomain(true);
    setTimeout(() => setCopiedSubdomain(false), 2000);
    toast({
      title: 'Copied!',
      description: 'Organization URL copied to clipboard.',
    });
  };

  if (loading || !organization) {
    return <OrganizationSkeleton />;
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'owner':
        return 'default';
      case 'admin':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="h-4 w-4" />;
      case 'admin':
        return <Shield className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  const planTier = resolvePlan(organization);
  const planFeatures = PLANS[planTier]?.features;
  const maxAdmins = planFeatures?.admin_members ?? 10;
  const isUnlimitedMembers = planFeatures?.team_members === -1;
  const adminCount = members.filter(
    (m) => m.organization_role === 'admin' || m.organization_role === 'owner'
  ).length;

  return (
    <div className={activeTab === 'tracked-users' ? 'settings-content settings-content--wide' : 'settings-content'}>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            {/* Hidden tab triggers for functionality */}
            <div className="hidden">
              <TabsList>
                <TabsTrigger value="profile" id="tab-profile">Profile</TabsTrigger>
                <TabsTrigger value="general" id="tab-general">General</TabsTrigger>
                <TabsTrigger value="branding" id="tab-branding">Branding</TabsTrigger>
                <TabsTrigger value="revenue" id="tab-revenue">Revenue</TabsTrigger>
                <TabsTrigger value="members" id="tab-members">Members</TabsTrigger>
                <TabsTrigger value="roles" id="tab-roles">Job Roles</TabsTrigger>
                <TabsTrigger value="subdomain" id="tab-subdomain">Subdomain</TabsTrigger>
                <TabsTrigger value="webhooks" id="tab-webhooks">Webhooks</TabsTrigger>
                <TabsTrigger value="api-keys" id="tab-api-keys">API Keys</TabsTrigger>
                <TabsTrigger value="widgets" id="tab-widgets">Widgets</TabsTrigger>
                <TabsTrigger value="integrations" id="tab-integrations">Integrations</TabsTrigger>
                <TabsTrigger value="notifications" id="tab-notifications">Notifications</TabsTrigger>
                <TabsTrigger value="billing" id="tab-billing">Billing</TabsTrigger>
                <TabsTrigger value="tracked-users" id="tab-tracked-users">Tracked Users</TabsTrigger>
              </TabsList>
            </div>

            {/* Profile Tab */}
            <TabsContent value="profile">
              <ProfileTab />
            </TabsContent>

            {/* General Settings */}
            <TabsContent value="general">
              <div className="settings-content org-page space-y-8">
                <section className="settings-section">
                  <div className="settings-section__head">
                    <h2 className="settings-section__title">Organization Details</h2>
                    <p className="settings-section__desc">Update your organization's basic information</p>
                  </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium text-foreground">Organization Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      disabled={organizationRole !== 'owner'}
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-sm font-medium text-foreground">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      disabled={organizationRole !== 'owner'}
                      rows={3}
                      className="resize-none h-auto"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="website" className="text-sm font-medium text-foreground">Website</Label>
                    <Input
                      id="website"
                      type="url"
                      placeholder="https://example.com"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      disabled={organizationRole !== 'owner'}
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="industry" className="text-sm font-medium text-foreground">Industry</Label>
                    <Input
                      id="industry"
                      placeholder="e.g., SaaS, E-commerce"
                      value={formData.industry}
                      onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                      disabled={organizationRole !== 'owner'}
                      className="h-11"
                    />
                  </div>

                  {organizationRole === 'owner' && (
                    <Button onClick={handleUpdateOrganization} disabled={saving}>
                      {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  )}
                </div>
                </section>
              </div>
            </TabsContent>

            {/* Branding */}
            <TabsContent value="branding">
              <div className="settings-content org-page space-y-8">
                <BrandingSection />
              </div>
            </TabsContent>

            {/* Revenue */}
            <TabsContent value="revenue">
              <div className="settings-content revenue-page">
                <div className="revenue-page__head">
                  <h2 className="revenue-page__title">Revenue</h2>
                  <p className="revenue-page__subtitle">
                    Use customer revenue to weight how urgent feedback is.
                  </p>
                </div>

                {/* Revenue plan weights — severity scoring multiplier */}
                <PlanWeightsSection />

                {/* Revenue data — MRR field keys + currency (Starter/Pro);
                    gate rendered flat inside the section (locked fields stay visible) */}
                <RevenueSettingsSection />
              </div>
            </TabsContent>


            {/* Members Tab */}
            <TabsContent value="members">
              <div className="max-w-4xl mx-auto space-y-8 pb-12">
                {/* Header with Invite button */}
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="settings-page__title">Team Members</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      {adminCount} / {maxAdmins} admins • {isUnlimitedMembers ? '∞ Members' : `${members.length} / ${planFeatures?.team_members} Members`}
                    </p>
                  </div>
                  {organizationRole === 'owner' && (
                    <Button onClick={() => setShowInviteModal(true)} className="gap-1.5">
                      <Mail className="h-4 w-4" /> Invite Member
                    </Button>
                  )}
                </div>

                {/* Pending Invitations */}
                {organizationRole === 'owner' && (
                  <PendingInvitations
                    organizationId={organization.id}
                    refreshTrigger={invitationRefreshTrigger}
                  />
                )}

                {/* Members Table */}
                <div className="border border-border rounded-lg overflow-hidden">
                  {loadingMembers ? (
                    <div className="p-6">
                      <MembersTableSkeleton />
                    </div>
                  ) : members.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <Users className="h-10 w-10 text-muted-foreground/40 mb-3" />
                      <p className="text-sm text-muted-foreground">No team members yet</p>
                      <p className="text-xs text-muted-foreground mt-1">Invite members to get started</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead>Member</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Joined</TableHead>
                          <TableHead className="text-right w-16"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {members.map((member) => (
                          <TableRow key={member.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">
                                  {member.name?.[0]?.toUpperCase() || '?'}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-foreground truncate">{member.name}</p>
                                  <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {organizationRole === 'owner' && member.organization_role !== 'owner' ? (
                                <select
                                  className="px-2.5 py-1 border border-border rounded-md text-sm bg-background"
                                  value={member.organization_role}
                                  onChange={(e) => handleUpdateMemberRole(member.id, e.target.value)}
                                >
                                  <option value="member">Member</option>
                                  <option value="admin">Admin</option>
                                  <option value="owner">Owner</option>
                                </select>
                              ) : (
                                <Badge variant={getRoleBadgeVariant(member.organization_role)} className="capitalize">
                                  <span className="mr-1">{getRoleIcon(member.organization_role)}</span>
                                  {member.organization_role}
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {new Date(member.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-right">
                              {(['owner', 'admin'] as string[]).includes(organizationRole ?? '') &&
                                member.organization_role !== 'owner' && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => handleRemoveMember(member.id, member.name)}
                                    id={`remove-member-${member.id}`}
                                  >
                                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-red-500" />
                                  </Button>
                                )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Subdomain Tab */}
            <TabsContent value="subdomain">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="settings-page__title">Organization Subdomain</CardTitle>
                    <CardDescription>
                      Your unique subdomain for accessing your organization
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Current Subdomain</Label>
                      <div className="flex items-center gap-2 mt-2">
                        <code className="px-4 py-2 bg-muted rounded-md flex-1">
                          {organization.subdomain}.faddy.online
                        </code>
                        <Button variant="outline" size="icon" onClick={copySubdomain}>
                          {copiedSubdomain ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        <strong>Note:</strong> Changing your subdomain will affect all existing links and integrations. This action cannot be undone.
                      </p>
                    </div>

                    <div>
                      <Label>Public Access URL</Label>
                      <div className="flex items-center gap-2 mt-2">
                        <Input
                          value={`https://${organization.subdomain}.faddy.online`}
                          readOnly
                          className="flex-1"
                        />
                        <Button variant="outline" asChild>
                          <a href={`https://${organization.subdomain}.faddy.online`} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Custom Domain Settings — Pro only */}
                <ProFeatureGate featureName="Custom Domains">
                  <CustomDomainSettings organizationId={organization.id} />
                </ProFeatureGate>
              </div>
            </TabsContent>

            {/* Webhooks Tab — Pro only */}
            <TabsContent value="webhooks">
              <ProFeatureGate featureName="Webhooks">
                <WebhooksPage />
              </ProFeatureGate>
            </TabsContent>

            {/* API Keys Tab */}
            <TabsContent value="api-keys">
              <ProFeatureGate featureName="API Access">
                <ApiKeysPage />
              </ProFeatureGate>
            </TabsContent>

            {/* Widgets Tab */}
            <TabsContent value="widgets">
              <WidgetsPage />
            </TabsContent>

            {/* Job Roles Tab */}
            <TabsContent value="roles">
              <JobRolesTab />
            </TabsContent>

            {/* Integrations Tab */}
            <TabsContent value="integrations">
              <IntegrationsPage />
            </TabsContent>

            {/* Notifications Tab — Starter+ (plan feature `notifications`) */}
            <TabsContent value="notifications">
              <ProFeatureGate featureName="Notifications" feature="notifications">
                <NotificationsTab />
              </ProFeatureGate>
            </TabsContent>

            {/* Billing Tab */}
            <TabsContent value="billing">
              {billingLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                      <PlanCard
                        subscription={billingSubscription!}
                        onUpgrade={() => setShowUpgradeDialog(true)}
                        onDowngrade={() => setShowUpgradeDialog(true)}
                        onCancel={() => setShowCancelFlow(true)}
                        actionLoading={billingActionLoading}
                      />
                    </div>
                    {/* Invoice history is owner/admin only (backend 403s members) */}
                    {['owner', 'admin'].includes(organizationRole ?? '') && (
                      <div>
                        <InvoiceHistory invoices={billingInvoices} />
                      </div>
                    )}
                  </div>

                  <UpgradeDialog
                    open={showUpgradeDialog}
                    onOpenChange={setShowUpgradeDialog}
                    onSuccess={loadBillingData}
                  />

                  {billingSubscription && (
                    <CancelFlow
                      open={showCancelFlow}
                      onOpenChange={setShowCancelFlow}
                      subscription={billingSubscription}
                      onSuccess={loadBillingData}
                    />
                  )}

                  {/* Tracked Users — admin/owner only */}
                  {['owner', 'admin'].includes(organizationRole ?? '') && organization && (
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-sm font-semibold">Tracked Users</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              View and manage tracked users, usage stats, and historical data.
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setActiveTab('tracked-users')}
                          >
                            Manage Tracked Users →
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="tracked-users">
              <TrackedUsersPage />
            </TabsContent>

      </Tabs>

      {/* Invitation Modal */}
      {organization && (
        <InviteMemberModal
          open={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          organizationId={organization.id}
          organizationName={organization.name}
          onInviteSent={() => {
            setInvitationRefreshTrigger(prev => prev + 1);
            setShowInviteModal(false);
          }}
        />
      )}

      {/* Remove Member Confirmation Dialog */}
      <AlertDialog
        open={!!removeMemberTarget}
        onOpenChange={(open) => { if (!open) setRemoveMemberTarget(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove member?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove{' '}
              <strong>{removeMemberTarget?.name}</strong> from{' '}
              <strong>{organization?.name}</strong>? They will lose access to
              this organization immediately. Their account and any other
              organization memberships will remain untouched.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRemoveMember}
              disabled={removing}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
              id="confirm-remove-member"
            >
              {removing ? 'Removing…' : 'Remove member'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function OrganizationSettingsPage() {
  return (
    <Suspense fallback={<OrganizationSkeleton />}>
      <OrganizationSettingsInner />
    </Suspense>
  );
}
