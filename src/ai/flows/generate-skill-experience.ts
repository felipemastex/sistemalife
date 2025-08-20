'use server';
/**
 * @fileOverview Um agente de IA que calcula o ganho de experiência para uma habilidade.
 *
 * - generateSkillExperience - Calcula a experiência de habilidade ganha ao completar uma missão.
 * - GenerateSkillExperienceInput - O tipo de entrada para a função.
 * - GenerateSkillExperienceOutput - O tipo de retorno para a função.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateSkillExperienceInputSchema = z.object({
  missionText: z.string().describe("O texto completo da missão diária concluída (nome e descrição)."),
  skillLevel: z.number().describe("O nível atual da habilidade relacionada."),
});
export type GenerateSkillExperienceInput = z.infer<typeof GenerateSkillExperienceInputSchema>;

const GenerateSkillExperienceOutputSchema = z.object({
  xp: z.number().describe('A quantidade de XP de habilidade calculada para a missão.'),
});
export type GenerateSkillExperienceOutput = z.infer<typeof GenerateSkillExperienceOutputSchema>;

export async function generateSkillExperience(
  input: GenerateSkillExperienceInput
): Promise<GenerateSkillExperienceOutput> {
  return generateSkillExperienceFlow(input);
}

const generateSkillExperienceFlow = ai.defineFlow(
  {
    name: 'generateSkillExperienceFlow',
    inputSchema: GenerateSkillExperienceInputSchema,
    outputSchema: GenerateSkillExperienceOutputSchema,
  },
  async ({missionText, skillLevel}) => {
    // Fatores de cálculo de XP para habilidades
    const baseXpPerMission = 5; // XP base por missão concluída para a habilidade
    const difficultyMultiplier = 1.5; // Multiplicador para a dificuldade da tarefa
    
    const prompt = `
        Analise a seguinte missão e avalie a sua contribuição para o desenvolvimento de uma habilidade específica.
        Avalie a complexidade e o esforço da tarefa numa escala de 1 a 10.
        - 1-2: Tarefa trivial que reforça marginalmente a habilidade.
        - 3-4: Tarefa simples que pratica um conceito fundamental.
        - 5-6: Tarefa de esforço moderado que combina múltiplos conceitos.
        - 7-8: Tarefa desafiadora que exige resolução de problemas e aplicação profunda da habilidade.
        - 9-10: Tarefa muito difícil que expande significativamente a maestria da habilidade.
        
        Missão Concluída: "${missionText}"
        
        Responda APENAS com um número de 1 a 10 para a contribuição de dificuldade.
    `;

    const {output: difficultyScoreText} = await ai.generate({
      prompt,
      model: 'googleai/gemini-2.5-flash',
    });

    const difficultyScore = parseInt(difficultyScoreText, 10) || 3; // Padrão para 3 se a análise falhar

    // Fórmula para calcular o XP da habilidade
    // Missões dão mais XP para habilidades de nível mais baixo para acelerar o progresso inicial.
    const levelDivisor = Math.max(1, skillLevel / 2);
    const calculatedXP = baseXpPerMission + (difficultyScore * difficultyMultiplier) / levelDivisor;
    
    // Arredondar para o número inteiro mais próximo e garantir um mínimo de 1 XP
    const finalXP = Math.round(Math.max(1, calculatedXP));

    return {xp: finalXP};
  }
);
