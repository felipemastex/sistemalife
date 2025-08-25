'use server';
/**
 * @fileOverview Um agente de IA que gera uma lista de conquistas personalizadas para o utilizador.
 *
 * - generateUserAchievements - Analisa o perfil do utilizador e cria conquistas únicas.
 * - GenerateUserAchievementsInput - O tipo de entrada para a função.
 * - GenerateUserAchievementsOutput - O tipo de retorno para a função.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AchievementCriteriaSchema = z.object({
  type: z.enum(['missions_completed', 'level_reached', 'goals_completed', 'skill_level_reached', 'streak_maintained', 'missions_in_category_completed'])
    .describe("O tipo de critério para desbloquear a conquista."),
  value: z.number().describe("O valor numérico que o critério precisa de atingir (ex: 5, 10, 50)."),
  category: z.string().optional().describe("A categoria específica, se o tipo for 'missions_in_category_completed'.")
});


const AchievementSchema = z.object({
  id: z.string().describe("Um ID único para a conquista (ex: 'python_master_1', 'streak_hero_3')."),
  name: z.string().describe("O nome épico e inspirador para a conquista (ex: 'O Início do Programador', 'Maratonista Consistente')."),
  description: z.string().describe("Uma breve descrição que explica o que é necessário para desbloquear esta conquista."),
  icon: z.enum(['Award', 'Book', 'BarChart', 'Gem', 'Shield', 'Flame', 'Trophy', 'BrainCircuit', 'Star', 'Swords']).describe("O nome de um ícone da biblioteca lucide-react que melhor representa a conquista."),
  criteria: AchievementCriteriaSchema.describe("O critério específico e mensurável para desbloquear a conquista."),
});


const GenerateUserAchievementsInputSchema = z.object({
  profile: z.string().describe("O perfil do utilizador, incluindo nível, estatísticas e streak, como uma string JSON."),
  skills: z.string().describe("As habilidades atuais do utilizador, incluindo nomes, níveis e categorias, como uma string JSON."),
  goals: z.string().describe("As metas ativas do utilizador, como uma string JSON."),
  existingAchievementIds: z.array(z.string()).optional().describe("Uma lista de IDs de conquistas que o utilizador já possui, para evitar duplicatas."),
});
export type GenerateUserAchievementsInput = z.infer<typeof GenerateUserAchievementsInputSchema>;


const GenerateUserAchievementsOutputSchema = z.object({
  achievements: z.array(AchievementSchema).describe("Uma lista de 5 a 7 novas conquistas personalizadas para o utilizador."),
});
export type GenerateUserAchievementsOutput = z.infer<typeof GenerateUserAchievementsOutputSchema>;


export async function generateUserAchievements(
  input: GenerateUserAchievementsInput
): Promise<GenerateUserAchievementsOutput> {
  return generateUserAchievementsFlow(input);
}


const generateUserAchievementsFlow = ai.defineFlow(
  {
    name: 'generateUserAchievementsFlow',
    inputSchema: GenerateUserAchievementsInputSchema,
    outputSchema: GenerateUserAchievementsOutputSchema,
  },
  async (input) => {
    const prompt = `
        Você é o "Criador de Lendas" do SISTEMA DE VIDA, um RPG da vida real. A sua tarefa é analisar o perfil de um utilizador e forjar um conjunto de novas conquistas personalizadas para a sua jornada.

        Dados do Utilizador:
        - Perfil: ${input.profile}
        - Habilidades Atuais: ${input.skills}
        - Metas Ativas: ${input.goals}
        - Conquistas já existentes: ${input.existingAchievementIds?.join(', ') || 'Nenhuma'}

        Com base nestes dados, gere entre 5 a 7 novas conquistas. Siga estas diretivas:
        1.  **Personalização:** As conquistas devem ser relevantes para as metas e habilidades ATUAIS do utilizador. Se ele tem uma meta "Aprender a programar", crie conquistas relacionadas a isso. Se ele tem uma habilidade de "Corrida" de nível baixo, crie uma conquista para incentivá-lo.
        2.  **Variedade de Critérios:** Use diferentes tipos de critérios ('type'). Crie conquistas para completar missões, atingir níveis, manter streaks, etc.
        3.  **Dificuldade Progressiva:** Crie uma mistura de conquistas de curto, médio e longo prazo. Algumas devem ser alcançáveis em breve para manter a motivação, outras devem ser desafios maiores. Baseie o 'value' do critério no nível atual do utilizador (ex: se o nível é 10, uma conquista de 'level_reached' deve ser para o nível 15 ou 20, não para o 11). Se o utilizador já completou 50 missões, a próxima conquista de 'missions_completed' deve ser para 75 ou 100.
        4.  **Criatividade:** Dê nomes e descrições épicos a cada conquista. Escolha um ícone da lista que se alinhe tematicamente.
        5.  **Sem Duplicatas:** Não gere conquistas com IDs que já existem na lista 'existingAchievementIds'.

        O seu resultado deve ser um objeto JSON contendo uma lista de conquistas.
    `;

    const {output} = await ai.generate({
      prompt,
      model: 'googleai/gemini-2.5-flash',
      output: { schema: GenerateUserAchievementsOutputSchema },
    });

    return output!;
  }
);
