

"use client";

import { useState, useCallback, memo } from 'react';
import { Trash2, Swords, Brain, Zap, ShieldCheck, Star, BookOpen, Wand2, PlusCircle, Link2, AlertTriangle, KeySquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { statCategoryMapping } from '@/lib/mappings';
import { useToast } from '@/hooks/use-toast';
import { generateSkillFromGoal } from '@/ai/flows/generate-skill-from-goal';
import * as mockData from '@/lib/data';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { usePlayerDataContext } from '@/hooks/use-player-data.tsx';
import { Progress } from '@/components/ui/progress';


const statIcons = {
    forca: <Swords className="h-4 w-4 text-red-400" />,
    inteligencia: <Brain className="h-4 w-4 text-blue-400" />,
    destreza: <Zap className="h-4 w-4 text-yellow-400" />,
    constituicao: <ShieldCheck className="h-4 w-4 text-green-400" />,
    sabedoria: <BookOpen className="h-4 w-4 text-purple-400" />,
    carisma: <Star className="h-4 w-4 text-pink-400" />,
};


const SkillsViewComponent = ({ onEnterDungeon }) => {
    const { profile, skills, metas, persistData, spendDungeonCrystal } = usePlayerDataContext();
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
        await persistData('metas', updatedMetas);

        // Delete the skill
        const newSkills = skills.filter(s => s.id !== skillId);
        await persistData('skills', newSkills);

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
        const selectedMeta = metas.find(m => m.id === Number(selectedMetaId));

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
                ultima_atividade_em: new Date().toISOString(),
            };

            await persistData('skills', [...skills, newSkill]);
            
            const updatedMetas = metas.map(meta => 
                meta.id === Number(selectedMetaId)
                ? { ...meta, habilidade_associada_id: newSkillId }
                : meta
            );
            await persistData('metas', updatedMetas);

            toast({ title: 'Nova Habilidade Adquirida!', description: `A habilidade "${newSkill.nome}" foi adicionada à sua árvore.`});
            setShowAddDialog(false);
            setSelectedMetaId(null);

        } catch (error) {
            handleToastError(error, "Não foi possível gerar a nova habilidade.");
        } finally {
            setIsLoading(false);
        }
    };

    const metasWithoutSkills = metas.filter(meta => !skills.some(skill => skill.id === meta.habilidade_associada_id));

    return (
        <div className="p-4 md:p-6 h-full overflow-y-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h1 className="text-3xl font-bold text-primary font-cinzel tracking-wider">Árvore de Habilidades</h1>
                <Button onClick={() => setShowAddDialog(true)} className="bg-primary hover:bg-primary/90 w-full sm:w-auto">
                    <PlusCircle className="h-5 w-5 mr-2" />
                    Adicionar Habilidade
                </Button>
            </div>
            <p className="text-muted-foreground mb-8 max-w-4xl">As suas habilidades evoluem automaticamente à medida que você completa missões diárias associadas a uma meta. Mas cuidado, a inatividade prolongada pode levar à Corrupção, causando a perda de XP.</p>
            <div className="space-y-4">
                {skills.map(skill => {
                    const skillProgress = (skill.xp_atual / skill.xp_para_proximo_nivel) * 100;
                    const stats = statCategoryMapping[skill.categoria] || [];
                    const associatedMeta = metas.find(m => m.habilidade_associada_id === skill.id);
                    
                    const lastActivity = new Date(skill.ultima_atividade_em || new Date());
                    const daysSinceActivity = (new Date().getTime() - lastActivity.getTime()) / (1000 * 3600 * 24);
                    const isDecaying = daysSinceActivity > 14;
                    const isAtRisk = daysSinceActivity > 7 && !isDecaying;

                    return(
                    <div key={skill.id} className={cn(
                        "bg-card/60 border border-l-4 rounded-lg p-4 transition-all",
                        isDecaying ? "border-purple-600 animate-pulse-slow" : getSkillColor(skill.categoria),
                        isAtRisk && "border-yellow-500"
                    )}>
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                            <div className="flex-1">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-2">
                                        {(isDecaying || isAtRisk) && (
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger>
                                                        <AlertTriangle className={cn("h-5 w-5", isDecaying ? "text-purple-500" : "text-yellow-500")} />
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>{isDecaying ? "Esta habilidade está a perder XP por inatividade!" : "Esta habilidade entrará em declínio em breve."}</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        )}
                                        <p className="text-lg font-bold text-foreground break-words">{skill.nome}</p>
                                    </div>
                                     <div className="flex items-center">
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                     <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary h-8 w-8" aria-label={`Entrar na masmorra de ${skill.nome}`} onClick={() => spendDungeonCrystal(skill.id)} disabled={(profile?.dungeon_crystals || 0) <= 0}>
                                                        <KeySquare className="h-4 w-4" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>Usar Cristal da Masmorra ({(profile?.dungeon_crystals || 0)})</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-red-400 h-8 w-8" aria-label={`Excluir habilidade ${skill.nome}`}>
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
                                </div>
                                <p className="text-sm text-muted-foreground mt-1 break-words">{skill.descricao}</p>
                                
                                {associatedMeta && (
                                    <div className="flex items-center gap-2 mt-2 text-sm text-primary/80 bg-primary/20 px-2 py-1 rounded-md max-w-max">
                                        <Link2 className="h-4 w-4" />
                                        <span>Vinculado a: {associatedMeta.nome}</span>
                                    </div>
                                )}

                                {stats.length > 0 && (
                                     <div className="flex items-center gap-4 pt-2 mt-2 border-t border-border/50">
                                        <strong className="text-xs text-muted-foreground">Aumenta:</strong>
                                        <div className="flex flex-wrap items-center gap-3">
                                        {stats.map(stat => (
                                            <div key={stat} className="flex items-center gap-1.5 text-foreground">
                                                {statIcons[stat]}
                                                <span className="capitalize text-xs">{stat}</span>
                                            </div>
                                        ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="text-center w-full sm:w-28 flex-shrink-0 bg-secondary/30 p-2 rounded-md sm:bg-transparent sm:p-0 sm:rounded-none">
                                <p className="text-sm text-muted-foreground">Nível</p>
                                <p className="text-2xl font-bold text-primary">{skill.nivel_atual}</p>
                                <p className="text-xs text-muted-foreground">Máx {skill.nivel_maximo}</p>
                            </div>
                        </div>
                        {skill.nivel_atual > 0 && (
                             <div className="mt-3">
                                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                    <span>XP da Habilidade</span>
                                    <span>{skill.xp_atual} / {skill.xp_para_proximo_nivel}</span>
                                </div>
                                <div className="w-full bg-secondary rounded-full h-2.5">
                                    <div className={cn(
                                        "h-2.5 rounded-full transition-all duration-500",
                                        isDecaying ? "bg-gradient-to-r from-purple-600 to-indigo-600" : "bg-gradient-to-r from-primary to-cyan-400"
                                     )} style={{ width: `${skillProgress}%` }}></div>
                                </div>
                            </div>
                        )}
                    </div>
                )})}
            </div>

            <Dialog open={showAddDialog} onOpenChange={(isOpen) => { if(!isOpen) { setShowAddDialog(false); setSelectedMetaId(null); } else { setShowAddDialog(true); }}}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-primary text-xl">
                            <PlusCircle/>
                            Adicionar Nova Habilidade
                        </DialogTitle>
                        <DialogDescription>
                            Escolha uma meta existente para criar e associar uma nova habilidade. A IA irá gerar uma habilidade relevante com base na meta selecionada.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <Label htmlFor="meta-select">Meta a Vincular</Label>
                        <Select onValueChange={setSelectedMetaId} value={selectedMetaId || ''}>
                            <SelectTrigger id="meta-select" className="w-full">
                                <SelectValue placeholder="Selecione uma meta..." />
                            </SelectTrigger>
                            <SelectContent>
                                {metasWithoutSkills.length > 0 ? (
                                    metasWithoutSkills.map(meta => (
                                        <SelectItem key={meta.id} value={String(meta.id)}>{meta.nome}</SelectItem>
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

export const SkillsView = memo(SkillsViewComponent);
