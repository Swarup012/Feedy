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

export function OrganizationSwitcher() {
  const { organization, organizations, loading, switchOrganization } = useOrganization();
  const { toast } = useToast();
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
        className="min-w-[200px] justify-between"
        disabled
        aria-hidden="true"
        tabIndex={-1}
      >
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          <div className="h-4 w-24 animate-pulse rounded bg-muted" />
        </div>
        <ChevronDown className="h-4 w-4 opacity-50" />
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
          className="flex items-center gap-2 min-w-[200px] justify-between"
          disabled={switching}
        >
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            <span className="truncate">{organization.name}</span>
          </div>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[250px]">
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
              <Check className="h-4 w-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
