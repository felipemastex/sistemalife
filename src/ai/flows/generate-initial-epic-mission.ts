
'use server';
/**
 * @fileOverview Um agente de IA que gera uma árvore de progressão de missões épicas com base na nova meta do utilizador.
 *
 * - generateInitialEpicMission - Gera uma sequência de missões ranqueadas e a primeira missão diária.
 * - GenerateInitialEpicMissionInput - O tipo de entrada para a função.
 * - GenerateInitialEpicMissionOutput - O tipo de retorno para a função.
 */

import {ai} from '@/ai/genkit';
import {generateXpValue} from './generate-xp-value';
import {z} from 'genkit';

const EpicMissionSchema = z.object({
    epicMissionName: z.string().describe("O nome temático e inspirador para a Missão Épica (ex: 'A Senda do Maratonista')."),
    epicMissionDescription: z.string().describe("Uma breve descrição da Missão Épica, explicando o seu objetivo principal."),
    rank: z.enum(['F', 'E', 'D', 'C', 'B', 'A', 'S', 'SS', 'SSS']).describe("O rank sugerido para esta missão específica na progressão."),
});


const GenerateInitialEpicMissionInputSchema = z.object({
  goalName: z.string().describe("O nome da nova meta SMART do utilizador."),
  goalDetails: z.string().describe("Os detalhes completos (SMART) da meta do utilizador."),
  userLevel: z.number().describe("O nível atual do utilizador para ajudar a calibrar a dificuldade."),
  relatedHistory: z.string().optional().describe("Um resumo de metas e missões concluídas anteriormente que são relevantes para esta nova meta."),
});
export type GenerateInitialEpicMissionInput = z.infer<typeof GenerateInitialEpicMissionInputSchema>;

const GenerateInitialEpicMissionOutputSchema = z.object({
    progression: z.array(EpicMissionSchema).describe("Uma lista de 3 a 5 missões épicas que representam uma clara progressão de dificuldade."),
    firstDailyMissionName: z.string().describe("O nome da primeira missão diária. Deve ser um primeiro passo lógico e específico para a primeira missão épica da lista."),
    firstDailyMissionDescription: z.string().describe("A descrição detalhada da primeira missão diária."),
    firstDailyMissionXp: z.number().describe("A quantidade de XP para a primeira missão."),
    fallback: z.boolean().optional().describe("Indica se a resposta foi gerada usando um plano de fallback devido a um erro de IA."),
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
    try {
        const historyPrompt = input.relatedHistory
        ? `O utilizador já tem experiência nesta área. O seu histórico relevante é: ${input.relatedHistory}. Com base nisto, o Rank da primeira missão deve ser D ou superior, e a primeira tarefa não deve ser para iniciantes absolutos.`
        : 'Este é um campo completamente novo para o utilizador. O Rank da primeira missão deve ser F ou E, e a primeira tarefa deve ser um passo fundamental muito básico.';

        const finalPrompt = `Você é o "Planeador Mestre" do Sistema de um RPG da vida real. A sua função é analisar uma nova meta do utilizador e criar uma "Árvore de Progressão" completa, uma sequência lógica de missões épicas que o levarão à maestria.

Utilizador: Nível ${input.userLevel}
Nova Meta: "${input.goalName}"
Detalhes da Meta (SMART): ${input.goalDetails}
Contexto Histórico: ${historyPrompt}

A sua tarefa é:
1.  **Criar uma Árvore de Progressão:** Gere uma lista de 3 a 5 "Missões Épicas" em sequência. Cada missão deve ser um passo lógico e mais desafiador que a anterior. A progressão de ranks deve ser coerente e realista. Não salte de Rank E para A. Mantenha os objetivos dentro de padrões humanos normais (ex: para corrida, progrida de 5km para 10km, depois 21km; não sugira 100km).
2.  **Atribuir Ranks:** Analise a dificuldade de cada passo e atribua um Rank (de F a SSS) para cada missão na árvore.
3.  **Primeira Missão Diária:** Crie a PRIMEIRA missão diária para a PRIMEIRA missão épica da sua lista. Deve ser um passo inicial, extremamente específico e alinhado com a experiência do utilizador.

Use a seguinte escala de Ranks para guiar a sua progressão:
- F: Trivial
- E: Fácil
- D: Básico
- C: Moderado
- B: Difícil
- A: Muito Difícil
- S: Nível de Especialista
- SS: Nível de Mestre
- SSS: Nível Lendário

A sua resposta deve ser um objeto JSON completo.
`;
        
        const MissionSchema = z.object({
            progression: z.array(EpicMissionSchema),
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
            progression: output!.progression,
            firstDailyMissionName: output!.firstDailyMissionName,
            firstDailyMissionDescription: output!.firstDailyMissionDescription,
            firstDailyMissionXp: xp.xp,
            fallback: false,
        };
    } catch (error) {
        console.error("Falha ao gerar árvore de progressão, acionando fallback:", error);

        // Fallback: Gerar uma única missão épica e uma missão diária simples.
        const fallbackProgression = [{
            epicMissionName: `Missão Épica: ${input.goalName}`,
            epicMissionDescription: `Uma grande jornada em direção ao seu objetivo: ${input.goalName}.`,
            rank: 'E' as const,
        }];

        const fallbackDailyMissionName = `Começar a jornada: ${input.goalName}`;
        const fallbackDailyMissionDescription = "O primeiro passo é o mais importante. Complete esta tarefa para começar a sua nova aventura.";
        const missionText = `${fallbackDailyMissionName}: ${fallbackDailyMissionDescription}`;
        const xp = await generateXpValue({ missionText, userLevel: input.userLevel });

        return {
            progression: fallbackProgression,
            firstDailyMissionName: fallbackDailyMissionName,
            firstDailyMissionDescription: fallbackDailyMissionDescription,
            firstDailyMissionXp: xp.xp,
            fallback: true,
        };
    }
  }
);
