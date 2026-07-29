'use client';

import { useState } from 'react';
import { useOrganization } from '@/context/OrganizationContext';
import { useJobRoles } from '@/hooks/useJobRoles';
import jobRolesService, { JobRole } from '@/services/jobRolesService';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Pencil, Trash2, ShieldAlert, BriefcaseBusiness, AlertCircle } from 'lucide-react';
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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-gray-900/50 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="flex items-center gap-5 relative z-10">
          <div className="p-3.5 bg-primary/10 text-primary rounded-xl ring-1 ring-primary/20 shadow-inner">
            <BriefcaseBusiness className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Job Roles</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5 max-w-md">
              Define and manage custom job roles to organize your team members efficiently.
            </p>
          </div>
        </div>
        <Button onClick={handleOpenCreate} disabled={!isAdmin} className="shadow-sm relative z-10 shrink-0">
          <Plus className="h-4 w-4 mr-2" />
          Add New Role
        </Button>
      </div>

      {!isAdmin && (
        <div className="bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-300 p-4 rounded-xl flex items-center gap-3 shadow-sm backdrop-blur-sm">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="text-sm font-medium">Only organization admins and owners can manage job roles.</p>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center p-16 space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary/60" />
          <p className="text-sm text-muted-foreground animate-pulse">Loading roles...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {roles.map((role) => (
            <Card 
              key={role.key} 
              className="overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 hover:border-primary/30 group relative bg-white dark:bg-gray-900/80"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              <CardContent className="p-4 relative z-10 flex flex-col h-full">
                <div className="flex flex-col mb-3 flex-1">
                  <h3 className="font-semibold text-base text-gray-900 dark:text-gray-100 group-hover:text-primary transition-colors line-clamp-1">{role.name}</h3>
                  <div className="inline-flex items-center self-start px-1.5 py-0.5 mt-1.5 rounded text-[10px] font-mono bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                    {role.key}
                  </div>
                </div>
                
                {isAdmin && (
                  <div className="flex gap-2 mt-auto pt-3 border-t border-gray-100 dark:border-gray-800">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="flex-1 h-7 text-xs shadow-sm transition-all hover:bg-primary hover:text-primary-foreground font-medium"
                      onClick={() => handleOpenEdit(role)}
                    >
                      <Pencil className="h-3 w-3 mr-1.5" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 h-7 text-xs shadow-sm transition-all text-red-600 hover:text-red-700 hover:bg-red-50 border-red-100 hover:border-red-200 dark:hover:bg-red-950/30 dark:border-red-900/30 dark:hover:border-red-900/50 font-medium"
                      disabled={!role.is_deletable}
                      onClick={() => handleDelete(role)}
                      title={!role.is_deletable ? 'This default role cannot be deleted' : ''}
                    >
                      <Trash2 className="h-3 w-3 mr-1.5" />
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

          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Role Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Senior Developer"
                className="h-11 transition-all focus-visible:ring-primary/50"
              />
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
    </div>
  );
}
