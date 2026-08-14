'use client';

import { type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  AlertTriangle,
  Loader2,
  Plug,
  Unplug,
  Settings2,
} from 'lucide-react';

function formatDate(iso: string | null) {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

/* ── Status Indicator ── */

function StatusIndicator({ status }: { status: 'active' | 'error' | null }) {
  if (status === 'active') {
    return (
      <span className="relative flex h-2 w-2" aria-hidden="true">
        <span className="animate-ping absolute h-full w-full rounded-full bg-emerald-400 opacity-75" />
        <span className="relative rounded-full h-2 w-2 bg-emerald-500" />
      </span>
    );
  }

  if (status === 'error') {
    return <AlertTriangle className="h-3.5 w-3.5 text-red-500" />;
  }

  return null;
}

function StatusBadge({ status }: { status: 'active' | 'error' | null }) {
  if (status === 'active') {
    return (
      <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-0">
        Connected
      </Badge>
    );
  }

  if (status === 'error') {
    return (
      <Badge className="bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border-0">
        Error — reconnect required
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="text-muted-foreground">
      Not connected
    </Badge>
  );
}

/* ── Connected Card ── */

export interface IntegrationCardConnectedProps {
  name: string;
  icon: ReactNode;
  brandColor: string;
  status: 'active' | 'error' | null;
  subtitle: string;
  settingsContent: ReactNode;
  footerContent?: ReactNode;
  reconnectButton?: ReactNode;
}

export function IntegrationCardConnected({
  name,
  icon,
  brandColor,
  status,
  subtitle,
  settingsContent,
  footerContent,
  reconnectButton,
}: IntegrationCardConnectedProps) {
  return (
    <>
      <div className="rounded-xl border bg-card px-4 py-3 flex items-center gap-3 hover:shadow-sm transition-shadow">
        <div
          className="h-9 w-9 shrink-0 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${brandColor}10` }}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{name}</span>
            <StatusIndicator status={status} />
            {status === 'active' && (
              <span className="text-emerald-600 dark:text-emerald-400 text-xs font-medium">
                Active
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {subtitle}
          </p>
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="shrink-0 gap-1.5 h-8"
              aria-label={`Manage ${name} settings`}
            >
              <Settings2 className="h-3.5 w-3.5" /> Manage
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            className="w-80 p-0 overflow-hidden rounded-xl border bg-card shadow-lg"
          >
            <div className="bg-muted/50 px-4 py-3 border-b">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                {icon} {name} Settings
              </h4>
            </div>
            <div className="p-4 space-y-5">{settingsContent}</div>
            {footerContent}
          </PopoverContent>
        </Popover>
      </div>
      {reconnectButton}
    </>
  );
}

/* ── Add Integration Card ── */

export interface IntegrationCardAddProps {
  name: string;
  icon: ReactNode;
  brandColor: string;
  description: string;
  onConnect: () => void;
}

export function IntegrationCardAdd({
  name,
  icon,
  brandColor,
  description,
  onConnect,
}: IntegrationCardAddProps) {
  return (
    <div
      className="rounded-xl border bg-card p-5 flex flex-col hover:shadow-md transition-all group"
      style={{ ['--card-hover-border' as string]: `${brandColor}30` }}
    >
      <div
        className="h-10 w-10 rounded-lg flex items-center justify-center mb-3 group-hover:scale-105 transition-transform"
        style={{ backgroundColor: `${brandColor}10` }}
      >
        {icon}
      </div>
      <h3 className="font-semibold text-sm">{name}</h3>
      <p className="text-xs text-muted-foreground mt-1.5 flex-1 leading-relaxed">
        {description}
      </p>
      <Button
        size="sm"
        className="mt-4 w-full text-white"
        style={{ backgroundColor: brandColor }}
        onClick={onConnect}
      >
        Connect
      </Button>
    </div>
  );
}

/* ── Disconnect Button (used inside settings popover) ── */

export function IntegrationDisconnectButton({
  onClick,
  loading,
  label = 'Disconnect',
  note,
}: {
  onClick: () => void;
  loading: boolean;
  label?: string;
  note?: string;
}) {
  return (
    <div className="border-t bg-red-50/50 dark:bg-red-950/20 p-4">
      <Button
        variant="destructive"
        size="sm"
        className="w-full gap-2"
        onClick={onClick}
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Unplug className="h-3.5 w-3.5" />
        )}
        {label}
      </Button>
      {note && (
        <p className="text-[10px] text-muted-foreground text-center mt-2">
          {note}
        </p>
      )}
    </div>
  );
}

/* ── Reconnect Banner ── */

export function IntegrationReconnectBanner({
  name,
  message,
  onReconnect,
}: {
  name: string;
  message: string;
  onReconnect: () => void;
}) {
  return (
    <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 p-4 flex items-start gap-3">
      <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-sm font-medium text-red-800 dark:text-red-300">
          {name} connection lost
        </p>
        <p className="text-sm text-red-600/80 dark:text-red-400/80 mt-0.5">
          {message}
        </p>
      </div>
      <Button
        size="sm"
        variant="outline"
        className="border-red-300 text-red-700 hover:bg-red-100 dark:border-red-800 dark:text-red-300"
        onClick={onReconnect}
      >
        <Plug className="h-3.5 w-3.5 mr-1.5" /> Reconnect
      </Button>
    </div>
  );
}

export { StatusBadge, formatDate };
