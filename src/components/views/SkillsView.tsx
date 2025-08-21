
"use client";

import { Trash2, Swords, Brain, Zap, ShieldCheck, Star, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { statCategoryMapping } from '@/lib/mappings';

const statIcons = {
    forca: <Swords className="h-4 w-4 text-red-400" />,
    inteligencia: <Brain className="h-4 w-4 text-blue-400" />,
    destreza: <Zap className="h-4 w-4 text-yellow-400" />,
    constituicao: <ShieldCheck className="h-4 w-4 text-green-400" />,
    sabedoria: <BookOpen className="h-4 w-4 text-purple-400" />,
    carisma: <Star className="h-4 w-4 text-pink-400" />,
};


export const SkillsView = ({ skills, setSkills, metas, missions }) => {
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

    const isSkillDeletable = (skillId) => {
        const associatedMeta = metas.find(m => m.habilidade_associada_id === skillId);
        if (!associatedMeta) {
            return true; // No associated goal, can be deleted
        }
        // A goal is active if any of its missions are not completed
        const isGoalActive = missions.some(miss => miss.meta_associada === associatedMeta.nome && !miss.concluido);
        return !isGoalActive; // Can be deleted if goal is not active
    };
    
    return (
        <div className="p-4 md:p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-cyan-400">Árvore de Habilidades</h1>
            </div>
            <p className="text-gray-400 mb-6">As suas habilidades evoluem automaticamente à medida que você completa missões diárias associadas a uma meta. Cada missão contribui com XP para a habilidade correspondente.</p>
            <div className="space-y-4">
                {skills.map(skill => {
                    const skillProgress = (skill.xp_atual / skill.xp_para_proximo_nivel) * 100;
                    const canLevelUp = skill.nivel_atual > 0 && skill.pre_requisito ? skills.find(s => s.id === skill.pre_requisito)?.nivel_atual > 0 : skill.nivel_atual > 0;
                    const stats = statCategoryMapping[skill.categoria] || [];
                    const deletable = isSkillDeletable(skill.id);
                    
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
        </div>
    );
};
