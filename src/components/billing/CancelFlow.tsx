'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  DollarSign,
  MessageSquare,
  Pause,
  XCircle,
  Loader2,
  CheckCircle,
} from 'lucide-react';
import paddleService from '@/services/paddleService';
import { SubscriptionInfo } from '@/services/paddleService';
import { useToast } from '@/hooks/use-toast';

interface CancelFlowProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscription: SubscriptionInfo;
  onSuccess: () => void;
}

const REASONS = [
  { id: 'price', label: 'Too expensive', icon: DollarSign },
  { id: 'feature', label: 'Missing a feature I need', icon: XCircle },
  { id: 'usage', label: 'Not using it enough', icon: Clock },
  { id: 'other', label: 'Something else', icon: MessageSquare },
];

export function CancelFlow({ open, onOpenChange, subscription, onSuccess }: CancelFlowProps) {
  const [step, setStep] = useState(1);
  const [reason, setReason] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleCancel = async () => {
    try {
      setLoading(true);
      const response = await paddleService.cancelSubscription();

      if (response.success) {
        toast({
          title: 'Subscription cancelled',
          description: 'Your access continues until the end of the billing period.',
        });
        onOpenChange(false);
        onSuccess();
        resetFlow();
      } else {
        throw new Error(response.message || 'Failed to cancel');
      }
    } catch (error: any) {
      toast({
        title: 'Could not cancel',
        description: error.message || 'Please try again or contact support.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const resetFlow = () => {
    setStep(1);
    setReason(null);
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) resetFlow();
    onOpenChange(isOpen);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[480px]">
        {step === 1 && (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl font-switzer font-bold">
                Why are you cancelling?
              </DialogTitle>
              <DialogDescription>
                Your feedback helps us improve. This won't affect your access right now.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-4">
              {REASONS.map((r) => (
                <button
                  key={r.id}
                  onClick={() => {
                    setReason(r.id);
                    setStep(2);
                  }}
                  className={`w-full flex items-center gap-3 p-4 rounded-lg border text-left transition-colors ${
                    reason === r.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                  }`}
                >
                  <r.icon className="h-5 w-5 text-gray-500 flex-shrink-0" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {r.label}
                  </span>
                </button>
              ))}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl font-switzer font-bold">
                {reason === 'price'
                  ? 'Before you go...'
                  : reason === 'feature'
                  ? 'We hear you'
                  : reason === 'usage'
                  ? 'Can we help?'
                  : 'One more thing'}
              </DialogTitle>
              <DialogDescription>
                {reason === 'price'
                  ? 'We offer flexible options so you can keep using Faddy at a pace that works for your budget.'
                  : reason === 'feature'
                  ? "We're actively building new features. Tell us what you need and we'll prioritize it."
                  : reason === 'usage'
                  ? 'You can pause your subscription and come back when you need it. No charges while paused.'
                  : 'We want to make sure Faddy works for you.'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-4">
              {reason === 'price' && (
                <Card
                  className="cursor-pointer hover:border-blue-500 transition-colors border-gray-200 dark:border-gray-700"
                  onClick={() => {
                    onOpenChange(false);
                    resetFlow();
                  }}
                >
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                      <ArrowLeft className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        Downgrade to Starter
                      </p>
                      <p className="text-xs text-gray-500">
                        $19/mo — keep boards, posts, and integrations
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {reason === 'feature' && (
                <Card className="border-gray-200 dark:border-gray-700">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                      <MessageSquare className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        Request a feature
                      </p>
                      <p className="text-xs text-gray-500">
                        Send us a message at support@faddy.site with what you need
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {reason === 'usage' && (
                <Card className="border-gray-200 dark:border-gray-700">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                      <Pause className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        Pause subscription
                      </p>
                      <p className="text-xs text-gray-500">
                        Keep your data, restart anytime. No charges while paused.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button variant="ghost" onClick={() => setStep(1)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => setStep(3)}
              >
                Continue to cancel
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl font-switzer font-bold">
                Confirm cancellation
              </DialogTitle>
              <DialogDescription>
                This is your last chance to reconsider.
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 space-y-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Plan</span>
                  <span className="font-medium text-gray-900 dark:text-white capitalize">
                    {subscription.plan}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Access until</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatDate(subscription.currentPeriodEnd)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">After that</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    Downgraded to Free plan
                  </span>
                </div>
              </div>

              <p className="text-xs text-gray-500 text-center">
                You can resubscribe anytime. Your organization data and boards are preserved.
              </p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button variant="ghost" onClick={() => setStep(2)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button
                variant="destructive"
                onClick={handleCancel}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Cancelling...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Confirm cancellation
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
