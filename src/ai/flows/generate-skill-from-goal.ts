'use server';
/**
 * @fileOverview Um agente de IA que cria uma nova habilidade com base numa meta do utilizador.
 *
 * - generateSkillFromGoal - Gera um nome, descrição e categoria para uma habilidade.
 * - GenerateSkillFromGoalInput - O tipo de entrada para a função.
 * - GenerateSkillFromGoalOutput - O tipo de retorno para a função.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateSkillFromGoalInputSchema = z.object({
  goalName: z.string().describe('O nome da meta do utilizador.'),
  goalDescription: z.string().describe('A descrição detalhada (SMART) da meta do utilizador.'),
  existingCategories: z.array(z.string()).describe('A lista de categorias de habilidades existentes para consistência.'),
});
export type GenerateSkillFromGoalInput = z.infer<typeof GenerateSkillFromGoalInputSchema>;

const GenerateSkillFromGoalOutputSchema = z.object({
  skillName: z.string().describe('O nome conciso e inspirador para a habilidade relacionada (ex: "Programação Python", "Corrida de Resistência").'),
  skillDescription: z.string().describe('Uma breve descrição do que esta habilidade representa.'),
  skillCategory: z.string().describe('A categoria que melhor se adequa a esta habilidade, escolhida a partir da lista de categorias existentes.'),
});
export type GenerateSkillFromGoalOutput = z.infer<typeof GenerateSkillFromGoalOutputSchema>;

export async function generateSkillFromGoal(
  input: GenerateSkillFromGoalInput
): Promise<GenerateSkillFromGoalOutput> {
  return generateSkillFromGoalFlow(input);
}

const generateSkillFromGoalFlow = ai.defineFlow(
  {
    name: 'generateSkillFromGoalFlow',
    inputSchema: GenerateSkillFromGoalInputSchema,
    outputSchema: GenerateSkillFromGoalOutputSchema,
  },
  async (input) => {
    const prompt = `
        Você é um "Arquiteto de Habilidades" num RPG da vida real. Sua tarefa é analisar a meta de um utilizador e definir a habilidade fundamental que ele irá desenvolver ao perseguir essa meta.

        Meta do Utilizador: "${input.goalName}"
        Descrição da Meta: "${input.goalDescription}"

        Categorias de Habilidades Existentes:
        ${input.existingCategories.join(', ')}

        Com base nisso, gere:
        1.  **skillName**: Um nome de habilidade curto e impactante. Deve representar a essência do que está a ser aprendido ou praticado. Por exemplo, se a meta é "Aprender a cozinhar comida italiana", a habilidade pode ser "Culinária Italiana". Se a meta é "Correr uma maratona", a habilidade pode ser "Corrida de Longa Distância".
        2.  **skillDescription**: Uma descrição concisa (1 frase) que explique o que a maestria nesta habilidade significa.
        3.  **skillCategory**: Escolha a categoria MAIS APROPRIADA da lista de categorias existentes fornecida.

        Sua resposta deve ser um objeto JSON completo.
    `;

    const {output} = await ai.generate({
      prompt,
      model: 'googleai/gemini-2.5-flash',
      output: { schema: GenerateSkillFromGoalOutputSchema },
    });

    return output!;
  }
);
