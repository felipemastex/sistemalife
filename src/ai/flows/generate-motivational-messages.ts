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
  userName: z.string().describe('The name of the user.'),
  profileData: z.string().describe('JSON string of user profile data')
});
export type GenerateMotivationalMessageInput = z.infer<
  typeof GenerateMotivationalMessageInputSchema
>;

const GenerateMotivationalMessageOutputSchema = z.object({
  message: z.string().describe('The personalized motivational message from the system.'),
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
  prompt: `You are the 'System' from a real-life RPG. The user is {{userName}}.
  Their profile data is: {{profileData}}.
  Provide a short, analytical, and motivating status update.
  Analyze their data and provide a tactical insight.
  Example: "Analysis complete. User's XP gain is nominal. Recommend focusing on high-yield missions to accelerate leveling."`,
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
