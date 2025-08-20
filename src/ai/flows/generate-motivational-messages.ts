'use server';

/**
 * @fileOverview Um agente de IA gerador de mensagens motivacionais.
 *
 * - generateMotivationalMessage - Uma função que gera mensagens motivacionais personalizadas.
 * - GenerateMotivationalMessageInput - O tipo de entrada para a função generateMotivationalMessage.
 * - GenerateMotivationalMessageOutput - O tipo de retorno para a função generateMotivationalMessage.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateMotivationalMessageInputSchema = z.object({
  userName: z.string().describe('O nome do utilizador.'),
  profileData: z.string().describe('String JSON dos dados do perfil do utilizador')
});
export type GenerateMotivationalMessageInput = z.infer<
  typeof GenerateMotivationalMessageInputSchema
>;

const GenerateMotivationalMessageOutputSchema = z.object({
  message: z.string().describe('A mensagem motivacional personalizada do sistema.'),
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
  prompt: `Você é o 'Sistema' de um RPG da vida real. O utilizador é {{userName}}.
  Os dados do perfil dele são: {{profileData}}.
  Forneça uma atualização de estado curta, analítica e motivadora.
  Analise os dados e forneça uma visão tática.
  Exemplo: "Análise completa. O ganho de XP do utilizador é nominal. Recomenda-se focar em missões de alto rendimento para acelerar o nivelamento."`,
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
