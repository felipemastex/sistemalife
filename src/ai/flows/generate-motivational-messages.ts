'use server';

/**
 * @fileOverview A motivational message generator AI agent.
 *
 * - generateMotivationalMessage - A function that generates personalized motivational messages.
 * - GenerateMotivationalMessageInput - The input type for the generateMotivationalMessage function.
 * - GenerateMotivationalMessageOutput - The return type for the generateMotivationalMessage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateMotivationalMessageInputSchema = z.object({
  category: z
    .string()
    .describe(
      'The category for the motivational message (fitness, health, finance, etc.).'
    ),
  userName: z.string().describe('The name of the user.'),
});
export type GenerateMotivationalMessageInput = z.infer<
  typeof GenerateMotivationalMessageInputSchema
>;

const GenerateMotivationalMessageOutputSchema = z.object({
  message: z.string().describe('The personalized motivational message.'),
});
export type GenerateMotivationalMessageOutput = z.infer<
  typeof GenerateMotivationalMessageOutputSchema
>;

export async function generateMotivationalMessage(
  input: GenerateMotivationalMessageInput
): Promise<GenerateMotivationalMessageOutput> {
  return generateMotivationalMessageFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateMotivationalMessagePrompt',
  input: {schema: GenerateMotivationalMessageInputSchema},
  output: {schema: GenerateMotivationalMessageOutputSchema},
  prompt: `You are a motivational expert. Generate a personalized motivational message for {{userName}} in the category of {{category}}. The message should be encouraging and inspiring.`,
});

const generateMotivationalMessageFlow = ai.defineFlow(
  {
    name: 'generateMotivationalMessageFlow',
    inputSchema: GenerateMotivationalMessageInputSchema,
    outputSchema: GenerateMotivationalMessageOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
