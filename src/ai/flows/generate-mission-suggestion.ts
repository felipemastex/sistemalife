'use server';
/**
 * @fileOverview Um agente de IA que fornece sugestões para missões.
 *
 * - generateMissionSuggestion - Fornece uma sugestão ou confirmação de feedback.
 * - GenerateMissionSuggestionInput - O tipo de entrada para a função.
 * - GenerateMissionSuggestionOutput - O tipo de retorno para a função.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateMissionSuggestionInputSchema = z.object({
  missionName: z.string().describe("O nome da missão diária atual."),
  missionDescription: z.string().describe("A descrição da missão diária atual."),
  feedbackType: z.enum(['hint', 'too_hard', 'too_easy']).describe("O tipo de feedback ou pedido do utilizador."),
});
export type GenerateMissionSuggestionInput = z.infer<typeof GenerateMissionSuggestionInputSchema>;

const GenerateMissionSuggestionOutputSchema = z.object({
  suggestion: z.string().describe('A resposta da IA ao pedido do utilizador.'),
});
export type GenerateMissionSuggestionOutput = z.infer<typeof GenerateMissionSuggestionOutputSchema>;

export async function generateMissionSuggestion(
  input: GenerateMissionSuggestionInput
): Promise<GenerateMissionSuggestionOutput> {
  return generateMissionSuggestionFlow(input);
}


const generateMissionSuggestionFlow = ai.defineFlow(
  {
    name: 'generateMissionSuggestionFlow',
    inputSchema: GenerateMissionSuggestionInputSchema,
    outputSchema: GenerateMissionSuggestionOutputSchema,
  },
  async (input) => {
    let prompt = '';

    if (input.feedbackType === 'hint') {
      prompt = `Você é o 'Sistema', um coach de IA. O utilizador está a pedir uma dica para a seguinte missão:
        - Missão: "${input.missionName}"
        - Descrição: "${input.missionDescription}"
        
        Forneça uma sugestão útil e acionável. Não dê a resposta completa, mas ofereça uma pista que o ajude a começar ou a pensar no problema de uma forma diferente. Seja conciso e estratégico.`;
    } else if (input.feedbackType === 'too_hard') {
      prompt = `Você é o 'Sistema', um coach de IA. O utilizador sinalizou que a seguinte missão é muito difícil:
        - Missão: "${input.missionName}"
        - Descrição: "${input.missionDescription}"

        Reconheça o feedback do utilizador. Confirme que a próxima missão será mais simples e reforce que o importante é a consistência. Diga algo como: "Entendido. A dificuldade será ajustada. O progresso, por menor que seja, é a chave."`;
    } else { // too_easy
      prompt = `Você é o 'Sistema', um coach de IA. O utilizador sinalizou que a seguinte missão é muito fácil:
        - Missão: "${input.missionName}"
        - Descrição: "${input.missionDescription}"

        Reconheça o feedback do utilizador. Confirme que o desafio irá aumentar na próxima missão. Diga algo como: "Feedback recebido. Prepare-se para um desafio maior na sua próxima missão."`;
    }

    const {output} = await ai.generate({
      prompt,
      model: 'googleai/gemini-2.5-flash-preview',
      output: { schema: GenerateMissionSuggestionOutputSchema },
    });

    return output!;
  }
);
