'use server';

/**
 * @fileOverview This file defines a Genkit flow to suggest similar feedback items using AI.
 *
 * The flow takes a feedback item's title and description as input, uses AI to find similar feedback,
 * and returns a list of similar feedback item IDs.
 *
 * - suggestSimilarFeedback - The main function that triggers the flow.
 * - SuggestSimilarFeedbackInput - The input type for the suggestSimilarFeedback function.
 * - SuggestSimilarFeedbackOutput - The return type for the suggestSimilarFeedback function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestSimilarFeedbackInputSchema = z.object({
  feedbackTitle: z.string().describe('The title of the feedback item.'),
  feedbackDescription: z.string().describe('The description of the feedback item.'),
});

export type SuggestSimilarFeedbackInput = z.infer<typeof SuggestSimilarFeedbackInputSchema>;

const SuggestSimilarFeedbackOutputSchema = z.object({
  similarFeedbackIds: z.array(z.string()).describe('An array of IDs of similar feedback items.'),
});

export type SuggestSimilarFeedbackOutput = z.infer<typeof SuggestSimilarFeedbackOutputSchema>;

export async function suggestSimilarFeedback(
  input: SuggestSimilarFeedbackInput
): Promise<SuggestSimilarFeedbackOutput> {
  return suggestSimilarFeedbackFlow(input);
}

const suggestSimilarFeedbackPrompt = ai.definePrompt({
  name: 'suggestSimilarFeedbackPrompt',
  input: {schema: SuggestSimilarFeedbackInputSchema},
  output: {schema: SuggestSimilarFeedbackOutputSchema},
  prompt: `You are an AI assistant helping to identify similar feedback items in a system.

  Given the title and description of a feedback item, your task is to identify potential duplicate feedback items that have similar meanings or intentions.
  Return a list of feedback IDs that you believe are similar to the provided feedback item.
  Make sure to return empty array instead of null if there are no similar feedback items.

  Title: {{{feedbackTitle}}}
  Description: {{{feedbackDescription}}}
  `,
});

const suggestSimilarFeedbackFlow = ai.defineFlow(
  {
    name: 'suggestSimilarFeedbackFlow',
    inputSchema: SuggestSimilarFeedbackInputSchema,
    outputSchema: SuggestSimilarFeedbackOutputSchema,
  },
  async input => {
    const {output} = await suggestSimilarFeedbackPrompt(input);
    return output!;
  }
);
