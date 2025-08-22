
'use server';
/**
 * @fileOverview Um agente de IA que gera missões cooperativas para guildas.
 *
 * - generateGuildQuest - Gera uma missão de guilda completa com base num tema.
 * - GenerateGuildQuestInput - O tipo de entrada para a função.
 * - GenerateGuildQuestOutput - O tipo de retorno para a função.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SubTaskSchema = z.object({
  name: z.string().describe("O nome da sub-tarefa específica e acionável (ex: 'Resolver 10 problemas de algoritmo', 'Correr um total de 20km', 'Ler 50 páginas de um livro técnico')."),
  target: z.number().describe("A meta numérica para esta sub-tarefa (ex: 10, 20, 50)."),
  attribute: z.enum(['forca', 'inteligencia', 'sabedoria', 'constituicao', 'destreza', 'carisma']).describe("O atributo principal do perfil do utilizador que influencia esta tarefa."),
  daily_limit_per_member: z.number().describe("O limite máximo que um único membro pode contribuir para esta subtarefa por dia. Deve ser um valor razoável para incentivar a colaboração."),
});

const GenerateGuildQuestInputSchema = z.object({
  theme: z.string().describe("O tema geral para a missão da guilda (ex: 'Foco em fitness esta semana', 'Vamos codificar!', 'Hora de socializar')."),
  guildLevel: z.number().describe("O nível médio ou total da guilda, para ajudar a calibrar a dificuldade."),
  memberCount: z.number().describe("O número de membros na guilda, para ajustar as metas numéricas para serem desafiadoras, mas alcançáveis."),
});
export type GenerateGuildQuestInput = z.infer<typeof GenerateGuildQuestInputSchema>;

const GenerateGuildQuestOutputSchema = z.object({
  questName: z.string().describe("O nome temático e épico para a missão da guilda (ex: 'A Semana da Forja de Ferro', 'A Maratona do Código', 'O Festival da Influência')."),
  questDescription: z.string().describe("Uma breve descrição que explica o objetivo da missão e inspira os membros a colaborar."),
  subTasks: z.array(SubTaskSchema).describe("Uma lista de 3 a 5 sub-tarefas cooperativas que todos os membros da guilda contribuirão para completar."),
});
export type GenerateGuildQuestOutput = z.infer<typeof GenerateGuildQuestOutputSchema>;

export async function generateGuildQuest(
  input: GenerateGuildQuestInput
): Promise<GenerateGuildQuestOutput> {
  return generateGuildQuestFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateGuildQuestPrompt',
  input: {schema: GenerateGuildQuestInputSchema},
  output: {schema: GenerateGuildQuestOutputSchema},
  prompt: `Você é o "Mestre de Missões" do SISTEMA DE VIDA, um RPG da vida real. Sua especialidade é criar missões de guilda cooperativas e envolventes.

Uma guilda com {{memberCount}} membros e nível médio de {{guildLevel}} quer uma nova missão focada no seguinte tema: "{{theme}}".

Sua tarefa é criar uma Missão de Guilda completa. Siga estas diretivas:
1.  **Nome e Descrição Épicos:** Crie um nome de missão e uma descrição que sejam inspiradores e se alinhem com o tema. Use uma linguagem de RPG.
2.  **Sub-tarefas Cooperativas e ACIONÁVEIS:** Gere de 3 a 5 sub-tarefas. O NOME da sub-tarefa deve ser a AÇÃO CONCRETA que o membro deve fazer.
    *   Cada sub-tarefa deve ter um objetivo numérico claro ('target'). A meta deve ser dimensionada de forma apropriada para o número de membros e o nível da guilda. Deve ser um desafio que exija a colaboração de vários membros ao longo de alguns dias.
    *   Cada sub-tarefa deve estar ligada a um dos seis atributos do sistema: forca, inteligencia, sabedoria, constituicao, destreza, carisma.
    *   **IMPORTANTE:** Para cada sub-tarefa, defina um 'daily_limit_per_member'. Este é o valor máximo que um único membro pode contribuir por dia para essa tarefa. Este limite deve ser uma fração razoável do alvo total (geralmente entre 10% e 30% do alvo, dependendo da natureza da tarefa) para garantir que a colaboração seja necessária.

Exemplo de uma sub-tarefa bem definida para o tema "Foco em fitness":
- name: "Correr um total de 20km"
- target: 20
- attribute: "constituicao"
- daily_limit_per_member: 5

Analise o tema e os dados da guilda para construir a missão mais eficaz e motivadora possível.
`,
});

const generateGuildQuestFlow = ai.defineFlow(
  {
    name: 'generateGuildQuestFlow',
    inputSchema: GenerateGuildQuestInputSchema,
    outputSchema: GenerateGuildQuestOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
