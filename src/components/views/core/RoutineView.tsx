
"use client";

import { useState, useEffect, memo, useMemo } from 'react';
import { PlusCircle, Edit, Trash2, Save, FileDown, BrainCircuit, Sparkles, ChevronsUpDown, Calendar, List } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generateRoutineSuggestion } from '@/ai/flows/generate-routine-suggestion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { usePlayerDataContext } from '@/hooks/use-player-data';
import { format } from 'date-fns';

const timeToMinutes = (time: string) => {
    if (!time || !/^\d{2}:\d{2}$/.test(time)) return 0;
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
};


interface RoutineItem {
  id: string | number;
  activity: string;
  start_time: string;
  end_time: string;
}

interface Mission {
  id: string | number;
  nome: string;
  descricao: string;
}

interface Suggestions {
  [key: string]: {
    suggestionText: string;
    suggestedStartTime?: string;
    suggestedEndTime?: string;
    modifiedBlockId?: string | number;
  };
}

const AgendaView = ({ 
  routineItems, 
  onEditItem, 
  missions, 
  onSuggestTime, 
  onManualAdd, 
  isLoadingSuggestion, 
  suggestions, 
  onImplementSuggestion, 
  onDiscardSuggestion, 
  isPastDay 
}: { 
  routineItems: RoutineItem[]; 
  onEditItem: (item: RoutineItem) => void; 
  missions: Mission[]; 
  onSuggestTime: (mission: Mission) => void; 
  onManualAdd: (mission: Mission) => void; 
  isLoadingSuggestion: string | number | null; 
  suggestions: Suggestions; 
  onImplementSuggestion: (mission: Mission) => void; 
  onDiscardSuggestion: (missionId: string | number) => void; 
  isPastDay: boolean; 
}) => {
    const hours = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);

    const getPositionAndHeight = (item: RoutineItem) => {
        const startMinutes = timeToMinutes(item.start_time);
        const endMinutes = timeToMinutes(item.end_time);
        const duration = endMinutes - startMinutes;

        const top = (startMinutes / 60) * 60; // 60px per hour
        const height = (duration / 60) * 60;

        return { top, height };
    };

    return (
        <div className="flex flex-col lg:flex-row gap-8 overflow-hidden h-full">
            {/* Unscheduled Missions Column */}
            <div className="flex flex-col w-full lg:w-[450px] lg:flex-shrink-0">
                <h2 className="text-2xl font-bold text-primary mb-4 font-cinzel tracking-wider">Missões por Agendar</h2>
                <ScrollArea className="h-full pr-4 -mr-4">
                    <div className="space-y-3">
                        {missions.length > 0 ? (
                            missions.map(mission => (
                                <Collapsible key={mission.id} className="bg-card/60 border border-border rounded-lg">
                                    <CollapsibleTrigger className="w-full p-3 text-left">
                                         <div className="flex justify-between items-center gap-4">
                                            <CardTitle className="text-base flex-1">{mission.nome}</CardTitle>
                                            <ChevronsUpDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                         </div>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent className="px-3 pb-3">
                                        <div className="border-t border-border pt-3 mt-3 space-y-4">
                                            <p className="text-sm text-muted-foreground">{mission.descricao}</p>
                                            
                                            {suggestions[mission.id] && (
                                                <Alert className="border-primary/50 bg-primary/10 animate-in fade-in-50 duration-500">
                                                    <Sparkles className="h-4 w-4 text-primary" />
                                                    <AlertTitle className="text-primary">Sugestão do Sistema</AlertTitle>
                                                    <AlertDescription className="text-card-foreground">
                                                        {suggestions[mission.id].suggestionText}
                                                        <div className="flex gap-2 mt-3">
                                                            <Button size="sm" onClick={() => onImplementSuggestion(mission)} disabled={isPastDay}>Implementar</Button>
                                                            <Button size="sm" variant="ghost" onClick={() => onDiscardSuggestion(mission.id)}>Descartar</Button>
                                                        </div>
                                                    </AlertDescription>
                                                </Alert>
                                            )}

                                            <div className="flex flex-col sm:flex-row gap-2">
                                                <Button onClick={() => onManualAdd(mission)} size="sm" variant="secondary" className="w-full" disabled={isPastDay}>Adicionar Manualmente</Button>
                                                <Button onClick={() => onSuggestTime(mission)} disabled={isLoadingSuggestion === mission.id || isPastDay} size="sm" className="w-full">
                                                    {isLoadingSuggestion === mission.id ? "A analisar..." : "Sugerir Horário"}
                                                    <BrainCircuit className="ml-2 h-4 w-4"/>
                                                </Button>
                                            </div>
                                        </div>
                                    </CollapsibleContent>
                                </Collapsible>
                            ))
                        ) : (
                            <div className="text-center py-10 border-2 border-dashed border-border rounded-lg h-full flex flex-col justify-center items-center">
                                <p className="text-muted-foreground">Nenhuma missão por agendar.</p>
                                <p className="text-muted-foreground/70 text-sm">Bom trabalho, Caçador!</p>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </div>
            {/* Agenda View */}
            <div className="flex-1 min-w-0">
                 <h2 className="text-2xl font-bold text-primary mb-4 capitalize font-cinzel tracking-wider">Agenda</h2>
                <ScrollArea className="h-full pr-4 -mr-4">
                    <div className="relative">
                        {/* Hours timeline */}
                        {hours.map(hour => (
                            <div key={hour} className="h-[60px] flex items-start border-t border-border/50">
                                <span className="text-xs text-muted-foreground -mt-2.5 mr-2 bg-background px-1">{hour}</span>
                            </div>
                        ))}
                        {/* Events */}
                        {routineItems.map(item => {
                            const { top, height } = getPositionAndHeight(item);
                            return (
                                <div
                                    key={item.id}
                                    className="absolute left-16 right-0 bg-primary/20 border-l-4 border-primary p-2 rounded-r-lg cursor-pointer"
                                    style={{ top: `${top}px`, height: `${height}px` }}
                                    onClick={() => onEditItem(item)}
                                >
                                    <p className="font-bold text-sm text-foreground truncate">{item.activity}</p>
                                    <p className="text-xs text-primary">{item.start_time} - {item.end_time}</p>
                                </div>
                            )
                        })}
                    </div>
                </ScrollArea>
            </div>
        </div>
    )
}

const ListView = ({ 
  routineItems, 
  onEditItem, 
  missions, 
  onSuggestTime, 
  onManualAdd, 
  isLoadingSuggestion, 
  suggestions, 
  onImplementSuggestion, 
  onDiscardSuggestion, 
  onDeleteItem, 
  isPastDay 
}: { 
  routineItems: RoutineItem[]; 
  onEditItem: (item: RoutineItem) => void; 
  missions: Mission[]; 
  onSuggestTime: (mission: Mission) => void; 
  onManualAdd: (mission: Mission) => void; 
  isLoadingSuggestion: string | number | null; 
  suggestions: Suggestions; 
  onImplementSuggestion: (mission: Mission) => void; 
  onDiscardSuggestion: (missionId: string | number) => void; 
  onDeleteItem: (itemId: string | number) => void; 
  isPastDay: boolean; 
}) => (
    <div className="flex flex-col lg:flex-row gap-8 overflow-hidden h-full">
        {/* Agenda List View */}
        <div className="flex flex-col flex-1 min-w-0">
             <h2 className="text-2xl font-bold text-primary mb-4 capitalize font-cinzel tracking-wider">Agenda de Hoje</h2>
            <ScrollArea className="h-full pr-4 -mr-4">
                <div className="relative pl-6">
                    <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-border/50"></div>
                    <div className="space-y-3">
                        {routineItems.map(item => (
                            <div key={item.id} className="relative pl-6">
                                <div className="absolute -left-1.5 top-1 h-3 w-3 bg-primary rounded-full border-2 border-background"></div>
                                <div className="bg-card/80 border border-border rounded-lg p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-x-4 gap-y-1">
                                        <span className="text-primary font-mono text-base">{item.start_time} - {item.end_time}</span>
                                        <p className="text-base text-card-foreground break-all">{item.activity}</p>
                                    </div>
                                    <div className="flex space-x-1 self-end sm:self-center">
                                        <Button onClick={() => onEditItem(item)} variant="ghost" size="icon" className="text-muted-foreground hover:text-yellow-400 h-8 w-8" aria-label={`Editar atividade ${item.activity}`}><Edit className="h-4 w-4" /></Button>
                                        <Button onClick={() => onDeleteItem(item.id)} variant="ghost" size="icon" className="text-muted-foreground hover:text-red-400 h-8 w-8" aria-label={`Excluir atividade ${item.activity}`}><Trash2 className="h-4 w-4" /></Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {routineItems.length === 0 && (
                            <div className="text-center py-10 border-2 border-dashed border-border rounded-lg ml-[-24px]">
                                <p className="text-muted-foreground">Nenhuma atividade agendada.</p>
                            </div>
                        )}
                    </div>
                </div>
            </ScrollArea>
        </div>
        {/* Unscheduled Missions Column */}
        <div className="flex flex-col w-full lg:w-[450px] lg:flex-shrink-0">
            <h2 className="text-2xl font-bold text-primary mb-4 font-cinzel tracking-wider">Missões por Agendar</h2>
            <ScrollArea className="h-full pr-4 -mr-4">
                <div className="space-y-3">
                    {missions.length > 0 ? (
                        missions.map(mission => (
                            <Collapsible key={mission.id} className="bg-card/60 border border-border rounded-lg">
                                <CollapsibleTrigger className="w-full p-3 text-left">
                                    <div className="flex justify-between items-center gap-4">
                                        <CardTitle className="text-base flex-1">{mission.nome}</CardTitle>
                                        <ChevronsUpDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                    </div>
                                </CollapsibleTrigger>
                                <CollapsibleContent className="px-3 pb-3">
                                    <div className="border-t border-border pt-3 mt-3 space-y-4">
                                        <p className="text-sm text-muted-foreground">{mission.descricao}</p>
                                        
                                        {suggestions[mission.id] && (
                                            <Alert className="border-primary/50 bg-primary/10 animate-in fade-in-50 duration-500">
                                                <Sparkles className="h-4 w-4 text-primary" />
                                                <AlertTitle className="text-primary">Sugestão do Sistema</AlertTitle>
                                                <AlertDescription className="text-card-foreground">
                                                    {suggestions[mission.id].suggestionText}
                                                    <div className="flex gap-2 mt-3">
                                                        <Button size="sm" onClick={() => onImplementSuggestion(mission)} disabled={isPastDay}>Implementar</Button>
                                                        <Button size="sm" variant="ghost" onClick={() => onDiscardSuggestion(mission.id)}>Descartar</Button>
                                                    </div>
                                                </AlertDescription>
                                            </Alert>
                                        )}

                                        <div className="flex flex-col sm:flex-row gap-2">
                                            <Button onClick={() => onManualAdd(mission)} size="sm" variant="secondary" className="w-full" disabled={isPastDay}>Adicionar Manualmente</Button>
                                            <Button onClick={() => onSuggestTime(mission)} disabled={isLoadingSuggestion === mission.id || isPastDay} size="sm" className="w-full">
                                                {isLoadingSuggestion === mission.id ? "A analisar..." : "Sugerir Horário"}
                                                <BrainCircuit className="ml-2 h-4 w-4"/>
                                            </Button>
                                        </div>
                                    </div>
                                </CollapsibleContent>
                            </Collapsible>
                        ))
                    ) : (
                        <div className="text-center py-10 border-2 border-dashed border-border rounded-lg h-full flex flex-col justify-center items-center">
                            <p className="text-muted-foreground">Nenhuma missão por agendar.</p>
                            <p className="text-muted-foreground/70 text-sm">Bom trabalho, Caçador!</p>
                        </div>
                    )}
                </div>
            </ScrollArea>
        </div>
    </div>
);


interface EditedItem {
  id: string | number;
  start_time: string;
  end_time: string;
  activity: string;
}

interface RankedMission {
  id: string | number;
  nome: string;
  descricao: string;
  concluido: boolean;
  rank: string;
  level_requirement: number;
  meta_associada: string;
  total_missoes_diarias: number;
  ultima_missao_concluida_em: string | null;
  missoes_diarias: DailyMission[];
  isManual?: boolean;
  subTasks?: SubTask[];
}

interface DailyMission {
  id: string | number;
  nome: string;
  descricao: string;
  xp_conclusao: number;
  fragmentos_conclusao: number;
  concluido: boolean;
  tipo: string;
  subTasks: SubTask[];
  learningResources?: string[];
  completed_at?: string;
}

interface SubTask {
  name: string;
  target: number;
  unit: string;
  current: number;
}

const RoutineViewComponent = () => {
    const { profile, missions, persistData } = usePlayerDataContext();
    const [viewMode, setViewMode] = useState<'agenda' | 'list'>('agenda');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [editedItem, setEditedItem] = useState<EditedItem | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isLoadingSuggestion, setIsLoadingSuggestion] = useState<string | number | null>(null);
    const [suggestions, setSuggestions] = useState<Suggestions>({});
    const [showSaveTemplateDialog, setShowSaveTemplateDialog] = useState(false);
    const [newTemplateName, setNewTemplateName] = useState('');
    const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
    const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);
    const [selectedDay, setSelectedDay] = useState('');
    const [showTemplateDialog, setShowTemplateDialog] = useState(false);
    const [routineTemplates, setRoutineTemplates] = useState<any>({});
    const { toast } = useToast();

    const rankOrder = ['F', 'E', 'D', 'C', 'B', 'A', 'S', 'SS', 'SSS'];
    const dayNames = ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"];
    const today = new Date();

    const dayIndex = today.getDay();
    const weekDays = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(today);
        date.setDate(today.getDate() - dayIndex + i);
        return {
            name: dayNames[date.getDay()],
            date: date.getDate(),
            isToday: date.toDateString() === today.toDateString(),
            isPast: date < today,
        };
    });

    const handleToastError = (error: any, customMessage = 'Não foi possível continuar. O Sistema pode estar sobrecarregado.') => {
        console.error("Erro de IA:", error);
        if (error instanceof Error && (error.message.includes('429') || error.message.includes('Quota'))) {
            toast({ variant: 'destructive', title: 'Quota de IA Excedida', description: 'Você atingiu o limite de pedidos. Tente novamente mais tarde.' });
        } else {
            toast({ variant: 'destructive', title: 'Erro de IA', description: customMessage });
        }
    };

    const handleOpenEditDialog = (item: RoutineItem) => {
        setEditedItem({ id: item.id, start_time: item.start_time, end_time: item.end_time, activity: item.activity });
        setIsDialogOpen(true);
    };

    const handleOpenManualAdd = (mission: Mission) => {
        const startTime = "09:00";
        const endTime = "10:00";
        setEditedItem({ 
            id: `temp_${Date.now()}`, 
            start_time: startTime, 
            end_time: endTime, 
            activity: mission.nome 
        });
        setIsDialogOpen(true);
    };

    const handleSaveItem = () => {
        if (!editedItem) return;
        
        const currentItem = editedItem;
        const currentDayRoutine: RoutineItem[] = profile.rotina?.[format(currentDate, 'yyyy-MM-dd')] || [];
        let updatedDayRoutine: RoutineItem[] = [];
        
        if (currentItem.id.toString().startsWith('temp_')) {
            // Adding new item
            const newItem = { ...currentItem, id: Date.now() };
            updatedDayRoutine = [...currentDayRoutine, newItem];
        } else {
            // Editing existing item
            updatedDayRoutine = currentDayRoutine.map((item: RoutineItem) => item.id === currentItem.id ? { ...item, ...editedItem } : item);
        }
        
        // Check for time conflicts
        const overlappingItem = currentDayRoutine.find((item: RoutineItem) =>
            item.id !== currentItem.id &&
            (
                (timeToMinutes(currentItem.start_time) >= timeToMinutes(item.start_time) && timeToMinutes(currentItem.start_time) < timeToMinutes(item.end_time)) ||
                (timeToMinutes(currentItem.end_time) > timeToMinutes(item.start_time) && timeToMinutes(currentItem.end_time) <= timeToMinutes(item.end_time)) ||
                (timeToMinutes(currentItem.start_time) <= timeToMinutes(item.start_time) && timeToMinutes(currentItem.end_time) >= timeToMinutes(item.end_time))
            )
        );
        
        if (overlappingItem) {
            toast({ variant: 'destructive', title: 'Conflito de Horário', description: `Esta atividade sobrepõe-se com "${overlappingItem.activity}".` });
            const remainingItems = currentDayRoutine.filter((item: RoutineItem) => item.id !== overlappingItem.id);
            updatedDayRoutine = [...remainingItems, { ...overlappingItem, ...currentItem }];
        }
        
        const updatedRoutine = { ...profile.rotina, [format(currentDate, 'yyyy-MM-dd')]: updatedDayRoutine };
        persistData('profile', { ...profile, rotina: updatedRoutine });
        setIsDialogOpen(false);
        setEditedItem(null);
    };

    const handleDeleteItem = (id: string | number) => {
        const currentDayRoutine = profile.rotina?.[format(currentDate, 'yyyy-MM-dd')] || [];
        const updatedDayRoutine = currentDayRoutine.filter((item: RoutineItem) => item.id !== id);
        const updatedRoutine = { ...profile.rotina, [format(currentDate, 'yyyy-MM-dd')]: updatedDayRoutine };
        persistData('profile', { ...profile, rotina: updatedRoutine });
    };

    const handleGetSuggestion = async (mission: Mission) => {
        setIsLoadingSuggestion(mission.id);
        try {
            const result = await generateRoutineSuggestion({
                routine: profile.rotina?.[format(currentDate, 'yyyy-MM-dd')] || [],
                dayOfWeek: weekDays.find(d => d.date === currentDate.getDate())?.name || '',
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

    const handleImplementSuggestion = (mission: Mission) => {
        const suggestion = suggestions[mission.id];
        if (!suggestion) return;

        const dayRoutine: RoutineItem[] = profile.rotina?.[format(currentDate, 'yyyy-MM-dd')] || [];
        
        // Create a new routine item based on the suggestion
        const newRoutineItem: RoutineItem = {
            id: Date.now(),
            activity: mission.nome,
            start_time: suggestion.suggestedStartTime || "09:00",
            end_time: suggestion.suggestedEndTime || "10:00",
        };

        // If the suggestion modifies an existing block
        if (suggestion.modifiedBlockId) {
            const blockToModify = dayRoutine.find((item: RoutineItem) => item.id === suggestion.modifiedBlockId);
            if (blockToModify) {
                const suggestionStart = suggestion.suggestedStartTime;
                const suggestionEnd = suggestion.suggestedEndTime;
                
                // Remove the old block and add the new one
                let updatedRoutineItems = dayRoutine.filter((item: RoutineItem) => item.id !== suggestion.modifiedBlockId);
                updatedRoutineItems.push(newRoutineItem);
                
                const updatedRoutine = { ...profile.rotina, [format(currentDate, 'yyyy-MM-dd')]: updatedRoutineItems };
                persistData('profile', { ...profile, rotina: updatedRoutine });
                toast({ title: "Sugestão Implementada", description: `A sugestão para "${mission.nome}" foi adicionada à sua agenda.` });
                
                // Remove the suggestion
                const updatedSuggestions = { ...suggestions };
                delete updatedSuggestions[mission.id];
                setSuggestions(updatedSuggestions);
                return;
            }
        }

        // Otherwise, just add the new item to the routine
        const updatedRoutineItems = [...dayRoutine, newRoutineItem];
        const updatedRoutine = { ...profile.rotina, [format(currentDate, 'yyyy-MM-dd')]: updatedRoutineItems };
        persistData('profile', { ...profile, rotina: updatedRoutine });
        toast({ title: "Sugestão Implementada", description: `A sugestão para "${mission.nome}" foi adicionada à sua agenda.` });
        
        // Remove the suggestion
        const updatedSuggestions = { ...suggestions };
        delete updatedSuggestions[mission.id];
        setSuggestions(updatedSuggestions);
    };

    const handleDiscardSuggestion = (missionId: string | number) => {
         setSuggestions(prev => {
            const newSuggestions = {...prev};
            delete newSuggestions[missionId];
            return newSuggestions;
        });
    }

    const handleLoadTemplate = (templateName: string) => {
        setSelectedTemplate(templateName);
        setShowTemplateDialog(true);
    };

    const confirmLoadTemplate = () => {
        if (selectedTemplate) {
            // Implementation would go here
            setShowTemplateDialog(false);
            setSelectedTemplate(null);
        }
    };

    const confirmDeleteTemplate = () => {
        if (templateToDelete) {
            // Implementation would go here
            setTemplateToDelete(null);
        }
    };

    const handleSave = () => {
        handleSaveItem();
    };

    const handleDelete = (id: string | number) => {
        handleDeleteItem(id);
    };

    const handleSaveTemplate = () => {
        // Implementation would go here
        setShowSaveTemplateDialog(false);
    };

    const getUnscheduledMissions = () => {
        const allScheduledActivities = Object.values(profile.rotina || {}).flat().map((r: any) => r.activity);
    
        const visibleEpicMissions: RankedMission[] = [];
        const missionsByGoal = missions.reduce((acc: any, mission: RankedMission) => {
            if (!acc[mission.meta_associada]) {
                acc[mission.meta_associada] = [];
            }
            acc[mission.meta_associada].push(mission);
            return acc;
        }, {});
    
        for (const goalName in missionsByGoal) {
            const goalMissions: RankedMission[] = missionsByGoal[goalName]
                .filter((m: RankedMission) => !m.concluido)
                .sort((a: RankedMission, b: RankedMission) => rankOrder.indexOf(a.rank) - rankOrder.indexOf(b.rank));
    
            if (goalMissions.length > 0) {
                visibleEpicMissions.push(goalMissions[0]);
            }
        }
    
        const activeDailyMissions: DailyMission[] = visibleEpicMissions.flatMap((epicMission: RankedMission) => 
            epicMission.missoes_diarias.find((dm: DailyMission) => !dm.concluido) || []
        );
        
        const unscheduled = activeDailyMissions.filter((dailyMission: DailyMission) => {
            const missionActivity = `[Missão] ${dailyMission.nome}`;
            return !allScheduledActivities.some((activity: string) => activity === missionActivity);
        });
        
        return unscheduled;
    };


    const sortedRoutineForDay = (profile.rotina?.[format(currentDate, 'yyyy-MM-dd')] || []).sort((a: RoutineItem, b: RoutineItem) => a.start_time.localeCompare(b.start_time));
    const unscheduledMissions = getUnscheduledMissions();
    const isCurrentDayPast = weekDays.find(d => d.date === currentDate.getDate())?.isPast || false;

    // Initialize selectedDay
    useEffect(() => {
        const today = new Date();
        const dayNames = ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"];
        setSelectedDay(dayNames[today.getDay()]);
    }, []);

    const handleOpenDialog = (item?: RoutineItem) => {
        if (item) {
            setEditedItem({ id: item.id, start_time: item.start_time, end_time: item.end_time, activity: item.activity });
        } else {
            const startTime = "09:00";
            const endTime = "10:00";
            setEditedItem({ 
                id: `temp_${Date.now()}`, 
                start_time: startTime, 
                end_time: endTime, 
                activity: "" 
            });
        }
        setIsDialogOpen(true);
    };

    return (
        <div className="p-4 md:p-6 h-full flex flex-col">
            <div className="flex-shrink-0">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
                    <h1 className="text-3xl font-bold text-cyan-400 font-cinzel tracking-wider">Rotina Semanal</h1>
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
                                                        aria-label={`Excluir template ${templateName}`}
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

                        <Button onClick={() => handleOpenDialog()} className="bg-cyan-600 hover:bg-cyan-500 w-full sm:w-auto" disabled={isCurrentDayPast}>
                            <PlusCircle className="h-5 w-5 mr-2" />
                            Adicionar Atividade
                        </Button>
                    </div>
                </div>
                <p className="text-gray-400 mb-6 max-w-4xl">Mantenha a sua rotina semanal atualizada para que o Sistema possa sugerir os melhores horários para as suas missões.</p>

                 <Tabs defaultValue={selectedDay} onValueChange={setSelectedDay} className="w-full">
                    <ScrollArea className="w-full whitespace-nowrap">
                        <TabsList className="inline-flex h-auto bg-card/60 p-1 rounded-lg">
                            {weekDays.map(day => (
                            <TabsTrigger 
                                key={day.name} 
                                value={day.name} 
                                className={cn(
                                    "flex-col p-2 h-auto capitalize data-[state=active]:bg-secondary data-[state=active]:text-foreground data-[state=active]:shadow-md w-24 text-muted-foreground",
                                    day.isToday && "border-b-2 border-primary",
                                    day.isPast && "opacity-60"
                                )}
                            >
                                <span>{day.name.substring(0,3)}</span>
                                <span className="font-bold text-lg">{day.date}</span>
                            </TabsTrigger>
                            ))}
                        </TabsList>
                        <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                    <TabsContent value={selectedDay} className="mt-6 flex-grow animate-in fade-in-50 duration-500 h-full">
                        <Tabs defaultValue="lista" className="h-full flex flex-col">
                            <TabsList className="grid w-full grid-cols-2 max-w-sm self-start mb-4">
                                <TabsTrigger value="lista"><List className="mr-2 h-4 w-4"/>Lista</TabsTrigger>
                                <TabsTrigger value="agenda"><Calendar className="mr-2 h-4 w-4"/>Agenda</TabsTrigger>
                            </TabsList>
                            <TabsContent value="lista" className="flex-grow">
                                <ListView 
                                    routineItems={sortedRoutineForDay}
                                    onEditItem={handleOpenDialog}
                                    onDeleteItem={handleDelete}
                                    missions={unscheduledMissions}
                                    onSuggestTime={handleGetSuggestion}
                                    onManualAdd={handleOpenManualAdd}
                                    isLoadingSuggestion={isLoadingSuggestion}
                                    suggestions={suggestions}
                                    onImplementSuggestion={handleImplementSuggestion}
                                    onDiscardSuggestion={handleDiscardSuggestion}
                                    isPastDay={isCurrentDayPast}
                                />
                            </TabsContent>
                            <TabsContent value="agenda" className="flex-grow">
                                <AgendaView 
                                    routineItems={sortedRoutineForDay}
                                    onEditItem={handleOpenDialog}
                                    missions={unscheduledMissions}
                                    onSuggestTime={handleGetSuggestion}
                                    onManualAdd={handleOpenManualAdd}
                                    isLoadingSuggestion={isLoadingSuggestion}
                                    suggestions={suggestions}
                                    onImplementSuggestion={handleImplementSuggestion}
                                    onDiscardSuggestion={handleDiscardSuggestion}
                                    isPastDay={isCurrentDayPast}
                                />
                            </TabsContent>
                        </Tabs>
                    </TabsContent>
                </Tabs>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editedItem ? 'Editar Atividade' : 'Adicionar Atividade'}</DialogTitle>
                        <DialogDescription>
                            A atividade será adicionada à agenda de <span className="font-bold capitalize text-primary">{selectedDay}</span>.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="start_time" className="text-right">Início</Label>
                            <Input 
                                id="start_time" 
                                type="time" 
                                value={editedItem?.start_time || "09:00"} 
                                onChange={(e) => setEditedItem(editedItem ? {...editedItem, start_time: e.target.value} : null)} 
                                className="col-span-3" 
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="end_time" className="text-right">Fim</Label>
                            <Input 
                                id="end_time" 
                                type="time" 
                                value={editedItem?.end_time || "10:00"} 
                                onChange={(e) => setEditedItem(editedItem ? {...editedItem, end_time: e.target.value} : null)} 
                                className="col-span-3" 
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="activity" className="text-right">Atividade</Label>
                            <Input 
                                id="activity" 
                                value={editedItem?.activity || ""} 
                                onChange={(e) => setEditedItem(editedItem ? {...editedItem, activity: e.target.value} : null)} 
                                className="col-span-3" 
                                placeholder="Ex: Trabalho, Almoço, Exercício"
                            />
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
                            Isto irá substituir todas as atividades agendadas para <span className="font-bold capitalize text-primary">{selectedDay}</span>. Tem a certeza?
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
                           Dê um nome ao seu template para a rotina de <span className="font-bold capitalize text-primary">{selectedDay}</span>.
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

export const RoutineView = memo(RoutineViewComponent);
