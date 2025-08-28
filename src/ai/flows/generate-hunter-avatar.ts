
'use server';
/**
 * @fileOverview Um agente de IA que gera um avatar de Caçador com base no perfil.
 *
 * - generateHunterAvatar - Gera uma imagem de avatar única.
 * - GenerateHunterAvatarInput - O tipo de entrada para a função.
 * - GenerateHunterAvatarOutput - O tipo de retorno para a função.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateHunterAvatarInputSchema = z.object({
  level: z.number().describe('O nível atual do Caçador.'),
  rank: z.string().describe('O rank atual do Caçador (ex: "Novato (F)", "Lendário (SSS)").'),
  gender: z.string().optional().describe('O género do Caçador, para influenciar a aparência.'),
  topStats: z.array(z.string()).describe('Uma lista dos 2 a 3 principais atributos do Caçador (ex: ["inteligencia", "sabedoria"]).')
});
export type GenerateHunterAvatarInput = z.infer<typeof GenerateHunterAvatarInputSchema>;

const GenerateHunterAvatarOutputSchema = z.object({
  avatarDataUri: z.string().describe("A imagem do avatar gerada, como um data URI em Base64. Formato esperado: 'data:image/png;base64,<encoded_data>'."),
});
export type GenerateHunterAvatarOutput = z.infer<typeof GenerateHunterAvatarOutputSchema>;

export async function generateHunterAvatar(
  input: GenerateHunterAvatarInput
): Promise<GenerateHunterAvatarOutput> {
  return generateHunterAvatarFlow(input);
}

const generateHunterAvatarFlow = ai.defineFlow(
  {
    name: 'generateHunterAvatarFlow',
    inputSchema: GenerateHunterAvatarInputSchema,
    outputSchema: GenerateHunterAvatarOutputSchema,
  },
  async (input) => {
    const statsDescription = input.topStats.length > 0 ? `focado em ${input.topStats.join(' e ')}` : '';
    const genderTerm = input.gender && input.gender.toLowerCase() !== 'não especificado' ? input.gender : 'figura andrógina';

    const prompt = `
      Crie um sprite de personagem de corpo inteiro em pixel art.
      O personagem é um Caçador de nível ${input.level}, com o rank de "${input.rank}".
      A sua aparência deve refletir uma ${genderTerm} ${statsDescription}.
      Estilo de arte: pixel art, sprite de personagem de RPG 16-bit, corpo inteiro, pose de pé, fundo simples e escuro.
    `;

    const {media} = await ai.generate({
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      prompt: prompt,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    if (!media?.url) {
      throw new Error('A geração de imagem falhou em retornar um avatar.');
    }

    return {
      avatarDataUri: media.url,
    };
  }
);
