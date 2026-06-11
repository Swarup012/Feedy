'use server';

/**
 * @fileOverview Genkit flow for generating an AI label and summary for a cluster.
 *
 * Takes a sample of posts from a cluster and produces:
 *  - a short human-readable label  (e.g. "Login & Authentication Issues")
 *  - a 1–2 sentence summary of what the cluster is about
 *
 * - labelCluster         - Main exported function
 * - LabelClusterInput    - Input type
 * - LabelClusterOutput   - Output type
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SamplePostSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
});

const LabelClusterInputSchema = z.object({
  cluster_key: z
    .string()
    .describe('The raw cluster key, e.g. "login_issues". Used as context.'),
  sample_posts: z
    .array(SamplePostSchema)
    .min(1)
    .max(10)
    .describe('A sample of up to 10 posts from this cluster.'),
});
export type LabelClusterInput = z.infer<typeof LabelClusterInputSchema>;

const LabelClusterOutputSchema = z.object({
  label: z
    .string()
    .describe(
      'A short, human-readable label for this cluster (3–6 words, title-cased). ' +
        'Example: "Login & Authentication Issues"'
    ),
  summary: z
    .string()
    .describe(
      'A concise 1–2 sentence summary of what the feedback in this cluster is about. ' +
        'Write from the perspective of the product team reading a report.'
    ),
  severity_level: z
    .enum(['low', 'medium', 'high', 'critical'])
    .describe(
      'The severity level of the cluster based on the business impact of the posts.'
    ),
});
export type LabelClusterOutput = z.infer<typeof LabelClusterOutputSchema>;

export async function labelCluster(
  input: LabelClusterInput
): Promise<LabelClusterOutput> {
  return labelClusterFlow(input);
}

const labelClusterPrompt = ai.definePrompt({
  name: 'labelClusterPrompt',
  input: { schema: LabelClusterInputSchema },
  output: { schema: LabelClusterOutputSchema },
  prompt: `You are a product analyst summarizing user feedback clusters for a product team.

Cluster key: {{{cluster_key}}}

Sample posts from this cluster:
{{#each sample_posts}}
- Title: {{this.title}}{{#if this.description}}
  Description: {{this.description}}{{/if}}
{{/each}}

Task:
1. Generate a short, human-readable LABEL for this cluster (3–6 words, Title Case). It should be more descriptive than the raw cluster key. Example: "Login & Authentication Issues", "Performance & Speed Problems", "Dark Mode UI Requests".
2. Write a 1–2 sentence SUMMARY of what users are reporting in this cluster. Be specific and actionable for a product team.
3. Determine the SEVERITY_LEVEL of the cluster. If they describe business-breaking bugs, data loss, or payment failures, return 'critical'. If it's a major workflow blocker, return 'high'. If it's a minor bug or usability issue, return 'medium'. If it's a feature request (like Dark Mode) or minor UI tweak, return 'low'.

Return a JSON object with "label", "summary", and "severity_level".`,
});

const labelClusterFlow = ai.defineFlow(
  {
    name: 'labelClusterFlow',
    inputSchema: LabelClusterInputSchema,
    outputSchema: LabelClusterOutputSchema,
  },
  async (input) => {
    const { output } = await labelClusterPrompt(input);
    return output!;
  }
);
