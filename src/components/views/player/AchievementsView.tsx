
"use client";

import { achievements as staticAchievements } from '@/lib/achievements';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { CheckCircle, Award, Book, BarChart, Gem, Shield, Flame, Trophy, BrainCircuit, Star, Swords } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { format, parseISO } from 'date-fns';
import { Progress } from '@/components/ui/progress';
import { usePlayerDataContext } from '@/hooks/use-player-data';
import { useIsMobile } from '@/hooks/use-mobile';

const iconMap = {
    Award,
    Book,
    BarChart,
    Gem,
    Shield,
    Flame,
    Trophy,
    BrainCircuit,
    Star,
    Swords
};

export const AchievementsView = () => {
    const { profile, skills, metas, missions } = usePlayerDataContext();
    const isMobile = useIsMobile();

    if (!profile) {
        return <div>A carregar perfil...</div>;
    }

    const allAchievements = [
        ...staticAchievements,
        ...(profile.generated_achievements || [])
    ];
    
    const getProgress = (achievement: any) => {
        const { type, value, category } = achievement.criteria;
        
        switch (type) {
            case 'missions_completed':
                return { current: profile.missoes_concluidas_total || 0, target: value };
            case 'level_reached':
                return { current: profile.nivel || 1, target: value };
            case 'goals_completed':
                return { current: metas.filter((m: any) => m.concluida).length, target: value };
            case 'skill_level_reached':
                 const skill = skills.find((s: any) => s.categoria === category);
                 return { current: skill ? skill.nivel_atual : 0, target: value };
            case 'streak_maintained':
                return { current: profile.streak_atual || 0, target: value };
            case 'missions_in_category_completed':
                const categoryGoals = metas.filter((m: any) => m.categoria === category).map((m: any) => m.nome);
                const count = missions
                    .filter((m: any) => categoryGoals.includes(m.meta_associada))
                    .flatMap((m: any) => m.missoes_diarias || [])
                    .filter((dm: any) => dm.concluido).length;
                return { current: count, target: value };
            default:
                return { current: 0, target: value };
        }
    };

    return (
        <div className={cn("h-full overflow-y-auto", isMobile ? "p-2" : "p-4 md:p-6")}>
            <div className={cn("mb-4", isMobile ? "mb-4" : "mb-8")}>
                <h1 className={cn("font-bold text-primary font-cinzel tracking-wider", isMobile ? "text-2xl" : "text-3xl")}>Conquistas</h1>
                <p className={cn("text-muted-foreground max-w-3xl", isMobile ? "mt-1 text-sm" : "mt-2")}>
                    Este é o seu mural de honra, Caçador. Cada conquista representa um marco significativo na sua jornada.
                </p>
            </div>

            <div className={cn(
                "grid gap-4", 
                isMobile 
                    ? "grid-cols-1 sm:grid-cols-2" 
                    : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            )}>
                {allAchievements.map((achievement: any) => {
                    const isUnlocked = achievement.unlocked;
                    const unlockedDate = achievement.unlockedAt;

                    const { current, target } = getProgress(achievement);
                    const progressPercentage = target > 0 ? (current / target) * 100 : 0;
                    
                    const Icon = typeof achievement.icon === 'string' ? iconMap[achievement.icon as keyof typeof iconMap] || Award : achievement.icon;


                    return (
                        <Card 
                            key={achievement.id}
                            className={cn(
                                "bg-card/60 border-2 flex flex-col transition-all duration-300",
                                isUnlocked ? 'border-yellow-400/50 shadow-lg shadow-yellow-500/10' : 'border-border/80 opacity-660 hover:opacity-100',
                                isMobile ? 'p-2' : 'p-0'
                            )}
                        >
                            <CardHeader className={cn("flex flex-row items-center gap-3", isMobile ? "p-3" : "p-4")}>
                                <div className={cn(
                                    "rounded-lg flex items-center justify-center flex-shrink-0",
                                     isUnlocked ? 'bg-yellow-400/20 text-yellow-400' : 'bg-secondary text-muted-foreground',
                                     isMobile ? 'w-10 h-10' : 'w-12 h-12'
                                 )}>
                                    <Icon className={isMobile ? "w-5 h-5" : "w-7 h-7"}/>
                                </div>
                                <div className="flex-1">
                                    <CardTitle className={cn(isUnlocked ? 'text-yellow-400' : 'text-foreground', isMobile ? "text-sm" : "text-base")}>
                                        {achievement.name}
                                    </CardTitle>
                                     {isUnlocked && unlockedDate && (
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger>
                                                    <p className={cn("text-left", isMobile ? "text-[10px]" : "text-xs text-muted-foreground")}>
                                                        Desbloqueado em {format(parseISO(unlockedDate), 'dd/MM/yyyy')}
                                                    </p>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>{format(parseISO(unlockedDate), 'dd/MM/yyyy HH:mm')}</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className={cn("flex-grow", isMobile ? "p-3 pt-0" : "p-6 pt-0")}>
                                <CardDescription className={cn(isUnlocked ? 'text-muted-foreground' : 'text-muted-foreground/80', isMobile ? "text-xs" : "")}>
                                    {achievement.description}
                                </CardDescription>
                            </CardContent>
                             {!isUnlocked && (
                                <div className={cn("pb-3", isMobile ? "px-3" : "px-6")}>
                                    <div className={cn("flex justify-between items-center mb-1 text-muted-foreground", isMobile ? "text-[10px]" : "text-xs")}>
                                        <span>Progresso</span>
                                        <span>{Math.min(current, target)} / {target}</span>
                                    </div>
                                    <Progress value={progressPercentage} className={isMobile ? "h-1.5" : "h-2"} />
                                </div>
                            )}
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
