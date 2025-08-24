
"use client";

import { useState, useEffect, useCallback, memo } from 'react';
import { usePlayerDataContext } from '@/hooks/use-player-data';
import { Button } from '@/components/ui/button';
import { Timer, Play, Pause, RefreshCw, Settings, SkipForward } from 'lucide-react';
import { CircularProgress } from '@/components/ui/circular-progress';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const PomodoroViewComponent = () => {
    const { profile, persistData } = usePlayerDataContext();
    const { toast } = useToast();

    // Use a default settings object if not present in the profile
    const defaultSettings = {
        tasks: [{ id: 'default', name: 'Foco', duration: 25 * 60 }],
        shortBreakDuration: 5 * 60,
        longBreakDuration: 15 * 60,
        cyclesUntilLongBreak: 4,
        alarmSound: 'default_sound.mp3',
    };

    const [settings, setSettings] = useState(profile?.pomodoro_settings || defaultSettings);
    
    const [status, setStatus] = useState('idle'); // idle, focus, short_break, long_break, paused
    const [timeRemaining, setTimeRemaining] = useState(settings.tasks[0].duration);
    const [currentCycle, setCurrentCycle] = useState(0);
    const [currentTaskIndex, setCurrentTaskIndex] = useState(0);

    const handleStart = () => {
        setStatus('focus');
        setTimeRemaining(settings.tasks[currentTaskIndex].duration);
    };

    const handlePause = () => {
        if (status !== 'paused') {
            setStatus('paused');
        } else {
            // Logic to resume will be needed, for now, just unpause
             setStatus(currentCycle % settings.cyclesUntilLongBreak === 0 && currentCycle > 0 ? 'long_break' : 'short_break');
        }
    };
    
    const handleReset = () => {
        setStatus('idle');
        setCurrentCycle(0);
        setCurrentTaskIndex(0);
        setTimeRemaining(settings.tasks[0].duration);
    };

    const handleSkip = () => {
        // Logic to skip to the next phase (break or next focus)
        if (status === 'focus') {
            if (currentCycle > 0 && currentCycle % settings.cyclesUntilLongBreak === 0) {
                 setStatus('long_break');
                 setTimeRemaining(settings.longBreakDuration);
            } else {
                 setStatus('short_break');
                 setTimeRemaining(settings.shortBreakDuration);
            }
             setCurrentCycle(prev => prev + 1);
        } else {
             setStatus('focus');
             setCurrentTaskIndex(0);
             setTimeRemaining(settings.tasks[0].duration);
        }
    };

    useEffect(() => {
        let timerId;
        if (status !== 'paused' && status !== 'idle' && timeRemaining > 0) {
            timerId = setInterval(() => {
                setTimeRemaining(prev => prev - 1);
            }, 1000);
        } else if (timeRemaining === 0) {
            handleSkip(); // Auto-skip to next phase
        }
        return () => clearInterval(timerId);
    }, [status, timeRemaining]);


    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };
    
    const currentDuration = status === 'focus' ? settings.tasks[currentTaskIndex].duration : 
                            status === 'short_break' ? settings.shortBreakDuration : 
                            status === 'long_break' ? settings.longBreakDuration : 
                            settings.tasks[0].duration;

    const progressPercentage = ((currentDuration - timeRemaining) / currentDuration) * 100;
    
    const statusTextMap = {
        idle: 'Pronto para focar?',
        focus: `Foco: ${settings.tasks[currentTaskIndex].name}`,
        short_break: 'Pausa Curta',
        long_break: 'Pausa Longa',
        paused: 'Pausado',
    };

    return (
        <div className="p-4 md:p-6 h-full flex flex-col items-center justify-center bg-background text-foreground">
            <div className="w-full max-w-sm flex flex-col items-center">
                 <div className="relative w-64 h-64 mb-8">
                    <CircularProgress value={progressPercentage} strokeWidth={8} className="w-full h-full" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <p className="text-5xl font-bold font-mono tracking-tighter">{formatTime(timeRemaining)}</p>
                        <p className="text-muted-foreground mt-2">{statusTextMap[status]}</p>
                    </div>
                </div>

                <div className="flex items-center justify-center gap-4">
                    <Button variant="ghost" size="icon" onClick={handleReset} aria-label="Resetar timer">
                        <RefreshCw className="h-6 w-6" />
                    </Button>
                    
                    {status === 'idle' || status === 'paused' ? (
                        <Button size="lg" className="w-32 h-16 rounded-full text-lg" onClick={handleStart}>
                            <Play className="h-8 w-8" />
                        </Button>
                    ) : (
                         <Button size="lg" className="w-32 h-16 rounded-full text-lg" onClick={handlePause}>
                            <Pause className="h-8 w-8" />
                        </Button>
                    )}

                    <Button variant="ghost" size="icon" onClick={handleSkip} aria-label="Avançar para a próxima fase">
                        <SkipForward className="h-6 w-6" />
                    </Button>
                </div>
                
                 <div className="mt-8 flex justify-center">
                    <p className="text-sm text-muted-foreground">Ciclos completos hoje: {Math.floor(currentCycle)}</p>
                 </div>
            </div>
        </div>
    );
};

export const PomodoroView = memo(PomodoroViewComponent);
