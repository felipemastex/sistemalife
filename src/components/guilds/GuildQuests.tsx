
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { PlusCircle, LoaderCircle, Sparkles, Plus, UserCheck } from 'lucide-react';
import { generateGuildQuest } from '@/ai/flows/generate-guild-quest';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '../ui/scroll-area';

const ContributionDialog = ({ open, onOpenChange, subTask, onContribute, userDailyContribution }) => {
    const [amount, setAmount] = useState('');
    
    if (!subTask) return null;

    const remainingDaily = subTask.daily_limit_per_member - userDailyContribution;

    const handleContribute = () => {
        const contribution = parseInt(amount, 10);
        if (!isNaN(contribution) && contribution > 0) {
            onContribute(subTask, contribution);
            onOpenChange(false);
            setAmount('');
        }
    };

    return (
        <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) setAmount(''); onOpenChange(isOpen); }}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Contribuir para: {subTask.name}</DialogTitle>
                    <DialogDescription>
                        Insira a quantidade que você contribuiu hoje. O seu esforço fortalece a guilda!
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <p className="text-sm text-center bg-secondary p-2 rounded-md">
                        Sua contribuição hoje: <span className="font-bold text-primary">{userDailyContribution} / {subTask.daily_limit_per_member}</span>
                    </p>
                    <div>
                        <Label htmlFor="contribution-amount">Nova Contribuição</Label>
                        <Input
                            id="contribution-amount"
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder={`Ex: 5 (Máx: ${remainingDaily})`}
                            min="1"
                            max={remainingDaily}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button onClick={handleContribute} disabled={!amount || parseInt(amount, 10) <= 0 || parseInt(amount, 10) > remainingDaily}>
                        Contribuir
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};


export const GuildQuests = ({ quests = [], onQuestsUpdate, canManage, guildData, userProfile }) => {
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [questTheme, setQuestTheme] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [contributionDialogState, setContributionDialogState] = useState({ open: false, subTask: null, userDailyContribution: 0 });

    const { toast } = useToast();
    
    const getTodayDateString = () => new Date().toISOString().split('T')[0];

    const handleCreateQuest = async () => {
        if (!questTheme.trim()) {
            toast({ variant: 'destructive', title: 'Tema em Falta', description: 'Por favor, insira um tema para a missão.' });
            return;
        }
        setIsCreating(true);
        try {
            const memberCount = guildData.membros?.length || 1;
            const guildLevel = guildData.level || 1; 

            const result = await generateGuildQuest({
                theme: questTheme,
                guildLevel,
                memberCount,
            });

            const leader = (guildData.membros || []).find(m => m.role === 'Líder');

            const newQuest = {
                id: `quest_${Date.now()}`,
                nome: result.questName,
                descricao: result.questDescription,
                subTasks: result.subTasks.map(st => ({...st, current: 0, contributions: [] })),
                concluida: false,
                criador_id: leader ? leader.user_id : null,
            };
            
            const updatedQuests = [...(quests || []), newQuest];
            onQuestsUpdate(updatedQuests);

            toast({ title: "Missão de Guilda Criada!", description: `A missão "${newQuest.nome}" está agora ativa.` });
            setShowCreateDialog(false);
            setQuestTheme('');

        } catch (error) {
            console.error("Error creating guild quest:", error);
            toast({ variant: 'destructive', title: 'Erro de IA', description: 'Não foi possível gerar a missão. Tente novamente.' });
        } finally {
            setIsCreating(false);
        }
    };
    
     const handleContribute = (subTask, amount) => {
        const today = getTodayDateString();
        const userContributionsToday = (subTask.contributions || [])
            .filter(c => c.userId === userProfile.id && c.date === today)
            .reduce((sum, c) => sum + c.amount, 0);

        if (userContributionsToday + amount > subTask.daily_limit_per_member) {
            toast({
                variant: 'destructive',
                title: 'Limite Diário Excedido',
                description: `Você só pode contribuir com mais ${subTask.daily_limit_per_member - userContributionsToday} para esta tarefa hoje.`,
            });
            return;
        }
        
        const newContribution = {
            userId: userProfile.id,
            amount: amount,
            date: today,
        };

        const updatedQuests = quests.map(q => ({
            ...q,
            subTasks: q.subTasks.map(st => {
                if (st.name === subTask.name) {
                    const newCurrent = Math.min(st.target, (st.current || 0) + amount);
                    const newContributions = [...(st.contributions || []), newContribution];
                    return { ...st, current: newCurrent, contributions: newContributions };
                }
                return st;
            })
        }));
        
        onQuestsUpdate(updatedQuests);
        toast({ title: "Contribuição Registada!", description: `Você contribuiu com ${amount} para "${subTask.name}".`});
    };

    return (
        <Card className="h-full flex flex-col">
            <CardHeader className="flex-row items-center justify-between">
                <div>
                    <CardTitle>Missões da Guilda</CardTitle>
                    <CardDescription>Objetivos cooperativos para todos os membros.</CardDescription>
                </div>
                {canManage && (
                    <Button onClick={() => setShowCreateDialog(true)}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Criar Missão
                    </Button>
                )}
            </CardHeader>
            <CardContent className="flex-grow overflow-hidden p-0">
                <ScrollArea className="h-full">
                <div className="space-y-4 p-6 pt-0">
                    {(quests || []).length > 0 ? (
                        quests.map(quest => {
                            const totalTarget = quest.subTasks.reduce((sum, task) => sum + task.target, 0);
                            const totalCurrent = quest.subTasks.reduce((sum, task) => sum + (task.current || 0), 0);
                            const overallProgress = totalTarget > 0 ? (totalCurrent / totalTarget) * 100 : 0;

                            return (
                                <Card key={quest.id} className="bg-secondary/50">
                                    <CardHeader>
                                        <CardTitle>{quest.nome}</CardTitle>
                                        <CardDescription>{quest.descricao}</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {quest.subTasks.map(task => {
                                            const today = getTodayDateString();
                                            const userDailyContribution = (task.contributions || [])
                                                .filter(c => c.userId === userProfile.id && c.date === today)
                                                .reduce((sum, c) => sum + c.amount, 0);
                                            
                                            const isDailyGoalMet = userDailyContribution >= task.daily_limit_per_member;
                                            const isTaskCompleted = (task.current || 0) >= task.target;

                                            return (
                                                <div key={task.name} className="space-y-2">
                                                    <div className="flex justify-between items-center text-sm mb-1 gap-2">
                                                        <p className="font-semibold text-foreground flex-1">{task.name}</p>
                                                        <div className="flex items-center gap-2 flex-shrink-0">
                                                            <Button 
                                                                size="icon" 
                                                                variant="outline" 
                                                                className="h-7 w-7" 
                                                                onClick={() => setContributionDialogState({ open: true, subTask: task, userDailyContribution })}
                                                                disabled={isTaskCompleted || isDailyGoalMet}
                                                            >
                                                                <Plus className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                         {/* Personal Goal */}
                                                        <div className="flex justify-between items-center text-xs text-muted-foreground bg-background/30 p-1.5 rounded">
                                                            <div className="flex items-center gap-1.5">
                                                                <UserCheck className="h-3 w-3 text-primary" />
                                                                <span>Sua Contribuição Hoje</span>
                                                            </div>
                                                            <span className="font-mono text-primary font-bold">{userDailyContribution} / {task.daily_limit_per_member}</span>
                                                        </div>
                                                        {/* Guild Goal */}
                                                        <div className="flex justify-between items-center text-xs text-muted-foreground bg-background/30 p-1.5 rounded">
                                                             <span>Progresso da Guilda</span>
                                                             <span className="font-mono">{task.current || 0} / {task.target}</span>
                                                        </div>
                                                        <Progress value={((task.current || 0) / task.target) * 100} className="h-1.5"/>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </CardContent>
                                    <CardFooter>
                                        <div className="w-full">
                                            <div className="flex justify-between text-sm mb-1 font-bold">
                                                <span>Progresso Geral da Missão</span>
                                                <span>{Math.round(overallProgress)}%</span>
                                            </div>
                                             <Progress value={overallProgress} className="h-3 bg-primary/20" />
                                        </div>
                                    </CardFooter>
                                </Card>
                            )
                        })
                    ) : (
                         <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-8 border-2 border-dashed border-border rounded-lg">
                            <p className="font-semibold">Nenhuma missão de guilda ativa.</p>
                            <p className="text-sm mt-1">A liderança pode criar uma nova missão para começar.</p>
                        </div>
                    )}
                </div>
                </ScrollArea>
            </CardContent>
             <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Sparkles className="text-cyan-400" />
                            Criar Missão de Guilda com IA
                        </DialogTitle>
                        <DialogDescription>
                            Descreva o tema ou o foco para a missão desta semana. O Mestre de Missões fará o resto.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Label htmlFor="quest-theme">Tema da Missão</Label>
                        <Input
                            id="quest-theme"
                            value={questTheme}
                            onChange={(e) => setQuestTheme(e.target.value)}
                            placeholder="Ex: Foco em fitness, maratona de código, melhorar o carisma"
                            disabled={isCreating}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowCreateDialog(false)} disabled={isCreating}>Cancelar</Button>
                        <Button onClick={handleCreateQuest} disabled={isCreating || !questTheme.trim()}>
                            {isCreating ? <><LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> A gerar...</> : "Gerar Missão"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <ContributionDialog 
                open={contributionDialogState.open}
                onOpenChange={(isOpen) => setContributionDialogState({ ...contributionDialogState, open: isOpen })}
                subTask={contributionDialogState.subTask}
                onContribute={handleContribute}
                userDailyContribution={contributionDialogState.userDailyContribution}
            />
        </Card>
    );
};
