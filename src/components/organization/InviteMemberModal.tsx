'use client';

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { invitationService } from '@/services/invitationService';
import { Mail, Check, Loader2, X } from 'lucide-react';
import { UpgradeDialog } from '@/components/UpgradeDialog';
import { useJobRoles } from '@/hooks/useJobRoles';
import '../ui/dialog-forms.css';

interface InviteMemberModalProps {
  open: boolean;
  onClose: () => void;
  organizationId: string;
  organizationName: string;
  onInviteSent?: () => void;
}

const ORGANIZATION_ROLES = [
  { value: 'member' as const, name: 'Member', note: 'Can view and comment on feedback' },
  { value: 'admin' as const, name: 'Admin', note: 'Can manage feedback and settings' },
];

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
        title: 'Invitation sent',
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
      <DialogContent className="fd wg z-[400] w-[min(94vw,580px)] max-w-none gap-0 border-0 bg-transparent p-0 shadow-none [&>button]:hidden">
        <form onSubmit={handleSubmit} className="fd__shell">
          <header className="fd__head">
            <div className="fd__headtext">
              <DialogTitle className="fd__title">Invite a member</DialogTitle>
            </div>
            <DialogClose type="button" className="fd__close" aria-label="Close">
              <X className="h-4 w-4" aria-hidden="true" />
            </DialogClose>
          </header>

          <div className="fd__body">
            <section className="fd-section">
              <div className="fd-field">
                <label className="fd-label" htmlFor="email">Email address</label>
                <div className="inv-email">
                  <Mail aria-hidden="true" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    className="fd-input"
                    placeholder="colleague@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>
                <p className="fd-help-single">
                  They need to sign in with this exact address to accept.
                </p>
              </div>
            </section>

            <section className="fd-section">
              <div className="fd-field">
                <span className="fd-label" id="role-label">Role</span>
                <div className="inv-roles" role="group" aria-labelledby="role-label" id="role">
                  {ORGANIZATION_ROLES.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className="inv-role"
                      aria-pressed={role === option.value}
                      onClick={() => setRole(option.value)}
                      disabled={loading}
                    >
                      <span className="inv-role__top">
                        <span className="inv-role__name">{option.name}</span>
                        {role === option.value && (
                          <Check className="inv-role__check" aria-hidden="true" />
                        )}
                      </span>
                      <span className="inv-role__note">{option.note}</span>
                    </button>
                  ))}
                </div>
                <p className="fd-help-single">
                  You can change their role later from the members page.
                </p>
              </div>

              <div className="fd-field">
                <div className="fd-field__top">
                  <label className="fd-label" htmlFor="jobRole">Job role</label>
                  <span className="fd-opt">Optional</span>
                </div>
                <div className="fd-select">
                  <select
                    id="jobRole"
                    name="jobRole"
                    value={jobRole}
                    onChange={(e) => setJobRole(e.target.value)}
                    disabled={loading || rolesLoading}
                  >
                    {jobRoles.map((roleOpt) => (
                      <option key={roleOpt.key} value={roleOpt.key}>
                        {roleOpt.name}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="fd-help-single">
                  Assign a professional job role to this member.
                </p>
              </div>
            </section>
          </div>

          <footer className="fd__foot">
            <button
              type="button"
              className="fd-btn fd-btn--quiet"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="fd-btn fd-btn--primary fd-btn--commit"
              disabled={loading}
              aria-busy={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Sending…
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4" aria-hidden="true" />
                  Send invitation
                </>
              )}
            </button>
          </footer>
        </form>
      </DialogContent>
    </Dialog>

    {/* Upgrade Dialog */}
    <UpgradeDialog
      open={showUpgradeDialog}
      onOpenChange={setShowUpgradeDialog}
      featureName="unlimited team members"
      feature="team_members"
    />
  </>
  );
}
