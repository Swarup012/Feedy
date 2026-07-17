'use client';

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { invitationService } from '@/services/invitationService';
import { Mail, UserPlus, Loader2 } from 'lucide-react';
import { UpgradeDialog } from '@/components/UpgradeDialog';
import { useJobRoles } from '@/hooks/useJobRoles';
import { IconDisplay } from '@/components/ui/icon-picker';

interface InviteMemberModalProps {
  open: boolean;
  onClose: () => void;
  organizationId: string;
  organizationName: string;
  onInviteSent?: () => void;
}

export function InviteMemberModal({
  open,
  onClose,
  organizationId,
  organizationName,
  onInviteSent,
}: InviteMemberModalProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'member' | 'admin'>('member');
  const [jobRole, setJobRole] = useState('other');
  const { roles: jobRoles, loading: rolesLoading } = useJobRoles(organizationId);
  const [loading, setLoading] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast({
        title: 'Email required',
        description: 'Please enter an email address',
        variant: 'destructive',
      });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: 'Invalid email',
        description: 'Please enter a valid email address',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      await invitationService.createInvitation(organizationId, email, role, jobRole);

      toast({
        title: 'Invitation sent! 📧',
        description: `We've sent an invitation to ${email}. They'll receive an email with instructions to join.`,
      });

      // Reset form and close modal
      setEmail('');
      setRole('member');
      setJobRole('other');
      onClose();

      // Refresh invitations list
      if (onInviteSent) {
        onInviteSent();
      }
    } catch (error: any) {
      console.error('Failed to send invitation:', error);
      
      // Check if it's a team member limit error
      if (error.response?.data?.error === 'TEAM_MEMBER_LIMIT_REACHED' || 
          error.response?.data?.error === 'INVITATION_LIMIT_REACHED') {
        onClose(); // Close invite modal first
        setShowUpgradeDialog(true); // Show upgrade dialog
        return;
      }
      
      toast({
        title: 'Failed to send invitation',
        description: error.response?.data?.message || 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-blue-600" />
            Invite Member to {organizationName}
          </DialogTitle>
          <DialogDescription>
            Send an email invitation to add a new member to your organization. The invitation will expire in 7 days.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            {/* Email Input */}
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="colleague@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  disabled={loading}
                  required
                />
              </div>
              <p className="text-xs text-gray-500">
                They must log in with this exact email address to accept the invitation.
              </p>
            </div>

            {/* Role Selection */}
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={role} onValueChange={(value: 'member' | 'admin') => setRole(value)} disabled={loading}>
                <SelectTrigger id="role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">
                    <div className="flex flex-col items-start">
                      <span className="font-medium">Member</span>
                      <span className="text-xs text-gray-500">Can view and comment on feedback</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="admin">
                    <div className="flex flex-col items-start">
                      <span className="font-medium">Admin</span>
                      <span className="text-xs text-gray-500">Can manage feedback and settings</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                You can change their role later from the members page.
              </p>
            </div>

            {/* Job Role Selection */}
            <div className="space-y-2">
              <Label htmlFor="jobRole">Job Role (Optional)</Label>
              <Select value={jobRole} onValueChange={setJobRole} disabled={loading || rolesLoading}>
                <SelectTrigger id="jobRole">
                  <SelectValue placeholder="Select a job role" />
                </SelectTrigger>
                <SelectContent>
                  {jobRoles.map((roleOpt) => (
                    <SelectItem key={roleOpt.key} value={roleOpt.key}>
                      <div className="flex items-center gap-2">
                        <IconDisplay iconName={roleOpt.icon} className="h-4 w-4 text-gray-500" />
                        <span>{roleOpt.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                Assign a professional job role to this member.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Send Invitation
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    {/* Upgrade Dialog */}
    <UpgradeDialog
      open={showUpgradeDialog}
      onOpenChange={setShowUpgradeDialog}
      title="Upgrade to Add More Team Members"
      description="You've reached the team member limit for the Free plan (3 members). Upgrade to Starter for 5 team members."
      feature="team_members"
    />
  </>
  );
}
