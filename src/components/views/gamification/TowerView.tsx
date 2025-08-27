
"use client";

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Flame, Calendar, Shield, Users, Trophy, CheckCircle, Gem, Zap, Clock, Heart, LoaderCircle, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { usePlayerDataContext } from '@/hooks/use-player-data';
import { generateTowerChallenge } from '@/ai/flows/generate-tower-challenge';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";


const challengeTypes = {
  daily: { icon: Flame, color: 'text-orange-400' },
  weekly: { icon: Calendar, color: 'text-blue-400' },
  special: { icon: Shield, color: 'text-purple-400' },
  guild: { icon: Users, color: 'text-green-400' },
  class: { icon: Trophy, color: 'text-yellow-400' },
  skill: { icon: Zap, color: 'text-cyan-400' },
};

const TowerView = () => {
    const { profile, missions, skills, metas, persistData, checkAndApplyTowerRewards } = usePlayerDataContext();
    const { toast } = useToast();
    const [isLoadingChallenge, setIsLoadingChallenge] = useState(false);
    
    const towerProgress = useMemo(() => profile?.tower_progress || {
        currentFloor: 1,
        highestFloor: 1,
        lives: 5,
        maxLives: 5,
        lastLifeRegeneration: new Date().toISOString(),
        dailyChallengesAvailable: 3,
    }, [profile]);
    
    const activeChallenges = useMemo(() => profile?.active_tower_challenges || [], [profile]);
    const availableChallenges = useMemo(() => profile?.available_tower_challenges || [], [profile]);

    const handleGenerateChallenge = async () => {
        if (towerProgress.dailyChallengesAvailable <= 0) {
            toast({ variant: 'destructive', title: 'Limite Atingido', description: 'Você já gerou todos os seus desafios diários para este andar.' });
            return;
        }
        setIsLoadingChallenge(true);
        try {
            const allCurrentChallenges = [...activeChallenges, ...availableChallenges];
            const recentChallengeTitles = allCurrentChallenges.map(c => c.title);

            const result = await generateTowerChallenge({
                floorNumber: towerProgress.currentFloor,
                userProfile: JSON.stringify(profile),
                userSkills: JSON.stringify(skills),
                activeGoals: JSON.stringify(metas.filter(m => !m.concluida)),
                recentChallenges: recentChallengeTitles,
            });

            const newAvailableChallenges = [...availableChallenges, { ...result, status: 'available' }];
            const updatedProgress = { ...towerProgress, dailyChallengesAvailable: towerProgress.dailyChallengesAvailable - 1 };
            
            await persistData('profile', { 
                ...profile, 
                tower_progress: updatedProgress,
                available_tower_challenges: newAvailableChallenges,
            });

            toast({ title: 'Novo Desafio Gerado!', description: `O desafio "${result.title}" está disponível.` });

        } catch (error) {
            console.error("Error generating tower challenge:", error);
            toast({ variant: 'destructive', title: 'Erro de IA', description: 'Não foi possível gerar um novo desafio. Tente novamente.' });
        } finally {
            setIsLoadingChallenge(false);
        }
    };
    
     const handleAcceptChallenge = async (challengeToAccept) => {
        const newChallenge = {
            ...challengeToAccept,
            startedAt: new Date().toISOString(),
            requirements: challengeToAccept.requirements.map(r => ({...r, current: 0})),
        };
        
        const updatedActiveChallenges = [...activeChallenges, newChallenge];
        const updatedAvailableChallenges = availableChallenges.filter(c => c.id !== challengeToAccept.id);

        const updatedProfile = {
            ...profile,
            active_tower_challenges: updatedActiveChallenges,
            available_tower_challenges: updatedAvailableChallenges,
        };
        await persistData('profile', updatedProfile);
        
        toast({ title: "Desafio Aceite!", description: `"${challengeToAccept.title}" está agora ativo.`});
    };
    
    const allChallengesForFloor = [...activeChallenges, ...availableChallenges].filter(c => c.floor === towerProgress.currentFloor);

    return (
        <div className="p-4 md:p-6 h-full flex flex-col">
            {/* Header */}
            <div className="flex-shrink-0">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex-1">
                        <h1 className="text-3xl font-bold text-primary font-cinzel tracking-wider">Torre dos Desafios</h1>
                        <p className="text-muted-foreground mt-2 max-w-3xl">
                            Suba andares ao completar desafios de dificuldade crescente e ganhe recompensas exclusivas.
                        </p>
                    </div>
                    <div className="flex items-center gap-4 w-full md:w-auto">
                         <Card className="flex-grow bg-card/80 p-3 rounded-lg border border-border">
                            <div className="flex items-center justify-between md:justify-start gap-2">
                                <div className="flex items-center gap-1 text-red-400">
                                    {Array.from({ length: towerProgress.maxLives }).map((_, i) => (
                                        <Heart key={i} className={cn("h-6 w-6", i < towerProgress.lives ? 'fill-current' : '')} />
                                    ))}
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-lg leading-none">{towerProgress.lives}/{towerProgress.maxLives}</p>
                                    <p className="text-xs text-muted-foreground">Vidas</p>
                                </div>
                            </div>
                        </Card>
                         <Card className="flex-grow bg-card/80 p-3 rounded-lg border border-border">
                             <div className="text-center">
                                <p className="font-bold text-2xl leading-none">{towerProgress.currentFloor}</p>
                                <p className="text-xs text-muted-foreground">Andar Atual</p>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="mt-6 flex-grow overflow-y-auto pr-2 space-y-6">
                <Card className="bg-card/60">
                    <CardHeader>
                        <CardTitle>Desafios do Andar {towerProgress.currentFloor}</CardTitle>
                        <CardDescription>Complete estes desafios para avançar para o próximo andar.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {allChallengesForFloor.length > 0 ? (
                             allChallengesForFloor.map((challenge) => {
                                const ChallengeIcon = challengeTypes[challenge.type]?.icon || Trophy;
                                const isAccepted = !!challenge.startedAt;
                                const progress = challenge.requirements && challenge.requirements.length > 0
                                    ? (challenge.requirements.reduce((sum, r) => sum + (r.current || 0), 0) / challenge.requirements.reduce((sum, r) => sum + r.target, 0)) * 100
                                    : 0;

                                return (
                                    <Card key={challenge.id} className={cn("bg-secondary/50", isAccepted && "border-primary/50")}>
                                        <CardHeader className="p-4">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <CardTitle className="text-base flex items-center gap-2">
                                                        <ChallengeIcon className={cn("h-5 w-5", challengeTypes[challenge.type]?.color)} />
                                                        {challenge.title}
                                                    </CardTitle>
                                                    <CardDescription className="mt-1">{challenge.description}</CardDescription>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        {isAccepted && (
                                             <CardContent className="px-4 pb-2">
                                                <Progress value={progress} className="h-2" />
                                                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                                                     <span>Progresso</span>
                                                      {challenge.timeLimit && (
                                                        <div className="flex items-center gap-1">
                                                            <Clock className="h-3 w-3" />
                                                            <span>{challenge.timeLimit}h restantes</span>
                                                        </div>
                                                    )}
                                                </div>
                                             </CardContent>
                                        )}
                                        <CardFooter className="flex justify-between items-center p-4 pt-2">
                                            <div className="flex gap-4">
                                                <div className="flex items-center gap-1 text-sm text-primary"><Zap className="h-4 w-4" /> {challenge.rewards.xp} XP</div>
                                                <div className="flex items-center gap-1 text-sm text-amber-400"><Gem className="h-4 w-4" /> {challenge.rewards.fragments}</div>
                                                {challenge.rewards.premiumFragments && <div className="flex items-center gap-1 text-sm text-cyan-400"><Trophy className="h-4 w-4" /> {challenge.rewards.premiumFragments}</div>}
                                            </div>
                                            {!isAccepted && (
                                                <Button size="sm" variant="outline" onClick={() => handleAcceptChallenge(challenge)}>
                                                    Aceitar
                                                </Button>
                                            )}
                                        </CardFooter>
                                    </Card>
                                )
                             })
                        ) : (
                             <div className="text-center py-8 text-muted-foreground">
                                <p>Nenhum desafio ativo ou disponível para este andar.</p>
                             </div>
                        )}
                    </CardContent>
                    <CardFooter>
                        <Button 
                            onClick={handleGenerateChallenge} 
                            disabled={isLoadingChallenge || towerProgress.dailyChallengesAvailable <= 0}
                            className="w-full"
                        >
                            {isLoadingChallenge ? <LoaderCircle className="animate-spin mr-2" /> : <Sparkles className="mr-2 h-4 w-4" />}
                            Gerar Desafio Diário ({towerProgress.dailyChallengesAvailable} restantes)
                        </Button>
                    </CardFooter>
                </Card>

                <div className="text-center text-muted-foreground">
                    <p>A torre continua... Mais andares serão revelados à medida que você progride.</p>
                </div>
            </div>
        </div>
    );
};

export default TowerView;
