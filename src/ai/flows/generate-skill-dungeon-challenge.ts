
'use server';
/**
 * @fileOverview Um agente de IA que gera desafios práticos para uma Masmorra de Habilidade.
 *
 * - generateSkillDungeonChallenge - Gera um desafio com base na habilidade e no nível da sala.
 * - GenerateSkillDungeonChallengeInput - O tipo de entrada para a função.
 * - GenerateSkillDungeonChallengeOutput - O tipo de retorno para a função.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DungeonChallengeSchema = z.object({
  roomLevel: z.number().describe("O nível da sala para o qual este desafio foi gerado."),
  challengeName: z.string().describe("Um nome curto e temático para o desafio (ex: 'O Teste das Variáveis', 'A Forja dos Componentes')."),
  challengeDescription: z.string().describe("Uma descrição clara e concisa do que o Caçador precisa fazer. Deve ser uma tarefa prática e verificável."),
  successCriteria: z.string().describe("O critério de sucesso que o Caçador deve confirmar para provar que completou o desafio (ex: 'Cole o código da sua função aqui', 'Faça upload de um screenshot do seu componente renderizado')."),
  xpReward: z.number().describe("A quantidade de XP de HABILIDADE (não de perfil) que este desafio concede."),
});

const GenerateSkillDungeonChallengeInputSchema = z.object({
    skillName: z.string().describe('O nome da habilidade para a qual gerar o desafio.'),
    skillDescription: z.string().describe('A descrição da habilidade.'),
    skillLevel: z.number().describe('O nível atual da habilidade do Caçador.'),
    dungeonRoomLevel: z.number().describe('O nível da sala da masmorra. Este é o principal fator de dificuldade.'),
    previousChallenges: z.array(z.string()).optional().describe('Uma lista de nomes de desafios anteriores nesta masmorra para evitar repetição.'),
});
export type GenerateSkillDungeonChallengeInput = z.infer<typeof GenerateSkillDungeonChallengeInputSchema>;


const GenerateSkillDungeonChallengeOutputSchema = DungeonChallengeSchema;
export type GenerateSkillDungeonChallengeOutput = z.infer<typeof GenerateSkillDungeonChallengeOutputSchema>;

export async function generateSkillDungeonChallenge(
  input: GenerateSkillDungeonChallengeInput
): Promise<GenerateSkillDungeonChallengeOutput> {
  return generateSkillDungeonChallengeFlow(input);
}


const generateSkillDungeonChallengeFlow = ai.defineFlow(
  {
    name: 'generateSkillDungeonChallengeFlow',
    inputSchema: GenerateSkillDungeonChallengeInputSchema,
    outputSchema: GenerateSkillDungeonChallengeOutputSchema,
  },
  async (input) => {
    
    const prompt = `
      Você é o "Mestre da Masmorra", uma IA especializada em criar desafios práticos e focados para desenvolver uma habilidade específica.

      A sua tarefa é criar um desafio para a Masmorra da Habilidade: "${input.skillName}".
      - Descrição da Habilidade: ${input.skillDescription}
      - Nível atual da Habilidade do Caçador: ${input.skillLevel}
      - Nível da Sala da Masmorra (Dificuldade): ${input.dungeonRoomLevel}
      - Desafios Anteriores (a evitar): ${input.previousChallenges?.join(', ') || 'Nenhum'}

      **DIRETIVAS PARA A CRIAÇÃO DO DESAFIO:**
      1.  **Desafio Prático e Específico:** O desafio deve ser uma tarefa concreta e aplicável que teste o conhecimento do Caçador naquela habilidade. Não peça teoria, peça prática.
          - **Exemplo Bom (para Habilidade 'Programação Python'):** "Escreva uma função em Python que receba uma lista de números e retorne a média."
          - **Exemplo Ruim:** "Explique o que é uma função em Python."
      2.  **Dificuldade Progressiva:** A complexidade do desafio DEVE escalar com o 'dungeonRoomLevel'. Salas de nível baixo devem testar conceitos fundamentais, enquanto salas de nível alto devem testar conceitos avançados ou a combinação de vários conceitos. Use o 'skillLevel' do Caçador como referência para o seu nível de conhecimento geral.
      3.  **Critério de Sucesso Claro:** O 'successCriteria' deve dizer ao Caçador EXATAMENTE o que ele precisa de fazer para provar a conclusão. "Cole o seu código", "Faça upload de um screenshot", "Grave um vídeo de 1 minuto a demonstrar" são bons exemplos.
      4.  **Recompensa de XP Equilibrada:** A recompensa de XP deve ser significativa e escalar com a dificuldade. Uma boa base é (5 * dungeonRoomLevel).

      Gere um único desafio em formato JSON que siga todas estas diretivas.
    `;

    const {output} = await ai.generate({
        prompt: prompt,
        model: 'googleai/gemini-2.5-flash',
        output: { schema: GenerateSkillDungeonChallengeOutputSchema },
    });
    return output!;
  }
);
```