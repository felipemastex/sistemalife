
"use client";

import { memo } from 'react';
import { achievements } from '@/lib/achievements';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { format, parseISO } from 'date-fns';
import { Progress } from '@/components/ui/progress';

const AchievementsViewComponent = ({ profile }) => {
    if (!profile) {
        return <div>A carregar perfil...</div>;
    }
    
    const getProgress = (achievement) => {
        const { type, value } = achievement.criteria;
        switch (type) {
            case 'missions_completed':
                return { current: profile.missoes_concluidas_total || 0, target: value };
            case 'level_reached':
                return { current: profile.nivel || 1, target: value };
            // Adicionar mais casos para outros tipos de critérios no futuro
            default:
                return { current: 0, target: value };
        }
    };

    return (
        <div className="p-4 md:p-6 h-full overflow-y-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-primary font-cinzel tracking-wider">Conquistas</h1>
                <p className="text-muted-foreground mt-2 max-w-3xl">
                    Este é o seu mural de honra, Caçador. Cada conquista representa um marco significativo na sua jornada.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {achievements.map(achievement => {
                    const userAchievement = profile.achievements?.find(a => a.achievementId === achievement.id);
                    const isUnlocked = !!userAchievement;
                    const { current, target } = getProgress(achievement);
                    const progressPercentage = target > 0 ? (current / target) * 100 : 0;
                    
                    const Icon = achievement.icon;

                    return (
                        <Card 
                            key={achievement.id}
                            className={cn(
                                "bg-card/60 border-2 flex flex-col transition-all duration-300",
                                isUnlocked ? 'border-yellow-400/50 shadow-lg shadow-yellow-500/10' : 'border-border/80 opacity-60 hover:opacity-100'
                            )}
                        >
                            <CardHeader className="flex flex-row items-center gap-4">
                                <div className={cn(
                                    "w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0",
                                     isUnlocked ? 'bg-yellow-400/20 text-yellow-400' : 'bg-secondary text-muted-foreground'
                                 )}>
                                    <Icon className="w-7 h-7"/>
                                </div>
                                <div className="flex-1">
                                    <CardTitle className={cn("text-base", isUnlocked ? 'text-yellow-400' : 'text-foreground')}>
                                        {achievement.name}
                                    </CardTitle>
                                     {isUnlocked && userAchievement.date && (
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger>
                                                    <p className="text-xs text-muted-foreground text-left">
                                                        Desbloqueado em {format(parseISO(userAchievement.date), 'dd/MM/yyyy')}
                                                    </p>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>{format(parseISO(userAchievement.date), 'dd/MM/yyyy HH:mm')}</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="flex-grow">
                                <CardDescription className={cn(isUnlocked ? 'text-muted-foreground' : 'text-muted-foreground/80')}>
                                    {achievement.description}
                                </CardDescription>
                            </CardContent>
                             {!isUnlocked && (
                                <div className="px-6 pb-4">
                                    <div className="flex justify-between items-center text-xs mb-1 text-muted-foreground">
                                        <span>Progresso</span>
                                        <span>{Math.min(current, target)} / {target}</span>
                                    </div>
                                    <Progress value={progressPercentage} className="h-2" />
                                </div>
                            )}
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}

export const AchievementsView = memo(AchievementsViewComponent);

    