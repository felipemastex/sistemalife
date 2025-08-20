"use client";
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { goals as initialGoals } from "@/lib/data";
import { Target } from "lucide-react";
import { cn } from '@/lib/utils';

export function GoalTracker() {
    const [goals, setGoals] = useState(initialGoals);

    const handleHabitToggle = (goalId: string, habitId: string) => {
        setGoals(prevGoals => {
            return prevGoals.map(goal => {
                if (goal.id === goalId) {
                    const newHabits = goal.habits.map(habit => {
                        if (habit.id === habitId) {
                            return { ...habit, completed: !habit.completed };
                        }
                        return habit;
                    });
                    const completedCount = newHabits.filter(h => h.completed).length;
                    const newProgress = Math.round((completedCount / newHabits.length) * 100);
                    return { ...goal, habits: newHabits, progress: newProgress };
                }
                return goal;
            });
        });
    };

    return (
        <Card className="shadow-sm">
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Target className="h-6 w-6 text-primary" />
                    <CardTitle>Atomic Goal Tracker</CardTitle>
                </div>
                <CardDescription>Break down your goals into small, manageable habits.</CardDescription>
            </CardHeader>
            <CardContent>
                <Accordion type="single" collapsible className="w-full">
                    {goals.map((goal) => (
                        <AccordionItem value={goal.id} key={goal.id}>
                            <AccordionTrigger className="hover:no-underline">
                                <div className="flex flex-col items-start text-left w-full pr-4">
                                    <span className="font-medium">{goal.title}</span>
                                    <div className="flex items-center gap-2 w-full mt-2">
                                        <Progress value={goal.progress} className="h-2 flex-1" />
                                        <span className="text-xs font-mono text-muted-foreground">{goal.progress}%</span>
                                    </div>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent>
                                <p className="text-sm text-muted-foreground mb-4">{goal.description}</p>
                                <div className="space-y-3">
                                    {goal.habits.map((habit) => (
                                        <div key={habit.id} className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted/50 transition-colors">
                                            <Checkbox
                                                id={`${goal.id}-${habit.id}`}
                                                checked={habit.completed}
                                                onCheckedChange={() => handleHabitToggle(goal.id, habit.id)}
                                            />
                                            <label
                                                htmlFor={`${goal.id}-${habit.id}`}
                                                className={cn("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer", habit.completed && "line-through text-muted-foreground")}
                                            >
                                                {habit.text}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </CardContent>
        </Card>
    );
}
