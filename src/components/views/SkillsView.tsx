
"use client";

import { useState } from 'react';
import { Trash2, Swords, Brain, Zap, ShieldCheck, Star, BookOpen, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { statCategoryMapping } from '@/lib/mappings';
import { useToast } from '@/hooks/use-toast';
import { generateGoalSuggestion } from '@/ai/flows/generate-goal-suggestion';
import { generateSimpleSmartGoal } from '@/ai/flows/generate-simple-smart-goal';
import { generateSkillFromGoal } from '@/ai/flows/generate-skill-from-goal';
import { generateInitialEpicMission } from '@/ai/flows/generate-initial-epic-mission';
import { Skeleton } from '@/components/ui/skeleton';
import * as mockData from '@/lib/data';


const statIcons = {
    forca: <Swords className="h-4 w-4 text-red-400" />,
    inteligencia: <Brain className="h-4 w-4 text-blue-400" />,
    destreza: <Zap className="h-4 w-4 text-yellow-400" />,
    constituicao: <ShieldCheck className="h-4 w-4 text-green-400" />,
    sabedoria: <BookOpen className="h-4 w-4 text-purple-400" />,
    carisma: <Star className="h-4 w-4 text-pink-400" />,
};


export const SkillsView = ({ skills, setSkills, metas, setMetas, missions, setMissions, profile }) => {
    const [showSuggestionDialog, setShowSuggestionDialog] = useState(false);
    const [suggestions, setSuggestions] = useState([]);
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
    const [isLoadingSimpleGoal, setIsLoadingSimpleGoal] = useState(false);
    const { toast } = useToast();

    const getSkillColor = (category) => {
        switch(category){
            case 'Desenvolvimento de Carreira': return 'border-blue-500';
            case 'Saúde & Fitness': return 'border-green-500';
            case 'Crescimento Pessoal': return 'border-purple-500';
            default: return 'border-gray-500';
        }
    };

    const handleDeleteSkill = async (skillId) => {
        const newSkills = skills.filter(s => s.id !== skillId);
        await setSkills(newSkills);
    };

    const isMetaDeletable = (skillId) => {
        const associatedMeta = metas.find(m => m.habilidade_associada_id === skillId);
        if (!associatedMeta) {
            return true;
        }
        const isGoalActive = missions.some(miss => miss.meta_associada === associatedMeta.nome && !miss.concluido);
        return !isGoalActive;
    };
    
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
            handleToastError(error, "Não foi possível gerar sugestões.");
            setShowSuggestionDialog(false);
        } finally {
            setIsLoadingSuggestions(false);
        }
    }
    
    const handleSelectSuggestion = async (suggestionName) => {
        setShowSuggestionDialog(false);
        setIsLoadingSimpleGoal(true);
        try {
            const { refinedGoal, fallback } = await generateSimpleSmartGoal({ goalName: suggestionName });
            
            if (fallback) {
                 toast({
                    variant: 'destructive',
                    title: 'Sistema Sobrecarregado',
                    description: 'Uma meta genérica foi criada. Por favor, edite-a para adicionar os detalhes SMART.',
                });
            }

            // This is the core logic from MetasView's handleSave for creating a new goal/skill
            let newSkillId = Date.now();
            let newSkill;
            const goalDescription = Object.values(refinedGoal).join(' ');
            
            try {
                const skillResult = await generateSkillFromGoal({
                    goalName: refinedGoal.name,
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
                    nome: `Maestria em ${refinedGoal.name}`,
                    descricao: `Habilidade relacionada ao objetivo: ${refinedGoal.name}`,
                    categoria: 'Crescimento Pessoal',
                    nivel_atual: 1,
                    nivel_maximo: 10,
                    xp_atual: 0,
                    xp_para_proximo_nivel: 50,
                };
            }
            
            const newMetaWithId = { 
                id: Date.now(), 
                nome: refinedGoal.name,
                categoria: newSkill.categoria,
                prazo: null,
                detalhes_smart: refinedGoal,
                user_id: profile.id, 
                habilidade_associada_id: newSkillId 
            };
            
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
                    level_requirement: 1,
                    meta_associada: newMetaWithId.nome,
                    total_missoes_diarias: 10,
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

        } catch (error) {
            handleToastError(error, 'Não foi possível criar a nova meta e habilidade.');
        } finally {
            setIsLoadingSimpleGoal(false);
        }
    };

    
    return (
        <div className="p-4 md:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h1 className="text-3xl font-bold text-cyan-400">Árvore de Habilidades</h1>
                <Button onClick={handleGetSuggestions} variant="outline" className="text-cyan-400 border-cyan-400/50 hover:bg-cyan-400/10 hover:text-cyan-300 w-full sm:w-auto">
                    <Wand2 className="h-5 w-5 mr-2" />
                    Sugerir Novas Habilidades
                </Button>
            </div>
            <p className="text-gray-400 mb-6">As suas habilidades evoluem automaticamente à medida que você completa missões diárias associadas a uma meta. Cada missão contribui com XP para a habilidade correspondente.</p>
            <div className="space-y-4">
                {skills.map(skill => {
                    const skillProgress = (skill.xp_atual / skill.xp_para_proximo_nivel) * 100;
                    const canLevelUp = skill.nivel_atual > 0 && skill.pre_requisito ? skills.find(s => s.id === skill.pre_requisito)?.nivel_atual > 0 : skill.nivel_atual > 0;
                    const stats = statCategoryMapping[skill.categoria] || [];
                    const deletable = isMetaDeletable(skill.id);
                    
                    return(
                    <div key={skill.id} className={`bg-gray-800/50 border ${getSkillColor(skill.categoria)} border-l-4 rounded-lg p-4 transition-opacity ${!canLevelUp ? 'opacity-60' : ''}`}>
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                            <div className="flex-1">
                                <div className="flex justify-between items-start">
                                    <p className="text-lg font-bold text-gray-200 break-words">{skill.nome}</p>
                                     
                                     <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <span tabIndex={deletable ? -1 : 0}>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="text-gray-500 hover:text-red-400 h-8 w-8 -mt-1 -mr-1" disabled={!deletable}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Excluir Habilidade?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                Tem a certeza que quer excluir a habilidade "{skill.nome}"? Esta ação não pode ser desfeita.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleDeleteSkill(skill.id)}>Sim, Excluir</AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                                </span>
                                            </TooltipTrigger>
                                            {!deletable && (
                                                <TooltipContent>
                                                    <p>Esta habilidade não pode ser excluída porque está vinculada a uma meta ativa.</p>
                                                </TooltipContent>
                                            )}
                                        </Tooltip>
                                     </TooltipProvider>

                                </div>

                                <p className="text-sm text-gray-400 mt-1 break-words">{skill.descricao}</p>
                                {skill.pre_requisito && (
                                    <p className="text-xs text-yellow-400/70 mt-2">
                                        Requer: {skills.find(s => s.id === skill.pre_requisito)?.nome} Nv. {skills.find(s => s.id === skill.pre_requisito)?.nivel_minimo_para_desbloqueio || 1}
                                    </p>
                                )}
                                {stats.length > 0 && (
                                     <div className="flex items-center gap-4 pt-2 mt-2 border-t border-gray-700/50">
                                        <strong className="text-xs text-gray-400">Aumenta:</strong>
                                        <div className="flex flex-wrap items-center gap-3">
                                        {stats.map(stat => (
                                            <div key={stat} className="flex items-center gap-1.5 text-gray-300">
                                                {statIcons[stat]}
                                                <span className="capitalize text-xs">{stat}</span>
                                            </div>
                                        ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="text-center w-full sm:w-28 flex-shrink-0 bg-gray-900/30 p-2 rounded-md sm:bg-transparent sm:p-0 sm:rounded-none">
                                <p className="text-sm text-gray-400">Nível</p>
                                <p className="text-2xl font-bold text-cyan-400">{skill.nivel_atual}</p>
                                <p className="text-xs text-gray-500">Máx {skill.nivel_maximo}</p>
                            </div>
                        </div>
                        {skill.nivel_atual > 0 && (
                             <div className="mt-3">
                                <div className="flex justify-between text-xs text-gray-300 mb-1">
                                    <span>XP da Habilidade</span>
                                    <span>{skill.xp_atual} / {skill.xp_para_proximo_nivel}</span>
                                </div>
                                <div className="w-full bg-gray-700 rounded-full h-2.5">
                                    <div className="bg-gradient-to-r from-purple-500 to-blue-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${skillProgress}%` }}></div>
                                </div>
                            </div>
                        )}
                    </div>
                )})}
            </div>

            <Dialog open={showSuggestionDialog} onOpenChange={setShowSuggestionDialog}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-cyan-400 text-xl">
                            <Wand2/>
                            Sugestões para Novas Habilidades
                        </DialogTitle>
                        <DialogDescription>
                            Com base no seu perfil, o Sistema acredita que estas seriam as próximas grandes metas (e habilidades) para a sua jornada.
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
                                    <Button size="sm" className="ml-0 sm:ml-4 flex-shrink-0" onClick={() => handleSelectSuggestion(s.name)} disabled={isLoadingSimpleGoal}>
                                        {isLoadingSimpleGoal ? 'A criar...' : 'Adquirir Habilidade'}
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
