
"use client";

import { useState, useCallback, useEffect } from 'react';
import { PlusCircle, Edit, Trash2, X, Feather, ZapIcon } from 'lucide-react';
import * as mockData from '@/lib/data';
import { generateGoalCategory } from '@/ai/flows/generate-goal-category';
import { generateSmartGoalQuestion } from '@/ai/flows/generate-smart-goal-questions';
import { generateSimpleSmartGoal } from '@/ai/flows/generate-simple-smart-goal';
import { generateInitialEpicMission } from '@/ai/flows/generate-initial-epic-mission';
import { generateSkillFromGoal } from '@/ai/flows/generate-skill-from-goal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';

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
                },
                habilidade_associada_id: metaToEdit.habilidade_associada_id,
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
                habilidade_associada_id: metaToEdit?.habilidade_associada_id
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

export const MetasView = ({ metas, setMetas, missions, setMissions, profile, skills, setSkills }) => {
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
                     // Also update skill name if it's tied to the goal name
                    const associatedSkill = skills.find(s => s.id === newOrUpdatedMeta.habilidade_associada_id);
                    if (associatedSkill) {
                        setSkills(prevSkills => prevSkills.map(s => s.id === associatedSkill.id ? {...s, nome: `Maestria em ${newOrUpdatedMeta.nome}`} : s));
                    }
                }
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
                
                setSkills(prev => [...prev, newSkill]);
                setMetas(prev => [...prev, newMetaWithId]);
                setMissions(prev => [...prev, ...newMissions]);
            }
        } catch (error) {
            handleToastError(error, 'Não foi possível salvar a meta, gerar a habilidade ou a árvore de progressão.');
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
            setMissions(currentMissions => currentMissions.filter(mission => mission.meta_associada !== metaToDelete.nome));
            setMetas(currentMetas => currentMetas.filter(m => m.id !== id));
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
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="icon" className="text-gray-400 hover:text-red-400"><Trash2 className="h-5 w-5" /></Button>
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
