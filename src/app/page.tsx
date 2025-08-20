"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { Bot, User, BookOpen, Target, TreeDeciduous, Settings, LogOut, Swords, Brain, Zap, ShieldCheck, Star, PlusCircle, Edit, Trash2, Send, CheckCircle, Circle, Sparkles, Clock, Timer, History, MessageSquareQuote } from 'lucide-react';
import * as mockData from '@/lib/data';
import { generateSystemAdvice } from '@/ai/flows/generate-personalized-advice';
import { generateMotivationalMessage } from '@/ai/flows/generate-motivational-messages';
import { generateNextDailyMission } from '@/ai/flows/generate-daily-mission';
import { generateGoalCategory } from '@/ai/flows/generate-goal-category';
import { generateSmartGoalQuestion } from '@/ai/flows/generate-smart-goal-questions';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';


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

  if (!profile) return <div className="text-center p-8 text-cyan-400">A carregar perfil...</div>;

  const xpPercentage = (profile.xp / profile.xp_para_proximo_nivel) * 100;
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
            <div>
                <h2 className="text-2xl font-bold text-cyan-400">{profile.nome_utilizador}</h2>
                <p className="text-gray-400">Nível {profile.nivel}</p>
            </div>
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
    const [conversation, setConversation] = useState([]);
    const [userInput, setUserInput] = useState('');
    const [goalState, setGoalState] = useState(metaToEdit ? {name: metaToEdit.nome, ...metaToEdit.detalhes_smart} : { name: '' });
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    const conversationEndRef = useRef(null);

    const scrollToBottom = () => {
        conversationEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }

    useEffect(scrollToBottom, [conversation]);

    useEffect(() => {
        if (metaToEdit) {
            setConversation([{ sender: 'ai', text: `Vamos editar a sua meta: "${metaToEdit.nome}". O que você gostaria de alterar primeiro?` }]);
        } else {
             setConversation([{ sender: 'ai', text: 'Olá! Estou aqui para o ajudar a definir uma meta poderosa usando o método SMART. Qual é a meta que você tem em mente?' }]);
        }
    }, [metaToEdit]);

    const askNextQuestion = useCallback(async (currentGoal, history = []) => {
        setIsLoading(true);
        try {
            const result = await generateSmartGoalQuestion({ goal: currentGoal, history });

            if (result.isComplete && result.refinedGoal) {
                setConversation(prev => [...prev, { sender: 'ai', text: "Excelente! A sua meta SMART está definida. Aqui está o resumo final. Pode salvar agora." }]);
                setGoalState(result.refinedGoal);
            } else if (result.nextQuestion) {
                 setConversation(prev => [...prev, { sender: 'ai', text: result.nextQuestion }]);
            }
        } catch (error) {
            console.error("Erro ao gerar pergunta SMART:", error);
            toast({ variant: 'destructive', title: 'Erro de IA', description: 'Não foi possível gerar a próxima pergunta.' });
            setConversation(prev => [...prev, { sender: 'ai', text: "Ocorreu um erro. Vamos tentar novamente. Qual é a sua meta?"}])
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    const handleSend = async () => {
        if (!userInput.trim() || isLoading) return;

        const newUserMessage = { sender: 'user', text: userInput };
        const newConversation = [...conversation, newUserMessage];
        setConversation(newConversation);
        setUserInput('');
        setIsLoading(true);

        let updatedGoal = { ...goalState };
        let history = conversation.filter(m => m.sender === 'user').map((m, i) => ({
            question: conversation.filter(msg => msg.sender === 'ai')[i]?.text,
            answer: m.text
        }));

        if (!goalState.name) {
            updatedGoal.name = userInput;
        } else {
            const lastQuestion = conversation.filter(m => m.sender === 'ai').slice(-1)[0]?.text.toLowerCase();
            if (lastQuestion) {
                 if (lastQuestion.includes('especificamente')) updatedGoal.specific = userInput;
                 else if (lastQuestion.includes('medirá') || lastQuestion.includes('indicadores')) updatedGoal.measurable = userInput;
                 else if (lastQuestion.includes('atingir') || lastQuestion.includes('passos')) updatedGoal.achievable = userInput;
                 else if (lastQuestion.includes('importante') || lastQuestion.includes('relevante')) updatedGoal.relevant = userInput;
                 else if (lastQuestion.includes('prazo') || lastQuestion.includes('quando')) updatedGoal.timeBound = userInput;
            }
        }
        
        setGoalState(updatedGoal);
        await askNextQuestion(updatedGoal, history);
    };

    const handleSaveGoal = async () => {
        if (!goalState.name || !goalState.specific || !goalState.measurable || !goalState.achievable || !goalState.relevant || !goalState.timeBound) {
            toast({ variant: 'destructive', title: 'Meta Incompleta', description: 'Por favor, complete a definição da meta SMART antes de salvar.' });
            return;
        }

        // Sugerir categoria antes de salvar
        setIsLoading(true);
        try {
            const categoryResult = await generateGoalCategory({
                goalName: goalState.name,
                categories: mockData.categoriasMetas,
            });
            const newMeta = {
                id: metaToEdit ? metaToEdit.id : Date.now(),
                nome: goalState.name,
                categoria: categoryResult.category || 'Desenvolvimento Pessoal',
                detalhes_smart: {
                    specific: goalState.specific,
                    measurable: goalState.measurable,
                    achievable: goalState.achievable,
                    relevant: goalState.relevant,
                    timeBound: goalState.timeBound,
                }
            };
            onSave(newMeta);
            onClose();
        } catch (error) {
             console.error("Erro ao sugerir categoria:", error);
             toast({ variant: 'destructive', title: 'Erro de IA', description: 'Não foi possível sugerir uma categoria. Salvando com categoria padrão.' });
             const newMeta = {
                id: metaToEdit ? metaToEdit.id : Date.now(),
                nome: goalState.name,
                categoria: 'Desenvolvimento Pessoal',
                detalhes_smart: { ...goalState }
             };
             onSave(newMeta);
             onClose();
        } finally {
            setIsLoading(false);
        }
    }

    return (
         <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 border border-cyan-500 rounded-lg w-full max-w-2xl h-[90vh] flex flex-col">
                <h2 className="text-xl font-bold text-cyan-400 p-4 border-b border-gray-700">{metaToEdit ? 'Editar Meta SMART' : 'Assistente de Metas SMART'}</h2>

                <div className="flex-1 p-4 overflow-y-auto space-y-4">
                    {conversation.map((msg, index) => (
                        <div key={index} className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                            {msg.sender === 'ai' && <Bot className="h-6 w-6 text-cyan-400 flex-shrink-0" />}
                            <div className={`max-w-lg p-3 rounded-lg ${msg.sender === 'user' ? 'bg-cyan-800 text-white' : 'bg-gray-700 text-gray-300'}`}>
                                <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                            </div>
                            {msg.sender === 'user' && <User className="h-6 w-6 text-gray-400 flex-shrink-0" />}
                        </div>
                    ))}
                    {isLoading && ( <div className="flex items-start gap-3"><Bot className="h-6 w-6 text-cyan-400 flex-shrink-0" /><div className="max-w-lg p-3 rounded-lg bg-gray-700 text-gray-300"><div className="flex items-center space-x-2"><div className="h-2 w-2 bg-cyan-400 rounded-full animate-pulse [animation-delay:-0.3s]"></div><div className="h-2 w-2 bg-cyan-400 rounded-full animate-pulse [animation-delay:-0.15s]"></div><div className="h-2 w-2 bg-cyan-400 rounded-full animate-pulse"></div></div></div></div>)}
                    <div ref={conversationEndRef} />
                </div>

                <div className="p-4 border-t border-gray-700 flex items-center gap-2">
                    <Input
                        type="text"
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Digite a sua resposta..."
                        className="flex-1"
                        disabled={isLoading || goalState.isComplete}
                    />
                    <Button onClick={handleSend} disabled={isLoading || goalState.isComplete} size="icon">
                        <Send className="h-5 w-5" />
                    </Button>
                </div>
                 <div className="p-4 border-t border-gray-700 flex justify-end space-x-2">
                    <Button onClick={onClose} variant="secondary">Cancelar</Button>
                    <Button onClick={handleSaveGoal} className="bg-cyan-600 hover:bg-cyan-500" disabled={isLoading}>
                        Salvar Meta
                    </Button>
                </div>
            </div>
        </div>
    )
}


const MetasView = ({ metas, setMetas, setMissions }) => {
    const [showWizard, setShowWizard] = useState(false);
    const [metaToEdit, setMetaToEdit] = useState(null);

    const handleOpenWizard = (meta = null) => {
        setMetaToEdit(meta);
        setShowWizard(true);
    };

    const handleCloseWizard = () => {
        setShowWizard(false);
        setMetaToEdit(null);
    };

    const handleSave = (newOrUpdatedMeta) => {
        if (metaToEdit) {
            // Edição
            setMetas(metas.map(m => m.id === newOrUpdatedMeta.id ? { ...newOrUpdatedMeta, user_id: m.user_id } : m));
             // Atualizar a missão épica associada
            setMissions(prev => prev.map(mission => 
                mission.meta_associada === metaToEdit.nome 
                ? { ...mission, nome: `Missão Épica: ${newOrUpdatedMeta.nome}`, meta_associada: newOrUpdatedMeta.nome }
                : mission
            ));
        } else {
            // Criação
            const newMetaWithId = { ...newOrUpdatedMeta, id: Date.now(), user_id: 'a1b2c3d4-e5f6-7890-1234-567890abcdef' };
            setMetas(prev => [...prev, newMetaWithId]);

            // Criar missão épica associada
            const newRankedMission = {
                id: Date.now() + 1, // Evitar colisão de id
                nome: `Missão Épica: ${newMetaWithId.nome}`,
                descricao: `Um grande passo em direção a: ${newMetaWithId.nome}. Detalhes: ${newMetaWithId.detalhes_smart.specific}`,
                concluido: false,
                rank: 'E', // Rank inicial
                level_requirement: 1,
                meta_associada: newMetaWithId.nome,
                total_missoes_diarias: 10, // Default
                ultima_missao_concluida_em: null,
                missoes_diarias: [{
                    id: Date.now() + 2,
                    nome: `Iniciar a jornada para "${newMetaWithId.nome}"`,
                    descricao: `O primeiro passo é o mais importante. Complete esta missão para receber a sua primeira tarefa do Sistema.`,
                    xp_conclusao: 10,
                    concluido: false,
                    tipo: 'diaria',
                }]
            };
            setMissions(prev => [...prev, newRankedMission]);
        }
        handleCloseWizard();
    };

    const handleDelete = (id) => {
        const metaToDelete = metas.find(m => m.id === id);
        if (metaToDelete) {
            setMissions(prev => prev.filter(mission => mission.meta_associada !== metaToDelete.nome));
            setMetas(metas.filter(m => m.id !== id));
        }
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
            <p className="text-gray-400 mb-6">Estas são as suas metas de longo prazo, definidas com o método SMART. Para cada meta, uma missão épica será criada.</p>
            <Accordion type="multiple" className="space-y-4">
                {metas.map(meta => (
                    <AccordionItem value={`meta-${meta.id}`} key={meta.id} className="bg-gray-800/50 border border-gray-700 rounded-lg">
                        <AccordionTrigger className="hover:no-underline p-4">
                            <div className="flex items-center justify-between w-full">
                                <div>
                                    <p className="text-lg text-gray-200">{meta.nome}</p>
                                    <span className="text-sm text-gray-400 bg-gray-700 px-2 py-1 rounded">{meta.categoria}</span>
                                </div>
                                <div className="flex space-x-2">
                                    <Button onClick={(e) => {e.stopPropagation(); handleOpenWizard(meta)}} variant="ghost" size="icon" className="text-gray-400 hover:text-yellow-400"><Edit className="h-5 w-5" /></Button>
                                    <Button onClick={(e) => {e.stopPropagation(); handleDelete(meta.id)}} variant="ghost" size="icon" className="text-gray-400 hover:text-red-400"><Trash2 className="h-5 w-5" /></Button>
                                </div>
                            </div>
                        </AccordionTrigger>
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
        </div>
    );
};


const MissionsView = ({ missions, setMissions, profile, setProfile, metas }) => {
    const [generating, setGenerating] = useState(null);
    const [timers, setTimers] = useState({});
    const { toast } = useToast();

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
                        // Limpa o temporizador se o tempo acabou
                        if(timers[mission.id]){
                            setMissions(currentMissions => currentMissions.map(m => m.id === mission.id ? {...m, ultima_missao_concluida_em: null} : m));
                        }
                    }
                }
            });
            setTimers(newTimers);
        }, 1000);

        return () => clearInterval(interval);
    }, [missions, setMissions, timers]);


    const handleLevelUp = (currentProfile) => {
        const newLevel = currentProfile.nivel + 1;
        const newXp = currentProfile.xp - currentProfile.xp_para_proximo_nivel;
        const newXpToNextLevel = Math.floor(currentProfile.xp_para_proximo_nivel * 1.5);
        toast({ title: "Nível Aumentado!", description: `Você alcançou o Nível ${newLevel}!` });
        return {
            ...currentProfile,
            nivel: newLevel,
            xp: newXp,
            xp_para_proximo_nivel: newXpToNextLevel,
        };
    };

    const completeDailyMission = async (rankedMissionId, dailyMissionId) => {
        const now = new Date();
        const rankedMission = missions.find(m => m.id === rankedMissionId);
        
        if (rankedMission?.ultima_missao_concluida_em) {
            const completionDate = new Date(rankedMission.ultima_missao_concluida_em);
            const midnight = new Date(completionDate);
            midnight.setDate(midnight.getDate() + 1);
            midnight.setHours(0, 0, 0, 0);
            if(now < midnight) {
                 toast({
                    variant: "destructive",
                    title: "Aguarde o Cooldown!",
                    description: "A próxima missão estará disponível quando o temporizador zerar.",
                });
                return;
            }
        }


        setGenerating(dailyMissionId);
        let xpGained = 0;

        const updatedMissions = missions.map(rm => {
            if (rm.id === rankedMissionId) {
                const updatedDailyMissions = rm.missoes_diarias.map(daily => {
                    if (daily.id === dailyMissionId) {
                        xpGained = daily.xp_conclusao;
                        return { ...daily, concluido: true };
                    }
                    return daily;
                });
                 return { ...rm, missoes_diarias: updatedDailyMissions, ultima_missao_concluida_em: now.toISOString() };
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
        
        try {
            const completedDailyMission = rankedMission.missoes_diarias.find(d => d.id === dailyMissionId);
            const history = rankedMission.missoes_diarias
                .filter(d => d.concluido)
                .map(d => `- ${d.nome}`)
                .join('\n');

            const meta = metas.find(m => m.nome.includes(rankedMission.meta_associada))

            const result = await generateNextDailyMission({
                rankedMissionName: rankedMission.nome,
                metaName: meta?.nome || "Objetivo geral",
                history: history || `O utilizador acabou de completar: "${completedDailyMission.nome}".`,
                userLevel: profile.nivel,
            });

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
                description: "Não foi possível gerar a próxima missão diária.",
            });
        } finally {
            setGenerating(null);
        }
    };

    const getRankColor = (rank) => {
        switch (rank) {
            case 'F': return 'bg-gray-600 text-gray-200';
            case 'E': return 'bg-green-700 text-green-200';
            case 'D': return 'bg-blue-700 text-blue-200';
            case 'C': return 'bg-blue-500 text-white';
            case 'B': return 'bg-purple-700 text-purple-200';
            case 'A': return 'bg-purple-500 text-white';
            case 'S': return 'bg-yellow-500 text-black';
            case 'SS': return 'bg-gradient-to-r from-red-500 to-yellow-500 text-white shadow-lg';
            case 'SSS': return 'bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 text-white shadow-xl animate-pulse';
            default: return 'bg-gray-700 text-gray-400';
        }
    }
    
    const availableMissions = missions.filter(m => profile.nivel >= m.level_requirement);

    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold text-cyan-400 mb-2">Diário de Missões</h1>
            <p className="text-gray-400 mb-6">Complete a missão diária para progredir na sua missão épica. Uma nova missão é liberada à meia-noite.</p>

            <Accordion type="single" collapsible className="w-full space-y-4">
                {availableMissions.map(mission => {
                    const activeDailyMission = mission.missoes_diarias.find(d => !d.concluido);
                    const completedDailyMissions = mission.missoes_diarias.filter(d => d.concluido).reverse();
                    const missionProgress = (completedDailyMissions.length / (mission.total_missoes_diarias || 10)) * 100;
                    const onCooldown = !!timers[mission.id];
                    
                    return (
                        <AccordionItem value={`item-${mission.id}`} key={mission.id} className="bg-gray-800/50 border border-gray-700 rounded-lg">
                            <AccordionTrigger className="hover:no-underline px-4 py-3">
                                <div className="flex-1 text-left">
                                    <div className="flex justify-between items-center">
                                        <p className="text-lg font-bold text-gray-200">{mission.nome}</p>
                                        <div className="flex items-center space-x-2">
                                         {onCooldown && (
                                            <div className="flex items-center text-cyan-400 text-xs font-mono bg-gray-900/50 px-2 py-1 rounded-md">
                                                <Timer className="h-4 w-4 mr-1.5"/>
                                                {timers[mission.id]}
                                            </div>
                                         )}
                                         <span className={`text-xs font-bold px-2 py-1 rounded-full ${getRankColor(mission.rank)}`}>Rank {mission.rank}</span>
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-400 mt-1">{mission.descricao}</p>
                                    <div className="w-full bg-gray-700 rounded-full h-2.5 mt-3">
                                         <div className="bg-gradient-to-r from-purple-500 to-cyan-500 h-2.5 rounded-full" style={{width: `${missionProgress}%`}}></div>
                                    </div>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="px-4 pb-4 space-y-4">
                                {onCooldown ? (
                                    <div className="bg-gray-900/50 border-l-4 border-gray-600 rounded-r-lg p-4 flex items-center justify-center text-center">
                                        <div className="blur-sm flex-grow text-left">
                                           <p className="text-lg font-bold text-gray-500">Próxima Missão Bloqueada</p>
                                           <p className="text-sm text-gray-600">A transmissão estará disponível em breve.</p>
                                        </div>
                                        <div className="flex items-center text-cyan-400 ml-4">
                                            <Timer className="h-6 w-6 mr-2"/>
                                            <p className="text-xl font-mono">{timers[mission.id]}</p>
                                        </div>
                                    </div>
                                ) : activeDailyMission ? (
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
                                        <div className="text-right ml-4 flex-shrink-0">
                                            <p className="text-sm font-semibold text-cyan-400">+{activeDailyMission.xp_conclusao} XP</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-gray-900/50 border-l-4 border-green-500 rounded-r-lg p-4 flex items-center">
                                        <CheckCircle className="h-8 w-8 text-green-500 mr-4"/>
                                        <div>
                                            <p className="text-lg font-bold text-gray-200">Missão Épica Concluída!</p>
                                            <p className="text-sm text-gray-400">Você completou todos os passos. Bom trabalho!</p>
                                        </div>
                                    </div>
                                )}
                                
                                {completedDailyMissions.length > 0 && (
                                     <div className="pt-4 mt-4 border-t border-gray-700/50">
                                         <h4 className="text-md font-bold text-gray-400 mb-2 flex items-center"><History className="h-5 w-5 mr-2"/> Histórico de Conclusão</h4>
                                         <div className="space-y-2">
                                         {completedDailyMissions.map(completed => (
                                              <div key={completed.id} className="bg-gray-900/50 border-l-4 border-green-500 rounded-r-lg p-3 flex items-center opacity-70">
                                                <CheckCircle className="h-6 w-6 text-green-500 mr-3 flex-shrink-0" />
                                                <div className="flex-grow">
                                                    <p className="text-md font-bold text-gray-400 line-through">{completed.nome}</p>
                                                </div>
                                                <div className="text-right ml-3 flex-shrink-0">
                                                    <p className="text-xs font-semibold text-green-400">+{completed.xp_conclusao} XP</p>
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
              description: 'Não foi possível obter uma resposta. Tente novamente.',
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
    // Simula o carregamento de dados
    const initialMetas = mockData.metas;
    const initialMissions = mockData.missoes;
    
    // Garantir que cada meta tem uma missão
    initialMetas.forEach(meta => {
        const hasMission = initialMissions.some(m => m.meta_associada === meta.nome);
        if (!hasMission) {
            initialMissions.push({
                id: Date.now() + Math.random(),
                nome: `Missão Épica: ${meta.nome}`,
                descricao: `Um grande passo em direção a: ${meta.nome}.`,
                concluido: false, rank: 'E', level_requirement: 1,
                meta_associada: meta.nome, total_missoes_diarias: 10,
                ultima_missao_concluida_em: null,
                missoes_diarias: [{
                    id: Date.now() + Math.random(),
                    nome: `Iniciar a jornada para "${meta.nome}"`,
                    descricao: `O primeiro passo é o mais importante. Complete esta missão para receber a sua primeira tarefa do Sistema.`,
                    xp_conclusao: 10, concluido: false, tipo: 'diaria',
                }]
            });
        }
    });

    setProfile(mockData.perfis[0]);
    setMetas(initialMetas);
    setMissions(initialMissions);
    setSkills(mockData.habilidades);
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
        return <MetasView metas={metas} setMetas={setMetas} setMissions={setMissions} />;
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
