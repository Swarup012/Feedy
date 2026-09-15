'use client';

import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import { useToast } from '@/hooks/use-toast';
import { apiKeyService, ApiKeyCreated, ApiKeyScope } from '@/services/apiKeyService';
import { Copy, Check, AlertTriangle } from 'lucide-react';

interface ApiKeyFormDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: (key: ApiKeyCreated) => void;
}

type ResourcePermission = {
  resource: string;
  label: string;
  actions: { action: string; scope: ApiKeyScope }[];
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
];

function formatScopeLabel(scope: ApiKeyScope): string {
  const [resource, action] = scope.split(':');
  return `${resource.charAt(0).toUpperCase() + resource.slice(1)} · ${action.charAt(0).toUpperCase() + action.slice(1)}`;
}

export function ApiKeyFormDialog({ open, onClose, onCreated }: ApiKeyFormDialogProps) {
  const { toast } = useToast();

  const [name, setName] = useState('');
  const [selectedScopes, setSelectedScopes] = useState<Set<ApiKeyScope>>(new Set());
  const [environment, setEnvironment] = useState<'live' | 'test'>('live');
  const [saving, setSaving] = useState(false);

  const [createdKey, setCreatedKey] = useState<ApiKeyCreated | null>(null);
  const [copied, setCopied] = useState(false);

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
        // If unchecking posts:write, also uncheck posts:read (implied)
        if (scope === 'posts:write') {
          next.delete('posts:read');
        }
      } else {
        next.add(scope);
        // If checking posts:write, auto-check posts:read (write implies read)
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
            <DialogDescription>
              Copy your key now. You will not be able to see it again.
            </DialogDescription>
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
          <DialogDescription>
            Generate a new key for programmatic access to the Faddy API.
          </DialogDescription>
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

          <div className="space-y-2">
            <Label>Permissions</Label>
            <div className="rounded-md border p-3 space-y-3">
              {RESOURCES.map((res) => (
                <div key={res.resource} className="space-y-1.5">
                  <p className="text-sm font-medium text-muted-foreground">{res.label}</p>
                  <div className="flex gap-4 pl-1">
                    {res.actions.map((act) => {
                      const isChecked = selectedScopes.has(act.scope);
                      // If this is posts:read and posts:write is checked, it's auto-implied
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
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Environment</Label>
            <Select value={environment} onValueChange={(v) => setEnvironment(v as any)}>
              <SelectTrigger>
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
