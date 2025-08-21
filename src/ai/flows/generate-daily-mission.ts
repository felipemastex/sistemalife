
'use server';
/**
 * @fileOverview Um agente de IA que gera a próxima missão diária com base no progresso.
 *
 * - generateNextDailyMission - Gera a próxima missão diária atómica.
 * - GenerateNextDailyMissionInput - O tipo de entrada para a função.
 * - GenerateNextDailyMissionOutput - O tipo de retorno para a função.
 */

import {ai} from '@/ai/genkit';
import {generateXpValue} from './generate-xp-value';
import {z} from 'genkit';

const GenerateNextDailyMissionInputSchema = z.object({
  rankedMissionName: z.string().describe("O nome da missão épica ou ranqueada principal."),
  metaName: z.string().describe("A meta de longo prazo associada a esta missão."),
  goalDeadline: z.string().optional().describe("A data final para a meta (prazo), no formato YYYY-MM-DD."),
  history: z.string().describe("O histórico das últimas missões diárias concluídas para dar contexto."),
  userLevel: z.number().describe("O nível atual do utilizador para ajustar a dificuldade."),
  feedback: z.string().optional().describe("Feedback do utilizador sobre a missão anterior (ex: 'muito fácil', 'muito difícil', ou um texto descritivo) para calibrar a próxima."),
});
export type GenerateNextDailyMissionInput = z.infer<typeof GenerateNextDailyMissionInputSchema>;

const GenerateNextDailyMissionOutputSchema = z.object({
    nextMissionName: z.string().describe("O nome da próxima pequena missão diária. Deve ser muito específico."),
    nextMissionDescription: z.string().describe("Uma breve descrição da próxima missão diária. Deve ser detalhada e acionável."),
    xp: z.number().describe("A quantidade de XP para a nova missão."),
    learningResources: z.array(z.string().url()).optional().describe("Uma lista de até 3 URLs de recursos de aprendizagem (sites, vídeos, documentação) relevantes para a missão, se aplicável."),
});
export type GenerateNextDailyMissionOutput = z.infer<typeof GenerateNextDailyMissionOutputSchema>;

export async function generateNextDailyMission(
  input: GenerateNextDailyMissionInput
): Promise<GenerateNextDailyMissionOutput> {
  return generateNextDailyMissionFlow(input);
}

const generateNextDailyMissionFlow = ai.defineFlow(
  {
    name: 'generateNextDailyMissionFlow',
    inputSchema: GenerateNextDailyMissionInputSchema,
    outputSchema: GenerateNextDailyMissionOutputSchema,
  },
  async (input) => {
    const historyPrompt = input.history
      ? `O histórico de missões concluídas recentemente é: ${input.history}`
      : 'Esta é a primeira missão para este objetivo.';

    const feedbackPrompt = input.feedback
        ? `IMPORTANTE: O utilizador deu um feedback sobre a última missão: "${input.feedback}". Leve isso em consideração para ajustar a dificuldade da nova missão. Se o feedback indica que foi 'muito difícil', torne a próxima missão um passo menor e mais simples. Se foi 'muito fácil', aumente ligeiramente a complexidade. Se o utilizador descreveu um problema específico, use esse contexto para criar o próximo passo.`
        : '';

    let deadlinePrompt = '';
    if (input.goalDeadline) {
        const today = new Date();
        today.setHours(0,0,0,0);
        const deadline = new Date(input.goalDeadline);
        const diffTime = deadline.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays >= 0) {
            deadlinePrompt = `DIRETIVA DE PRAZO: A meta final tem um prazo. Faltam ${diffDays} dias. Se o tempo for curto (menos de 14 dias), sugira uma missão um pouco mais ambiciosa ou impactante para garantir que o objetivo seja alcançado a tempo. Se o prazo estiver confortável (mais de 30 dias), mantenha um ritmo sustentável.`;
        }
    }


    const finalPrompt = `Você é o 'Sistema' de um RPG da vida real, um especialista em criação de hábitos e um mentor técnico. O utilizador (Nível ${input.userLevel}) está a trabalhar na missão épica "${input.rankedMissionName}", que está ligada à sua meta de longo prazo: "${input.metaName}". ${historyPrompt} ${feedbackPrompt} ${deadlinePrompt}
A sua diretiva é criar a PRÓXIMA missão diária, que deve ser o próximo passo lógico. A missão deve ser EXTREMAMENTE ESPECÍFICA e DETALHADA.
Siga os princípios de "Hábitos Atómicos": Torne-a Óbvia, Atraente, Fácil e Satisfatória.

**Diretiva Adicional: Mentor Técnico**
Se a missão envolver um conhecimento técnico (como programação, análise de dados, etc.), você DEVE agir como um mentor. 
- Analise a tarefa.
- Forneça até 3 links (URLs) para recursos de aprendizagem de alta qualidade que ajudem diretamente a concluir a missão. Podem ser links para documentação oficial, tutoriais em vídeo, artigos ou exemplos de código.
- Os recursos devem ser específicos para a tarefa, não genéricos. Por exemplo, se a missão é sobre "criar uma função em Python", forneça um link para a documentação sobre funções em Python.

Gere uma única missão que seja o próximo passo lógico, específico e pequeno. Não repita as missões do histórico.
`;

    const MissionSchema = z.object({
        nextMissionName: z.string(),
        nextMissionDescription: z.string(),
        learningResources: z.array(z.string().url()).optional(),
    });

    const {output} = await ai.generate({
      prompt: finalPrompt,
      model: 'googleai/gemini-2.5-flash',
      output: {schema: MissionSchema},
    });

    const missionText = `${output!.nextMissionName}: ${output!.nextMissionDescription}`;
    const xp = await generateXpValue({
      missionText,
      userLevel: input.userLevel,
    });

    return {
      nextMissionName: output!.nextMissionName,
      nextMissionDescription: output!.nextMissionDescription,
      xp: xp.xp,
      learningResources: output!.learningResources,
    };
  }
);
