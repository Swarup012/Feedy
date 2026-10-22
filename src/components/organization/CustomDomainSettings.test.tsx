import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';

// ── Mocks ───────────────────────────────────────────────────────────────────

const getDomain = vi.hoisted(() => vi.fn());
const addDomain = vi.hoisted(() => vi.fn());
const verifyDomain = vi.hoisted(() => vi.fn());
const deleteDomain = vi.hoisted(() => vi.fn());
const toastMock = vi.hoisted(() => vi.fn());

vi.mock('@/services/customDomainService', () => ({
  default: { getDomain, addDomain, verifyDomain, deleteDomain },
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: toastMock }),
}));

import { CustomDomainSettings } from './CustomDomainSettings';

// Auto-check backoff contract (POST /:id/verify only — GET never refreshes
// Cloudflare state): 10s, 15s, 30s, 60s, then 60s cap. 400 = still pending
// (not a failure); 429 = wait the server-given time, not a failure;
// 403/503 = generic server text + stop; success/unmount/stop = cease.

const PENDING = {
  id: 'dom-1',
  domain: 'feedback.acme.com',
  verification_token: 'tok-abc',
  is_verified: false,
  hostname_status: 'pending',
  cert_status: 'pending',
  error_message: null,
  dns_records: [
    {
      type: 'CNAME',
      name: 'feedback',
      full_name: 'feedback.acme.com',
      value: 'customers.faddy.site',
      ttl: 3600,
      description: 'Points your subdomain to Faddy',
    },
    {
      type: 'TXT',
      name: '_faddy-verify.feedback',
      full_name: '_faddy-verify.feedback.acme.com',
      value: 'tok-abc',
      ttl: 3600,
      description: 'Verification record to prove domain ownership',
    },
  ],
};

const VERIFIED = {
  ...PENDING,
  is_verified: true,
  hostname_status: 'active',
  cert_status: 'active',
};

function httpError(status: number, data: Record<string, unknown>) {
  return Object.assign(new Error(`http ${status}`), { response: { status, data } });
}

async function flush() {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(0);
  });
}

async function advance(ms: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

function setDocumentHidden(hidden: boolean) {
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden });
  Object.defineProperty(document, 'visibilityState', {
    configurable: true,
    get: () => (hidden ? 'hidden' : 'visible'),
  });
}

beforeEach(() => {
  vi.useFakeTimers();
  getDomain.mockReset();
  addDomain.mockReset();
  verifyDomain.mockReset();
  deleteDomain.mockReset();
  toastMock.mockReset();
  vi.spyOn(window, 'confirm').mockReturnValue(true);
  Object.defineProperty(window.navigator, 'clipboard', {
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
    configurable: true,
  });
});

afterEach(() => {
  cleanup();
  setDocumentHidden(false);
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('CustomDomainSettings', () => {
  it('renders DNS cards with relative name, full name and both values', async () => {
    getDomain.mockResolvedValue(PENDING);

    render(<CustomDomainSettings organizationId="org-1" />);
    await flush();

    expect(screen.getByText('feedback')).toBeTruthy(); // CNAME relative
    expect(screen.getAllByText('feedback.acme.com').length).toBeGreaterThan(0); // title + full name
    expect(screen.getByText('customers.faddy.site')).toBeTruthy();
    expect(screen.getByText('_faddy-verify.feedback')).toBeTruthy();
    expect(screen.getByText('_faddy-verify.feedback.acme.com')).toBeTruthy();
    expect(screen.getByText('tok-abc')).toBeTruthy();
    expect(screen.getByRole('button', { name: /Verify Domain/ })).toBeTruthy();
  });

  it('backoff schedule on 400-incomplete: 10s, 15s, 30s, 60s, 60s cap', async () => {
    getDomain.mockResolvedValue(PENDING);
    verifyDomain.mockRejectedValue(
      httpError(400, {
        error: 'Domain verification failed',
        details: { txtValid: false, cnameValid: false, hostname_status: 'pending', cert_status: 'pending' },
      }),
    );

    render(<CustomDomainSettings organizationId="org-1" />);
    await flush(); // mount -> getDomain -> startPolling -> +10s

    await advance(10_000);
    expect(verifyDomain).toHaveBeenCalledTimes(1);
    // 400 is NOT a failure: validation hints are shown (TXT + CNAME)
    expect(screen.getAllByText(/not found yet/).length).toBe(2);

    await advance(15_000); // cumulative 25s
    expect(verifyDomain).toHaveBeenCalledTimes(2);

    await advance(30_000); // cumulative 55s
    expect(verifyDomain).toHaveBeenCalledTimes(3);

    await advance(60_000); // cumulative 115s
    expect(verifyDomain).toHaveBeenCalledTimes(4);

    await advance(60_000); // cumulative 175s — cap, not 120s
    expect(verifyDomain).toHaveBeenCalledTimes(5);

    // no destructive toasts for pending 400s
    const destructive = toastMock.mock.calls.map((c) => c[0]).filter((a) => a?.variant === 'destructive');
    expect(destructive).toEqual([]);
  });

  it('429: waits the server-given time and does not count as a failure', async () => {
    getDomain.mockResolvedValue(PENDING);
    verifyDomain
      .mockRejectedValueOnce(
        httpError(429, {
          error: 'TOO_MANY_VERIFY_ATTEMPTS',
          message: 'Too many verification attempts — retry in 7s.',
        }),
      )
      .mockRejectedValue(httpError(400, { error: 'Domain verification failed', details: {} }));

    render(<CustomDomainSettings organizationId="org-1" />);
    await flush();

    await advance(10_000); // first auto attempt -> 429
    expect(verifyDomain).toHaveBeenCalledTimes(1);
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Verification cooldown' }),
    );
    const destructive = toastMock.mock.calls.map((c) => c[0]).filter((a) => a?.variant === 'destructive');
    expect(destructive).toEqual([]);

    await advance(6_999); // 7s not yet elapsed
    expect(verifyDomain).toHaveBeenCalledTimes(1);
    await advance(1); // 7s
    expect(verifyDomain).toHaveBeenCalledTimes(2);

    // after the cooldown retry (400 pending), the regular step resumes
    await advance(15_000);
    expect(verifyDomain).toHaveBeenCalledTimes(3);
  });

  it('success stops polling and shows the active state', async () => {
    getDomain.mockResolvedValue(PENDING);
    verifyDomain.mockResolvedValue(VERIFIED);

    render(<CustomDomainSettings organizationId="org-1" />);
    await flush();

    await advance(10_000);
    expect(verifyDomain).toHaveBeenCalledTimes(1);
    expect(screen.getAllByText(/Your custom domain is active/).length).toBeGreaterThan(0);
    expect(screen.queryByRole('button', { name: /Stop auto-check/ })).toBeNull();

    await advance(10 * 60_000); // 10 more minutes
    expect(verifyDomain).toHaveBeenCalledTimes(1); // never again
  });

  it('unmount cleanup: no verify calls after teardown', async () => {
    getDomain.mockResolvedValue(PENDING);
    verifyDomain.mockRejectedValue(httpError(400, { details: {} }));

    const { unmount } = render(<CustomDomainSettings organizationId="org-1" />);
    await flush();
    unmount();

    await advance(60 * 60_000);
    expect(verifyDomain).not.toHaveBeenCalled();
  });

  it('403: shows the generic server text and stops auto-checking', async () => {
    getDomain.mockResolvedValue(PENDING);
    verifyDomain.mockRejectedValue(
      httpError(503, { error: 'Service temporarily unavailable. Please try again later.' }),
    );

    render(<CustomDomainSettings organizationId="org-1" />);
    await flush();

    await advance(10_000);
    expect(verifyDomain).toHaveBeenCalledTimes(1);
    expect(screen.getAllByText(/Service temporarily unavailable/).length).toBeGreaterThan(0);

    await advance(60 * 60_000);
    expect(verifyDomain).toHaveBeenCalledTimes(1); // stopped
  });

  it('manual Stop auto-check ends polling immediately', async () => {
    getDomain.mockResolvedValue(PENDING);
    verifyDomain.mockRejectedValue(httpError(400, { details: {} }));

    render(<CustomDomainSettings organizationId="org-1" />);
    await flush();

    fireEvent.click(screen.getByRole('button', { name: /Stop auto-check/ }));
    await advance(60 * 60_000);
    expect(verifyDomain).not.toHaveBeenCalled();
  });

  it('delete flow: confirm -> DELETE -> back to the add form', async () => {
    getDomain.mockResolvedValue(VERIFIED);
    deleteDomain.mockResolvedValue(undefined);

    render(<CustomDomainSettings organizationId="org-1" />);
    await flush();

    expect(screen.getAllByText('feedback.acme.com').length).toBeGreaterThan(0);
    const delBtn = screen.getByRole('button', { name: 'Delete custom domain' });
    fireEvent.click(delBtn);
    await flush();

    expect(window.confirm).toHaveBeenCalled();
    expect(deleteDomain).toHaveBeenCalledWith('dom-1');
    expect(screen.getByPlaceholderText('feedback.yourdomain.com')).toBeTruthy();
  });

  it('add 403 plan gate: surfaces the server upgrade message', async () => {
    getDomain.mockResolvedValue(null);
    addDomain.mockRejectedValue(
      httpError(403, {
        error: 'Cannot add custom domain. Upgrade to Pro plan or remove existing domain.',
      }),
    );

    render(<CustomDomainSettings organizationId="org-1" />);
    await flush();

    fireEvent.change(screen.getByPlaceholderText('feedback.yourdomain.com'), {
      target: { value: 'feedback.acme.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Add Domain' }));
    await flush();

    expect(addDomain).toHaveBeenCalledWith('feedback.acme.com');
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        variant: 'destructive',
        description: expect.stringContaining('Upgrade to Pro plan'),
      }),
    );
  });

  it('stops auto-polling after 30 minutes total and Check again resumes', async () => {
    getDomain.mockResolvedValue(PENDING);
    verifyDomain.mockRejectedValue(httpError(400, { details: {} }));

    render(<CustomDomainSettings organizationId="org-1" />);
    await flush();

    // Run fake time forward minute-by-minute until the 30-minute cap hits.
    for (let i = 0; i < 40; i++) {
      await advance(60_000);
      if (screen.queryByRole('button', { name: /Check again/ })) break;
    }
    expect(screen.getByRole('button', { name: /Check again/ })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Stop auto-check/ })).toBeNull();

    const stoppedAt = verifyDomain.mock.calls.length;
    await advance(60 * 60_000); // one more hour — nothing may fire
    expect(verifyDomain.mock.calls.length).toBe(stoppedAt);

    // "Check again" resets the budget and verifies immediately
    fireEvent.click(screen.getByRole('button', { name: /Check again/ }));
    await flush();
    expect(verifyDomain.mock.calls.length).toBe(stoppedAt + 1);
    expect(screen.queryByRole('button', { name: /Check again/ })).toBeNull();
  });

  it('pauses the timer while document.hidden and resumes on visibilitychange', async () => {
    getDomain.mockResolvedValue(PENDING);
    verifyDomain.mockRejectedValue(httpError(400, { details: {} }));

    render(<CustomDomainSettings organizationId="org-1" />);
    await flush(); // poll scheduled for +10s

    setDocumentHidden(true);
    document.dispatchEvent(new Event('visibilitychange'));
    await advance(120_000); // hidden: timer paused, no verify calls
    expect(verifyDomain).not.toHaveBeenCalled();

    setDocumentHidden(false);
    document.dispatchEvent(new Event('visibilitychange'));
    await advance(999); // resume delay not yet elapsed
    expect(verifyDomain).not.toHaveBeenCalled();
    await advance(1);
    expect(verifyDomain).toHaveBeenCalledTimes(1); // resumed at RESUME_DELAY_MS
  });

  it('stops polling when hostname_status is failed and shows error_message', async () => {
    getDomain.mockResolvedValue(PENDING);
    verifyDomain.mockResolvedValue({
      ...PENDING,
      hostname_status: 'failed',
      error_message: 'Hostname validation failed at Cloudflare',
    });

    render(<CustomDomainSettings organizationId="org-1" />);
    await flush();

    await advance(10_000); // first (and last) auto check
    expect(verifyDomain).toHaveBeenCalledTimes(1);
    expect(screen.getAllByText(/Hostname validation failed at Cloudflare/).length).toBeGreaterThan(0);

    await advance(60 * 60_000);
    expect(verifyDomain).toHaveBeenCalledTimes(1); // stopped for good
    expect(screen.queryByRole('button', { name: /Stop auto-check/ })).toBeNull();
  });
});
