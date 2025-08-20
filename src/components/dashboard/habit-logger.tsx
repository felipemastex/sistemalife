"use client";
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { dailyHabits } from "@/lib/data";
import { Repeat } from 'lucide-react';
import { cn } from '@/lib/utils';

export function HabitLogger() {
    const [completedHabits, setCompletedHabits] = useState<Set<string>>(new Set());

    const handleHabitToggle = (habitId: string) => {
        setCompletedHabits(prev => {
            const newSet = new Set(prev);
            if (newSet.has(habitId)) {
                newSet.delete(habitId);
            } else {
                newSet.add(habitId);
            }
            return newSet;
        });
    };

    return (
        <Card className="shadow-sm">
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Repeat className="h-6 w-6 text-primary" />
                    <CardTitle>Daily Habit Log</CardTitle>
                </div>
                <CardDescription>Build your momentum by completing your daily habit chain.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-1">
                    {dailyHabits.map((habit, index) => (
                        <div key={habit.id} className="flex items-center gap-4 group">
                            <div className="flex flex-col items-center h-full">
                                <Checkbox
                                    id={`dh-${habit.id}`}
                                    checked={completedHabits.has(habit.id)}
                                    onCheckedChange={() => handleHabitToggle(habit.id)}
                                    className="h-5 w-5 peer"
                                />
                                {index < dailyHabits.length - 1 && (
                                    <div className={cn("h-8 w-px bg-border my-1 transition-colors group-hover:bg-primary/50", completedHabits.has(habit.id) && "bg-primary")}></div>
                                )}
                            </div>
                            <label
                                htmlFor={`dh-${habit.id}`}
                                className={cn(
                                    "font-medium transition-colors cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
                                    completedHabits.has(habit.id) ? "text-muted-foreground line-through" : "text-foreground"
                                )}
                            >
                                {habit.text}
                            </label>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
