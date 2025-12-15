'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { invitationService, Invitation } from '@/services/invitationService';
import { Mail, Send, Trash2, Clock, CheckCircle2, XCircle, RefreshCw, Loader2 } from 'lucide-react';

interface PendingInvitationsProps {
  organizationId: string;
  refreshTrigger?: number;
}

export function PendingInvitations({ organizationId, refreshTrigger }: PendingInvitationsProps) {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [revokeDialog, setRevokeDialog] = useState<{ open: boolean; invitation: Invitation | null }>({
    open: false,
    invitation: null,
  });
  const { toast } = useToast();

  const loadInvitations = async () => {
    try {
      setLoading(true);
      const data = await invitationService.listInvitations(organizationId);
      setInvitations(data);
    } catch (error) {
      console.error('Failed to load invitations:', error);
      toast({
        title: 'Failed to load invitations',
        description: 'Please try refreshing the page',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (organizationId) {
      loadInvitations();
    }
  }, [organizationId, refreshTrigger]);

  const handleResend = async (invitation: Invitation) => {
    setActionLoading(invitation.id);
    try {
      await invitationService.resendInvitation(organizationId, invitation.id);
      toast({
        title: 'Invitation resent! 📧',
        description: `We've sent a new invitation email to ${invitation.email}`,
      });
      await loadInvitations();
    } catch (error: any) {
      toast({
        title: 'Failed to resend invitation',
        description: error.response?.data?.error || 'Something went wrong',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleRevoke = async () => {
    if (!revokeDialog.invitation) return;

    setActionLoading(revokeDialog.invitation.id);
    try {
      await invitationService.revokeInvitation(organizationId, revokeDialog.invitation.id);
      toast({
        title: 'Invitation revoked',
        description: `The invitation to ${revokeDialog.invitation.email} has been cancelled`,
      });
      setRevokeDialog({ open: false, invitation: null });
      await loadInvitations();
    } catch (error: any) {
      toast({
        title: 'Failed to revoke invitation',
        description: error.response?.data?.error || 'Something went wrong',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: Invitation['status']) => {
    const config = {
      pending: { label: 'Pending', icon: Clock, variant: 'secondary' as const, color: 'text-yellow-600' },
      accepted: { label: 'Accepted', icon: CheckCircle2, variant: 'default' as const, color: 'text-green-600' },
      expired: { label: 'Expired', icon: XCircle, variant: 'destructive' as const, color: 'text-red-600' },
      revoked: { label: 'Revoked', icon: XCircle, variant: 'outline' as const, color: 'text-gray-600' },
    };

    const { label, icon: Icon, variant, color } = config[status] || config.pending;

    return (
      <Badge variant={variant} className="gap-1">
        <Icon className={`h-3 w-3 ${color}`} />
        {label}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return 'Expired';
    } else if (diffDays === 0) {
      return 'Expires today';
    } else if (diffDays === 1) {
      return 'Expires tomorrow';
    } else {
      return `Expires in ${diffDays} days`;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pending Invitations</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const pendingInvitations = invitations.filter((inv) => inv.status === 'pending');
  const otherInvitations = invitations.filter((inv) => inv.status !== 'pending');

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Pending Invitations</CardTitle>
              <CardDescription>
                {pendingInvitations.length === 0
                  ? 'No pending invitations'
                  : `${pendingInvitations.length} invitation(s) awaiting acceptance`}
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={loadInvitations}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {pendingInvitations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Mail className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p>No pending invitations</p>
              <p className="text-sm mt-1">Invite team members to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingInvitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-start gap-3 flex-1">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30">
                      <Mail className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white truncate">
                        {invitation.email}
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                        <span className="capitalize">{invitation.role}</span>
                        <span>•</span>
                        <span>{formatDate(invitation.expires_at)}</span>
                        {invitation.inviter && (
                          <>
                            <span>•</span>
                            <span>by {invitation.inviter.name}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(invitation.status)}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleResend(invitation)}
                      disabled={actionLoading === invitation.id}
                      title="Resend invitation"
                    >
                      {actionLoading === invitation.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setRevokeDialog({ open: true, invitation })}
                      disabled={actionLoading === invitation.id}
                      title="Revoke invitation"
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Show recent accepted/expired/revoked invitations */}
          {otherInvitations.length > 0 && (
            <div className="mt-6 pt-6 border-t">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Recent Activity</h4>
              <div className="space-y-2">
                {otherInvitations.slice(0, 5).map((invitation) => (
                  <div
                    key={invitation.id}
                    className="flex items-center justify-between p-3 text-sm bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="truncate text-gray-700 dark:text-gray-300">{invitation.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">
                        {invitation.accepted_at
                          ? new Date(invitation.accepted_at).toLocaleDateString()
                          : new Date(invitation.created_at).toLocaleDateString()}
                      </span>
                      {getStatusBadge(invitation.status)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Revoke Confirmation Dialog */}
      <AlertDialog open={revokeDialog.open} onOpenChange={(open) => !open && setRevokeDialog({ open: false, invitation: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke Invitation?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to revoke the invitation to <strong>{revokeDialog.invitation?.email}</strong>?
              They will no longer be able to use this invitation link to join your organization.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRevoke} className="bg-red-600 hover:bg-red-700">
              {actionLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Revoking...
                </>
              ) : (
                'Revoke Invitation'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
