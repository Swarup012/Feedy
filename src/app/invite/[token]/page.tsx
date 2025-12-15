'use client';

import { use, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { invitationService, InvitationDetails } from '@/services/invitationService';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { 
  Mail, 
  Building2, 
  UserCheck, 
  Loader2, 
  CheckCircle2, 
  XCircle,
  AlertCircle,
  ArrowRight
} from 'lucide-react';

export default function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  // Unwrap params Promise in Next.js 15
  const { token } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    verifyInvitation();
  }, [token]);

  const verifyInvitation = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await invitationService.verifyToken(token);
      
      if (result.valid && result.invitation) {
        setInvitation(result.invitation);
      } else {
        setError(result.error || 'Invalid invitation');
      }
    } catch (err) {
      setError('Failed to verify invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvitation = async () => {
    if (!user) {
      // Store token and redirect to login
      localStorage.setItem('pendingInviteToken', token);
      toast({
        title: 'Please log in first',
        description: 'You need to log in to accept this invitation',
      });
      router.push(`/login?redirect=/invite/${token}`);
      return;
    }

    if (!invitation) return;

    // Check if email matches
    if (user.email?.toLowerCase() !== invitation.email.toLowerCase()) {
      toast({
        title: 'Email mismatch',
        description: `This invitation was sent to ${invitation.email}. Please log in with that email address.`,
        variant: 'destructive',
      });
      return;
    }

    setAccepting(true);

    try {
      const result = await invitationService.acceptInvitation(token);
      
      // Clear the pending invite token from localStorage
      localStorage.removeItem('pendingInviteToken');
      
      toast({
        title: 'Welcome aboard! 🎉',
        description: `You've joined ${invitation.organization.name} successfully`,
      });

      // Role-based redirection
      const redirectPath = invitation.role === 'member' ? '/dashboard' : '/admin';
      setTimeout(() => {
        window.location.href = `http://${invitation.organization.slug}.localhost:5173${redirectPath}`;
      }, 1500);
    } catch (error: any) {
      console.error('Failed to accept invitation:', error);
      toast({
        title: 'Failed to accept invitation',
        description: error.response?.data?.error || 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setAccepting(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Verifying invitation...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error || !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
        <Card className="w-full max-w-md border-red-200">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
                <XCircle className="h-12 w-12 text-red-600" />
              </div>
            </div>
            <CardTitle className="text-2xl">Invalid Invitation</CardTitle>
            <CardDescription className="mt-2">
              {error || 'This invitation link is invalid or has expired'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-sm text-red-800 dark:text-red-200">
                <strong>Common reasons:</strong>
              </p>
              <ul className="text-sm text-red-700 dark:text-red-300 mt-2 space-y-1 list-disc list-inside">
                <li>The invitation has expired (7 days limit)</li>
                <li>The invitation has been revoked</li>
                <li>The invitation has already been accepted</li>
                <li>The link is invalid or incomplete</li>
              </ul>
            </div>
            <Button 
              onClick={() => router.push('/')}
              className="w-full"
              variant="outline"
            >
              Go to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Valid invitation - show accept UI
  const emailMatches = user && user.email?.toLowerCase() === invitation.email.toLowerCase();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-full">
              <Mail className="h-16 w-16 text-blue-600" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold">You're Invited! 🎉</CardTitle>
          <CardDescription className="mt-2 text-base">
            {invitation.inviter.name} has invited you to join their team
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Organization Info */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
                <Building2 className="h-8 w-8 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {invitation.organization.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Role: <span className="font-medium capitalize text-gray-900 dark:text-white">{invitation.role}</span>
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Invited to: <span className="font-medium text-gray-900 dark:text-white">{invitation.email}</span>
                </p>
              </div>
            </div>
          </div>

          {/* User Status */}
          {!user ? (
            // Not logged in
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                    Please log in to continue
                  </p>
                  <p className="text-sm text-yellow-800 dark:text-yellow-200 mt-1">
                    You need to log in with <strong>{invitation.email}</strong> to accept this invitation
                  </p>
                </div>
              </div>
            </div>
          ) : !emailMatches ? (
            // Wrong email
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-900 dark:text-red-100">
                    Email mismatch
                  </p>
                  <p className="text-sm text-red-800 dark:text-red-200 mt-1">
                    This invitation was sent to <strong>{invitation.email}</strong>, but you're logged in as <strong>{user.email}</strong>.
                  </p>
                  <p className="text-sm text-red-800 dark:text-red-200 mt-2">
                    Please log out and sign in with the invited email address.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            // Correct email - ready to accept
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-900 dark:text-green-100">
                    Ready to join!
                  </p>
                  <p className="text-sm text-green-800 dark:text-green-200 mt-1">
                    Click the button below to accept the invitation and get started
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-3">
            {!user ? (
              <Button 
                onClick={() => handleAcceptInvitation()}
                size="lg"
                className="w-full"
              >
                Log In to Accept
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : !emailMatches ? (
              <Button
                onClick={() => {
                  localStorage.removeItem('token');
                  router.push(`/login?redirect=/invite/${params.token}`);
                }}
                size="lg"
                className="w-full"
                variant="outline"
              >
                Log Out & Switch Account
              </Button>
            ) : (
              <Button
                onClick={handleAcceptInvitation}
                disabled={accepting}
                size="lg"
                className="w-full"
              >
                {accepting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Accepting...
                  </>
                ) : (
                  <>
                    Accept Invitation
                    <CheckCircle2 className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            )}

            <Button
              onClick={() => router.push('/')}
              variant="ghost"
              size="lg"
              className="w-full"
            >
              Maybe Later
            </Button>
          </div>

          {/* Footer Info */}
          <div className="text-center text-xs text-gray-500 dark:text-gray-400">
            <p>This invitation will expire on {new Date(invitation.expires_at).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric'
            })}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
