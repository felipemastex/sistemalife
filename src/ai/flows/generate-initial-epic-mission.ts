'use server';
/**
 * @fileOverview Um agente de IA que gera a missão épica inicial (ranqueada) com base na nova meta do utilizador e no seu histórico.
 *
 * - generateInitialEpicMission - Gera a missão ranqueada, incluindo o seu rank e a primeira missão diária.
 * - GenerateInitialEpicMissionInput - O tipo de entrada para a função.
 * - GenerateInitialEpicMissionOutput - O tipo de retorno para a função.
 */

import {ai} from '@/ai/genkit';
import {generateXpValue} from './generate-xp-value';
import {z} from 'genkit';

const GenerateInitialEpicMissionInputSchema = z.object({
  goalName: z.string().describe("O nome da nova meta SMART do utilizador."),
  goalDetails: z.string().describe("Os detalhes completos (SMART) da meta do utilizador."),
  userLevel: z.number().describe("O nível atual do utilizador para ajudar a calibrar a dificuldade."),
  relatedHistory: z.string().optional().describe("Um resumo de metas e missões concluídas anteriormente que são relevantes para esta nova meta."),
});
export type GenerateInitialEpicMissionInput = z.infer<typeof GenerateInitialEpicMissionInputSchema>;

const GenerateInitialEpicMissionOutputSchema = z.object({
    epicMissionName: z.string().describe("O nome temático e inspirador para a nova Missão Épica (ex: 'A Senda do Maratonista')."),
    epicMissionDescription: z.string().describe("Uma breve descrição da Missão Épica."),
    rank: z.enum(['E', 'D', 'C', 'B', 'A', 'S']).describe("O rank inicial sugerido para a missão. Se houver histórico relacionado, comece com um rank mais alto (D ou C). Se for um tópico completamente novo, comece com E."),
    firstDailyMissionName: z.string().describe("O nome da primeira missão diária. Deve ser um primeiro passo lógico e específico."),
    firstDailyMissionDescription: z.string().describe("A descrição detalhada da primeira missão diária."),
    firstDailyMissionXp: z.number().describe("A quantidade de XP para a primeira missão."),
});
export type GenerateInitialEpicMissionOutput = z.infer<typeof GenerateInitialEpicMissionOutputSchema>;

export async function generateInitialEpicMission(
  input: GenerateInitialEpicMissionInput
): Promise<GenerateInitialEpicMissionOutput> {
  return generateInitialEpicMissionFlow(input);
}

const generateInitialEpicMissionFlow = ai.defineFlow(
  {
    name: 'generateInitialEpicMissionFlow',
    inputSchema: GenerateInitialEpicMissionInputSchema,
    outputSchema: GenerateInitialEpicMissionOutputSchema,
  },
  async (input) => {

    const historyPrompt = input.relatedHistory
      ? `O utilizador já tem experiência nesta área. O seu histórico relevante é: ${input.relatedHistory}. Com base nisto, o Rank deve ser D ou C. A primeira missão diária não deve ser para iniciantes, mas sim o próximo passo lógico.`
      : 'Este é um campo completamente novo para o utilizador. O Rank deve ser E e a primeira missão deve ser um passo fundamental muito básico.';

    const finalPrompt = `Você é o 'Sistema' de um RPG da vida real. O utilizador (Nível ${input.userLevel}) definiu uma nova meta: "${input.goalName}".
Detalhes da meta: ${input.goalDetails}.
${historyPrompt}

A sua tarefa é criar uma 'Missão Épica' ranqueada para esta meta e definir a *primeira* missão diária.

1.  **Nome da Missão Épica:** Crie um nome inspirador e temático.
2.  **Rank:** Avalie o histórico. Se houver histórico, comece em D ou C. Caso contrário, comece em E.
3.  **Primeira Missão Diária:** Crie a primeira tarefa. Deve ser um passo extremamente específico e acionável, alinhado com o nível de experiência do utilizador. Siga os princípios de "Hábitos Atómicos": torne-a óbvia, atraente, fácil e satisfatória.
`;
    const MissionSchema = z.object({
        epicMissionName: z.string(),
        epicMissionDescription: z.string(),
        rank: z.enum(['E', 'D', 'C', 'B', 'A', 'S']),
        firstDailyMissionName: z.string(),
        firstDailyMissionDescription: z.string(),
    })

    const {output} = await ai.generate({
        prompt: finalPrompt,
        model: 'googleai/gemini-2.0-flash',
        output: { schema: MissionSchema },
    });
    
    const missionText = `${output!.firstDailyMissionName}: ${output!.firstDailyMissionDescription}`;
    const xp = await generateXpValue({ missionText, userLevel: input.userLevel });


    return {
        epicMissionName: output!.epicMissionName,
        epicMissionDescription: output!.epicMissionDescription,
        rank: output!.rank,
        firstDailyMissionName: output!.firstDailyMissionName,
        firstDailyMissionDescription: output!.firstDailyMissionDescription,
        firstDailyMissionXp: xp.xp
    };
  }
);
