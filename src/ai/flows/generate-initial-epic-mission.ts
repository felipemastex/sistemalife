
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
import { generateNextDailyMission } from './generate-next-daily-mission';

const EpicMissionSchema = z.object({
    epicMissionName: z.string().describe("O nome temático e inspirador para a Missão Épica (ex: 'A Senda do Maratonista')."),
    epicMissionDescription: z.string().describe("Uma breve descrição da Missão Épica, explicando o seu objetivo principal."),
    rank: z.enum(['F', 'E', 'D', 'C', 'B', 'A', 'S', 'SS', 'SSS']).describe("O rank sugerido para esta missão específica na progressão."),
});

const SubTaskSchema = z.object({
  name: z.string().describe("O nome da sub-tarefa específica e acionável (ex: 'Ler um capítulo', 'Fazer 20 flexões')."),
  target: z.number().describe("A meta numérica para esta sub-tarefa (ex: 1, 20)."),
  unit: z.string().optional().describe("A unidade de medida, se aplicável (ex: 'páginas', 'repetições', 'minutos', 'km')."),
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
    firstDailyMissionDescription: z.string().describe("A descrição (agora obsoleta, mas necessária para retrocompatibilidade) da primeira missão diária. Deve ser uma string vazia."),
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

        const finalPrompt = `Você é o "Planeador Mestre" do Sistema de um RPG da vida real. A sua função é analisar uma nova meta do utilizador e criar uma "Árvore de Progressão" completa, uma sequência lógica de missões épicas que o levarão à maestria.

Utilizador: Nível ${input.userLevel}
Nova Meta: "${input.goalName}"
Detalhes da Meta (SMART): ${input.goalDetails}
Contexto Histórico: ${historyPrompt}

A sua tarefa é:
1.  **Criar uma Árvore de Progressão:** Gere uma lista de 3 a 5 "Missões Épicas" em sequência. Cada missão deve ser um passo lógico e mais desafiador que a anterior. A progressão de ranks deve ser coerente e realista. Não salte de Rank E para A. Mantenha os objetivos dentro de padrões humanos normais (ex: para corrida, progrida de 5km para 10km, depois 21km; não sugira 100km).
2.  **Atribuir Ranks:** Analise a dificuldade de cada passo e atribua um Rank (de F a SSS) para cada missão na árvore.

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

A sua resposta deve ser um objeto JSON contendo apenas a lista de 'progression'.
`;
        
        const MissionSchema = z.object({
            progression: z.array(EpicMissionSchema),
        })

        const {output} = await ai.generate({
            prompt: finalPrompt,
            model: 'googleai/gemini-2.5-flash',
            output: { schema: MissionSchema },
        });

        if (!output || !output.progression || output.progression.length === 0) {
            throw new Error("A IA não conseguiu gerar uma árvore de progressão válida.");
        }

        const firstEpicMission = output.progression[0];

        // Call generateNextDailyMission to create the first daily mission
        const firstDailyMissionResult = await generateNextDailyMission({
            rankedMissionName: firstEpicMission.epicMissionName,
            metaName: input.goalName,
            history: 'Esta é a primeira missão para este objetivo.',
            userLevel: input.userLevel,
        });
        
        return {
            progression: output.progression,
            firstDailyMissionName: firstDailyMissionResult.nextMissionName,
            firstDailyMissionDescription: "", // Campo obsoleto, mas necessário para evitar 'undefined'
            firstDailyMissionXp: firstDailyMissionResult.xp,
            firstDailyMissionFragments: firstDailyMissionResult.fragments,
            firstDailyMissionSubTasks: firstDailyMissionResult.subTasks.map(st => ({...st, current: 0 })),
            firstDailyMissionLearningResources: firstDailyMissionResult.learningResources,
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
        const fallbackDailyMissionSubTasks = [{ name: 'Completar o primeiro passo', target: 1, unit: 'tarefa', current: 0 }];
        const missionText = `${fallbackDailyMissionName}: Completar o primeiro passo`;
        const {xp, fragments} = await generateMissionRewards({ missionText, userLevel: input.userLevel });

        return {
            progression: fallbackProgression,
            firstDailyMissionName: fallbackDailyMissionName,
            firstDailyMissionDescription: "",
            firstDailyMissionXp: xp,
            firstDailyMissionFragments: fragments,
            firstDailyMissionSubTasks,
            firstDailyMissionLearningResources: [],
            fallback: true,
        };
    }
  }
);
