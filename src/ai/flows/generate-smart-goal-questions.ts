'use server';
/**
 * @fileOverview Um agente de IA que ajuda a definir metas SMART de forma conversacional.
 *
 * - generateSmartGoalQuestion - Faz a próxima pergunta para refinar uma meta.
 * - GenerateSmartGoalQuestionInput - O tipo de entrada para a função.
 * - GenerateSmartGoalQuestionOutput - O tipo de retorno para a função.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SmartGoalSchema = z.object({
  name: z.string().describe('O nome inicial ou atual da meta.'),
  specific: z.string().optional().describe('O detalhe Específico (Specific) da meta.'),
  measurable: z.string().optional().describe('O detalhe Mensurável (Measurable) da meta.'),
  achievable: z.string().optional().describe('O detalhe Atingível (Achievable) da meta.'),
  relevant: z.string().optional().describe('O detalhe Relevante (Relevant) da meta.'),
  timeBound: z.string().optional().describe('O detalhe com Prazo (Time-bound) da meta.'),
});

const GenerateSmartGoalQuestionInputSchema = z.object({
    goal: SmartGoalSchema,
    history: z.array(z.object({
        question: z.string(),
        answer: z.string()
    })).optional().describe("Histórico da conversa atual para dar contexto.")
});
export type GenerateSmartGoalQuestionInput = z.infer<typeof GenerateSmartGoalQuestionInputSchema>;

const GenerateSmartGoalQuestionOutputSchema = z.object({
  nextQuestion: z.string().optional().describe('A próxima pergunta a ser feita ao utilizador para refinar a meta. Se a meta for considerada SMART, este campo pode ficar vazio.'),
  isComplete: z.boolean().describe('Indica se a definição da meta SMART está concluída.'),
  refinedGoal: SmartGoalSchema.optional().describe('A meta final refinada após todas as perguntas terem sido respondidas.'),
});
export type GenerateSmartGoalQuestionOutput = z.infer<typeof GenerateSmartGoalQuestionOutputSchema>;

export async function generateSmartGoalQuestion(
  input: GenerateSmartGoalQuestionInput
): Promise<GenerateSmartGoalQuestionOutput> {
  return generateSmartGoalQuestionFlow(input);
}

const generateSmartGoalQuestionFlow = ai.defineFlow(
  {
    name: 'generateSmartGoalQuestionFlow',
    inputSchema: GenerateSmartGoalQuestionInputSchema,
    outputSchema: GenerateSmartGoalQuestionOutputSchema,
  },
  async ({ goal, history }) => {

    const systemPrompt = `Você é um coach de produtividade especialista em definir metas SMART. O seu objetivo é ajudar o utilizador a transformar uma ideia de meta num plano concreto e acionável. Faça uma pergunta de cada vez.
    O estado atual da meta é:
    - Nome: ${goal.name}
    - Específico (S): ${goal.specific || 'Ainda não definido'}
    - Mensurável (M): ${goal.measurable || 'Ainda não definido'}
    - Atingível (A): ${goal.achievable || 'Ainda não definido'}
    - Relevante (R): ${goal.relevant || 'Ainda não definido'}
    - Prazo (T): ${goal.timeBound || 'Ainda não definido'}

    ${history && history.length > 0 ? `Histórico da conversa: ${history.map(h => `P: ${h.question} R: ${h.answer}`).join('\n')}` : ''}

    Com base nas informações que faltam, determine a PRÓXIMA pergunta a ser feita. Se todas as partes estiverem preenchidas, considere a meta completa e refine os detalhes.`;

    const checkCompletionPrompt = `
        Analise o estado da meta a seguir e determine se ela está completa. Uma meta está completa se todos os campos (specific, measurable, achievable, relevant, timeBound) tiverem informações que pareçam razoáveis.
        
        Meta: ${JSON.stringify(goal, null, 2)}
        
        Responda apenas com 'true' se estiver completa ou 'false' se não estiver.
    `;

    const completionCheck = await ai.generate({
        prompt: checkCompletionPrompt,
        model: 'googleai/gemini-2.0-flash'
    });

    const isComplete = completionCheck.text.toLowerCase().includes('true');

    if (isComplete) {
        // Se estiver completo, vamos refinar e finalizar
        const refinePrompt = `
            Você é um coach de produtividade. A meta a seguir foi totalmente preenchida pelo utilizador.
            Meta: ${JSON.stringify(goal, null, 2)}
            
            Com base nas respostas, refine o nome da meta para ser mais conciso e inspirador. 
            Responda APENAS com o objeto JSON do "refinedGoal" atualizado. Não adicione nenhuma outra palavra.
            O formato de saída deve ser um JSON igual ao ` + '`refinedGoal`' + ` no output schema.
        `;

        const {output} = await ai.generate({
            prompt: refinePrompt,
            output: { schema: z.object({ refinedGoal: SmartGoalSchema }) }
        });
        
        return { isComplete: true, refinedGoal: output!.refinedGoal };

    } else {
        // Se não estiver completo, gere a próxima pergunta
         const nextQuestionPrompt = `
            Você é um coach de produtividade especialista em metas SMART. O seu objetivo é ajudar o utilizador a transformar uma ideia de meta num plano concreto.
            O estado atual da meta é:
            - Nome: ${goal.name}
            - Específico (S): ${goal.specific || 'Ainda não definido'}
            - Mensurável (M): ${goal.measurable || 'Ainda não definido'}
            - Atingível (A): ${goal.achievable || 'Ainda não definido'}
            - Relevante (R): ${goal.relevant || 'Ainda não definido'}
            - Prazo (T): ${goal.timeBound || 'Ainda não definido'}

            ${history && history.length > 0 ? `Histórico da conversa: ${history.map(h => `P: ${h.question} R: ${h.answer}`).join('\n')}` : ''}

            Determine a próxima melhor pergunta a ser feita para o primeiro campo que estiver "Ainda não definido". A pergunta deve ser aberta e encorajar uma resposta detalhada.
            Se o campo "specific" estiver vazio, pergunte sobre isso. Se "specific" estiver preenchido mas "measurable" não, pergunte sobre "measurable", e assim por diante.
            
            Responda APENAS com a pergunta. Não adicione saudações ou texto extra.
            Exemplo de pergunta para 'specific': "O que você quer realizar especificamente? Quais são os detalhes?"
            Exemplo de pergunta para 'measurable': "Como você saberá que alcançou esta meta? Quais são os indicadores de progresso?"
        `;

        const result = await ai.generate({
            prompt: nextQuestionPrompt
        });

        return {
            isComplete: false,
            nextQuestion: result.text
        };
    }
  }
);
