
"use client";

import { useState } from 'react';
import { Trash2, Swords, Brain, Zap, ShieldCheck, Star, BookOpen, Wand2, PlusCircle, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { statCategoryMapping } from '@/lib/mappings';
import { useToast } from '@/hooks/use-toast';
import { generateSkillFromGoal } from '@/ai/flows/generate-skill-from-goal';
import { Skeleton } from '@/components/ui/skeleton';
import * as mockData from '@/lib/data';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

const statIcons = {
    forca: <Swords className="h-4 w-4 text-red-400" />,
    inteligencia: <Brain className="h-4 w-4 text-blue-400" />,
    destreza: <Zap className="h-4 w-4 text-yellow-400" />,
    constituicao: <ShieldCheck className="h-4 w-4 text-green-400" />,
    sabedoria: <BookOpen className="h-4 w-4 text-purple-400" />,
    carisma: <Star className="h-4 w-4 text-pink-400" />,
};


export const SkillsView = ({ skills, setSkills, metas, setMetas }) => {
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [selectedMetaId, setSelectedMetaId] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
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
        const skillToDelete = skills.find(s => s.id === skillId);
        if (!skillToDelete) return;

        // Remove the link from the associated meta
        const updatedMetas = metas.map(meta => {
            if (meta.habilidade_associada_id === skillId) {
                return { ...meta, habilidade_associada_id: null };
            }
            return meta;
        });
        await setMetas(updatedMetas);

        // Delete the skill
        const newSkills = skills.filter(s => s.id !== skillId);
        await setSkills(newSkills);

        toast({
            title: "Habilidade Removida",
            description: `A habilidade "${skillToDelete.nome}" foi removida.`
        });
    };
    
    const handleToastError = (error, customMessage = 'Não foi possível continuar. O Sistema pode estar sobrecarregado.') => {
        console.error("Erro de IA:", error);
        if (error instanceof Error && (error.message.includes('429') || error.message.includes('Quota'))) {
             toast({ variant: 'destructive', title: 'Quota de IA Excedida', description: 'Você atingiu o limite de pedidos. Tente novamente mais tarde.' });
        } else {
             toast({ variant: 'destructive', title: 'Erro de IA', description: customMessage });
        }
    };

    const handleSaveNewSkill = async () => {
        if (!selectedMetaId) {
            toast({ variant: 'destructive', title: 'Nenhuma meta selecionada', description: 'Por favor, escolha uma meta para associar a nova habilidade.'});
            return;
        }
        
        setIsLoading(true);
        const selectedMeta = metas.find(m => m.id === selectedMetaId);

        try {
            const skillResult = await generateSkillFromGoal({
                goalName: selectedMeta.nome,
                goalDescription: Object.values(selectedMeta.detalhes_smart).join(' '),
                existingCategories: mockData.categoriasMetas
            });
            
            const newSkillId = Date.now();
            const newSkill = {
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

            await setSkills([...skills, newSkill]);
            
            const updatedMetas = metas.map(meta => 
                meta.id === selectedMetaId 
                ? { ...meta, habilidade_associada_id: newSkillId }
                : meta
            );
            await setMetas(updatedMetas);

            toast({ title: 'Nova Habilidade Adquirida!', description: `A habilidade "${newSkill.nome}" foi adicionada à sua árvore.`});
            setShowAddDialog(false);
            setSelectedMetaId(null);

        } catch (error) {
            handleToastError(error, "Não foi possível gerar a nova habilidade.");
        } finally {
            setIsLoading(false);
        }
    };

    const metasWithoutSkills = metas.filter(meta => !meta.habilidade_associada_id);

    return (
        <div className="p-4 md:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h1 className="text-3xl font-bold text-cyan-400">Árvore de Habilidades</h1>
                <Button onClick={() => setShowAddDialog(true)} className="bg-cyan-600 hover:bg-cyan-500 w-full sm:w-auto">
                    <PlusCircle className="h-5 w-5 mr-2" />
                    Adicionar Habilidade
                </Button>
            </div>
            <p className="text-gray-400 mb-6">As suas habilidades evoluem automaticamente à medida que você completa missões diárias associadas a uma meta. Cada missão contribui com XP para a habilidade correspondente.</p>
            <div className="space-y-4">
                {skills.map(skill => {
                    const skillProgress = (skill.xp_atual / skill.xp_para_proximo_nivel) * 100;
                    const stats = statCategoryMapping[skill.categoria] || [];
                    const associatedMeta = metas.find(m => m.habilidade_associada_id === skill.id);
                    
                    return(
                    <div key={skill.id} className={`bg-gray-800/50 border ${getSkillColor(skill.categoria)} border-l-4 rounded-lg p-4`}>
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                            <div className="flex-1">
                                <div className="flex justify-between items-start">
                                    <p className="text-lg font-bold text-gray-200 break-words">{skill.nome}</p>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="icon" className="text-gray-500 hover:text-red-400 h-8 w-8 -mt-1 -mr-1">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Excluir Habilidade?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Tem a certeza que quer excluir a habilidade "{skill.nome}"? Isto irá apenas desvinculá-la da meta associada.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDeleteSkill(skill.id)}>Sim, Excluir</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                                <p className="text-sm text-gray-400 mt-1 break-words">{skill.descricao}</p>
                                
                                {associatedMeta && (
                                    <div className="flex items-center gap-2 mt-2 text-sm text-cyan-400/80 bg-cyan-900/30 px-2 py-1 rounded-md max-w-max">
                                        <Link2 className="h-4 w-4" />
                                        <span>Vinculado a: {associatedMeta.nome}</span>
                                    </div>
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

            <Dialog open={showAddDialog} onOpenChange={(isOpen) => { if(!isOpen) { setShowAddDialog(false); setSelectedMetaId(null); } else { setShowAddDialog(true); }}}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-cyan-400 text-xl">
                            <PlusCircle/>
                            Adicionar Nova Habilidade
                        </DialogTitle>
                        <DialogDescription>
                            Escolha uma meta existente para criar e associar uma nova habilidade. A IA irá gerar uma habilidade relevante com base na meta selecionada.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <Label htmlFor="meta-select">Meta a Vincular</Label>
                        <Select onValueChange={setSelectedMetaId} value={selectedMetaId}>
                            <SelectTrigger id="meta-select" className="w-full">
                                <SelectValue placeholder="Selecione uma meta..." />
                            </SelectTrigger>
                            <SelectContent>
                                {metasWithoutSkills.length > 0 ? (
                                    metasWithoutSkills.map(meta => (
                                        <SelectItem key={meta.id} value={meta.id}>{meta.nome}</SelectItem>
                                    ))
                                ) : (
                                    <SelectItem value="none" disabled>Nenhuma meta disponível para vincular.</SelectItem>
                                )}
                            </SelectContent>
                        </Select>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancelar</Button>
                        <Button onClick={handleSaveNewSkill} disabled={isLoading || !selectedMetaId}>
                            {isLoading ? 'A gerar...' : 'Criar e Vincular Habilidade'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    );
};

    