'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { apiKeyService, ApiKeyCreated, ApiKeyScope } from '@/services/apiKeyService';
import { Copy, Check, AlertTriangle, ChevronDown } from 'lucide-react';

interface ApiKeyFormDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: (key: ApiKeyCreated) => void;
  /** Preselect these scopes when the dialog opens (e.g. Zapier card). */
  defaultScopes?: ApiKeyScope[];
  /** Prefill the key name when the dialog opens (e.g. "Zapier"). */
  defaultName?: string;
}

type ResourcePermission = {
  resource: string;
  label: string;
  actions: { action: string; scope: ApiKeyScope }[];
  note?: string;
};

const RESOURCES: ResourcePermission[] = [
  {
    resource: 'boards',
    label: 'Boards',
    actions: [{ action: 'read', scope: 'boards:read' }],
  },
  {
    resource: 'posts',
    label: 'Posts',
    actions: [
      { action: 'read', scope: 'posts:read' },
      { action: 'write', scope: 'posts:write' },
    ],
  },
  {
    resource: 'comments',
    label: 'Comments',
    actions: [{ action: 'write', scope: 'comments:write' }],
  },
  {
    resource: 'users',
    label: 'Users',
    actions: [
      { action: 'read', scope: 'users:read' },
      { action: 'write', scope: 'users:write' },
    ],
  },
  {
    resource: 'webhooks',
    label: 'Webhooks',
    actions: [
      { action: 'read', scope: 'webhooks:read' },
      { action: 'write', scope: 'webhooks:write' },
    ],
    note: "Lets this key create webhooks that send your organization's data to the URLs it is given. Only enable for integrations you trust, like Zapier.",
  },
];

function formatScopeLabel(scope: ApiKeyScope): string {
  const [resource, action] = scope.split(':');
  return `${resource.charAt(0).toUpperCase() + resource.slice(1)} \u00B7 ${action.charAt(0).toUpperCase() + action.slice(1)}`;
}

export function ApiKeyFormDialog({ open, onClose, onCreated, defaultScopes, defaultName }: ApiKeyFormDialogProps) {
  const { toast } = useToast();

  const [name, setName] = useState('');
  const [selectedScopes, setSelectedScopes] = useState<Set<ApiKeyScope>>(new Set());
  const [environment, setEnvironment] = useState<'live' | 'test'>('live');
  const [saving, setSaving] = useState(false);

  const [createdKey, setCreatedKey] = useState<ApiKeyCreated | null>(null);
  const [copied, setCopied] = useState(false);

  // Preselect scopes when the dialog opens. Depends on the scope VALUES
  // (joined key), not the array reference — a parent re-render with an inline
  // array can never reset the user's choices while the dialog is open.
  const defaultScopesKey = defaultScopes?.join(',');
  useEffect(() => {
    if (!open || !defaultScopesKey) return;
    const preset = new Set<ApiKeyScope>(defaultScopes);
    if (preset.has('posts:write')) preset.add('posts:read'); // same implication as toggleScope
    setSelectedScopes(preset);
  }, [open, defaultScopesKey]); // eslint-disable-line react-hooks/exhaustive-deps -- defaultScopesKey IS defaultScopes' identity

  // Prefill name when the dialog opens; keyed on the string value so a
  // parent re-render never overwrites what the user has typed.
  useEffect(() => {
    if (!open || !defaultName) return;
    setName(defaultName);
  }, [open, defaultName]);

  const reset = () => {
    setName('');
    setSelectedScopes(new Set());
    setEnvironment('live');
    setCreatedKey(null);
    setCopied(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const toggleScope = (scope: ApiKeyScope) => {
    setSelectedScopes((prev) => {
      const next = new Set(prev);
      if (next.has(scope)) {
        next.delete(scope);
        if (scope === 'posts:write') {
          next.delete('posts:read');
        }
      } else {
        next.add(scope);
        if (scope === 'posts:write') {
          next.add('posts:read');
        }
      }
      return next;
    });
  };

  const scopesArray = useMemo(() => [...selectedScopes], [selectedScopes]);

  const handleCreate = async () => {
    if (!name.trim()) {
      toast({ title: 'Name is required', variant: 'destructive' });
      return;
    }
    if (scopesArray.length === 0) {
      toast({ title: 'Select at least one scope', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const result = await apiKeyService.createKey({
        name: name.trim(),
        scopes: scopesArray,
        environment,
      });
      setCreatedKey(result);
      onCreated(result);
    } catch (err: any) {
      toast({
        title: 'Failed to create API key',
        description: err?.response?.data?.message || err.message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = async () => {
    if (!createdKey?.raw_key) return;
    await navigator.clipboard.writeText(createdKey.raw_key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Post-creation: show raw key once
  if (createdKey) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>API Key Created</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <p className="text-sm text-amber-800 dark:text-amber-200">
                This is the only time you will see this key. Store it securely before closing.
              </p>
            </div>

            <div className="relative">
              <Input
                readOnly
                value={createdKey.raw_key}
                className="font-mono text-xs pr-10"
              />
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={copyToClipboard}
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>

            <div className="flex gap-2 flex-wrap">
              <Badge variant="outline">{createdKey.environment}</Badge>
              {createdKey.scopes.map((s) => (
                <Badge key={s} variant="outline">{formatScopeLabel(s)}</Badge>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button onClick={handleClose}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Creation form
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create API Key</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="key-name">Name</Label>
            <Input
              id="key-name"
              placeholder="e.g. Production Backend, CI Pipeline"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Permission — selection popup */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  aria-label="Permission"
                  className="h-9 w-full justify-between gap-1 px-3 font-normal"
                >
                  <span className="truncate">
                    Permission
                    {scopesArray.length > 0 && (
                      <span className="text-muted-foreground"> ({scopesArray.length})</span>
                    )}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-80 p-0">
                <div className="max-h-[320px] overflow-y-auto p-3 space-y-3">
                  {RESOURCES.map((res) => (
                    <div key={res.resource} className="space-y-1.5">
                      <p className="text-sm font-medium text-muted-foreground">{res.label}</p>
                      <div className="flex gap-4 pl-1">
                        {res.actions.map((act) => {
                          const isChecked = selectedScopes.has(act.scope);
                          const isImplied =
                            act.scope === 'posts:read' && selectedScopes.has('posts:write');

                          return (
                            <label
                              key={act.scope}
                              className={`flex items-center gap-1.5 text-sm cursor-pointer ${
                                isImplied ? 'opacity-60 cursor-not-allowed' : ''
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                disabled={isImplied}
                                onChange={() => toggleScope(act.scope)}
                                className="rounded border-input"
                              />
                              <span className="capitalize">{act.action}</span>
                              {isImplied && (
                                <span className="text-xs text-muted-foreground">(implied)</span>
                              )}
                            </label>
                          );
                        })}
                      </div>
                      {res.note && (
                        <p className="text-xs text-muted-foreground pl-1 leading-relaxed">{res.note}</p>
                      )}
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {/* Environment */}
            <Select value={environment} onValueChange={(v) => setEnvironment(v as any)}>
              <SelectTrigger aria-label="Environment" className="h-9 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="live">Live (Production)</SelectItem>
                <SelectItem value="test">Test (Sandbox)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>Cancel</Button>
          <Button
            onClick={handleCreate}
            disabled={saving || !name.trim() || scopesArray.length === 0}
          >
            {saving ? 'Creating...' : 'Create Key'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
