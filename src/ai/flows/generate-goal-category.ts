'use server';
/**
 * @fileOverview Um agente de IA que sugere uma categoria para uma meta.
 *
 * - generateGoalCategory - Uma função que analisa o nome de uma meta e sugere uma categoria a partir de uma lista.
 * - GenerateGoalCategoryInput - O tipo de entrada para a função.
 * - GenerateGoalCategoryOutput - O tipo de retorno para a função.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateGoalCategoryInputSchema = z.object({
  goalName: z.string().describe('O nome da meta inserida pelo utilizador.'),
  categories: z.array(z.string()).describe('A lista de categorias pré-definidas para escolher.'),
});
export type GenerateGoalCategoryInput = z.infer<typeof GenerateGoalCategoryInputSchema>;

const GenerateGoalCategoryOutputSchema = z.object({
  category: z.string().describe('A categoria sugerida que melhor se adequa à meta.'),
});
export type GenerateGoalCategoryOutput = z.infer<typeof GenerateGoalCategoryOutputSchema>;

export async function generateGoalCategory(
  input: GenerateGoalCategoryInput
): Promise<GenerateGoalCategoryOutput> {
  return generateGoalCategoryFlow(input);
}

const generateGoalCategoryFlow = ai.defineFlow(
  {
    name: 'generateGoalCategoryFlow',
    inputSchema: GenerateGoalCategoryInputSchema,
    outputSchema: GenerateGoalCategoryOutputSchema,
  },
  async (input) => {

    const prompt = `Analise o nome da meta a seguir e escolha a categoria mais apropriada da lista fornecida.

Meta: "${input.goalName}"

Categorias disponíveis:
${input.categories.map(c => `- ${c}`).join('\n')}

Responda APENAS com a categoria escolhida da lista. Não adicione nenhuma outra palavra ou pontuação.`;

    const {output} = await ai.generate({
        prompt: prompt,
        model: 'googleai/gemini-2.5-flash',
        output: { schema: GenerateGoalCategoryOutputSchema },
    });
    return output!;
  }
);
