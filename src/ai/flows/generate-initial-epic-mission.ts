
'use server';
/**
 * @fileOverview Um agente de IA que gera uma árvore de progressão de missões épicas com base na nova meta do utilizador.
 *
 * - generateInitialEpicMission - Gera uma sequência de missões ranqueadas e a primeira missão diária.
 * - GenerateInitialEpicMissionInput - O tipo de entrada para a função.
 * - GenerateInitialEpicMissionOutput - O tipo de retorno para a função.
 */

import {ai} from '@/ai/genkit';
import {generateMissionRewards} from './generate-mission-rewards';
import {z} from 'genkit';

const EpicMissionSchema = z.object({
    epicMissionName: z.string().describe("O nome temático e inspirador para a Missão Épica (ex: 'A Senda do Maratonista')."),
    epicMissionDescription: z.string().describe("Uma breve descrição da Missão Épica, explicando o seu objetivo principal."),
    rank: z.enum(['F', 'E', 'D', 'C', 'B', 'A', 'S', 'SS', 'SSS']).describe("O rank sugerido para esta missão específica na progressão."),
});

const SubTaskSchema = z.object({
  name: z.string().describe("O nome da sub-tarefa específica e acionável (ex: 'Ler um capítulo', 'Fazer 20 flexões')."),
  target: z.number().describe("A meta numérica para esta sub-tarefa (ex: 1, 20)."),
  unit: z.string().optional().describe("A unidade de medida, se aplicável (ex: 'páginas', 'repetições', 'minutos', 'km')."),
  current: z.number().optional().describe("O progresso atual da sub-tarefa, que deve ser inicializado como 0.")
});

const FirstDailyMissionSchema = z.object({
    firstDailyMissionName: z.string().describe("O nome da primeira missão diária. Deve ser um primeiro passo lógico e específico para a primeira missão épica da lista."),
    firstDailyMissionDescription: z.string().describe("Uma breve descrição da primeira missão diária."),
    firstDailyMissionSubTasks: z.array(SubTaskSchema).describe("A lista de 1 a 3 sub-tarefas para a primeira missão diária."),
    firstDailyMissionLearningResources: z.array(z.string().url()).optional().describe("Recursos de aprendizagem para a primeira missão diária."),
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
    firstDailyMissionDescription: z.string().describe("Uma breve descrição da primeira missão diária."),
    firstDailyMissionXp: z.number().describe("A quantidade de XP para a primeira missão."),
    firstDailyMissionFragments: z.number().describe("A quantidade de fragmentos (moeda do jogo) para a primeira missão."),
    firstDailyMissionSubTasks: z.array(SubTaskSchema).describe("A lista de sub-tarefas para a primeira missão diária."),
    firstDailyMissionLearningResources: z.array(z.string().url()).optional().describe("Recursos de aprendizagem para a primeira missão diária."),
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

        const finalPrompt = `Você é o "Planeador Mestre" do Sistema de um RPG da vida real. A sua função é analisar uma nova meta do utilizador e criar uma "Árvore de Progressão" completa.

Utilizador: Nível ${input.userLevel}
Nova Meta: "${input.goalName}"
Detalhes da Meta (SMART): ${input.goalDetails}
Contexto Histórico: ${historyPrompt}

A sua tarefa é:
1.  **Criar Árvore de Progressão:** Gere uma lista de 3 a 5 "Missões Épicas" em sequência. Cada missão deve ser um passo lógico e mais desafiador que a anterior. A progressão de ranks (F, E, D, C, B, A, S...) deve ser coerente.
2.  **Criar a Primeira Missão Diária:** Com base na *primeira* missão épica que você criou, gere a *primeira* missão diária atómica.
    *   **Nome e Descrição:** Defina um nome e descrição claros para esta missão diária.
    *   **Sub-tarefas:** Crie de 1 a 3 sub-tarefas específicas, mensuráveis e com unidades (se aplicável).
    *   **Recursos:** Se relevante, forneça até 2 URLs de recursos de aprendizagem de alta qualidade.
`;
        
        const MissionSchema = z.object({
            progression: z.array(EpicMissionSchema),
            firstDailyMission: FirstDailyMissionSchema,
        })

        const {output} = await ai.generate({
            prompt: finalPrompt,
            model: 'googleai/gemini-2.5-flash',
            output: { schema: MissionSchema },
        });

        if (!output || !output.progression || output.progression.length === 0 || !output.firstDailyMission) {
            throw new Error("A IA não conseguiu gerar uma árvore de progressão válida.");
        }

        const missionTextForRewards = `${output.firstDailyMission.firstDailyMissionName}: ${output.firstDailyMission.firstDailyMissionSubTasks.map(st => st.name).join(', ')}`;
        const rewards = await generateMissionRewards({
            missionText: missionTextForRewards,
            userLevel: input.userLevel,
        });

        return {
            progression: output.progression,
            firstDailyMissionName: output.firstDailyMission.firstDailyMissionName,
            firstDailyMissionDescription: output.firstDailyMission.firstDailyMissionDescription,
            firstDailyMissionXp: rewards.xp,
            firstDailyMissionFragments: rewards.fragments,
            firstDailyMissionSubTasks: output.firstDailyMission.firstDailyMissionSubTasks.map(st => ({...st, current: 0 })),
            firstDailyMissionLearningResources: output.firstDailyMission.firstDailyMissionLearningResources || [],
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
        const fallbackDailyMissionDescription = 'Completar o primeiro passo para alcançar a sua meta.';
        const fallbackDailyMissionSubTasks = [{ name: 'Completar o primeiro passo', target: 1, unit: 'tarefa', current: 0 }];
        const missionText = `${fallbackDailyMissionName}: Completar o primeiro passo`;
        const {xp, fragments} = await generateMissionRewards({ missionText, userLevel: input.userLevel });

        return {
            progression: fallbackProgression,
            firstDailyMissionName: fallbackDailyMissionName,
            firstDailyMissionDescription: fallbackDailyMissionDescription,
            firstDailyMissionXp: xp,
            firstDailyMissionFragments: fragments,
            firstDailyMissionSubTasks: fallbackDailyMissionSubTasks,
            firstDailyMissionLearningResources: [],
            fallback: true,
        };
    }
  }
);

    