'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, CreditCard, CheckCircle, Clock, XCircle } from 'lucide-react';
import { Invoice } from '@/services/paddleService';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface InvoiceHistoryProps {
  invoices: Invoice[];
}

export function InvoiceHistory({ invoices }: InvoiceHistoryProps) {
  const { toast } = useToast();

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

  const formatAmount = (amount: number, currency: string) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="h-4 w-4 text-blue-600" />;
      case 'open':
        return <Clock className="h-4 w-4 text-gray-500" />;
      case 'void':
      case 'uncollectible':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const handleDownload = async (invoiceId: string) => {
    try {
      const response = await api.get(`/api/paddle/invoices/${invoiceId}/download`, {
        responseType: 'blob',
      });

      const contentType = response.headers['content-type'];
      if (contentType && contentType.includes('application/json')) {
        const errorText = await response.data.text();
        const errorData = JSON.parse(errorText);
        throw new Error(errorData.error || errorData.message || 'Failed to download invoice');
      }

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${invoiceId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      toast({
        title: 'Download failed',
        description: error.message || 'Could not download invoice. Try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-lg font-switzer font-semibold text-gray-900 dark:text-white mb-4">
          Payment History
        </h3>

        {invoices.length > 0 ? (
          <div className="space-y-3">
            {invoices.map((invoice) => (
              <div
                key={invoice.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {getStatusIcon(invoice.status)}
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatDate(invoice.date.toString())}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">{invoice.status}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {formatAmount(invoice.amount, invoice.currency)}
                  </p>
                  {invoice.hasInvoice !== false && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => handleDownload(invoice.id)}
                      title="Download invoice"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
              <CreditCard className="h-6 w-6 text-gray-400" />
            </div>
            <p className="text-sm text-gray-500">No payments yet</p>
            <p className="text-xs text-gray-400 mt-1">
              Invoices will appear here after your first billing cycle
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
