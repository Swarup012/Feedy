'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import customDomainService, {
  type CustomDomain,
  type VerifyIncompleteDetails,
} from '@/services/customDomainService';
import {
  Globe,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Copy,
  Trash2,
  RefreshCw,
  ExternalLink,
  Square,
} from 'lucide-react';

interface CustomDomainSettingsProps {
  organizationId: string;
}

// Auto-check backoff: only POST /:id/verify refreshes Cloudflare state,
// and the server enforces a per-org cooldown (429). Spaced >= 10s.
const POLL_STEPS_MS = [10_000, 15_000, 30_000, 60_000] as const;
// Give up on auto-checking after 30 minutes total — the user can restart
// with "Check again" (a pending domain rarely activates on its own anyway).
const TOTAL_POLL_LIMIT_MS = 30 * 60_000;
// While the tab is hidden the timer pauses; resume shortly after visible.
const RESUME_DELAY_MS = 1_000;

function isFailedStatus(status?: string): boolean {
  return status === 'failed';
}

/** "Too many verification attempts — retry in 7s." -> 7 */
function parseRetrySeconds(message?: string): number | null {
  const m = /retry in (\d+)s/.exec(message ?? '');
  return m ? Number(m[1]) : null;
}

export function CustomDomainSettings({ organizationId }: CustomDomainSettingsProps) {
  const { toast } = useToast();
  const [domain, setDomain] = useState('');
  const [customDomain, setCustomDomain] = useState<CustomDomain | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [polling, setPolling] = useState(false);
  const [pendingDetails, setPendingDetails] = useState<VerifyIncompleteDetails | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [autoStopped, setAutoStopped] = useState(false);

  // Refs: timers and latest domain id must not go stale in setTimeout closures.
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollStepRef = useRef(0);
  const autoPollRef = useRef(false);
  const busyRef = useRef(false);
  const domainIdRef = useRef<string | null>(null);
  const pollStartedAtRef = useRef(0);
  const pausedRef = useRef(false);
  // verifyOnce <-> scheduleNext reference each other; break the cycle with a ref.
  const scheduleNextRef = useRef<(overrideMs?: number, advanceStep?: boolean) => void>(
    () => {},
  );

  const stopPolling = useCallback(() => {
    autoPollRef.current = false;
    pausedRef.current = false;
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    setPolling(false);
    // Any stop before verification offers "Check again" (the button is
    // hidden anyway once is_verified / no-domain renders a different view).
    setAutoStopped(true);
  }, []);

  const verifyOnce = useCallback(
    async (auto: boolean) => {
      const id = domainIdRef.current;
      if (!id || busyRef.current) return;
      busyRef.current = true;
      setVerifying(true);
      try {
        const data = await customDomainService.verifyDomain(id);
        setCustomDomain(data);
        domainIdRef.current = data.id;
        if (data.is_verified) {
          setPendingDetails(null);
          setServerError(null);
          stopPolling();
          toast({
            title: 'Domain verified',
            description: 'Your custom domain is active. SSL certificate is live.',
          });
        } else if (isFailedStatus(data.hostname_status) || isFailedStatus(data.cert_status)) {
          stopPolling(); // CF gave up — error_message alert shows why
        } else if (autoPollRef.current) {
          scheduleNextRef.current(); // still pending — keep checking on schedule
        }
      } catch (error: any) {
        const status: number | undefined = error?.response?.status;
        const body = error?.response?.data;

        if (status === 400) {
          // Still pending (DNS incomplete or CF hostname/cert not active).
          // NOT a failure — show hints + statuses, keep auto-checking.
          const details = (body?.details ?? null) as VerifyIncompleteDetails | null;
          setPendingDetails(details);
          setServerError(null);
          if (isFailedStatus(details?.hostname_status) || isFailedStatus(details?.cert_status)) {
            stopPolling();
          } else if (autoPollRef.current) {
            scheduleNextRef.current();
          }
        } else if (status === 429) {
          // Cooldown — wait the server-given time; never counts as a failure.
          const waitSec = parseRetrySeconds(body?.message) ?? 10;
          toast({
            title: 'Verification cooldown',
            description: body?.message || `Retry in ${waitSec}s.`,
          });
          if (autoPollRef.current) scheduleNextRef.current(waitSec * 1000, false);
        } else if (status === 404) {
          stopPolling();
          setCustomDomain(null);
          domainIdRef.current = null;
        } else if (status === 403 || status === 502 || status === 503) {
          // Generic server text only — quota/config issues, stop hammering.
          stopPolling();
          setServerError(body?.error || 'Service temporarily unavailable. Please try again later.');
        } else {
          stopPolling();
          toast({
            title: 'Verification failed',
            description: 'Could not reach the verification service. Please try again.',
            variant: 'destructive',
          });
        }
      } finally {
        busyRef.current = false;
        setVerifying(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [stopPolling, toast],
  );

  const scheduleNext = useCallback(
    (overrideMs?: number, advanceStep = true) => {
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
      if (Date.now() - pollStartedAtRef.current >= TOTAL_POLL_LIMIT_MS) {
        stopPolling(); // 30 minutes total — offer "Check again" instead
        return;
      }
      const step = Math.min(pollStepRef.current, POLL_STEPS_MS.length - 1);
      const delay = overrideMs ?? POLL_STEPS_MS[step];
      if (advanceStep) pollStepRef.current = Math.min(step + 1, POLL_STEPS_MS.length - 1);
      pollTimerRef.current = setTimeout(() => {
        pollTimerRef.current = null;
        if (document.hidden) {
          pausedRef.current = true; // resume comes from visibilitychange
          return;
        }
        void verifyOnce(true);
      }, delay);
    },
    [verifyOnce, stopPolling],
  );
  scheduleNextRef.current = scheduleNext;

  const startPolling = useCallback(() => {
    if (autoPollRef.current) return;
    autoPollRef.current = true;
    pausedRef.current = false;
    pollStepRef.current = 0;
    pollStartedAtRef.current = Date.now();
    setAutoStopped(false);
    setPolling(true);
    scheduleNext();
  }, [scheduleNext]);

  useEffect(() => {
    return () => stopPolling(); // unmount cleanup — no calls after teardown
  }, [stopPolling]);

  // Pause the auto-check timer while the tab is hidden; resume shortly after
  // it becomes visible again (only if auto-polling is still on).
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) {
        if (pollTimerRef.current) {
          clearTimeout(pollTimerRef.current);
          pollTimerRef.current = null;
        }
        pausedRef.current = true;
      } else if (pausedRef.current && autoPollRef.current) {
        pausedRef.current = false;
        scheduleNextRef.current(RESUME_DELAY_MS, false);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await customDomainService.getDomain();
        if (cancelled) return;
        setCustomDomain(data);
        domainIdRef.current = data?.id ?? null;
        if (data && !data.is_verified) startPolling();
      } catch (error: any) {
        // Silently handle all errors — just show the add domain form
        console.error('Custom domain load error (non-critical):', error?.response?.status || error?.message);
        if (!cancelled) setCustomDomain(null);
      } finally {
        if (!cancelled) setInitialLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId]);

  const handleAddDomain = async () => {
    if (!domain.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a domain',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    setServerError(null);
    try {
      const data = await customDomainService.addDomain(domain.toLowerCase());
      setCustomDomain(data);
      domainIdRef.current = data.id;
      setDomain('');
      toast({
        title: 'Success',
        description: 'Custom domain added. Set the DNS records below, then Verify.',
      });
    } catch (error: any) {
      // 400 user-facing (plan gate / taken / invalid) and 403 quota keep the
      // server's own message — that text IS the answer (incl. plan upgrade).
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to add custom domain',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyDomain = async () => {
    if (!customDomain) return;
    setServerError(null);
    await verifyOnce(false); // manual attempt — immediate; server enforces cooldown
  };

  const handleCheckAgain = () => {
    setServerError(null);
    startPolling(); // resets the 30-minute budget and the backoff schedule
    void verifyOnce(false); // ...and checks immediately
  };

  const handleDeleteDomain = async () => {
    if (!customDomain || !confirm('Delete this custom domain? This also removes its Cloudflare hostname.')) return;

    setDeleting(true);
    stopPolling();
    try {
      await customDomainService.deleteDomain(customDomain.id);
      setCustomDomain(null);
      domainIdRef.current = null;
      setPendingDetails(null);
      setServerError(null);
      toast({
        title: 'Success',
        description: 'Custom domain deleted',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to delete custom domain',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied!',
      description: 'Copied to clipboard',
    });
  };

  const getStatusBadge = (d: CustomDomain) => {
    const failed = d.hostname_status === 'failed' || d.cert_status === 'failed';
    if (failed) {
      return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Failed</Badge>;
    }
    if (d.is_verified && d.cert_status === 'active') {
      return <Badge className="bg-green-500"><CheckCircle2 className="w-3 h-3 mr-1" /> Active</Badge>;
    }
    if (d.hostname_status === 'active' && d.cert_status === 'pending') {
      return <Badge className="bg-blue-500"><Clock className="w-3 h-3 mr-1" /> Certificate pending</Badge>;
    }
    return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
  };

  if (initialLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="flex items-center gap-2 text-gray-500">
            <Globe className="w-5 h-5 animate-pulse" />
            <span>Loading custom domain settings...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Custom Domain
            </CardTitle>
            <CardDescription>
              Use your own subdomain instead of *.faddy.site
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!customDomain ? (
          <div className="space-y-4">
            <div>
              <Label htmlFor="domain">Custom Subdomain</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  id="domain"
                  placeholder="feedback.yourdomain.com"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  disabled={loading}
                />
                <Button onClick={handleAddDomain} disabled={loading}>
                  {loading ? 'Adding...' : 'Add Domain'}
                </Button>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Enter a subdomain (e.g., feedback.yourdomain.com). Root domains are not supported.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Domain Status */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-gray-500" />
                <div>
                  <div className="font-medium">{customDomain.domain}</div>
                  <div className="text-sm text-gray-500">
                    {customDomain.is_verified ? 'Verified' : 'Awaiting verification'}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(customDomain)}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDeleteDomain}
                  disabled={deleting}
                  aria-label="Delete custom domain"
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            </div>

            {/* Server-side error (redacted) — e.g. CF hostname/cert not active */}
            {customDomain.error_message && !customDomain.is_verified && (
              <Alert variant="destructive">
                <AlertTriangle className="w-4 h-4" />
                <AlertTitle>Latest check</AlertTitle>
                <AlertDescription>{customDomain.error_message}</AlertDescription>
              </Alert>
            )}

            {serverError && (
              <Alert variant="destructive">
                <AlertTriangle className="w-4 h-4" />
                <AlertDescription>{serverError}</AlertDescription>
              </Alert>
            )}

            {/* Pending verification details (from the last verify 400) */}
            {pendingDetails && !customDomain.is_verified && (
              <Alert>
                <Clock className="w-4 h-4" />
                <AlertTitle>Verification in progress</AlertTitle>
                <AlertDescription>
                  <div className="space-y-1 mt-1">
                    <div>
                      TXT ownership record:{' '}
                      {pendingDetails.txtValid ? (
                        <span className="text-green-600 font-medium">found</span>
                      ) : (
                        <span className="text-red-600 font-medium">not found yet</span>
                      )}
                    </div>
                    <div>
                      CNAME to customers.faddy.site:{' '}
                      {pendingDetails.cnameValid ? (
                        <span className="text-green-600 font-medium">found</span>
                      ) : (
                        <span className="text-red-600 font-medium">not found yet</span>
                      )}
                    </div>
                    {pendingDetails.hostname_status && (
                      <div>Cloudflare hostname: <span className="font-medium">{pendingDetails.hostname_status}</span></div>
                    )}
                    {pendingDetails.cert_status && (
                      <div>SSL certificate: <span className="font-medium">{pendingDetails.cert_status}</span></div>
                    )}
                    {pendingDetails.message && <div className="text-sm text-gray-500">{pendingDetails.message}</div>}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* DNS Setup Instructions */}
            {!customDomain.is_verified && customDomain.dns_records && (
              <Alert>
                <AlertTriangle className="w-4 h-4" />
                <AlertDescription>
                  <div className="space-y-4 mt-2">
                    <p className="font-medium">Add these DNS records at your DNS provider:</p>

                    {customDomain.dns_records.map((record, index) => (
                      <div key={index} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{record.type} Record</span>
                          <Badge variant="outline">TTL {record.ttl}s</Badge>
                        </div>
                        <div className="space-y-1">
                          <div className="text-xs text-gray-500">Name (relative):</div>
                          <div className="flex items-center gap-2">
                            <code className="text-sm bg-white dark:bg-gray-900 px-2 py-1 rounded flex-1">
                              {record.name}
                            </code>
                            <Button variant="ghost" size="sm" onClick={() => copyToClipboard(record.name)}>
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-xs text-gray-500">Full name:</div>
                          <div className="flex items-center gap-2">
                            <code className="text-sm bg-white dark:bg-gray-900 px-2 py-1 rounded flex-1">
                              {record.full_name || record.name}
                            </code>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(record.full_name || record.name)}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-xs text-gray-500">Value:</div>
                          <div className="flex items-center gap-2">
                            <code className="text-sm bg-white dark:bg-gray-900 px-2 py-1 rounded flex-1 break-all">
                              {record.value}
                            </code>
                            <Button variant="ghost" size="sm" onClick={() => copyToClipboard(record.value)}>
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500">{record.description}</p>
                      </div>
                    ))}

                    <div className="flex gap-2">
                      <Button onClick={handleVerifyDomain} disabled={verifying} className="flex-1">
                        <RefreshCw className={`w-4 h-4 mr-2 ${verifying ? 'animate-spin' : ''}`} />
                        {verifying ? 'Verifying...' : 'Verify Domain'}
                      </Button>
                      {polling && (
                        <Button variant="outline" onClick={stopPolling}>
                          <Square className="w-4 h-4 mr-2" />
                          Stop auto-check
                        </Button>
                      )}
                      {!polling && autoStopped && (
                        <Button variant="outline" onClick={handleCheckAgain}>
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Check again
                        </Button>
                      )}
                    </div>
                    {polling && !verifying && (
                      <p className="text-xs text-gray-500">
                        Auto-checking DNS and certificate status (every 10–60s).
                      </p>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Success Message */}
            {customDomain.is_verified && customDomain.cert_status === 'active' && (
              <Alert className="border-green-500 bg-green-50 dark:bg-green-900/20">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-medium text-green-600">Your custom domain is active!</p>
                    <p className="text-sm">
                      Your feedback board is now available at{' '}
                      <a
                        href={`https://${customDomain.domain}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium underline inline-flex items-center gap-1"
                      >
                        {customDomain.domain}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </p>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Info Section */}
        <div className="text-sm text-gray-500 space-y-1 pt-4 border-t">
          <p>• Only subdomains are supported (e.g., feedback.yourdomain.com)</p>
          <p>• Free SSL certificate included (Cloudflare edge certificate)</p>
          <p>• DNS changes may take a few minutes to propagate</p>
          <p>• Pro plan allows 1 custom domain</p>
        </div>
      </CardContent>
    </Card>
  );
}
