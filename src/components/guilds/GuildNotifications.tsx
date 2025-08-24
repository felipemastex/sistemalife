
"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Bell, UserPlus, Trophy, Megaphone } from "lucide-react";
import { ScrollArea } from "../ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const mockNotifications = [
    {
        id: 1,
        icon: UserPlus,
        color: "text-green-400",
        text: "Caçador Promissor juntou-se à guilda.",
        timestamp: new Date(Date.now() - 1000 * 60 * 30),
    },
    {
        id: 2,
        icon: Trophy,
        color: "text-yellow-400",
        text: "A missão 'A Semana da Forja de Ferro' foi concluída!",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5),
    },
    {
        id: 3,
        icon: Megaphone,
        color: "text-cyan-400",
        text: "Novo anúncio da liderança: 'Foco em missões de Inteligência esta semana.'",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
    }
];

export const GuildNotifications = () => {
    return (
        <Card className="h-full flex flex-col">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Notificações
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-grow p-0">
                 <ScrollArea className="h-48">
                    <div className="space-y-4 p-6 pt-0">
                       {mockNotifications.map(notification => {
                           const Icon = notification.icon;
                           return (
                            <div key={notification.id} className="flex items-start gap-3">
                                <Icon className={`h-5 w-5 mt-1 flex-shrink-0 ${notification.color}`} />
                                <div className="flex-1">
                                    <p className="text-sm text-foreground">{notification.text}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {formatDistanceToNow(notification.timestamp, { addSuffix: true, locale: ptBR })}
                                    </p>
                                </div>
                            </div>
                           )
                       })}
                        {mockNotifications.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                                <p>Nenhuma notificação recente.</p>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
};
