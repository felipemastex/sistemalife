
"use client";

import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { Bot, Send, LoaderCircle, Mic, MicOff } from 'lucide-react';
import { generateSystemAdvice } from '@/ai/flows/generate-personalized-advice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { usePlayerDataContext } from '@/hooks/use-player-data';
import { useIsMobile } from '@/hooks/use-mobile';

const AIChatViewComponent = () => {
    const { profile, metas, routine, missions, isDataLoaded } = usePlayerDataContext();
    const [messages, setMessages] = useState<{ sender: string; text: string }[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isListening, setIsListening] = useState(false);
    
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const { toast } = useToast();
    const isInitialMount = useRef(true);
    const speechRecognitionRef = useRef<any>(null);
    const isMobile = useIsMobile();

    useEffect(() => {
        if (!('webkitSpeechRecognition' in window)) {
          console.warn("Speech recognition not supported in this browser.");
          return;
        }

        const recognition = new (window as any).webkitSpeechRecognition();
        recognition.continuous = false;
        recognition.lang = 'pt-BR';
        recognition.interimResults = false;

        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setInput(transcript);
            getSystemResponse(transcript); 
            setIsListening(false);
        };

        recognition.onerror = (event: any) => {
            console.error("Speech recognition error", event.error);
            let description = `Não foi possível processar o áudio. Erro: ${event.error}`;
            if (event.error === 'network') {
                description = "Falha de rede. O reconhecimento de voz pode não funcionar neste ambiente de desenvolvimento. Tente usar a funcionalidade num ambiente local (localhost).";
            } else if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                description = "Permissão para o microfone foi negada. Verifique as permissões do seu navegador.";
            }
            toast({
                variant: 'destructive',
                title: 'Erro no Reconhecimento de Voz',
                description: description
            });
            setIsListening(false);
        };

        recognition.onend = () => {
            setIsListening(false);
        };
        
        speechRecognitionRef.current = recognition;

    }, [toast]);


    const scrollToBottom = () => {
        if (scrollAreaRef.current) {
            const viewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
            if (viewport) {
                viewport.scrollTop = viewport.scrollHeight;
            }
        }
    }

    useEffect(scrollToBottom, [messages, isLoading]);

    const getSystemResponse = useCallback(async (query: string) => {
        if (!isDataLoaded) return;
        
        const userMessage = { sender: 'user', text: query };
        setMessages(prev => [...prev, userMessage]);
        setInput('');

        setIsLoading(true);
        try {
          const result = await generateSystemAdvice({
            userName: profile.nome_utilizador,
            profile: JSON.stringify(profile),
            metas: JSON.stringify(metas),
            routine: JSON.stringify(routine),
            missions: JSON.stringify(missions.filter((m: any) => !m.concluido)),
            query: query,
            personality: profile.user_settings?.ai_personality || 'balanced',
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
    }, [isDataLoaded, profile, metas, routine, missions, toast]);
    
    useEffect(() => {
        if (isDataLoaded && isInitialMount.current) {
             getSystemResponse('Forneça uma análise estratégica do meu estado atual.');
             isInitialMount.current = false;
        }
    }, [isDataLoaded, getSystemResponse]);


    const handleSend = async () => {
        if (!input.trim() || isLoading) return;
        await getSystemResponse(input);
    };

    const handleMicClick = () => {
        if (!speechRecognitionRef.current) {
             toast({
                variant: 'destructive',
                title: 'Não Suportado',
                description: `O reconhecimento de voz não é suportado neste navegador.`
            });
            return;
        }

        if (isListening) {
            speechRecognitionRef.current.stop();
        } else {
            speechRecognitionRef.current.start();
            setIsListening(true);
        }
    };


    return (
        <div className="h-full flex flex-col bg-background relative">
             <div className="absolute inset-0 bg-grid-cyan-400/10 [mask-image:linear-gradient(to_bottom,white_5%,transparent_80%)]"></div>

             <div className={cn("flex-shrink-0 z-10 border-b border-border/50 bg-background/80 backdrop-blur-sm", isMobile ? "p-2" : "p-4 md:p-6")}>
                <h1 className={cn("font-bold text-primary font-cinzel tracking-wider", isMobile ? "text-2xl" : "text-3xl")}>Arquiteto</h1>
                <p className={cn("text-muted-foreground", isMobile ? "mt-1 text-xs" : "mt-1")}>A sua linha de comunicação direta com a IA que gere o seu progresso.</p>
            </div>
            
            <ScrollArea className="flex-grow z-10" ref={scrollAreaRef}>
                 <div className={cn("mx-auto space-y-6", isMobile ? "p-2 max-w-full" : "p-4 md:p-6 max-w-4xl")}>
                    {messages.map((msg, index) => (
                        <div key={index} className={cn("flex items-start gap-3", msg.sender === 'user' && 'justify-end')}>
                            {msg.sender === 'ai' && <Bot className={cn("text-cyan-400 flex-shrink-0 border-2 border-cyan-400/50 rounded-full p-1.5", isMobile ? "h-6 w-6 mt-1" : "h-8 w-8 mt-1")} />}
                            <div className={cn(
                                "rounded-lg", 
                                msg.sender === 'user' 
                                ? 'bg-card border border-border text-foreground shadow-lg' 
                                : 'bg-transparent text-muted-foreground',
                                isMobile ? "p-2 text-sm max-w-[85%]" : "p-4 text-base max-w-2xl"
                            )}>
                                <p className={cn("whitespace-pre-wrap font-sans", isMobile ? "leading-relaxed" : "leading-relaxed")}>{msg.text}</p>
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                         <div className={cn("flex items-start gap-3 animate-in fade-in-50 duration-500", isMobile ? "" : "")}>
                             <Bot className={cn("text-cyan-400 flex-shrink-0 border-2 border-cyan-400/50 rounded-full p-1.5", isMobile ? "h-6 w-6 mt-1" : "h-8 w-8 mt-1")} />
                             <div className={cn("rounded-lg space-y-2 w-full", isMobile ? "p-2" : "p-4")}>
                                 <Skeleton className={cn("", isMobile ? "h-3 w-4/5" : "h-4 w-4/5")} />
                                 <Skeleton className={cn("", isMobile ? "h-3 w-full" : "h-4 w-full")} />
                                 <Skeleton className={cn("", isMobile ? "h-3 w-2/3" : "h-4 w-2/3")} />
                             </div>
                         </div>
                     )}
                 </div>
            </ScrollArea>

            <div className={cn("flex-shrink-0 z-10 bg-background/80 backdrop-blur-sm border-t border-border/50", isMobile ? "p-2" : "p-4 md:p-6")}>
                <div className={cn("mx-auto bg-card border border-border rounded-lg flex items-center shadow-lg", isMobile ? "p-1.5" : "p-2")}>
                    <span className={cn("text-cyan-400 font-mono select-none", isMobile ? "text-base pl-2 pr-1.5" : "text-lg pl-3 pr-2")}>&gt;</span>
                    <Input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder={isDataLoaded ? (isListening ? "A escutar..." : "Digite sua diretiva...") : "A aguardar conexão com o Sistema..."}
                        className={cn("flex-1 bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground", isMobile ? "text-sm" : "text-base")}
                        disabled={isLoading || !isDataLoaded}
                    />
                    <Button onClick={handleMicClick} variant="ghost" size="icon" disabled={!isDataLoaded || isLoading} className={cn(isListening && "text-red-500", isMobile ? "h-8 w-8" : "")}>
                        {isListening ? <MicOff className={isMobile ? "h-4 w-4" : ""} /> : <Mic className={isMobile ? "h-4 w-4" : ""} />}
                    </Button>
                    <Button onClick={handleSend} disabled={isLoading || !input.trim() || !isDataLoaded} size="icon" className={cn("bg-primary hover:bg-primary/90 text-primary-foreground flex-shrink-0", isMobile ? "h-8 w-8" : "")}>
                        {isLoading ? <LoaderCircle className={cn("animate-spin", isMobile ? "h-4 w-4" : "")} /> : <Send className={cn("", isMobile ? "h-4 w-4" : "h-5 w-5")} />}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export const AIChatView = memo(AIChatViewComponent);
