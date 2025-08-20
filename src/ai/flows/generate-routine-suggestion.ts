
'use server';
/**
 * @fileOverview Um agente de IA que sugere o melhor horário para uma missão com base na rotina do utilizador.
 *
 * - generateRoutineSuggestion - Analisa a rotina e a missão para encontrar um horário.
 * - GenerateRoutineSuggestionInput - O tipo de entrada para a função.
 * - GenerateRoutineSuggestionOutput - O tipo de retorno para a função.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RoutineItemSchema = z.object({
  id: z.number(),
  start_time: z.string().describe("Horário de início no formato HH:MM."),
  end_time: z.string().describe("Horário de término no formato HH:MM."),
  activity: z.string().describe("Nome da atividade."),
});

const GenerateRoutineSuggestionInputSchema = z.object({
  routine: z.array(RoutineItemSchema).describe("A lista de atividades e horários da rotina diária do utilizador."),
  missionName: z.string().describe("O nome da missão diária para a qual se precisa de uma sugestão."),
  missionDescription: z.string().describe("A descrição da missão diária."),
});
export type GenerateRoutineSuggestionInput = z.infer<typeof GenerateRoutineSuggestionInputSchema>;

const GenerateRoutineSuggestionOutputSchema = z.object({
  suggestionText: z.string().describe('A sugestão gerada pela IA sobre quando e como realizar a missão. Ex: "Sugestão: Que tal realizar esta missão entre as 13:30 e as 14:00..."'),
  suggestedStartTime: z.string().describe("O horário de início sugerido no formato HH:MM."),
  suggestedEndTime: z.string().describe("O horário de término sugerido no formato HH:MM."),
});
export type GenerateRoutineSuggestionOutput = z.infer<typeof GenerateRoutineSuggestionOutputSchema>;

export async function generateRoutineSuggestion(
  input: GenerateRoutineSuggestionInput
): Promise<GenerateRoutineSuggestionOutput> {
  return generateRoutineSuggestionFlow(input);
}


const generateRoutineSuggestionFlow = ai.defineFlow(
  {
    name: 'generateRoutineSuggestionFlow',
    inputSchema: GenerateRoutineSuggestionInputSchema,
    outputSchema: GenerateRoutineSuggestionOutputSchema,
  },
  async (input) => {
    const prompt = `
        Você é o 'Sistema', um estratega de produtividade de elite. Sua tarefa é analisar a rotina diária de um utilizador e a sua missão atual para encontrar o momento perfeito para a execução.

        A missão atual do utilizador é:
        - Nome: "${input.missionName}"
        - Descrição: "${input.missionDescription}"

        Esta é a rotina diária do utilizador:
        ${JSON.stringify(input.routine, null, 2)}

        Analise a missão para determinar a sua natureza (ex: física, mental, estudo, tarefa rápida) e o tempo estimado necessário.
        
        Siga esta ordem de prioridade para fazer a sua sugestão:
        1.  **Incorporação Contextual (Prioridade Máxima):** Analise o NOME e a DESCRIÇÃO da missão. Existe alguma atividade na rotina que seja contextualmente semelhante? 
            - Exemplo 1: Se a missão é 'Fazer 20 agachamentos' e existe uma atividade 'Exercício Físico' na rotina, a sua principal sugestão DEVE ser incorporar a missão nesse bloco. Sugira algo como: "A melhor altura para fazer os seus agachamentos é durante o seu bloco de 'Exercício Físico', entre as 08:00 e as 09:00. Que tal fazer isso como aquecimento?".
            - Exemplo 2: Se a missão é 'Ler um artigo sobre Python' e existe uma atividade 'Estudo/Leitura' ou 'Trabalho Focado', sugira encaixá-la aí.
            - Ao fazer isso, o horário de início e fim sugerido deve ser o do bloco de atividade existente.

        2.  **Agrupamento de Hábitos (Habit Stacking):** Se não houver um bloco contextual claro, procure uma oportunidade para encaixar a missão logo ANTES ou DEPOIS de uma atividade já existente. (Ex: "Depois do seu Exercício Físico, aproveite o momento e faça...").

        3.  **Encontrar Lacunas (Último Recurso):** Se nenhuma das opções acima for viável, analise a rotina para encontrar lacunas ou intervalos de tempo livre onde a missão poderia se encaixar. Seja específico: "Notei que você tem um intervalo entre as 12:30 e as 13:30 para o almoço. Que tal usar os primeiros 15 minutos desse tempo para completar a sua missão?".

        Sua resposta DEVE estar em formato JSON. Gere:
        1. 'suggestionText': Uma frase clara, acionável e motivadora. Seja conciso.
        2. 'suggestedStartTime': O horário de início que você encontrou no formato 'HH:MM'.
        3. 'suggestedEndTime': O horário de término que você calculou no formato 'HH:MM'.
    `;

    const {output} = await ai.generate({
      prompt,
      model: 'googleai/gemini-2.5-flash',
      output: { schema: GenerateRoutineSuggestionOutputSchema },
    });

    return output!;
  }
);

