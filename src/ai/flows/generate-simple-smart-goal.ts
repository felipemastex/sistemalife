
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
  name: z.string().describe('O nome original da meta, conforme inserido pelo utilizador.'),
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
  fallback: z.boolean().optional().describe("Indica se a resposta foi gerada usando um plano de fallback devido a um erro de IA."),
});
export type GenerateSimpleSmartGoalOutput = z.infer<typeof GenerateSimpleSmartGoalOutputSchema>;

export async function generateSimpleSmartGoal(
  input: GenerateSimpleSmartGoalInput
): Promise<GenerateSimpleSmartGoalOutput> {
  return generateSimpleSmartGoalFlow(input);
}


const generateSimpleSmartGoalFlow = ai.defineFlow(
  {
    name: 'generateSimpleSmartGoalFlow',
    inputSchema: GenerateSimpleSmartGoalInputSchema,
    outputSchema: GenerateSimpleSmartGoalOutputSchema,
  },
  async input => {
    try {
        const prompt = `Você é um coach de produtividade de elite, mestre em transformar ideias em metas acionáveis.
Sua tarefa é pegar o nome de uma meta fornecida pelo utilizador e expandi-la para uma meta SMART completa.

Meta do Utilizador: "${input.goalName}"

Seja criativo, mas realista. Crie detalhes específicos, mensuráveis, atingíveis, relevantes e com prazo para a meta.
IMPORTANTE: O campo 'name' na resposta DEVE ser exatamente igual à "Meta do Utilizador" fornecida. Não modifique o nome.
Para o campo 'timeBound', defina um prazo realista e futuro (ex: "nos próximos 3 meses", "até ao final do ano fiscal atual"). Não use uma data específica com ano, como "até 31/12/2024".

Responda APENAS com o objeto JSON do "refinedGoal". Não adicione nenhuma outra palavra ou pontuação.
`;
        const {output} = await ai.generate({
            prompt: prompt,
            model: 'googleai/gemini-2.5-flash',
            output: { schema: z.object({ refinedGoal: SmartGoalSchema }) },
        });

        return { refinedGoal: output!.refinedGoal, fallback: false };
    } catch (error) {
        console.error("Falha ao gerar meta SMART, acionando fallback:", error);
        
        const fallbackGoal = {
            name: input.goalName,
            specific: `Definir e alcançar o objetivo: ${input.goalName}.`,
            measurable: 'Defina aqui os marcos e KPIs para medir o progresso.',
            achievable: 'Liste os passos e recursos necessários para tornar isto possível.',
            relevant: 'Descreva aqui porque esta meta é importante para si neste momento.',
            timeBound: 'Defina um prazo realista para a conclusão desta meta.',
        };

        return {
            refinedGoal: fallbackGoal,
            fallback: true,
        };
    }
  }
);
