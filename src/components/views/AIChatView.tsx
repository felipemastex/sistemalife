
"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { Bot, User, Send, ChevronRight } from 'lucide-react';
import { generateSystemAdvice } from '@/ai/flows/generate-personalized-advice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';


export const AIChatView = ({ profile, metas, routine, missions }) => {
    const [messages, setMessages] = useState([{ sender: 'ai', text: 'Sistema online. Qual é a sua diretiva?' }]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const { toast } = useToast();

    const scrollToBottom = () => {
        if (scrollAreaRef.current) {
            const viewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
            if (viewport) {
                viewport.scrollTop = viewport.scrollHeight;
            }
        }
    }

    useEffect(scrollToBottom, [messages, isLoading]);

    const handleSend = useCallback(async () => {
        if (!input.trim() || isLoading) return;

        const userMessage = { sender: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
          const result = await generateSystemAdvice({
            userName: profile.nome_utilizador,
            profile: JSON.stringify(profile),
            metas: JSON.stringify(metas),
            routine: JSON.stringify(routine),
            missions: JSON.stringify(missions.filter(m => !m.concluido)),
            query: input,
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
    }, [input, isLoading, profile, metas, routine, missions, toast]);


    return (
        <div className="h-full flex flex-col bg-background relative">
            <div className="absolute inset-0 bg-grid-cyan-400/10 [mask-image:linear-gradient(to_bottom,white_5%,transparent_80%)] z-0"></div>
            <div className="p-4 md:p-6 flex-shrink-0 z-10">
                <h1 className="text-3xl font-bold text-primary mb-2 font-cinzel tracking-wider">Arquiteto</h1>
                <p className="text-muted-foreground max-w-2xl">A sua linha de comunicação direta com o Sistema. Peça conselhos, estratégias ou tire dúvidas sobre a sua jornada.</p>
            </div>
            
            <ScrollArea className="flex-grow z-10 px-4 md:px-6" ref={scrollAreaRef}>
                 <div className="max-w-4xl mx-auto py-4 space-y-6">
                    {messages.map((msg, index) => (
                        <div key={index} className={cn("flex items-start gap-4", msg.sender === 'user' ? 'justify-end' : 'justify-start')}>
                            {msg.sender === 'ai' && <Bot className="h-6 w-6 text-cyan-400 flex-shrink-0 mt-1" />}
                            <div className={cn(
                                "max-w-2xl rounded-lg p-4", 
                                msg.sender === 'user' 
                                ? 'bg-cyan-600/20 border border-cyan-500/30 text-cyan-50' 
                                : 'text-gray-300'
                            )}>
                                <p className="text-base whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                            </div>
                            {msg.sender === 'user' && <User className="h-6 w-6 text-gray-400 flex-shrink-0 mt-1" />}
                        </div>
                    ))}
                    {isLoading && ( 
                        <div className="flex items-start gap-4">
                            <Bot className="h-6 w-6 text-cyan-400 flex-shrink-0 mt-1" />
                            <div className="max-w-lg p-4 text-gray-300">
                                <div className="flex items-center space-x-2">
                                    <div className="h-2 w-2 bg-cyan-400 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                                    <div className="h-2 w-2 bg-cyan-400 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                                    <div className="h-2 w-2 bg-cyan-400 rounded-full animate-pulse"></div>
                                </div>
                            </div>
                        </div>
                    )}
                 </div>
            </ScrollArea>

            <div className="flex-shrink-0 p-4 md:p-6 z-10">
                <div className="max-w-4xl mx-auto bg-card/80 border border-border rounded-lg flex items-center p-2 backdrop-blur-sm">
                    <ChevronRight className="h-6 w-6 text-primary flex-shrink-0 mx-2"/>
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
                        <Send className="h-5 w-5" />
                    </Button>
                </div>
            </div>
        </div>
    );
};
