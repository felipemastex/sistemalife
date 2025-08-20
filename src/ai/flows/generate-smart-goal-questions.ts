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
  nextQuestion: z.string().optional().describe('A próxima pergunta a ser feita ao utilizador para refinar a meta.'),
  exampleAnswers: z.array(z.string()).optional().describe('Uma lista de três exemplos de respostas para a pergunta feita.'),
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

    let nextStep = '';
    if (!goal.specific) nextStep = 'specific';
    else if (!goal.measurable) nextStep = 'measurable';
    else if (!goal.achievable) nextStep = 'achievable';
    else if (!goal.relevant) nextStep = 'relevant';
    else if (!goal.timeBound) nextStep = 'timeBound';


    if (!nextStep) {
        const refinePrompt = `
            Você é um coach de produtividade. A meta a seguir foi totalmente preenchida pelo utilizador.
            Meta: ${JSON.stringify(goal, null, 2)}
            
            Com base nas respostas, refine o nome da meta para ser mais conciso e inspirador. As outras propriedades devem ser mantidas como estão.
            Responda APENAS com o objeto JSON do "refinedGoal" atualizado. Não adicione nenhuma outra palavra.
            O formato de saída deve ser um JSON igual ao \`refinedGoal\` no output schema.
        `;

        const {output} = await ai.generate({
            prompt: refinePrompt,
            model: 'googleai/gemini-2.5-flash',
            output: { schema: z.object({ refinedGoal: SmartGoalSchema }) }
        });
        
        return { isComplete: true, refinedGoal: output!.refinedGoal };
    }

    const promptTemplate = `
        Você é um coach de produtividade de elite, especialista em ajudar pessoas a transformar ideias vagas em metas SMART acionáveis. A sua comunicação é concisa, motivadora e sempre focada no próximo passo.
        
        O utilizador está a definir a seguinte meta: "${goal.name}".
        
        Estado atual da meta:
        - Específico (S): ${goal.specific || 'Ainda não definido'}
        - Mensurável (M): ${goal.measurable || 'Ainda não definido'}
        - Atingível (A): ${goal.achievable || 'Ainda não definido'}
        - Relevante (R): ${goal.relevant || 'Ainda não definido'}
        - Prazo (T): ${goal.timeBound || 'Ainda não definido'}

        {{#if history}}
        Histórico da conversa:
        {{#each history}}
        - Pergunta: "{{this.question}}" / Resposta: "{{this.answer}}"
        {{/each}}
        {{/if}}

        O próximo passo é definir o componente '{{nextStep}}'.
        
        Com base em todas as informações fornecidas, formule a próxima pergunta. A pergunta deve ser aberta, instigante e projetada para extrair uma resposta detalhada e útil. Não faça perguntas de sim/não.
        
        Exemplos de perguntas para inspirar o seu tom:
        - Para 'specific': "Excelente começo! Para tornar isto cristalino, descreva exatamente o que você quer alcançar. Que resultado específico você visualiza?"
        - Para 'measurable': "Ótimo. Agora, como saberemos que você está no caminho certo? Quais números ou marcos específicos indicarão o seu progresso e o sucesso final?"
        - Para 'achievable': "Isso é ambicioso, e eu gosto disso. Realisticamente, quais são os passos que você pode dar para alcançar essa meta? Você tem os recursos e o tempo necessários?"
        - Para 'relevant': "Vamos conectar isso ao seu 'porquê'. De que forma esta meta se alinha com os seus objetivos de vida ou carreira a longo prazo? Porque é que isto é importante para si *agora*?"
        - Para 'timeBound': "Toda grande meta precisa de um prazo. Quando, exatamente, você pretende alcançar este objetivo? Defina uma data final para criar um senso de urgência."

        A sua tarefa é gerar um objeto JSON com dois campos: "nextQuestion" (a pergunta que você irá formular) e "exampleAnswers" (um array de 3 exemplos de respostas criativas e úteis para a sua pergunta).
        
        Responda APENAS com o objeto JSON. Não inclua saudações ou texto extra.
    `;
    
    const handlebars = await import('handlebars');
    const template = handlebars.compile(promptTemplate);
    const finalPrompt = template({ history, nextStep, goal });

    const {output} = await ai.generate({
        prompt: finalPrompt,
        model: 'googleai/gemini-2.5-flash',
        output: { schema: z.object({
            nextQuestion: z.string(),
            exampleAnswers: z.array(z.string()),
        }) }
    });
    
    return {
        isComplete: false,
        nextQuestion: output!.nextQuestion,
        exampleAnswers: output!.exampleAnswers,
    };
  }
);
