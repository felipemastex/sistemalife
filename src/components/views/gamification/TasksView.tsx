
"use client";

import { useState, useMemo, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ListChecks, PlusCircle, Trash2, Save, Edit, Calendar as CalendarIcon, ChevronLeft, ChevronRight, LayoutGrid, List } from 'lucide-react';
import { usePlayerDataContext } from '@/hooks/use-player-data';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, differenceInDays, parseISO, startOfWeek, addDays, isToday as checkIsToday, startOfMonth, endOfMonth, getDay, isSameMonth, subMonths, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"


const TaskForm = ({ taskToEdit, onSave, onCancel, initialDate }) => {
    const [name, setName] = useState('');
    const [type, setType] = useState('weekly');
    const [days, setDays] = useState([]);
    const [intervalDays, setIntervalDays] = useState(3);
    const [startDate, setStartDate] = useState(new Date());
    const [specificDates, setSpecificDates] = useState([]);

     useEffect(() => {
        if (taskToEdit) {
            setName(taskToEdit.name || '');
            setType(taskToEdit.type || 'weekly');
            setDays(taskToEdit.type === 'weekly' ? (taskToEdit.days || []) : []);
            setIntervalDays(taskToEdit.type === 'interval' ? taskToEdit.intervalDays : 3);
            setStartDate(taskToEdit.type === 'interval' && taskToEdit.startDate ? new Date(taskToEdit.startDate) : new Date());
            setSpecificDates(taskToEdit.type === 'specific_days' ? (taskToEdit.specificDates || []).map(d => new Date(d)) : []);
        } else {
            setName('');
            setType(initialDate ? 'specific_days' : 'weekly');
            setDays([]);
            setIntervalDays(3);
            setStartDate(new Date());
            setSpecificDates(initialDate ? [initialDate] : []);
        }
    }, [taskToEdit, initialDate]);

    const weekDays = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];

    const handleDayToggle = (day) => {
        setDays(prev => 
            prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
        );
    };

    const handleSave = () => {
        if (!name.trim()) return;
        const taskData = { id: taskToEdit?.id || `task_${Date.now()}`, name, type };
        
        if (type === 'weekly') {
            if (days.length === 0) return;
            onSave({ ...taskData, days });
        } else if (type === 'interval') {
            if (!intervalDays || intervalDays < 1) return;
            onSave({ ...taskData, intervalDays, startDate: startDate.toISOString().split('T')[0] });
        } else { // specific_days
            if (specificDates.length === 0) return;
            onSave({ ...taskData, specificDates: specificDates.map(d => d.toISOString().split('T')[0]) });
        }
    };

    return (
        <div className="space-y-4">
            <div>
                <Label htmlFor="task-name">Nome do Afazer</Label>
                <Input
                    id="task-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Levar o lixo"
                />
            </div>
             <div>
                <Label>Tipo de Repetição</Label>
                 <RadioGroup value={type} onValueChange={setType} className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
                    <Label htmlFor="type-weekly" className="flex items-center space-x-2 border rounded-md p-3 cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-primary/10 text-center justify-center">
                        <RadioGroupItem value="weekly" id="type-weekly"/>
                        <span>Semanal</span>
                    </Label>
                     <Label htmlFor="type-interval" className="flex items-center space-x-2 border rounded-md p-3 cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-primary/10 text-center justify-center">
                        <RadioGroupItem value="interval" id="type-interval"/>
                        <span>Intervalo</span>
                    </Label>
                    <Label htmlFor="type-specific" className="flex items-center space-x-2 border rounded-md p-3 cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-primary/10 text-center justify-center">
                        <RadioGroupItem value="specific_days" id="type-specific"/>
                        <span>Datas Específicas</span>
                    </Label>
                </RadioGroup>
            </div>

            {type === 'weekly' && (
                <div>
                    <Label>Dias da Semana</Label>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-2">
                        {weekDays.map(day => (
                            <div key={day} className="flex items-center space-x-2">
                                <Checkbox
                                    id={`day-${day}`}
                                    checked={days.includes(day)}
                                    onCheckedChange={() => handleDayToggle(day)}
                                />
                                <Label htmlFor={`day-${day}`} className="capitalize text-sm font-normal">
                                    {day}
                                </Label>
                            </div>
                        ))}
                    </div>
                </div>
            )}
             {type === 'interval' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="interval-days">Repetir a cada</Label>
                         <Input
                            id="interval-days"
                            type="number"
                            value={intervalDays}
                            onChange={(e) => setIntervalDays(Number(e.target.value))}
                            min="1"
                            placeholder="Ex: 3"
                        />
                         <p className="text-xs text-muted-foreground mt-1">dias.</p>
                    </div>
                     <div>
                        <Label htmlFor="start-date">A partir de</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                variant={"outline"}
                                className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !startDate && "text-muted-foreground"
                                )}
                                >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {startDate ? format(startDate, "PPP", { locale: ptBR }) : <span>Escolha uma data</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                mode="single"
                                selected={startDate}
                                onSelect={setStartDate}
                                initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>
            )}
             {type === 'specific_days' && (
                <div>
                    <Label>Selecione as Datas</Label>
                    <Calendar
                        mode="multiple"
                        selected={specificDates}
                        onSelect={setSpecificDates}
                        className="rounded-md border mt-2"
                        locale={ptBR}
                    />
                </div>
            )}

             <DialogFooter className="pt-4">
                <Button variant="outline" onClick={onCancel}>Cancelar</Button>
                <Button onClick={handleSave} disabled={!name.trim()}>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar
                </Button>
            </DialogFooter>
        </div>
    );
};


const ManageTasksDialog = ({ open, onOpenChange, recurringTasks, onUpdateTasks, initialDate, clearInitialDate }) => {
    const [editingTask, setEditingTask] = useState(null);

    useEffect(() => {
        if (!open) {
            setEditingTask(null);
            clearInitialDate();
        }
    }, [open, clearInitialDate]);

    const handleSaveTask = (task) => {
        const existingTaskIndex = recurringTasks.findIndex(t => t.id === task.id);
        let updatedTasks;
        if (existingTaskIndex > -1) {
            updatedTasks = [...recurringTasks];
            updatedTasks[existingTaskIndex] = task;
        } else {
            updatedTasks = [...recurringTasks, task];
        }
        onUpdateTasks(updatedTasks);
        setEditingTask(null);
    };

    const handleDeleteTask = (taskId) => {
        const updatedTasks = recurringTasks.filter(t => t.id !== taskId);
        onUpdateTasks(updatedTasks);
    };
    
    const getTaskDescription = (task) => {
        if (task.type === 'interval') {
            return `A cada ${task.intervalDays} dias`;
        }
        if (task.type === 'specific_days') {
            return `${task.specificDates?.length || 0} data(s) específica(s)`;
        }
        return task.days.join(', ');
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Gerir Afazeres Recorrentes</DialogTitle>
                    <DialogDescription>Adicione, edite ou remova os seus afazeres.</DialogDescription>
                </DialogHeader>
                 <div className="py-4 space-y-4 max-h-[60vh]">
                    <div className="border p-4 rounded-lg">
                        <h3 className="font-semibold mb-2">{editingTask ? 'Editar Afazer' : 'Novo Afazer'}</h3>
                        <TaskForm
                            taskToEdit={editingTask}
                            onSave={handleSaveTask}
                            onCancel={() => setEditingTask(null)}
                            initialDate={initialDate}
                        />
                    </div>
                    
                    <h3 className="font-semibold pt-4 border-t">Afazeres Existentes</h3>
                     <ScrollArea className="h-48 pr-4">
                        <div className="space-y-2">
                            {recurringTasks.map(task => (
                                <div key={task.id} className="flex items-center justify-between p-2 bg-secondary rounded-md">
                                    <div>
                                        <p className="font-medium">{task.name}</p>
                                        <p className="text-xs text-muted-foreground capitalize">{getTaskDescription(task)}</p>
                                    </div>
                                    <div className="flex gap-1">
                                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingTask(task)}><Edit className="h-4 w-4"/></Button>
                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:text-red-400" onClick={() => handleDeleteTask(task.id)}><Trash2 className="h-4 w-4"/></Button>
                                    </div>
                                </div>
                            ))}
                            {recurringTasks.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Nenhum afazer recorrente criado.</p>}
                        </div>
                    </ScrollArea>
                </div>
            </DialogContent>
        </Dialog>
    );
};

const TasksView = () => {
    const { profile, persistData } = usePlayerDataContext();
    const [showManageDialog, setShowManageDialog] = useState(false);
    const [view, setView] = useState('monthly');
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [newTaskInitialDate, setNewTaskInitialDate] = useState<Date | null>(null);

    const recurringTasks = useMemo(() => profile?.recurring_tasks || [], [profile]);
    const completedTasks = useMemo(() => profile?.completed_tasks_today || {}, [profile]);

    const weekDays = useMemo(() => {
        const today = new Date();
        const start = startOfWeek(today, { weekStartsOn: 0 }); // Sunday
        return Array.from({ length: 7 }).map((_, i) => addDays(start, i));
    }, []);

    const calendarDays = useMemo(() => {
        const start = startOfMonth(currentMonth);
        const startDate = startOfWeek(start, { weekStartsOn: 0 });
        const days = [];
        let dateIterator = startDate;
        while (days.length < 42) { // 6 weeks to be safe
            days.push(dateIterator);
            dateIterator = addDays(dateIterator, 1);
        }
        return days;
    }, [currentMonth]);
    
    const getTasksForDay = useCallback((dayDate: Date) => {
        const dayName = dayDate.toLocaleDateString('pt-BR', { weekday: 'long' }).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const dateString = format(dayDate, 'yyyy-MM-dd');

        return recurringTasks.filter(task => {
            if (task.type === 'weekly') {
                 return (task.days || []).includes(dayName);
            }
            if (task.type === 'interval') {
                if (!task.startDate) return false;
                const startDate = parseISO(task.startDate);
                const currentDay = new Date(dayDate);
                currentDay.setHours(0,0,0,0);
                startDate.setHours(0,0,0,0);
                
                if (currentDay < startDate) return false;

                const diff = differenceInDays(currentDay, startDate);
                return diff % task.intervalDays === 0;
            }
            if (task.type === 'specific_days') {
                return (task.specificDates || []).includes(dateString);
            }
            return false;
        });
    }, [recurringTasks]);

    const handleToggleTask = (taskId: string, dayDate: Date) => {
        const taskDateId = format(dayDate, 'yyyy-MM-dd');
        const taskUniqueId = `${taskId}_${taskDateId}`;
        const newCompletedTasks = { ...completedTasks, [taskUniqueId]: !completedTasks[taskUniqueId] };
        persistData('profile', { ...profile, completed_tasks_today: newCompletedTasks, last_task_completion_date: new Date().toISOString() });
    };

    const handleUpdateTasks = (updatedTasks) => {
        persistData('profile', { ...profile, recurring_tasks: updatedTasks });
    };

    const handleDayClick = (dayDate: Date) => {
        setNewTaskInitialDate(dayDate);
        setShowManageDialog(true);
    };

    return (
        <div className="p-4 md:p-6 h-full flex flex-col">
            <div className="flex-shrink-0 mb-8">
                 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-primary font-cinzel tracking-wider">Afazeres</h1>
                        <p className="text-muted-foreground mt-2 max-w-3xl">
                            Acompanhe os seus hábitos e tarefas recorrentes. A consistência é a chave para forjar um Caçador lendário.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                         <Tabs defaultValue={view} onValueChange={setView} className="w-auto">
                            <TabsList>
                                <TabsTrigger value="weekly"><List className="mr-2 h-4 w-4"/> Semanal</TabsTrigger>
                                <TabsTrigger value="monthly"><LayoutGrid className="mr-2 h-4 w-4"/> Mensal</TabsTrigger>
                            </TabsList>
                        </Tabs>
                        <Button onClick={() => setShowManageDialog(true)}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Gerir Afazeres
                        </Button>
                    </div>
                </div>
            </div>
            
            <Tabs value={view} className="flex-grow flex flex-col">
                <TabsContent value="weekly" className="flex-grow">
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {weekDays.map((dayDate) => {
                            const isToday = checkIsToday(dayDate);
                            const tasksForDay = getTasksForDay(dayDate);

                            return (
                                <Card key={format(dayDate, 'yyyy-MM-dd')} className={cn("flex flex-col", isToday ? 'border-primary shadow-lg shadow-primary/10' : 'bg-card/60')}>
                                    <CardHeader>
                                        <CardTitle className="capitalize text-lg text-center">{format(dayDate, 'eeee, dd', { locale: ptBR })}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="flex-grow space-y-3">
                                        {tasksForDay.length > 0 ? (
                                            tasksForDay.map(task => {
                                                const taskDateId = format(dayDate, 'yyyy-MM-dd');
                                                const taskUniqueId = `${task.id}_${taskDateId}`;
                                                const isCompleted = !!completedTasks[taskUniqueId];
                                                return (
                                                    <div 
                                                        key={taskUniqueId} 
                                                        onClick={() => handleToggleTask(task.id, dayDate)}
                                                        className={cn(
                                                            "p-3 rounded-md flex items-center gap-3 cursor-pointer transition-colors",
                                                            isCompleted ? 'bg-green-500/10 text-muted-foreground line-through' : 'bg-secondary hover:bg-secondary/80'
                                                        )}
                                                    >
                                                        <div className={cn(
                                                            "w-5 h-5 rounded-sm border-2 flex items-center justify-center flex-shrink-0",
                                                            isCompleted ? 'bg-green-500 border-green-500' : 'border-primary'
                                                        )}>
                                                            {isCompleted && <ListChecks className="h-4 w-4 text-white"/>}
                                                        </div>
                                                        <span>{task.name}</span>
                                                    </div>
                                                )
                                            })
                                        ) : (
                                            <div className="text-center text-sm text-muted-foreground h-full flex items-center justify-center p-4">
                                                <p>Dia de descanso.</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </TabsContent>
                <TabsContent value="monthly" className="flex-grow flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                        <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                            <ChevronLeft className="h-4 w-4"/>
                        </Button>
                        <h2 className="text-xl font-bold text-center capitalize">
                            {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
                        </h2>
                        <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                            <ChevronRight className="h-4 w-4"/>
                        </Button>
                    </div>
                    <div className="grid grid-cols-7 flex-grow">
                        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                            <div key={day} className="text-center font-bold text-muted-foreground text-sm py-2 border-b">{day}</div>
                        ))}
                         {calendarDays.map((dayDate, index) => {
                            const isCurrentMonth = isSameMonth(dayDate, currentMonth);
                            const isToday = checkIsToday(dayDate);
                            const tasksForDay = isCurrentMonth ? getTasksForDay(dayDate) : [];
                            return(
                                <div key={index} className={cn("border-r border-b p-2 flex flex-col group", isCurrentMonth ? 'bg-card/30' : 'bg-secondary/10 text-muted-foreground opacity-50')}>
                                    <div className="flex justify-between items-center">
                                        <span className={cn("font-bold text-xs", isToday && "text-primary")}>{format(dayDate, 'd')}</span>
                                        <Button size="icon" className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity" variant="ghost" onClick={() => handleDayClick(dayDate)}>
                                            <PlusCircle className="h-3 w-3"/>
                                        </Button>
                                    </div>
                                    <div className="flex-grow space-y-1 mt-1 overflow-y-auto text-xs">
                                        {tasksForDay.map(task => {
                                            const taskDateId = format(dayDate, 'yyyy-MM-dd');
                                            const taskUniqueId = `${task.id}_${taskDateId}`;
                                            const isCompleted = !!completedTasks[taskUniqueId];
                                            return (
                                                <div key={taskUniqueId} onClick={() => handleToggleTask(task.id, dayDate)} className={cn("p-1 rounded flex items-center gap-1.5 cursor-pointer", isCompleted ? 'line-through text-muted-foreground' : 'hover:bg-primary/10')}>
                                                     <div className={cn("w-3 h-3 rounded-sm border flex-shrink-0", isCompleted ? 'bg-green-500 border-green-500' : 'border-primary/50')}></div>
                                                    <span className="truncate">{task.name}</span>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            )
                         })}
                    </div>
                </TabsContent>
            </Tabs>
             <ManageTasksDialog
                open={showManageDialog}
                onOpenChange={setShowManageDialog}
                recurringTasks={recurringTasks}
                onUpdateTasks={handleUpdateTasks}
                initialDate={newTaskInitialDate}
                clearInitialDate={() => setNewTaskInitialDate(null)}
            />
        </div>
    );
};

export default TasksView;
