
"use client";

import { useState, useCallback, useEffect, memo } from 'react';
import { PlusCircle, Edit, Trash2, X, Feather, ZapIcon, Swords, Brain, Zap, ShieldCheck, Star, BookOpen, Wand2, Calendar as CalendarIcon, CheckCircle, Info, Map as MapIcon, LoaderCircle, Milestone } from 'lucide-react';
import { format } from "date-fns";
import * as mockData from '@/lib/data';
import { generateGoalCategory } from '@/ai/flows/generate-goal-category';
import { generateSmartGoalQuestion } from '@/ai/flows/generate-smart-goal-questions';
import { generateSimpleSmartGoal } from '@/ai/flows/generate-simple-smart-goal';
import { generateInitialEpicMission } from '@/ai/flows/generate-initial-epic-mission';
import { generateSkillFromGoal } from '@/ai/flows/generate-skill-from-goal';
import { generateGoalSuggestion } from '@/ai/flows/generate-goal-suggestion';
import { generateGoalRoadmap } from '@/ai/flows/generate-goal-roadmap';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { statCategoryMapping } from '@/lib/mappings';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';


const statIcons = {
    forca: <Swords className="h-4 w-4 text-red-400" />,
    inteligencia: <Brain className="h-4 w-4 text-blue-400" />,
    destreza: <Zap className="h-4 w-4 text-yellow-400" />,
    constituicao: <ShieldCheck className="h-4 w-4 text-green-400" />,
    sabedoria: <BookOpen className="h-4 w-4 text-purple-400" />,
    carisma: <Star className="h-4 w-4 text-pink-400" />,
};

const SmartGoalWizard = ({ onClose, onSave, metaToEdit, profile, initialGoalName = '' }) => {
    const isEditing = !!metaToEdit;

    const getInitialGoalState = useCallback(() => {
        if (isEditing && metaToEdit) {
             return {
                id: metaToEdit.id || null,
                nome: metaToEdit.nome || '',
                categoria: metaToEdit.categoria || '',
                prazo: metaToEdit.prazo || null,
                concluida: metaToEdit.concluida || false,
                detalhes_smart: {
                    specific: metaToEdit.detalhes_smart?.specific || '',
                    measurable: metaToEdit.detalhes_smart?.measurable || '',
                    achievable: metaToEdit.detalhes_smart?.achievable || '',
                    relevant: metaToEdit.detalhes_smart?.relevant || '',
                    timeBound: metaToEdit.detalhes_smart?.timeBound || '',
                },
                habilidade_associada_id: metaToEdit.habilidade_associada_id,
            };
        }
        return {
            id: null,
            nome: initialGoalName,
            categoria: '',
            prazo: null,
            concluida: false,
            detalhes_smart: {
                specific: '',
                measurable: '',
                achievable: '',
                relevant: '',
                timeBound: '',
            }
        };
    }, [isEditing, metaToEdit, initialGoalName]);
    
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
        } else if (initialGoalName) {
            handleInitialQuestion(initialGoalName);
        } else {
            setCurrentQuestion('');
        }
    }, [metaToEdit, isEditing, getInitialGoalState, initialGoalName]);

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
        setGoalState(prev => ({...prev, detalhes_smart: {
            ...prev.detalhes_smart,
            specific: updatedGoal.specific,
            measurable: updatedGoal.measurable,
            achievable: updatedGoal.achievable,
            relevant: updatedGoal.relevant,
            timeBound: updatedGoal.timeBound,
        }}));

        try {
            const result = await generateSmartGoalQuestion({ goal: { name: goalState.nome, ...updatedGoal }, history: newHistory });

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
                id: metaToEdit ? metaToEdit.id : null, // Let the parent handle ID generation for new goals
                nome: finalName,
                categoria: categoryResult.category || 'Desenvolvimento Pessoal',
                prazo: goalState.prazo,
                concluida: false,
                detalhes_smart: {
                    specific: finalGoalDetails.specific,
                    measurable: finalGoalDetails.measurable,
                    achievable: finalGoalDetails.achievable,
                    relevant: finalGoalDetails.relevant,
                    timeBound: finalGoalDetails.timeBound,
                },
                 habilidade_associada_id: metaToEdit?.habilidade_associada_id
            };
            onSave(newMeta);
            onClose(); 
        } catch (error) {
             handleToastError(error, 'Não foi possível sugerir uma categoria. A salvar com categoria padrão.');
             const finalName = finalGoalDetails.name || goalState.nome;
             const newMeta = {
                id: metaToEdit ? metaToEdit.id : null,
                nome: finalName,
                categoria: 'Desenvolvimento Pessoal',
                prazo: goalState.prazo,
                concluida: false,
                detalhes_smart: finalGoalDetails,
                habilidade_associada_id: metaToEdit?.habilidade_associada_id,
                user_id: profile.id,
             };
             onSave(newMeta);
             onClose();
        } finally {
            setIsLoading(false);
        }
    }
    
    const renderInitialScreen = () => (
        <div className="text-center animate-in fade-in-50 duration-500">
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
                        
                        {!isEditing && (
                             <div className="mb-4 text-left">
                                <Label htmlFor="prazo" className="text-primary">Prazo (Opcional)</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                        variant={"outline"}
                                        className={cn(
                                            "w-full justify-start text-left font-normal bg-card/80 mt-1",
                                            !goalState.prazo && "text-muted-foreground"
                                        )}
                                        >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {goalState.prazo ? format(new Date(goalState.prazo), "PPP") : <span>Escolha uma data</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar
                                        mode="single"
                                        selected={goalState.prazo ? new Date(goalState.prazo) : null}
                                        onSelect={(date) => setGoalState(prev => ({...prev, prazo: date ? date.toISOString().split('T')[0] : null}))}
                                        initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                        )}

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
                        
                        <div className="flex flex-col-reverse sm:flex-row justify-end items-center gap-4 mt-6">
                            <Button variant="outline" onClick={onClose} disabled={isLoading}>Cancelar</Button>
                            <Button onClick={handleNextStep} className="w-full sm:w-auto" disabled={isLoading || !userInput.trim()}>
                                Próximo Passo
                            </Button>
                        </div>
                    </>
                )}
            </div>
         </div>
    );
    
    const renderContent = () => {
        if(!goalState.nome){
            return renderInitialScreen();
        }
        return renderQuestionScreen();
    }


    return (
        <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="bg-transparent border-none shadow-none max-w-none w-auto flex items-center justify-center p-0">
                <DialogHeader className="sr-only">
                    <DialogTitle>Assistente de Metas</DialogTitle>
                </DialogHeader>
                <div className="fixed inset-0 bg-gray-900/90 backdrop-blur-md flex flex-col items-center justify-center z-50 p-4">
                    <Button onClick={onClose} variant="ghost" size="icon" className="absolute top-4 right-4 text-gray-400 hover:text-white" aria-label="Fechar assistente de metas">
                        <X className="h-6 w-6" />
                    </Button>
                    {renderContent()}
                </div>
            </DialogContent>
        </Dialog>
    )
}

const MetasViewComponent = ({ metas, setMetas, missions, setMissions, profile, skills, setSkills }) => {
    const [showWizardDialog, setShowWizardDialog] = useState(false);
    const [wizardMode, setWizardMode] = useState(null); // 'simple' or 'detailed' or 'selection'
    const [quickGoalData, setQuickGoalData] = useState({ name: '', prazo: null });
    
    const [isEditing, setIsEditing] = useState(false);
    const [metaToEdit, setMetaToEdit] = useState(null);
    const [detailedMeta, setDetailedMeta] = useState(null);

    const [isLoadingSimpleGoal, setIsLoadingSimpleGoal] = useState(false);
    
    const [showSuggestionDialog, setShowSuggestionDialog] = useState(false);
    const [suggestions, setSuggestions] = useState([]);
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
    
    const [roadmap, setRoadmap] = useState(null);
    const [isLoadingRoadmap, setIsLoadingRoadmap] = useState(false);
    const [roadmapMeta, setRoadmapMeta] = useState(null);

    const { toast } = useToast();

    const handleToastError = (error, customMessage = 'Não foi possível continuar. O Sistema pode estar sobrecarregado.') => {
        console.error("Erro de IA:", error);
        if (error instanceof Error && (error.message.includes('429') || error.message.includes('Quota'))) {
             toast({ variant: 'destructive', title: 'Quota de IA Excedida', description: 'Você atingiu o limite de pedidos. Tente novamente mais tarde.' });
        } else {
             toast({ variant: 'destructive', title: 'Erro de IA', description: customMessage });
        }
    };
    
    const handleGetSuggestions = async () => {
        setShowSuggestionDialog(true);
        setIsLoadingSuggestions(true);
        setSuggestions([]);

        try {
            const completedGoals = metas.filter(m => m.concluida);
            const result = await generateGoalSuggestion({
                profile: JSON.stringify(profile),
                skills: JSON.stringify(skills),
                completedGoals: JSON.stringify(completedGoals.map(m => m.nome)),
                existingCategories: mockData.categoriasMetas,
            });
            setSuggestions(result.suggestions);
        } catch(error) {
            handleToastError(error, "Não foi possível gerar sugestões de metas.");
            setShowSuggestionDialog(false);
        } finally {
            setIsLoadingSuggestions(false);
        }
    };
    
    const handleGetRoadmap = async (meta) => {
        setRoadmapMeta(meta);
        setIsLoadingRoadmap(true);
        setRoadmap(null);
        try {
            const result = await generateGoalRoadmap({
                goalName: meta.nome,
                goalDetails: Object.values(meta.detalhes_smart).join(' '),
                userLevel: profile.nivel,
            });
            setRoadmap(result.roadmap);
        } catch(error) {
            handleToastError(error, "Não foi possível gerar a estratégia.");
            setRoadmapMeta(null);
        } finally {
            setIsLoadingRoadmap(false);
        }
    };
    
    const handleSelectSuggestion = (suggestionName) => {
        setShowSuggestionDialog(false);
        setQuickGoalData({ name: suggestionName, prazo: null });
        setWizardMode('simple');
        setShowWizardDialog(true);
    };

    const handleOpenWizard = () => {
        setWizardMode('selection');
        setShowWizardDialog(true);
    };

    const handleCloseWizard = () => {
        setShowWizardDialog(false);
        setWizardMode(null);
        setQuickGoalData({ name: '', prazo: null });
    };
    
    const handleOpenEditDialog = (meta) => {
        setMetaToEdit({ ...meta });
        setIsEditing(true);
    };
    
    const handleCloseEditDialog = () => {
        setIsEditing(false);
        setMetaToEdit(null);
    };
    
    const handleSaveEditedGoal = () => {
        if (!metaToEdit) return;
        handleSave(metaToEdit);
        handleCloseEditDialog();
    };


    const handleSave = async (newOrUpdatedMeta) => {
        setIsLoadingSimpleGoal(true);
        const isEditingGoal = !!(newOrUpdatedMeta.id && metas.some(m => m.id === newOrUpdatedMeta.id));
        
        try {
            if (isEditingGoal) {
                // --- UPDATE LOGIC ---
                const metaOriginal = metas.find(m => m.id === newOrUpdatedMeta.id);
                const updatedMetas = metas.map(m => m.id === newOrUpdatedMeta.id ? { ...m, ...newOrUpdatedMeta } : m);
                
                let updatedMissions = [...missions];
                if (metaOriginal && metaOriginal.nome !== newOrUpdatedMeta.nome) {
                    updatedMissions = missions.map(mission => 
                        mission.meta_associada === metaOriginal.nome 
                        ? { ...mission, meta_associada: newOrUpdatedMeta.nome }
                        : mission
                    );
                }
                
                if (metaOriginal && metaOriginal.nome !== newOrUpdatedMeta.nome && newOrUpdatedMeta.habilidade_associada_id) {
                     const newSkills = skills.map(s => 
                        s.id === newOrUpdatedMeta.habilidade_associada_id 
                        ? {...s, nome: `Maestria em ${newOrUpdatedMeta.nome}`} 
                        : s
                    );
                    setSkills(newSkills);
                }

                setMissions(updatedMissions);
                setMetas(updatedMetas);
                toast({ title: "Meta Atualizada!", description: "A sua meta foi atualizada com sucesso." });

            } else {
                // --- CREATE LOGIC ---
                let newSkillId = Date.now();
                let newSkill;
                const goalDescription = Object.values(newOrUpdatedMeta.detalhes_smart).join(' ');
                
                try {
                    const skillResult = await generateSkillFromGoal({
                        goalName: newOrUpdatedMeta.nome,
                        goalDescription: goalDescription,
                        existingCategories: mockData.categoriasMetas
                    });

                    newSkill = {
                        id: newSkillId,
                        nome: skillResult.skillName,
                        descricao: skillResult.skillDescription,
                        categoria: skillResult.skillCategory,
                        nivel_atual: 1,
                        nivel_maximo: 10,
                        xp_atual: 0,
                        xp_para_proximo_nivel: 50,
                    };
                } catch (skillError) {
                    handleToastError(skillError, 'Não foi possível gerar uma habilidade. A usar uma habilidade padrão.');
                    newSkill = {
                        id: newSkillId,
                        nome: `Maestria em ${newOrUpdatedMeta.nome}`,
                        descricao: `Habilidade relacionada ao objetivo: ${newOrUpdatedMeta.nome}`,
                        categoria: newOrUpdatedMeta.categoria || 'Crescimento Pessoal',
                        nivel_atual: 1,
                        nivel_maximo: 10,
                        xp_atual: 0,
                        xp_para_proximo_nivel: 50,
                    };
                }
                
                const newMetaWithId = { ...newOrUpdatedMeta, id: Date.now(), concluida: false, user_id: profile.id, habilidade_associada_id: newSkillId };
                
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
                }
                
                const newMissions = (result.progression || []).map((epicMission, index) => {
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
                            id: Date.now() + (result.progression?.length || 0) + 2,
                            nome: result.firstDailyMissionName,
                            descricao: result.firstDailyMissionDescription,
                            xp_conclusao: result.firstDailyMissionXp,
                            fragmentos_conclusao: result.firstDailyMissionFragments,
                            concluido: false,
                            tipo: 'diaria',
                            learningResources: result.firstDailyMissionLearningResources,
                            subTasks: result.firstDailyMissionSubTasks,
                        }] : [],
                    };
                });
                
                setSkills(currentSkills => [...currentSkills, newSkill]);
                setMetas([...metas, newMetaWithId]);
                setMissions([...missions, ...newMissions]);
                
                // Show roadmap after creation
                handleGetRoadmap(newMetaWithId);
            }
        } catch (error) {
            handleToastError(error, 'Não foi possível salvar a meta, gerar a habilidade ou a árvore de progressão.');
        } finally {
            setIsLoadingSimpleGoal(false);
            handleCloseWizard();
        }
    };
    
    const handleCreateSimpleGoal = async () => {
        if (!quickGoalData.name.trim()) return;
        setIsLoadingSimpleGoal(true);
        try {
            const { refinedGoal, fallback } = await generateSimpleSmartGoal({ goalName: quickGoalData.name });
            
            if (fallback) {
                 toast({
                    variant: 'destructive',
                    title: 'Sistema Sobrecarregado',
                    description: 'Uma meta genérica foi criada. Por favor, edite-a para adicionar os detalhes SMART.',
                });
            }

            await handleSave({
                id: null,
                nome: refinedGoal.name,
                categoria: 'Desenvolvimento Pessoal', // Default category
                prazo: quickGoalData.prazo,
                concluida: false,
                detalhes_smart: refinedGoal,
                user_id: profile.id
            });
        } catch (error) {
            handleToastError(error, 'Não foi possível criar a meta com a IA. Tente novamente.');
        } finally {
            setIsLoadingSimpleGoal(false);
            handleCloseWizard();
        }
    };


    const handleDelete = async (id) => {
        const metaToDelete = metas.find(m => m.id === id);
        if (metaToDelete) {
            setMissions(missions.filter(mission => mission.meta_associada !== metaToDelete.nome));
            setMetas(metas.filter(m => m.id !== id));
            if (metaToDelete.habilidade_associada_id) {
                setSkills(skills.filter(s => s.id !== metaToDelete.habilidade_associada_id));
            }
            toast({ title: "Meta Eliminada", description: `A meta "${metaToDelete.nome}" e seus componentes foram removidos.` });
        }
    };

    const renderWizardContent = () => {
        switch (wizardMode) {
            case 'selection':
                return (
                     <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Escolha o modo de criação da meta</DialogTitle>
                            <DialogDescription>
                                Como você prefere definir a sua próxima grande meta?
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                           <button onClick={() => setWizardMode('simple')} className="p-4 border border-gray-700 rounded-lg hover:bg-gray-800 transition-colors flex flex-col items-center text-center">
                               <Feather className="h-10 w-10 text-cyan-400 mb-2"/>
                               <h3 className="font-bold text-gray-200">Modo Rápido</h3>
                               <p className="text-sm text-gray-400">Apenas dê um nome à sua meta. A IA fará o resto.</p>
                           </button>
                           <button onClick={() => setWizardMode('detailed')} className="p-4 border border-gray-700 rounded-lg hover:bg-gray-800 transition-colors flex flex-col items-center text-center">
                               <ZapIcon className="h-10 w-10 text-purple-400 mb-2"/>
                               <h3 className="font-bold text-gray-200">Modo Detalhado</h3>
                               <p className="text-sm text-gray-400">Seja guiado pela IA para criar uma meta SMART completa.</p>
                           </button>
                        </div>
                    </DialogContent>
                );
            case 'simple':
                 return (
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Modo Rápido: Nova Meta</DialogTitle>
                            <DialogDescription>
                                Digite o nome da sua meta. O Sistema irá transformá-la num objetivo SMART para si.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-4 space-y-4">
                             <div>
                                <Label htmlFor="goal-name">Nome da Meta</Label>
                                <Input
                                    id="goal-name"
                                    placeholder="Ex: Aprender a investir na bolsa"
                                    value={quickGoalData.name}
                                    onChange={(e) => setQuickGoalData(prev => ({...prev, name: e.target.value}))}
                                    disabled={isLoadingSimpleGoal}
                                    onKeyPress={(e) => e.key === 'Enter' && handleCreateSimpleGoal()}
                                />
                             </div>
                             <div>
                                <Label htmlFor="prazo" className="text-primary">Prazo (Opcional)</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                        variant={"outline"}
                                        className={cn(
                                            "w-full justify-start text-left font-normal mt-1",
                                            !quickGoalData.prazo && "text-muted-foreground"
                                        )}
                                        >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {quickGoalData.prazo ? format(new Date(quickGoalData.prazo), "PPP") : <span>Escolha uma data</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar
                                        mode="single"
                                        selected={quickGoalData.prazo ? new Date(quickGoalData.prazo) : null}
                                        onSelect={(date) => setQuickGoalData(prev => ({...prev, prazo: date ? date.toISOString().split('T')[0] : null}))}
                                        initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>
                        <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-end gap-2">
                            <Button variant="outline" onClick={handleCloseWizard} disabled={isLoadingSimpleGoal}>Cancelar</Button>
                            <Button onClick={handleCreateSimpleGoal} disabled={isLoadingSimpleGoal || !quickGoalData.name.trim()}>
                                {isLoadingSimpleGoal ? "A criar..." : "Criar Meta"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                 );
            case 'detailed':
                return (
                    <SmartGoalWizard
                        onClose={handleCloseWizard}
                        onSave={handleSave}
                        metaToEdit={null}
                        profile={profile}
                        initialGoalName={quickGoalData.name}
                    />
                );
            default:
                return null;
        }
    };

    const sortedMetas = [...metas].sort((a, b) => (a.concluida ? 1 : -1) - (b.concluida ? 1 : -1) || a.nome.localeCompare(b.nome));

    return (
        <div className="p-4 md:p-6 h-full overflow-y-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h1 className="text-3xl font-bold text-primary font-cinzel tracking-wider">Metas</h1>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                     <Button onClick={handleGetSuggestions} variant="outline" className="text-cyan-400 border-cyan-400/50 hover:bg-cyan-400/10 hover:text-cyan-300 w-full sm:w-auto">
                        <Wand2 className="h-5 w-5 mr-2" />
                        Sugerir Novas Metas
                    </Button>
                    <Button onClick={() => handleOpenWizard()} className="bg-primary hover:bg-primary/90 w-full sm:w-auto">
                        <PlusCircle className="h-5 w-5 mr-2" />
                        Adicionar Meta
                    </Button>
                </div>
            </div>
            <p className="text-muted-foreground mb-8 max-w-4xl">Estas são as suas metas de longo prazo. Para cada meta, uma árvore de progressão de missões épicas será criada.</p>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {sortedMetas.map(meta => {
                    const skill = skills.find(s => s.id === meta.habilidade_associada_id);
                    const stats = skill ? statCategoryMapping[skill.categoria] : [];
                    const relatedMissions = missions.filter(m => m.meta_associada === meta.nome);
                    const completedMissionsCount = relatedMissions.filter(m => m.concluido).length;
                    const totalMissionsCount = relatedMissions.length;
                    const progress = totalMissionsCount > 0 ? (completedMissionsCount / totalMissionsCount) * 100 : (meta.concluida ? 100 : 0);
                    
                    return (
                        <Card key={meta.id} className={cn("bg-card/60 border-border/80 flex flex-col", meta.concluida && "bg-card/30 border-green-500/20")}>
                            <CardHeader>
                                <div className="flex justify-between items-start gap-4">
                                    <div className="flex-1">
                                         <CardTitle className="text-lg text-foreground flex items-center gap-2">
                                            {meta.concluida && <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />}
                                            <span className={cn(meta.concluida && "line-through text-muted-foreground")}>{meta.nome}</span>
                                        </CardTitle>
                                        <CardDescription className="mt-1">
                                            <Badge variant={meta.concluida ? "secondary" : "default"} className={cn(!meta.concluida && "bg-primary/20 text-primary")}>
                                                {meta.categoria}
                                            </Badge>
                                        </CardDescription>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Button onClick={() => handleOpenEditDialog(meta)} variant="ghost" size="icon" className="text-muted-foreground hover:text-yellow-400 h-8 w-8" aria-label={`Editar meta ${meta.nome}`}><Edit className="h-4 w-4" /></Button>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-red-400 h-8 w-8" aria-label={`Excluir meta ${meta.nome}`}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Tem a certeza?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        Esta ação não pode ser desfeita. Isto irá apagar permanentemente a sua meta e toda a sua árvore de progressão de missões. A habilidade adquirida não será removida.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDelete(meta.id)}>Continuar</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-grow space-y-4">
                                 <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger className="w-full">
                                            <Progress value={progress} className="h-3" />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>{completedMissionsCount} de {totalMissionsCount} missões épicas concluídas</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                                {meta.prazo && (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <CalendarIcon className="h-4 w-4" />
                                        <span>Prazo: {format(new Date(meta.prazo), "dd/MM/yyyy")}</span>
                                    </div>
                                )}
                            </CardContent>
                             <CardFooter className="flex-col items-start gap-4">
                                <div className="flex flex-wrap gap-2 w-full">
                                    <Button variant="outline" size="sm" onClick={() => setDetailedMeta(meta)} className="flex-1">
                                        Detalhes
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => handleGetRoadmap(meta)} className="flex-1">
                                        Estratégia
                                    </Button>
                                </div>
                                 {stats && stats.length > 0 && (
                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 w-full pt-4 border-t border-border">
                                        <strong className="text-sm text-muted-foreground shrink-0">Atributos:</strong>
                                        <div className="flex flex-wrap items-center gap-3">
                                        {stats.map(stat => (
                                            <div key={stat} className="flex items-center gap-1.5 text-card-foreground">
                                                {statIcons[stat]}
                                                <span className="capitalize text-xs">{stat}</span>
                                            </div>
                                        ))}
                                        </div>
                                    </div>
                                )}
                            </CardFooter>
                        </Card>
                    )})}
            </div>
            
            {showWizardDialog && (
                <Dialog open={showWizardDialog} onOpenChange={handleCloseWizard}>
                    {renderWizardContent()}
                </Dialog>
            )}

            {isEditing && metaToEdit && (
                 <Dialog open={isEditing} onOpenChange={handleCloseEditDialog}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Editar Meta: {metaToEdit.nome}</DialogTitle>
                            <DialogDescription>
                                Refine os detalhes da sua meta SMART.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                            <div>
                                <Label htmlFor="prazo" className="text-primary">Prazo (Opcional)</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                        variant={"outline"}
                                        className={cn(
                                            "w-full justify-start text-left font-normal",
                                            !metaToEdit.prazo && "text-muted-foreground"
                                        )}
                                        >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {metaToEdit.prazo ? format(new Date(metaToEdit.prazo), "PPP") : <span>Escolha uma data</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar
                                        mode="single"
                                        selected={metaToEdit.prazo ? new Date(metaToEdit.prazo) : null}
                                        onSelect={(date) => setMetaToEdit(prev => ({...prev, prazo: date ? date.toISOString().split('T')[0] : null}))}
                                        initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                            <div>
                                <Label htmlFor="specific" className="text-primary">Específico</Label>
                                <Textarea id="specific" value={metaToEdit.detalhes_smart.specific} onChange={(e) => setMetaToEdit(prev => ({...prev, detalhes_smart: {...prev.detalhes_smart, specific: e.target.value}}))} className="min-h-[80px]" />
                            </div>
                             <div>
                                <Label htmlFor="measurable" className="text-primary">Mensurável</Label>
                                <Textarea id="measurable" value={metaToEdit.detalhes_smart.measurable} onChange={(e) => setMetaToEdit(prev => ({...prev, detalhes_smart: {...prev.detalhes_smart, measurable: e.target.value}}))} className="min-h-[80px]" />
                            </div>
                             <div>
                                <Label htmlFor="achievable" className="text-primary">Atingível</Label>
                                <Textarea id="achievable" value={metaToEdit.detalhes_smart.achievable} onChange={(e) => setMetaToEdit(prev => ({...prev, detalhes_smart: {...prev.detalhes_smart, achievable: e.target.value}}))} className="min-h-[80px]" />
                            </div>
                             <div>
                                <Label htmlFor="relevant" className="text-primary">Relevante</Label>
                                <Textarea id="relevant" value={metaToEdit.detalhes_smart.relevant} onChange={(e) => setMetaToEdit(prev => ({...prev, detalhes_smart: {...prev.detalhes_smart, relevant: e.target.value}}))} className="min-h-[80px]" />
                            </div>
                             <div>
                                <Label htmlFor="timeBound" className="text-primary">Temporal</Label>
                                <Textarea id="timeBound" value={metaToEdit.detalhes_smart.timeBound} onChange={(e) => setMetaToEdit(prev => ({...prev, detalhes_smart: {...prev.detalhes_smart, timeBound: e.target.value}}))} className="min-h-[80px]" />
                            </div>
                        </div>
                         <DialogFooter>
                            <Button variant="outline" onClick={handleCloseEditDialog}>Cancelar</Button>
                            <Button onClick={handleSaveEditedGoal}>Salvar Alterações</Button>
                        </DialogFooter>
                    </DialogContent>
                 </Dialog>
            )}

            {detailedMeta && (
                <Dialog open={!!detailedMeta} onOpenChange={() => setDetailedMeta(null)}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>{detailedMeta.nome}</DialogTitle>
                            <DialogDescription>
                                Detalhes SMART da sua meta.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                             <p className="break-words"><strong className="text-primary">Específico:</strong> {detailedMeta.detalhes_smart.specific}</p>
                            <p className="break-words"><strong className="text-primary">Mensurável:</strong> {detailedMeta.detalhes_smart.measurable}</p>
                            <p className="break-words"><strong className="text-primary">Atingível:</strong> {detailedMeta.detalhes_smart.achievable}</p>
                            <p className="break-words"><strong className="text-primary">Relevante:</strong> {detailedMeta.detalhes_smart.relevant}</p>
                            <p className="break-words"><strong className="text-primary">Temporal:</strong> {detailedMeta.detalhes_smart.timeBound}</p>
                        </div>
                         <DialogFooter>
                            <Button variant="outline" onClick={() => setDetailedMeta(null)}>Fechar</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
            
            <Dialog open={showSuggestionDialog} onOpenChange={setShowSuggestionDialog}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-primary text-xl">
                            <Wand2/>
                            Sugestões do Sistema
                        </DialogTitle>
                        <DialogDescription>
                            Com base no seu perfil, o Sistema acredita que estes seriam os próximos passos ideais na sua jornada.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                        {isLoadingSuggestions && (
                            <div className="space-y-3">
                                <Skeleton className="h-20 w-full" />
                                <Skeleton className="h-20 w-full" />
                                <Skeleton className="h-20 w-full" />
                            </div>
                        )}
                        {suggestions.map((s, index) => (
                            <div key={index} className="p-4 border border-border rounded-lg hover:bg-secondary/50 transition-colors">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                                    <div className="flex-grow">
                                        <h3 className="font-bold text-foreground">{s.name}</h3>
                                        <p className="text-sm text-muted-foreground mt-1">{s.description}</p>
                                        <span className="text-xs text-primary bg-primary/20 px-2 py-1 rounded-full mt-2 inline-block">{s.category}</span>
                                    </div>
                                    <Button size="sm" className="ml-0 sm:ml-4 flex-shrink-0" onClick={() => handleSelectSuggestion(s.name)}>
                                        Iniciar
                                    </Button>
                                </div>
                            </div>
                        ))}
                         {!isLoadingSuggestions && suggestions.length === 0 && (
                            <p className="text-center text-muted-foreground py-8">Não foi possível gerar sugestões neste momento.</p>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
            
            <Dialog open={!!roadmapMeta} onOpenChange={() => setRoadmapMeta(null)}>
                <DialogContent className="max-w-3xl">
                     <DialogHeader>
                        <DialogTitle className="text-2xl font-cinzel text-primary flex items-center gap-3">
                            <MapIcon />
                            Roteiro Estratégico
                        </DialogTitle>
                        <DialogDescription>
                            O plano de batalha do Estratega Mestre para a sua meta: <span className="font-bold text-foreground">{roadmapMeta?.nome}</span>
                        </DialogDescription>
                    </DialogHeader>
                     <ScrollArea className="max-h-[60vh] mt-4 pr-4">
                        {isLoadingRoadmap && (
                             <div className="flex items-center justify-center p-16">
                                <LoaderCircle className="h-10 w-10 text-primary animate-spin" />
                            </div>
                        )}
                        {roadmap && (
                             <div className="relative pl-6 py-4">
                                <div className="absolute left-[18px] top-0 bottom-0 w-0.5 bg-border/30 -z-10" />
                                {roadmap.map((phase, index) => (
                                    <div key={index} className="relative mb-8">
                                         <div className="absolute -left-1 top-1 h-8 w-8 rounded-full bg-secondary border-4 border-background flex items-center justify-center">
                                            <span className="font-bold text-primary">{index + 1}</span>
                                        </div>
                                        <div className="pl-12">
                                            <Card className="bg-card/80 backdrop-blur-sm">
                                                <CardHeader>
                                                    <CardTitle className="font-cinzel text-accent">{phase.phaseTitle}</CardTitle>
                                                    <CardDescription>{phase.phaseDescription}</CardDescription>
                                                </CardHeader>
                                                <CardContent>
                                                    <ul className="space-y-3">
                                                        {phase.strategicMilestones.map((milestone, mIndex) => (
                                                             <li key={mIndex} className="flex items-start gap-3">
                                                                <Milestone className="h-5 w-5 text-accent/80 mt-1 flex-shrink-0" />
                                                                <span className="text-foreground">{milestone}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </CardContent>
                                            </Card>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                     <DialogFooter className="mt-4">
                        <Button variant="outline" onClick={() => setRoadmapMeta(null)}>Fechar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    );
};

export const MetasView = memo(MetasViewComponent);

    