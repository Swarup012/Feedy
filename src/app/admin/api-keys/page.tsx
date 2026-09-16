'use client';

import { useState, useEffect, useCallback } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { apiKeyService, ApiKey, ApiKeyCreated } from '@/services/apiKeyService';
import { ApiKeyFormDialog } from '@/components/api-keys/ApiKeyFormDialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { isPlanUpgradeRequired } from '@/lib/api';
import { timeAgo } from '@/lib/utils';
import { Trash2, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { ApiKeyScope } from '@/services/apiKeyService';

function formatScopeLabel(scope: ApiKeyScope): string {
  const [resource, action] = scope.split(':');
  return `${resource.charAt(0).toUpperCase() + resource.slice(1)} \u00B7 ${action.charAt(0).toUpperCase() + action.slice(1)}`;
}

export default function ApiKeysPage() {
  const { toast } = useToast();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<ApiKey | null>(null);
  const [revoking, setRevoking] = useState(false);

  const loadKeys = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiKeyService.listKeys();
      setKeys(data);
    } catch (err: any) {
      if (!isPlanUpgradeRequired(err)) {
        toast({ title: 'Failed to load API keys', variant: 'destructive' });
      }
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadKeys();
  }, [loadKeys]);

  const handleCreated = (key: ApiKeyCreated) => {
    setKeys((prev) => [key, ...prev]);
  };

  const handleRevoke = async () => {
    if (!revokeTarget) return;
    setRevoking(true);
    try {
      await apiKeyService.revokeKey(revokeTarget.id);
      setKeys((prev) => prev.filter((k) => k.id !== revokeTarget.id));
      toast({ title: 'API key revoked' });
    } catch (err: any) {
      toast({
        title: 'Failed to revoke key',
        description: err?.response?.data?.message || err.message,
        variant: 'destructive',
      });
    } finally {
      setRevoking(false);
      setRevokeTarget(null);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['owner', 'admin']}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">API Keys</h2>
            <p className="text-sm text-muted-foreground">
              Manage keys for programmatic access to the Faddy REST API.
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/admin/api-docs" target="_blank">
              <Button variant="outline" size="sm" className="gap-1.5">
                <ExternalLink className="h-3.5 w-3.5" />
                API Docs
              </Button>
            </Link>
            <Button size="sm" className="gap-1.5" onClick={() => setFormOpen(true)}>
              Create New Key
            </Button>
          </div>
        </div>

        {loading ? (
          <Card>
            <CardContent className="p-0">
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                Loading API keys...
              </div>
            </CardContent>
          </Card>
        ) : keys.length > 0 && (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Key</TableHead>
                    <TableHead>Scopes</TableHead>
                    <TableHead>Environment</TableHead>
                    <TableHead>Last Used</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {keys.map((key) => (
                    <TableRow key={key.id}>
                      <TableCell className="font-medium">{key.name}</TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                          {key.key_prefix}...
                        </code>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {key.scopes.map((s) => (
                            <Badge key={s} variant="outline" className="text-xs">
                              {formatScopeLabel(s)}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={key.environment === 'live' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {key.environment}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {key.last_used_at ? timeAgo(key.last_used_at) : 'Never'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {timeAgo(key.created_at)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          onClick={() => setRevokeTarget(key)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        <ApiKeyFormDialog
          open={formOpen}
          onClose={() => setFormOpen(false)}
          onCreated={handleCreated}
        />

        <AlertDialog open={!!revokeTarget} onOpenChange={() => setRevokeTarget(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Revoke API Key</AlertDialogTitle>
              <AlertDialogDescription>
                This will immediately invalidate <strong>{revokeTarget?.name}</strong>. Any
                applications using this key will stop working.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleRevoke}
                disabled={revoking}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {revoking ? 'Revoking...' : 'Revoke Key'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </ProtectedRoute>
  );
}
