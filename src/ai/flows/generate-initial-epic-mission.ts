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
    rank: z.enum(['F', 'E', 'D', 'C', 'B', 'A', 'S', 'SS', 'SSS']).describe("O rank inicial sugerido para a missão. Analise a dificuldade, o histórico e as habilidades necessárias para classificar de F (trivial) a SSS (extremamente difícil)."),
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
      ? `O utilizador já tem experiência nesta área. O seu histórico relevante é: ${input.relatedHistory}. Com base nisto, o Rank deve ser D ou superior, e a primeira missão não deve ser para iniciantes absolutos.`
      : 'Este é um campo completamente novo para o utilizador. O Rank deve ser F ou E, e a primeira missão deve ser um passo fundamental muito básico.';

    const finalPrompt = `Você é o "Avaliador" do Sistema de um RPG da vida real. A sua função é analisar uma nova meta do utilizador e criar a "Missão Épica" inicial, definindo o seu Rank de dificuldade e a sua primeira tarefa.

Utilizador: Nível ${input.userLevel}
Nova Meta: "${input.goalName}"
Detalhes da Meta (SMART): ${input.goalDetails}
Contexto Histórico: ${historyPrompt}

A sua análise deve ser profunda. Considere os seguintes fatores para definir o Rank:
- Complexidade: Quão difícil é a meta em si? (Ex: "Ler um livro" é mais simples que "Construir uma aplicação web completa").
- Prazo: Metas de longo prazo (anos) são inerentemente de rank mais alto.
- Habilidades Exigidas: Requer o domínio de múltiplas habilidades complexas?
- Histórico do Utilizador: Um utilizador experiente numa área deve receber um rank inicial mais alto para uma meta relacionada.

Use a seguinte escala de Ranks:
- F: Trivial, uma tarefa muito simples.
- E: Fácil, um desafio introdutório.
- D: Básico, requer alguma consistência.
- C: Moderado, um desafio considerável.
- B: Difícil, requer dedicação e habilidade.
- A: Muito Difícil, um marco de carreira ou de vida.
- S: Nível de Especialista, um desafio de elite.
- SS: Nível de Mestre, no auge do potencial humano.
- SSS: Nível Lendário, um feito que redefine o que é possível.

A sua tarefa é:
1.  **Nome da Missão Épica:** Crie um nome inspirador.
2.  **Rank:** Atribua um Rank de F a SSS com base na sua análise. Seja criterioso.
3.  **Primeira Missão Diária:** Crie o primeiro passo. Deve ser extremamente específico e alinhado com o nível de experiência do utilizador e o Rank da missão.
`;
    const MissionSchema = z.object({
        epicMissionName: z.string(),
        epicMissionDescription: z.string(),
        rank: z.enum(['F', 'E', 'D', 'C', 'B', 'A', 'S', 'SS', 'SSS']),
        firstDailyMissionName: z.string(),
        firstDailyMissionDescription: z.string(),
    })

    const {output} = await ai.generate({
        prompt: finalPrompt,
        model: 'googleai/gemini-2.5-flash',
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
