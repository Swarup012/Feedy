'use server';

/**
 * @fileOverview An AI agent that automatically categorizes new feedback submissions.
 *
 * - categorizeFeedback - A function that categorizes the feedback.
 * - CategorizeFeedbackInput - The input type for the categorizeFeedback function.
 * - CategorizeFeedbackOutput - The return type for the categorizeFeedback function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CategorizeFeedbackInputSchema = z.object({
  title: z.string().describe('The title of the feedback submission.'),
  description: z.string().describe('The description of the feedback submission.'),
});
export type CategorizeFeedbackInput = z.infer<typeof CategorizeFeedbackInputSchema>;

const CategorizeFeedbackOutputSchema = z.object({
  category: z.string().describe('The predicted category of the feedback (e.g., Feature Request, Bug, Improvement).'),
  priority: z.string().describe('The predicted priority of the feedback (e.g., High, Medium, Low).'),
  sentiment: z.string().describe('The predicted sentiment of the feedback (e.g., Positive, Negative, Neutral).'),
});
export type CategorizeFeedbackOutput = z.infer<typeof CategorizeFeedbackOutputSchema>;

export async function categorizeFeedback(input: CategorizeFeedbackInput): Promise<CategorizeFeedbackOutput> {
  return categorizeFeedbackFlow(input);
}

const categorizeFeedbackPrompt = ai.definePrompt({
  name: 'categorizeFeedbackPrompt',
  input: {schema: CategorizeFeedbackInputSchema},
  output: {schema: CategorizeFeedbackOutputSchema},
  prompt: `You are an AI assistant that categorizes and prioritizes user feedback.

  Given the title and description of a feedback submission, predict the category, priority, and sentiment of the feedback.

  Title: {{{title}}}
  Description: {{{description}}}

  Ensure that the category is one of the following: Feature Request, Bug, Improvement, Integration
  Ensure that the priority is one of the following: High, Medium, Low
  Ensure that the sentiment is one of the following: Positive, Negative, Neutral

  Return the category, priority, and sentiment in a JSON format.
  `,
});

const categorizeFeedbackFlow = ai.defineFlow(
  {
    name: 'categorizeFeedbackFlow',
    inputSchema: CategorizeFeedbackInputSchema,
    outputSchema: CategorizeFeedbackOutputSchema,
  },
  async input => {
    const {output} = await categorizeFeedbackPrompt(input);
    return output!;
  }
);
