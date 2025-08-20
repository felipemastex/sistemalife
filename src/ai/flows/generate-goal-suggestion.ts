'use server';
/**
 * @fileOverview Um agente de IA que sugere novas metas com base no perfil do utilizador.
 *
 * - generateGoalSuggestion - Analisa o perfil e sugere novas metas.
 * - GenerateGoalSuggestionInput - O tipo de entrada para a função.
 * - GenerateGoalSuggestionOutput - O tipo de retorno para a função.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GoalSuggestionSchema = z.object({
  name: z.string().describe("O nome conciso e inspirador para a nova meta sugerida."),
  description: z.string().describe("Uma breve descrição (1-2 frases) explicando por que esta meta é uma boa sugestão para o utilizador, com base no seu perfil."),
  category: z.string().describe("A categoria que melhor se adequa a esta meta."),
});

const GenerateGoalSuggestionInputSchema = z.object({
  profile: z.string().describe("O perfil do utilizador, incluindo nível, estatísticas e títulos, como uma string JSON."),
  skills: z.string().describe("As habilidades atuais do utilizador, incluindo nomes, níveis e categorias, como uma string JSON."),
  completedGoals: z.string().optional().describe("Uma lista de metas que o utilizador já concluiu, para evitar repetições e dar contexto de sucesso."),
  existingCategories: z.array(z.string()).describe("A lista de categorias de metas existentes para garantir consistência."),
});
export type GenerateGoalSuggestionInput = z.infer<typeof GenerateGoalSuggestionInputSchema>;

const GenerateGoalSuggestionOutputSchema = z.object({
  suggestions: z.array(GoalSuggestionSchema).describe("Uma lista de 3 a 5 sugestões de novas metas personalizadas."),
});
export type GenerateGoalSuggestionOutput = z.infer<typeof GenerateGoalSuggestionOutputSchema>;


export async function generateGoalSuggestion(
  input: GenerateGoalSuggestionInput
): Promise<GenerateGoalSuggestionOutput> {
  return generateGoalSuggestionFlow(input);
}

const generateGoalSuggestionFlow = ai.defineFlow(
  {
    name: 'generateGoalSuggestionFlow',
    inputSchema: GenerateGoalSuggestionInputSchema,
    outputSchema: GenerateGoalSuggestionOutputSchema,
  },
  async (input) => {
    const prompt = `
        Você é o "Estratega do Sistema", um coach de IA especializado em desenvolvimento a longo prazo. A sua tarefa é analisar o perfil completo de um utilizador e sugerir os próximos grandes objetivos para a sua jornada.

        Dados do Utilizador:
        - Perfil: ${input.profile}
        - Habilidades Atuais: ${input.skills}
        - Metas Já Concluídas: ${input.completedGoals || 'Nenhuma ainda.'}

        Categorias de Metas Disponíveis:
        ${input.existingCategories.join(', ')}

        Com base em todos estes dados, siga as seguintes diretivas:
        1.  **Análise Holística:** Avalie as habilidades mais fortes e mais fracas do utilizador. Identifique áreas de especialização e áreas que precisam de desenvolvimento para criar um perfil mais equilibrado.
        2.  **Sinergia de Habilidades:** Sugira metas que possam complementar as habilidades existentes. Por exemplo, se o utilizador é bom em "Programação Python", sugira uma meta como "Construir um Projeto de IA Pessoal" que utilize essa habilidade.
        3.  **Desenvolvimento de Atributos:** Olhe para os atributos do perfil (força, inteligência, etc.). Sugira metas que possam fortalecer os atributos mais baixos. Por exemplo, se a 'força' é baixa, sugira uma meta de fitness. Se a 'carisma' é baixo, sugira uma meta social.
        4.  **Evitar Repetição:** Não sugira metas que sejam muito semelhantes às já concluídas. O objetivo é o crescimento e a exploração de novos desafios.
        5.  **Qualidade sobre Quantidade:** Gere entre 3 a 5 sugestões de alta qualidade. Cada sugestão deve incluir um nome de meta inspirador, uma descrição que justifique a sugestão com base nos dados do utilizador e a categoria mais apropriada.

        O seu resultado deve ser um objeto JSON contendo uma lista de sugestões.
    `;

    const {output} = await ai.generate({
      prompt,
      model: 'googleai/gemini-2.5-flash',
      output: { schema: GenerateGoalSuggestionOutputSchema },
    });

    return output!;
  }
);
