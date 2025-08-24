
"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogHeader, DialogFooter } from '@/components/ui/dialog';
import { Award, X, Gem, Plus, Link, Trash2, Save } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Button } from "../../../ui/button";
import { Input } from "../../../ui/input";
import { Label } from "../../../ui/label";
import { Card, CardContent, CardHeader } from "../../../ui/card";
import { Progress } from "../../../ui/progress";
import { Textarea } from "@/components/ui/textarea";

const SubTaskCreator = ({ subTasks, onSubTasksChange }) => {
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

    const handleRemove = (index) => {
        onSubTasksChange(subTasks.filter((_, i) => i !== index));
    };

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                {subTasks.map((task, index) => (
                    <div key={index} className="flex items-center gap-2 bg-secondary p-2 rounded-md">
                        <p className="flex-grow text-sm text-foreground">{task.name} ({task.target} {task.unit})</p>
                        <Button size="icon" variant="ghost" onClick={() => handleRemove(index)} className="h-6 w-6 text-red-500">
                            <Trash2 className="h-4 w-4"/>
                        </Button>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto_auto] gap-2 items-end p-2 border-t border-border">
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="Nome da sub-tarefa"/>
                <Input value={target} onChange={e => setTarget(Number(e.target.value))} type="number" placeholder="Meta" className="w-20"/>
                <Input value={unit} onChange={e => setUnit(e.target.value)} placeholder="Unidade" className="w-24"/>
                <Button onClick={handleAdd} size="icon"><Plus/></Button>
            </div>
        </div>
    );
};


export const MissionDetailsDialog = ({ isOpen, onClose, mission, isManual, onContribute, onSave, onDelete }) => {
  const [editedMission, setEditedMission] = useState(null);
  const [contributionState, setContributionState] = useState({ open: false, subTask: null, amount: 1 });

  useEffect(() => {
    if (mission) {
      setEditedMission({ ...mission, subTasks: mission.subTasks || [] });
    } else {
      setEditedMission({ nome: '', descricao: '', xp_conclusao: 20, fragmentos_conclusao: 5, subTasks: [] });
    }
  }, [mission]);

  if (!isOpen || !editedMission) return null;

  const isEditing = !!editedMission.id;

  const handleContribute = () => {
    onContribute(contributionState.subTask, contributionState.amount, mission);
    setContributionState({ open: false, subTask: null, amount: 1 });
  }

  const handleSave = () => {
    onSave(editedMission);
  }

  const handleInputChange = (field, value) => {
    setEditedMission(prev => ({ ...prev, [field]: value }));
  };
   const handleNumericInputChange = (field, value) => {
    setEditedMission(prev => ({ ...prev, [field]: Number(value) }));
  };

  const handleSubTasksChange = (newSubTasks) => {
    setEditedMission(prev => ({ ...prev, subTasks: newSubTasks }));
  };

  const renderViewMode = () => (
    <>
        <DialogHeader className="text-center pt-8 pb-4">
            <DialogTitle asChild>
                <h2 className="text-2xl font-bold tracking-wider font-cinzel text-foreground">{mission.nome}</h2>
            </DialogTitle>
             <div className="flex justify-center items-center gap-6 mt-4 text-sm text-yellow-400">
                <div className="flex items-center gap-1.5">
                    <Award className="h-4 w-4"/>
                    <span>{mission.xp_conclusao} XP</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <Gem className="h-4 w-4"/>
                    <span>{mission.fragmentos_conclusao} Fragmentos</span>
                </div>
            </div>
        </DialogHeader>
        <CardContent className="px-4 md:px-6 pb-6 space-y-5">
          <div>
            <h4 className="font-bold text-muted-foreground text-sm tracking-wider uppercase mb-3 text-center">Objetivos</h4>
            <div className="space-y-3 w-full mx-auto bg-black/20 p-4 rounded-md border border-border/50">
                {(mission.subTasks || []).map((task, index) => {
                    const isTaskCompleted = (task.current || 0) >= task.target;
                    return (
                         <div key={index} className="space-y-2">
                            <div className="flex flex-wrap justify-between items-center text-sm mb-1 gap-x-2 gap-y-1">
                                <p className={cn("font-semibold text-foreground flex-1 break-words", isTaskCompleted && "line-through text-gray-500")}>{task.name}</p>
                                <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
                                    <span className={cn("font-mono text-muted-foreground", isTaskCompleted && "text-primary")}>[{task.current || 0}/{task.target}] {task.unit}</span>
                                    <Button 
                                        size="icon" 
                                        variant="ghost" 
                                        className="h-7 w-7 text-gray-400 hover:text-white hover:bg-primary/20" 
                                        onClick={() => setContributionState({ open: true, subTask: task, amount: 1 })}
                                        disabled={isTaskCompleted}
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
        <DialogFooter className="pt-4">
             {isManual && <Button variant="outline" onClick={() => onDelete(mission.id)}>Excluir</Button>}
        </DialogFooter>
        </CardContent>
    </>
  );

  const renderEditMode = () => (
     <>
        <DialogHeader>
            <DialogTitle>{isEditing ? "Editar Missão Manual" : "Criar Missão Manual"}</DialogTitle>
            <DialogDescription>Crie ou edite uma tarefa que não precisa de estar ligada a uma meta de longo prazo.</DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto px-1">
             <div className="space-y-2">
                <Label htmlFor="manual-mission-name">Nome da Missão</Label>
                <Input id="manual-mission-name" value={editedMission.nome} onChange={e => handleInputChange('nome', e.target.value)} />
            </div>
             <div className="space-y-2">
                <Label htmlFor="manual-mission-desc">Descrição</Label>
                <Textarea id="manual-mission-desc" value={editedMission.descricao} onChange={e => handleInputChange('descricao', e.target.value)} />
            </div>
             <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <Label htmlFor="manual-mission-xp">XP Recompensa</Label>
                    <Input id="manual-mission-xp" type="number" value={editedMission.xp_conclusao} onChange={e => handleNumericInputChange('xp_conclusao', e.target.value)} />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="manual-mission-fragments">Fragmentos</Label>
                    <Input id="manual-mission-fragments" type="number" value={editedMission.fragmentos_conclusao} onChange={e => handleNumericInputChange('fragmentos_conclusao', e.target.value)} />
                </div>
            </div>
             <div className="space-y-2">
                <Label>Sub-tarefas</Label>
                <SubTaskCreator subTasks={editedMission.subTasks} onSubTasksChange={handleSubTasksChange} />
             </div>
        </div>
        <DialogFooter>
             <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button onClick={handleSave}><Save className="mr-2 h-4 w-4"/> Salvar</Button>
        </DialogFooter>
     </>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="bg-card/80 backdrop-blur-md border-2 border-primary/30 text-white max-w-lg w-full shadow-2xl shadow-primary/10 rounded-lg p-0"
      >
        <button onClick={onClose} aria-label="Fechar diálogo" className="absolute top-2 right-2 p-1 text-gray-500 hover:text-white transition-colors z-10">
            <X className="h-5 w-5" />
        </button>
        <Card className="bg-transparent border-none">
            {isManual ? renderEditMode() : renderViewMode()}
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
