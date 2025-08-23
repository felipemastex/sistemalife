
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
import { CircularProgress } from '@/components/ui/circular-progress';


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


export const MissionsView = ({ missions, onCompleteMission }) => {
    const [generating, setGenerating] = useState(null); // Stores rankedMissionId
    const [timers, setTimers] = useState({});
    const [showProgressionTree, setShowProgressionTree] = useState(false);
    const [selectedGoalMissions, setSelectedGoalMissions] = useState([]);
    const [missionFeedback, setMissionFeedback] = useState({}); // Stores text feedback for next mission generation
    const [feedbackModalState, setFeedbackModalState] = useState({ open: false, mission: null, type: null });
    const [completedAccordionOpen, setCompletedAccordionOpen] = useState(false);
    
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

    return (
        <div className="p-4 md:p-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-2">
                <h1 className="text-3xl font-bold text-primary font-cinzel tracking-wider">Diário de Missões</h1>
            </div>
            <p className="text-muted-foreground mb-6">Complete as sub-tarefas da missão diária para progredir. Uma nova missão é liberada à meia-noite.</p>
            
            <Accordion type="single" collapsible className="w-full space-y-4">
                {visibleMissions.map(mission => {
                    const activeDailyMission = mission.missoes_diarias.find(d => !d.concluido);
                    const completedDailyMissions = mission.missoes_diarias.filter(d => d.concluido).reverse();
                    const missionProgress = (completedDailyMissions.length / (mission.total_missoes_diarias || 10)) * 100;
                    const onCooldown = !!timers[mission.id];

                    return (
                        <AccordionItem value={`item-${mission.id}`} key={mission.id} className="bg-card/60 border border-border rounded-lg">
                           <div className="flex flex-col sm:flex-row items-start sm:items-center p-4 gap-4">
                                <AccordionTrigger className="flex-1 hover:no-underline text-left p-0 w-full">
                                    <div className="flex-1 text-left min-w-0 flex items-center gap-4">
                                        <div className="relative w-16 h-16 flex-shrink-0">
                                            <CircularProgress value={missionProgress} strokeWidth={6} />
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <span className={`text-lg font-bold ${getRankColor(mission.rank)} rounded-full w-8 h-8 flex items-center justify-center`}>
                                                    {mission.rank}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-lg font-bold text-foreground break-words">{mission.nome}</p>
                                            <p className="text-sm text-muted-foreground mt-1 break-words">{mission.descricao}</p>
                                        </div>
                                    </div>
                                </AccordionTrigger>
                                <div className="flex items-center space-x-2 self-start flex-shrink-0 sm:ml-4">
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={(e) => { e.stopPropagation(); handleShowProgression(mission)}} aria-label="Ver árvore de progressão">
                                        <GitMerge className="h-5 w-5" />
                                    </Button>
                                </div>
                            </div>
                            <AccordionContent className="px-4 pb-4 space-y-4">
                                
                                {generating === mission.id ? (
                                    <div className="bg-secondary/30 border-2 border-dashed border-primary/50 rounded-lg p-4 flex flex-col items-center justify-center text-center animate-in fade-in duration-300 h-48">
                                        <Sparkles className="h-10 w-10 text-primary animate-pulse mb-4"/>
                                        <p className="text-lg font-bold text-foreground">A gerar nova missão...</p>
                                        <p className="text-sm text-muted-foreground">O Sistema está a preparar o seu próximo desafio.</p>
                                    </div>
                                ) : activeDailyMission && !onCooldown ? (
                                     <div className="bg-secondary/50 border-l-4 border-primary rounded-r-lg p-4 animate-in fade-in-50 slide-in-from-top-4 duration-500">
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
                                                                onClick={() => onCompleteMission({ rankedMissionId: mission.id, dailyMissionId: activeDailyMission.id, subTask: st, amount: 1 })}
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
                                ) : null }
                                
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
        </div>
    );

    