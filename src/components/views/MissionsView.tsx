
"use client";

import { useState, useEffect } from 'react';
import { Circle, CheckCircle, Timer, Sparkles, History, GitMerge, LifeBuoy, Link, Undo2 } from 'lucide-react';
import { generateNextDailyMission } from '@/ai/flows/generate-daily-mission';
import { generateMissionSuggestion } from '@/ai/flows/generate-mission-suggestion';
import { generateSkillExperience } from '@/ai/flows/generate-skill-experience';
import { useToast } from '@/hooks/use-toast';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { statCategoryMapping } from '@/lib/mappings';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';


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
}

export const MissionsView = ({ missions, setMissions, profile, setProfile, metas, skills, setSkills }) => {
    const [generating, setGenerating] = useState(null);
    const [timers, setTimers] = useState({});
    const [showProgressionTree, setShowProgressionTree] = useState(false);
    const [selectedGoalMissions, setSelectedGoalMissions] = useState([]);
    const [missionFeedback, setMissionFeedback] = useState({}); // Stores text feedback for next mission generation
    const [feedbackModalState, setFeedbackModalState] = useState({ open: false, mission: null, type: null });

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
                        newTimers[mission.id] = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
                    } else {
                        if(timers[mission.id]){
                            // Timer finished, mark mission for update
                            missionsToUpdate.push(mission.id);
                        }
                    }
                }
            });

            if (missionsToUpdate.length > 0) {
                setMissions(currentMissions =>
                    currentMissions.map(m =>
                        missionsToUpdate.includes(m.id)
                            ? { ...m, ultima_missao_concluida_em: null }
                            : m
                    )
                );
            }
            setTimers(newTimers);
        }, 1000);

        return () => clearInterval(interval);
    }, [missions, setMissions, timers]);
    
    const handleHackerMode = () => {
        setMissions(currentMissions => currentMissions.map(m => ({ ...m, ultima_missao_concluida_em: null })));
        toast({
            title: "Modo Hacker Ativado!",
            description: "Tempos de espera das missões eliminados.",
        });
    };

    const handleLevelUp = (currentProfile) => {
        const newLevel = currentProfile.nivel + 1;
        const newXpToNextLevel = Math.floor(currentProfile.xp_para_proximo_nivel + 25);
        const newXp = currentProfile.xp - currentProfile.xp_para_proximo_nivel;
        
        return {
            ...currentProfile,
            nivel: newLevel,
            xp: newXp,
            xp_para_proximo_nivel: newXpToNextLevel,
        };
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
                missionDescription: mission.descricao,
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
            handleToastError(error, 'Não foi possível enviar o seu feedback ao Sistema.');
        }
    };

    const handleSkillUp = (skill, statsToUpgrade) => {
        const leveledUpSkill = {
            ...skill,
            nivel_atual: skill.nivel_atual + 1,
            xp_atual: skill.xp_atual - skill.xp_para_proximo_nivel,
            xp_para_proximo_nivel: Math.floor(skill.xp_para_proximo_nivel * 1.5)
        };
        
        setSkills(currentSkills => currentSkills.map(s => s.id === skill.id ? leveledUpSkill : s));
        
        let toastDescription = `A sua habilidade "${skill.nome}" subiu para o nível ${leveledUpSkill.nivel_atual}!`;

        if (statsToUpgrade && statsToUpgrade.length > 0) {
            setProfile(prevProfile => {
                const newStats = { ...prevProfile.estatisticas };
                statsToUpgrade.forEach(stat => {
                    newStats[stat] = (newStats[stat] || 0) + 1;
                });
                return { ...prevProfile, estatisticas: newStats };
            });
            const statNames = statsToUpgrade.map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' e ');
            toastDescription += `\nSua ${statNames} aumentou.`
        }

        toast({ title: "Habilidade Aumentada!", description: toastDescription });
    };


    const completeDailyMission = async (rankedMissionId, dailyMissionId) => {
        const now = new Date();
        const rankedMission = missions.find(m => m.id === rankedMissionId);
        if (!rankedMission) return;
        
        const isOnCooldown = !!rankedMission.ultima_missao_concluida_em;
        if (isOnCooldown) {
            toast({
                variant: "destructive",
                title: "Aguarde o Cooldown!",
                description: "A próxima missão estará disponível quando o temporizador zerar.",
            });
            return;
        }

        setGenerating(dailyMissionId);
        let xpGained = 0;
        let completedDailyMission = null;

        let isRankedMissionComplete = false;
        const updatedMissions = missions.map(rm => {
            if (rm.id === rankedMissionId) {
                const updatedDailyMissions = rm.missoes_diarias.map(daily => {
                    if (daily.id === dailyMissionId) {
                        xpGained = daily.xp_conclusao;
                        completedDailyMission = { ...daily, concluido: true };
                        return completedDailyMission;
                    }
                    return daily;
                });
                 
                const allDailyComplete = updatedDailyMissions.every(d => d.concluido);
                isRankedMissionComplete = allDailyComplete && updatedDailyMissions.length >= rm.total_missoes_diarias;

                return { 
                    ...rm, 
                    missoes_diarias: updatedDailyMissions, 
                    ultima_missao_concluida_em: now.toISOString(),
                    concluido: isRankedMissionComplete,
                 };
            }
            return rm;
        });

        setMissions(updatedMissions);

        // Profile XP and Level Up
        let newProfile = { ...profile, xp: profile.xp + xpGained };
        if (newProfile.xp >= newProfile.xp_para_proximo_nivel) {
            newProfile = handleLevelUp(newProfile);
            toast({ title: "Nível Aumentado!", description: `Você alcançou o Nível ${newProfile.nivel}!` });
        }
        setProfile(newProfile);

        // Skill XP and Level Up
        const meta = metas.find(m => m.nome === rankedMission.meta_associada);
        if (meta && meta.habilidade_associada_id && completedDailyMission) {
            const skillToUpdate = skills.find(s => s.id === meta.habilidade_associada_id);
            if (skillToUpdate && skillToUpdate.nivel_atual < skillToUpdate.nivel_maximo) {
                try {
                    const { xp } = await generateSkillExperience({ 
                        missionText: `${completedDailyMission.nome}: ${completedDailyMission.descricao}`,
                        skillLevel: skillToUpdate.nivel_atual,
                     });
                     
                     let newSkillXp = skillToUpdate.xp_atual + xp;
                     if(newSkillXp >= skillToUpdate.xp_para_proximo_nivel){
                        const statsToUpgrade = statCategoryMapping[skillToUpdate.categoria] || [];
                        handleSkillUp({ ...skillToUpdate, xp_atual: newSkillXp }, statsToUpgrade);
                     } else {
                        setSkills(currentSkills => currentSkills.map(s => s.id === skillToUpdate.id ? {...s, xp_atual: newSkillXp} : s));
                     }
                } catch(error) {
                    handleToastError(error, "Não foi possível calcular o XP da habilidade.");
                }
            }
        }
        
        if (isRankedMissionComplete) {
            toast({ title: "Missão Épica Concluída!", description: `Você conquistou "${rankedMission.nome}"!` });
            
            // Unlock first daily mission of the next ranked mission in the same goal
            const goalMissions = missions
                .filter(m => m.meta_associada === rankedMission.meta_associada)
                .sort((a, b) => rankOrder.indexOf(a.rank) - rankOrder.indexOf(b.rank));
            
            const currentIndex = goalMissions.findIndex(m => m.id === rankedMissionId);
            const nextMission = goalMissions[currentIndex + 1];

            if(nextMission && nextMission.missoes_diarias.length === 0){
                try {
                     const history = `O utilizador concluiu a missão épica anterior: "${rankedMission.nome}".`;
                     const meta = metas.find(m => m.nome === rankedMission.meta_associada);

                     const result = await generateNextDailyMission({
                        rankedMissionName: nextMission.nome,
                        metaName: meta?.nome || "Objetivo geral",
                        history: history,
                        userLevel: newProfile.nivel,
                    });

                     const newDailyMission = {
                        id: Date.now(),
                        nome: result.nextMissionName,
                        descricao: result.nextMissionDescription,
                        xp_conclusao: result.xp,
                        concluido: false,
                        tipo: 'diaria',
                        learningResources: result.learningResources,
                    };

                    setMissions(current => current.map(m => m.id === nextMission.id ? {...m, missoes_diarias: [newDailyMission]} : m));
                } catch (error) {
                    handleToastError(error, "Não foi possível gerar a primeira missão da próxima etapa.");
                }
            }
            
            setGenerating(null);
            return;
        }

        try {
            const history = rankedMission.missoes_diarias
                .filter(d => d.concluido)
                .map(d => `- ${d.nome}`)
                .join('\n');

            const feedbackForNextMission = missionFeedback[rankedMission.id];

            const result = await generateNextDailyMission({
                rankedMissionName: rankedMission.nome,
                metaName: meta?.nome || "Objetivo geral",
                history: history || `O utilizador acabou de completar: "${completedDailyMission.nome}".`,
                userLevel: profile.nivel,
                feedback: feedbackForNextMission,
            });

            if (feedbackForNextMission) {
                setMissionFeedback(prev => {
                    const newState = {...prev};
                    delete newState[rankedMission.id];
                    return newState;
                });
            }

            const newDailyMission = {
                id: Date.now(),
                nome: result.nextMissionName,
                descricao: result.nextMissionDescription,
                xp_conclusao: result.xp,
                concluido: false,
                tipo: 'diaria',
                learningResources: result.learningResources,
            };
            
            setMissions(currentMissions => currentMissions.map(rm => {
                if (rm.id === rankedMissionId) {
                     return { ...rm, missoes_diarias: [...rm.missoes_diarias, newDailyMission] };
                }
                return rm;
            }));


        } catch (error) {
            handleToastError(error, "Não foi possível gerar a próxima missão diária.");
        } finally {
            setGenerating(null);
        }
    };
    
    const revertLastDailyMission = (rankedMissionId) => {
        let xpToSubtract = 0;
        let missionReverted = false;

        const updatedMissions = missions.map(rm => {
            if (rm.id === rankedMissionId && !missionReverted) {
                const completedMissions = rm.missoes_diarias.filter(dm => dm.concluido);
                const activeMission = rm.missoes_diarias.find(dm => !dm.concluido);

                if (completedMissions.length > 0) {
                    const lastCompleted = completedMissions[completedMissions.length - 1];
                    xpToSubtract = lastCompleted.xp_conclusao;

                    const newDailyMissions = rm.missoes_diarias
                        .map(dm => {
                            if (dm.id === lastCompleted.id) {
                                return { ...dm, concluido: false };
                            }
                            return dm;
                        })
                        .filter(dm => dm.id !== activeMission?.id);

                    missionReverted = true;
                    return {
                        ...rm,
                        missoes_diarias: newDailyMissions,
                        ultima_missao_concluida_em: null, // Reset cooldown
                    };
                }
            }
            return rm;
        });

        if (missionReverted) {
            setMissions(updatedMissions);
            setProfile(prev => ({...prev, xp: Math.max(0, prev.xp - xpToSubtract)}));
            toast({
                title: "Missão Revertida",
                description: "A missão anterior está ativa novamente. O XP foi ajustado.",
            });
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
    
    const visibleMissions = getVisibleMissions();

    return (
        <div className="p-4 md:p-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-2">
                <h1 className="text-3xl font-bold text-cyan-400">Diário de Missões</h1>
                 <Button onClick={handleHackerMode} variant="outline" size="sm">
                    Modo Hacker
                </Button>
            </div>
            <p className="text-gray-400 mb-6">Complete a missão diária para progredir na sua missão épica. Uma nova missão é liberada à meia-noite.</p>

            <Accordion type="single" collapsible className="w-full space-y-4">
                {visibleMissions.map(mission => {
                    const activeDailyMission = mission.missoes_diarias.find(d => !d.concluido);
                    const completedDailyMissions = mission.missoes_diarias.filter(d => d.concluido).reverse();
                    const missionProgress = (completedDailyMissions.length / (mission.total_missoes_diarias || 10)) * 100;
                    const onCooldown = !!timers[mission.id];
                    const lastCompletedMission = onCooldown ? completedDailyMissions[0] : null;

                    return (
                        <AccordionItem value={`item-${mission.id}`} key={mission.id} className="bg-gray-800/50 border border-gray-700 rounded-lg">
                             <div className="flex items-center w-full">
                                <AccordionTrigger className="flex-1 hover:no-underline text-left px-4 py-3">
                                    <div className="flex-1 text-left min-w-0">
                                        <p className="text-lg font-bold text-gray-200 truncate">{mission.nome}</p>
                                        <p className="text-sm text-gray-400 mt-1 truncate">{mission.descricao}</p>
                                        <div className="w-full bg-gray-700 rounded-full h-2.5 mt-3">
                                             <div className="bg-gradient-to-r from-purple-500 to-cyan-500 h-2.5 rounded-full" style={{width: `${missionProgress}%`}}></div>
                                        </div>
                                    </div>
                                </AccordionTrigger>
                                <div className="flex items-center space-x-2 p-4">
                                     {onCooldown && (
                                        <div className="flex items-center text-cyan-400 text-xs font-mono bg-gray-900/50 px-2 py-1 rounded-md">
                                            <Timer className="h-4 w-4 mr-1.5"/>
                                            {timers[mission.id]}
                                        </div>
                                     )}
                                      <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-cyan-400" onClick={(e) => { e.stopPropagation(); handleShowProgression(mission)}}>
                                          <GitMerge className="h-5 w-5" />
                                      </Button>
                                     <span className={`text-xs font-bold px-2 py-1 rounded-full ${getRankColor(mission.rank)}`}>Rank {mission.rank}</span>
                                </div>
                            </div>
                            <AccordionContent className="px-4 pb-4 space-y-4">
                                
                                {activeDailyMission && !onCooldown && (
                                     <div className={`bg-gray-900/50 border-l-4 border-yellow-500 rounded-r-lg p-4`}>
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                                            <div className="flex-shrink-0">
                                                <button onClick={() => completeDailyMission(mission.id, activeDailyMission.id)} disabled={generating === activeDailyMission.id}>
                                                    {generating === activeDailyMission.id ? 
                                                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-500 border-t-cyan-400" />
                                                      : <Circle className="h-8 w-8 text-gray-500 hover:text-green-500 transition-colors" />}
                                                </button>
                                            </div>
                                            <div className="flex-grow">
                                                <p className="text-lg font-bold text-gray-200">{activeDailyMission.nome}</p>
                                                <p className="text-sm text-gray-400">{activeDailyMission.descricao}</p>
                                            </div>
                                            <div className="text-right ml-4 flex-shrink-0 flex items-center gap-2">
                                                <p className="text-sm font-semibold text-cyan-400">+{activeDailyMission.xp_conclusao} XP</p>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-cyan-400">
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
                                         {activeDailyMission.learningResources && activeDailyMission.learningResources.length > 0 && (
                                            <div className="mt-4 pt-3 border-t border-gray-700/50">
                                                <h5 className="text-sm font-bold text-gray-400 mb-2">Recursos de Aprendizagem Sugeridos</h5>
                                                <div className="space-y-2">
                                                    {activeDailyMission.learningResources.map((link, index) => (
                                                        <a href={link} target="_blank" rel="noopener noreferrer" key={index} className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 text-sm bg-gray-800/60 p-2 rounded-md">
                                                            <Link className="h-4 w-4"/>
                                                            <span className="truncate">{link}</span>
                                                        </a>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                                
                                {onCooldown && lastCompletedMission && (
                                     <div className="bg-gray-900/50 border-l-4 border-green-500 rounded-r-lg p-4 flex flex-col sm:flex-row sm:items-center gap-4 opacity-80">
                                        <CheckCircle className="h-8 w-8 text-green-500 flex-shrink-0" />
                                        <div className="flex-grow">
                                            <p className="text-lg font-bold text-gray-300 line-through">{lastCompletedMission.nome}</p>
                                            <p className="text-sm text-gray-400">Concluída! Próxima missão disponível à meia-noite.</p>
                                        </div>
                                        <div className="flex items-center text-cyan-400 ml-0 sm:ml-4 flex-shrink-0">
                                            <Timer className="h-5 w-5 mr-2"/>
                                            <p className="text-lg font-mono">{timers[mission.id]}</p>
                                        </div>
                                    </div>
                                )}

                                {!activeDailyMission && !onCooldown && !mission.concluido && (
                                    <div className="bg-gray-900/50 border-l-4 border-yellow-500 rounded-r-lg p-4 flex items-center">
                                        <Sparkles className="h-8 w-8 text-yellow-400 mr-4"/>
                                        <div>
                                            <p className="text-lg font-bold text-gray-200">A gerar nova missão...</p>
                                            <p className="text-sm text-gray-400">O Sistema está a preparar o seu próximo desafio.</p>
                                        </div>
                                    </div>
                                )}

                                {mission.concluido && (
                                     <div className="bg-gray-900/50 border-l-4 border-green-500 rounded-r-lg p-4 flex items-center">
                                        <Sparkles className="h-8 w-8 text-yellow-400 mr-4"/>
                                        <div>
                                            <p className="text-lg font-bold text-gray-200">Missão Épica Concluída!</p>
                                            <p className="text-sm text-gray-400">Você completou todos os passos. Bom trabalho! A próxima missão será revelada em breve.</p>
                                        </div>
                                    </div>
                                )}
                                
                                {completedDailyMissions.length > 0 && (
                                     <div className="pt-4 mt-4 border-t border-gray-700/50">
                                         <h4 className="text-md font-bold text-gray-400 mb-2 flex items-center"><History className="h-5 w-5 mr-2"/> Histórico de Conclusão</h4>
                                         <div className="space-y-2">
                                         {completedDailyMissions.map((completed, index) => (
                                              <div key={completed.id} className="bg-gray-900/50 border-l-4 border-green-500 rounded-r-lg p-3 flex items-center opacity-60">
                                                <CheckCircle className="h-6 w-6 text-green-500 mr-3 flex-shrink-0" />
                                                <div className="flex-grow">
                                                    <p className="text-md font-medium text-gray-400 line-through">{completed.nome}</p>
                                                </div>
                                                <div className="text-right ml-3 flex-shrink-0 flex items-center gap-2">
                                                    {index === 0 && !timers[mission.id] && (
                                                        <AlertDialog>
                                                            <AlertDialogTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-500 hover:text-yellow-400">
                                                                    <Undo2 className="h-4 w-4" />
                                                                </Button>
                                                            </AlertDialogTrigger>
                                                            <AlertDialogContent>
                                                                <AlertDialogHeader>
                                                                    <AlertDialogTitle>Reverter Missão?</AlertDialogTitle>
                                                                    <AlertDialogDescription>
                                                                        Isto irá reativar a missão "{completed.nome}" e remover o XP ganho. A missão ativa atual será apagada. Tem a certeza?
                                                                    </AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                                    <AlertDialogAction onClick={() => revertLastDailyMission(mission.id)}>Sim, Reverter</AlertDialogAction>
                                                                </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    )}
                                                    <p className="text-xs font-semibold text-green-400/80">+{completed.xp_conclusao} XP</p>
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
                        <DialogTitle className="text-cyan-400 text-2xl">Árvore de Progressão da Missão</DialogTitle>
                        <DialogDescription>
                            Esta é a sequência de missões épicas para a meta "{selectedGoalMissions[0]?.meta_associada}".
                        </DialogDescription>
                    </DialogHeader>
                    <div className="mt-4 space-y-4 max-h-[60vh] overflow-y-auto pr-4">
                        {selectedGoalMissions.map((m, index) => (
                             <div key={m.id} className={`p-4 rounded-lg border-l-4 ${m.concluido ? 'border-green-500 bg-gray-800/50 opacity-70' : 'border-yellow-500 bg-gray-800'}`}>
                                <div className="flex justify-between items-center">
                                    <p className={`font-bold ${m.concluido ? 'text-gray-400 line-through' : 'text-gray-200'}`}>{m.nome}</p>
                                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${getRankColor(m.rank)}`}>Rank {m.rank}</span>
                                </div>
                                <p className="text-sm text-gray-400 mt-1">{m.descricao}</p>
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

    



    

    