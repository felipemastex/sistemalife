
"use client";

import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';


export const SkillsView = ({ skills, setSkills }) => {
    const getSkillColor = (category) => {
        switch(category){
            case 'Desenvolvimento de Carreira': return 'border-blue-500';
            case 'Saúde & Fitness': return 'border-green-500';
            case 'Crescimento Pessoal': return 'border-purple-500';
            default: return 'border-gray-500';
        }
    };

    const handleDeleteSkill = (skillId) => {
        setSkills(currentSkills => currentSkills.filter(s => s.id !== skillId));
    };
    
    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-cyan-400">Árvore de Habilidades</h1>
            </div>
            <p className="text-gray-400 mb-6">As suas habilidades evoluem automaticamente à medida que você completa missões diárias associadas a uma meta. Cada missão contribui com XP para a habilidade correspondente.</p>
            <div className="space-y-4">
                {skills.map(skill => {
                    const skillProgress = (skill.xp_atual / skill.xp_para_proximo_nivel) * 100;
                    const canLevelUp = skill.nivel_atual > 0 && skill.pre_requisito ? skills.find(s => s.id === skill.pre_requisito)?.nivel_atual > 0 : skill.nivel_atual > 0;
                    
                    return(
                    <div key={skill.id} className={`bg-gray-800/50 border ${getSkillColor(skill.categoria)} border-l-4 rounded-lg p-4 transition-opacity ${!canLevelUp ? 'opacity-60' : ''}`}>
                        <div className="flex justify-between items-start">
                            <div className="flex-1">
                                <div className="flex justify-between items-center">
                                    <p className="text-lg font-bold text-gray-200">{skill.nome}</p>
                                     <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="icon" className="text-gray-500 hover:text-red-400 h-8 w-8">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Excluir Habilidade?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Tem a certeza que quer excluir a habilidade "{skill.nome}"? Esta ação não pode ser desfeita. Todo o progresso nesta habilidade será perdido.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDeleteSkill(skill.id)}>Sim, Excluir</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>

                                <p className="text-sm text-gray-400 mt-1">{skill.descricao}</p>
                                {skill.pre_requisito && (
                                    <p className="text-xs text-yellow-400/70 mt-2">
                                        Requer: {skills.find(s => s.id === skill.pre_requisito)?.nome} Nv. {skills.find(s => s.id === skill.pre_requisito)?.nivel_minimo_para_desbloqueio || 1}
                                    </p>
                                )}
                            </div>
                            <div className="text-center ml-4 w-28 flex-shrink-0">
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
