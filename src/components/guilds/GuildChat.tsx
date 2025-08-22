
"use client";

import { useState, useEffect, useRef } from 'react';
import { Send, LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  limit,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { format } from 'date-fns';

export const GuildChat = ({ guildId, userProfile }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const viewportRef = useRef<HTMLDivElement>(null);
    const { toast } = useToast();

    useEffect(() => {
        if (!guildId) return;

        const q = query(
            collection(db, `guilds/${guildId}/chat`),
            orderBy('timestamp', 'desc'),
            limit(50)
        );

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const msgs = [];
            querySnapshot.forEach((doc) => {
                msgs.push({ id: doc.id, ...doc.data() });
            });
            setMessages(msgs.reverse());
        }, (error) => {
            console.error("Error fetching chat messages: ", error);
            toast({
                variant: 'destructive',
                title: 'Erro no Chat',
                description: 'Não foi possível carregar as mensagens da guilda.',
            });
        });

        return () => unsubscribe();
    }, [guildId, toast]);

    useEffect(() => {
        if (viewportRef.current) {
            viewportRef.current.scrollTop = viewportRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !userProfile) return;

        setIsLoading(true);
        const chatData = {
            user_id: userProfile.id,
            nome_utilizador: userProfile.nome_utilizador,
            avatar_url: userProfile.avatar_url,
            message: newMessage,
            timestamp: serverTimestamp(),
        };

        try {
            await addDoc(collection(db, `guilds/${guildId}/chat`), chatData);
            setNewMessage('');
        } catch (error) {
            console.error('Error sending message: ', error);
            toast({
                variant: 'destructive',
                title: 'Erro ao Enviar',
                description: 'A sua mensagem não pôde ser enviada.',
            });
        } finally {
            setIsLoading(false);
        }
    };
    
    const isUserMessage = (msg) => msg.user_id === userProfile.id;

    return (
        <div className="h-full flex flex-col p-4 bg-transparent">
             <ScrollArea className="flex-1 mb-4 -mx-4 -mt-4" viewportRef={viewportRef}>
                <div className="px-4 pt-4 space-y-1">
                    {messages.length > 0 ? messages.map((msg, index) => {
                        const isSender = isUserMessage(msg);
                        const prevMessage = messages[index - 1];
                        const nextMessage = messages[index + 1];

                        const isFirstInGroup = !prevMessage || prevMessage.user_id !== msg.user_id;
                        const isLastInGroup = !nextMessage || nextMessage.user_id !== msg.user_id;
                        
                        return (
                             <div key={msg.id} className={cn(
                                "flex items-end gap-2", 
                                isSender && "justify-end",
                                isFirstInGroup ? "mt-4" : "mt-1"
                            )}>
                                {!isSender && (
                                     <div className="w-8 flex-shrink-0 self-end">
                                        {isLastInGroup && (
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={msg.avatar_url} />
                                                <AvatarFallback>{msg.nome_utilizador?.substring(0, 2)}</AvatarFallback>
                                            </Avatar>
                                        )}
                                     </div>
                                )}
                                <div className={cn("max-w-xs md:max-w-md")}>
                                     {!isSender && isFirstInGroup && (
                                        <p className="text-xs font-bold text-cyan-400 mb-1 ml-2">{msg.nome_utilizador}</p>
                                    )}
                                    <div className={cn(
                                        "px-4 py-2 text-sm break-words whitespace-pre-wrap flex items-end gap-2", 
                                        isSender 
                                        ? "bg-primary text-primary-foreground rounded-2xl rounded-br-md" 
                                        : "bg-secondary text-secondary-foreground rounded-2xl rounded-bl-md"
                                    )}>
                                        <p className="flex-grow">{msg.message}</p>
                                        {msg.timestamp && (
                                            <span className={cn(
                                                "text-xs self-end flex-shrink-0",
                                                isSender ? "text-primary-foreground/70" : "text-secondary-foreground/70"
                                            )}>
                                                {format(msg.timestamp.toDate(), 'HH:mm')}
                                            </span>
                                        )}
                                    </div>
                                </div>
                             </div>
                        );
                    }) : (
                        <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                            <p className="font-semibold">Bem-vindo ao chat da guilda!</p>
                            <p className="text-sm">Seja o primeiro a enviar uma mensagem.</p>
                        </div>
                    )}
                </div>
            </ScrollArea>
            <form onSubmit={handleSendMessage} className="flex-shrink-0 flex items-center gap-2">
                <Input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Digite uma mensagem..."
                    className="flex-1"
                    disabled={isLoading}
                    autoComplete="off"
                />
                <Button type="submit" size="icon" disabled={isLoading || !newMessage.trim()}>
                    {isLoading ? <LoaderCircle className="animate-spin" /> : <Send />}
                </Button>
            </form>
        </div>
    );
};
