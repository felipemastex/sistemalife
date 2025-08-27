
"use client";

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ListChecks, PlusCircle, Trash2, Save, Edit, Calendar as CalendarIcon } from 'lucide-react';
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
import { format, differenceInDays, parseISO, startOfWeek, addDays, isToday as checkIsToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const TaskForm = ({ taskToEdit, onSave, onCancel }) => {
    const [name, setName] = useState('');
    const [type, setType] = useState('weekly');
    const [days, setDays] = useState([]);
    const [intervalDays, setIntervalDays] = useState(3);
    const [startDate, setStartDate] = useState(new Date());

     useEffect(() => {
        if (taskToEdit) {
            setName(taskToEdit.name || '');
            setType(taskToEdit.type || 'weekly');
            setDays(taskToEdit.type === 'weekly' ? (taskToEdit.days || []) : []);
            setIntervalDays(taskToEdit.type === 'interval' ? taskToEdit.intervalDays : 3);
            setStartDate(taskToEdit.type === 'interval' && taskToEdit.startDate ? new Date(taskToEdit.startDate) : new Date());
        } else {
             // Reset form when creating a new task
            setName('');
            setType('weekly');
            setDays([]);
            setIntervalDays(3);
            setStartDate(new Date());
        }
    }, [taskToEdit]);

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
        } else {
            if (!intervalDays || intervalDays < 1) return;
            onSave({ ...taskData, intervalDays, startDate: startDate.toISOString().split('T')[0] });
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
                 <RadioGroup value={type} onValueChange={setType} className="grid grid-cols-2 gap-4 mt-2">
                    <Label htmlFor="type-weekly" className="flex items-center space-x-2 border rounded-md p-3 cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-primary/10">
                        <RadioGroupItem value="weekly" id="type-weekly"/>
                        <span>Dias da Semana</span>
                    </Label>
                     <Label htmlFor="type-interval" className="flex items-center space-x-2 border rounded-md p-3 cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-primary/10">
                        <RadioGroupItem value="interval" id="type-interval"/>
                        <span>Intervalo de Dias</span>
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

             <DialogFooter className="pt-4">
                <Button variant="outline" onClick={onCancel}>Cancelar</Button>
                <Button onClick={handleSave} disabled={!name.trim() || (type === 'weekly' && days.length === 0) || (type === 'interval' && (!intervalDays || intervalDays < 1))}>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar
                </Button>
            </DialogFooter>
        </div>
    );
};


const ManageTasksDialog = ({ open, onOpenChange, recurringTasks, onUpdateTasks }) => {
    const [editingTask, setEditingTask] = useState(null);

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

    const recurringTasks = useMemo(() => profile?.recurring_tasks || [], [profile]);
    const completedTasks = useMemo(() => profile?.completed_tasks_today || {}, [profile]);

    const weekDays = useMemo(() => {
        const today = new Date();
        const start = startOfWeek(today, { weekStartsOn: 0 }); // Sunday
        return Array.from({ length: 7 }).map((_, i) => addDays(start, i));
    }, []);

    const handleToggleTask = (taskUniqueId: string) => {
        const newCompletedTasks = { ...completedTasks, [taskUniqueId]: !completedTasks[taskUniqueId] };
        persistData('profile', { ...profile, completed_tasks_today: newCompletedTasks, last_task_completion_date: new Date().toISOString() });
    };

    const handleUpdateTasks = (updatedTasks) => {
        persistData('profile', { ...profile, recurring_tasks: updatedTasks });
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
                    <Button onClick={() => setShowManageDialog(true)}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Gerir Afazeres
                    </Button>
                </div>
            </div>

            <div className="flex-grow grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 overflow-y-auto">
                {weekDays.map((dayDate) => {
                    const dayName = dayDate.toLocaleDateString('pt-BR', { weekday: 'long' }).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                    const isToday = checkIsToday(dayDate);
                    
                    const tasksForDay = recurringTasks.filter(task => {
                        if (task.type === 'interval') {
                            if (!task.startDate) return false;
                            const startDate = parseISO(task.startDate);
                            const currentDay = new Date(dayDate);
                            currentDay.setHours(0,0,0,0);
                            
                            if (currentDay < startDate) return false;

                            const diff = differenceInDays(currentDay, startDate);
                            return diff % task.intervalDays === 0;
                        }
                        return (task.days || []).includes(dayName);
                    });

                    return (
                        <Card key={dayName} className={cn("flex flex-col", isToday ? 'border-primary shadow-lg shadow-primary/10' : 'bg-card/60')}>
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
                                                onClick={() => handleToggleTask(taskUniqueId)}
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
             <ManageTasksDialog
                open={showManageDialog}
                onOpenChange={setShowManageDialog}
                recurringTasks={recurringTasks}
                onUpdateTasks={handleUpdateTasks}
            />
        </div>
    );
};

export default TasksView;
