import type { LucideIcon } from "lucide-react";
import { HeartPulse, Landmark, BrainCircuit, Repeat, Trophy, Award, BookOpen } from 'lucide-react';

export interface Stat {
    title: string;
    value: string;
    progress: number;
    Icon: LucideIcon;
}

export const stats: Stat[] = [
    { title: 'Health', value: 'Level 8', progress: 80, Icon: HeartPulse },
    { title: 'Finance', value: 'Level 5', progress: 50, Icon: Landmark },
    { title: 'Skills', value: 'Level 7', progress: 70, Icon: BrainCircuit },
];

export interface Habit {
    id: string;
    text: string;
    completed: boolean;
}

export interface Goal {
    id: string;
    title: string;
    description: string;
    progress: number;
    habits: Habit[];
}

export const goals: Goal[] = [
    {
        id: 'goal1',
        title: 'Run a 5k Marathon',
        description: 'Train consistently to complete a 5k marathon in under 30 minutes.',
        progress: 50,
        habits: [
            { id: 'h1', text: 'Run 3 times a week', completed: true },
            { id: 'h2', text: 'Stretch daily', completed: true },
            { id: 'h3', text: 'Follow a healthy diet plan', completed: false },
            { id: 'h4', text: 'Get 8 hours of sleep', completed: false },
        ]
    },
    {
        id: 'goal2',
        title: 'Learn a new programming language',
        description: 'Become proficient in Python by building 3 projects.',
        progress: 66,
        habits: [
            { id: 'h5', text: 'Code for 1 hour daily', completed: true },
            { id: 'h6', text: 'Complete a tutorial chapter weekly', completed: true },
            { id: 'h7', text: 'Start building the first project', completed: false },
        ]
    }
];

export interface Challenge {
    id: string;
    title: string;
    description: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    points: number;
    Icon: LucideIcon;
}

export const challenges: Challenge[] = [
    {
        id: 'c1',
        title: '30-Day Fitness Streak',
        description: 'Exercise for 30 consecutive days.',
        difficulty: 'Medium',
        points: 500,
        Icon: Trophy,
    },
    {
        id: 'c2',
        title: 'Read a Book a Week',
        description: 'Finish reading one book every week for a month.',
        difficulty: 'Hard',
        points: 1000,
        Icon: BookOpen,
    },
    {
        id: 'c3',
        title: 'Digital Detox Weekend',
        description: 'No screens for an entire weekend.',
        difficulty: 'Easy',
        points: 250,
        Icon: Award,
    },
];

export interface DailyHabit {
    id: string;
    text: string;
    Icon: LucideIcon;
}

export const dailyHabits: DailyHabit[] = [
    { id: 'dh1', text: 'Morning Meditation (10 min)' },
    { id: 'dh2', text: 'Plan your day' },
    { id: 'dh3', text: '30 minutes of exercise' },
    { id: 'dh4', text: 'Review your goals' },
];

export const userDataForAI = JSON.stringify({
    name: "Alex",
    trackedData: {
        health: { level: 8, activity: "Active", sleep: "7 hours/night" },
        finance: { level: 5, savings_rate: "15%", investments: "Beginner" },
        skills: { level: 7, learning: ["Python", "Guitar"], focus: "Python" }
    },
    goals: [
        { goal: "Run a 5k Marathon", progress: "50%", status: "On track" },
        { goal: "Learn Python", progress: "66%", status: "Ahead of schedule" }
    ],
    challenges: [
        { challenge: "30-Day Fitness Streak", status: "In Progress (Day 12)" }
    ]
}, null, 2);
