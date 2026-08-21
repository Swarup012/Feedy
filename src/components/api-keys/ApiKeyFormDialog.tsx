'use client';

import { useState } from 'react';
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
import { apiKeyService, ApiKeyCreated } from '@/services/apiKeyService';
import { Copy, Check, AlertTriangle } from 'lucide-react';

interface ApiKeyFormDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: (key: ApiKeyCreated) => void;
}

export function ApiKeyFormDialog({ open, onClose, onCreated }: ApiKeyFormDialogProps) {
  const { toast } = useToast();

  const [name, setName] = useState('');
  const [scopes, setScopes] = useState<'read' | 'write'>('read');
  const [environment, setEnvironment] = useState<'live' | 'test'>('live');
  const [saving, setSaving] = useState(false);

  // Secret display (shown once after creation)
  const [createdKey, setCreatedKey] = useState<ApiKeyCreated | null>(null);
  const [copied, setCopied] = useState(false);

  const reset = () => {
    setName('');
    setScopes('read');
    setEnvironment('live');
    setCreatedKey(null);
    setCopied(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      toast({ title: 'Name is required', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const keyScopes = scopes === 'write' ? ['read', 'write'] : ['read'];
      const result = await apiKeyService.createKey({
        name: name.trim(),
        scopes: keyScopes,
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

            <div className="flex gap-2">
              <Badge variant="outline">{createdKey.environment}</Badge>
              <Badge variant="outline">{createdKey.scopes.join(', ')}</Badge>
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
            <Label>Scope</Label>
            <Select value={scopes} onValueChange={(v) => setScopes(v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="read">Read only</SelectItem>
                <SelectItem value="write">Read + Write</SelectItem>
              </SelectContent>
            </Select>
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
          <Button onClick={handleCreate} disabled={saving || !name.trim()}>
            {saving ? 'Creating...' : 'Create Key'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
