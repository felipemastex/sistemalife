
'use server';
/**
 * @fileOverview Um agente de IA que cria um roteiro estratégico para atingir uma meta.
 *
 * - generateGoalRoadmap - Gera um plano passo a passo para uma meta.
 * - GenerateGoalRoadmapInput - O tipo de entrada para a função.
 * - GenerateGoalRoadmapOutput - O tipo de retorno para a função.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RoadmapPhaseSchema = z.object({
  phaseTitle: z.string().describe("O título temático para a fase (ex: 'Fase 1: A Fundação do Conhecimento', 'Fase 2: As Primeiras Batalhas')."),
  phaseDescription: z.string().describe("Uma breve descrição do objetivo principal desta fase da jornada."),
  strategicMilestones: z.array(z.string()).describe("Uma lista de 3 a 5 marcos estratégicos ou objetivos chave a serem alcançados dentro desta fase."),
});

const GenerateGoalRoadmapInputSchema = z.object({
  goalName: z.string().describe("O nome da meta do utilizador."),
  goalDetails: z.string().describe("Os detalhes completos (SMART) da meta do utilizador."),
  userLevel: z.number().describe("O nível atual do utilizador, para contextualizar a complexidade da estratégia."),
});
export type GenerateGoalRoadmapInput = z.infer<typeof GenerateGoalRoadmapInputSchema>;

const GenerateGoalRoadmapOutputSchema = z.object({
  roadmap: z.array(RoadmapPhaseSchema).describe("Uma lista de 2 a 4 fases que compõem o roteiro estratégico completo."),
});
export type GenerateGoalRoadmapOutput = z.infer<typeof GenerateGoalRoadmapOutputSchema>;

export async function generateGoalRoadmap(
  input: GenerateGoalRoadmapInput
): Promise<GenerateGoalRoadmapOutput> {
  return generateGoalRoadmapFlow(input);
}

const generateGoalRoadmapFlow = ai.defineFlow(
  {
    name: 'generateGoalRoadmapFlow',
    inputSchema: GenerateGoalRoadmapInputSchema,
    outputSchema: GenerateGoalRoadmapOutputSchema,
  },
  async (input) => {
    
    const prompt = `Você é o "Estratega Mestre" do SISTEMA DE VIDA, um RPG da vida real. Sua especialidade é pegar num grande objetivo e dividi-lo num roteiro estratégico claro e motivador para um Caçador de nível ${input.userLevel}.

A meta do Caçador é: "${input.goalName}"
Detalhes da Meta (SMART): ${input.goalDetails}

Sua tarefa é criar um Roteiro Estratégico. Siga estas diretivas:
1.  **Estrutura em Fases:** Crie entre 2 a 4 fases lógicas. Cada fase deve representar uma etapa significativa da jornada. Dê a cada fase um título épico e temático.
2.  **Marcos Estratégicos:** Para cada fase, defina de 3 a 5 "Marcos Estratégicos". Estes não são pequenas tarefas diárias, mas sim objetivos importantes a serem alcançados nessa fase. Pense neles como as "Missões Principais" de um jogo.
3.  **Linguagem de RPG:** Use uma linguagem que inspire e se encaixe no tema. Use termos como "jornada", "desafio", "maestria", "fundação", "arsenal", "campo de batalha".
4.  **Foco no "Como":** O roteiro não deve ser apenas "o quê", mas também sugerir o "como". Os marcos devem ser acionáveis.
    - Exemplo Ruim: "Aprender Python."
    - Exemplo Bom: "Dominar as estruturas de dados fundamentais (Listas, Dicionários, Tuplas) e quando usar cada uma."

Analise a meta e os seus detalhes para construir o roteiro mais eficaz e inspirador possível.
`;

    const {output} = await ai.generate({
      prompt: prompt,
      model: 'googleai/gemini-2.5-flash',
      output: { schema: GenerateGoalRoadmapOutputSchema },
    });
    return output!;
  }
);
