
"use client";

import { memo, useEffect, useState, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Award, Book, BarChart, Gem, Shield, Flame, Trophy, BrainCircuit, Star, Swords, LoaderCircle, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { format, parseISO } from 'date-fns';
import { Progress } from '@/components/ui/progress';
import { usePlayerDataContext } from '@/hooks/use-player-data.tsx';
import { generateUserAchievements } from '@/ai/flows/generate-user-achievements';
import { Button } from '@/components/ui/button';

// Mapeamento de ícones
const iconMap: { [key: string]: React.FC<any> } = {
  Award, Book, BarChart, Gem, Shield, Flame, Trophy, BrainCircuit, Star, Swords,
};


const AchievementsViewComponent = () => {
    const { profile, missions, metas, skills, persistData, isDataLoaded } = usePlayerDataContext();
    const [isLoading, setIsLoading] = useState(true);

    const getProgress = useCallback((achievement) => {
        if (!profile) return { current: 0, target: 1 };
        
        const { type, value, category } = achievement.criteria;
        switch (type) {
            case 'missions_completed':
                return { current: profile.missoes_concluidas_total || 0, target: value };
            case 'level_reached':
                return { current: profile.nivel || 1, target: value };
            case 'goals_completed':
                return { current: metas.filter(m => m.concluida).length, target: value };
            case 'skill_level_reached':
                 const skill = skills.find(s => s.categoria === category);
                 return { current: skill?.nivel_atual || 0, target: value };
            case 'streak_maintained':
                return { current: profile.streak_atual || 0, target: value };
            case 'missions_in_category_completed':
                const categoryGoals = metas.filter(m => m.categoria === category).map(m => m.nome);
                const count = missions
                    .filter(m => categoryGoals.includes(m.meta_associada))
                    .flatMap(m => m.missoes_diarias || [])
                    .filter(dm => dm.concluido).length;
                return { current: count, target: value };
            default:
                return { current: 0, target: value };
        }
    }, [profile, metas, missions, skills]);


    const generateAndSetAchievements = useCallback(async () => {
        setIsLoading(true);
        try {
            const result = await generateUserAchievements({
                profile: JSON.stringify(profile),
                skills: JSON.stringify(skills),
                goals: JSON.stringify(metas.filter(m => !m.concluida)),
                existingAchievementIds: profile.achievements?.map(a => a.achievementId) || [],
            });
            
            if (result.achievements && result.achievements.length > 0) {
                 const newAchievements = result.achievements.map(ach => ({
                    ...ach,
                    unlocked: false,
                    unlockedAt: null,
                    progress: getProgress(ach),
                }));

                const updatedProfile = {
                    ...profile,
                    generated_achievements: [...(profile.generated_achievements || []), ...newAchievements]
                };
                await persistData('profile', updatedProfile);
            }
        } catch (error) {
            console.error("Failed to generate achievements:", error);
        } finally {
            setIsLoading(false);
        }
    }, [profile, skills, metas, getProgress, persistData]);

    useEffect(() => {
        if (isDataLoaded && profile) {
            if (!profile.generated_achievements || profile.generated_achievements.length === 0) {
                generateAndSetAchievements();
            } else {
                 // Update progress for existing achievements
                const updatedAchievements = profile.generated_achievements.map(ach => {
                    if (ach.unlocked) return ach; // Don't update unlocked achievements
                    
                    const progress = getProgress(ach);
                    let isUnlocked = ach.unlocked;
                    let unlockedDate = ach.unlockedAt;

                    if (!isUnlocked && progress.current >= progress.target) {
                        isUnlocked = true;
                        unlockedDate = new Date().toISOString();
                    }

                    return { ...ach, progress, unlocked: isUnlocked, unlockedAt: unlockedDate };
                });
                
                // Check if there was any change before persisting
                if (JSON.stringify(updatedAchievements) !== JSON.stringify(profile.generated_achievements)) {
                    persistData('profile', {...profile, generated_achievements: updatedAchievements});
                }

                setIsLoading(false);
            }
        }
    }, [isDataLoaded, profile, generateAndSetAchievements, getProgress, persistData]);


    const allAchievements = profile?.generated_achievements || [];
    const sortedAchievements = [...allAchievements].sort((a, b) => {
        const progressA = a.progress ? (a.progress.current / a.progress.target) : 0;
        const progressB = b.progress ? (b.progress.current / b.progress.target) : 0;
        return (a.unlocked ? 1 : 0) - (b.unlocked ? 1 : 0) || progressB - progressA;
    });
    
    if (isLoading) {
        return (
             <div className="p-4 md:p-6 h-full overflow-y-auto">
                 <div className="mb-8">
                    <h1 className="text-3xl font-bold text-primary font-cinzel tracking-wider">Conquistas</h1>
                    <p className="text-muted-foreground mt-2 max-w-3xl">
                        O Sistema está a forjar desafios lendários e personalizados para a sua jornada...
                    </p>
                </div>
                 <div className="flex flex-col items-center justify-center h-64 text-center text-muted-foreground p-8 border-2 border-dashed border-border rounded-lg">
                    <LoaderCircle className="h-16 w-16 mb-4 animate-spin text-primary" />
                    <p className="font-semibold text-lg">A gerar conquistas...</p>
                </div>
             </div>
        )
    }

    return (
        <div className="p-4 md:p-6 h-full overflow-y-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-primary font-cinzel tracking-wider">Conquistas</h1>
                    <p className="text-muted-foreground mt-2 max-w-3xl">
                        Estes são os marcos lendários da sua jornada, forjados pela IA para o seu caminho único.
                    </p>
                </div>
                <Button onClick={generateAndSetAchievements} disabled={isLoading}>
                    <Sparkles className="mr-2 h-4 w-4" />
                    {isLoading ? 'A gerar...' : 'Gerar Novas Conquistas'}
                </Button>
            </div>

            {sortedAchievements.length === 0 && !isLoading && (
                 <div className="flex flex-col items-center justify-center h-64 text-center text-muted-foreground p-8 border-2 border-dashed border-border rounded-lg">
                    <p className="font-semibold text-lg">Nenhuma conquista gerada.</p>
                    <p className="text-sm mt-1">Clique no botão acima para que a IA crie os seus primeiros desafios.</p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {sortedAchievements.map(achievement => {
                    const { unlocked, unlockedAt, progress } = achievement;
                    const progressPercentage = (progress && progress.target > 0) ? (progress.current / progress.target) * 100 : 0;
                    
                    const Icon = iconMap[achievement.icon] || Award;

                    return (
                        <Card 
                            key={achievement.id}
                            className={cn(
                                "bg-card/60 border-2 flex flex-col transition-all duration-300",
                                unlocked ? 'border-yellow-400/50 shadow-lg shadow-yellow-500/10' : 'border-border/80 opacity-70 hover:opacity-100'
                            )}
                        >
                            <CardHeader className="flex flex-row items-center gap-4">
                                <div className={cn(
                                    "w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0",
                                     unlocked ? 'bg-yellow-400/20 text-yellow-400' : 'bg-secondary text-muted-foreground'
                                 )}>
                                    <Icon className="w-7 h-7"/>
                                </div>
                                <div className="flex-1">
                                    <CardTitle className={cn("text-base", unlocked ? 'text-yellow-400' : 'text-foreground')}>
                                        {achievement.name}
                                    </CardTitle>
                                     {unlocked && unlockedAt && (
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger>
                                                    <p className="text-xs text-muted-foreground text-left">
                                                        Desbloqueado em {format(parseISO(unlockedAt), 'dd/MM/yyyy')}
                                                    </p>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>{format(parseISO(unlockedAt), 'dd/MM/yyyy HH:mm')}</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="flex-grow">
                                <CardDescription className={cn(unlocked ? 'text-muted-foreground' : 'text-muted-foreground/80')}>
                                    {achievement.description}
                                </CardDescription>
                            </CardContent>
                             {!unlocked && progress && (
                                <div className="px-6 pb-4">
                                    <div className="flex justify-between items-center text-xs mb-1 text-muted-foreground">
                                        <span>Progresso</span>
                                        <span>{Math.min(progress.current, progress.target)} / {progress.target}</span>
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
