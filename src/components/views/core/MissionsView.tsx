
"use client";

import { memo, useState, useEffect, useMemo } from 'react';
import { Circle, CheckCircle, Timer, Sparkles, History, GitMerge, LifeBuoy, Link, Undo2, ChevronsDown, ChevronsUp, RefreshCw, Gem, Plus, Eye, LoaderCircle, AlertTriangle, Search, PlusCircle, Trophy } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { MissionDetailsDialog } from './missions/MissionDetailsDialog';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { generateMissionSuggestion } from '@/ai/flows/generate-mission-suggestion';
import { usePlayerDataContext } from '@/hooks/use-player-data.tsx';
import { MissionStatsPanel } from './missions/MissionStatsPanel';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { differenceInDays, parseISO } from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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


const MissionsViewComponent = () => {
    const { profile, missions, metas, completeMission, generatingMission, missionFeedback, setMissionFeedback, persistData } = usePlayerDataContext();
    const [showProgressionTree, setShowProgressionTree] = useState(false);
    const [selectedGoalMissions, setSelectedGoalMissions] = useState([]);
    const [feedbackModalState, setFeedbackModalState] = useState({ open: false, mission: null, type: null });
    const [activeAccordionItem, setActiveAccordionItem] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [rankFilter, setRankFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('active');

    const [dialogState, setDialogState] = useState({ open: false, mission: null, isManual: false });

    
    const { toast } = useToast();
    const rankOrder = ['F', 'E', 'D', 'C', 'B', 'A', 'S', 'SS', 'SSS'];

    const layout = profile?.user_settings?.layout_density || 'default';
    const accordionSpacing = layout === 'compact' ? 'space-y-2' : layout === 'comfortable' ? 'space-y-6' : 'space-y-4';

    const handleToastError = (error, customMessage = 'Não foi possível continuar. O Sistema pode estar sobrecarregado.') => {
        console.error("Erro de IA:", error);
        if (error instanceof Error && (error.message.includes('429') || error.message.includes('Quota'))) {
             toast({ variant: 'destructive', title: 'Quota de IA Excedida', description: 'Você atingiu o limite de pedidos. Tente novamente mais tarde.' });
        } else {
             toast({ variant: 'destructive', title: 'Erro de IA', description: customMessage });
        }
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
                     setMissionFeedback(rankedMission.id, feedbackValue);
                }
            }
        } catch (error) {
            handleToastError(error);
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
            case 'F': return 'text-gray-400';
            case 'E': return 'text-green-400';
            case 'D': return 'text-cyan-400';
            case 'C': return 'text-blue-400';
            case 'B': return 'text-purple-400';
            case 'A': return 'text-red-400';
            case 'S': return 'text-yellow-400';
            case 'SS': return 'text-orange-400';
            case 'SSS': return 'text-pink-400';
            case 'M': return 'text-slate-400'; // Cor para Manual
            default: return 'text-gray-500';
        }
    }

    const onContributeToQuest = (subTask, amount, missionToUpdate) => {
         if (missionToUpdate.isManual) {
            const updatedManualMissions = (profile.manual_missions || []).map(m => 
                m.id === missionToUpdate.id 
                ? {
                    ...m,
                    subTasks: m.subTasks.map(st => 
                        st.name === subTask.name 
                        ? {...st, current: Math.min(st.target, (st.current || 0) + amount) } 
                        : st
                    )
                }
                : m
            );
            persistData('profile', { ...profile, manual_missions: updatedManualMissions });
         } else {
             const rankedMission = missions.find(rm => rm.missoes_diarias.some(dm => dm.id === missionToUpdate.id));
             if(rankedMission) {
                completeMission({ rankedMissionId: rankedMission.id, dailyMissionId: missionToUpdate.id, subTask, amount, feedback: missionFeedback[rankedMission.id] || null });
             }
         }
    };

    const handleSaveManualMission = (missionData) => {
        const manualMissions = profile.manual_missions || [];
        let updatedMissions;

        if (missionData.id) { // Editing
            updatedMissions = manualMissions.map(m => m.id === missionData.id ? missionData : m);
        } else { // Creating
            const newMission = { ...missionData, id: `manual_${Date.now()}`, concluido: false };
            updatedMissions = [...manualMissions, newMission];
        }
        persistData('profile', { ...profile, manual_missions: updatedMissions });
        setDialogState({ open: false, mission: null, isManual: false });
    }

    const handleDeleteManualMission = (missionId) => {
        const updatedMissions = (profile.manual_missions || []).filter(m => m.id !== missionId);
        persistData('profile', { ...profile, manual_missions: updatedMissions });
    }
    
    const visibleMissions = useMemo(() => {
        const activeEpicMissions = [];
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
                activeEpicMissions.push(goalMissions[0]);
            }
        }
        
        const completedEpicMissions = missions.filter(m => m.concluido);
        const manualMissions = (profile.manual_missions || []).map(m => ({...m, isManual: true, rank: 'M'}));

        let missionsToDisplay = [];
        if (statusFilter === 'active') {
            missionsToDisplay = [...activeEpicMissions, ...manualMissions.filter(m => !m.concluido)];
        } else if (statusFilter === 'completed') {
            missionsToDisplay = [...completedEpicMissions, ...manualMissions.filter(m => m.concluido)];
        } else {
            missionsToDisplay = [...activeEpicMissions, ...completedEpicMissions, ...manualMissions];
        }

        if (rankFilter !== 'all') {
            if (rankFilter === 'M') {
                missionsToDisplay = missionsToDisplay.filter(m => m.isManual);
            } else {
                missionsToDisplay = missionsToDisplay.filter(m => m.rank === rankFilter);
            }
        }
        
        if (searchTerm) {
            missionsToDisplay = missionsToDisplay.filter(m => m.nome.toLowerCase().includes(searchTerm.toLowerCase()));
        }

        return missionsToDisplay.sort((a,b) => {
             if (a.concluido && !b.concluido) return 1;
             if (!a.concluido && b.concluido) return -1;
             return rankOrder.indexOf(a.rank) - rankOrder.indexOf(b.rank)
        });

    }, [missions, statusFilter, rankFilter, searchTerm, rankOrder, profile.manual_missions]);

    const missionViewStyle = profile?.user_settings?.mission_view_style || 'inline';

    return (
        <div className={cn("h-full flex flex-col p-4 md:p-6", accordionSpacing)}>
            <div className="flex-shrink-0">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
                    <h1 className="text-3xl font-bold text-primary font-cinzel tracking-wider">Diário de Missões</h1>
                    <Button onClick={() => setDialogState({ open: true, mission: null, isManual: true })} className="w-full sm:w-auto">
                        <PlusCircle className="mr-2 h-4 w-4"/>
                        Criar Missão Manual
                    </Button>
                </div>

                <p className="text-muted-foreground mt-2">Complete as sub-tarefas da missão diária para progredir. Uma nova missão é liberada à meia-noite.</p>
                
                <MissionStatsPanel />

                 <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Input 
                        placeholder="Procurar missão..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="sm:col-span-1 bg-card"
                    />
                    <Select value={rankFilter} onValueChange={setRankFilter}>
                        <SelectTrigger><SelectValue placeholder="Filtrar por Rank" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos os Ranks</SelectItem>
                            {rankOrder.map(r => <SelectItem key={r} value={r}>Rank {r}</SelectItem>)}
                            <SelectItem value="M">Manual</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger><SelectValue placeholder="Filtrar por Status" /></SelectTrigger>
                        <SelectContent>
                             <SelectItem value="all">Todos os Status</SelectItem>
                             <SelectItem value="active">Ativas</SelectItem>
                             <SelectItem value="completed">Concluídas</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            
            <Accordion 
                type="single" 
                collapsible 
                className={cn("w-full flex-grow overflow-y-auto mt-6 pr-2", accordionSpacing)}
                value={activeAccordionItem}
                onValueChange={(value) => {
                     if (missionViewStyle === 'inline') {
                        setActiveAccordionItem(value);
                     }
                }}
            >
                {visibleMissions.map(mission => {
                    const isManualMission = mission.isManual;
                    const activeDailyMission = isManualMission ? mission : mission.missoes_diarias?.find(d => !d.concluido);
                    const completedDailyMissions = isManualMission ? [] : (mission.missoes_diarias || []).filter(d => d.concluido);
                    
                    let missionProgress;
                    if (isManualMission) {
                         const totalSubs = mission.subTasks?.length || 0;
                         const completedSubs = mission.subTasks?.filter(st => (st.current || 0) >= st.target).length || 0;
                         missionProgress = totalSubs > 0 ? (completedSubs / totalSubs) * 100 : (mission.concluido ? 100 : 0);
                    } else {
                        missionProgress = (completedDailyMissions.length / (mission.total_missoes_diarias || 10)) * 100;
                    }
                    
                    const associatedMeta = !isManualMission && metas.find(m => m.nome === mission.meta_associada);
                    const daysRemaining = associatedMeta?.prazo ? differenceInDays(parseISO(associatedMeta.prazo), new Date()) : null;

                    const TriggerWrapper = ({ children }) => {
                        if (missionViewStyle === 'inline' && !isManualMission) {
                            return <AccordionTrigger className="flex-1 hover:no-underline text-left p-0 w-full">{children}</AccordionTrigger>;
                        }
                        return <div className="flex-1 text-left w-full cursor-pointer" onClick={() => setDialogState({ open: true, mission: activeDailyMission || mission, isManual: isManualMission })}>{children}</div>;
                    };

                    return (
                        <AccordionItem value={`item-${mission.id}`} key={mission.id} className="bg-card/60 border border-border rounded-lg data-[state=open]:border-primary/50 transition-colors">
                           <div className="flex flex-col p-4 gap-4">
                               <div className="flex items-center gap-4">
                                <TriggerWrapper>
                                    <div className="flex-1 text-left min-w-0 flex items-center gap-4">
                                        <div className={cn("w-16 h-16 flex-shrink-0 flex items-center justify-center font-cinzel text-4xl font-bold", getRankColor(mission.rank))}>
                                            {mission.rank}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                 {daysRemaining !== null && daysRemaining <= 3 && <AlertTriangle className={cn("h-4 w-4", daysRemaining <= 1 ? "text-red-500" : "text-yellow-500")} />}
                                                <p className="text-lg font-bold text-foreground break-words">{mission.nome}</p>
                                            </div>
                                            <p className="text-sm text-muted-foreground mt-1 break-words">{mission.descricao}</p>
                                        </div>
                                    </div>
                                </TriggerWrapper>
                                <div className="flex items-center space-x-2 self-start flex-shrink-0 sm:ml-4">
                                    {!isManualMission && (
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={(e) => { e.stopPropagation(); handleShowProgression(mission)}} aria-label="Ver árvore de progressão">
                                            <GitMerge className="h-5 w-5" />
                                        </Button>
                                    )}
                                </div>
                               </div>
                               {!isManualMission && (
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger className="w-full">
                                                <Progress value={missionProgress} className="h-2" />
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>{completedDailyMissions.length} de {mission.total_missoes_diarias} missões diárias concluídas.</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                               )}
                            </div>
                            <AccordionContent className="px-4 pb-4 space-y-4">
                                
                                {generatingMission === mission.id ? (
                                    <div className="bg-secondary/30 border-2 border-dashed border-primary/50 rounded-lg p-4 flex flex-col items-center justify-center text-center animate-in fade-in duration-300 h-48">
                                        <Sparkles className="h-10 w-10 text-primary animate-pulse mb-4"/>
                                        <p className="text-lg font-bold text-foreground">A gerar nova missão...</p>
                                        <p className="text-sm text-muted-foreground">O Sistema está a preparar o seu próximo desafio.</p>
                                    </div>
                                ) : activeDailyMission ? (
                                     <div className="bg-secondary/50 border-l-4 border-primary rounded-r-lg p-4 animate-in fade-in-50 slide-in-from-top-4 duration-500">
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                                             <div className="flex-grow">
                                                <p className="text-lg font-bold text-foreground">{activeDailyMission.nome}</p>
                                                <p className="text-sm text-muted-foreground mt-1">{activeDailyMission.descricao}</p>
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
                                            {activeDailyMission.subTasks?.map((st, index) => {
                                                const isCompleted = (st.current || 0) >= st.target;
                                                return(
                                                    <div key={index} className={cn("bg-background/40 p-3 rounded-md transition-all duration-300", isCompleted && "bg-green-500/10")}>
                                                        <div className="flex justify-between items-center text-sm mb-1 gap-2">
                                                            <p className={cn("font-semibold text-foreground flex-1", isCompleted && "line-through text-muted-foreground")}>{st.name}</p>
                                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                                <span className="font-mono text-muted-foreground">[{st.current || 0}/{st.target}] {st.unit}</span>
                                                                <Button 
                                                                    size="icon" 
                                                                    variant="outline" 
                                                                    className="h-7 w-7" 
                                                                    onClick={() => onContributeToQuest(st, 1, activeDailyMission)}
                                                                    disabled={isCompleted}
                                                                    aria-label={`Adicionar progresso para ${st.name}`}
                                                                >
                                                                    <Plus className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                        <Progress value={((st.current || 0) / st.target) * 100} className="h-2"/>
                                                    </div>
                                                )
                                            })}
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
                                ) : (
                                    <div className="bg-secondary/30 border-2 border-dashed border-cyan-400/50 rounded-lg p-4 flex flex-col items-center justify-center text-center animate-in fade-in duration-300 h-48">
                                        <Timer className="h-10 w-10 text-cyan-400 mb-4"/>
                                        <p className="text-lg font-bold text-foreground">Missão em Cooldown</p>
                                        <p className="text-sm text-muted-foreground">Uma nova missão diária estará disponível à meia-noite.</p>
                                    </div>
                                )}
                                
                            </AccordionContent>
                        </AccordionItem>
                    )
                })}
                 {visibleMissions.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-8 border-2 border-dashed border-border rounded-lg">
                        <Search className="h-16 w-16 mb-4" />
                        <p className="font-semibold text-lg">Nenhuma Missão Encontrada</p>
                        <p className="text-sm mt-1">Tente ajustar os seus filtros ou adicione novas metas para gerar missões.</p>
                    </div>
                )}
            </Accordion>
            
            <MissionFeedbackDialog 
                open={feedbackModalState.open}
                onOpenChange={(isOpen) => setFeedbackModalState(prev => ({...prev, open: isOpen}))}
                onSubmit={handleMissionFeedback}
                mission={feedbackModalState.mission}
                feedbackType={feedbackModalState.type}
            />

            { dialogState.open &&
                <MissionDetailsDialog
                    isOpen={dialogState.open}
                    onClose={() => setDialogState({ open: false, mission: null, isManual: false })}
                    mission={dialogState.mission}
                    isManual={dialogState.isManual}
                    onContribute={onContributeToQuest}
                    onSave={handleSaveManualMission}
                    onDelete={handleDeleteManualMission}
                />
            }

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
        </div>
    );
};

export const MissionsView = memo(MissionsViewComponent);
