'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useOrganization } from '@/context/OrganizationContext';
import { useAuth } from '@/hooks/useAuth';
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
} from 'lucide-react';
import { OrganizationSkeleton, MembersTableSkeleton } from '@/components/admin/OrganizationSkeleton';

interface Member {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  organization_role: string;
  created_at: string;
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

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    website: '',
    industry: '',
  });

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
      const response = await fetch(`/api/organizations/${organization.id}/members`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMembers(data.data.members);
      }
    } catch (error) {
      console.error('Failed to fetch members:', error);
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
      const response = await fetch(`/api/organizations/${organization.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Organization settings updated successfully.',
        });
        await refreshOrganization();
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to update organization settings.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred.',
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
      const response = await fetch(`/api/organizations/${organization.id}/members`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: inviteEmail,
          role: inviteRole,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Invitation sent',
          description: `Invitation sent to ${inviteEmail}`,
        });
        setInviteEmail('');
        setInviteRole('member');
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to send invitation.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred.',
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

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!organization) return;
    if (organizationRole !== 'owner' && organizationRole !== 'admin') {
      toast({
        title: 'Unauthorized',
        description: 'Only owners and admins can remove members.',
        variant: 'destructive',
      });
      return;
    }

    if (!confirm(`Are you sure you want to remove ${memberName} from the organization?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/organizations/${organization.id}/members/${memberId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Success',
          description: `${memberName} has been removed from the organization.`,
        });
        await fetchMembers(); // Refresh the members list
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to remove member.',
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
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Building2 className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">{organization.name}</h1>
          <Badge variant="outline" className="ml-2">
            {organization.plan.toUpperCase()}
          </Badge>
        </div>
        <p className="text-muted-foreground">
          Manage your organization settings, members, and subscription
        </p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general">
            <Settings className="h-4 w-4 mr-2" />
            General
          </TabsTrigger>
          <TabsTrigger value="members">
            <Users className="h-4 w-4 mr-2" />
            Members ({members.length})
          </TabsTrigger>
          <TabsTrigger value="subdomain">
            <ExternalLink className="h-4 w-4 mr-2" />
            Subdomain
          </TabsTrigger>
        </TabsList>

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
            {/* Invite Member */}
            {(organizationRole === 'owner' || organizationRole === 'admin') && (
              <Card>
                <CardHeader>
                  <CardTitle>Invite Team Member</CardTitle>
                  <CardDescription>
                    Add new members to your organization
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <Input
                        type="email"
                        placeholder="email@example.com"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                      />
                    </div>
                    <select
                      className="px-3 py-2 border rounded-md"
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value)}
                    >
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                      {organizationRole === 'owner' && <option value="owner">Owner</option>}
                    </select>
                    <Button onClick={handleInviteUser} disabled={inviting || !inviteEmail}>
                      <UserPlus className="h-4 w-4 mr-2" />
                      {inviting ? 'Sending...' : 'Invite'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
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
                            {organizationRole === 'owner' && member.organization_role !== 'owner' && (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleRemoveMember(member.id, member.name)}
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
