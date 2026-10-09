'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/context/OrganizationContext';
import { planAllowsFeature, resolvePlan } from '@/config/plans';
import { saveReturnUrl, clearReturnUrl } from '@/lib/returnUrl';
import { validateOAuthParams } from '@/lib/oauthParams';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { AlertCircle, Loader2, ShieldCheck, X } from 'lucide-react';

const CLIENT_NAME = 'Zapier';

function Spinner({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="text-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

/** Local-only failure screen. Never renders or navigates anywhere. */
function ErrorScreen({ title, message }: { title: string; message: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-3">
            <AlertCircle className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-xl font-bold">{title}</CardTitle>
          <CardDescription className="text-sm">{message}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground text-center">
            You can close this window and try again from {CLIENT_NAME}.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function AuthorizeInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading, isAuthenticated, refreshUser } = useAuth();
  const { organizations, loading: orgsLoading } = useOrganization();

  // Pure, synchronous validation of the query string. `scope` is ignored.
  // Keyed on the query string (not the object) so effects never re-fire.
  const queryString = searchParams.toString();
  const parsed = useMemo(
    () => validateOAuthParams(new URLSearchParams(queryString)),
    [queryString]
  );

  const [clientOk, setClientOk] = useState<boolean | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // refreshUser is recreated on every AuthContext render — hold it in a ref
  // so the verification effect below can't loop on identity changes.
  const refreshRef = useRef(refreshUser);
  refreshRef.current = refreshUser;

  // 1. Confirm the client + redirect_uri with the backend before doing
  //    anything else. A failure here is a local error screen — never a
  //    redirect, so a bad redirect_uri can never send the user anywhere.
  useEffect(() => {
    if (!parsed.ok) {
      setClientOk(false);
      return;
    }
    let alive = true;
    const query = new URLSearchParams({
      client_id: parsed.params.clientId,
      redirect_uri: parsed.params.redirectUri,
    });
    (async () => {
      try {
        const res = await fetch(`/api/oauth/authorize?${query.toString()}`);
        const data = await res.json().catch(() => null);
        if (alive) setClientOk(res.ok && data?.valid === true);
      } catch {
        if (alive) setClientOk(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [parsed]);

  // 2. The localStorage user cache is only a hint — when it says "logged out"
  //    we still ask the server once (the HttpOnly cookie may be valid, e.g.
  //    after clearing storage or switching subdomains) before /login.
  useEffect(() => {
    if (authLoading || sessionChecked) return;
    if (isAuthenticated) {
      setSessionChecked(true);
      return;
    }
    let alive = true;
    refreshRef.current().finally(() => {
      if (alive) setSessionChecked(true);
    });
    return () => {
      alive = false;
    };
  }, [authLoading, sessionChecked, isAuthenticated]);

  // 3. Persist the exact path + query on mount, before any auth/network work,
  //    so a logged-out or dead-cookie session can always come back here.
  useEffect(() => {
    saveReturnUrl();
  }, []);

  // 4. Not logged in → save the return URL (query string included) and go to
  //    login. router.replace, not ProtectedRoute, so the query survives.
  useEffect(() => {
    if (!sessionChecked || isAuthenticated) return;
    saveReturnUrl();
    router.replace('/login');
  }, [sessionChecked, isAuthenticated, router]);

  const params = parsed.ok ? parsed.params : null;

  const eligible = useMemo(
    () =>
      organizations.filter(
        (org) =>
          (org.role === 'owner' || org.role === 'admin') &&
          planAllowsFeature(resolvePlan(org), 'integrations')
      ),
    [organizations]
  );

  // 1 eligible org → auto-select; several → the picker below.
  const selectedOrg =
    selectedOrgId != null
      ? eligible.find((org) => org.id === selectedOrgId) ?? null
      : eligible.length === 1
        ? eligible[0]
        : null;

  // Every window.location.href goes through here: the target's origin +
  // pathname must equal those of the redirect_uri the backend validate call
  // approved, otherwise we stay put and show an error.
  const navigateAway = (target: string): boolean => {
    if (!params) return false;
    try {
      const approved = new URL(params.redirectUri);
      const destination = new URL(target);
      if (
        destination.origin !== approved.origin ||
        destination.pathname !== approved.pathname
      ) {
        setActionError("Faddy didn't approve this redirect target. Nothing was sent.");
        return false;
      }
    } catch {
      setActionError("Faddy didn't approve this redirect target. Nothing was sent.");
      return false;
    }
    // The flow is over — drop the saved return URL before leaving for Zapier.
    clearReturnUrl();
    window.location.href = target;
    return true;
  };

  const handleAllow = async () => {
    if (!params || !selectedOrg || busy) return;
    setBusy(true);
    setActionError(null);
    try {
      const res = await fetch('/api/oauth/authorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: params.clientId,
          redirect_uri: params.redirectUri,
          response_type: 'code',
          code_challenge: params.codeChallenge,
          code_challenge_method: params.codeChallengeMethod,
          organization_id: selectedOrg.id,
          state: params.state,
        }),
      });
      const data = await res.json().catch(() => null);

      if (res.status === 401) {
        // Session expired mid-flow — same treatment as "not logged in".
        saveReturnUrl();
        router.replace('/login');
        return;
      }
      if (!res.ok || typeof data?.data?.redirect_url !== 'string') {
        setBusy(false);
        setActionError(
          data?.message ||
            "Faddy couldn't approve this connection. Nothing was created — please try again."
        );
        return;
      }
      // The ONLY place the returned redirect URL (which carries the code) is
      // used: a full browser navigation. It is never stored or rendered.
      if (!navigateAway(data.data.redirect_url)) {
        setBusy(false);
        return;
      }
    } catch {
      setBusy(false);
      setActionError("Couldn't reach Faddy. Check your connection and try again.");
    }
  };

  const handleDeny = () => {
    if (!params) return;
    const separator = params.redirectUri.includes('?') ? '&' : '?';
    navigateAway(
      `${params.redirectUri}${separator}error=access_denied` +
        `&state=${encodeURIComponent(params.state)}`
    );
  };

  // ── Render: every failure below is a local screen, never a redirect ──────
  if (!parsed.ok) {
    return <ErrorScreen title="Invalid request" message={parsed.error} />;
  }
  if (clientOk === null) return <Spinner label="Checking the request…" />;
  if (!clientOk) {
    return (
      <ErrorScreen
        title="This request can't be approved"
        message="Faddy could not verify this authorization request."
      />
    );
  }
  if (authLoading || !sessionChecked || (isAuthenticated && orgsLoading)) {
    return <Spinner />;
  }
  if (!isAuthenticated) return <Spinner label="Redirecting to login…" />;

  if (eligible.length === 0) {
    return (
      <ErrorScreen
        title="No organization can connect"
        message="You need to be an owner or admin of an organization to connect Zapier."
      />
    );
  }
  if (!selectedOrg) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-xl">Choose an organization</CardTitle>
            <CardDescription>
              {CLIENT_NAME} will be connected to the organization you pick.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {eligible.map((org) => (
              <Button
                key={org.id}
                variant="outline"
                className="w-full justify-start"
                onClick={() => setSelectedOrgId(org.id)}
              >
                {org.name}
              </Button>
            ))}
            <Button variant="ghost" className="w-full" onClick={handleDeny}>
              Cancel
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  const keyName = `${CLIENT_NAME} OAuth · ${user?.email ?? ''} · ${today}`;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="max-w-lg w-full">
        <CardHeader>
          <div className="mx-auto w-12 h-12 rounded-full bg-[#FF4F0015] flex items-center justify-center mb-3">
            <ShieldCheck className="h-6 w-6 text-[#FF4F00]" />
          </div>
          <CardTitle className="text-xl text-center">
            Connect {CLIENT_NAME} to {selectedOrg.name}
          </CardTitle>
          <CardDescription className="text-center">
            Authorize this connection
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {CLIENT_NAME} wants to connect to{' '}
            <span className="font-medium text-foreground">{selectedOrg.name}</span> as{' '}
            <span className="font-medium text-foreground">{user?.email}</span>. It will be
            able to: create posts, read posts and boards, and manage webhooks that send
            new-post events to {CLIENT_NAME}. Each connection creates an API key named{' '}
            <span className="font-mono text-foreground">&apos;{keyName}&apos;</span> on
            your API keys page. Disconnecting in {CLIENT_NAME} does not revoke it; revoke
            it on the API keys page.
          </p>

          {eligible.length > 1 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">
                Connecting organization
              </p>
              <div className="flex flex-wrap gap-2">
                {eligible.map((org) => (
                  <Button
                    key={org.id}
                    size="sm"
                    variant={org.id === selectedOrg.id ? 'default' : 'outline'}
                    onClick={() => setSelectedOrgId(org.id)}
                  >
                    {org.name}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {actionError && (
            <div className="flex items-start gap-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 rounded-lg px-3 py-2">
              <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span>{actionError}</span>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <Button variant="outline" className="flex-1 gap-1.5" onClick={handleDeny} disabled={busy}>
              <X className="h-4 w-4" /> Deny
            </Button>
            <Button className="flex-1" onClick={handleAllow} disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Allow'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function OAuthAuthorizePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <AuthorizeInner />
    </Suspense>
  );
}
