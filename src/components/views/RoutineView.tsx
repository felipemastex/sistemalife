
"use client";

import { useState, useEffect } from 'react';
import { PlusCircle, Edit, Trash2, Save, FileDown, BrainCircuit, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generateRoutineSuggestion } from '@/ai/flows/generate-routine-suggestion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';


export const RoutineView = ({ initialRoutine, persistRoutine, missions, initialTemplates, persistTemplates }) => {
    const [routine, setRoutine] = useState(initialRoutine);
    const [routineTemplates, setRoutineTemplates] = useState(initialTemplates);

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState(null);
    const [editedItem, setEditedItem] = useState({ id: null, start_time: '', end_time: '', activity: '' });
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
    
    // State for deleting template
    const [templateToDelete, setTemplateToDelete] = useState(null);


    useEffect(() => {
        setRoutine(initialRoutine);
    }, [initialRoutine]);
    
    useEffect(() => {
        setRoutineTemplates(initialTemplates);
    }, [initialTemplates]);

    const handleRoutineChange = (newRoutine) => {
        setRoutine(newRoutine);
        persistRoutine(newRoutine);
    }
    
    const handleTemplateChange = (newTemplates) => {
        setRoutineTemplates(newTemplates);
        persistTemplates(newTemplates);
    }

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
            setEditedItem({ id: item.id, start_time: item.start_time, end_time: item.end_time, activity: item.activity });
        } else {
            setEditedItem({ id: null, start_time: '', end_time: '', activity: '' });
        }
        setIsDialogOpen(true);
    };

    const handleOpenManualAdd = (mission) => {
        setCurrentItem(null); // Ensure it's in "add new" mode
        setEditedItem({
            id: null,
            start_time: '',
            end_time: '',
            activity: `[Missão] ${mission.nome}`
        });
        setIsDialogOpen(true);
    };

    const handleSave = () => {
        if (!editedItem.start_time || !editedItem.end_time || !editedItem.activity) {
            toast({ variant: 'destructive', title: 'Campos em Falta', description: 'Por favor, preencha todos os campos.' });
            return;
        }

        const currentDayRoutine = routine[selectedDay] || [];
        let updatedDayRoutine;

        if (currentItem) {
            // Edit existing item
            updatedDayRoutine = currentDayRoutine.map(item => item.id === currentItem.id ? { ...item, ...editedItem } : item);
        } else {
            // Add new item with overlap check
            const newItem = { ...editedItem, id: Date.now() };
            const overlappingItem = currentDayRoutine.find(item =>
                (newItem.start_time < item.end_time && newItem.end_time > item.start_time)
            );

            if (overlappingItem) {
                // Handle the overlap by splitting the existing block
                const remainingItems = currentDayRoutine.filter(item => item.id !== overlappingItem.id);
                const newItems = [newItem];

                // Check for time before the new item
                if (overlappingItem.start_time < newItem.start_time) {
                    newItems.push({
                        ...overlappingItem,
                        id: Date.now() + 1,
                        end_time: newItem.start_time
                    });
                }
                // Check for time after the new item
                if (overlappingItem.end_time > newItem.end_time) {
                    newItems.push({
                        ...overlappingItem,
                        id: Date.now() + 2,
                        start_time: newItem.end_time
                    });
                }
                updatedDayRoutine = [...remainingItems, ...newItems];
                toast({ title: 'Rotina Ajustada', description: 'O bloco de tempo existente foi ajustado automaticamente.' });
            } else {
                // No overlap, just add the new item
                updatedDayRoutine = [...currentDayRoutine, newItem];
            }
        }
        
        handleRoutineChange({ ...routine, [selectedDay]: updatedDayRoutine });
        setIsDialogOpen(false);
    };


    const handleDelete = (id) => {
        const currentDayRoutine = routine[selectedDay] || [];
        const updatedDayRoutine = currentDayRoutine.filter(item => item.id !== id);
        handleRoutineChange({...routine, [selectedDay]: updatedDayRoutine});
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
            handleRoutineChange({ ...routine, [selectedDay]: templateWithNewIds });
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

        handleTemplateChange({ ...routineTemplates, [newTemplateName]: currentDayRoutine });
        toast({ title: "Template Salvo!", description: `O template "${newTemplateName}" foi criado com sucesso.` });
        setShowSaveTemplateDialog(false);
        setNewTemplateName('');
    }
    
    const confirmDeleteTemplate = () => {
        if (!templateToDelete) return;
        const newTemplates = { ...routineTemplates };
        delete newTemplates[templateToDelete];
        handleTemplateChange(newTemplates);
        toast({ title: 'Template Eliminado', description: `O template "${templateToDelete}" foi removido.` });
        setTemplateToDelete(null);
    };


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
        let newDayRoutine;
    
        // If the suggestion modifies an existing block, split that block
        if (suggestion.modifiedBlockId) {
            const blockToModify = dayRoutine.find(item => item.id === suggestion.modifiedBlockId);
            
            if (blockToModify) {
                const originalStart = blockToModify.start_time;
                const originalEnd = blockToModify.end_time;
                const suggestionStart = suggestion.suggestedStartTime;
                const suggestionEnd = suggestion.suggestedEndTime;
    
                // Remove the original block
                let updatedRoutineItems = dayRoutine.filter(item => item.id !== suggestion.modifiedBlockId);
    
                // Add the new mission block
                updatedRoutineItems.push(newRoutineItem);
    
                // Add the first part of the original block if there's time before the mission
                if (suggestionStart > originalStart) {
                    updatedRoutineItems.push({
                        ...blockToModify,
                        id: Date.now() + 1, // new id
                        end_time: suggestionStart,
                    });
                }
    
                // Add the second part of the original block if there's time after the mission
                if (suggestionEnd < originalEnd) {
                    updatedRoutineItems.push({
                        ...blockToModify,
                        id: Date.now() + 2, // new id
                        start_time: suggestionEnd,
                    });
                }
                newDayRoutine = updatedRoutineItems;
            } else {
                 // Fallback if block not found: just add the mission
                newDayRoutine = [...dayRoutine, newRoutineItem];
            }
        } else {
            // If no block is modified, just add the new item
            newDayRoutine = [...dayRoutine, newRoutineItem];
        }
        
        handleRoutineChange({...routine, [selectedDay]: newDayRoutine});
    
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
        <div className="p-4 md:p-6 h-full overflow-y-auto">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
                <h1 className="text-3xl font-bold text-cyan-400">Rotina Semanal</h1>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <Button variant="outline" onClick={() => setShowSaveTemplateDialog(true)} className="w-full sm:w-auto">
                        <Save className="h-5 w-5 mr-2" />
                        Salvar como Template
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="w-full sm:w-auto" disabled={Object.keys(routineTemplates).length === 0}>
                               <FileDown className="h-5 w-5 mr-2" />
                               Carregar Template
                            </Button>
                        </DropdownMenuTrigger>
                         <DropdownMenuContent>
                            {Object.keys(routineTemplates).length > 0 ? (
                                Object.keys(routineTemplates).map(templateName => (
                                    <AlertDialog key={templateName}>
                                        <div className="relative flex justify-between items-center w-full">
                                            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="flex-grow pr-8">
                                                <span onClick={() => handleLoadTemplate(templateName)} className="cursor-pointer">{templateName}</span>
                                            </DropdownMenuItem>
                                            <AlertDialogTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 text-gray-500 hover:text-red-400"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setTemplateToDelete(templateName);
                                                    }}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </AlertDialogTrigger>
                                        </div>
                                    </AlertDialog>
                                ))
                            ) : (
                                <DropdownMenuItem disabled>Nenhum template salvo</DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Button onClick={() => handleOpenDialog()} className="bg-cyan-600 hover:bg-cyan-500 w-full sm:w-auto">
                        <PlusCircle className="h-5 w-5 mr-2" />
                        Adicionar Atividade
                    </Button>
                </div>
            </div>
             <p className="text-gray-400 mb-6">Mantenha a sua rotina semanal atualizada para que o Sistema possa sugerir os melhores horários para as suas missões.</p>

            <Tabs defaultValue={selectedDay} onValueChange={setSelectedDay} className="w-full">
                <ScrollArea className="w-full whitespace-nowrap">
                    <TabsList className="inline-flex h-auto">
                        {weekDays.map(day => (
                           <TabsTrigger 
                                key={day.name} 
                                value={day.name} 
                                className={cn(
                                    "flex-col p-2 h-auto capitalize data-[state=active]:bg-gray-700 w-24",
                                    day.isToday && "bg-cyan-500/20 text-cyan-300"
                                )}
                            >
                                <span>{day.name.substring(0,3)}</span>
                                <span className="font-bold text-lg">{day.date}</span>
                            </TabsTrigger>
                        ))}
                    </TabsList>
                    <ScrollBar orientation="horizontal" />
                </ScrollArea>
                
                {dayNames.map(day => (
                    <TabsContent key={day} value={day} className="mt-6 animate-in fade-in-50 duration-500">
                        {unscheduledMissions.length > 0 && (
                            <div className="my-8 animate-in fade-in-50 duration-500">
                                <h2 className="text-2xl font-bold text-cyan-400 mb-4">Missões por Agendar</h2>
                                <div className="space-y-4">
                                    {unscheduledMissions.map(mission => (
                                        <div key={mission.id} className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                                            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                                <div className="w-full">
                                                    <p className="font-bold text-gray-200">{mission.nome}</p>
                                                    <p className="text-sm text-gray-400 mt-1">{mission.descricao}</p>
                                                </div>
                                                <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto flex-shrink-0">
                                                    <Button 
                                                        onClick={() => handleOpenManualAdd(mission)} 
                                                        size="sm"
                                                        variant="secondary"
                                                        className="w-full"
                                                    >
                                                        Adicionar Manualmente
                                                        <PlusCircle className="ml-2 h-4 w-4"/>
                                                    </Button>
                                                    <Button 
                                                        onClick={() => handleGetSuggestion(mission)} 
                                                        disabled={isLoadingSuggestion === mission.id}
                                                        size="sm"
                                                        className="w-full"
                                                    >
                                                        {isLoadingSuggestion === mission.id ? "A analisar..." : "Sugerir Horário"}
                                                        <BrainCircuit className="ml-2 h-4 w-4"/>
                                                    </Button>
                                                </div>
                                            </div>
                                            {suggestions[mission.id] && (
                                                <Alert className="mt-4 border-cyan-500/50 animate-in fade-in-50 duration-500">
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

                        <div className="border-t border-gray-700 pt-8 animate-in fade-in-50 duration-500">
                            <h2 className="text-2xl font-bold text-cyan-400 mb-4 capitalize">Agenda de {day}</h2>
                            <div className="space-y-3">
                                {sortedRoutineForDay.map(item => (
                                    <div key={item.id} className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-x-4 gap-y-1">
                                            <span className="text-cyan-400 font-mono text-lg">{item.start_time} - {item.end_time}</span>
                                            <p className="text-lg text-gray-200 break-all">{item.activity}</p>
                                        </div>
                                        <div className="flex space-x-2 self-end sm:self-center">
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
            
            <AlertDialog open={!!templateToDelete} onOpenChange={(open) => !open && setTemplateToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Eliminar Template?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem a certeza que quer eliminar o template "{templateToDelete}"? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDeleteTemplate}>Sim, eliminar</AlertDialogAction>
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
