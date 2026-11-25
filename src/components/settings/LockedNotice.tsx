'use client';

import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ShellIcon } from '@/components/shell/ShellIcon';

/**
 * Flat, inline plan-gate notice. Replaces the old blurred overlay: the locked
 * fields stay visible below it and are disabled by their owning section.
 */
export function LockedNotice({
  children,
  onUpgrade,
}: {
  children: React.ReactNode;
  onUpgrade: () => void;
}) {
  return (
    <div className="settings-notice">
      <ShellIcon icon={Lock} className="settings-notice__icon" />
      <p className="settings-notice__text">{children}</p>
      <Button size="sm" onClick={onUpgrade}>
        Upgrade
      </Button>
    </div>
  );
}
