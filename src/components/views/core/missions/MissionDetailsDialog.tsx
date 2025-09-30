"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogHeader, DialogFooter } from '@/components/ui/dialog';
import { Award, X, Gem, Plus, Link, Trash2, Save, CalendarPlus, Wand2 } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Button } from "../../../ui/button";
import { Input } from "../../../ui/input";
import { Label } from "../../../ui/label";
import { Card, CardContent, CardHeader } from "../../../ui/card";
import { Progress } from "../../../ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";


// Type definitions
interface SubTask {
  name: string;
  target: number;
  unit: string;
  current: number;
}

interface Mission {
  id?: string | number;
  nome: string;
  descricao: string;
  xp_conclusao: number;
  fragmentos_conclusao: number;
  concluido?: boolean;
  tipo?: string;
  subTasks: SubTask[];
  learningResources?: string[];
  isManual?: boolean;
}

interface DailyMission {
  id: string | number;
  nome: string;
  descricao: string;
  xp_conclusao: number;
  fragmentos_conclusao: number;
  concluido?: boolean;
  tipo?: string;
  subTasks: SubTask[];
  learningResources?: string[];
}

interface RankedMission {
  id: string | number;
  nome: string;
  descricao: string;
  xp_conclusao: number;
  fragmentos_conclusao: number;
  concluido?: boolean;
  tipo?: string;
  subTasks: SubTask[];
  learningResources?: string[];
}

interface ContributionState {
  open: boolean;
  subTask: SubTask | null;
  amount: number;
}

interface SubTaskCreatorProps {
  subTasks: SubTask[];
  onSubTasksChange: (subTasks: SubTask[]) => void;
}

interface MissionDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  mission: Mission | null;
  isManual: boolean;
  onContribute: (subTask: SubTask, amount: number, mission: Mission) => void;
  onSave: (mission: Mission) => void;
  onDelete: (missionId: string | number) => void;
  onAdjustDifficulty: (mission: Mission, feedback: 'too_easy' | 'too_hard') => void;
}

const SubTaskCreator: React.FC<SubTaskCreatorProps> = ({ subTasks, onSubTasksChange }) => {
    const [name, setName] = useState('');
    const [target, setTarget] = useState(1);
    const [unit, setUnit] = useState('');

    const handleAdd = () => {
        if (!name.trim()) return;
        const newSubTask = { name, target: Number(target), unit, current: 0 };
        onSubTasksChange([...subTasks, newSubTask]);
        setName('');
        setTarget(1);
        setUnit('');
    };

    const handleRemove = (index: number) => {
        onSubTasksChange(subTasks.filter((_: SubTask, i: number) => i !== index));
    };

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                {subTasks.map((task: SubTask, index: number) => (
                    <div key={index} className="flex items-center gap-2 bg-secondary/30 p-2 rounded-md border border-border/20">
                        <p className="flex-grow text-sm text-foreground break-words">{task.name} ({task.target} {task.unit})</p>
                        <Button size="icon" variant="ghost" onClick={() => handleRemove(index)} className="h-6 w-6 text-red-500 hover:bg-red-500/20 flex-shrink-0">
                            <Trash2 className="h-4 w-4"/>
                        </Button>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 gap-2 p-3 border-t border-border bg-secondary/10 rounded-md">
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="Nome da sub-tarefa" className="w-full"/>
                <div className="grid grid-cols-[1fr_auto_auto] gap-2 items-center">
                    <Input value={unit} onChange={e => setUnit(e.target.value)} placeholder="Unidade (ex: páginas, km)" className="w-full"/>
                    <Input value={target} onChange={e => setTarget(Number(e.target.value))} type="number" placeholder="Meta" className="w-20"/>
                    <Button onClick={handleAdd} size="sm" className="flex-shrink-0"><Plus className="h-4 w-4"/></Button>
                </div>
            </div>
        </div>
    );
};


export const MissionDetailsDialog: React.FC<MissionDetailsDialogProps> = ({ isOpen, onClose, mission, isManual, onContribute, onSave, onDelete, onAdjustDifficulty }) => {
  const [editedMission, setEditedMission] = useState<Mission | null>(null);
  const [contributionState, setContributionState] = useState<ContributionState>({ open: false, subTask: null, amount: 1 });
  const { toast } = useToast();

  useEffect(() => {
    if (mission) {
      // Convert the mission to the Mission type for internal use
      const convertedMission: Mission = {
        ...mission,
        id: mission.id,
        nome: mission.nome,
        descricao: mission.descricao,
        xp_conclusao: 'xp_conclusao' in mission ? mission.xp_conclusao : 0,
        fragmentos_conclusao: 'fragmentos_conclusao' in mission ? mission.fragmentos_conclusao : 0,
        concluido: 'concluido' in mission ? mission.concluido : undefined,
        tipo: 'tipo' in mission ? mission.tipo : ('missoes_diarias' in mission ? 'epica' : 'diaria'),
        subTasks: mission.subTasks || [],
        learningResources: 'learningResources' in mission ? mission.learningResources : undefined,
        isManual: 'isManual' in mission ? mission.isManual : undefined,
      };
      setEditedMission(convertedMission);
    } else {
      setEditedMission({ nome: '', descricao: '', xp_conclusao: 20, fragmentos_conclusao: 5, subTasks: [] });
    }
  }, [mission]);

  if (!isOpen || !editedMission) return null;

  const isEditing = !!editedMission.id;

  const handleContribute = async () => {
    if (!contributionState.subTask || !mission) return;
    
    onContribute(contributionState.subTask, contributionState.amount, mission);

    // Only close the contribution dialog, not the main one
    setContributionState({ open: false, subTask: null, amount: 1 });
  }

  const handleSave = () => {
    if (editedMission) {
      onSave(editedMission);
    }
  }

  const handleDelete = () => {
    if (editedMission?.id) {
        onDelete(editedMission.id);
    }
  }

  const handleInputChange = (field: keyof Mission, value: string) => {
    setEditedMission(prev => prev ? ({ ...prev, [field]: value }) : null);
  };
   const handleNumericInputChange = (field: keyof Mission, value: string) => {
    setEditedMission(prev => prev ? ({ ...prev, [field]: Number(value) }) : null);
  };

  const handleSubTasksChange = (newSubTasks: SubTask[]) => {
    setEditedMission(prev => prev ? ({ ...prev, subTasks: newSubTasks }) : null);
  };
  
  const handleAddToCalendar = () => {
    // This is a simulation. A real implementation would check for actual OAuth connection.
    const isConnected = true; // Let's simulate being connected.
    if (isConnected) {
        toast({
            title: "Missão Adicionada ao Calendário!",
            description: `A missão "${editedMission.nome}" foi sincronizada com o seu Google Calendar. (Simulação)`,
        });
    } else {
        toast({
            variant: "destructive",
            title: "Conexão Necessária",
            description: "Por favor, conecte a sua conta Google nas Configurações > Dados & Backup para usar esta funcionalidade."
        });
    }
  }

  const renderViewMode = () => (
    <>
        <DialogHeader className="text-center px-4 pt-6 pb-4">
            <DialogTitle className="text-xl md:text-2xl font-bold font-cinzel text-foreground break-words leading-tight text-center">
                {editedMission.nome}
            </DialogTitle>
             <div className="flex justify-center items-center gap-4 mt-3 text-sm flex-wrap">
                <div className="flex items-center gap-1.5 text-yellow-400">
                    <Award className="h-4 w-4"/>
                    <span className="font-medium">{editedMission.xp_conclusao} XP</span>
                </div>
                <div className="flex items-center gap-1.5 text-cyan-400">
                    <Gem className="h-4 w-4"/>
                    <span className="font-medium">{editedMission.fragmentos_conclusao} Fragmentos</span>
                </div>
            </div>
        </DialogHeader>
        <CardContent className="px-4 pb-6 space-y-4">
          <div>
            <h4 className="font-semibold text-muted-foreground text-sm uppercase mb-3 text-center">Objetivos</h4>
            <div className="space-y-3 bg-secondary/20 p-3 rounded-md border border-border/30">
                {(editedMission.subTasks || []).map((task: SubTask, index: number) => {
                    const isTaskCompleted = (task.current || 0) >= task.target;
                    return (
                         <div key={index} className="space-y-2 p-2 rounded border border-border/20 bg-background/50">
                            <div className="flex items-start justify-between gap-2 text-sm">
                                <p className={cn("font-medium text-foreground break-words flex-1 leading-relaxed", isTaskCompleted && "line-through text-green-400")}>
                                    {isTaskCompleted && <span className="text-green-400 mr-1">✓</span>}
                                    {task.name}
                                </p>
                                <div className="flex items-center gap-1 flex-shrink-0">
                                    <span className={cn("font-mono text-xs px-2 py-1 rounded bg-secondary/50", isTaskCompleted ? "text-green-400" : "text-muted-foreground")}>
                                        {task.current || 0}/{task.target} {task.unit || ''}
                                    </span>
                                    <Button 
                                        size="icon" 
                                        variant="ghost" 
                                        className="h-6 w-6 text-primary hover:bg-primary/20" 
                                        onClick={() => setContributionState({ open: true, subTask: task, amount: 1 })}
                                        disabled={isTaskCompleted}
                                        aria-label={`Adicionar progresso para ${task.name}`}
                                    >
                                        <Plus className="h-3 w-3" />
                                    </Button>
                                </div>
                            </div>
                            <Progress value={((task.current || 0) / task.target) * 100} className="h-1"/>
                        </div>
                    )
                })}
            </div>
          </div>
          
           {editedMission.learningResources && editedMission.learningResources.length > 0 && (
            <div>
                <h5 className="text-sm font-semibold text-muted-foreground mb-2 text-center uppercase">Recursos</h5>
                <div className="space-y-2">
                    {editedMission.learningResources.map((link: string, index: number) => (
                        <a href={link} target="_blank" rel="noopener noreferrer" key={index} 
                           className="flex items-center gap-2 text-primary hover:text-primary/80 text-xs p-2 rounded bg-secondary/30 border border-border/20 break-all">
                            <Link className="h-3 w-3 flex-shrink-0"/>
                            <span className="break-all">{link}</span>
                        </a>
                    ))}
                </div>
            </div>
        )}
        </CardContent>
        <DialogFooter className="flex-col sm:flex-row px-4 pb-4 gap-2">
             <Button onClick={() => onAdjustDifficulty(mission!, 'too_hard')} variant="outline" className="text-red-400 border-red-400/50 hover:bg-red-400/10 hover:text-red-300 flex-1">Muito Difícil</Button>
             <Button onClick={() => onAdjustDifficulty(mission!, 'too_easy')} variant="outline" className="text-green-400 border-green-400/50 hover:bg-green-400/10 hover:text-green-300 flex-1">Muito Fácil</Button>
        </DialogFooter>
    </>
  );

  const renderEditMode = () => (
     <>
        <DialogHeader className="px-4 pt-6 pb-4">
            <DialogTitle className="text-lg md:text-xl font-bold font-cinzel break-words text-center">{isEditing ? "Editar Missão Manual" : "Criar Missão Manual"}</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground break-words text-center">Crie ou edite uma tarefa que não precisa de estar ligada a uma meta de longo prazo.</DialogDescription>
        </DialogHeader>
        <div className="px-4 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
             <div className="space-y-2">
                <Label htmlFor="manual-mission-name" className="text-sm font-medium">Nome da Missão</Label>
                <Input id="manual-mission-name" value={editedMission.nome} onChange={e => handleInputChange('nome', e.target.value)} className="w-full" />
            </div>
             <div className="space-y-2">
                <Label htmlFor="manual-mission-desc" className="text-sm font-medium">Descrição</Label>
                <Textarea id="manual-mission-desc" value={editedMission.descricao} onChange={e => handleInputChange('descricao', e.target.value)} className="w-full resize-none" rows={3} />
            </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <Label htmlFor="manual-mission-xp" className="text-sm font-medium">XP Recompensa</Label>
                    <Input id="manual-mission-xp" type="number" value={editedMission.xp_conclusao} onChange={e => handleNumericInputChange('xp_conclusao', e.target.value)} className="w-full" />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="manual-mission-fragments" className="text-sm font-medium">Fragmentos</Label>
                    <Input id="manual-mission-fragments" type="number" value={editedMission.fragmentos_conclusao} onChange={e => handleNumericInputChange('fragmentos_conclusao', e.target.value)} className="w-full" />
                </div>
            </div>
             <div className="space-y-2">
                <Label className="text-sm font-medium">Sub-tarefas</Label>
                <SubTaskCreator subTasks={editedMission.subTasks} onSubTasksChange={handleSubTasksChange} />
             </div>
        </div>
        <DialogFooter className="px-4 pb-4 gap-2 flex-col sm:flex-row">
            {isEditing && (
                 <Button variant="destructive" onClick={handleDelete} className="w-full sm:w-auto mr-auto">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Excluir
                </Button>
            )}
             <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">Cancelar</Button>
            <Button onClick={handleSave} className="w-full sm:w-auto"><Save className="mr-2 h-4 w-4"/> Salvar</Button>
        </DialogFooter>
     </>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="bg-card border text-white max-w-2xl w-full mx-4 rounded-lg p-0 max-h-[90vh]"
      >
        <button onClick={onClose} aria-label="Fechar diálogo" className="absolute top-3 right-3 p-1 text-gray-400 hover:text-white rounded-full z-10">
            <X className="h-4 w-4" />
        </button>
        <Card className="bg-transparent border-none h-full">
            <div className="max-h-[86vh] overflow-y-auto">
                {isManual ? renderEditMode() : renderViewMode()}
            </div>
        </Card>
         <Dialog open={contributionState.open} onOpenChange={(isOpen) => setContributionState(prev => ({...prev, open: isOpen}))}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Registar Progresso: {contributionState.subTask?.name}</DialogTitle>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <Label htmlFor="amount">Quantidade</Label>
                    <Input id="amount" type="number" placeholder="Quantidade" min="1" onChange={e => setContributionState(prev => ({...prev, amount: Number(e.target.value)}))}/>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setContributionState({open: false, subTask: null, amount: 1})}>Cancelar</Button>
                    <Button onClick={handleContribute}>Registar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
};
