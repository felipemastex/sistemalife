
"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { Bot, User, Send, LoaderCircle } from 'lucide-react';
import { generateSystemAdvice } from '@/ai/flows/generate-personalized-advice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';


export const AIChatView = ({ profile, metas, routine, missions }) => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const { toast } = useToast();
    const isInitialMount = useRef(true);


    const scrollToBottom = () => {
        if (scrollAreaRef.current) {
            const viewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
            if (viewport) {
                viewport.scrollTop = viewport.scrollHeight;
            }
        }
    }

    useEffect(scrollToBottom, [messages, isLoading]);

    const getSystemResponse = useCallback(async (query, isInitial = false) => {
         setIsLoading(true);
        try {
          const result = await generateSystemAdvice({
            userName: profile.nome_utilizador,
            profile: JSON.stringify(profile),
            metas: JSON.stringify(metas),
            routine: JSON.stringify(routine),
            missions: JSON.stringify(missions.filter(m => !m.concluido)),
            query: query,
          });
          const aiMessage = { sender: 'ai', text: result.response };
          setMessages(prev => [...prev, aiMessage]);
        } catch (error) {
            console.error("Erro ao buscar conselho da IA:", error);
            let errorMessage = 'Não foi possível obter uma resposta. O Sistema pode estar sobrecarregado.';
            if (error instanceof Error && (error.message.includes('429') || error.message.includes('Quota'))) {
                errorMessage = 'Quota de IA excedida. Você atingiu o limite de pedidos. Tente novamente mais tarde.';
            }

            toast({
              variant: 'destructive',
              title: 'Erro de comunicação com o sistema',
              description: errorMessage,
            })
            setMessages(prev => [...prev, { sender: 'ai', text: 'Erro de comunicação. Verifique a sua conexão e tente novamente.'}])
        } finally {
          setIsLoading(false);
        }
    }, [profile, metas, routine, missions, toast]);

    useEffect(() => {
        if (isInitialMount.current) {
            getSystemResponse('Forneça uma análise estratégica do meu estado atual.', true);
            isInitialMount.current = false;
        }
    }, [getSystemResponse]);


    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage = { sender: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        const currentInput = input;
        setInput('');
        await getSystemResponse(currentInput);
    };


    return (
        <div className="h-full flex flex-col bg-background relative">
             <div className="absolute inset-0 bg-grid-cyan-400/10 [mask-image:linear-gradient(to_bottom,white_5%,transparent_80%)]"></div>

             <div className="p-4 md:p-6 flex-shrink-0 z-10 border-b border-border/50 bg-background/80 backdrop-blur-sm">
                <h1 className="text-3xl font-bold text-primary font-cinzel tracking-wider">Arquiteto</h1>
                <p className="text-muted-foreground mt-1">A sua linha de comunicação direta com a IA que gere o seu progresso.</p>
            </div>
            
            <ScrollArea className="flex-grow z-10" ref={scrollAreaRef}>
                 <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-8">
                    {messages.map((msg, index) => (
                        <div key={index} className={cn("flex items-start gap-4", msg.sender === 'user' && 'justify-end')}>
                            {msg.sender === 'ai' && <Bot className="h-8 w-8 text-cyan-400 flex-shrink-0 mt-1 border-2 border-cyan-400/50 rounded-full p-1.5" />}
                            <div className={cn(
                                "max-w-2xl rounded-lg p-4 text-base", 
                                msg.sender === 'user' 
                                ? 'bg-card border border-border text-foreground shadow-lg' 
                                : 'bg-transparent text-muted-foreground'
                            )}>
                                <p className="whitespace-pre-wrap leading-relaxed font-sans">{msg.text}</p>
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                         <div className="flex items-start gap-4 animate-in fade-in-50 duration-500">
                             <Bot className="h-8 w-8 text-cyan-400 flex-shrink-0 mt-1 border-2 border-cyan-400/50 rounded-full p-1.5" />
                             <div className="max-w-2xl rounded-lg p-4 text-base space-y-2 w-full">
                                 <Skeleton className="h-4 w-4/5" />
                                 <Skeleton className="h-4 w-full" />
                                 <Skeleton className="h-4 w-2/3" />
                             </div>
                         </div>
                     )}
                 </div>
            </ScrollArea>

            <div className="flex-shrink-0 p-4 md:p-6 z-10 bg-background/80 backdrop-blur-sm border-t border-border/50">
                <div className="max-w-4xl mx-auto bg-card border border-border rounded-lg flex items-center p-2 shadow-lg">
                    <span className="text-cyan-400 font-mono text-lg pl-3 pr-2 select-none">&gt;</span>
                    <Input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Digite sua diretiva..."
                        className="flex-1 bg-transparent border-none text-base focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground"
                        disabled={isLoading}
                    />
                    <Button onClick={handleSend} disabled={isLoading || !input.trim()} size="icon" className="bg-primary hover:bg-primary/90 text-primary-foreground flex-shrink-0">
                        {isLoading ? <LoaderCircle className="animate-spin" /> : <Send className="h-5 w-5" />}
                    </Button>
                </div>
            </div>
        </div>
    );
};
