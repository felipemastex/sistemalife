'use server';
/**
 * @fileOverview Um agente de IA que fornece conselhos personalizados como o 'Sistema'.
 *
 * - generateSystemAdvice - Uma função que lida com a geração de conselhos personalizados.
 * - GenerateSystemAdviceInput - O tipo de entrada para a função.
 * - GenerateSystemAdviceOutput - O tipo de retorno para a função.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { generateRoutineSuggestion } from './generate-routine-suggestion';


const GenerateSystemAdviceInputSchema = z.object({
  userName: z.string().describe('O nome do utilizador.'),
  profile: z.string().describe('Os dados de perfil do utilizador como uma string JSON.'),
  metas: z.string().describe('Os objetivos do utilizador (metas) como uma string JSON.'),
  routine: z.string().describe('A rotina diária do utilizador como uma string JSON.'),
  missions: z.string().describe('As missões ativas (não concluídas) do utilizador como uma string JSON.'),
  query: z.string().describe('A pergunta ou diretiva do utilizador.'),
});
export type GenerateSystemAdviceInput = z.infer<typeof GenerateSystemAdviceInputSchema>;

const GenerateSystemAdviceOutputSchema = z.object({
  response: z.string().describe('O conselho gerado pela IA do Sistema.'),
});
export type GenerateSystemAdviceOutput = z.infer<typeof GenerateSystemAdviceOutputSchema>;

const suggestRoutineTool = ai.defineTool(
    {
        name: 'suggestRoutineTool',
        description: 'Usado quando o utilizador pergunta onde encaixar uma missão na sua rotina. Analisa a rotina do utilizador e a missão para encontrar o melhor horário.',
        inputSchema: z.object({
            missionName: z.string().describe("O nome da missão para a qual a sugestão de horário é necessária."),
            missionDescription: z.string().describe("A descrição da missão."),
        }),
        outputSchema: z.string().describe("A sugestão de horário gerada."),
    },
    async (input) => {
        // This is a wrapper. We need the full routine from the parent flow's scope.
        // It's a bit of a workaround because tools don't have access to the parent flow's direct input.
        // The `generateSystemAdviceFlow` will provide the routine.
        return "ROUTINE_SUGGESTION_PLACEHOLDER";
    }
);

export async function generateSystemAdvice(
  input: GenerateSystemAdviceInput
): Promise<GenerateSystemAdviceOutput> {
  return generateSystemAdviceFlow(input);
}


const generateSystemAdviceFlow = ai.defineFlow(
  {
    name: 'generateSystemAdviceFlow',
    inputSchema: GenerateSystemAdviceInputSchema,
    outputSchema: GenerateSystemAdviceOutputSchema,
    tools: [suggestRoutineTool]
  },
  async (input) => {
    const prompt = `Você é o 'Sistema', uma IA de um RPG da vida real. O utilizador é ${input.userName}.
O perfil dele: ${input.profile}
Os seus objetivos a longo prazo (Metas): ${input.metas}
A sua rotina diária: ${input.routine}
As suas missões ativas: ${input.missions}

Diretiva do utilizador: "${input.query}"

Responda de forma concisa, no personagem do Sistema. Seja útil e estratégico. Se o utilizador perguntar sobre a sua rotina ou como encaixar uma tarefa, use a ferramenta \`suggestRoutineTool\` para fornecer uma recomendação específica. Para usar a ferramenta, você precisa identificar qual missão o utilizador quer agendar.`;

    const {output} = await ai.generate({
        prompt: prompt,
        model: 'googleai/gemini-2.5-flash',
        tools: [suggestRoutineTool],
    });

    if (output.toolCalls) {
        for (const toolCall of output.toolCalls) {
            if (toolCall.name === 'suggestRoutineTool' && toolCall.input) {
                const suggestion = await generateRoutineSuggestion({
                    routine: JSON.parse(input.routine),
                    missionName: toolCall.input.missionName,
                    missionDescription: toolCall.input.missionDescription,
                });
                return { response: suggestion.suggestion };
            }
        }
    }

    return { response: output.text! };
  }
);
