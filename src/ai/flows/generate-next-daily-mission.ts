
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
  current: z.number().optional().describe("O progresso atual da sub-tarefa, que deve ser inicializado como 0.")
});


const GenerateNextDailyMissionInputSchema = z.object({
  rankedMissionName: z.string().describe("O nome da missão épica ou ranqueada principal."),
  metaName: z.string().describe("A meta de longo prazo associada a esta missão."),
  goalDeadline: z.string().nullable().optional().describe("A data final para a meta (prazo), no formato YYYY-MM-DD."),
  history: z.string().describe("O histórico das últimas missões diárias concluídas para dar contexto."),
  userLevel: z.number().describe("O nível atual do utilizador para ajustar a dificuldade."),
  feedback: z.string().optional().describe("Feedback do utilizador sobre a missão anterior (ex: 'muito fácil', 'muito difícil', ou um texto descritivo) para calibrar a próxima."),
});
export type GenerateNextDailyMissionInput = z.infer<typeof GenerateNextDailyMissionInputSchema>;

const GenerateNextDailyMissionOutputSchema = z.object({
    nextMissionName: z.string().describe("O nome da próxima pequena missão diária. Deve ser muito específico (ex: 'Treino de Força Fundamental', 'Sessão de Estudo Focada')."),
    nextMissionDescription: z.string().describe("Uma breve descrição da missão diária, explicando o seu propósito em 1-2 frases."),
    xp: z.number().describe("A quantidade de XP para a nova missão."),
    fragments: z.number().describe("A quantidade de fragmentos (moeda do jogo) para a nova missão."),
    learningResources: z.array(z.string().url()).optional().describe("Uma lista de até 3 URLs de recursos de aprendizagem (sites, vídeos, documentação) relevantes para a missão, se aplicável."),
    subTasks: z.array(SubTaskSchema).describe("Uma lista de 1 a 5 sub-tarefas que compõem a missão diária. Estas devem ser as ações concretas que o utilizador irá realizar e acompanhar."),
    isNemesisChallenge: z.boolean().optional().describe("Indica se esta missão é um desafio especial lançado pelo 'Némesis' da meta, sendo mais difícil que o normal."),
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
        ? `DIRETIVA DE FEEDBACK (MAIS IMPORTANTE): O utilizador deu um feedback sobre a última missão: "${input.feedback}". Leve isto em consideração como a principal diretriz para a dificuldade.
- Se o feedback for 'muito fácil', aumente a complexidade ou a quantidade nas sub-tarefas significativamente. Considere criar uma tarefa que já contribua para a próxima Missão Épica, acelerando a progressão.
- Se o feedback for 'muito difícil', reduza drasticamente a complexidade. Crie uma missão mais simples ou quebre a tarefa anterior num passo ainda menor.
- Se o feedback for 'perfeito' ou descritivo, mantenha uma progressão natural e lógica.`
        : 'Nenhum feedback foi dado. Prossiga com uma progressão natural.';

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


    const finalPrompt = `Você é o 'Sistema' de um RPG da vida real. O utilizador (Nível ${input.userLevel}) está na missão épica "${input.rankedMissionName}", para a meta "${input.metaName}". ${historyPrompt} ${feedbackPrompt} ${deadlinePrompt}
Sua tarefa é criar a PRÓXIMA missão diária. A missão deve ser uma lista de objetivos claros e mensuráveis.

**ATAQUE DO NÉMESIS (Regra Especial):**
Existe uma pequena chance (cerca de 15%) de que o "Némesis" da meta interfira. Se isso acontecer, a missão gerada deve ser um **Desafio do Némesis**.
- **Se for um Desafio do Némesis:** Defina 'isNemesisChallenge' como true. O nome e a descrição da missão devem ser mais ameaçadores e temáticos (ex: "Emboscada da Dúvida", "A Muralha da Preguiça"). O desafio deve ser visivelmente mais difícil do que uma missão normal, exigindo mais esforço, mas ainda alcançável num dia.
- **Se for uma missão normal:** Defina 'isNemesisChallenge' como false (ou omita-o).

**REGRAS GERAIS:**
1.  **Nome da Missão:** Crie um nome geral e inspirador para a missão diária.
2.  **Descrição da Missão:** Escreva uma breve descrição (1-2 frases) que explique o propósito da missão diária.
3.  **Sub-tarefas (O MAIS IMPORTANTE):** Crie de 1 a 5 sub-tarefas. ESTAS são as ações que o utilizador irá realizar.
    *   O **NOME** da sub-tarefa deve ser a ação concreta (ex: "Caminhada leve", "Escrever código de teste").
    *   Defina um **'target'** numérico claro para cada sub-tarefa.
    *   Defina uma **'unit'** (unidade) quando apropriado (ex: "minutos", "repetições", "páginas", "problemas").
4.  **Recursos de Aprendizagem (Opcional):** Se a missão envolver conhecimento técnico, forneça até 3 URLs de recursos de alta qualidade.

Gere uma missão que seja o próximo passo lógico e atómico. Não repita missões do histórico.
`;

    const MissionSchema = z.object({
        nextMissionName: z.string(),
        nextMissionDescription: z.string(),
        learningResources: z.array(z.string().url()).optional(),
        subTasks: z.array(SubTaskSchema),
        isNemesisChallenge: z.boolean().optional(),
    });

    const {output} = await ai.generate({
      prompt: finalPrompt,
      model: 'googleai/gemini-2.5-flash',
      output: {schema: MissionSchema},
    });

    const missionTextForRewards = `${output!.nextMissionName}: ${output!.subTasks.map(st => st.name).join(', ')}`;
    const rewards = await generateMissionRewards({
      missionText: missionTextForRewards,
      userLevel: input.userLevel,
    });
    
    // Aumentar a recompensa se for um desafio do Némesis
    const finalXp = output?.isNemesisChallenge ? Math.round(rewards.xp * 1.5) : rewards.xp;
    const finalFragments = output?.isNemesisChallenge ? Math.round(rewards.fragments * 1.5) : rewards.fragments;


    const subTasksWithProgress = output!.subTasks.map(st => ({...st, current: 0 }));

    return {
      nextMissionName: output!.nextMissionName,
      nextMissionDescription: output!.nextMissionDescription,
      xp: finalXp,
      fragments: finalFragments,
      learningResources: output!.learningResources,
      subTasks: subTasksWithProgress,
      isNemesisChallenge: output!.isNemesisChallenge || false,
    };
  }
);
