'use server';
/**
 * @fileOverview Um agente de IA que gera a próxima missão diária com base no progresso.
 *
 * - generateNextDailyMission - Gera a próxima missão diária atómica.
 * - GenerateNextDailyMissionInput - O tipo de entrada para a função.
 * - GenerateNextDailyMissionOutput - O tipo de retorno para a função.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateNextDailyMissionInputSchema = z.object({
  rankedMissionName: z.string().describe("O nome da missão épica ou ranqueada principal."),
  metaName: z.string().describe("A meta de longo prazo associada a esta missão."),
  history: z.string().describe("O histórico das últimas missões diárias concluídas para dar contexto."),
  userLevel: z.number().describe("O nível atual do utilizador para ajustar a dificuldade."),
});
export type GenerateNextDailyMissionInput = z.infer<typeof GenerateNextDailyMissionInputSchema>;

const GenerateNextDailyMissionOutputSchema = z.object({
    nextMissionName: z.string().describe("O nome da próxima pequena missão diária. Deve ser muito específico."),
    nextMissionDescription: z.string().describe("Uma breve descrição da próxima missão diária. Deve ser detalhada e acionável."),
    xp: z.number().describe("A quantidade de XP para a nova missão, geralmente entre 15 e 50."),
});
export type GenerateNextDailyMissionOutput = z.infer<typeof GenerateNextDailyMissionOutputSchema>;

export async function generateNextDailyMission(
  input: GenerateNextDailyMissionInput
): Promise<GenerateNextDailyMissionOutput> {
  return generateNextDailyMissionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateNextDailyMissionPrompt',
  input: {schema: GenerateNextDailyMissionInputSchema},
  output: {schema: GenerateNextDailyMissionOutputSchema},
  prompt: `Você é o 'Sistema' de um RPG da vida real, um especialista em criação de hábitos com base no livro "Hábitos Atómicos". O utilizador (Nível {{userLevel}}) está a trabalhar na missão épica "{{rankedMissionName}}", que está ligada à sua meta de longo prazo: "{{metaName}}".{{#if history}} O histórico de missões concluídas recentemente é: {{history}}{{/if}} Sua diretiva é criar a PRÓXIMA missão diária, que deve ser o próximo passo lógico. A missão deve ser EXTREMAMENTE ESPECÍFICA e DETALHADA. Não crie missões genéricas como "estude mais". Siga os princípios de "Hábitos Atómicos": 1. **Torne-a Óbvia:** A missão deve ser clara e inequívoca. Ex: "Abra o seu editor de código e encontre a função 'calcularTotal'." 2. **Torne-a Atraente:** Formule a missão de uma forma que soe como um progresso, não uma tarefa. Ex: "Execute o seu primeiro teste unitário para validar o cálculo." 3. **Torne-a Fácil:** Deve ser um passo muito pequeno, uma melhoria de 1%. Algo que pode ser feito em menos de 15 minutos. Aumente a dificuldade apenas ligeiramente em relação à tarefa anterior. 4. **Torne-a Satisfatória:** A descrição deve implicar a sensação de realização. Gere uma única missão que seja o próximo passo lógico, específico e pequeno. A recompensa de XP deve ser pequena, refletindo o pequeno esforço (entre 15 e 50 XP). Não repita as missões do histórico.`,
});

const generateNextDailyMissionFlow = ai.defineFlow(
  {
    name: 'generateNextDailyMissionFlow',
    inputSchema: GenerateNextDailyMissionInputSchema,
    outputSchema: GenerateNextDailyMissionOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
