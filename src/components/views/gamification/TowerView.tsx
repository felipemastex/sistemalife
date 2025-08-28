
"use client";

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Flame, Calendar, Shield, Users, Trophy, CheckCircle, Gem, Zap, Clock, Ticket, LoaderCircle, Sparkles, Lock, ArrowUpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { usePlayerDataContext } from '@/hooks/use-player-data';
import { generateTowerChallenge } from '@/ai/flows/generate-tower-challenge';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ScrollArea } from '@/components/ui/scroll-area';


const challengeTypes = {
  daily: { icon: Flame, color: 'text-orange-400', label: 'Diário' },
  weekly: { icon: Calendar, color: 'text-blue-400', label: 'Semanal' },
  special: { icon: Shield, color: 'text-purple-400', label: 'Especial' },
  guild: { icon: Users, color: 'text-green-400', label: 'Guilda' },
  class: { icon: Trophy, color: 'text-yellow-400', label: 'Classe' },
  skill: { icon: Zap, color: 'text-cyan-400', label: 'Habilidade' },
};

const TowerView = () => {
    const { profile, missions, skills, metas, persistData, checkAndApplyTowerRewards } = usePlayerDataContext();
    const { toast } = useToast();
    const [isLoadingChallenge, setIsLoadingChallenge] = useState(false);
    
    useEffect(() => {
        checkAndApplyTowerRewards();
        const interval = setInterval(checkAndApplyTowerRewards, 30000); // Check every 30 seconds
        return () => clearInterval(interval);
    }, [checkAndApplyTowerRewards]);

    const towerProgress = useMemo(() => profile?.tower_progress || {
        currentFloor: 1,
        highestFloor: 1,
        dailyChallengesAvailable: 3,
        tower_tickets: 0,
        tower_lockout_until: null,
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
        const activeChallengeCount = activeChallenges.length;
        if(activeChallengeCount >= 3){
             toast({ variant: 'destructive', title: 'Limite de Desafios Ativos', description: 'Você só pode ter 3 desafios ativos ao mesmo tempo.' });
             return;
        }
        if ((towerProgress.tower_tickets || 0) <= 0) {
            toast({ variant: 'destructive', title: 'Tickets Insuficientes', description: 'Você precisa de um Ticket da Torre para aceitar este desafio.' });
            return;
        }

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
            tower_progress: {
                ...towerProgress,
                tower_tickets: (towerProgress.tower_tickets || 0) - 1,
            }
        };
        await persistData('profile', updatedProfile);
        
        toast({ title: "Desafio Aceite!", description: `"${challengeToAccept.title}" está agora ativo. 1 Ticket da Torre foi usado.`});
    };
    
    const isLockedOut = towerProgress.tower_lockout_until && new Date(towerProgress.tower_lockout_until) > new Date();
    const lockoutTimeLeft = isLockedOut ? formatDistanceToNow(new Date(towerProgress.tower_lockout_until), { locale: ptBR, addSuffix: true }) : '';
    
    const challengesForCurrentFloor = [...activeChallenges, ...availableChallenges].filter(c => c.floor === towerProgress.currentFloor);
    const completedChallengesOnFloor = (profile.tower_progress.completed_challenges_floor || []).length;
    const requiredToAdvance = 3;
    const floorProgress = (completedChallengesOnFloor / requiredToAdvance) * 100;


    return (
        <div className="p-4 md:p-6 h-full flex flex-col bg-background relative overflow-hidden">
             <div className="absolute inset-x-0 top-0 h-[400px] bg-gradient-to-b from-primary/10 to-transparent -z-0"></div>
            {/* Header */}
            <div className="flex-shrink-0 z-10">
                 <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex-1">
                        <h1 className="text-3xl font-bold text-primary font-cinzel tracking-wider">Torre dos Desafios</h1>
                        <p className="text-muted-foreground mt-2 max-w-3xl">
                           Supere desafios, suba andares e prove o seu valor.
                        </p>
                    </div>
                     <div className="grid grid-cols-3 gap-2 w-full md:w-auto">
                        <Card className="bg-card/80 p-2 border-border text-center">
                             <p className="font-bold text-lg leading-none">{towerProgress.currentFloor}</p>
                             <p className="text-xs text-muted-foreground">Andar Atual</p>
                        </Card>
                         <Card className="bg-card/80 p-2 border-border text-center">
                             <p className="font-bold text-lg leading-none">{towerProgress.highestFloor}</p>
                             <p className="text-xs text-muted-foreground">Recorde</p>
                        </Card>
                         <Card className="bg-card/80 p-2 border-border text-center">
                            <div className="flex items-center justify-center gap-1">
                                 <Ticket className="h-4 w-4 text-yellow-400" />
                                <p className="font-bold text-lg leading-none">{towerProgress.tower_tickets || 0}</p>
                            </div>
                             <p className="text-xs text-muted-foreground">Tickets</p>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <ScrollArea className="mt-6 flex-grow z-10 -mx-4 px-4">
                <div className="relative flex flex-col items-center">
                    
                    {/* Future floor */}
                    <div className="text-center text-muted-foreground opacity-50 mb-8">
                        <ArrowUpCircle className="h-8 w-8 mx-auto mb-2"/>
                        <p>Andar {towerProgress.currentFloor + 1}</p>
                        <p className="text-xs">(Bloqueado)</p>
                    </div>
                    
                    {/* Current Floor */}
                    <Card className="w-full max-w-4xl bg-card/90 backdrop-blur-sm border-2 border-primary/30 shadow-2xl shadow-primary/10 mb-8">
                        <CardHeader>
                            <CardTitle className="text-center font-cinzel text-2xl text-primary">Andar {towerProgress.currentFloor}</CardTitle>
                             <div className="pt-2">
                                <Progress value={floorProgress} className="h-2"/>
                                <p className="text-center text-xs text-muted-foreground mt-1">{completedChallengesOnFloor} de {requiredToAdvance} desafios concluídos para avançar.</p>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                             {isLockedOut ? (
                                <div className="text-center p-6 bg-red-900/20 rounded-lg">
                                    <Lock className="h-12 w-12 text-red-400 mx-auto mb-4"/>
                                    <h3 className="text-red-300 font-bold text-lg">Torre Bloqueada</h3>
                                    <p className="text-red-300/80 text-sm">Você foi derrotado. Recupere as suas forças.</p>
                                    <p className="text-md font-bold text-white mt-2">Disponível {lockoutTimeLeft}</p>
                                </div>
                            ) : challengesForCurrentFloor.length > 0 ? (
                                challengesForCurrentFloor.map((challenge) => {
                                     const ChallengeIcon = challengeTypes[challenge.type]?.icon || Trophy;
                                     const isAccepted = !!challenge.startedAt;
                                     const progress = challenge.requirements && challenge.requirements.length > 0
                                        ? (challenge.requirements.reduce((sum, r) => sum + (r.current || 0), 0) / challenge.requirements.reduce((sum, r) => sum + r.target, 0)) * 100
                                        : 0;
                                     return (
                                         <Card key={challenge.id} className={cn("bg-secondary/50", isAccepted && "border-primary/50")}>
                                             <CardContent className="p-4">
                                                <div className="flex flex-col sm:flex-row gap-4">
                                                     <div className="flex-grow">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <ChallengeIcon className={cn("h-5 w-5", challengeTypes[challenge.type]?.color)} />
                                                            <h3 className="font-bold text-base text-foreground">{challenge.title}</h3>
                                                        </div>
                                                        <p className="text-sm text-muted-foreground">{challenge.description}</p>
                                                     </div>
                                                    <div className="flex flex-col items-start sm:items-end gap-2 flex-shrink-0">
                                                         <div className="flex gap-4">
                                                            <div className="flex items-center gap-1 text-sm text-primary"><Zap className="h-4 w-4" /> {challenge.rewards.xp} XP</div>
                                                            <div className="flex items-center gap-1 text-sm text-amber-400"><Gem className="h-4 w-4" /> {challenge.rewards.fragments}</div>
                                                        </div>
                                                         {!isAccepted && (
                                                            <Button size="sm" variant="outline" onClick={() => handleAcceptChallenge(challenge)} disabled={(towerProgress.tower_tickets || 0) <= 0}>
                                                                Aceitar
                                                            </Button>
                                                        )}
                                                     </div>
                                                </div>
                                                {isAccepted && (
                                                     <div className="mt-3">
                                                        <Progress value={progress} className="h-1.5" />
                                                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                                                            <span>Progresso</span>
                                                            {challenge.timeLimit && (
                                                                <div className="flex items-center gap-1">
                                                                    <Clock className="h-3 w-3" />
                                                                    <span>{challenge.timeLimit}h restantes</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                             </CardContent>
                                         </Card>
                                     )
                                })
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    <p>Nenhum desafio ativo ou disponível para este andar.</p>
                                </div>
                            )}
                        </CardContent>
                         {!isLockedOut && (
                             <CardFooter>
                                <Button 
                                    onClick={handleGenerateChallenge} 
                                    disabled={isLoadingChallenge || towerProgress.dailyChallengesAvailable <= 0}
                                    className="w-full"
                                >
                                    {isLoadingChallenge ? <LoaderCircle className="animate-spin mr-2" /> : <Sparkles className="mr-2 h-4 w-4" />}
                                    {`Gerar Desafio Diário (${towerProgress.dailyChallengesAvailable} restantes)`}
                                </Button>
                            </CardFooter>
                         )}
                    </Card>

                     {/* Past floors */}
                    {Array.from({ length: Math.min(3, towerProgress.currentFloor - 1) }, (_, i) => towerProgress.currentFloor - 1 - i).map(floorNum => (
                         <div key={floorNum} className="text-center text-muted-foreground opacity-30 mb-8">
                            <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500"/>
                            <p>Andar {floorNum}</p>
                            <p className="text-xs">(Concluído)</p>
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </div>
    );
};

export default TowerView;

    