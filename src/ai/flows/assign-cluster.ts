'use server';

/**
 * @fileOverview Genkit flow for AI-based cluster assignment.
 *
 * Given a new post and the existing clusters on its board, determines
 * which cluster the post belongs to — or creates a new cluster key.
 *
 * - assignCluster         - Main exported function
 * - AssignClusterInput    - Input type
 * - AssignClusterOutput   - Output type
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AssignClusterInputSchema = z.object({
  title: z.string().describe('Title of the new post.'),
  description: z.string().optional().describe('Description of the new post (may be empty).'),
  existingClusters: z
    .array(z.string())
    .describe(
      'List of existing cluster_key values already present on this board (e.g. ["login_issues", "slow_performance"]). May be empty for the first post.'
    ),
});
export type AssignClusterInput = z.infer<typeof AssignClusterInputSchema>;

const AssignClusterOutputSchema = z.object({
  cluster_key: z
    .string()
    .describe(
      'The assigned cluster key in snake_case (e.g. "login_issues"). ' +
        'If the post fits an existing cluster, return that exact key. ' +
        'If it is a new topic, return a concise snake_case key (2–4 words, no spaces).'
    ),
  is_new_cluster: z
    .boolean()
    .describe('True if this is a brand-new cluster key not in the existing list.'),
  confidence: z
    .number()
    .describe('Confidence score from 0.0 to 1.0 for this assignment.'),
});
export type AssignClusterOutput = z.infer<typeof AssignClusterOutputSchema>;

export async function assignCluster(
  input: AssignClusterInput
): Promise<AssignClusterOutput> {
  return assignClusterFlow(input);
}

const assignClusterPrompt = ai.definePrompt({
  name: 'assignClusterPrompt',
  input: { schema: AssignClusterInputSchema },
  output: { schema: AssignClusterOutputSchema },
  prompt: `You are a feedback categorization expert. Your job is to group user feedback posts into semantic clusters.

A "cluster_key" is a short snake_case identifier that describes a topic group (e.g. "login_issues", "slow_performance", "dark_mode_request", "billing_problems").

Rules:
- If the post clearly fits one of the existing clusters, return that exact cluster_key.
- Aggressively consolidate synonyms! If an existing cluster means the same thing (e.g. "payment_issue" vs "payment_gateway_issue", or "dark_mode" vs "night_mode"), you MUST use the existing cluster_key.
- Only create a new concise snake_case key (2–4 words) if there is absolutely no semantic match (similarity < 60%).
- cluster_key must be lowercase, words separated by underscores, no special characters.
- Keep it specific enough to be meaningful, but broad enough to group similar posts.
- Prefer merging into existing clusters over creating new ones. Avoid creating fragmented micro-clusters.

Post Title: {{{title}}}
{{#if description}}Post Description: {{{description}}}{{/if}}

Existing clusters on this board:
{{#if existingClusters.length}}
{{#each existingClusters}}- {{this}}
{{/each}}
{{else}}
(none — this is the first post on this board)
{{/if}}

Return a JSON object with cluster_key, is_new_cluster, and confidence.`,
});

const assignClusterFlow = ai.defineFlow(
  {
    name: 'assignClusterFlow',
    inputSchema: AssignClusterInputSchema,
    outputSchema: AssignClusterOutputSchema,
  },
  async (input) => {
    const { output } = await assignClusterPrompt(input);
    return output!;
  }
);
