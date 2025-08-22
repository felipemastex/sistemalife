
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
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
             <ScrollArea className="flex-grow mb-4" viewportRef={viewportRef}>
                <div className="space-y-4 pr-4">
                    {messages.length > 0 ? messages.map((msg, index) => {
                        const isSender = isUserMessage(msg);
                        const showAvatar = index === 0 || messages[index - 1].user_id !== msg.user_id;

                        return (
                             <div key={msg.id} className={cn("flex items-end gap-2", isSender && "justify-end")}>
                                {!isSender && (
                                     <div className="w-8 flex-shrink-0">
                                        {showAvatar && (
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={msg.avatar_url} />
                                                <AvatarFallback>{msg.nome_utilizador?.substring(0, 2)}</AvatarFallback>
                                            </Avatar>
                                        )}
                                     </div>
                                )}
                                <div className={cn(
                                    "max-w-xs md:max-w-md rounded-xl px-4 py-2", 
                                    isSender 
                                    ? "bg-primary text-primary-foreground rounded-br-none" 
                                    : "bg-secondary text-secondary-foreground rounded-bl-none"
                                )}>
                                    {!isSender && showAvatar && (
                                        <p className="text-xs font-bold text-cyan-400 mb-1">{msg.nome_utilizador}</p>
                                    )}
                                    <p className="text-sm break-words whitespace-pre-wrap">{msg.message}</p>
                                    {msg.timestamp && (
                                         <p className={cn("text-xs mt-1", isSender ? "text-blue-200/70" : "text-muted-foreground/70")}>
                                           {formatDistanceToNow(msg.timestamp.toDate(), { addSuffix: true, locale: ptBR })}
                                         </p>
                                    )}
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
