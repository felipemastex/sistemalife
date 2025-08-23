
'use server';
/**
 * @fileOverview Um agente de IA que gera a próxima missão diária com base no progresso.
 *
 * - generateNextDailyMission - Gera a próxima missão diária atómica.
 * - GenerateNextDailyMissionInput - O tipo de entrada para a função.
 * - GenerateNextDailyMissionOutput - O tipo de retorno para a função.
 */

import {ai} from '@/ai/genkit';
import {generateMissionRewards} from './generate-mission-rewards';
import {z} from 'genkit';

const SubTaskSchema = z.object({
  name: z.string().describe("O nome da sub-tarefa específica e acionável (ex: 'Ler um capítulo', 'Fazer 20 flexões')."),
  target: z.number().describe("A meta numérica para esta sub-tarefa (ex: 1, 20)."),
  unit: z.string().optional().describe("A unidade de medida, se aplicável (ex: 'páginas', 'repetições', 'minutos', 'km')."),
});

const GenerateNextDailyMissionInputSchema = z.object({
  rankedMissionName: z.string().describe("O nome da missão épica ou ranqueada principal."),
  metaName: z.string().describe("A meta de longo prazo associada a esta missão."),
  goalDeadline: z.string().optional().describe("A data final para a meta (prazo), no formato YYYY-MM-DD."),
  history: z.string().describe("O histórico das últimas missões diárias concluídas para dar contexto."),
  userLevel: z.number().describe("O nível atual do utilizador para ajustar a dificuldade."),
  feedback: z.string().optional().describe("Feedback do utilizador sobre a missão anterior (ex: 'muito fácil', 'muito difícil', ou um texto descritivo) para calibrar a próxima."),
});
export type GenerateNextDailyMissionInput = z.infer<typeof GenerateNextDailyMissionInputSchema>;

const GenerateNextDailyMissionOutputSchema = z.object({
    nextMissionName: z.string().describe("O nome da próxima pequena missão diária. Deve ser muito específico (ex: 'Treino de Força Fundamental', 'Sessão de Estudo Focada')."),
    nextMissionDescription: z.string().describe("Uma breve descrição da próxima missão diária. Deve ser detalhada e acionável."),
    xp: z.number().describe("A quantidade de XP para a nova missão."),
    fragments: z.number().describe("A quantidade de fragmentos (moeda do jogo) para a nova missão."),
    learningResources: z.array(z.string().url()).optional().describe("Uma lista de até 3 URLs de recursos de aprendizagem (sites, vídeos, documentação) relevantes para a missão, se aplicável."),
    subTasks: z.array(SubTaskSchema).describe("Uma lista de 1 a 5 sub-tarefas que compõem a missão diária. Estas devem ser as ações concretas que o utilizador irá realizar e acompanhar."),
});
export type GenerateNextDailyMissionOutput = z.infer<typeof GenerateNextDailyMissionOutputSchema>;

export async function generateNextDailyMission(
  input: GenerateNextDailyMissionInput
): Promise<GenerateNextDailyMissionOutput> {
  return generateNextDailyMissionFlow(input);
}

const generateNextDailyMissionFlow = ai.defineFlow(
  {
    name: 'generateNextDailyMissionFlow',
    inputSchema: GenerateNextDailyMissionInputSchema,
    outputSchema: GenerateNextDailyMissionOutputSchema,
  },
  async (input) => {
    const historyPrompt = input.history
      ? `O histórico de missões concluídas recentemente é: ${input.history}`
      : 'Esta é a primeira missão para este objetivo.';

    const feedbackPrompt = input.feedback
        ? `IMPORTANTE: O utilizador deu um feedback sobre a última missão: "${input.feedback}". Leve isso em consideração para ajustar a dificuldade da nova missão. Se o feedback indica que foi 'muito difícil', torne a próxima missão um passo menor e mais simples. Se foi 'muito fácil', aumente ligeiramente a complexidade. Se o utilizador descreveu um problema específico, use esse contexto para criar o próximo passo.`
        : '';

    let deadlinePrompt = '';
    if (input.goalDeadline) {
        const today = new Date();
        today.setHours(0,0,0,0);
        const deadline = new Date(input.goalDeadline);
        const diffTime = deadline.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays >= 0) {
            deadlinePrompt = `DIRETIVA DE PRAZO: A data de hoje é ${today.toLocaleDateString()}. A meta final tem um prazo. Faltam ${diffDays} dias. Se o tempo for curto (menos de 14 dias), sugira uma missão um pouco mais ambiciosa ou impactante para garantir que o objetivo seja alcançado a tempo. Se o prazo estiver confortável (mais de 30 dias), mantenha um ritmo sustentável.`;
        }
    }


    const finalPrompt = `Você é o 'Sistema' de um RPG da vida real, um especialista em criação de hábitos. O utilizador (Nível ${input.userLevel}) está a trabalhar na missão épica "${input.rankedMissionName}", ligada à meta "${input.metaName}". ${historyPrompt} ${feedbackPrompt} ${deadlinePrompt}
A sua diretiva é criar a PRÓXIMA missão diária. Siga estas regras:

1.  **Nome e Descrição Gerais:** Crie um nome geral e inspirador para a missão diária (ex: "Sessão de Treino Matinal", "Foco Profundo em Código") e uma breve descrição motivacional.
2.  **Sub-tarefas (O MAIS IMPORTANTE):** Crie de 1 a 5 sub-tarefas que compõem a missão diária. ESTAS são as ações que o utilizador irá de facto realizar e acompanhar.
    *   Cada sub-tarefa deve ser EXTREMAMENTE ESPECÍFICA e MENSURÁVEL. O nome da sub-tarefa deve ser a própria ação (ex: "Caminhada leve", "Escrever código de teste", "Ler artigo técnico").
    *   Defina um 'target' numérico claro para cada sub-tarefa.
    *   Defina uma 'unit' (unidade) quando apropriado (ex: "minutos", "repetições", "páginas", "problemas").
    *   **Exemplo de Sub-tarefas Boas:**
        *   { name: "Fazer flexões", target: 20, unit: "repetições" }
        *   { name: "Meditar em silêncio", target: 10, unit: "minutos" }
        *   { name: "Resolver problemas de algoritmo", target: 2, unit: "problemas" }
    *   **Exemplo de Sub-tarefa Ruim:** { name: "Exercitar" } (Não é específico nem mensurável).

3.  **Recursos de Aprendizagem (Opcional):** Se a missão envolver conhecimento técnico, forneça até 3 URLs de recursos de aprendizagem de alta qualidade (documentação, vídeos, artigos) que ajudem diretamente a concluir as sub-tarefas.

Gere uma missão que seja o próximo passo lógico e atómico. Não repita missões do histórico.
`;

    const MissionSchema = z.object({
        nextMissionName: z.string(),
        nextMissionDescription: z.string(),
        learningResources: z.array(z.string().url()).optional(),
        subTasks: z.array(SubTaskSchema),
    });

    const {output} = await ai.generate({
      prompt: finalPrompt,
      model: 'googleai/gemini-2.5-flash',
      output: {schema: MissionSchema},
    });

    const missionText = `${output!.nextMissionName}: ${output!.nextMissionDescription}`;
    const rewards = await generateMissionRewards({
      missionText,
      userLevel: input.userLevel,
    });

    // Initialize sub-tasks with current progress
    const subTasksWithProgress = output!.subTasks.map(st => ({...st, current: 0}));

    return {
      nextMissionName: output!.nextMissionName,
      nextMissionDescription: output!.nextMissionDescription,
      xp: rewards.xp,
      fragments: rewards.fragments,
      learningResources: output!.learningResources,
      subTasks: subTasksWithProgress,
    };
  }
);
