
"use client";

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Gift, Zap, Gem, Shield, Crown } from "lucide-react";
import { ScrollArea } from "../ui/scroll-area";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "../ui/tooltip";


const mockRewards = [
    {
        id: 'reward_xp_boost',
        name: 'Bônus de XP da Guilda (Pequeno)',
        description: 'Aumenta o ganho de XP em 10% por 3 horas para todos os membros online.',
        cost: 500,
        icon: Zap,
    },
    {
        id: 'reward_fragments',
        name: 'Tesouro da Guilda',
        description: 'Distribui 50 fragmentos para cada membro da guilda.',
        cost: 1500,
        icon: Gem,
    },
     {
        id: 'reward_streak_protection',
        name: 'Proteção Coletiva',
        description: 'Concede a cada membro um amuleto que impede a quebra da sua próxima sequência.',
        cost: 2500,
        icon: Shield,
    },
    {
        id: 'reward_special_item',
        name: 'Emblema do Cooperador',
        description: 'Um item cosmético raro para o perfil, mostrando a sua dedicação à guilda.',
        cost: 5000,
        icon: Crown,
    },
];

export const GuildRewards = () => {
    // Mock user contribution points for UI display
    const guildContributionPoints = 2750;

    return (
        <Card className="h-full flex flex-col">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Gift className="h-5 w-5" />
                    Tesouro da Guilda
                </CardTitle>
                 <CardDescription>Use os pontos de contribuição da guilda para desbloquear bônus para todos os membros.</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col p-0">
                <div className="p-6 pt-0">
                    <Card className="bg-secondary/50 p-4">
                        <div className="flex justify-between items-center">
                            <p className="text-muted-foreground">Pontos de Contribuição da Guilda</p>
                            <p className="text-2xl font-bold text-primary flex items-center gap-2">
                                <Gem className="h-5 w-5"/>
                                {guildContributionPoints.toLocaleString()}
                            </p>
                        </div>
                    </Card>
                </div>
                <ScrollArea className="flex-grow px-6">
                    <div className="space-y-4">
                        {mockRewards.map(reward => {
                            const canAfford = guildContributionPoints >= reward.cost;
                            const Icon = reward.icon;
                            return (
                                <Card key={reward.id} className="bg-secondary/50">
                                    <CardContent className="p-4 flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-4">
                                            <Icon className="h-8 w-8 text-primary flex-shrink-0" />
                                            <div>
                                                <p className="font-bold">{reward.name}</p>
                                                <p className="text-xs text-muted-foreground">{reward.description}</p>
                                            </div>
                                        </div>
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                     <div className="flex-shrink-0">
                                                        <Button disabled={!canAfford} size="sm">
                                                            <span className="hidden sm:inline">Desbloquear por </span>
                                                            <Gem className="h-3 w-3 mx-1.5"/> 
                                                            {reward.cost}
                                                        </Button>
                                                    </div>
                                                </TooltipTrigger>
                                                 {!canAfford && (
                                                    <TooltipContent>
                                                        <p>Contribuição insuficiente. Faltam {reward.cost - guildContributionPoints} pontos.</p>
                                                    </TooltipContent>
                                                )}
                                            </Tooltip>
                                        </TooltipProvider>
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
};
