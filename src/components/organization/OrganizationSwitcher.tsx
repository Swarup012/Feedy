'use client';

import { useState } from 'react';
import { useOrganization } from '@/context/OrganizationContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Building2, Check, ChevronDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useIsNarrow } from '@/hooks/useIsNarrow';
import { ShellIcon } from '@/components/shell/ShellIcon';
import { cn } from '@/lib/utils';

export function OrganizationSwitcher({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
} = {}) {
  const { organization, organizations, loading, switchOrganization } = useOrganization();
  const { toast } = useToast();
  const isNarrow = useIsNarrow(1024);
  const compactMode = compact && !isNarrow;
  const [switching, setSwitching] = useState(false);

  const handleSwitch = async (orgId: string) => {
    if (orgId === organization?.id) return;

    try {
      setSwitching(true);
      await switchOrganization(orgId);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to switch organization',
        variant: 'destructive',
      });
      setSwitching(false);
    }
  };

  // Fixed-size placeholder while org loads — matches the real button's
  // min-w so the navbar doesn't shift when the switcher appears (CLS).
  if (loading) {
    return (
      <Button
        variant="outline"
        className={cn(
          "min-w-0 max-w-[12rem] sm:min-w-[10rem] sm:max-w-[14rem] justify-between",
          className
        )}
        disabled
        aria-hidden="true"
        tabIndex={-1}
      >
        <div className="admin-org__identity flex items-center gap-2">
          <ShellIcon icon={Building2} className="admin-org__icon" />
          <div className="admin-org__name h-4 w-24 animate-pulse motion-reduce:animate-none rounded bg-muted" />
        </div>
        <ShellIcon icon={ChevronDown} className="admin-org__chevron opacity-50" />
      </Button>
    );
  }

  if (!organization || organizations.length === 0) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "flex items-center gap-2 min-w-0 max-w-[12rem] sm:min-w-[10rem] sm:max-w-[14rem] justify-between",
            className
          )}
          disabled={switching}
          aria-label={`Switch organization: ${organization.name}`}
        >
          <div className="admin-org__identity flex items-center gap-2">
            <ShellIcon icon={Building2} className="admin-org__icon" />
            <span className="admin-org__name truncate">{organization.name}</span>
          </div>
          <ShellIcon icon={ChevronDown} className="admin-org__chevron opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side={compactMode ? 'right' : 'bottom'}
        align="start"
        sideOffset={6}
        collisionPadding={8}
        className="w-[250px] !z-[calc(var(--z-sticky-nav,300)+10)]"
      >
        <DropdownMenuLabel>Switch Organization</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {organizations.map((org) => (
          <DropdownMenuItem
            key={org.id}
            onClick={() => handleSwitch(org.id)}
            className="flex items-center justify-between cursor-pointer"
          >
            <div className="flex flex-col">
              <span className="font-medium">{org.name}</span>
              <span className="text-xs text-muted-foreground">{org.role}</span>
            </div>
            {org.id === organization.id && (
              <ShellIcon icon={Check} />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
