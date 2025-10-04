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
import { usePlayerDataContext } from '@/hooks/use-player-data';
import { Progress } from '@/components/ui/progress';
import { useIsMobile } from '@/hooks/use-mobile';


const statIcons = {
    forca: <Swords className="h-4 w-4 text-red-400" />,
    inteligencia: <Brain className="h-4 w-4 text-blue-400" />,
    destreza: <Zap className="h-4 w-4 text-yellow-400" />,
    constituicao: <ShieldCheck className="h-4 w-4 text-green-400" />,
    sabedoria: <BookOpen className="h-4 w-4 text-purple-400" />,
    carisma: <Star className="h-4 w-4 text-pink-400" />,
};


const SkillsViewComponent = ({ onEnterDungeon }: { onEnterDungeon: () => void }) => {
    const { profile, skills, metas, persistData, spendDungeonCrystal } = usePlayerDataContext();
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [selectedMetaId, setSelectedMetaId] = useState<string | number | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    const isMobile = useIsMobile();

    const getSkillColor = (category: string) => {
        switch(category){
            case 'Desenvolvimento de Carreira': return 'border-blue-500';
            case 'Saúde & Fitness': return 'border-green-500';
            case 'Crescimento Pessoal': return 'border-purple-500';
            default: return 'border-gray-500';
        }
    };

    const handleDeleteSkill = async (skillId: string | number) => {
        const skillToDelete = skills.find((s: any) => s.id === skillId);
        if (!skillToDelete) return;

        // Remove the link from the associated meta
        const updatedMetas = metas.map((meta: any) => {
            if (meta.habilidade_associada_id === skillId) {
                return { ...meta, habilidade_associada_id: null };
            }
            return meta;
        });
        await persistData('metas', updatedMetas);

        // Delete the skill
        const newSkills = skills.filter((s: any) => s.id !== skillId);
        await persistData('skills', newSkills);

        toast({
            title: "Habilidade Removida",
            description: `A habilidade "${skillToDelete.nome}" foi removida.`
        });
    };
    
    const handleToastError = (error: any, customMessage = 'Não foi possível continuar. O Sistema pode estar sobrecarregado.') => {
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
        const selectedMeta = metas.find((m: any) => m.id === Number(selectedMetaId));

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
            
            const updatedMetas = metas.map((meta: any) => 
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

    const metasWithoutSkills = metas.filter((meta: any) => !skills.some((skill: any) => skill.id === meta.habilidade_associada_id));

    return (
        <div className={cn("h-full overflow-y-auto", isMobile ? "p-2" : "p-4 md:p-6")}>
            <div className={cn("flex flex-col gap-4 mb-4", isMobile ? "sm:flex-row sm:items-center sm:justify-between" : "sm:flex-row sm:items-center sm:justify-between")}>
                <h1 className={cn("font-bold text-primary font-cinzel tracking-wider", isMobile ? "text-2xl" : "text-3xl")}>Árvore de Habilidades</h1>
                <Button onClick={() => setShowAddDialog(true)} className={cn("w-full", isMobile ? "sm:w-auto h-9 text-sm" : "sm:w-auto")}>
                    <PlusCircle className={cn("mr-2", isMobile ? "h-4 w-4" : "h-5 w-5")} />
                    Adicionar Habilidade
                </Button>
            </div>
            <p className={cn("text-muted-foreground mb-4", isMobile ? "text-sm" : "mb-8")}>As suas habilidades evoluem automaticamente à medida que você completa missões diárias associadas a uma meta. Mas cuidado, a inatividade prolongada pode levar à Corrupção, causando a perda de XP.</p>
            <div className={cn("space-y-2", isMobile ? "space-y-2" : "space-y-4")}>
                {skills.map((skill: any) => {
                    const skillProgress = (skill.xp_atual / skill.xp_para_proximo_nivel) * 100;
                    const stats: string[] = statCategoryMapping[skill.categoria as keyof typeof statCategoryMapping] || [];
                    const associatedMeta = metas.find((m: any) => m.habilidade_associada_id === skill.id);
                    
                    const lastActivity = new Date(skill.ultima_atividade_em || new Date());
                    const daysSinceActivity = (new Date().getTime() - lastActivity.getTime()) / (1000 * 3600 * 24);
                    const isDecaying = daysSinceActivity > 14;
                    const isAtRisk = daysSinceActivity > 7 && !isDecaying;

                    return(
                    <div key={skill.id} className={cn(
                        "bg-card/60 border border-l-4 rounded-lg transition-all",
                        isMobile ? "p-2" : "p-4",
                        isDecaying ? "border-purple-600 animate-pulse-slow" : getSkillColor(skill.categoria),
                        isAtRisk && "border-yellow-500"
                    )}>
                        <div className={cn("flex flex-col gap-3", isMobile ? "sm:flex-row sm:items-start" : "sm:flex-row sm:items-start")}>
                            <div className="flex-1 min-w-0">
                                <div className={cn("flex justify-between items-start", isMobile ? "flex-wrap gap-1" : "")}>
                                    <div className={cn("flex items-center gap-1 min-w-0", isMobile ? "gap-1" : "gap-2")}>
                                        {(isDecaying || isAtRisk) && (
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger>
                                                        <AlertTriangle className={cn("flex-shrink-0", isMobile ? "h-4 w-4" : "h-5 w-5", isDecaying ? "text-purple-500" : "text-yellow-500")} />
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p className={isMobile ? "text-xs" : ""}>{isDecaying ? "Esta habilidade está a perder XP por inatividade!" : "Esta habilidade entrará em declínio em breve."}</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        )}
                                        <p className={cn("font-bold text-foreground break-words", isMobile ? "text-base" : "text-lg")}>{skill.nome}</p>
                                    </div>
                                     <div className="flex items-center">
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                     <Button variant="ghost" size="icon" className={cn("text-muted-foreground hover:text-primary", isMobile ? "h-7 w-7" : "h-8 w-8")} aria-label={`Entrar na masmorra de ${skill.nome}`} onClick={() => spendDungeonCrystal(skill.id)} disabled={(profile?.dungeon_crystals || 0) <= 0}>
                                                        <KeySquare className={cn("", isMobile ? "h-3.5 w-3.5" : "h-4 w-4")} />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p className={isMobile ? "text-xs" : ""}>Usar Cristal da Masmorra ({(profile?.dungeon_crystals || 0)})</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon" className={cn("text-muted-foreground hover:text-red-400", isMobile ? "h-7 w-7" : "h-8 w-8")} aria-label={`Excluir habilidade ${skill.nome}`}>
                                                    <Trash2 className={cn("", isMobile ? "h-3.5 w-3.5" : "h-4 w-4")} />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle className={isMobile ? "text-lg" : ""}>Excluir Habilidade?</AlertDialogTitle>
                                                    <AlertDialogDescription className={isMobile ? "text-sm" : ""}>
                                                        Tem a certeza que quer excluir a habilidade "{skill.nome}"? Isto irá apenas desvinculá-la da meta associada.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter className={isMobile ? "flex-col gap-2" : ""}>
                                                    <AlertDialogCancel className={isMobile ? "h-8 text-sm" : ""}>Cancelar</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDeleteSkill(skill.id)} className={isMobile ? "h-8 text-sm" : ""}>Sim, Excluir</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </div>
                                <p className={cn("text-muted-foreground mt-1 break-words", isMobile ? "text-xs" : "text-sm")}>{skill.descricao}</p>
                                
                                {associatedMeta && (
                                    <div className={cn("flex items-center gap-1 mt-2 text-primary/80 bg-primary/20 px-2 py-1 rounded-md max-w-max", isMobile ? "text-xs px-1.5 py-0.5" : "")}>
                                        <Link2 className={cn("flex-shrink-0", isMobile ? "h-3 w-3" : "h-4 w-4")} />
                                        <span className="truncate">Vinculado a: {associatedMeta.nome}</span>
                                    </div>
                                )}

                                {stats.length > 0 && (
                                     <div className={cn("flex flex-wrap items-center gap-2 pt-2 mt-2 border-t border-border/50", isMobile ? "gap-2 pt-1.5 mt-1.5" : "")}>
                                        <strong className={cn("text-muted-foreground", isMobile ? "text-xs" : "text-xs")}>Aumenta:</strong>
                                        <div className="flex flex-wrap items-center gap-2">
                                        {stats.map((stat: string) => (
                                            <div key={stat} className={cn("flex items-center gap-1 text-foreground", isMobile ? "gap-1" : "gap-1.5")}>
                                                {statIcons[stat as keyof typeof statIcons]}
                                                <span className={cn("capitalize", isMobile ? "text-xs" : "text-xs")}>{stat}</span>
                                            </div>
                                        ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className={cn("text-center flex-shrink-0 bg-secondary/30 rounded-md sm:bg-transparent sm:p-0 sm:rounded-none w-full sm:w-24", isMobile ? "p-1.5 w-full sm:w-20" : "p-2 sm:w-28")}>
                                <p className={cn("text-muted-foreground", isMobile ? "text-xs" : "text-sm")}>Nível</p>
                                <p className={cn("font-bold text-primary", isMobile ? "text-xl" : "text-2xl")}>{skill.nivel_atual}</p>
                                <p className={cn("text-muted-foreground", isMobile ? "text-xs" : "text-xs")}>Máx {skill.nivel_maximo}</p>
                            </div>
                        </div>
                        {skill.nivel_atual > 0 && (
                             <div className={cn("mt-2", isMobile ? "mt-2" : "mt-3")}>
                                <div className={cn("flex justify-between text-xs text-muted-foreground mb-1", isMobile ? "text-xs mb-0.5" : "")}>
                                    <span>XP da Habilidade</span>
                                    <span>{skill.xp_atual} / {skill.xp_para_proximo_nivel}</span>
                                </div>
                                <div className={cn("w-full bg-secondary rounded-full", isMobile ? "h-2" : "h-2.5")}>
                                    <div className={cn(
                                        "rounded-full transition-all duration-500",
                                        isMobile ? "h-2" : "h-2.5",
                                        isDecaying ? "bg-gradient-to-r from-purple-600 to-indigo-600" : "bg-gradient-to-r from-primary to-cyan-400"
                                     )} style={{ width: `${skillProgress}%` }}></div>
                                </div>
                            </div>
                        )}
                    </div>
                )})}
            </div>

            <Dialog open={showAddDialog} onOpenChange={(isOpen) => { if(!isOpen) { setShowAddDialog(false); setSelectedMetaId(null); } else { setShowAddDialog(true); }}}>
                <DialogContent className={cn("max-w-lg", isMobile ? "max-w-[95vw] p-4" : "")}>
                    <DialogHeader>
                        <DialogTitle className={cn("flex items-center gap-2 text-primary", isMobile ? "text-lg" : "text-xl")}>
                            <PlusCircle className={isMobile ? "h-5 w-5" : ""}/>
                            Adicionar Nova Habilidade
                        </DialogTitle>
                        <DialogDescription className={isMobile ? "text-sm" : ""}>
                            Escolha uma meta existente para criar e associar uma nova habilidade. A IA irá gerar uma habilidade relevante com base na meta selecionada.
                        </DialogDescription>
                    </DialogHeader>
                    <div className={cn("py-4 space-y-4", isMobile ? "py-2 space-y-3" : "")}>
                        <Label htmlFor="meta-select" className={isMobile ? "text-sm" : ""}>Meta a Vincular</Label>
                        <Select onValueChange={(value) => setSelectedMetaId(value)} value={selectedMetaId ? String(selectedMetaId) : ''}>
                            <SelectTrigger id="meta-select" className={cn("w-full", isMobile ? "h-9 text-sm" : "")}>
                                <SelectValue placeholder="Selecione uma meta..." />
                            </SelectTrigger>
                            <SelectContent>
                                {metasWithoutSkills.length > 0 ? (
                                    metasWithoutSkills.map((meta: any) => (
                                        <SelectItem key={meta.id} value={String(meta.id)} className={isMobile ? "text-sm" : ""}>{meta.nome}</SelectItem>
                                    ))
                                ) : (
                                    <SelectItem value="none" disabled className={isMobile ? "text-sm" : ""}>Nenhuma meta disponível para vincular.</SelectItem>
                                )}
                            </SelectContent>
                        </Select>
                    </div>
                    <DialogFooter className={isMobile ? "flex-col gap-2" : ""}>
                        <Button variant="outline" onClick={() => setShowAddDialog(false)} className={isMobile ? "h-8 text-sm" : ""}>Cancelar</Button>
                        <Button onClick={handleSaveNewSkill} disabled={isLoading || !selectedMetaId} className={isMobile ? "h-8 text-sm" : ""}>
                            {isLoading ? (isMobile ? 'A gerar...' : 'A gerar...') : 'Criar e Vincular Habilidade'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    );
};

export const SkillsView = memo(SkillsViewComponent);
