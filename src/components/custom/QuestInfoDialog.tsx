
"use client";

import React from "react";
import { Dialog, DialogContent as OriginalDialogContent, DialogTitle, DialogDescription, DialogHeader, DialogFooter } from '@/components/ui/dialog';
import { Award, X, Timer, Gem, Plus, Link, Eye } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Progress } from "../ui/progress";


const ContributionDialog = ({ open, onOpenChange, subTask, onContribute }) => {
    const [amount, setAmount] = React.useState('');
    
    if (!subTask) return null;

    const remaining = subTask.target - (subTask.current || 0);

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
            <OriginalDialogContent>
                <DialogTitle>Registar Progresso: {subTask.name}</DialogTitle>
                <DialogDescription>
                    Insira a quantidade que você progrediu. O seu esforço fortalece-o!
                </DialogDescription>
                <div className="py-4 space-y-4">
                    <p className="text-sm text-center bg-secondary p-2 rounded-md">
                        Progresso atual: <span className="font-bold text-primary">{subTask.current || 0} / {subTask.target}</span>
                    </p>
                    <div>
                        <Label htmlFor="contribution-amount">Adicionar Progresso</Label>
                        <Input
                            id="contribution-amount"
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder={`Ex: 5 (Faltam ${remaining})`}
                            min="1"
                            max={remaining}
                        />
                    </div>
                </div>
                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button onClick={handleContribute} disabled={!amount || parseInt(amount, 10) <= 0 || parseInt(amount, 10) > remaining}>
                        Registar
                    </Button>
                </div>
            </OriginalDialogContent>
        </Dialog>
    );
};

export const QuestInfoDialog = ({ mission, epicMissionName, onContribute, onClose, onCooldown, timer }) => {
  
  const [contributionState, setContributionState] = React.useState({ open: false, subTask: null });

  if (!mission) return null;

  const handleOpenContributeDialog = (subTask) => {
    setContributionState({ open: true, subTask });
  };
  
  const handleContribute = (subTask, amount) => {
    onContribute(subTask, amount);
  }

  return (
    <Dialog open={true} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <OriginalDialogContent 
        className="bg-card/80 backdrop-blur-md border-2 border-primary/30 text-white max-w-lg w-full shadow-2xl shadow-primary/10 rounded-lg p-0"
      >
        <div className="p-1">
          <Card className="bg-transparent border-none">
            <CardHeader className="text-center pt-8 pb-4">
                <button onClick={onClose} aria-label="Fechar diálogo" className="absolute top-2 right-2 p-1 text-gray-500 hover:text-white transition-colors z-10">
                  <X className="h-5 w-5" />
                </button>
                <DialogDescription className="text-primary font-semibold tracking-wider uppercase">
                  [{epicMissionName || 'Missão Diária'}]
                </DialogDescription>
                <DialogTitle asChild>
                    <h2 className="text-2xl font-bold tracking-wider font-cinzel text-foreground">{mission.nome}</h2>
                </DialogTitle>
                 <div className="flex justify-center items-center gap-6 mt-2 text-sm text-yellow-400">
                    <div className="flex items-center gap-1.5">
                        <Award className="h-4 w-4"/>
                        <span>{mission.xp_conclusao} XP</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Gem className="h-4 w-4"/>
                        <span>{mission.fragmentos_conclusao} Fragmentos</span>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="px-4 md:px-6 pb-6 space-y-5">
              <div>
                <h4 className="font-bold text-muted-foreground text-sm tracking-wider uppercase mb-3 text-center">Objetivos</h4>
                <div className="space-y-3 w-full mx-auto bg-black/20 p-4 rounded-md border border-border/50">
                    {mission.subTasks?.map((task, index) => {
                        const isTaskCompleted = (task.current || 0) >= task.target;
                        return (
                             <div key={index} className="space-y-2">
                                <div className="flex justify-between items-center text-sm mb-1 gap-2">
                                    <p className={cn("font-semibold text-foreground flex-1", isTaskCompleted && "line-through text-gray-500")}>{task.name}</p>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <span className={cn("font-mono text-muted-foreground", isTaskCompleted && "text-primary")}>[{task.current || 0}/{task.target}] {task.unit}</span>
                                        <Button 
                                            size="icon" 
                                            variant="ghost" 
                                            className="h-7 w-7 text-gray-400 hover:text-white hover:bg-primary/20" 
                                            onClick={() => handleOpenContributeDialog(task)}
                                            disabled={isTaskCompleted || onCooldown}
                                            aria-label={`Adicionar progresso para ${task.name}`}
                                        >
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                                <Progress value={((task.current || 0) / task.target) * 100} className="h-1.5"/>
                            </div>
                        )
                    })}
                </div>
              </div>
              
               {mission.learningResources && mission.learningResources.length > 0 && (
                <div className="pt-3">
                    <h5 className="text-sm font-bold text-muted-foreground mb-2 text-center tracking-wider uppercase">Recursos Sugeridos</h5>
                    <div className="space-y-2">
                        {mission.learningResources.map((link, index) => (
                            <a href={link} target="_blank" rel="noopener noreferrer" key={index} className="flex items-center gap-3 text-primary hover:text-primary/80 text-sm bg-secondary p-2 rounded-md transition-colors">
                                <Link className="h-4 w-4 flex-shrink-0"/>
                                <span className="truncate">{link}</span>
                            </a>
                        ))}
                    </div>
                </div>
            )}
             <div className="text-center mt-4 pt-4 border-t border-border/50">
                {onCooldown && timer ? (
                    <>
                        <p className="text-sm text-cyan-400/80 uppercase tracking-wider">Próxima Missão Em:</p>
                        <p className="text-3xl font-mono text-cyan-400 font-bold">{timer}</p>
                    </>
                ): (
                    <p className="text-xs text-yellow-500/80 font-semibold tracking-wider uppercase">
                       A conclusão de todos os objetivos resultará no avanço imediato.
                    </p>
                )}
            </div>

            </CardContent>
          </Card>
        </div>
         <ContributionDialog
            open={contributionState.open}
            onOpenChange={(isOpen) => setContributionState(prev => ({...prev, open: isOpen}))}
            subTask={contributionState.subTask}
            onContribute={handleContribute}
        />
      </OriginalDialogContent>
    </Dialog>
  );
};
