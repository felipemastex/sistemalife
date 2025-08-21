
"use client";

import { useState, useCallback, useEffect } from 'react';
import { PlusCircle, Edit, Trash2, X, Feather, ZapIcon, Swords, Brain, Zap, ShieldCheck, Star, BookOpen, Wand2 } from 'lucide-react';
import * as mockData from '@/lib/data';
import { generateGoalCategory } from '@/ai/flows/generate-goal-category';
import { generateSmartGoalQuestion } from '@/ai/flows/generate-smart-goal-questions';
import { generateSimpleSmartGoal } from '@/ai/flows/generate-simple-smart-goal';
import { generateInitialEpicMission } from '@/ai/flows/generate-initial-epic-mission';
import { generateSkillFromGoal } from '@/ai/flows/generate-skill-from-goal';
import { generateGoalSuggestion } from '@/ai/flows/generate-goal-suggestion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { statCategoryMapping } from '@/lib/mappings';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

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
            toast({ title: "Meta SMART Salva!", description: "A sua nova meta foi definida com sucesso." });
            onClose(); 
        } catch (error) {
             handleToastError(error, 'Não foi possível sugerir uma categoria. A salvar com categoria padrão.');
             const finalName = finalGoalDetails.name || goalState.nome;
             const newMeta = {
                id: metaToEdit ? metaToEdit.id : null,
                nome: finalName,
                categoria: 'Desenvolvimento Pessoal',
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
    
    const handleEditSave = () => {
        handleSaveGoal({name: goalState.nome, ...goalState.detalhes_smart});
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
                <div className="flex flex-col-reverse sm:flex-row justify-end pt-4 gap-2">
                     <Button variant="outline" onClick={onClose} disabled={isLoading}>Cancelar</Button>
                     <Button onClick={handleEditSave} disabled={isLoading}>
                        {isLoading ? "A Salvar..." : "Salvar Alterações"}
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
        if(isEditing){
            return renderEditingScreen();
        }
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
                    <DialogDescription>Um assistente para ajudar a criar ou editar uma meta SMART.</DialogDescription>
                 </DialogHeader>
                <div className="fixed inset-0 bg-gray-900/90 backdrop-blur-md flex flex-col items-center justify-center z-50 p-4">
                    <Button onClick={onClose} variant="ghost" size="icon" className="absolute top-4 right-4 text-gray-400 hover:text-white">
                        <X className="h-6 w-6" />
                    </Button>
                    {renderContent()}
                </div>
            </DialogContent>
        </Dialog>
    )
}

export const MetasView = ({ metas, setMetas, missions, setMissions, profile, skills, setSkills }) => {
    const [showWizardDialog, setShowWizardDialog] = useState(false);
    const [wizardMode, setWizardMode] = useState(null); // 'simple' or 'detailed' or 'selection'
    const [wizardInitialName, setWizardInitialName] = useState('');
    const [metaToEdit, setMetaToEdit] = useState(null);
    const [isLoadingSimpleGoal, setIsLoadingSimpleGoal] = useState(false);
    
    const [showSuggestionDialog, setShowSuggestionDialog] = useState(false);
    const [suggestions, setSuggestions] = useState([]);
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

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
            const completedGoals = metas.filter(m => missions.some(miss => miss.meta_associada === m.nome && miss.concluido));
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
    }
    
    const handleSelectSuggestion = (suggestionName) => {
        setShowSuggestionDialog(false);
        setWizardInitialName(suggestionName);
        setWizardMode('simple');
        setShowWizardDialog(true);
    };

    const handleOpenWizard = (meta = null) => {
        if (meta) {
            setMetaToEdit(meta);
            setWizardMode('detailed'); // Editing always opens in detailed mode
            setShowWizardDialog(true);
        } else {
            setWizardMode('selection'); // Show mode selection for new goal
            setShowWizardDialog(true);
        }
    };

    const handleCloseWizard = () => {
        setShowWizardDialog(false);
        setMetaToEdit(null);
        setWizardMode(null);
        setWizardInitialName('');
    };

    const handleSave = async (newOrUpdatedMeta) => {
        setIsLoadingSimpleGoal(true);
        const isEditing = !!(newOrUpdatedMeta.id && metas.some(m => m.id === newOrUpdatedMeta.id));
        
        try {
            if (isEditing) {
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
                
                let updatedSkills = [...skills];
                if (metaOriginal && metaOriginal.nome !== newOrUpdatedMeta.nome && newOrUpdatedMeta.habilidade_associada_id) {
                     updatedSkills = skills.map(s => 
                        s.id === newOrUpdatedMeta.habilidade_associada_id 
                        ? {...s, nome: `Maestria em ${newOrUpdatedMeta.nome}`} 
                        : s
                    );
                }

                setMissions(updatedMissions);
                setSkills(updatedSkills);
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
                        pre_requisito: null,
                        nivel_minimo_para_desbloqueio: null,
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
                
                const newMetaWithId = { ...newOrUpdatedMeta, id: Date.now(), user_id: profile.id, habilidade_associada_id: newSkillId };
                
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
                            concluido: false,
                            tipo: 'diaria',
                        }] : [],
                    };
                });
                
                setSkills(currentSkills => [...currentSkills, newSkill]);
                setMetas([...metas, newMetaWithId]);
                setMissions([...missions, ...newMissions]);
            }
        } catch (error) {
            handleToastError(error, 'Não foi possível salvar a meta, gerar a habilidade ou a árvore de progressão.');
        } finally {
            setIsLoadingSimpleGoal(false);
            handleCloseWizard();
        }
    };
    
    const handleCreateSimpleGoal = async (goalName) => {
        if (!goalName.trim()) return;
        setIsLoadingSimpleGoal(true);
        try {
            const { refinedGoal, fallback } = await generateSimpleSmartGoal({ goalName });
            
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


    const handleDelete = (id) => {
        const metaToDelete = metas.find(m => m.id === id);
        if (metaToDelete) {
            setMissions(missions.filter(mission => mission.meta_associada !== metaToDelete.nome));
            setMetas(metas.filter(m => m.id !== id));
            // A habilidade não é removida aqui de propósito, como solicitado.
        }
    };

    const isSkillDeletable = (skillId) => {
        const associatedMeta = metas.find(m => m.habilidade_associada_id === skillId);
        if (!associatedMeta) {
            return true; // No associated goal, can be deleted
        }
        // A goal is active if any of its missions are not completed
        const isGoalActive = missions.some(miss => miss.meta_associada === associatedMeta.nome && !miss.concluido);
        return !isGoalActive; // Can be deleted if goal is not active
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
                        <div className="py-4">
                            <Input
                                placeholder="Ex: Aprender a investir na bolsa"
                                value={wizardInitialName}
                                onChange={(e) => setWizardInitialName(e.target.value)}
                                disabled={isLoadingSimpleGoal}
                                onKeyPress={(e) => e.key === 'Enter' && handleCreateSimpleGoal(wizardInitialName)}
                            />
                        </div>
                        <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-end gap-2">
                            <Button variant="outline" onClick={handleCloseWizard} disabled={isLoadingSimpleGoal}>Cancelar</Button>
                            <Button onClick={() => handleCreateSimpleGoal(wizardInitialName)} disabled={isLoadingSimpleGoal || !wizardInitialName.trim()}>
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
                        metaToEdit={metaToEdit}
                        profile={profile}
                        initialGoalName={wizardInitialName}
                    />
                );
            default:
                return null;
        }
    };


    return (
        <div className="p-4 md:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h1 className="text-3xl font-bold text-cyan-400">Metas</h1>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                     <Button onClick={handleGetSuggestions} variant="outline" className="text-cyan-400 border-cyan-400/50 hover:bg-cyan-400/10 hover:text-cyan-300 w-full sm:w-auto">
                        <Wand2 className="h-5 w-5 mr-2" />
                        Sugerir Novas Metas
                    </Button>
                    <Button onClick={() => handleOpenWizard()} className="bg-cyan-600 hover:bg-cyan-500 w-full sm:w-auto">
                        <PlusCircle className="h-5 w-5 mr-2" />
                        Adicionar Meta
                    </Button>
                </div>
            </div>
            <p className="text-gray-400 mb-6">Estas são as suas metas de longo prazo. Para cada meta, uma árvore de progressão de missões épicas será criada.</p>
            <Accordion type="multiple" className="space-y-4">
                {metas.map(meta => {
                    const skill = skills.find(s => s.id === meta.habilidade_associada_id);
                    const stats = skill ? statCategoryMapping[skill.categoria] : [];
                    const deletable = isSkillDeletable(meta.id);
                    
                    return (
                    <AccordionItem value={`meta-${meta.id}`} key={meta.id} className="bg-gray-800/50 border border-gray-700 rounded-lg">
                       <div className="flex items-center w-full">
                           <AccordionTrigger className="flex-1 hover:no-underline text-left p-4">
                                <div className="flex-1 min-w-0">
                                    <p className="text-lg text-gray-200 break-words">{meta.nome}</p>
                                    <span className="text-sm text-gray-400 bg-gray-700 px-2 py-1 rounded mt-1 inline-block">{meta.categoria}</span>
                                </div>
                           </AccordionTrigger>
                           <div className={cn("flex items-center gap-2 p-4 flex-col sm:flex-row")}>
                                <Button onClick={() => handleOpenWizard(meta)} variant="ghost" size="icon" className="text-gray-400 hover:text-yellow-400"><Edit className="h-5 w-5" /></Button>
                                 <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                             <span tabIndex={deletable ? -1 : 0}>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="text-gray-400 hover:text-red-400" disabled={!deletable}>
                                                            <Trash2 className="h-5 w-5" />
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
                                             </span>
                                        </TooltipTrigger>
                                        {!deletable && (
                                            <TooltipContent>
                                                <p>Esta meta não pode ser excluída porque tem missões ativas.</p>
                                            </TooltipContent>
                                        )}
                                    </Tooltip>
                                 </TooltipProvider>
                           </div>
                       </div>
                        <AccordionContent className="p-4 pt-0">
                           <div className="space-y-3 text-sm text-gray-300 border-t border-gray-700 pt-3">
                                <p className="break-words"><strong className="text-cyan-400">Específico:</strong> {meta.detalhes_smart.specific}</p>
                                <p className="break-words"><strong className="text-cyan-400">Mensurável:</strong> {meta.detalhes_smart.measurable}</p>
                                <p className="break-words"><strong className="text-cyan-400">Atingível:</strong> {meta.detalhes_smart.achievable}</p>
                                <p className="break-words"><strong className="text-cyan-400">Relevante:</strong> {meta.detalhes_smart.relevant}</p>
                                <p className="break-words"><strong className="text-cyan-400">Prazo:</strong> {meta.detalhes_smart.timeBound}</p>
                                {stats && stats.length > 0 && (
                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-2">
                                        <strong className="text-cyan-400 shrink-0">Atributos Melhorados:</strong>
                                        <div className="flex flex-wrap items-center gap-3">
                                        {stats.map(stat => (
                                            <div key={stat} className="flex items-center gap-1 text-gray-300">
                                                {statIcons[stat]}
                                                <span className="capitalize text-xs">{stat}</span>
                                            </div>
                                        ))}
                                        </div>
                                    </div>
                                )}
                           </div>
                        </AccordionContent>
                    </AccordionItem>
                )})}
            </Accordion>
            
            {showWizardDialog && (
                <Dialog open={showWizardDialog} onOpenChange={handleCloseWizard}>
                    {renderWizardContent()}
                </Dialog>
            )}
            
            <Dialog open={showSuggestionDialog} onOpenChange={setShowSuggestionDialog}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-cyan-400 text-xl">
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
                            <div key={index} className="p-4 border border-gray-700 rounded-lg hover:bg-gray-800/50 transition-colors">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                                    <div className="flex-grow">
                                        <h3 className="font-bold text-gray-200">{s.name}</h3>
                                        <p className="text-sm text-gray-400 mt-1">{s.description}</p>
                                        <span className="text-xs text-purple-400 bg-purple-900/50 px-2 py-1 rounded-full mt-2 inline-block">{s.category}</span>
                                    </div>
                                    <Button size="sm" className="ml-0 sm:ml-4 flex-shrink-0" onClick={() => handleSelectSuggestion(s.name)}>
                                        Iniciar
                                    </Button>
                                </div>
                            </div>
                        ))}
                         {!isLoadingSuggestions && suggestions.length === 0 && (
                            <p className="text-center text-gray-400 py-8">Não foi possível gerar sugestões neste momento.</p>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

        </div>
    );
};

    