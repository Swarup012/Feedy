'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import customDomainService from '@/services/customDomainService';
import { 
  Globe, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertTriangle,
  Copy,
  Trash2,
  RefreshCw,
  ExternalLink
} from 'lucide-react';

interface CustomDomainSettingsProps {
  organizationId: string;
}

interface CustomDomain {
  id: string;
  domain: string;
  verification_token: string;
  is_verified: boolean;
  ssl_status: string;
  status: string;
  created_at: string;
  verified_at?: string;
  dns_records?: any[];
}

export function CustomDomainSettings({ organizationId }: CustomDomainSettingsProps) {
  const { toast } = useToast();
  const [domain, setDomain] = useState('');
  const [customDomain, setCustomDomain] = useState<CustomDomain | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadCustomDomain();
  }, [organizationId]);

  const loadCustomDomain = async () => {
    try {
      const data = await customDomainService.getDomain();
      setCustomDomain(data);
    } catch (error: any) {
      // Silently handle all errors — just show the add domain form
      console.error('Custom domain load error (non-critical):', error?.response?.status || error?.message);
      setCustomDomain(null);
    } finally {
      setInitialLoading(false);
    }
  };

  const handleAddDomain = async () => {
    if (!domain.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a domain',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const data = await customDomainService.addDomain(domain.toLowerCase());
      setCustomDomain(data);
      setDomain('');
      toast({
        title: 'Success',
        description: 'Custom domain added successfully. Please verify ownership.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to add custom domain',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyDomain = async () => {
    if (!customDomain) return;

    setVerifying(true);
    try {
      const data = await customDomainService.verifyDomain(customDomain.id);
      setCustomDomain(data);
      toast({
        title: 'Success',
        description: 'Domain verified successfully! SSL certificate is being generated.',
      });
    } catch (error: any) {
      toast({
        title: 'Verification Failed',
        description: error.response?.data?.error || 'Please check your DNS records and try again',
        variant: 'destructive',
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleDeleteDomain = async () => {
    if (!customDomain || !confirm('Are you sure you want to delete this custom domain?')) return;

    setDeleting(true);
    try {
      await customDomainService.deleteDomain(customDomain.id);
      setCustomDomain(null);
      toast({
        title: 'Success',
        description: 'Custom domain deleted successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to delete custom domain',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied!',
      description: 'Copied to clipboard',
    });
  };

  const getStatusBadge = (status: string, sslStatus?: string) => {
    if (status === 'active' && sslStatus === 'active') {
      return <Badge className="bg-green-500"><CheckCircle2 className="w-3 h-3 mr-1" /> Active</Badge>;
    }
    if (status === 'active' && sslStatus === 'pending') {
      return <Badge className="bg-blue-500"><Clock className="w-3 h-3 mr-1" /> Generating SSL</Badge>;
    }
    if (status === 'failed' || sslStatus === 'failed') {
      return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Failed</Badge>;
    }
    return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
  };

  if (initialLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="flex items-center gap-2 text-gray-500">
            <Globe className="w-5 h-5 animate-pulse" />
            <span>Loading custom domain settings...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Custom Domain
            </CardTitle>
            <CardDescription>
              Use your own subdomain instead of *.faddy.site
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!customDomain ? (
          <div className="space-y-4">
            <div>
              <Label htmlFor="domain">Custom Subdomain</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  id="domain"
                  placeholder="feedback.yourdomain.com"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  disabled={loading}
                />
                <Button onClick={handleAddDomain} disabled={loading}>
                  {loading ? 'Adding...' : 'Add Domain'}
                </Button>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Enter a subdomain (e.g., feedback.yourdomain.com). Root domains are not supported.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Domain Status */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-gray-500" />
                <div>
                  <div className="font-medium">{customDomain.domain}</div>
                  <div className="text-sm text-gray-500">
                    {customDomain.is_verified ? 'Verified' : 'Awaiting verification'}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(customDomain.status, customDomain.ssl_status)}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDeleteDomain}
                  disabled={deleting}
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            </div>

            {/* DNS Setup Instructions */}
            {!customDomain.is_verified && customDomain.dns_records && (
              <Alert>
                <AlertTriangle className="w-4 h-4" />
                <AlertDescription>
                  <div className="space-y-4 mt-2">
                    <p className="font-medium">Add these DNS records to verify ownership:</p>
                    
                    {customDomain.dns_records.map((record, index) => (
                      <div key={index} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{record.type} Record</span>
                          <Badge variant="outline">{record.ttl}s TTL</Badge>
                        </div>
                        <div className="space-y-1">
                          <div className="text-xs text-gray-500">Name:</div>
                          <div className="flex items-center gap-2">
                            <code className="text-sm bg-white dark:bg-gray-900 px-2 py-1 rounded flex-1">
                              {record.name}
                            </code>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(record.name)}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-xs text-gray-500">Value:</div>
                          <div className="flex items-center gap-2">
                            <code className="text-sm bg-white dark:bg-gray-900 px-2 py-1 rounded flex-1 break-all">
                              {record.value}
                            </code>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(record.value)}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500">{record.description}</p>
                      </div>
                    ))}

                    <Button onClick={handleVerifyDomain} disabled={verifying} className="w-full">
                      <RefreshCw className={`w-4 h-4 mr-2 ${verifying ? 'animate-spin' : ''}`} />
                      {verifying ? 'Verifying...' : 'Verify Domain'}
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Success Message */}
            {customDomain.is_verified && customDomain.ssl_status === 'active' && (
              <Alert className="border-green-500 bg-green-50 dark:bg-green-900/20">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-medium text-green-600">Your custom domain is active!</p>
                    <p className="text-sm">
                      Your feedback board is now available at{' '}
                      <a
                        href={`https://${customDomain.domain}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium underline inline-flex items-center gap-1"
                      >
                        {customDomain.domain}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </p>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Info Section */}
        <div className="text-sm text-gray-500 space-y-1 pt-4 border-t">
          <p>• Only subdomains are supported (e.g., feedback.yourdomain.com)</p>
          <p>• Free SSL certificate included</p>
          <p>• DNS changes may take up to 48 hours to propagate</p>
          <p>• Pro plan allows 1 custom domain</p>
        </div>
      </CardContent>
    </Card>
  );
}
