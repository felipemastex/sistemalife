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
  },
  async (input) => {
    // Etapa 1: Verificar se a consulta é sobre agendamento de rotina.
    const analysisPrompt = `
        Analise a diretiva do utilizador. A pergunta é sobre onde, quando ou como encaixar uma tarefa, missão ou atividade na rotina diária? 
        Responda com um JSON contendo 'isRoutineQuery: boolean' e, se for verdade, 'missionToSchedule: string' que identifica a missão que o utilizador quer agendar a partir da lista de missões ativas. Se a pergunta não for sobre rotina OU se a missão mencionada não estiver na lista de missões ativas, retorne 'isRoutineQuery: false'.
        
        Diretiva: "${input.query}"
        Missões Ativas: ${input.missions}
    `;
    
    const AnalysisSchema = z.object({
        isRoutineQuery: z.boolean(),
        missionToSchedule: z.string().optional(),
    });

    const { output: analysis } = await ai.generate({
        prompt: analysisPrompt,
        model: 'googleai/gemini-2.5-flash',
        output: { schema: AnalysisSchema },
    });

    // Etapa 2: Se for uma consulta de rotina e uma missão válida for encontrada, gerar a sugestão.
    // Esta lógica agora está na RoutineView, então aqui apenas damos uma resposta informativa.
    if (analysis?.isRoutineQuery) {
        return { response: "Para obter sugestões de horários para as suas missões, por favor, utilize a funcionalidade 'Sugerir Horário' na aba 'Rotina'. Assim posso ajudar-lhe de forma mais eficaz." };
    }

    // Etapa 3: Se não for sobre rotina, gerar uma resposta geral.
    const generalPrompt = `Você é o 'Sistema', uma IA de um RPG da vida real. O utilizador é ${input.userName}.
        O perfil dele: ${input.profile}
        Os seus objetivos a longo prazo (Metas): ${input.metas}
        A sua rotina diária: ${input.routine}
        As suas missões ativas: ${input.missions}

        Diretiva do utilizador: "${input.query}"

        Responda de forma concisa, no personagem do Sistema. Seja útil e estratégico.`;

    const {output: generalOutput} = await ai.generate({
        prompt: generalPrompt,
        model: 'googleai/gemini-2.5-flash',
    });

    return { response: generalOutput?.text || "Não foi possível gerar uma resposta." };
  }
);
