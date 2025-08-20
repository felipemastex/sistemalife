'use server';
/**
 * @fileOverview Um agente de IA que fornece conselhos personalizados como o 'Sistema'.
 *
 * - generateSystemAdvice - Uma função que lida com a geração de conselhos personalizados.
 * - GenerateSystemAdviceInput - O tipo de entrada para a função.
 * - GenerateSystemAdviceOutput - O tipo de retorno para a função.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateSystemAdviceInputSchema = z.object({
  userName: z.string().describe('O nome do utilizador.'),
  profile: z.string().describe('Os dados de perfil do utilizador como uma string JSON.'),
  metas: z.string().describe('Os objetivos do utilizador (metas) como uma string JSON.'),
  query: z.string().describe('A pergunta ou diretiva do utilizador.'),
});
export type GenerateSystemAdviceInput = z.infer<typeof GenerateSystemAdviceInputSchema>;

const GenerateSystemAdviceOutputSchema = z.object({
  response: z.string().describe('O conselho gerado pela IA do Sistema.'),
});
export type GenerateSystemAdviceOutput = z.infer<typeof GenerateSystemAdviceOutputSchema>;

export async function generateSystemAdvice(
  input: GenerateSystemAdviceInput
): Promise<GenerateSystemAdviceOutput> {
  return generateSystemAdviceFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateSystemAdvicePrompt',
  input: {schema: GenerateSystemAdviceInputSchema},
  output: {schema: GenerateSystemAdviceOutputSchema},
  prompt: `Você é o 'Sistema', uma IA de um RPG da vida real. O utilizador é {{userName}}.
O perfil dele: {{profile}}
Os seus objetivos a longo prazo (Metas): {{metas}}

Diretiva do utilizador: "{{query}}"

Responda de forma concisa, no personagem do Sistema. Seja útil e estratégico.`,
});

const generateSystemAdviceFlow = ai.defineFlow(
  {
    name: 'generateSystemAdviceFlow',
    inputSchema: GenerateSystemAdviceInputSchema,
    outputSchema: GenerateSystemAdviceOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return { response: output!.response };
  }
);
