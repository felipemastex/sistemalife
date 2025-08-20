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

        Analise a missão para estimar o tempo necessário (geralmente menos de 30 minutos) e o tipo de esforço (mental, físico, rápido, focado).
        Analise a rotina para encontrar lacunas, intervalos ou momentos onde a missão poderia se encaixar naturalmente.
        
        Considere os seguintes princípios:
        1.  **Agrupamento de Hábitos (Habit Stacking):** É possível encaixar a missão logo ANTES ou DEPOIS de uma atividade já existente? (Ex: "Depois do seu Exercício Físico, aproveite o momento e faça...")
        2.  **Contexto:** A missão requer um computador? Um lugar silencioso? Sugira um horário compatível. (Ex: Missões de programação devem ser durante o "Trabalho Focado").
        3.  **Níveis de Energia:** Missões que exigem mais foco mental são melhores no início do dia. Missões mais leves podem ser feitas no final.
        4.  **Seja Específico:** Não diga apenas "faça no seu tempo livre". Diga "Notei que você tem um intervalo entre as 12:30 e as 13:30 para o almoço. Que tal usar os primeiros 15 minutos desse tempo para completar a sua missão?".
        5.  **Duração:** Estime a duração da tarefa. Se for uma tarefa de 15 minutos, sugira um bloco de 15 a 20 minutos, não uma hora inteira.

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
