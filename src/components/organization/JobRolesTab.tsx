'use client';

import { useState } from 'react';
import { useOrganization } from '@/context/OrganizationContext';
import { useJobRoles } from '@/hooks/useJobRoles';
import jobRolesService, { JobRole } from '@/services/jobRolesService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Settings, X, BriefcaseBusiness, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { IconDisplay } from '@/components/ui/icon-picker';

export function JobRolesTab() {
  const { organization, organizationRole } = useOrganization();
  const { roles, loading, refresh } = useJobRoles(organization?.id);
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<JobRole | null>(null);
  const [formData, setFormData] = useState({ name: '', icon: 'UserCircle' });
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<JobRole | null>(null);
  const [deleting, setDeleting] = useState(false);

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

  const confirmDelete = async () => {
    if (!organization?.id || !deleteTarget) return;

    try {
      setDeleting(true);
      await jobRolesService.deleteRole(organization.id, deleteTarget.id);
      toast({ title: 'Success', description: 'Job role deleted successfully.' });
      setDeleteTarget(null);
      refresh();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err?.response?.data?.error || 'Failed to delete job role.',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
              Job Roles
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-lg">
              Create and manage job roles for your organization.
            </p>
          </div>
        </div>
        {isAdmin && (
          <Button
            onClick={handleOpenCreate}
            className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Role
          </Button>
        )}
      </div>

      {!isAdmin && (
        <div className="flex items-center gap-3 rounded-lg border border-amber-200/80 bg-amber-50 px-4 py-3 text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/25 dark:text-amber-200">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <p className="text-sm">Only organization admins and owners can manage job roles.</p>
        </div>
      )}

      {/* Roles as tags — no card wrapper */}
      {loading ? (
        <div className="flex items-center gap-2 py-6 text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">Loading roles…</span>
        </div>
      ) : roles.length === 0 ? (
        <div className="py-6">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">No job roles yet</p>
          <p className="text-xs text-slate-400 mt-1">Create a role to start organizing your team.</p>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2.5">
          {roles.map((role) => (
            <div
              key={role.key}
              className="group inline-flex max-w-full items-center gap-1 rounded-md border border-slate-200 bg-slate-50/80 pl-2.5 pr-1 py-1 text-sm transition-all duration-150 hover:border-slate-300 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/60 dark:hover:border-slate-600 dark:hover:bg-slate-800"
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-slate-500 dark:text-slate-400">
                <IconDisplay iconName={role.icon || 'UserCircle'} className="h-3.5 w-3.5" />
              </span>

              <span
                className="truncate px-0.5 font-medium text-slate-700 dark:text-slate-200"
                title={role.name}
              >
                {role.name}
              </span>

              {isAdmin && (
                <span className="ml-0.5 flex items-center gap-0.5 border-l border-slate-200 pl-1 dark:border-slate-600">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(role)}
                    aria-label={`Edit ${role.name}`}
                    title="Edit role"
                    className="inline-flex h-6 w-6 items-center justify-center rounded text-slate-400 transition-colors hover:bg-slate-200/80 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/50 dark:hover:bg-slate-700 dark:hover:text-slate-100"
                  >
                    <Settings className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(role)}
                    disabled={!role.is_deletable}
                    aria-label={`Delete ${role.name}`}
                    title={
                      !role.is_deletable
                        ? 'This default role cannot be deleted'
                        : 'Delete role'
                    }
                    className="inline-flex h-6 w-6 items-center justify-center rounded text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/40 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                  >
                    <X className="h-3.5 w-3.5" strokeWidth={2.25} />
                  </button>
                </span>
              )}
            </div>
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
                className="h-11"
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

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete job role?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{' '}
              <strong>{deleteTarget?.name}</strong>? Users with this role may be
              reassigned. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {deleting ? 'Deleting…' : 'Delete role'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
