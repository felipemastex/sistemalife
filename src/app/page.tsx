"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { Bot, User, BookOpen, Target, TreeDeciduous, Settings, LogOut, Swords, Brain, Zap, ShieldCheck, Star, PlusCircle, Edit, Trash2, Send, CheckCircle, Circle, Sparkles, Clock, Timer, History, MessageSquareQuote, X, ZapIcon, Feather, GitMerge, MoreVertical, LifeBuoy, BrainCircuit, Link } from 'lucide-react';
import * as mockData from '@/lib/data';
import { generateSystemAdvice } from '@/ai/flows/generate-personalized-advice';
import { generateNextDailyMission } from '@/ai/flows/generate-daily-mission';
import { generateGoalCategory } from '@/ai/flows/generate-goal-category';
import { generateSmartGoalQuestion, GenerateSmartGoalQuestionInput } from '@/ai/flows/generate-smart-goal-questions';
import { generateSimpleSmartGoal } from '@/ai/flows/generate-simple-smart-goal';
import { generateInitialEpicMission } from '@/ai/flows/generate-initial-epic-mission';
import { generateMissionSuggestion } from '@/ai/flows/generate-mission-suggestion';
import { generateRoutineSuggestion } from '@/ai/flows/generate-routine-suggestion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"


// --- COMPONENTES ---

const Dashboard = ({ profile }) => {
  const getProfileRank = (level) => {
    if (level <= 5) return { rank: 'F', title: 'Novato' };
    if (level <= 10) return { rank: 'E', title: 'Iniciante' };
    if (level <= 20) return { rank: 'D', title: 'Adepto' };
    if (level <= 30) return { rank: 'C', title: 'Experiente' };
    if (level <= 40) return { rank: 'B', title: 'Perito' };
    if (level <= 50) return { rank: 'A', title: 'Mestre' };
    if (level <= 70) return { rank: 'S', title: 'Grão-Mestre' };
    if (level <= 90) return { rank: 'SS', title: 'Herói' };
    return { rank: 'SSS', title: 'Lendário' };
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
  };

  if (!profile) return <div className="text-center p-8 text-cyan-400">A carregar perfil...</div>;

  const xpPercentage = (profile.xp / profile.xp_para_proximo_nivel) * 100;
  const profileRank = getProfileRank(profile.nivel);
  
  const stats = [
    { name: 'Força', value: profile.estatisticas.forca, icon: Swords, color: 'text-red-400' },
    { name: 'Inteligência', value: profile.estatisticas.inteligencia, icon: Brain, color: 'text-blue-400' },
    { name: 'Destreza', value: profile.estatisticas.destreza, icon: Zap, color: 'text-yellow-400' },
    { name: 'Constituição', value: profile.estatisticas.constituicao, icon: ShieldCheck, color: 'text-green-400' },
    { name: 'Sabedoria', value: profile.estatisticas.sabedoria, icon: BookOpen, color: 'text-purple-400' },
    { name: 'Carisma', value: profile.estatisticas.carisma, icon: Star, color: 'text-pink-400' },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 shadow-lg">
        <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
                <h2 className="text-2xl font-bold text-cyan-400">{profile.nome_utilizador}</h2>
                <span className={`px-3 py-1 text-sm font-bold rounded-full ${getRankColor(profileRank.rank)}`}>
                    Rank {profileRank.rank}
                </span>
            </div>
             <p className="text-gray-400">Nível {profile.nivel} <span className="text-gray-500">({profileRank.title})</span></p>
        </div>
        <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-300 mb-1">
                <span>XP</span>
                <span>{profile.xp} / {profile.xp_para_proximo_nivel}</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-4">
                <div className="bg-gradient-to-r from-cyan-500 to-blue-500 h-4 rounded-full transition-all duration-500" style={{ width: `${xpPercentage}%` }}></div>
            </div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map(stat => (
          <div key={stat.name} className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 flex flex-col items-center justify-center space-y-2">
            <stat.icon className={`h-8 w-8 ${stat.color}`} />
            <span className="text-gray-300 text-sm">{stat.name}</span>
            <span className="text-xl font-bold text-white">{stat.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const SmartGoalWizard = ({ onClose, onSave, metaToEdit }) => {
    const isEditing = !!metaToEdit;

    const getInitialGoalState = useCallback(() => {
        if (isEditing && metaToEdit) {
             return {
                id: metaToEdit.id || null,
                nome: metaToEdit.nome || '',
                categoria: metaToEdit.categoria || '',
                detalhes_smart: {
                    specific: metaToEdit.detalhes_smart?.specific || '',
                    measurable: metaToEdit.detalhes_smart?.measurable || '',
                    achievable: metaToEdit.detalhes_smart?.achievable || '',
                    relevant: metaToEdit.detalhes_smart?.relevant || '',
                    timeBound: metaToEdit.detalhes_smart?.timeBound || '',
                }
            };
        }
        return {
            id: null,
            nome: '',
            categoria: '',
            detalhes_smart: {
                specific: '',
                measurable: '',
                achievable: '',
                relevant: '',
                timeBound: '',
            }
        };
    }, [isEditing, metaToEdit]);
    
    const [goalState, setGoalState] = useState(getInitialGoalState);
    const [currentQuestion, setCurrentQuestion] = useState('');
    const [exampleAnswers, setExampleAnswers] = useState([]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [history, setHistory] = useState([]);
    const { toast } = useToast();
    
     useEffect(() => {
        const initialState = getInitialGoalState();
        setGoalState(initialState);
        setHistory([]);
        setUserInput('');

        if (isEditing) {
            setCurrentQuestion("A sua meta SMART está completa. Pode refinar qualquer campo ou salvar as alterações.");
        } else {
            setCurrentQuestion('');
        }
    }, [metaToEdit, isEditing, getInitialGoalState]);

    const handleToastError = (error, customMessage = 'Não foi possível continuar. O Sistema pode estar sobrecarregado.') => {
        console.error("Erro de IA:", error);
        if (error instanceof Error && (error.message.includes('429') || error.message.includes('Quota'))) {
             toast({ variant: 'destructive', title: 'Quota de IA Excedida', description: 'Você atingiu o limite de pedidos. Tente novamente mais tarde.' });
        } else {
             toast({ variant: 'destructive', title: 'Erro de IA', description: customMessage });
        }
    };

    const handleInitialQuestion = useCallback(async (initialGoalName) => {
        setIsLoading(true);
        const initialGoal = { name: initialGoalName };
        setGoalState(prev => ({...prev, nome: initialGoalName}));
        
        try {
            const result = await generateSmartGoalQuestion({ goal: initialGoal, history: [] });
            if (result.nextQuestion) {
                setCurrentQuestion(result.nextQuestion);
                setExampleAnswers(result.exampleAnswers || []);
            } else if (result.isComplete && result.refinedGoal) {
                await handleSaveGoal(result.refinedGoal);
            }
        } catch (error) {
            handleToastError(error, 'Não foi possível iniciar o assistente.');
            onClose();
        } finally {
            setIsLoading(false);
        }
    },[onClose]);


    const handleNextStep = async () => {
        if (!userInput.trim() || isLoading) return;

        const lastQuestion = currentQuestion;
        const newHistory = [...history, { question: lastQuestion, answer: userInput }];
        setHistory(newHistory);
        setIsLoading(true);
        setExampleAnswers([]);
        
        let updatedGoal = { ...goalState.detalhes_smart, name: goalState.nome };
        
        if (!updatedGoal.specific) updatedGoal.specific = userInput;
        else if (!updatedGoal.measurable) updatedGoal.measurable = userInput;
        else if (!updatedGoal.achievable) updatedGoal.achievable = userInput;
        else if (!updatedGoal.relevant) updatedGoal.relevant = userInput;
        else if (!updatedGoal.timeBound) updatedGoal.timeBound = userInput;
        
        setUserInput(''); 
        setGoalState(prev => ({...prev, detalhes_smart: updatedGoal}));

        try {
            const result = await generateSmartGoalQuestion({ goal: updatedGoal, history: newHistory });

            if (result.isComplete && result.refinedGoal) {
                await handleSaveGoal(result.refinedGoal);
            } else if (result.nextQuestion) {
                setCurrentQuestion(result.nextQuestion);
                setExampleAnswers(result.exampleAnswers || []);
            }
        } catch (error) {
            handleToastError(error);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleSaveGoal = async (finalGoalDetails) => {
        setIsLoading(true);
        try {
            const finalName = finalGoalDetails.name || goalState.nome;
            
            const categoryResult = await generateGoalCategory({
                goalName: finalName,
                categories: mockData.categoriasMetas,
            });
            const newMeta = {
                id: metaToEdit ? metaToEdit.id : Date.now(),
                nome: finalName,
                categoria: categoryResult.category || 'Desenvolvimento Pessoal',
                detalhes_smart: {
                    specific: finalGoalDetails.specific,
                    measurable: finalGoalDetails.measurable,
                    achievable: finalGoalDetails.achievable,
                    relevant: finalGoalDetails.relevant,
                    timeBound: finalGoalDetails.timeBound,
                }
            };
            onSave(newMeta);
            toast({ title: "Meta SMART Salva!", description: "A sua nova meta foi definida com sucesso." });
            onClose(); 
        } catch (error) {
             handleToastError(error, 'Não foi possível sugerir uma categoria. A salvar com categoria padrão.');
             const finalName = finalGoalDetails.name || goalState.nome;
             const newMeta = {
                id: metaToEdit ? metaToEdit.id : Date.now(),
                nome: finalName,
                categoria: 'Desenvolvimento Pessoal',
                detalhes_smart: finalGoalDetails
             };
             onSave(newMeta);
             onClose();
        } finally {
            setIsLoading(false);
        }
    }
    
    const handleEditSave = () => {
        handleSaveGoal(goalState.detalhes_smart);
    }

    const renderInitialScreen = () => (
        <div className="text-center">
            <h2 className="text-2xl font-bold text-cyan-400 mb-4">Qual é a meta que você tem em mente?</h2>
            <p className="text-gray-400 mb-6">Descreva o seu objetivo inicial. O Sistema irá ajudá-lo a refiná-lo.</p>
             <Input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && userInput.trim() && handleInitialQuestion(userInput)}
                placeholder="Ex: Aprender a programar, correr uma maratona, ler mais livros..."
                className="max-w-lg mx-auto"
                disabled={isLoading}
            />
            <Button onClick={() => userInput.trim() && handleInitialQuestion(userInput)} className="mt-4" disabled={isLoading || !userInput.trim()}>
                Começar a Definir
            </Button>
        </div>
    );
    
     const renderEditingScreen = () => (
        <div className="w-full max-w-4xl animate-in fade-in-50 duration-500">
             <h2 className="text-2xl text-center font-bold text-cyan-400 mb-4">Editar Meta: {goalState.nome}</h2>
             <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-8 space-y-4">
                <div>
                    <Label htmlFor="specific" className="text-cyan-400">Específico</Label>
                    <Textarea id="specific" value={goalState.detalhes_smart.specific} onChange={(e) => setGoalState(prev => ({...prev, detalhes_smart: {...prev.detalhes_smart, specific: e.target.value}}))} className="min-h-[60px]" />
                </div>
                 <div>
                    <Label htmlFor="measurable" className="text-cyan-400">Mensurável</Label>
                    <Textarea id="measurable" value={goalState.detalhes_smart.measurable} onChange={(e) => setGoalState(prev => ({...prev, detalhes_smart: {...prev.detalhes_smart, measurable: e.target.value}}))} className="min-h-[60px]" />
                </div>
                 <div>
                    <Label htmlFor="achievable" className="text-cyan-400">Atingível</Label>
                    <Textarea id="achievable" value={goalState.detalhes_smart.achievable} onChange={(e) => setGoalState(prev => ({...prev, detalhes_smart: {...prev.detalhes_smart, achievable: e.target.value}}))} className="min-h-[60px]" />
                </div>
                 <div>
                    <Label htmlFor="relevant" className="text-cyan-400">Relevante</Label>
                    <Textarea id="relevant" value={goalState.detalhes_smart.relevant} onChange={(e) => setGoalState(prev => ({...prev, detalhes_smart: {...prev.detalhes_smart, relevant: e.target.value}}))} className="min-h-[60px]" />
                </div>
                 <div>
                    <Label htmlFor="timeBound" className="text-cyan-400">Prazo</Label>
                    <Textarea id="timeBound" value={goalState.detalhes_smart.timeBound} onChange={(e) => setGoalState(prev => ({...prev, detalhes_smart: {...prev.detalhes_smart, timeBound: e.target.value}}))} className="min-h-[60px]" />
                </div>
                <div className="flex justify-end pt-4">
                     <Button onClick={handleEditSave} disabled={isLoading}>
                        Salvar Alterações
                    </Button>
                </div>
             </div>
        </div>
    );

    const renderQuestionScreen = () => (
         <div className="w-full max-w-4xl animate-in fade-in-50 duration-500">
            <p className="text-center text-gray-400 mb-4">Meta: <span className="font-bold text-gray-200">{goalState.nome}</span></p>
            <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-8 text-center shadow-lg">
                {isLoading && !currentQuestion ? (
                     <div className="flex items-center justify-center space-x-2 h-48">
                        <div className="h-3 w-3 bg-cyan-400 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                        <div className="h-3 w-3 bg-cyan-400 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                        <div className="h-3 w-3 bg-cyan-400 rounded-full animate-pulse"></div>
                     </div>
                ) : (
                    <>
                        <h2 className="text-2xl text-cyan-400 mb-6 min-h-[6rem] flex items-center justify-center">{currentQuestion}</h2>
                        <Textarea
                            value={userInput}
                            onChange={(e) => setUserInput(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleNextStep();
                              }
                            }}
                            placeholder="Seja detalhado na sua resposta ou escolha um exemplo abaixo..."
                            className="min-h-[100px] text-base"
                            disabled={isLoading}
                        />

                        {exampleAnswers.length > 0 && !isLoading && (
                            <div className="mt-6 space-y-2 text-left">
                                 <p className="text-sm text-gray-400 mb-2">Ou inspire-se com estes exemplos:</p>
                                {exampleAnswers.map((ex, i) => (
                                    <button 
                                        key={i} 
                                        onClick={() => setUserInput(ex)}
                                        className="w-full text-left p-3 bg-gray-800/60 rounded-md hover:bg-gray-700/80 transition-colors text-sm text-gray-300"
                                    >
                                        {ex}
                                    </button>
                                ))}
                            </div>
                        )}
                        
                        <Button onClick={handleNextStep} className="mt-6" disabled={isLoading || !userInput.trim()}>
                            Próximo Passo
                            <Send className="h-4 w-4 ml-2" />
                        </Button>
                    </>
                )}
            </div>
         </div>
    );
    
    const renderContent = () => {
        if(isEditing){
            return renderEditingScreen();
        }
        if(!goalState.nome){
            return renderInitialScreen();
        }
        return renderQuestionScreen();
    }


    return (
         <div className="fixed inset-0 bg-gray-900/90 backdrop-blur-md flex flex-col items-center justify-center z-50 p-4">
            <Button onClick={onClose} variant="ghost" size="icon" className="absolute top-4 right-4 text-gray-400 hover:text-white">
                <X className="h-6 w-6" />
            </Button>
            {renderContent()}
        </div>
    )
}


const MetasView = ({ metas, setMetas, missions, setMissions, profile }) => {
    const [showWizard, setShowWizard] = useState(false);
    const [showModeSelection, setShowModeSelection] = useState(false);
    const [showSimpleModeDialog, setShowSimpleModeDialog] = useState(false);
    const [simpleGoalName, setSimpleGoalName] = useState('');
    const [isLoadingSimpleGoal, setIsLoadingSimpleGoal] = useState(false);
    const [metaToEdit, setMetaToEdit] = useState(null);
    const { toast } = useToast();

    const handleToastError = (error, customMessage = 'Não foi possível continuar. O Sistema pode estar sobrecarregado.') => {
        console.error("Erro de IA:", error);
        if (error instanceof Error && (error.message.includes('429') || error.message.includes('Quota'))) {
             toast({ variant: 'destructive', title: 'Quota de IA Excedida', description: 'Você atingiu o limite de pedidos. Tente novamente mais tarde.' });
        } else {
             toast({ variant: 'destructive', title: 'Erro de IA', description: customMessage });
        }
    };

    const handleOpenWizard = (meta = null) => {
        if (meta) {
            setMetaToEdit(meta);
            setShowModeSelection(false); // Do not show mode selection when editing
            setShowWizard(true);
        } else {
            setMetaToEdit(null);
            setShowModeSelection(true); // Show mode selection for new goal
        }
    };

    const handleCloseWizard = () => {
        setShowWizard(false);
        setMetaToEdit(null);
        setShowSimpleModeDialog(false);
        setSimpleGoalName('');
        setShowModeSelection(false);
    };

    const handleSave = async (newOrUpdatedMeta) => {
        setIsLoadingSimpleGoal(true);
        const isEditing = !!(newOrUpdatedMeta.id && metas.some(m => m.id === newOrUpdatedMeta.id));
        
        try {
            if (isEditing) {
                // --- UPDATE LOGIC ---
                const metaOriginal = metas.find(m => m.id === newOrUpdatedMeta.id);
                const updatedMetas = metas.map(m => m.id === newOrUpdatedMeta.id ? { ...m, ...newOrUpdatedMeta } : m);
                setMetas(updatedMetas);
                
                if (metaOriginal && metaOriginal.nome !== newOrUpdatedMeta.nome) {
                    setMissions(prev => prev.map(mission => 
                        mission.meta_associada === metaOriginal.nome 
                        ? { ...mission, meta_associada: newOrUpdatedMeta.nome }
                        : mission
                    ));
                }
                toast({ title: "Meta Atualizada!", description: "A sua meta foi atualizada com sucesso." });

            } else {
                // --- CREATE LOGIC ---
                const newMetaWithId = { ...newOrUpdatedMeta, id: Date.now(), user_id: profile.id };
                
                const relatedHistory = metas
                    .filter(m => m.categoria === newMetaWithId.categoria)
                    .map(m => `- Meta Concluída: ${m.nome}`)
                    .join('\n');
                
                const result = await generateInitialEpicMission({
                    goalName: newMetaWithId.nome,
                    goalDetails: JSON.stringify(newMetaWithId.detalhes_smart),
                    userLevel: profile.nivel,
                    relatedHistory: relatedHistory,
                });

                if (result.fallback) {
                    toast({
                        variant: 'destructive',
                        title: 'Sistema Sobrecarregado',
                        description: 'Uma missão inicial simples foi criada. Tente editar a meta mais tarde para gerar uma árvore de progressão completa.',
                    });
                } else {
                    toast({ title: "Nova Árvore de Progressão Gerada!", description: `A sua jornada para "${newMetaWithId.nome}" começou.` });
                }

                const newMissions = result.progression.map((epicMission, index) => {
                    const isFirstMission = index === 0;
                    return {
                        id: Date.now() + index + 1,
                        nome: epicMission.epicMissionName,
                        descricao: epicMission.epicMissionDescription,
                        concluido: false,
                        rank: epicMission.rank,
                        level_requirement: 1, // Can be adjusted later
                        meta_associada: newMetaWithId.nome,
                        total_missoes_diarias: 10, // Default value
                        ultima_missao_concluida_em: null,
                        missoes_diarias: isFirstMission ? [{
                            id: Date.now() + result.progression.length + 2,
                            nome: result.firstDailyMissionName,
                            descricao: result.firstDailyMissionDescription,
                            xp_conclusao: result.firstDailyMissionXp,
                            concluido: false,
                            tipo: 'diaria',
                        }] : [],
                    };
                });
                
                setMetas(prev => [...prev, newMetaWithId]);
                setMissions(prev => [...prev, ...newMissions]);
            }
        } catch (error) {
            handleToastError(error, 'Não foi possível salvar a meta ou gerar a árvore de progressão.');
        } finally {
            setIsLoadingSimpleGoal(false);
            handleCloseWizard();
        }
    };

    const handleCreateSimpleGoal = async () => {
        if (!simpleGoalName.trim()) return;
        setIsLoadingSimpleGoal(true);
        try {
            const { refinedGoal } = await generateSimpleSmartGoal({ goalName: simpleGoalName });
            await handleSave({
                nome: refinedGoal.name,
                categoria: 'Desenvolvimento Pessoal', // Default category
                detalhes_smart: refinedGoal
            });
        } catch (error) {
            handleToastError(error, 'Não foi possível criar a meta com a IA. Tente novamente.');
        } finally {
            setIsLoadingSimpleGoal(false);
            handleCloseWizard();
        }
    };


    const handleDelete = (id) => {
        const metaToDelete = metas.find(m => m.id === id);
        if (metaToDelete) {
            setMissions(prev => prev.filter(mission => mission.meta_associada !== metaToDelete.nome));
            setMetas(metas.filter(m => m.id !== id));
        }
    };

    const startDetailedMode = (meta = null) => {
        setMetaToEdit(meta);
        setShowModeSelection(false);
        setShowWizard(true);
    };

    const startSimpleMode = () => {
        setMetaToEdit(null);
        setShowModeSelection(false);
        setShowSimpleModeDialog(true);
    };


    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-cyan-400">Metas</h1>
                <Button onClick={() => handleOpenWizard()} className="bg-cyan-600 hover:bg-cyan-500">
                    <PlusCircle className="h-5 w-5 mr-2" />
                    Adicionar Meta
                </Button>
            </div>
            <p className="text-gray-400 mb-6">Estas são as suas metas de longo prazo. Para cada meta, uma árvore de progressão de missões épicas será criada.</p>
            <Accordion type="multiple" className="space-y-4">
                {metas.map(meta => (
                    <AccordionItem value={`meta-${meta.id}`} key={meta.id} className="bg-gray-800/50 border border-gray-700 rounded-lg">
                       <div className="flex items-center w-full">
                           <AccordionTrigger className="flex-1 hover:no-underline text-left p-4">
                                <div>
                                    <p className="text-lg text-gray-200">{meta.nome}</p>
                                    <span className="text-sm text-gray-400 bg-gray-700 px-2 py-1 rounded">{meta.categoria}</span>
                                </div>
                           </AccordionTrigger>
                           <div className="flex space-x-2 p-4">
                                <Button onClick={() => handleOpenWizard(meta)} variant="ghost" size="icon" className="text-gray-400 hover:text-yellow-400"><Edit className="h-5 w-5" /></Button>
                                <Button onClick={() => handleDelete(meta.id)} variant="ghost" size="icon" className="text-gray-400 hover:text-red-400"><Trash2 className="h-5 w-5" /></Button>
                           </div>
                       </div>
                        <AccordionContent className="p-4 pt-0">
                           <div className="space-y-3 text-sm text-gray-300 border-t border-gray-700 pt-3">
                                <p><strong className="text-cyan-400">Específico:</strong> {meta.detalhes_smart.specific}</p>
                                <p><strong className="text-cyan-400">Mensurável:</strong> {meta.detalhes_smart.measurable}</p>
                                <p><strong className="text-cyan-400">Atingível:</strong> {meta.detalhes_smart.achievable}</p>
                                <p><strong className="text-cyan-400">Relevante:</strong> {meta.detalhes_smart.relevant}</p>
                                <p><strong className="text-cyan-400">Prazo:</strong> {meta.detalhes_smart.timeBound}</p>
                           </div>
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>

            {showWizard && (
                <SmartGoalWizard
                    onClose={handleCloseWizard}
                    onSave={handleSave}
                    metaToEdit={metaToEdit}
                />
            )}
            
            <Dialog open={showModeSelection} onOpenChange={setShowModeSelection}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Escolha o modo de criação da meta</DialogTitle>
                        <DialogDescription>
                            Como você prefere definir a sua próxima grande meta?
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                       <button onClick={startSimpleMode} className="p-4 border border-gray-700 rounded-lg hover:bg-gray-800 transition-colors flex flex-col items-center text-center">
                           <Feather className="h-10 w-10 text-cyan-400 mb-2"/>
                           <h3 className="font-bold text-gray-200">Modo Rápido</h3>
                           <p className="text-sm text-gray-400">Apenas dê um nome à sua meta. A IA fará o resto.</p>
                       </button>
                       <button onClick={() => startDetailedMode()} className="p-4 border border-gray-700 rounded-lg hover:bg-gray-800 transition-colors flex flex-col items-center text-center">
                           <ZapIcon className="h-10 w-10 text-purple-400 mb-2"/>
                           <h3 className="font-bold text-gray-200">Modo Detalhado</h3>
                           <p className="text-sm text-gray-400">Seja guiado pela IA para criar uma meta SMART completa.</p>
                       </button>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={showSimpleModeDialog} onOpenChange={(isOpen) => { if (!isOpen) handleCloseWizard(); else setShowSimpleModeDialog(true);}}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Modo Rápido: Nova Meta</DialogTitle>
                        <DialogDescription>
                            Digite o nome da sua meta. O Sistema irá transformá-la num objetivo SMART para si.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Input
                            placeholder="Ex: Aprender a investir na bolsa"
                            value={simpleGoalName}
                            onChange={(e) => setSimpleGoalName(e.target.value)}
                            disabled={isLoadingSimpleGoal}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowSimpleModeDialog(false)} disabled={isLoadingSimpleGoal}>Cancelar</Button>
                        <Button onClick={handleCreateSimpleGoal} disabled={isLoadingSimpleGoal || !simpleGoalName.trim()}>
                            {isLoadingSimpleGoal ? "A criar..." : "Criar Meta"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    );
};


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

const MissionsView = ({ missions, setMissions, profile, setProfile, metas }) => {
    const [generating, setGenerating] = useState(null);
    const [timers, setTimers] = useState({});
    const [showProgressionTree, setShowProgressionTree] = useState(false);
    const [selectedGoalMissions, setSelectedGoalMissions] = useState([]);
    const [missionFeedback, setMissionFeedback] = useState({}); // Stores text feedback for next mission generation
    const [hackerMode, setHackerMode] = useState(false);
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
                            // Timer finished, reset the cooldown date by removing it
                            setMissions(currentMissions => currentMissions.map(m => m.id === mission.id ? {...m, ultima_missao_concluida_em: null} : m));
                        }
                    }
                }
            });
            setTimers(newTimers);
        }, 1000);

        return () => clearInterval(interval);
    }, [missions, setMissions, timers]);
    
    useEffect(() => {
        if (hackerMode) {
            setMissions(currentMissions => currentMissions.map(m => ({ ...m, ultima_missao_concluida_em: null })));
            toast({
                title: "Modo Hacker Ativado!",
                description: "Tempos de espera das missões eliminados.",
            });
            setHackerMode(false); // Reset switch after use
        }
    }, [hackerMode, setMissions, toast]);

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

        let isRankedMissionComplete = false;
        const updatedMissions = missions.map(rm => {
            if (rm.id === rankedMissionId) {
                const updatedDailyMissions = rm.missoes_diarias.map(daily => {
                    if (daily.id === dailyMissionId) {
                        xpGained = daily.xp_conclusao;
                        return { ...daily, concluido: true };
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

        let newProfile = { ...profile, xp: profile.xp + xpGained };
        let leveledUp = false;
        if (newProfile.xp >= newProfile.xp_para_proximo_nivel) {
            newProfile = handleLevelUp(newProfile);
            leveledUp = true;
        }
        
        setProfile(newProfile);

        if(leveledUp){
            toast({ title: "Nível Aumentado!", description: `Você alcançou o Nível ${newProfile.nivel}!` });
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
            const completedDailyMission = rankedMission.missoes_diarias.find(d => d.id === dailyMissionId);
            const history = rankedMission.missoes_diarias
                .filter(d => d.concluido)
                .map(d => `- ${d.nome}`)
                .join('\n');

            const meta = metas.find(m => m.nome === rankedMission.meta_associada)
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
        <div className="p-6">
            <div className="flex justify-between items-center mb-2">
                <h1 className="text-3xl font-bold text-cyan-400">Diário de Missões</h1>
                 <div className="flex items-center space-x-2">
                    <Switch id="hacker-mode" onCheckedChange={setHackerMode} checked={hackerMode} />
                    <Label htmlFor="hacker-mode" className="text-sm text-gray-400">Modo Hacker</Label>
                </div>
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
                                    <div className="flex-1 text-left">
                                        <div className="flex justify-between items-center">
                                            <p className="text-lg font-bold text-gray-200">{mission.nome}</p>
                                        </div>
                                        <p className="text-sm text-gray-400 mt-1">{mission.descricao}</p>
                                        <div className="w-full bg-gray-700 rounded-full h-2.5 mt-3">
                                             <div className="bg-gradient-to-r from-purple-500 to-cyan-500 h-2.5 rounded-full" style={{width: `${missionProgress}%`}}></div>
                                        </div>
                                    </div>
                                </AccordionTrigger>
                                <div className="flex items-center space-x-2 pl-4 pr-4">
                                     {onCooldown && (
                                        <div className="flex items-center text-cyan-400 text-xs font-mono bg-gray-900/50 px-2 py-1 rounded-md">
                                            <Timer className="h-4 w-4 mr-1.5"/>
                                            {timers[mission.id]}
                                        </div>
                                     )}
                                      <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-cyan-400" onClick={() => handleShowProgression(mission)}>
                                          <GitMerge className="h-5 w-5" />
                                      </Button>
                                     <span className={`text-xs font-bold px-2 py-1 rounded-full ${getRankColor(mission.rank)}`}>Rank {mission.rank}</span>
                                </div>
                            </div>
                            <AccordionContent className="px-4 pb-4 space-y-4">
                                
                                {activeDailyMission && !onCooldown && (
                                     <div className={`bg-gray-900/50 border-l-4 border-yellow-500 rounded-r-lg p-4`}>
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 mr-4">
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
                                     <div className="bg-gray-900/50 border-l-4 border-green-500 rounded-r-lg p-4 flex items-center opacity-80">
                                        <CheckCircle className="h-8 w-8 text-green-500 mr-4 flex-shrink-0" />
                                        <div className="flex-grow">
                                            <p className="text-lg font-bold text-gray-300 line-through">{lastCompletedMission.nome}</p>
                                            <p className="text-sm text-gray-400">Concluída! Próxima missão disponível à meia-noite.</p>
                                        </div>
                                        <div className="flex items-center text-cyan-400 ml-4 flex-shrink-0">
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
                                         {completedDailyMissions.map(completed => (
                                              <div key={completed.id} className="bg-gray-900/50 border-l-4 border-green-500 rounded-r-lg p-3 flex items-center opacity-60">
                                                <CheckCircle className="h-6 w-6 text-green-500 mr-3 flex-shrink-0" />
                                                <div className="flex-grow">
                                                    <p className="text-md font-medium text-gray-400 line-through">{completed.nome}</p>
                                                </div>
                                                <div className="text-right ml-3 flex-shrink-0">
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

const SkillsView = ({ skills, profile }) => {
    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-cyan-400">Árvore de Habilidades</h1>
            </div>
            <div className="space-y-4">
                {skills.map(skill => (
                    <div key={skill.id} className={`bg-gray-800/50 border border-gray-700 rounded-lg p-4 ${skill.nivel_atual === 0 ? 'opacity-50' : ''}`}>
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-lg font-bold text-gray-200">{skill.nome}</p>
                                <p className="text-sm text-gray-400">{skill.descricao}</p>
                            </div>
                            <div className="text-center ml-4">
                                <p className="text-sm text-gray-400">Nível</p>
                                <p className="text-2xl font-bold text-cyan-400">{skill.nivel_atual} / {skill.nivel_maximo}</p>
                            </div>
                        </div>
                        {skill.pre_requisito && (<p className="text-xs text-gray-500 mt-2">Requer: {skills.find(s => s.id === skill.pre_requisito)?.nome}</p>)}
                    </div>
                ))}
            </div>
        </div>
    );
};

const RoutineView = ({ routine, setRoutine, missions }) => {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState(null);
    const [editedItem, setEditedItem] = useState({ start_time: '', end_time: '', activity: '' });
    const { toast } = useToast();
    const rankOrder = ['F', 'E', 'D', 'C', 'B', 'A', 'S', 'SS', 'SSS'];
    
    // State for AI suggestions
    const [suggestions, setSuggestions] = useState({}); // { missionId: { suggestionText, ... } }
    const [isLoadingSuggestion, setIsLoadingSuggestion] = useState(null); // missionId that is loading

    const dayNames = ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"];
    const today = new Date();
    const [selectedDay, setSelectedDay] = useState(dayNames[today.getDay()]);

    const getWeekDays = () => {
        const todayDate = new Date();
        const week = [];
        const dayOfWeek = todayDate.getDay(); 

        for (let i = 0; i < 7; i++) {
            const date = new Date(todayDate);
            date.setDate(todayDate.getDate() - dayOfWeek + i);
            week.push({
                name: dayNames[date.getDay()],
                date: date.getDate(),
                isToday: date.toDateString() === todayDate.toDateString(),
            });
        }
        return week;
    };
    const weekDays = getWeekDays();


    const handleToastError = (error, customMessage = 'Não foi possível continuar. O Sistema pode estar sobrecarregado.') => {
        console.error("Erro de IA:", error);
        if (error instanceof Error && (error.message.includes('429') || error.message.includes('Quota'))) {
             toast({ variant: 'destructive', title: 'Quota de IA Excedida', description: 'Você atingiu o limite de pedidos. Tente novamente mais tarde.' });
        } else {
             toast({ variant: 'destructive', title: 'Erro de IA', description: customMessage });
        }
    };
    
    const handleOpenDialog = (item = null) => {
        setCurrentItem(item);
        if (item) {
            setEditedItem({ start_time: item.start_time, end_time: item.end_time, activity: item.activity });
        } else {
            setEditedItem({ id: null, start_time: '', end_time: '', activity: '' });
        }
        setIsDialogOpen(true);
    };

    const handleSave = () => {
        const currentDayRoutine = routine[selectedDay] || [];
        if (currentItem) {
            // Edit
            const updatedDayRoutine = currentDayRoutine.map(item => item.id === currentItem.id ? { ...item, ...editedItem } : item);
            setRoutine(prev => ({...prev, [selectedDay]: updatedDayRoutine }));
        } else {
            // Add
            const newDayRoutine = [...currentDayRoutine, { ...editedItem, id: Date.now() }];
            setRoutine(prev => ({...prev, [selectedDay]: newDayRoutine}));
        }
        setIsDialogOpen(false);
    };

    const handleDelete = (id) => {
        const currentDayRoutine = routine[selectedDay] || [];
        const updatedDayRoutine = currentDayRoutine.filter(item => item.id !== id);
        setRoutine(prev => ({...prev, [selectedDay]: updatedDayRoutine}));
    };

    const handleGetSuggestion = async (mission) => {
        setIsLoadingSuggestion(mission.id);
        try {
            const result = await generateRoutineSuggestion({
                routine: routine[selectedDay] || [],
                dayOfWeek: selectedDay,
                missionName: mission.nome,
                missionDescription: mission.descricao,
            });
            setSuggestions(prev => ({...prev, [mission.id]: result}));
        } catch(error) {
            handleToastError(error, "Não foi possível gerar uma sugestão de horário.");
        } finally {
            setIsLoadingSuggestion(null);
        }
    };

    const handleImplementSuggestion = (mission) => {
        const suggestion = suggestions[mission.id];
        if (!suggestion) return;
    
        const newRoutineItem = {
            id: Date.now(),
            start_time: suggestion.suggestedStartTime,
            end_time: suggestion.suggestedEndTime,
            activity: `[Missão] ${mission.nome}`
        };
    
        let dayRoutine = routine[selectedDay] || [];
    
        // If the suggestion modifies an existing block, split that block
        if (suggestion.modifiedBlockId) {
            const blockToModify = dayRoutine.find(item => item.id === suggestion.modifiedBlockId);
            
            if (blockToModify) {
                const originalStart = blockToModify.start_time;
                const originalEnd = blockToModify.end_time;
                const suggestionStart = suggestion.suggestedStartTime;
                const suggestionEnd = suggestion.suggestedEndTime;
    
                // Remove the original block
                let updatedRoutine = dayRoutine.filter(item => item.id !== suggestion.modifiedBlockId);
    
                // Add the new mission block
                updatedRoutine.push(newRoutineItem);
    
                // Add the first part of the original block if there's time before the mission
                if (suggestionStart > originalStart) {
                    updatedRoutine.push({
                        ...blockToModify,
                        id: Date.now() + 1, // new id
                        end_time: suggestionStart,
                    });
                }
    
                // Add the second part of the original block if there's time after the mission
                if (suggestionEnd < originalEnd) {
                    updatedRoutine.push({
                        ...blockToModify,
                        id: Date.now() + 2, // new id
                        start_time: suggestionEnd,
                    });
                }
                setRoutine(prev => ({...prev, [selectedDay]: updatedRoutine}));
            } else {
                 // Fallback if block not found: just add the mission
                const newDayRoutine = [...dayRoutine, newRoutineItem];
                setRoutine(prev => ({...prev, [selectedDay]: newDayRoutine}));
            }
        } else {
            // If no block is modified, just add the new item
            const newDayRoutine = [...dayRoutine, newRoutineItem];
            setRoutine(prev => ({...prev, [selectedDay]: newDayRoutine}));
        }
    
        // Remove suggestion after implementing
        setSuggestions(prev => {
            const newSuggestions = {...prev};
            delete newSuggestions[mission.id];
            return newSuggestions;
        });
    };

    const handleDiscardSuggestion = (missionId) => {
         setSuggestions(prev => {
            const newSuggestions = {...prev};
            delete newSuggestions[missionId];
            return newSuggestions;
        });
    }

    const getUnscheduledMissions = () => {
        const allRoutineActivities = Object.values(routine).flat().map(r => r.activity);
        
        // 1. Find the active epic missions (same logic as MissionsView)
        const visibleEpicMissions = [];
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
                visibleEpicMissions.push(goalMissions[0]);
            }
        }

        // 2. From those active epic missions, find the active daily mission
        const activeDailyMissions = visibleEpicMissions.map(epicMission => {
            return epicMission.missoes_diarias.find(dm => !dm.concluido);
        }).filter(Boolean); // Filter out any undefined results

        // 3. Filter out missions already scheduled in the routine
        const unscheduled = activeDailyMissions.filter(dailyMission => 
            !allRoutineActivities.some(routineActivity => routineActivity.includes(dailyMission.nome))
        );

        return unscheduled;
    };

    const sortedRoutineForDay = (routine[selectedDay] || []).sort((a, b) => a.start_time.localeCompare(b.start_time));
    const unscheduledMissions = getUnscheduledMissions();

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-cyan-400">Rotina Semanal</h1>
                <Button onClick={() => handleOpenDialog()} className="bg-cyan-600 hover:bg-cyan-500">
                    <PlusCircle className="h-5 w-5 mr-2" />
                    Adicionar Atividade
                </Button>
            </div>
             <p className="text-gray-400 mb-6">Mantenha a sua rotina semanal atualizada para que o Sistema possa sugerir os melhores horários para as suas missões.</p>

            <Tabs defaultValue={selectedDay} onValueChange={setSelectedDay} className="w-full">
                <TabsList className="grid w-full grid-cols-7">
                    {weekDays.map(day => (
                       <TabsTrigger 
                            key={day.name} 
                            value={day.name} 
                            className={cn(
                                "flex-col p-2 h-auto capitalize data-[state=active]:bg-gray-700",
                                day.isToday && "bg-cyan-500/20 text-cyan-300"
                            )}
                        >
                            <span>{day.name.substring(0,3)}</span>
                            <span className="font-bold text-lg">{day.date}</span>
                        </TabsTrigger>
                    ))}
                </TabsList>
                
                {dayNames.map(day => (
                    <TabsContent key={day} value={day}>
                        {/* Unscheduled Missions Section */}
                        {unscheduledMissions.length > 0 && (
                            <div className="my-8">
                                <h2 className="text-2xl font-bold text-cyan-400 mb-4">Missões por Agendar</h2>
                                <div className="space-y-4">
                                    {unscheduledMissions.map(mission => (
                                        <div key={mission.id} className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="font-bold text-gray-200">{mission.nome}</p>
                                                    <p className="text-sm text-gray-400">{mission.descricao}</p>
                                                </div>
                                                <Button 
                                                    onClick={() => handleGetSuggestion(mission)} 
                                                    disabled={isLoadingSuggestion === mission.id}
                                                    size="sm"
                                                >
                                                    {isLoadingSuggestion === mission.id ? "A analisar..." : "Sugerir Horário"}
                                                    <BrainCircuit className="ml-2 h-4 w-4"/>
                                                </Button>
                                            </div>
                                            {suggestions[mission.id] && (
                                                <Alert className="mt-4 border-cyan-500/50">
                                                    <Sparkles className="h-4 w-4 text-cyan-400" />
                                                    <AlertTitle className="text-cyan-400">Sugestão do Sistema</AlertTitle>
                                                    <AlertDescription className="text-gray-300">
                                                        {suggestions[mission.id].suggestionText}
                                                        <div className="flex gap-2 mt-3">
                                                            <Button size="sm" onClick={() => handleImplementSuggestion(mission)}>Implementar</Button>
                                                            <Button size="sm" variant="outline" onClick={() => handleDiscardSuggestion(mission.id)}>Descartar</Button>
                                                        </div>
                                                    </AlertDescription>
                                                </Alert>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="border-t border-gray-700 pt-8">
                            <h2 className="text-2xl font-bold text-cyan-400 mb-4 capitalize">Agenda de {day}</h2>
                            <div className="space-y-3">
                                {sortedRoutineForDay.map(item => (
                                    <div key={item.id} className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 flex items-center justify-between">
                                        <div className="flex items-center">
                                            <span className="text-cyan-400 font-mono text-lg">{item.start_time} - {item.end_time}</span>
                                            <span className="mx-4 text-gray-500">|</span>
                                            <p className="text-lg text-gray-200">{item.activity}</p>
                                        </div>
                                        <div className="flex space-x-2">
                                            <Button onClick={() => handleOpenDialog(item)} variant="ghost" size="icon" className="text-gray-400 hover:text-yellow-400"><Edit className="h-5 w-5" /></Button>
                                            <Button onClick={() => handleDelete(item.id)} variant="ghost" size="icon" className="text-gray-400 hover:text-red-400"><Trash2 className="h-5 w-5" /></Button>
                                        </div>
                                    </div>
                                ))}
                                {sortedRoutineForDay.length === 0 && (
                                    <div className="text-center py-10 border-2 border-dashed border-gray-700 rounded-lg">
                                        <p className="text-gray-400">Nenhuma atividade agendada para este dia.</p>
                                        <p className="text-gray-500 text-sm">Adicione atividades para começar.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                    </TabsContent>
                ))}
            </Tabs>


            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{currentItem ? 'Editar Atividade' : 'Adicionar Atividade'}</DialogTitle>
                        <DialogDescription>
                            A atividade será adicionada à agenda de <span className="font-bold capitalize text-cyan-400">{selectedDay}</span>.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="start_time" className="text-right">Início</Label>
                            <Input id="start_time" type="time" value={editedItem.start_time} onChange={(e) => setEditedItem({...editedItem, start_time: e.target.value})} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="end_time" className="text-right">Fim</Label>
                            <Input id="end_time" type="time" value={editedItem.end_time} onChange={(e) => setEditedItem({...editedItem, end_time: e.target.value})} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="activity" className="text-right">Atividade</Label>
                            <Input id="activity" value={editedItem.activity} onChange={(e) => setEditedItem({...editedItem, activity: e.target.value})} className="col-span-3" placeholder="Ex: Trabalho, Almoço, Exercício"/>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleSave}>Salvar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};


const AIChatView = ({ profile, metas, routine, missions }) => {
    const [messages, setMessages] = useState([{ sender: 'ai', text: 'Sistema online. Qual é a sua diretiva?' }]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const { toast } = useToast();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }

    useEffect(scrollToBottom, [messages]);

    const handleSend = useCallback(async () => {
        if (!input.trim() || isLoading) return;

        const userMessage = { sender: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
          const result = await generateSystemAdvice({
            userName: profile.nome_utilizador,
            profile: JSON.stringify(profile),
            metas: JSON.stringify(metas),
            routine: JSON.stringify(routine),
            missions: JSON.stringify(missions.filter(m => !m.concluido)),
            query: input,
          });
          const aiMessage = { sender: 'ai', text: result.response };
          setMessages(prev => [...prev, aiMessage]);
        } catch (error) {
            console.error("Erro ao buscar conselho da IA:", error);
            let errorMessage = 'Não foi possível obter uma resposta. O Sistema pode estar sobrecarregado.';
            if (error instanceof Error && (error.message.includes('429') || error.message.includes('Quota'))) {
                errorMessage = 'Quota de IA excedida. Você atingiu o limite de pedidos. Tente novamente mais tarde.';
            }

            toast({
              variant: 'destructive',
              title: 'Erro de comunicação com o sistema',
              description: errorMessage,
            })
            setMessages(prev => [...prev, { sender: 'ai', text: 'Erro de comunicação. Verifique a sua conexão e tente novamente.'}])
        } finally {
          setIsLoading(false);
        }
    }, [input, isLoading, profile, metas, routine, missions, toast]);


    return (
        <div className="p-6 h-full flex flex-col">
            <h1 className="text-3xl font-bold text-cyan-400 mb-6">Interagir com o Sistema</h1>
            <div className="flex-1 bg-gray-800/50 border border-gray-700 rounded-lg p-4 overflow-y-auto space-y-4">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                        {msg.sender === 'ai' && <Bot className="h-6 w-6 text-cyan-400 flex-shrink-0" />}
                        <div className={`max-w-lg p-3 rounded-lg ${msg.sender === 'user' ? 'bg-cyan-800 text-white' : 'bg-gray-700 text-gray-300'}`}>
                            <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                        </div>
                         {msg.sender === 'user' && <User className="h-6 w-6 text-gray-400 flex-shrink-0" />}
                    </div>
                ))}
                {isLoading && ( <div className="flex items-start gap-3"><Bot className="h-6 w-6 text-cyan-400 flex-shrink-0" /><div className="max-w-lg p-3 rounded-lg bg-gray-700 text-gray-300"><div className="flex items-center space-x-2"><div className="h-2 w-2 bg-cyan-400 rounded-full animate-pulse [animation-delay:-0.3s]"></div><div className="h-2 w-2 bg-cyan-400 rounded-full animate-pulse [animation-delay:-0.15s]"></div><div className="h-2 w-2 bg-cyan-400 rounded-full animate-pulse"></div></div></div></div>)}
                <div ref={messagesEndRef} />
            </div>
            <div className="mt-4 flex items-center gap-2">
                <Input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Digite sua diretiva..."
                    className="flex-1"
                    disabled={isLoading}
                />
                <Button onClick={handleSend} disabled={isLoading} size="icon" className="bg-cyan-600 hover:bg-cyan-500 text-white p-3 rounded-md disabled:bg-gray-500">
                    <Send className="h-5 w-5" />
                </Button>
            </div>
        </div>
    );
};


export default function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  
  const [profile, setProfile] = useState(null);
  const [metas, setMetas] = useState([]);
  const [missions, setMissions] = useState([]);
  const [skills, setSkills] = useState([]);
  const [routine, setRoutine] = useState({});
  
  useEffect(() => {
    const initialProfile = mockData.perfis[0];
    const initialMetas = mockData.metas;
    const initialMissions = [...mockData.missoes];
    const initialSkills = mockData.habilidades;
    const initialRoutine = mockData.rotina;
    
    initialMetas.forEach(meta => {
        const hasMission = initialMissions.some(m => m.meta_associada === meta.nome);
        if (!hasMission) {
            console.log(`Creating mission for goal: ${meta.nome}`);
            initialMissions.push({
                id: Date.now() + Math.random(), 
                nome: `Missão Épica: ${meta.nome}`,
                descricao: `Um grande passo em direção a: ${meta.nome}.`,
                concluido: false, 
                rank: 'E', 
                level_requirement: 1,
                meta_associada: meta.nome, 
                total_missoes_diarias: 10,
                ultima_missao_concluida_em: null,
                missoes_diarias: [{
                    id: Date.now() + Math.random(),
                    nome: `Iniciar a jornada para "${meta.nome}"`,
                    descricao: `O primeiro passo é o mais importante. Complete esta missão para receber a sua primeira tarefa do Sistema.`,
                    xp_conclusao: 10, 
                    concluido: false, 
                    tipo: 'diaria',
                }]
            });
        }
    });

    setProfile(initialProfile);
    setMetas(initialMetas);
    setMissions(initialMissions);
    setSkills(initialSkills);
    setRoutine(initialRoutine);
  }, []);
  
  const NavItem = ({ icon: Icon, label, page }) => (
    <button 
      onClick={() => setCurrentPage(page)}
      className={cn(
        'w-full flex items-center space-x-3 px-4 py-3 rounded-md transition-colors',
        currentPage === page ? 'bg-cyan-500/20 text-cyan-300' : 'text-gray-400 hover:bg-gray-700/50 hover:text-white'
      )}
    >
      <Icon className="h-5 w-5" />
      <span className="font-medium">{label}</span>
    </button>
  );

  const renderContent = () => {
    if (!profile) {
      return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-cyan-400 text-xl">A carregar sistema...</div>
    }
    
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard profile={profile} />;
      case 'metas':
        return <MetasView metas={metas} setMetas={setMetas} missions={missions} setMissions={setMissions} profile={profile} />;
      case 'missions':
        return <MissionsView missions={missions} setMissions={setMissions} profile={profile} setProfile={setProfile} metas={metas} />;
      case 'skills':
        return <SkillsView skills={skills} profile={profile} />;
      case 'routine':
        return <RoutineView routine={routine} setRoutine={setRoutine} missions={missions} />;
      case 'ai-chat':
        return <AIChatView profile={profile} metas={metas} routine={routine} missions={missions} />;
      default:
        return <Dashboard profile={profile} />;
    }
  };
  
  if (!profile) {
    return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-cyan-400 text-xl">A carregar sistema...</div>
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 font-mono flex">
      <aside className="w-64 bg-gray-800/80 border-r border-gray-700/50 p-4 flex-col hidden md:flex">
        <div className="text-2xl font-bold text-cyan-400 text-center mb-8">SISTEMA</div>
        <nav className="flex-grow space-y-2">
            <NavItem icon={User} label="Dashboard" page="dashboard" />
            <NavItem icon={BookOpen} label="Metas" page="metas" />
            <NavItem icon={Target} label="Missões" page="missions" />
            <NavItem icon={Clock} label="Rotina" page="routine" />
            <NavItem icon={TreeDeciduous} label="Habilidades" page="skills" />
            <NavItem icon={Bot} label="Interagir com IA" page="ai-chat" />
        </nav>
        <div className="mt-auto">
            <NavItem icon={Settings} label="Configurações" page="settings" />
            <button 
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-md text-gray-400 hover:bg-red-500/20 hover:text-red-300 transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span className="font-medium">Terminar Sessão</span>
            </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto" style={{height: '100vh'}}>
        {renderContent()}
      </main>
    </div>
  );
}
