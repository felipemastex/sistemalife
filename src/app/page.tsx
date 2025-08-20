
"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { Bot, User, BookOpen, Target, TreeDeciduous, Settings, LogOut, Swords, Brain, Zap, ShieldCheck, Star, PlusCircle, Edit, Trash2, Send, CheckCircle, Circle, Sparkles, Clock, Timer, History, MessageSquareQuote, X, ZapIcon, Feather, GitMerge, MoreVertical, LifeBuoy } from 'lucide-react';
import * as mockData from '@/lib/data';
import { generateSystemAdvice } from '@/ai/flows/generate-personalized-advice';
import { generateMotivationalMessage } from '@/ai/flows/generate-motivational-messages';
import { generateNextDailyMission } from '@/ai/flows/generate-daily-mission';
import { generateGoalCategory } from '@/ai/flows/generate-goal-category';
import { generateSmartGoalQuestion, GenerateSmartGoalQuestionInput } from '@/ai/flows/generate-smart-goal-questions';
import { generateSimpleSmartGoal } from '@/ai/flows/generate-simple-smart-goal';
import { generateInitialEpicMission } from '@/ai/flows/generate-initial-epic-mission';
import { generateMissionSuggestion } from '@/ai/flows/generate-mission-suggestion';
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


// --- COMPONENTES ---

const Dashboard = ({ profile }) => {
  const [aiAdvice, setAiAdvice] = useState('A analisar dados...');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getInitialMessage = async () => {
      if (!profile) return;
      setLoading(true);
      try {
        const result = await generateMotivationalMessage({
          userName: profile.nome_utilizador,
          profileData: JSON.stringify(profile)
        });
        setAiAdvice(result.message);
      } catch (e) {
        console.error("Erro ao buscar mensagem motivacional:", e);
        setAiAdvice("Erro: Não foi possível comunicar com o Sistema.");
      } finally {
        setLoading(false);
      }
    };
    getInitialMessage();
  }, [profile]);

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
      <div className="bg-gray-800/50 border border-cyan-500/30 rounded-lg p-4 flex items-start space-x-4">
        <Bot className="h-8 w-8 text-cyan-400 flex-shrink-0 mt-1" />
        <div>
            <h3 className="font-bold text-cyan-400">Mensagem do Sistema</h3>
             {loading ? <p className="text-gray-300 text-sm">A analisar dados...</p> : <p className="text-gray-300 text-sm">{aiAdvice}</p>}
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
    const [currentQuestion, setCurrentQuestion] = useState('');
    const [exampleAnswers, setExampleAnswers] = useState([]);
    const [userInput, setUserInput] = useState('');
    const [goalState, setGoalState] = useState(metaToEdit ? {name: metaToEdit.nome, ...metaToEdit.detalhes_smart} : { name: '' });
    const [isLoading, setIsLoading] = useState(false);
    const [history, setHistory] = useState([]);
    const { toast } = useToast();

    const handleInitialQuestion = useCallback(async (goalName) => {
        setIsLoading(true);
        const initialGoal = metaToEdit ? goalState : { name: goalName };
        if (!metaToEdit) {
            setGoalState(initialGoal);
        }
        
        try {
            const result = await generateSmartGoalQuestion({ goal: initialGoal, history: [] });
            if (result.nextQuestion) {
                setCurrentQuestion(result.nextQuestion);
                setExampleAnswers(result.exampleAnswers || []);
            } else if (result.isComplete && result.refinedGoal) {
                await handleSaveGoal(result.refinedGoal);
            }
        } catch (error) {
            console.error("Erro ao gerar a primeira pergunta:", error);
            toast({ variant: 'destructive', title: 'Erro de IA', description: 'Não foi possível iniciar o assistente. O Sistema pode estar sobrecarregado.' });
            onClose();
        } finally {
            setIsLoading(false);
        }
    },[goalState, metaToEdit, onClose, toast]);

    useEffect(() => {
      if (goalState.name && !currentQuestion) {
        handleInitialQuestion(goalState.name)
      }
    }, [goalState.name, currentQuestion, handleInitialQuestion]);

    const handleNextStep = async () => {
        if (!userInput.trim() || isLoading) return;

        const lastQuestion = currentQuestion;
        const newHistory = [...history, { question: lastQuestion, answer: userInput }];
        setHistory(newHistory);
        setIsLoading(true);
        setExampleAnswers([]);
        
        let updatedGoal = { ...goalState };
        // This is a bit naive, a better approach would be to know which field we are asking about
        if (!updatedGoal.specific) updatedGoal.specific = userInput;
        else if (!updatedGoal.measurable) updatedGoal.measurable = userInput;
        else if (!updatedGoal.achievable) updatedGoal.achievable = userInput;
        else if (!updatedGoal.relevant) updatedGoal.relevant = userInput;
        else if (!updatedGoal.timeBound) updatedGoal.timeBound = userInput;
        
        setUserInput(''); 
        setGoalState(updatedGoal);

        try {
            const result = await generateSmartGoalQuestion({ goal: updatedGoal, history: newHistory });

            if (result.isComplete && result.refinedGoal) {
                await handleSaveGoal(result.refinedGoal);
            } else if (result.nextQuestion) {
                setCurrentQuestion(result.nextQuestion);
                setExampleAnswers(result.exampleAnswers || []);
            }
        } catch (error) {
            console.error("Erro ao gerar próxima pergunta:", error);
            toast({ variant: 'destructive', title: 'Erro de IA', description: 'Não foi possível continuar. Tente novamente mais tarde.' });
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleSaveGoal = async (finalGoal) => {
        setIsLoading(true);
        try {
            const categoryResult = await generateGoalCategory({
                goalName: finalGoal.name,
                categories: mockData.categoriasMetas,
            });
            const newMeta = {
                id: metaToEdit ? metaToEdit.id : Date.now(),
                nome: finalGoal.name,
                categoria: categoryResult.category || 'Desenvolvimento Pessoal',
                detalhes_smart: {
                    specific: finalGoal.specific,
                    measurable: finalGoal.measurable,
                    achievable: finalGoal.achievable,
                    relevant: finalGoal.relevant,
                    timeBound: finalGoal.timeBound,
                }
            };
            onSave(newMeta);
            toast({ title: "Meta SMART Salva!", description: "A sua nova meta foi definida com sucesso." });
            onClose(); 
        } catch (error) {
             console.error("Erro ao sugerir categoria:", error);
             toast({ variant: 'destructive', title: 'Erro de IA', description: 'Não foi possível sugerir uma categoria. A salvar com categoria padrão.' });
             const newMeta = {
                id: metaToEdit ? metaToEdit.id : Date.now(),
                nome: finalGoal.name,
                categoria: 'Desenvolvimento Pessoal',
                detalhes_smart: { ...finalGoal }
             };
             onSave(newMeta);
             onClose();
        } finally {
            setIsLoading(false);
        }
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
    
    const renderQuestionScreen = () => (
         <div className="w-full max-w-4xl animate-in fade-in-50 duration-500">
            <p className="text-center text-gray-400 mb-4">Meta: <span className="font-bold text-gray-200">{goalState.name}</span></p>
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

    return (
         <div className="fixed inset-0 bg-gray-900/90 backdrop-blur-md flex flex-col items-center justify-center z-50 p-4">
            <Button onClick={onClose} variant="ghost" size="icon" className="absolute top-4 right-4 text-gray-400 hover:text-white">
                <X className="h-6 w-6" />
            </Button>
            {!goalState.name ? renderInitialScreen() : renderQuestionScreen()}
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

    const handleOpenWizard = (meta = null) => {
        setMetaToEdit(meta);
        if (meta) {
            // Directly open the detailed wizard for editing
            startDetailedMode(meta);
        } else {
            // Show mode selection for creating a new goal
            setShowModeSelection(true);
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
        // This function handles both create and update
        setIsLoadingSimpleGoal(true);
        
        try {
            if (metaToEdit) {
                // --- UPDATE LOGIC ---
                // Replace the existing meta with the updated version
                const updatedMetas = metas.map(m => m.id === newOrUpdatedMeta.id ? { ...m, ...newOrUpdatedMeta } : m);
                setMetas(updatedMetas);
                
                // If the goal name changed, we need to update the associated mission link
                if (metaToEdit.nome !== newOrUpdatedMeta.nome) {
                    setMissions(prev => prev.map(mission => 
                        mission.meta_associada === metaToEdit.nome 
                        ? { ...mission, meta_associada: newOrUpdatedMeta.nome }
                        : mission
                    ));
                }
                toast({ title: "Meta Atualizada!", description: "A sua meta foi atualizada com sucesso." });

            } else {
                // --- CREATE LOGIC ---
                // Assign a new ID
                const newMetaWithId = { ...newOrUpdatedMeta, id: Date.now(), user_id: profile.id };
                
                // Find related history from already completed goals
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

                const newRankedMission = {
                    id: Date.now() + 1, 
                    nome: result.epicMissionName,
                    descricao: result.epicMissionDescription,
                    concluido: false, 
                    rank: result.rank, 
                    level_requirement: 1, // Level requirement can be adjusted later
                    meta_associada: newMetaWithId.nome, 
                    total_missoes_diarias: 10, // Default value, can be dynamic
                    ultima_missao_concluida_em: null,
                    missoes_diarias: [{
                        id: Date.now() + 2,
                        nome: result.firstDailyMissionName,
                        descricao: result.firstDailyMissionDescription,
                        xp_conclusao: result.firstDailyMissionXp, 
                        concluido: false, 
                        tipo: 'diaria',
                    }]
                };
                
                // Add new meta and new mission to state
                setMetas(prev => [...prev, newMetaWithId]);
                setMissions(prev => [...prev, newRankedMission]);

            }
        } catch (error) {
            console.error("Erro ao salvar meta ou gerar missão épica:", error);
            toast({ variant: 'destructive', title: 'Erro de IA', description: 'Não foi possível salvar a meta ou gerar a missão épica. O Sistema pode estar sobrecarregado.' });
        } finally {
            setIsLoadingSimpleGoal(false);
            handleCloseWizard();
        }
    };

    const handleCreateSimpleGoal = async () => {
        if (!simpleGoalName.trim()) return;
        setIsLoadingSimpleGoal(true);
        try {
            // 1. Generate SMART details from a simple name
            const smartResult = await generateSimpleSmartGoal({ goalName: simpleGoalName });
            
            // 2. Generate a category for the new goal
            const categoryResult = await generateGoalCategory({
                goalName: smartResult.refinedGoal.name,
                categories: mockData.categoriasMetas,
            });

            // 3. Call the main save function with the newly generated data
            await handleSave({
                nome: smartResult.refinedGoal.name,
                categoria: categoryResult.category || 'Desenvolvimento Pessoal',
                detalhes_smart: smartResult.refinedGoal
            });
        } catch (error) {
            console.error("Erro ao criar meta simples:", error);
            toast({ variant: 'destructive', title: 'Erro de IA', description: 'Não foi possível criar a meta. O Sistema pode estar sobrecarregado. Tente novamente.' });
        } finally {
            setIsLoadingSimpleGoal(false);
            handleCloseWizard();
        }
    };


    const handleDelete = (id) => {
        const metaToDelete = metas.find(m => m.id === id);
        if (metaToDelete) {
            // Also delete the associated epic mission
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
            <p className="text-gray-400 mb-6">Estas são as suas metas de longo prazo. Para cada meta, uma missão épica será criada.</p>
            <Accordion type="multiple" className="space-y-4">
                {metas.map(meta => (
                    <AccordionItem value={`meta-${meta.id}`} key={meta.id} className="bg-gray-800/50 border border-gray-700 rounded-lg">
                       <div className="flex items-center w-full p-4">
                            <AccordionTrigger className="flex-1 hover:no-underline text-left">
                                <div>
                                    <p className="text-lg text-gray-200">{meta.nome}</p>
                                    <span className="text-sm text-gray-400 bg-gray-700 px-2 py-1 rounded">{meta.categoria}</span>
                                </div>
                            </AccordionTrigger>
                            <div className="flex space-x-2 pl-4">
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


const MissionsView = ({ missions, setMissions, profile, setProfile, metas }) => {
    const [generating, setGenerating] = useState(null);
    const [timers, setTimers] = useState({});
    const [showProgressionTree, setShowProgressionTree] = useState(false);
    const [selectedGoalMissions, setSelectedGoalMissions] = useState([]);
    const [missionFeedback, setMissionFeedback] = useState({});
    const [hackerMode, setHackerMode] = useState(false);
    const { toast } = useToast();
    const rankOrder = ['F', 'E', 'D', 'C', 'B', 'A', 'S', 'SS', 'SSS'];

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
        
        toast({ title: "Nível Aumentado!", description: `Você alcançou o Nível ${newLevel}!` });

        return {
            ...currentProfile,
            nivel: newLevel,
            xp: newXp,
            xp_para_proximo_nivel: newXpToNextLevel,
        };
    };
    
    const handleMissionFeedback = async (missionName, missionDescription, feedbackType) => {
        try {
            const result = await generateMissionSuggestion({
                missionName,
                missionDescription,
                feedbackType,
            });

            toast({
                title: "Feedback do Sistema",
                description: result.suggestion,
            });

            if (feedbackType === 'too_hard' || feedbackType === 'too_easy') {
                const feedbackValue = feedbackType === 'too_hard' ? 'muito difícil' : 'muito fácil';
                // We find the ranked mission this daily mission belongs to, and store the feedback.
                const rankedMission = missions.find(rm => rm.missoes_diarias.some(dm => dm.nome === missionName));
                if (rankedMission) {
                    setMissionFeedback(prev => ({...prev, [rankedMission.id]: feedbackValue }));
                }
            }
        } catch (error) {
            console.error("Erro ao processar feedback da missão:", error);
            toast({
                variant: "destructive",
                title: "Erro de Comunicação",
                description: "Não foi possível enviar o seu feedback ao Sistema. Pode estar sobrecarregado.",
            });
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

        setProfile(currentProfile => {
            let updatedProfile = { ...currentProfile, xp: currentProfile.xp + xpGained };
            while (updatedProfile.xp >= updatedProfile.xp_para_proximo_nivel) {
                updatedProfile = handleLevelUp(updatedProfile);
            }
            return updatedProfile;
        });
        
        if (isRankedMissionComplete) {
            toast({ title: "Missão Épica Concluída!", description: `Você conquistou "${rankedMission.nome}"!` });
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

            // Clear feedback after using it
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
            };
            
            setMissions(currentMissions => currentMissions.map(rm => {
                if (rm.id === rankedMissionId) {
                     return { ...rm, missoes_diarias: [...rm.missoes_diarias, newDailyMission] };
                }
                return rm;
            }));


        } catch (error) {
            console.error("Erro ao gerar nova missão diária:", error);
            toast({
                variant: "destructive",
                title: "Erro do Sistema",
                description: "Não foi possível gerar a próxima missão diária. O servidor pode estar sobrecarregado.",
            });
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
                             <div className="flex items-center w-full px-4 py-3">
                                <AccordionTrigger className="flex-1 hover:no-underline text-left">
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
                                <div className="flex items-center space-x-2 pl-4">
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
                                     <div className={`bg-gray-900/50 border-l-4 border-yellow-500 rounded-r-lg p-4 flex items-center`}>
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
                                                    <DropdownMenuItem onClick={() => handleMissionFeedback(activeDailyMission.nome, activeDailyMission.descricao, 'hint')}>
                                                        Preciso de uma dica
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleMissionFeedback(activeDailyMission.nome, activeDailyMission.descricao, 'too_hard')}>
                                                        Está muito difícil
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleMissionFeedback(activeDailyMission.nome, activeDailyMission.descricao, 'too_easy')}>
                                                        Está muito fácil
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
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

const AIChatView = ({ profile, metas }) => {
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
            query: input,
          });
          const aiMessage = { sender: 'ai', text: result.response };
          setMessages(prev => [...prev, aiMessage]);
        } catch (error) {
            console.error("Erro ao buscar conselho da IA:", error);
            toast({
              variant: 'destructive',
              title: 'Erro de comunicação com o sistema',
              description: 'Não foi possível obter uma resposta. O Sistema pode estar sobrecarregado.',
            })
            setMessages(prev => [...prev, { sender: 'ai', text: 'Erro de comunicação. Verifique a sua conexão e tente novamente.'}])
        } finally {
          setIsLoading(false);
        }
    }, [input, isLoading, profile, metas, toast]);


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
  
  useEffect(() => {
    const initialProfile = mockData.perfis[0];
    const initialMetas = mockData.metas;
    const initialMissions = [...mockData.missoes];
    const initialSkills = mockData.habilidades;
    
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
      case 'ai-chat':
        return <AIChatView profile={profile} metas={metas} />;
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

    