'use server';
/**
 * @fileOverview Um agente de IA que transforma uma meta simples numa meta SMART completa.
 *
 * - generateSimpleSmartGoal - Gera uma meta SMART a partir de um nome.
 * - GenerateSimpleSmartGoalInput - O tipo de entrada para a função.
 * - GenerateSimpleSmartGoalOutput - O tipo de retorno para a função.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SmartGoalSchema = z.object({
  name: z.string().describe('O nome conciso e inspirador da meta.'),
  specific: z.string().describe('O detalhe Específico (Specific) da meta.'),
  measurable: z.string().describe('O detalhe Mensurável (Measurable) da meta.'),
  achievable: z.string().describe('O detalhe Atingível (Achievable) da meta.'),
  relevant: z.string().describe('O detalhe Relevante (Relevant) da meta.'),
  timeBound: z.string().describe('O detalhe com Prazo (Time-bound) da meta.'),
});

const GenerateSimpleSmartGoalInputSchema = z.object({
  goalName: z.string().describe('O nome da meta inserida pelo utilizador.'),
});
export type GenerateSimpleSmartGoalInput = z.infer<typeof GenerateSimpleSmartGoalInputSchema>;

const GenerateSimpleSmartGoalOutputSchema = z.object({
  refinedGoal: SmartGoalSchema.describe('A meta SMART completa e detalhada.'),
});
export type GenerateSimpleSmartGoalOutput = z.infer<typeof GenerateSimpleSmartGoalOutputSchema>;

export async function generateSimpleSmartGoal(
  input: GenerateSimpleSmartGoalInput
): Promise<GenerateSimpleSmartGoalOutput> {
  return generateSimpleSmartGoalFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateSimpleSmartGoalPrompt',
  input: {schema: GenerateSimpleSmartGoalInputSchema},
  output: {schema: GenerateSimpleSmartGoalOutputSchema},
  prompt: `Você é um coach de produtividade de elite, mestre em transformar ideias em metas acionáveis.
Sua tarefa é pegar o nome de uma meta fornecida pelo utilizador e expandi-la para uma meta SMART completa.

Meta do Utilizador: "{{goalName}}"

Seja criativo, mas realista. Crie detalhes específicos, mensuráveis, atingíveis, relevantes e com prazo para a meta. O nome final da meta ('name') deve ser uma versão refinada e inspiradora do input do utilizador.

Responda APENAS com o objeto JSON do "refinedGoal". Não adicione nenhuma outra palavra ou pontuação.
`,
});

const generateSimpleSmartGoalFlow = ai.defineFlow(
  {
    name: 'generateSimpleSmartGoalFlow',
    inputSchema: GenerateSimpleSmartGoalInputSchema,
    outputSchema: GenerateSimpleSmartGoalOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
