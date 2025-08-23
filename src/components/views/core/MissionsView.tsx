
"use client";

import { useState, useEffect, useCallback } from 'react';
import { Circle, CheckCircle, Timer, Sparkles, History, GitMerge, LifeBuoy, Link, Undo2, ChevronsDown, ChevronsUp, RefreshCw, Gem, Plus, Eye, LoaderCircle } from 'lucide-react';
import { generateNextDailyMission } from '@/ai/flows/generate-next-daily-mission';
import { generateMissionSuggestion } from '@/ai/flows/generate-mission-suggestion';
import { useToast } from '@/hooks/use-toast';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { QuestInfoDialog } from '@/components/custom/QuestInfoDialog';
import { cn } from '@/lib/utils';


// Helper Dialog for getting user feedback
const MissionFeedbackDialog = ({ open, onOpenChange, onSubmit, mission, feedbackType }) => {
    const [feedbackText, setFeedbackText] = useState('');
    const [loading, setLoading] = useState(false);

    const dialogTitles = {
        'hint': 'Precisa de uma Dica?',
        'too_hard': 'Missão Muito Difícil?',
        'too_easy': 'Missão Muito Fácil?'
    };

    const dialogDescriptions = {
        'hint': 'Descreva onde você está bloqueado e o Sistema fornecerá uma pista.',
        'too_hard': 'Descreva por que a missão está muito difícil. O Sistema irá ajustar o próximo passo.',
        'too_easy': 'Descreva por que a missão foi muito fácil para que o Sistema possa aumentar o desafio.'
    };

    const handleSubmit = async () => {
        setLoading(true);
        await onSubmit(feedbackType, feedbackText);
        setLoading(false);
        onOpenChange(false);
        setFeedbackText('');
    };
    
    if (!mission || !feedbackType) return null;

    return (
        <Dialog open={open} onOpenChange={(isOpen) => { if(!isOpen) setFeedbackText(''); onOpenChange(isOpen);}}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{dialogTitles[feedbackType]}</DialogTitle>
                    <DialogDescription>{dialogDescriptions[feedbackType]}</DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <Textarea
                        placeholder="Forneça mais detalhes aqui..."
                        value={feedbackText}
                        onChange={(e) => setFeedbackText(e.target.value)}
                        disabled={loading}
                    />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSubmit} disabled={loading}>
                        {loading ? "A enviar..." : "Enviar Feedback"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};


// Helper Dialog for adding progress to sub-tasks
const ContributionDialog = ({ open, onOpenChange, subTask, onContribute }) => {
    const [amount, setAmount] = useState('');
    
    if (!subTask) return null;

    const remaining = subTask.target - (subTask.current || 0);

    const handleContribute = () => {
        const contribution = parseInt(amount, 10);
        if (!isNaN(contribution) && contribution > 0) {
            onContribute(subTask, contribution);
            onOpenChange(false);
            setAmount('');
        }
    };

    return (
        <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) setAmount(''); onOpenChange(isOpen); }}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Registar Progresso: {subTask.name}</DialogTitle>
                    <DialogDescription>
                        Insira a quantidade que você progrediu. O seu esforço fortalece-o!
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <p className="text-sm text-center bg-secondary p-2 rounded-md">
                        Progresso atual: <span className="font-bold text-primary">{subTask.current || 0} / {subTask.target}</span>
                    </p>
                    <div>
                        <Label htmlFor="contribution-amount">Adicionar Progresso</Label>
                        <Input
                            id="contribution-amount"
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder={`Ex: 5 (Faltam ${remaining})`}
                            min="1"
                            max={remaining}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button onClick={handleContribute} disabled={!amount || parseInt(amount, 10) <= 0 || parseInt(amount, 10) > remaining}>
                        Registar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};


export const MissionsView = ({ missions, setMissions, profile, setProfile, metas, onCompleteMission }) => {
    const [generating, setGenerating] = useState(null); // Stores rankedMissionId
    const [timers, setTimers] = useState({});
    const [showProgressionTree, setShowProgressionTree] = useState(false);
    const [selectedGoalMissions, setSelectedGoalMissions] = useState([]);
    const [missionFeedback, setMissionFeedback] = useState({}); // Stores text feedback for next mission generation
    const [feedbackModalState, setFeedbackModalState] = useState({ open: false, mission: null, type: null });
    const [completedAccordionOpen, setCompletedAccordionOpen] = useState(false);
    const [contributionDialogState, setContributionDialogState] = useState({ open: false, rankedMissionId: null, dailyMissionId: null, subTask: null });
    const [showQuestInfo, setShowQuestInfo] = useState<{dailyMissionId: string; rankedMissionId: string} | null>(null);

    const { toast } = useToast();
    const rankOrder = ['F', 'E', 'D', 'C', 'B', 'A', 'S', 'SS', 'SSS'];

    const handleToastError = (error, customMessage = 'Não foi possível continuar. O Sistema pode estar sobrecarregado.') => {
        console.error("Erro de IA:", error);
        if (error instanceof Error && (error.message.includes('429') || error.message.includes('Quota'))) {
             toast({ variant: 'destructive', title: 'Quota de IA Excedida', description: 'Você atingiu o limite de pedidos. Tente novamente mais tarde.' });
        } else {
             toast({ variant: 'destructive', title: 'Erro de IA', description: customMessage });
        }
    };

    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date();
            const newTimers = {};
            let missionsToUpdate = [];

            missions.forEach(mission => {
                if (mission.ultima_missao_concluida_em) {
                    const completionDate = new Date(mission.ultima_missao_concluida_em);
                    const midnight = new Date(completionDate);
                    midnight.setDate(midnight.getDate() + 1);
                    midnight.setHours(0, 0, 0, 0);

                    const timeLeft = midnight.getTime() - now.getTime();

                    if (timeLeft > 0) {
                        const hours = Math.floor(timeLeft / (1000 * 60 * 60));
                        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
                        const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
                        newTimers[mission.id] = `${'' + String(hours).padStart(2, '0')}:${'' + String(minutes).padStart(2, '0')}:${'' + String(seconds).padStart(2, '0')}`;
                    } else {
                        if(timers[mission.id]){
                            missionsToUpdate.push(mission.id);
                        }
                    }
                }
            });

            if (missionsToUpdate.length > 0) {
                const currentMissions = missions.map(m =>
                        missionsToUpdate.includes(m.id)
                            ? { ...m, ultima_missao_concluida_em: null }
                            : m
                    );
                setMissions(currentMissions);
            }
            setTimers(newTimers);
        }, 1000);

        return () => clearInterval(interval);
    }, [missions, setMissions, timers]);
    
    const handleHackerMode = () => {
        const updatedMissions = missions.map(m => ({ ...m, ultima_missao_concluida_em: null }));
        setMissions(updatedMissions);
        toast({
            title: "Temporizadores Reiniciados!",
            description: "Todos os tempos de espera das missões foram eliminados.",
        });
    };
    
    const handleOpenFeedbackModal = (mission, type) => {
        setFeedbackModalState({ open: true, mission, type });
    };
    
    const handleMissionFeedback = async (feedbackType, userText) => {
        const { mission } = feedbackModalState;
        if (!mission) return;
        
        try {
            const result = await generateMissionSuggestion({
                missionName: mission.nome,
                missionDescription: mission.subTasks.map(st => st.name).join(', '),
                feedbackType,
                userText: userText,
            });

            toast({
                title: "Feedback do Sistema",
                description: result.suggestion,
            });

            if (feedbackType === 'too_hard' || feedbackType === 'too_easy') {
                const feedbackValue = userText 
                    ? `O utilizador sinalizou que a missão foi '${feedbackType === 'too_hard' ? 'muito difícil' : 'muito fácil'}' com o seguinte comentário: "${userText}"`
                    : `O utilizador sinalizou que a missão foi '${feedbackType === 'too_hard' ? 'muito difícil' : 'muito fácil'}'`;
                
                const rankedMission = missions.find(rm => rm.missoes_diarias.some(dm => dm.id === mission.id));
                if (rankedMission) {
                     setMissionFeedback(prev => ({...prev, [rankedMission.id]: feedbackValue }));
                }
            }
        } catch (error) {
            handleToastError(error);
        }
    };
    
    const handleAddProgress = useCallback((rankedMissionId, dailyMissionId, subTask, amount) => {
        let missionJustCompleted = false;
        
        const updatedMissions = missions.map(rm => {
            if (rm.id !== rankedMissionId) return rm;
            
            return {
                ...rm,
                missoes_diarias: rm.missoes_diarias.map(dm => {
                    if (dm.id !== dailyMissionId) return dm;

                    const updatedSubTasks = dm.subTasks.map(st => 
                        st.name === subTask.name 
                            ? { ...st, current: Math.min(st.target, (st.current || 0) + amount) }
                            : st
                    );
                    
                    const allSubTasksCompleted = updatedSubTasks.every(st => (st.current || 0) >= st.target);
                    if (allSubTasksCompleted && !dm.concluido) {
                        missionJustCompleted = true;
                    }

                    return { ...dm, subTasks: updatedSubTasks };
                })
            };
        });

        setMissions(updatedMissions);

        if (missionJustCompleted) {
            setGenerating(rankedMissionId);
            const dailyMission = missions.find(rm => rm.id === rankedMissionId)?.missoes_diarias.find(dm => dm.id === dailyMissionId);
            onCompleteMission({ 
                rankedMissionId, 
                dailyMission,
                feedback: missionFeedback[rankedMissionId]
            }).finally(() => {
                setGenerating(null);
                if (missionFeedback[rankedMissionId]) {
                    setMissionFeedback(prev => {
                        const newState = { ...prev };
                        delete newState[rankedMissionId];
                        return newState;
                    });
                }
            });
        }
    }, [missions, setMissions, onCompleteMission, missionFeedback]);
    
    const handleAddProgressPopup = (mission, subTask, amount) => {
        if (!mission || !showQuestInfo) return;
        handleAddProgress(showQuestInfo.rankedMissionId, mission.id, subTask, amount);
    };

    const openContributionDialog = (rankedMissionId, dailyMissionId, subTask) => {
        setContributionDialogState({ open: true, rankedMissionId, dailyMissionId, subTask });
    };

    const submitContribution = (subTask, amount) => {
        const { rankedMissionId, dailyMissionId } = contributionDialogState;
        handleAddProgress(rankedMissionId, dailyMissionId, subTask, amount);
    };

    const revertLastDailyMission = useCallback((rankedMissionId) => {
        const missionsClone = JSON.parse(JSON.stringify(missions));
        const rankedMission = missionsClone.find(rm => rm.id === rankedMissionId);

        if (!rankedMission || rankedMission.missoes_diarias.length === 0) return;

        const completedMissions = rankedMission.missoes_diarias.filter(dm => dm.concluido);
        
        if (completedMissions.length > 0) {
            const lastCompletedIndex = rankedMission.missoes_diarias.findLastIndex(dm => dm.concluido);
            const activeMissionIndex = rankedMission.missoes_diarias.findIndex(dm => !dm.concluido);

            if (lastCompletedIndex !== -1) {
                const xpToSubtract = rankedMission.missoes_diarias[lastCompletedIndex].xp_conclusao;
                const fragmentsToSubtract = rankedMission.missoes_diarias[lastCompletedIndex].fragmentos_conclusao || 0;

                rankedMission.missoes_diarias[lastCompletedIndex].concluido = false;
                rankedMission.missoes_diarias[lastCompletedIndex].subTasks = (rankedMission.missoes_diarias[lastCompletedIndex].subTasks || []).map(st => ({...st, current: 0}));

                if (activeMissionIndex !== -1) {
                    rankedMission.missoes_diarias.splice(activeMissionIndex, 1);
                }

                rankedMission.ultima_missao_concluida_em = null;
                
                const finalMissions = missions.map(m => m.id === rankedMissionId ? rankedMission : m);
                setMissions(finalMissions);

                setProfile(prev => ({
                    ...prev,
                    xp: Math.max(0, prev.xp - xpToSubtract),
                    fragmentos: Math.max(0, (prev.fragmentos || 0) - fragmentsToSubtract),
                    missoes_concluidas_total: Math.max(0, (prev.missoes_concluidas_total || 0) - 1),
                }));
                toast({ title: "Missão Revertida", description: "A missão anterior está ativa novamente." });
            }
        }
    }, [missions, setMissions, setProfile, toast]);
    
    const reactivateEpicMission = async (missionId) => {
        const missionToReactivate = missions.find(m => m.id === missionId);
        if (!missionToReactivate) return;
        
        setGenerating(missionId);
        try {
            const meta = metas.find(m => m.nome === missionToReactivate.meta_associada);
            
            const result = await generateNextDailyMission({
                rankedMissionName: missionToReactivate.nome,
                metaName: meta?.nome || "Objetivo geral",
                goalDeadline: meta?.prazo,
                history: "Esta é a primeira missão para este objetivo (reativado).",
                userLevel: profile.nivel,
            });

             const newDailyMission = {
                id: Date.now(),
                nome: result.nextMissionName,
                xp_conclusao: result.xp,
                fragmentos_conclusao: result.fragments,
                concluido: false,
                tipo: 'diaria',
                learningResources: result.learningResources,
                subTasks: result.subTasks,
            };

            const updatedMissions = missions.map(m => {
                if (m.id === missionId) {
                    return { ...m, concluido: false, missoes_diarias: [newDailyMission], ultima_missao_concluida_em: null };
                }
                return m;
            });
            setMissions(updatedMissions);
            toast({ title: "Missão Reativada!", description: `A missão "${missionToReactivate.nome}" está novamente no seu diário.` });

        } catch (error) {
            handleToastError(error, "Não foi possível reativar a missão.");
        } finally {
            setGenerating(null);
        }
    };


    const handleShowProgression = (clickedMission) => {
        const goalMissions = missions
            .filter(m => m.meta_associada === clickedMission.meta_associada)
            .sort((a, b) => rankOrder.indexOf(a.rank) - rankOrder.indexOf(b.rank));
        setSelectedGoalMissions(goalMissions);
        setShowProgressionTree(true);
    };

    const getRankColor = (rank) => {
        switch (rank) {
            case 'F': return 'bg-gray-500 text-gray-100';
            case 'E': return 'bg-green-700 text-green-200';
            case 'D': return 'bg-cyan-700 text-cyan-200';
            case 'C': return 'bg-blue-700 text-blue-200';
            case 'B': return 'bg-purple-700 text-purple-200';
            case 'A': return 'bg-red-700 text-red-200';
            case 'S': return 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/50';
            case 'SS': return 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-lg shadow-orange-500/50';
            case 'SSS': return 'bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 text-white shadow-xl shadow-purple-500/50 animate-pulse';
            default: return 'bg-gray-700 text-gray-400';
        }
    }
    
    const getVisibleMissions = () => {
        const visible = [];
        const missionsByGoal = missions.reduce((acc, mission) => {
            if (!acc[mission.meta_associada]) {
                acc[mission.meta_associada] = [];
            }
            acc[mission.meta_associada].push(mission);
            return acc;
        }, {});

        for (const goalName in missionsByGoal) {
            const goalMissions = missionsByGoal[goalName]
                .filter(m => !m.concluido)
                .sort((a, b) => rankOrder.indexOf(a.rank) - rankOrder.indexOf(b.rank));

            if (goalMissions.length > 0) {
                visible.push(goalMissions[0]);
            }
        }
        return visible.sort((a,b) => rankOrder.indexOf(a.rank) - rankOrder.indexOf(b.rank));
    };

    const completedMissions = missions.filter(m => m.concluido);
    const visibleMissions = getVisibleMissions();
    const missionViewStyle = profile?.mission_view_style || 'inline';

    return (
        <div className="p-4 md:p-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-2">
                <h1 className="text-3xl font-bold text-primary font-cinzel tracking-wider">Diário de Missões</h1>
                 <Button onClick={handleHackerMode} variant="outline" size="sm" aria-label="Reiniciar Missões">
                    <RefreshCw className="mr-2 h-4 w-4"/>
                    Modo Hacker
                </Button>
            </div>
            <p className="text-muted-foreground mb-6">Complete as sub-tarefas da missão diária para progredir. Uma nova missão é liberada à meia-noite.</p>
            
            <Accordion type="single" collapsible className="w-full space-y-4">
                {visibleMissions.map(mission => {
                    const activeDailyMission = mission.missoes_diarias.find(d => !d.concluido);
                    const completedDailyMissions = mission.missoes_diarias.filter(d => d.concluido).reverse();
                    const missionProgress = (completedDailyMissions.length / (mission.total_missoes_diarias || 10)) * 100;
                    const onCooldown = !!timers[mission.id];
                    const lastCompletedMission = onCooldown ? completedDailyMissions[0] : null;

                    return (
                        <AccordionItem value={`item-${mission.id}`} key={mission.id} className="bg-card/60 border border-border rounded-lg">
                           <div className="flex flex-col sm:flex-row items-start sm:items-center p-4 gap-4">
                                <AccordionTrigger className="flex-1 hover:no-underline text-left p-0 w-full">
                                    <div className="flex-1 text-left min-w-0">
                                        <p className="text-lg font-bold text-foreground break-words">{mission.nome}</p>
                                        <p className="text-sm text-muted-foreground mt-1 break-words">{mission.descricao}</p>
                                        <div className="w-full bg-secondary rounded-full h-2.5 mt-3">
                                             <div className="bg-gradient-to-r from-primary to-accent h-2.5 rounded-full" style={{width: `${missionProgress}%`}}></div>
                                        </div>
                                    </div>
                                </AccordionTrigger>
                                <div className="flex items-center space-x-2 self-start flex-shrink-0 sm:ml-4">
                                     {onCooldown && (
                                        <div className="flex items-center text-cyan-400 text-xs font-mono bg-secondary px-2 py-1 rounded-md animate-in fade-in">
                                            <Timer className="h-4 w-4 mr-1.5"/>
                                            {timers[mission.id]}
                                        </div>
                                     )}
                                     {missionViewStyle === 'popup' && activeDailyMission && !onCooldown && !generating && (
                                        <Button variant="outline" size="sm" onClick={() => setShowQuestInfo({ dailyMissionId: activeDailyMission.id, rankedMissionId: mission.id })}>
                                            <Eye className="h-4 w-4 mr-2" />
                                            Ver Missão
                                        </Button>
                                     )}
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={(e) => { e.stopPropagation(); handleShowProgression(mission)}} aria-label="Ver árvore de progressão">
                                        <GitMerge className="h-5 w-5" />
                                    </Button>
                                     <span className={`text-xs font-bold px-2 py-1 rounded-full ${getRankColor(mission.rank)}`}>Rank {mission.rank}</span>
                                </div>
                            </div>
                            <AccordionContent className="px-4 pb-4 space-y-4">
                                
                                {generating === mission.id ? (
                                    <div className="bg-secondary/30 border-2 border-dashed border-primary/50 rounded-lg p-4 flex flex-col items-center justify-center text-center animate-in fade-in duration-300 h-48">
                                        <LoaderCircle className="h-10 w-10 text-primary animate-spin mb-4"/>
                                        <p className="text-lg font-bold text-foreground">A gerar nova missão...</p>
                                        <p className="text-sm text-muted-foreground">O Sistema está a preparar o seu próximo desafio.</p>
                                    </div>
                                ) : missionViewStyle === 'inline' && activeDailyMission && !onCooldown ? (
                                     <div className="bg-secondary/50 border-l-4 border-primary rounded-r-lg p-4 animate-in fade-in slide-in-from-top-4 duration-500">
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                                             <div className="flex-grow">
                                                <p className="text-lg font-bold text-foreground">{activeDailyMission.nome}</p>
                                             </div>
                                            <div className="text-right ml-0 sm:ml-4 flex-shrink-0 flex items-center gap-2">
                                                <div className="flex flex-col items-end">
                                                    <p className="text-sm font-semibold text-primary">+{activeDailyMission.xp_conclusao} XP</p>
                                                    <p className="text-xs font-semibold text-yellow-400 flex items-center gap-1">
                                                        <Gem className="h-3 w-3"/>
                                                        +{activeDailyMission.fragmentos_conclusao || 0}
                                                    </p>
                                                </div>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" aria-label="Opções da missão">
                                                            <LifeBuoy className="h-5 w-5" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent>
                                                        <DropdownMenuItem onSelect={() => handleOpenFeedbackModal(activeDailyMission, 'hint')}>
                                                            Preciso de uma dica
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onSelect={() => handleOpenFeedbackModal(activeDailyMission, 'too_hard')}>
                                                            Está muito difícil
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onSelect={() => handleOpenFeedbackModal(activeDailyMission, 'too_easy')}>
                                                            Está muito fácil
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </div>

                                        <div className="mt-4 pt-4 border-t border-border/50 space-y-3">
                                            {activeDailyMission.subTasks?.map((st, index) => (
                                                <div key={index}>
                                                     <div className="flex justify-between items-center text-sm mb-1 gap-2">
                                                        <p className="font-semibold text-foreground flex-1">{st.name}</p>
                                                        <div className="flex items-center gap-2 flex-shrink-0">
                                                            <span className="font-mono text-muted-foreground">[{st.current || 0}/{st.target}] {st.unit}</span>
                                                             <Button 
                                                                size="icon" 
                                                                variant="outline" 
                                                                className="h-7 w-7" 
                                                                onClick={() => openContributionDialog(mission.id, activeDailyMission.id, st)}
                                                                disabled={(st.current || 0) >= st.target}
                                                                aria-label={`Adicionar progresso para ${st.name}`}
                                                            >
                                                                <Plus className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                    <Progress value={((st.current || 0) / st.target) * 100} className="h-2"/>
                                                </div>
                                            ))}
                                        </div>

                                         {activeDailyMission.learningResources && activeDailyMission.learningResources.length > 0 && (
                                            <div className="mt-4 pt-3 border-t border-border/50">
                                                <h5 className="text-sm font-bold text-muted-foreground mb-2">Recursos de Aprendizagem Sugeridos</h5>
                                                <div className="space-y-2">
                                                    {activeDailyMission.learningResources.map((link, index) => (
                                                        <a href={link} target="_blank" rel="noopener noreferrer" key={index} className="flex items-center gap-2 text-primary hover:text-primary/80 text-sm bg-secondary p-2 rounded-md">
                                                            <Link className="h-4 w-4"/>
                                                            <span className="truncate">{link}</span>
                                                        </a>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : onCooldown && lastCompletedMission && (
                                     <div className="bg-secondary/50 border-l-4 border-green-500 rounded-r-lg p-4 flex flex-col sm:flex-row sm:items-center gap-4 opacity-80 animate-in fade-in duration-500">
                                        <CheckCircle className="h-8 w-8 text-green-500 flex-shrink-0" />
                                        <div className="flex-grow">
                                            <p className="text-lg font-bold text-muted-foreground line-through">{lastCompletedMission.nome}</p>
                                            <p className="text-sm text-muted-foreground">Concluída! Próxima missão disponível à meia-noite.</p>
                                        </div>
                                        <div className="flex items-center text-primary ml-0 sm:ml-4 flex-shrink-0">
                                            <Timer className="h-5 w-5 mr-2"/>
                                            <p className="text-lg font-mono">{timers[mission.id]}</p>
                                        </div>
                                    </div>
                                )}
                                
                                {completedDailyMissions.length > 0 && (
                                     <div className="pt-4 mt-4 border-t border-border/50">
                                         <h4 className="text-md font-bold text-muted-foreground mb-2 flex items-center"><History className="h-5 w-5 mr-2"/> Histórico de Conclusão</h4>
                                         <div className="space-y-2">
                                         {completedDailyMissions.map((completed, index) => (
                                              <div key={completed.id} className="bg-secondary/50 border-l-4 border-green-500 rounded-r-lg p-3 flex flex-col sm:flex-row items-start sm:items-center gap-2 opacity-60 animate-in fade-in duration-500">
                                                <CheckCircle className="h-6 w-6 text-green-500 mr-3 flex-shrink-0" />
                                                <div className="flex-grow">
                                                    <p className="text-md font-medium text-muted-foreground line-through">{completed.nome}</p>
                                                </div>
                                                <div className="text-right ml-auto flex-shrink-0 flex items-center gap-2">
                                                    {index === 0 && !timers[mission.id] && (
                                                        <AlertDialog>
                                                            <AlertDialogTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-500 hover:text-yellow-400" aria-label="Reverter última missão">
                                                                    <Undo2 className="h-4 w-4" />
                                                                </Button>
                                                            </AlertDialogTrigger>
                                                            <AlertDialogContent>
                                                                <AlertDialogHeader>
                                                                    <AlertDialogTitle>Reverter Missão?</AlertDialogTitle>
                                                                    <AlertDialogDescription>
                                                                        Isto irá reativar la missão "{completed.nome}" e remover o XP e os fragmentos ganhos. A missão ativa atual será apagada. Tem a certeza?
                                                                    </AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                                    <AlertDialogAction onClick={() => revertLastDailyMission(mission.id)}>Sim, Reverter</AlertDialogAction>
                                                                </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    )}
                                                    <div className="flex flex-col items-end">
                                                        <p className="text-xs font-semibold text-primary/80">+{completed.xp_conclusao} XP</p>
                                                        <p className="text-xs font-semibold text-yellow-400/80 flex items-center gap-1">
                                                          <Gem className="h-3 w-3"/>
                                                          +{completed.fragmentos_conclusao || 0}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                         ))}
                                         </div>
                                     </div>
                                )}
                            </AccordionContent>
                        </AccordionItem>
                    )
                })}
            </Accordion>
            
            {completedMissions.length > 0 && (
                 <div className="mt-8">
                     <Accordion type="single" collapsible value={completedAccordionOpen ? "completed" : ""} onValueChange={(value) => setCompletedAccordionOpen(value === "completed")}>
                         <AccordionItem value="completed" className="bg-card/60 border border-border/70 rounded-lg">
                             <AccordionTrigger className="hover:no-underline px-4 py-3 text-muted-foreground">
                                 <div className="flex items-center gap-2">
                                    {completedAccordionOpen ? <ChevronsUp className="h-5 w-5"/> : <ChevronsDown className="h-5 w-5"/>}
                                    Missões Concluídas ({completedMissions.length})
                                 </div>
                             </AccordionTrigger>
                             <AccordionContent className="px-4 pb-4 space-y-4">
                                {completedMissions.map(mission => (
                                     <div key={mission.id} className={`bg-secondary/50 border-l-4 border-green-500 rounded-r-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 opacity-70`}>
                                         <div className="flex-grow">
                                             <p className="font-bold text-muted-foreground line-through">{mission.nome}</p>
                                             <p className="text-sm text-muted-foreground/80 mt-1">{mission.descricao}</p>
                                         </div>
                                        <Button 
                                            variant="outline" 
                                            size="sm" 
                                            onClick={() => reactivateEpicMission(mission.id)}
                                            disabled={generating === mission.id}
                                            className="w-full sm:w-auto flex-shrink-0"
                                            aria-label={`Reativar missão ${mission.nome}`}
                                        >
                                             {generating === mission.id ? (
                                                <><Timer className="h-4 w-4 mr-2 animate-spin"/> A reativar...</>
                                             ) : (
                                                <><RefreshCw className="h-4 w-4 mr-2"/> Reativar</>
                                             )}
                                         </Button>
                                     </div>
                                ))}
                             </AccordionContent>
                         </AccordionItem>
                     </Accordion>
                 </div>
            )}

            <MissionFeedbackDialog 
                open={feedbackModalState.open}
                onOpenChange={(isOpen) => setFeedbackModalState(prev => ({...prev, open: isOpen}))}
                onSubmit={handleMissionFeedback}
                mission={feedbackModalState.mission}
                feedbackType={feedbackModalState.type}
            />

            <Dialog open={showProgressionTree} onOpenChange={setShowProgressionTree}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-primary text-2xl">Árvore de Progressão da Missão</DialogTitle>
                        <DialogDescription>
                            Esta é a sequência de missões épicas para a meta "{selectedGoalMissions[0]?.meta_associada}".
                        </DialogDescription>
                    </DialogHeader>
                    <div className="mt-4 space-y-4 max-h-[60vh] overflow-y-auto pr-4">
                        {selectedGoalMissions.map((m, index) => (
                             <div key={m.id} className={`p-4 rounded-lg border-l-4 ${m.concluido ? 'border-green-500 bg-secondary/50 opacity-70' : 'border-primary bg-secondary'}`}>
                                <div className="flex justify-between items-center">
                                    <p className={`font-bold ${m.concluido ? 'text-muted-foreground line-through' : 'text-foreground'}`}>{m.nome}</p>
                                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${getRankColor(m.rank)}`}>Rank {m.rank}</span>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">{m.descricao}</p>
                                {m.concluido && (
                                     <div className="flex items-center text-green-400 text-sm mt-2">
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                        <span>Concluída</span>
                                     </div>
                                )}
                             </div>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>
            
            <ContributionDialog
                open={contributionDialogState.open}
                onOpenChange={(isOpen) => setContributionDialogState(prev => ({ ...prev, open: isOpen }))}
                subTask={contributionDialogState.subTask}
                onContribute={submitContribution}
            />

            {showQuestInfo && (() => {
                const rankedMission = missions.find(m => m.id === showQuestInfo.rankedMissionId);
                const dailyMission = rankedMission?.missoes_diarias.find(dm => dm.id === showQuestInfo.dailyMissionId);
                if (!dailyMission || !rankedMission) return null;

                const onCooldown = !!timers[rankedMission.id];

                return (
                     <QuestInfoDialog
                        mission={dailyMission}
                        epicMissionName={rankedMission.nome}
                        onClose={() => setShowQuestInfo(null)}
                        onContribute={(subTask, amount) => handleAddProgressPopup(dailyMission, subTask, amount)}
                        onCooldown={onCooldown}
                        timer={timers[rankedMission.id]}
                    />
                )
            })()}
        </div>
    );

    