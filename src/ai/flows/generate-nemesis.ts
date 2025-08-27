
'use server';
/**
 * @fileOverview Um agente de IA que cria um "Némesis" para uma meta.
 *
 * - generateNemesis - Gera um antagonista temático para um objetivo.
 * - GenerateNemesisInput - O tipo de entrada para a função.
 * - GenerateNemesisOutput - O tipo de retorno para a função.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateNemesisInputSchema = z.object({
  goalName: z.string().describe("O nome da meta do utilizador."),
  goalDescription: z.string().describe("A descrição da meta do utilizador."),
});
export type GenerateNemesisInput = z.infer<typeof GenerateNemesisInputSchema>;

const GenerateNemesisOutputSchema = z.object({
  nemesisName: z.string().describe("O nome criativo e temático para o Némesis. Deve ser uma personificação do principal obstáculo da meta (ex: 'O Titã da Incerteza', 'A Miragem da Procrastinação')."),
  nemesisDescription: z.string().describe("Uma breve descrição (1-2 frases) do que este Némesis representa e como ele desafia o Caçador."),
  maxHealth: z.number().describe("A 'vida' máxima do Némesis, representando a dificuldade total para superar este obstáculo. Deve ser um número entre 1000 e 5000, com base na complexidade percebida da meta."),
});
export type GenerateNemesisOutput = z.infer<typeof GenerateNemesisOutputSchema>;

export async function generateNemesis(
  input: GenerateNemesisInput
): Promise<GenerateNemesisOutput> {
  return generateNemesisFlow(input);
}

const generateNemesisFlow = ai.defineFlow(
  {
    name: 'generateNemesisFlow',
    inputSchema: GenerateNemesisInputSchema,
    outputSchema: GenerateNemesisOutputSchema,
  },
  async (input) => {
    const prompt = `
      Você é o "Forjador de Lendas" do SISTEMA DE VIDA, um RPG da vida real. Sua especialidade é criar antagonistas épicos e simbólicos que representam os maiores desafios de um Caçador.

      A meta do Caçador é: "${input.goalName}"
      Descrição da Meta: ${input.goalDescription}

      Sua tarefa é criar um "Némesis" para esta meta. Siga estas diretivas:
      1.  **Nome Temático:** Crie um nome poderoso e memorável para o Némesis. Ele deve ser uma personificação do obstáculo principal. 
          - Exemplo para "Aprender a programar": "O Guardião do Código Arcano" ou "O Labirinto da Lógica".
          - Exemplo para "Correr uma maratona": "O Fantasma do Sedentarismo" ou "A Muralha da Resistência".
      2.  **Descrição Inspiradora:** Escreva uma breve descrição que explique o que este Némesis representa. Deve ser um desafio, não um desincentivo.
      3.  **Vida Máxima (maxHealth):** Avalie a complexidade e a duração da meta descrita e atribua um valor de 'vida' entre 1000 (para metas mais simples) e 5000 (para metas muito complexas e de longo prazo). Este valor representa o esforço total necessário para superar o desafio.

      Analise a meta e forje um Némesis à altura do desafio.
    `;

    const {output} = await ai.generate({
      prompt: prompt,
      model: 'googleai/gemini-2.5-flash',
      output: { schema: GenerateNemesisOutputSchema },
    });
    return output!;
  }
);
