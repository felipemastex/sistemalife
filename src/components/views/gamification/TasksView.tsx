
"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ListChecks } from 'lucide-react';
import { usePlayerDataContext } from '@/hooks/use-player-data';

const TasksView = () => {
    const { profile, persistData } = usePlayerDataContext();

    // Mock data for demonstration purposes
    const recurringTasks = profile?.recurring_tasks || [
        { id: 1, name: 'Molhar as plantas', days: ['terca', 'sabado'] },
        { id: 2, name: 'Pôr o lixo fora', days: ['segunda', 'quarta', 'sexta'] },
        { id: 3, name: 'Limpar a caixa de areia', days: ['domingo'] }
    ];

    const weekDays = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
    const today = new Date().toLocaleDateString('pt-BR', { weekday: 'long' }).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    const [completedTasks, setCompletedTasks] = useState(profile?.completed_tasks_today || {});

    const handleToggleTask = (taskId: number) => {
        const newCompletedTasks = { ...completedTasks, [taskId]: !completedTasks[taskId] };
        setCompletedTasks(newCompletedTasks);
        persistData('profile', { ...profile, completed_tasks_today: newCompletedTasks });
    };

    return (
        <div className="p-4 md:p-6 h-full flex flex-col">
            <div className="flex-shrink-0 mb-8">
                <h1 className="text-3xl font-bold text-primary font-cinzel tracking-wider">Afazeres</h1>
                <p className="text-muted-foreground mt-2 max-w-3xl">
                    Acompanhe os seus hábitos e tarefas recorrentes. A consistência é a chave para forjar um Caçador lendário.
                </p>
            </div>

            <div className="flex-grow grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 overflow-y-auto">
                {weekDays.map(day => {
                    const tasksForDay = recurringTasks.filter(task => task.days.includes(day));
                    const isToday = today === day;

                    return (
                        <Card key={day} className={`flex flex-col ${isToday ? 'border-primary shadow-lg shadow-primary/10' : 'bg-card/60'}`}>
                            <CardHeader>
                                <CardTitle className="capitalize text-lg text-center">{day}</CardTitle>
                            </CardHeader>
                            <CardContent className="flex-grow space-y-3">
                                {tasksForDay.length > 0 ? (
                                    tasksForDay.map(task => (
                                        <div 
                                            key={task.id} 
                                            onClick={() => handleToggleTask(task.id)}
                                            className={`p-3 rounded-md flex items-center gap-3 cursor-pointer transition-colors ${completedTasks[task.id] ? 'bg-green-500/10 text-muted-foreground line-through' : 'bg-secondary hover:bg-secondary/80'}`}
                                        >
                                            <div className={`w-5 h-5 rounded-sm border-2 flex items-center justify-center flex-shrink-0 ${completedTasks[task.id] ? 'bg-green-500 border-green-500' : 'border-primary'}`}>
                                                {completedTasks[task.id] && <ListChecks className="h-4 w-4 text-white"/>}
                                            </div>
                                            <span>{task.name}</span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center text-sm text-muted-foreground h-full flex items-center justify-center">
                                        <p>Dia de descanso.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
};

export default TasksView;

