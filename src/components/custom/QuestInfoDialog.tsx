
"use client";

import React from "react";
import { Dialog, DialogContent as OriginalDialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Award, X, Timer, Gem, Plus, Link } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

export const ContributionDialog = ({ open, onOpenChange, subTask, onContribute }) => {
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
        className="bg-gray-900/80 backdrop-blur-md border-2 border-cyan-400/30 text-white max-w-md w-full shadow-2xl shadow-cyan-500/10 rounded-lg p-0"
      >
        <div className="p-6 relative font-sans">
          {/* Custom Close Button */}
          <button onClick={onClose} aria-label="Fechar diálogo" className="absolute top-2 right-2 p-1 text-gray-500 hover:text-white transition-colors z-10">
            <X className="h-5 w-5" />
          </button>

          {/* Header */}
          <div className="text-center border-b border-cyan-400/20 pb-4 mb-4">
            <DialogTitle asChild>
                <h2 className="text-xl font-bold tracking-widest uppercase font-cinzel text-cyan-400">INFO DA MISSÃO</h2>
            </DialogTitle>
            <DialogDescription className="text-gray-400 mt-1">
                [{epicMissionName || 'Missão Diária'}]
            </DialogDescription>
          </div>

          {/* Body */}
          <div className="space-y-4 text-center">
            <div className="w-fit mx-auto px-4 py-1 border-y-2 border-cyan-400/50">
                <h3 className="text-lg font-bold tracking-wider font-cinzel text-cyan-400">{mission.nome}</h3>
            </div>
            
             <h4 className="font-bold text-green-400 text-lg tracking-wider">OBJETIVOS</h4>
            <ScrollArea className="max-h-[300px] pr-3 -mr-3">
                <div className="space-y-3 text-left w-full mx-auto">
                    {mission.subTasks?.map((task, index) => {
                        const isTaskCompleted = (task.current || 0) >= task.target;
                        return (
                            <div key={index} className="flex justify-between items-center gap-4 font-mono text-gray-300 text-sm p-2 bg-black/20 rounded-md">
                                <span className={cn("break-words whitespace-pre-wrap flex-1", isTaskCompleted && "line-through text-gray-500")}>{task.name}</span>
                                <div className="flex items-center gap-2">
                                    <span className={cn("text-right break-words whitespace-pre-wrap", isTaskCompleted && "text-green-400")}>[{task.current || 0}/{task.target}] {task.unit}</span>
                                    <Button 
                                        size="icon" 
                                        variant="ghost" 
                                        className="h-6 w-6 text-gray-400 hover:text-white hover:bg-cyan-400/20" 
                                        onClick={() => handleOpenContributeDialog(task)}
                                        disabled={isTaskCompleted || onCooldown}
                                        aria-label={`Adicionar progresso para ${task.name}`}
                                    >
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </ScrollArea>
             {mission.learningResources && mission.learningResources.length > 0 && (
                <div className="mt-4 pt-3 border-t border-border/50">
                    <h5 className="text-sm font-bold text-muted-foreground mb-2 text-left">Recursos Sugeridos</h5>
                    <div className="space-y-2">
                        {mission.learningResources.map((link, index) => (
                            <a href={link} target="_blank" rel="noopener noreferrer" key={index} className="flex items-center gap-2 text-primary hover:text-primary/80 text-sm bg-secondary p-2 rounded-md">
                                <Link className="h-4 w-4"/>
                                <span className="truncate">{link}</span>
                            </a>
                        ))}
                    </div>
                </div>
            )}

            <div className="flex justify-between items-center mt-4 pt-4 border-t border-cyan-400/20">
                 <div className="flex items-center gap-2 text-sm text-yellow-400">
                    <Award className="h-4 w-4"/>
                    <span>{mission.xp_conclusao} XP, {mission.fragmentos_conclusao} Fragmentos</span>
                </div>
                <Button variant="outline" disabled>
                    {onCooldown ? "CONCLUÍDA" : "EM ANDAMENTO"}
                </Button>
            </div>
            
            <div className="text-center mt-4">
                {onCooldown && timer ? (
                    <>
                        <p className="text-sm text-cyan-400/80">PRÓXIMA MISSÃO EM:</p>
                        <p className="text-2xl font-mono text-cyan-400 font-bold">{timer}</p>
                    </>
                ): (
                    <>
                        <p className="text-xs text-yellow-500/80 font-semibold tracking-wider uppercase">
                            <span className="font-bold">AVISO:</span> Falhar em completar a missão diária resultará numa penalidade apropriada.
                        </p>
                    </>
                )}
            </div>

          </div>
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
