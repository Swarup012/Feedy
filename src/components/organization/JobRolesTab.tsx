'use client';

import { useState } from 'react';
import { useOrganization } from '@/context/OrganizationContext';
import { useJobRoles } from '@/hooks/useJobRoles';
import jobRolesService, { JobRole } from '@/services/jobRolesService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { IconDisplay, IconPicker } from '@/components/ui/icon-picker';
import { Loader2, Plus, Pencil, Trash2, ShieldAlert } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export function JobRolesTab() {
  const { organization, organizationRole } = useOrganization();
  const { roles, loading, refresh } = useJobRoles(organization?.id);
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<JobRole | null>(null);
  const [formData, setFormData] = useState({ name: '', icon: 'UserCircle' });
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isAdmin = organizationRole === 'admin' || organizationRole === 'owner';

  const handleOpenCreate = () => {
    setEditingRole(null);
    setFormData({ name: '', icon: 'UserCircle' });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (role: JobRole) => {
    setEditingRole(role);
    setFormData({ name: role.name, icon: role.icon });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({ title: 'Error', description: 'Role name is required', variant: 'destructive' });
      return;
    }
    if (!organization?.id) return;

    try {
      setSubmitting(true);
      if (editingRole) {
        await jobRolesService.updateRole(organization.id, editingRole.id, formData);
        toast({ title: 'Success', description: 'Job role updated successfully.' });
      } else {
        await jobRolesService.createRole(organization.id, formData);
        toast({ title: 'Success', description: 'Job role created successfully.' });
      }
      setIsDialogOpen(false);
      refresh();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err?.response?.data?.error || 'Failed to save job role.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (role: JobRole) => {
    if (!organization?.id) return;
    if (!confirm(`Are you sure you want to delete the role "${role.name}"? Users with this role will be re-assigned.`)) return;

    try {
      await jobRolesService.deleteRole(organization.id, role.id);
      toast({ title: 'Success', description: 'Job role deleted successfully.' });
      refresh();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err?.response?.data?.error || 'Failed to delete job role.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Job Roles</h2>
          <p className="text-muted-foreground">
            Manage custom job roles for your organization's members.
          </p>
        </div>
        <Button onClick={handleOpenCreate} disabled={!isAdmin}>
          <Plus className="h-4 w-4 mr-2" />
          Add Role
        </Button>
      </div>

      {!isAdmin && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-lg flex items-center gap-3">
          <ShieldAlert className="h-5 w-5" />
          <p className="text-sm">Only organization admins and owners can manage job roles.</p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {roles.map((role) => (
            <Card key={role.key} className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                      <IconDisplay iconName={role.icon} className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{role.name}</h3>
                      <p className="text-sm text-gray-500 font-mono mt-1">{role.key}</p>
                    </div>
                  </div>
                </div>
                {isAdmin && (
                  <div className="flex gap-2 mt-6 pt-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleOpenEdit(role)}
                    >
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                      disabled={!role.is_deletable}
                      onClick={() => handleDelete(role)}
                      title={!role.is_deletable ? 'This default role cannot be deleted' : ''}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingRole ? 'Edit Job Role' : 'Create Job Role'}</DialogTitle>
            <DialogDescription>
              {editingRole
                ? 'Update the name or icon for this job role.'
                : 'Add a new custom job role for your team.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Role Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Senior Developer"
              />
            </div>

            <div className="space-y-2">
              <Label>Icon</Label>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowIconPicker(true)}
                className="w-full justify-start h-12"
              >
                <div className="h-8 w-8 rounded-lg flex items-center justify-center mr-3 bg-gray-100">
                  <IconDisplay iconName={formData.icon} className="h-5 w-5 text-gray-700" />
                </div>
                <span>{formData.icon}</span>
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={submitting || !formData.name.trim()}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Icon Picker */}
      <IconPicker
        open={showIconPicker}
        onOpenChange={setShowIconPicker}
        onSelectIcon={(iconName) => setFormData({ ...formData, icon: iconName })}
      />
    </div>
  );
}
