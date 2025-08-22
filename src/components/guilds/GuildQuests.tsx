
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { PlusCircle, LoaderCircle, Sparkles } from 'lucide-react';
import { generateGuildQuest } from '@/ai/flows/generate-guild-quest';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export const GuildQuests = ({ quests = [], onQuestsUpdate, canManage, guildData }) => {
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [questTheme, setQuestTheme] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const { toast } = useToast();

    const handleCreateQuest = async () => {
        if (!questTheme.trim()) {
            toast({ variant: 'destructive', title: 'Tema em Falta', description: 'Por favor, insira um tema para a missão.' });
            return;
        }
        setIsCreating(true);
        try {
            const memberCount = guildData.membros?.length || 1;
            // Placeholder for guild level logic
            const guildLevel = guildData.level || 1; 

            const result = await generateGuildQuest({
                theme: questTheme,
                guildLevel,
                memberCount,
            });

            const newQuest = {
                id: `quest_${Date.now()}`,
                nome: result.questName,
                descricao: result.questDescription,
                subTasks: result.subTasks.map(st => ({...st, current: 0})),
                concluida: false,
                criador_id: guildData.leader_id, // assuming leader_id is available
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
            <CardContent className="flex-grow overflow-y-auto pr-2">
                <div className="space-y-4">
                    {quests && quests.length > 0 ? (
                        quests.map(quest => {
                            const totalTarget = quest.subTasks.reduce((sum, task) => sum + task.target, 0);
                            const totalCurrent = quest.subTasks.reduce((sum, task) => sum + task.current, 0);
                            const overallProgress = totalTarget > 0 ? (totalCurrent / totalTarget) * 100 : 0;

                            return (
                                <Card key={quest.id} className="bg-secondary/50">
                                    <CardHeader>
                                        <CardTitle>{quest.nome}</CardTitle>
                                        <CardDescription>{quest.descricao}</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        {quest.subTasks.map(task => {
                                            const progress = task.target > 0 ? (task.current / task.target) * 100 : 0;
                                            return (
                                                <div key={task.name}>
                                                    <div className="flex justify-between text-sm mb-1">
                                                        <span className="text-muted-foreground">{task.name}</span>
                                                        <span className="font-mono text-foreground">{task.current} / {task.target}</span>
                                                    </div>
                                                    <Progress value={progress} />
                                                </div>
                                            )
                                        })}
                                    </CardContent>
                                    <CardFooter>
                                        <div className="w-full">
                                            <div className="flex justify-between text-sm mb-1 font-bold">
                                                <span>Progresso Geral</span>
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
        </Card>
    );
};
