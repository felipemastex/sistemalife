
'use server';
/**
 * @fileOverview Um agente de IA que gera uma seleção de itens de loja personalizados.
 *
 * - generateShopItems - Analisa o perfil do utilizador e seleciona itens relevantes da loja.
 * - GenerateShopItemsInput - O tipo de entrada para a função.
 * - GenerateShopItemsOutput - O tipo de retorno para a função.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ShopItemSchema = z.object({
    id: z.string().describe("O ID único do item, conforme definido no catálogo de itens."),
    name: z.string().describe("O nome do item."),
    description: z.string().describe("A descrição do item."),
    price: z.number().describe("O preço do item em fragmentos."),
    category: z.string().describe("A categoria do item (ex: 'Consumíveis')."),
    reasoning: z.string().optional().describe("Uma breve explicação (1 frase) do porquê este item está a ser recomendado ao utilizador."),
});

const GenerateShopItemsInputSchema = z.object({
    profile: z.string().describe("O perfil do utilizador, incluindo nível, fragmentos, streak, etc., como uma string JSON."),
    skills: z.string().describe("As habilidades atuais do utilizador, como uma string JSON."),
    activeMissions: z.string().describe("As missões ativas do utilizador, como uma string JSON."),
    allItems: z.array(ShopItemSchema).describe("O catálogo completo de todos os itens disponíveis no jogo."),
});
export type GenerateShopItemsInput = z.infer<typeof GenerateShopItemsInputSchema>;

const GenerateShopItemsOutputSchema = z.object({
    recommendedItems: z.array(ShopItemSchema).describe("Uma lista de 3 a 5 itens recomendados para o utilizador."),
});
export type GenerateShopItemsOutput = z.infer<typeof GenerateShopItemsOutputSchema>;

export async function generateShopItems(
  input: GenerateShopItemsInput
): Promise<GenerateShopItemsOutput> {
  return generateShopItemsFlow(input);
}

const generateShopItemsFlow = ai.defineFlow(
  {
    name: 'generateShopItemsFlow',
    inputSchema: GenerateShopItemsInputSchema,
    outputSchema: GenerateShopItemsOutputSchema,
  },
  async (input) => {
    const prompt = `
        Você é o "Mercador do Sistema", uma IA especializada em economia de jogos e comportamento do jogador. A sua tarefa é analisar o perfil de um utilizador e o catálogo de itens da loja para criar uma seleção de ofertas diárias personalizada e estratégica.

        Dados do Utilizador:
        - Perfil: ${input.profile}
        - Habilidades: ${input.skills}
        - Missões Ativas: ${input.activeMissions}

        Catálogo Completo de Itens:
        ${JSON.stringify(input.allItems, null, 2)}

        Com base em todos estes dados, siga as seguintes diretivas para selecionar entre 3 a 5 itens para a loja do utilizador:
        1.  **Análise de Necessidade:** Avalie a situação atual do utilizador.
            - O streak está baixo ou em risco? O "Amuleto da Segunda Chance" é uma ótima oferta.
            - O utilizador está a lutar com uma missão específica? O "Pergaminho do Esquecimento" pode ser útil.
            - O utilizador está a focar-se numa habilidade específica? A "Essência de Habilidade" é relevante.
            - O utilizador quer acelerar o progresso geral? A "Poção de Foco Intenso" é uma boa escolha.
        2.  **Análise Económica:** Considere a quantidade de fragmentos que o utilizador possui. Ofereça uma mistura de itens que ele pode comprar agora e itens um pouco mais caros para ele poupar. Não ofereça itens que sejam impossivelmente caros.
        3.  **Evitar Redundância:** Não ofereça itens cujo efeito já esteja ativo para o utilizador. Por exemplo, se um 'xp_boost' já está ativo, não ofereça outra poção de XP.
        4.  **Justificativa (reasoning):** Para cada item selecionado, adicione uma pequena frase no campo 'reasoning' explicando PORQUÊ aquele item é uma boa sugestão para o utilizador naquele momento. Ex: "Para o ajudar a ultrapassar aquela missão difícil." ou "Para proteger a sua impressionante sequência de vitórias."

        O seu resultado deve ser um objeto JSON contendo uma lista de 'recommendedItems'.
    `;

    const {output} = await ai.generate({
      prompt,
      model: 'googleai/gemini-2.5-flash',
      output: { schema: GenerateShopItemsOutputSchema },
    });

    return output!;
  }
);
