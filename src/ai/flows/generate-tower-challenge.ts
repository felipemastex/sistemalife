
'use server';
/**
 * @fileOverview Um agente de IA que gera um desafio para a Torre dos Desafios.
 *
 * - generateTowerChallenge - Gera um desafio com base no andar e no perfil do utilizador.
 * - GenerateTowerChallengeInput - O tipo de entrada para a função.
 * - GenerateTowerChallengeOutput - O tipo de retorno para a função.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ChallengeRequirementSchema = z.object({
  type: z.enum(['mission_completed', 'skill_level_reached', 'streak_maintained', 'guild_activity', 'level_reached', 'missions_in_category_completed'])
    .describe("O tipo de critério para completar o desafio."),
  value: z.string().or(z.number()).describe("O valor alvo para o critério (ex: 5, 'Saúde & Fitness')."),
  target: z.number().describe("A meta numérica que o critério precisa de atingir."),
});

const ChallengeRewardsSchema = z.object({
  xp: z.number().describe("A quantidade de XP ganho."),
  fragments: z.number().describe("O número de fragmentos ganhos."),
  premiumFragments: z.number().optional().describe("O número de fragmentos premium ganhos (mais raro)."),
});

const GenerateTowerChallengeInputSchema = z.object({
    floorNumber: z.number().describe('O número do andar para o qual gerar o desafio. Este é o principal fator de dificuldade.'),
    userProfile: z.string().describe('O perfil do utilizador como uma string JSON, incluindo nível, estatísticas e streak.'),
    userSkills: z.string().describe('As habilidades do utilizador como uma string JSON, incluindo níveis e categorias.'),
    activeGoals: z.string().describe('As metas ativas do utilizador como uma string JSON.'),
    recentChallenges: z.array(z.string()).optional().describe('Uma lista de títulos de desafios recentes para evitar repetição.'),
});
export type GenerateTowerChallengeInput = z.infer<typeof GenerateTowerChallengeInputSchema>;


const GenerateTowerChallengeOutputSchema = z.object({
  id: z.string().describe("Um ID único para o desafio (ex: 'floor50_daily_1')."),
  title: z.string().describe("O título épico e temático para o desafio."),
  description: z.string().describe("Uma breve descrição do que é necessário para completar o desafio."),
  type: z.enum(['daily', 'weekly', 'special', 'guild', 'class', 'skill']).describe("O tipo de desafio a ser gerado."),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced', 'expert', 'master']).describe("A dificuldade do desafio, baseada no andar."),
  requirements: z.array(ChallengeRequirementSchema).describe("Os requisitos específicos e mensuráveis para completar o desafio."),
  rewards: ChallengeRewardsSchema.describe("As recompensas a serem concedidas após a conclusão."),
  timeLimit: z.number().optional().describe("O limite de tempo em horas, se aplicável (ex: 24 para diário, 168 para semanal)."),
});
export type GenerateTowerChallengeOutput = z.infer<typeof GenerateTowerChallengeOutputSchema>;

export async function generateTowerChallenge(
  input: GenerateTowerChallengeInput
): Promise<GenerateTowerChallengeOutput> {
  return generateTowerChallengeFlow(input);
}


const generateTowerChallengeFlow = ai.defineFlow(
  {
    name: 'generateTowerChallengeFlow',
    inputSchema: GenerateTowerChallengeInputSchema,
    outputSchema: GenerateTowerChallengeOutputSchema,
  },
  async (input) => {
    
    const prompt = `
      Você é a "Arquiteta da Torre", uma IA especializada em criar desafios progressivos e personalizados para um RPG da vida real.

      A sua tarefa é criar um novo desafio para um Caçador na Torre dos Desafios.

      **DADOS DO CAÇADOR E DO CONTEXTO:**
      - Andar Atual: ${input.floorNumber}
      - Perfil do Caçador: ${input.userProfile}
      - Habilidades do Caçador: ${input.userSkills}
      - Metas Ativas do Caçador: ${input.activeGoals}
      - Desafios Recentes (a evitar): ${input.recentChallenges?.join(', ') || 'Nenhum'}

      **DIRETIVAS PARA A CRIAÇÃO DO DESAFIO:**
      1.  **Escala de Dificuldade:** A dificuldade DEVE ser diretamente proporcional ao número do andar.
          - Andares 1-20 (Beginner): Desafios simples, focados em consistência básica.
          - Andares 21-40 (Intermediate): Desafios que exigem mais tempo e foco.
          - Andares 41-60 (Advanced): Desafios de desenvolvimento de habilidades e disciplina.
          - Andares 61-80 (Expert): Desafios complexos e multidisciplinares.
          - Andares 81-100 (Master): Desafios transformacionais que exigem um alto nível de comprometimento.
      2.  **Personalização:** Analise os dados do Caçador para criar um desafio relevante.
          - Se uma habilidade está baixa, crie um desafio para a incentivar.
          - Se o Caçador está a trabalhar numa meta específica, alinhe o desafio com essa meta.
          - Use as estatísticas do perfil para calibrar as metas numéricas. Um Caçador com 'forca' alta pode aguentar um desafio físico mais exigente.
      3.  **Variedade:** Não repita os desafios recentes. Escolha um tipo de desafio ('type') e um critério ('requirement.type') que ofereça uma nova experiência.
      4.  **Requisitos Claros:** Os requisitos devem ser mensuráveis e acionáveis.
          - Exemplo Bom: { type: 'missions_in_category_completed', value: 'Saúde & Fitness', target: 5 }
          - Exemplo Ruim: "Seja mais saudável."
      5.  **Recompensas Equilibradas:** As recompensas (XP, fragmentos) devem escalar com a dificuldade e o esforço exigido. Desafios de andares mais altos recompensam muito mais.

      Gere um único desafio em formato JSON que siga todas estas diretivas.
    `;

    const {output} = await ai.generate({
        prompt: prompt,
        model: 'googleai/gemini-2.5-flash',
        output: { schema: GenerateTowerChallengeOutputSchema },
    });
    return output!;
  }
);
