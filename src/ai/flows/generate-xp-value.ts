'use server';
/**
 * @fileOverview Um agente de IA que calcula o valor de XP para uma missão.
 *
 * - generateXpValue - Calcula um valor de XP justo com base na dificuldade da missão e no nível do utilizador.
 * - GenerateXpValueInput - O tipo de entrada para a função.
 * - GenerateXpValueOutput - O tipo de retorno para a função.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateXpValueInputSchema = z.object({
  missionText: z.string().describe("O texto completo da missão (nome e descrição)."),
  userLevel: z.number().describe("O nível atual do utilizador."),
});
export type GenerateXpValueInput = z.infer<typeof GenerateXpValueInputSchema>;

const GenerateXpValueOutputSchema = z.object({
  xp: z.number().describe('A quantidade de XP calculada para a missão.'),
});
export type GenerateXpValueOutput = z.infer<typeof GenerateXpValueOutputSchema>;

export async function generateXpValue(
  input: GenerateXpValueInput
): Promise<GenerateXpValueOutput> {
  return generateXpValueFlow(input);
}

const generateXpValueFlow = ai.defineFlow(
  {
    name: 'generateXpValueFlow',
    inputSchema: GenerateXpValueInputSchema,
    outputSchema: GenerateXpValueOutputSchema,
  },
  async ({missionText, userLevel}) => {
    // Fatores de cálculo para atingir ~10950 XP por ano (30XP/dia)
    const baseXP = 15; // XP mínimo para uma tarefa muito simples
    const difficultyMultiplier = 1.2; // Aumenta o XP com base na dificuldade percebida
    const levelMultiplier = 0.2; // Aumenta ligeiramente o XP para jogadores de nível mais alto

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
      model: 'googleai/gemini-2.0-flash',
    });

    const difficultyScore = parseInt(difficultyScoreText, 10) || 4; // Padrão para 4 se a análise falhar

    // Fórmula para calcular o XP
    const calculatedXP = baseXP + (difficultyScore * difficultyMultiplier) + (userLevel * levelMultiplier);
    
    // Arredondar para o número inteiro mais próximo e garantir que está entre 10 e 100
    const finalXP = Math.round(Math.max(10, Math.min(100, calculatedXP)));

    return {xp: finalXP};
  }
);
