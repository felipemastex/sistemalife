
"use client";

import { useState } from 'react';
import { PlusCircle, Edit, Trash2, Save, FileDown, BrainCircuit, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generateRoutineSuggestion } from '@/ai/flows/generate-routine-suggestion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


export const RoutineView = ({ routine, setRoutine, missions, routineTemplates, setRoutineTemplates }) => {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState(null);
    const [editedItem, setEditedItem] = useState({ start_time: '', end_time: '', activity: '' });
    const { toast } = useToast();
    const rankOrder = ['F', 'E', 'D', 'C', 'B', 'A', 'S', 'SS', 'SSS'];
    
    // State for AI suggestions
    const [suggestions, setSuggestions] = useState({}); // { missionId: { suggestionText, ... } }
    const [isLoadingSuggestion, setIsLoadingSuggestion] = useState(null); // missionId that is loading

    const dayNames = ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"];
    const today = new Date();
    const [selectedDay, setSelectedDay] = useState(dayNames[today.getDay()]);
    
    // State for template loading dialog
    const [showTemplateDialog, setShowTemplateDialog] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState(null);

    // State for saving template dialog
    const [showSaveTemplateDialog, setShowSaveTemplateDialog] = useState(false);
    const [newTemplateName, setNewTemplateName] = useState('');


    const getWeekDays = () => {
        const todayDate = new Date();
        const week = [];
        const dayOfWeek = todayDate.getDay(); 

        for (let i = 0; i < 7; i++) {
            const date = new Date(todayDate);
            date.setDate(todayDate.getDate() - dayOfWeek + i);
            week.push({
                name: dayNames[date.getDay()],
                date: date.getDate(),
                isToday: date.toDateString() === todayDate.toDateString(),
            });
        }
        return week;
    };
    const weekDays = getWeekDays();


    const handleToastError = (error, customMessage = 'Não foi possível continuar. O Sistema pode estar sobrecarregado.') => {
        console.error("Erro de IA:", error);
        if (error instanceof Error && (error.message.includes('429') || error.message.includes('Quota'))) {
             toast({ variant: 'destructive', title: 'Quota de IA Excedida', description: 'Você atingiu o limite de pedidos. Tente novamente mais tarde.' });
        } else {
             toast({ variant: 'destructive', title: 'Erro de IA', description: customMessage });
        }
    };
    
    const handleOpenDialog = (item = null) => {
        setCurrentItem(item);
        if (item) {
            setEditedItem({ start_time: item.start_time, end_time: item.end_time, activity: item.activity });
        } else {
            setEditedItem({ id: null, start_time: '', end_time: '', activity: '' });
        }
        setIsDialogOpen(true);
    };

    const handleSave = () => {
        const currentDayRoutine = routine[selectedDay] || [];
        if (currentItem) {
            // Edit
            const updatedDayRoutine = currentDayRoutine.map(item => item.id === currentItem.id ? { ...item, ...editedItem } : item);
            setRoutine(prev => ({...prev, [selectedDay]: updatedDayRoutine }));
        } else {
            // Add
            const newDayRoutine = [...currentDayRoutine, { ...editedItem, id: Date.now() }];
            setRoutine(prev => ({...prev, [selectedDay]: newDayRoutine}));
        }
        setIsDialogOpen(false);
    };

    const handleDelete = (id) => {
        const currentDayRoutine = routine[selectedDay] || [];
        const updatedDayRoutine = currentDayRoutine.filter(item => item.id !== id);
        setRoutine(prev => ({...prev, [selectedDay]: updatedDayRoutine}));
    };
    
    const handleLoadTemplate = (templateName) => {
        const template = routineTemplates[templateName];
        if (template) {
            setSelectedTemplate(template);
            setShowTemplateDialog(true);
        }
    };

    const confirmLoadTemplate = () => {
        if (selectedTemplate) {
            // Add new unique IDs to template items to avoid key conflicts
            const templateWithNewIds = selectedTemplate.map(item => ({...item, id: Date.now() + Math.random()}));
            setRoutine(prev => ({ ...prev, [selectedDay]: templateWithNewIds }));
            toast({ title: "Template Carregado!", description: `A rotina de ${selectedDay} foi atualizada.` });
        }
        setShowTemplateDialog(false);
        setSelectedTemplate(null);
    };

    const handleSaveTemplate = () => {
        if (!newTemplateName.trim()) {
            toast({ variant: 'destructive', title: "Nome Inválido", description: "Por favor, dê um nome ao seu template." });
            return;
        }
        const currentDayRoutine = routine[selectedDay] || [];
        if (currentDayRoutine.length === 0) {
            toast({ variant: 'destructive', title: "Rotina Vazia", description: "Não é possível salvar um template de um dia sem atividades." });
            return;
        }

        setRoutineTemplates(prev => ({ ...prev, [newTemplateName]: currentDayRoutine }));
        toast({ title: "Template Salvo!", description: `O template "${newTemplateName}" foi criado com sucesso.` });
        setShowSaveTemplateDialog(false);
        setNewTemplateName('');
    }


    const handleGetSuggestion = async (mission) => {
        setIsLoadingSuggestion(mission.id);
        try {
            const result = await generateRoutineSuggestion({
                routine: routine[selectedDay] || [],
                dayOfWeek: selectedDay,
                missionName: mission.nome,
                missionDescription: mission.descricao,
            });
            setSuggestions(prev => ({...prev, [mission.id]: result}));
        } catch(error) {
            handleToastError(error, "Não foi possível gerar uma sugestão de horário.");
        } finally {
            setIsLoadingSuggestion(null);
        }
    };

    const handleImplementSuggestion = (mission) => {
        const suggestion = suggestions[mission.id];
        if (!suggestion) return;
    
        const newRoutineItem = {
            id: Date.now(),
            start_time: suggestion.suggestedStartTime,
            end_time: suggestion.suggestedEndTime,
            activity: `[Missão] ${mission.nome}`
        };
    
        let dayRoutine = routine[selectedDay] || [];
    
        // If the suggestion modifies an existing block, split that block
        if (suggestion.modifiedBlockId) {
            const blockToModify = dayRoutine.find(item => item.id === suggestion.modifiedBlockId);
            
            if (blockToModify) {
                const originalStart = blockToModify.start_time;
                const originalEnd = blockToModify.end_time;
                const suggestionStart = suggestion.suggestedStartTime;
                const suggestionEnd = suggestion.suggestedEndTime;
    
                // Remove the original block
                let updatedRoutine = dayRoutine.filter(item => item.id !== suggestion.modifiedBlockId);
    
                // Add the new mission block
                updatedRoutine.push(newRoutineItem);
    
                // Add the first part of the original block if there's time before the mission
                if (suggestionStart > originalStart) {
                    updatedRoutine.push({
                        ...blockToModify,
                        id: Date.now() + 1, // new id
                        end_time: suggestionStart,
                    });
                }
    
                // Add the second part of the original block if there's time after the mission
                if (suggestionEnd < originalEnd) {
                    updatedRoutine.push({
                        ...blockToModify,
                        id: Date.now() + 2, // new id
                        start_time: suggestionEnd,
                    });
                }
                setRoutine(prev => ({...prev, [selectedDay]: updatedRoutine}));
            } else {
                 // Fallback if block not found: just add the mission
                const newDayRoutine = [...dayRoutine, newRoutineItem];
                setRoutine(prev => ({...prev, [selectedDay]: newDayRoutine}));
            }
        } else {
            // If no block is modified, just add the new item
            const newDayRoutine = [...dayRoutine, newRoutineItem];
            setRoutine(prev => ({...prev, [selectedDay]: newDayRoutine}));
        }
    
        // Remove suggestion after implementing
        setSuggestions(prev => {
            const newSuggestions = {...prev};
            delete newSuggestions[mission.id];
            return newSuggestions;
        });
    };

    const handleDiscardSuggestion = (missionId) => {
         setSuggestions(prev => {
            const newSuggestions = {...prev};
            delete newSuggestions[missionId];
            return newSuggestions;
        });
    }

    const getUnscheduledMissions = () => {
        const currentDayActivities = (routine[selectedDay] || []).map(r => r.activity);

        const visibleEpicMissions = [];
        const missionsByGoal = missions.reduce((acc, mission) => {
            if (!acc[mission.meta_associada]) {
                acc[mission.meta_associada] = [];
            }
            acc[mission.meta_associada].push(mission);
            return acc;
        }, {});

        for (const goalName in missionsByGoal) {
            const goalMissions = missionsByGoal[goalName]
                .filter(m => !m.concluido)
                .sort((a, b) => rankOrder.indexOf(a.rank) - rankOrder.indexOf(b.rank));

            if (goalMissions.length > 0) {
                visibleEpicMissions.push(goalMissions[0]);
            }
        }

        const activeDailyMissions = visibleEpicMissions.map(epicMission => {
            return epicMission.missoes_diarias.find(dm => !dm.concluido);
        }).filter(Boolean);

        const unscheduled = activeDailyMissions.filter(dailyMission => 
            !currentDayActivities.some(routineActivity => routineActivity.includes(`[Missão] ${dailyMission.nome}`))
        );

        return unscheduled;
    };


    const sortedRoutineForDay = (routine[selectedDay] || []).sort((a, b) => a.start_time.localeCompare(b.start_time));
    const unscheduledMissions = getUnscheduledMissions();

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-cyan-400">Rotina Semanal</h1>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setShowSaveTemplateDialog(true)}>
                        <Save className="h-5 w-5 mr-2" />
                        Salvar como Template
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline">
                               <FileDown className="h-5 w-5 mr-2" />
                               Carregar Template
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            {Object.keys(routineTemplates).map(templateName => (
                                <DropdownMenuItem key={templateName} onSelect={() => handleLoadTemplate(templateName)}>
                                    {templateName}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Button onClick={() => handleOpenDialog()} className="bg-cyan-600 hover:bg-cyan-500">
                        <PlusCircle className="h-5 w-5 mr-2" />
                        Adicionar Atividade
                    </Button>
                </div>
            </div>
             <p className="text-gray-400 mb-6">Mantenha a sua rotina semanal atualizada para que o Sistema possa sugerir os melhores horários para as suas missões.</p>

            <Tabs defaultValue={selectedDay} onValueChange={setSelectedDay} className="w-full">
                <TabsList className="grid w-full grid-cols-7">
                    {weekDays.map(day => (
                       <TabsTrigger 
                            key={day.name} 
                            value={day.name} 
                            className={cn(
                                "flex-col p-2 h-auto capitalize data-[state=active]:bg-gray-700",
                                day.isToday && "bg-cyan-500/20 text-cyan-300"
                            )}
                        >
                            <span>{day.name.substring(0,3)}</span>
                            <span className="font-bold text-lg">{day.date}</span>
                        </TabsTrigger>
                    ))}
                </TabsList>
                
                {dayNames.map(day => (
                    <TabsContent key={day} value={day}>
                        {/* Unscheduled Missions Section */}
                        {unscheduledMissions.length > 0 && (
                            <div className="my-8">
                                <h2 className="text-2xl font-bold text-cyan-400 mb-4">Missões por Agendar</h2>
                                <div className="space-y-4">
                                    {unscheduledMissions.map(mission => (
                                        <div key={mission.id} className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="font-bold text-gray-200">{mission.nome}</p>
                                                    <p className="text-sm text-gray-400">{mission.descricao}</p>
                                                </div>
                                                <Button 
                                                    onClick={() => handleGetSuggestion(mission)} 
                                                    disabled={isLoadingSuggestion === mission.id}
                                                    size="sm"
                                                >
                                                    {isLoadingSuggestion === mission.id ? "A analisar..." : "Sugerir Horário"}
                                                    <BrainCircuit className="ml-2 h-4 w-4"/>
                                                </Button>
                                            </div>
                                            {suggestions[mission.id] && (
                                                <Alert className="mt-4 border-cyan-500/50">
                                                    <Sparkles className="h-4 w-4 text-cyan-400" />
                                                    <AlertTitle className="text-cyan-400">Sugestão do Sistema</AlertTitle>
                                                    <AlertDescription className="text-gray-300">
                                                        {suggestions[mission.id].suggestionText}
                                                        <div className="flex gap-2 mt-3">
                                                            <Button size="sm" onClick={() => handleImplementSuggestion(mission)}>Implementar</Button>
                                                            <Button size="sm" variant="outline" onClick={() => handleDiscardSuggestion(mission.id)}>Descartar</Button>
                                                        </div>
                                                    </AlertDescription>
                                                </Alert>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="border-t border-gray-700 pt-8">
                            <h2 className="text-2xl font-bold text-cyan-400 mb-4 capitalize">Agenda de {day}</h2>
                            <div className="space-y-3">
                                {sortedRoutineForDay.map(item => (
                                    <div key={item.id} className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 flex items-center justify-between">
                                        <div className="flex items-center">
                                            <span className="text-cyan-400 font-mono text-lg">{item.start_time} - {item.end_time}</span>
                                            <span className="mx-4 text-gray-500">|</span>
                                            <p className="text-lg text-gray-200">{item.activity}</p>
                                        </div>
                                        <div className="flex space-x-2">
                                            <Button onClick={() => handleOpenDialog(item)} variant="ghost" size="icon" className="text-gray-400 hover:text-yellow-400"><Edit className="h-5 w-5" /></Button>
                                            <Button onClick={() => handleDelete(item.id)} variant="ghost" size="icon" className="text-gray-400 hover:text-red-400"><Trash2 className="h-5 w-5" /></Button>
                                        </div>
                                    </div>
                                ))}
                                {sortedRoutineForDay.length === 0 && (
                                    <div className="text-center py-10 border-2 border-dashed border-gray-700 rounded-lg">
                                        <p className="text-gray-400">Nenhuma atividade agendada para este dia.</p>
                                        <p className="text-gray-500 text-sm">Adicione atividades para começar.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                    </TabsContent>
                ))}
            </Tabs>


            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{currentItem ? 'Editar Atividade' : 'Adicionar Atividade'}</DialogTitle>
                        <DialogDescription>
                            A atividade será adicionada à agenda de <span className="font-bold capitalize text-cyan-400">{selectedDay}</span>.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="start_time" className="text-right">Início</Label>
                            <Input id="start_time" type="time" value={editedItem.start_time} onChange={(e) => setEditedItem({...editedItem, start_time: e.target.value})} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="end_time" className="text-right">Fim</Label>
                            <Input id="end_time" type="time" value={editedItem.end_time} onChange={(e) => setEditedItem({...editedItem, end_time: e.target.value})} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="activity" className="text-right">Atividade</Label>
                            <Input id="activity" value={editedItem.activity} onChange={(e) => setEditedItem({...editedItem, activity: e.target.value})} className="col-span-3" placeholder="Ex: Trabalho, Almoço, Exercício"/>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleSave}>Salvar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            
            <AlertDialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Carregar Template de Rotina?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Isto irá substituir todas as atividades agendadas para <span className="font-bold capitalize text-cyan-400">{selectedDay}</span>. Tem a certeza?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setSelectedTemplate(null)}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmLoadTemplate}>Sim, carregar</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

             <Dialog open={showSaveTemplateDialog} onOpenChange={setShowSaveTemplateDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Salvar Rotina como Template</DialogTitle>
                        <DialogDescription>
                           Dê um nome ao seu template para a rotina de <span className="font-bold capitalize text-cyan-400">{selectedDay}</span>.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                         <Input 
                            id="templateName" 
                            placeholder="Ex: Dia de Semana Produtivo"
                            value={newTemplateName}
                            onChange={(e) => setNewTemplateName(e.target.value)}
                         />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowSaveTemplateDialog(false)}>Cancelar</Button>
                        <Button onClick={handleSaveTemplate}>Salvar Template</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    );
};
