
'use server';
/**
 * @fileOverview Um agente de IA que calcula o valor de XP e recompensas para uma missão.
 *
 * - generateMissionRewards - Calcula um valor de XP e fragmentos justo com base na dificuldade da missão e no nível do utilizador.
 * - GenerateMissionRewardsInput - O tipo de entrada para a função.
 * - GenerateMissionRewardsOutput - O tipo de retorno para a função.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateMissionRewardsInputSchema = z.object({
  missionText: z.string().describe("O texto completo da missão (nome e descrição)."),
  userLevel: z.number().describe("O nível atual do utilizador."),
});
export type GenerateMissionRewardsInput = z.infer<typeof GenerateMissionRewardsInputSchema>;

const GenerateMissionRewardsOutputSchema = z.object({
  xp: z.number().describe('A quantidade de XP calculada para a missão.'),
  fragments: z.number().describe('A quantidade de fragmentos (moeda do jogo) calculada para a missão.'),
});
export type GenerateMissionRewardsOutput = z.infer<typeof GenerateMissionRewardsOutputSchema>;

export async function generateMissionRewards(
  input: GenerateMissionRewardsInput
): Promise<GenerateMissionRewardsOutput> {
  return generateMissionRewardsFlow(input);
}

const generateMissionRewardsFlow = ai.defineFlow(
  {
    name: 'generateMissionRewardsFlow',
    inputSchema: GenerateMissionRewardsInputSchema,
    outputSchema: GenerateMissionRewardsOutputSchema,
  },
  async ({missionText, userLevel}) => {
    // Fatores de cálculo para atingir ~10950 XP por ano (30XP/dia)
    const baseXP = 15; // XP mínimo para uma tarefa muito simples
    const difficultyMultiplier = 1.2; // Aumenta o XP com base na dificuldade percebida
    const levelMultiplier = 0.2; // Aumenta ligeiramente o XP para jogadores de nível mais alto
    
    // Fatores de cálculo para fragmentos
    const baseFragments = 2;
    const fragmentDifficultyMultiplier = 0.5;
    const fragmentLevelMultiplier = 0.1;

    const prompt = `
        Analise a seguinte missão e avalie a sua complexidade, esforço e tempo necessários numa escala de 1 a 10.
        - 1-2: Tarefa trivial (ex: 'abrir um ficheiro').
        - 3-4: Tarefa simples (ex: 'escrever 10 linhas de código', 'fazer um aquecimento de 5 minutos').
        - 5-6: Tarefa de esforço moderado (ex: 'implementar uma função pequena', 'correr 1km').
        - 7-8: Tarefa desafiadora (ex: 'depurar um bug complexo', 'completar um treino de 45 minutos').
        - 9-10: Tarefa muito difícil ou demorada (ex: 'construir um pequeno componente de UI', 'ler um capítulo de um livro técnico').
        
        Missão: "${missionText}"
        
        Responda APENAS com um número de 1 a 10 para a dificuldade.
    `;

    const {output: difficultyScoreText} = await ai.generate({
      prompt,
      model: 'googleai/gemini-2.5-flash',
    });

    const difficultyScore = parseInt(difficultyScoreText, 10) || 4; // Padrão para 4 se a análise falhar

    // Fórmula para calcular o XP
    const calculatedXP = baseXP + (difficultyScore * difficultyMultiplier) + (userLevel * levelMultiplier);
    const finalXP = Math.round(Math.max(10, Math.min(100, calculatedXP)));
    
    // Fórmula para calcular os fragmentos
    const calculatedFragments = baseFragments + (difficultyScore * fragmentDifficultyMultiplier) + (userLevel * fragmentLevelMultiplier);
    const finalFragments = Math.round(Math.max(1, Math.min(20, calculatedFragments)));


    return {
      xp: finalXP,
      fragments: finalFragments
    };
  }
);
