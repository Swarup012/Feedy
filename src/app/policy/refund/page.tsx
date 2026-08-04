import React from "react";
import Link from "next/link";

export default function RefundPolicyPage() {
  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 py-10 lg:py-12">
      <div className="container max-w-3xl mx-auto px-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-5 md:p-8">
          
          <div className="mb-5 pb-5 border-b border-slate-200 dark:border-slate-800">
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white mb-4">
              Return & Refund Policy
            </h1>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Last updated: June 15, 2026
            </p>
          </div>

          <div className="space-y-5 text-slate-600 dark:text-slate-300">
            <section>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                Refunds
              </h2>
              <p className="mb-4">
                All sales are final and no refund will be issued.
              </p>
              <p className="mb-4">
                Faddy is a subscription-based SaaS platform. As such, the following additional terms apply:
              </p>
              <ul className="list-disc pl-6 space-y-3 mb-4">
                <li>
                  All subscription fees are billed in advance on a recurring basis and are non-refundable, except where required by applicable law.
                </li>
                <li>
                  New users may access a 14-day free trial. No charges apply during the trial period. If you do not cancel before the trial ends, your chosen subscription plan will be billed automatically.
                </li>
                <li>
                  Canceling your subscription stops future billing but does not entitle you to a refund for the current billing period already paid.
                </li>
                <li>
                  All payments are processed by Paddle.com, who acts as the merchant of record for purchases made through Faddy. Refund requests may be reviewed and processed by Paddle in accordance with Paddle's Buyer Terms, available at <a href="https://www.paddle.com/legal/checkout-buyer-terms" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">https://www.paddle.com/legal/checkout-buyer-terms</a>.
                </li>
                <li>
                  In cases of duplicate charges, billing errors, or unauthorized transactions, please contact us at <a href="mailto:support@faddy.site" className="text-blue-600 dark:text-blue-400 hover:underline">support@faddy.site</a> within 7 days of the charge for review.
                </li>
                <li>
                  Approved refunds, if any, will be processed to the original payment method within 5-10 business days.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                Questions
              </h2>
              <p className="mb-4">
                If you have any questions concerning our return policy, please contact us at:
              </p>
              <p>
                <a href="mailto:support@faddy.site" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
                  support@faddy.site
                </a>
              </p>
            </section>
          </div>

          <div className="mt-10 pt-5 border-t border-slate-200 dark:border-slate-800 text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Powered by <span className="font-semibold text-slate-700 dark:text-slate-300">Faddy</span>
            </p>
          </div>
          
        </div>
      </div>
    </main>
  );
}
