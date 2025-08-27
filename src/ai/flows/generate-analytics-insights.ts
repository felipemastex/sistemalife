
'use server';
/**
 * @fileOverview Um agente de IA que analisa os dados de progresso de um utilizador e gera insights.
 *
 * - generateAnalyticsInsights - Analisa dados e fornece conselhos estratégicos.
 * - GenerateAnalyticsInsightsInput - O tipo de entrada para a função.
 * - GenerateAnalyticsInsightsOutput - O tipo de retorno para a função.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const InsightSchema = z.object({
  title: z.string().describe("Um título curto e impactante para o insight (ex: 'Pico de Produtividade Matinal', 'Oportunidade de Equilíbrio')."),
  description: z.string().describe("Uma descrição detalhada do padrão observado nos dados."),
  suggestion: z.string().describe("Um conselho acionável e estratégico para o utilizador com base no insight."),
  icon: z.enum(['TrendingUp', 'Target', 'Activity', 'BarChart', 'Sparkles', 'Zap', 'ShieldCheck']).describe("O nome de um ícone da biblioteca lucide-react que melhor representa o insight."),
});

const GenerateAnalyticsInsightsInputSchema = z.object({
  metas: z.string().describe("Os objetivos do utilizador (metas ativas e concluídas) como uma string JSON."),
  missions: z.string().describe("O histórico completo de missões (épicas e diárias concluídas) como uma string JSON."),
});
export type GenerateAnalyticsInsightsInput = z.infer<typeof GenerateAnalyticsInsightsInputSchema>;

const GenerateAnalyticsInsightsOutputSchema = z.object({
  insights: z.array(InsightSchema).describe("Uma lista de 2 a 3 insights analíticos e estratégicos."),
});
export type GenerateAnalyticsInsightsOutput = z.infer<typeof GenerateAnalyticsInsightsOutputSchema>;

export async function generateAnalyticsInsights(
  input: GenerateAnalyticsInsightsInput
): Promise<GenerateAnalyticsInsightsOutput> {
  return generateAnalyticsInsightsFlow(input);
}

const generateAnalyticsInsightsFlow = ai.defineFlow(
  {
    name: 'generateAnalyticsInsightsFlow',
    inputSchema: GenerateAnalyticsInsightsInputSchema,
    outputSchema: GenerateAnalyticsInsightsOutputSchema,
  },
  async (input) => {
    
    const prompt = `
      Você é o "Oráculo Analítico" do SISTEMA DE VIDA, um RPG da vida real. A sua especialidade é analisar dados de progresso e transformar números brutos em sabedoria estratégica.

      A sua tarefa é analisar os seguintes dados de um Caçador:
      - Metas (Ativas e Concluídas): ${input.metas}
      - Histórico de Missões Concluídas: ${input.missions}

      **DIRETIVAS PARA A ANÁLISE:**
      1.  **Identifique Padrões Significativos:** Procure por padrões interessantes nos dados. Não se limite a contar coisas.
          - O Caçador tem mais sucesso em missões de uma categoria específica (ex: 'Saúde & Fitness')?
          - Existe um desequilíbrio notável? (Muitas metas de 'Carreira', mas nenhuma de 'Social').
          - O Caçador tende a concluir missões em dias ou horários específicos (se os dados permitirem essa inferência)?
          - Há alguma meta antiga que está estagnada há muito tempo?
      2.  **Gere de 2 a 3 Insights de Alta Qualidade:** Para cada padrão que você identificar, transforme-o num "insight".
      3.  **Estrutura do Insight:** Cada insight deve ter:
          - **title:** Um título curto e cativante.
          - **description:** Uma explicação clara do padrão que você encontrou nos dados.
          - **suggestion:** O mais importante - um conselho estratégico e ACIONÁVEL que o Caçador pode seguir. Diga o que ele pode fazer para capitalizar um ponto forte ou mitigar um ponto fraco.
          - **icon:** Escolha o ícone mais apropriado da lista fornecida que represente o tema do insight.

      **EXEMPLO DE INSIGHT:**
      - title: "Especialista em Fitness"
      - description: "A análise mostra que 60% das suas missões concluídas nos últimos 30 dias pertencem à categoria 'Saúde & Fitness', indicando um foco e sucesso notáveis nesta área."
      - suggestion: "Considere aumentar o desafio: crie uma nova meta de fitness de rank mais elevado ou explore a Torre dos Desafios com um desafio focado em 'Constituição' para capitalizar este momentum."
      - icon: "TrendingUp"

      Analise os dados fornecidos e gere o seu relatório em formato JSON.
    `;

    const {output} = await ai.generate({
        prompt: prompt,
        model: 'googleai/gemini-2.5-flash',
        output: { schema: GenerateAnalyticsInsightsOutputSchema },
    });
    return output!;
  }
);
