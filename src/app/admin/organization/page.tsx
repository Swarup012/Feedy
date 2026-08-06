'use client';

import { useState, useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useOrganization } from '@/context/OrganizationContext';
import { resolvePlan } from '@/config/plans';
import { useAuth } from '@/hooks/useAuth';
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
  Building2,
  Users,
  Settings,
  Crown,
  Shield,
  UserPlus,
  Trash2,
  ExternalLink,
  Copy,
  Check,
  Mail,
  Webhook,
  CreditCard,
  Globe,
  Code,
  Briefcase,
  Plug,
  User,
  Bell,
} from 'lucide-react';
import { OrganizationSkeleton, MembersTableSkeleton } from '@/components/admin/OrganizationSkeleton';
import { InviteMemberModal } from '@/components/organization/InviteMemberModal';
import { PendingInvitations } from '@/components/organization/PendingInvitations';
import { JobRolesTab } from '@/components/organization/JobRolesTab';
import dynamic from 'next/dynamic';
const WebhooksPage = dynamic(() => import('@/app/admin/webhooks/page'), { ssr: false });
const WidgetsPage = dynamic(() => import('@/app/admin/widgets/page'), { ssr: false });
const IntegrationsPage = dynamic(() => import('@/app/admin/settings/integrations/page'), { ssr: false });
import { ProfileTab } from '@/components/organization/ProfileTab';
import { BillingSection } from '@/components/BillingSection';
import PricingContent from '@/components/PricingContent';
import { CustomDomainSettings } from '@/components/organization/CustomDomainSettings';
import { NotificationsTab } from '@/components/organization/NotificationsTab';
import { PaidFeatureGate } from '@/components/PaidFeatureGate';
import { ProFeatureGate } from '@/components/ProFeatureGate';
import { motion } from 'motion/react';

interface SidebarNavItemProps {
  isActive: boolean;
  onClick: () => void;
  children: ReactNode;
}

function SidebarNavItem({ isActive, onClick, children }: SidebarNavItemProps) {
  return (
    <motion.button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-left text-sm relative ${
        isActive
          ? 'text-foreground font-medium'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
      }`}
      whileHover={{ x: 2 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      {isActive && (
        <motion.div
          layoutId="sidebar-active"
          className="absolute inset-0 bg-muted rounded-md"
          transition={{ type: 'spring', stiffness: 350, damping: 30 }}
        />
      )}
      <span className="relative z-10 flex items-center gap-3">
        {children}
      </span>
    </motion.button>
  );
}

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

export default function OrganizationSettingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { organization, organizations, organizationRole, loading, refreshOrganization } = useOrganization();
  const { isAuthenticated } = useAuth();

  const [saving, setSaving] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [inviting, setInviting] = useState(false);
  const [copiedSubdomain, setCopiedSubdomain] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  // Invitation modal state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [invitationRefreshTrigger, setInvitationRefreshTrigger] = useState(0);

  // Remove member confirmation dialog state
  const [removeMemberTarget, setRemoveMemberTarget] = useState<{ id: string; name: string } | null>(null);
  const [removing, setRemoving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    website: '',
    industry: '',
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (tab) {
        setActiveTab(tab);
      }
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    // Only redirect if loading is complete and we have no organizations at all
    if (!loading && !organization && organizations.length === 0) {
      toast({
        title: 'No organization',
        description: 'You need to create an organization first.',
        variant: 'destructive',
      });
      router.push('/create-organization');
    }
  }, [isAuthenticated, loading, organization, organizations, router, toast]);

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
      const response = await fetch(`/api/organizations/${organization.id}/members/${memberId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Member role updated successfully.',
        });
        await fetchMembers(); // Refresh the members list
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to update member role.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred.',
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
    const url = `https://${organization.subdomain}.fady.com`;
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

  return (
    <div className="flex min-h-[calc(100vh-70px)]">
      {/* Animated Sidebar */}
      <div className="w-52 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 flex flex-col sticky top-0 h-[calc(100vh-70px)] overflow-y-auto shrink-0">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Building2 className="h-6 w-6 text-primary" />
            <h1 className="text-base font-bold truncate">{organization.name}</h1>
          </div>
          <Badge variant="outline" className="text-xs">
            {resolvePlan(organization).toUpperCase()}
          </Badge>
        </div>

        <nav className="space-y-1 flex-1">
          {[
            { tab: 'profile', icon: User, label: 'Profile' },
            { tab: 'general', icon: Settings, label: 'General' },
            { tab: 'members', icon: Users, label: `Members (${members.length})` },
            { tab: 'roles', icon: Briefcase, label: 'Job Roles' },
            { tab: 'subdomain', icon: ExternalLink, label: 'Subdomain' },
            { tab: 'webhooks', icon: Webhook, label: 'Webhooks' },
            { tab: 'widgets', icon: Code, label: 'Widgets' },
            { tab: 'integrations', icon: Plug, label: 'Integrations' },
            { tab: 'notifications', icon: Bell, label: 'Notifications' },
            { tab: 'billing', icon: CreditCard, label: 'Billing' },
          ].map(({ tab, icon: Icon, label }) => (
            <SidebarNavItem
              key={tab}
              isActive={activeTab === tab}
              onClick={() => setActiveTab(tab)}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </SidebarNavItem>
          ))}
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto py-5 px-5">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            {/* Hidden tab triggers for functionality */}
            <div className="hidden">
              <TabsList>
                <TabsTrigger value="profile" id="tab-profile">Profile</TabsTrigger>
                <TabsTrigger value="general" id="tab-general">General</TabsTrigger>
                <TabsTrigger value="members" id="tab-members">Members</TabsTrigger>
                <TabsTrigger value="roles" id="tab-roles">Job Roles</TabsTrigger>
                <TabsTrigger value="subdomain" id="tab-subdomain">Subdomain</TabsTrigger>
                <TabsTrigger value="webhooks" id="tab-webhooks">Webhooks</TabsTrigger>
                <TabsTrigger value="widgets" id="tab-widgets">Widgets</TabsTrigger>
                <TabsTrigger value="integrations" id="tab-integrations">Integrations</TabsTrigger>
                <TabsTrigger value="notifications" id="tab-notifications">Notifications</TabsTrigger>
                <TabsTrigger value="billing" id="tab-billing">Billing</TabsTrigger>
              </TabsList>
            </div>

            {/* Profile Tab */}
            <TabsContent value="profile">
              <ProfileTab />
            </TabsContent>

            {/* General Settings */}
            <TabsContent value="general">
              <Card>
                <CardHeader>
                  <CardTitle>Organization Details</CardTitle>
                  <CardDescription>
                    Update your organization's basic information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="name">Organization Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      disabled={organizationRole !== 'owner'}
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      disabled={organizationRole !== 'owner'}
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      type="url"
                      placeholder="https://example.com"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      disabled={organizationRole !== 'owner'}
                    />
                  </div>

                  <div>
                    <Label htmlFor="industry">Industry</Label>
                    <Input
                      id="industry"
                      placeholder="e.g., SaaS, E-commerce"
                      value={formData.industry}
                      onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                      disabled={organizationRole !== 'owner'}
                    />
                  </div>

                  {organizationRole === 'owner' && (
                    <Button onClick={handleUpdateOrganization} disabled={saving}>
                      {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Members Tab */}
            <TabsContent value="members">
              <div className="space-y-6">
                {/* Invite Member - New System */}
                {organizationRole === 'owner' && (
                  <>
                    <Card>
                      <CardHeader>
                        <CardTitle>Invite Team Members</CardTitle>
                        <CardDescription>
                          Send email invitations to add new members to your organization
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button onClick={() => setShowInviteModal(true)}>
                          <Mail className="h-4 w-4 mr-2" />
                          Invite Member
                        </Button>
                      </CardContent>
                    </Card>

                    {/* Pending Invitations */}
                    <PendingInvitations
                      organizationId={organization.id}
                      refreshTrigger={invitationRefreshTrigger}
                    />
                  </>
                )}

                {/* Members List */}
                <Card>
                  <CardHeader>
                    <CardTitle>Team Members</CardTitle>
                    <CardDescription>
                      {members.length} / {organization.max_users} members
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loadingMembers ? (
                      <MembersTableSkeleton />
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Joined</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {members.map((member) => (
                            <TableRow key={member.id}>
                              <TableCell className="font-medium">{member.name}</TableCell>
                              <TableCell>{member.email}</TableCell>
                              <TableCell>
                                {organizationRole === 'owner' && member.organization_role !== 'owner' ? (
                                  <select
                                    className="px-3 py-1 border rounded-md text-sm"
                                    value={member.organization_role}
                                    onChange={(e) => handleUpdateMemberRole(member.id, e.target.value)}
                                  >
                                    <option value="member">Member</option>
                                    <option value="admin">Admin</option>
                                    <option value="owner">Owner</option>
                                  </select>
                                ) : (
                                  <Badge variant={getRoleBadgeVariant(member.organization_role)}>
                                    <span className="mr-1">{getRoleIcon(member.organization_role)}</span>
                                    {member.organization_role}
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                {new Date(member.created_at).toLocaleDateString()}
                              </TableCell>
                              <TableCell className="text-right">
                                {/* Show Remove button for owner/admin, but never for the org owner themselves */}
                                {(['owner', 'admin'] as string[]).includes(organizationRole ?? '') &&
                                  member.organization_role !== 'owner' && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleRemoveMember(member.id, member.name)}
                                      id={`remove-member-${member.id}`}
                                    >
                                      <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                  )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Subdomain Tab */}
            <TabsContent value="subdomain">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Organization Subdomain</CardTitle>
                    <CardDescription>
                      Your unique subdomain for accessing your organization
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Current Subdomain</Label>
                      <div className="flex items-center gap-2 mt-2">
                        <code className="px-4 py-2 bg-muted rounded-md flex-1">
                          {organization.subdomain}.fady.com
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
                          value={`https://${organization.subdomain}.fady.com`}
                          readOnly
                          className="flex-1"
                        />
                        <Button variant="outline" asChild>
                          <a href={`https://${organization.subdomain}.fady.com`} target="_blank" rel="noopener noreferrer">
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

            {/* Webhooks Tab */}
            <TabsContent value="webhooks">
              <PaidFeatureGate featureName="Webhooks">
                <WebhooksPage />
              </PaidFeatureGate>
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

            {/* Notifications Tab */}
            <TabsContent value="notifications">
              <ProFeatureGate featureName="Notifications">
                <NotificationsTab />
              </ProFeatureGate>
            </TabsContent>

            {/* Billing Tab */}
            <TabsContent value="billing">
              <div className="space-y-5">
                {/* Current subscription status + cancel */}
                <BillingSection />
                {/* Full pricing cards to upgrade/downgrade */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-6">Plans & Pricing</h3>
                  <PricingContent />
                </div>
              </div>
            </TabsContent>

          </Tabs>
        </div>
      </div>

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
