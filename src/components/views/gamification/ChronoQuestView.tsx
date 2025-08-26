
"use client";

import { useMemo, memo } from 'react';
import { usePlayerDataContext } from '@/hooks/use-player-data';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { LoaderCircle, User, Mountain, Castle, Shield } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

const pathPoints = [
  { top: '85%', left: '5%' }, { top: '80%', left: '15%' },
  { top: '70%', left: '20%' }, { top: '65%', left: '30%' },
  { top: '75%', left: '40%' }, { top: '80%', left: '50%' },
  { top: '70%', left: '60%' }, { top: '60%', left: '65%' },
  { top: '50%', left: '75%' }, { top: '40%', left: '85%' },
  { top: '30%', left: '80%' }, { top: '20%', left: '70%' },
  { top: '10%', left: '60%' }, { top: '5%', left: '50%' },
];

const landmarks = [
    { name: 'Vila Inicial', position: 0, icon: User },
    { name: 'Montanhas da Dificuldade', position: 3, icon: Mountain },
    { name: 'Forte da Disciplina', position: 7, icon: Shield },
    { name: 'Cidadela da Maestria', position: 13, icon: Castle },
];

const ChronoQuestViewComponent = () => {
    const { metas, missions, isDataLoaded } = usePlayerDataContext();

    const overallProgress = useMemo(() => {
        if (!metas || metas.length === 0) return 0;
        
        const activeMetas = metas.filter(m => !m.concluida);
        if (activeMetas.length === 0) return 100;

        const totalProgress = activeMetas.reduce((sum, meta) => {
            const relatedMissions = missions.filter(m => m.meta_associada === meta.nome);
            const completedMissions = relatedMissions.filter(m => m.concluido).length;
            const totalMissions = relatedMissions.length;
            
            if (totalMissions === 0) return sum;
            
            const metaProgress = (completedMissions / totalMissions) * 100;
            return sum + metaProgress;
        }, 0);

        return totalProgress / activeMetas.length;

    }, [metas, missions]);
    
    if (!isDataLoaded) {
        return (
            <div className="p-4 md:p-6 h-full flex items-center justify-center">
                <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }
    
    const currentPositionIndex = Math.floor((overallProgress / 100) * (pathPoints.length - 1));
    const playerPosition = pathPoints[currentPositionIndex];

    return (
        <div className="p-4 md:p-6 h-full flex flex-col">
             <div className="mb-8 flex-shrink-0">
                <h1 className="text-3xl font-bold text-primary font-cinzel tracking-wider">Jornada do Caçador</h1>
                <p className="text-muted-foreground mt-2 max-w-3xl">
                    Visualize a sua jornada. Cada meta concluída é um passo em frente no seu caminho para a grandeza.
                </p>
            </div>
            
            <Card className="flex-grow flex flex-col">
                <CardHeader>
                    <CardTitle>Progresso Geral da Jornada</CardTitle>
                    <CardDescription>O seu avanço no mapa é determinado pelo progresso médio de todas as suas metas ativas.</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow flex flex-col gap-6">
                    <div className="w-full max-w-2xl mx-auto">
                         <div className="flex justify-between text-sm mb-1">
                            <span className="text-muted-foreground">Início</span>
                            <span className="text-muted-foreground">Destino Final</span>
                        </div>
                        <Progress value={overallProgress} className="h-3" />
                         <p className="text-center mt-2 font-bold text-primary text-lg">{overallProgress.toFixed(1)}% Completo</p>
                    </div>

                    <div className="w-full flex-grow bg-secondary/30 rounded-lg relative border border-border overflow-hidden">
                        {/* Background Elements */}
                        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-green-500/5 rounded-full blur-2xl"></div>
                        <div className="absolute bottom-1/4 right-1/4 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl"></div>

                        {/* Path */}
                        <svg className="absolute inset-0 w-full h-full" width="100%" height="100%" preserveAspectRatio="none">
                            <path 
                                d={pathPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.left} ${p.top}`).join(' ')}
                                stroke="hsl(var(--primary) / 0.3)" 
                                strokeWidth="2" 
                                fill="none" 
                                strokeDasharray="5 5"
                            />
                        </svg>

                        {/* Landmarks */}
                        {landmarks.map(landmark => {
                             const point = pathPoints[landmark.position];
                             const LandmarkIcon = landmark.icon;
                             return (
                                <div key={landmark.name} className="absolute text-center" style={{ top: point.top, left: point.left, transform: 'translate(-50%, -50%)' }}>
                                    <LandmarkIcon className="h-8 w-8 text-muted-foreground/50" />
                                    <p className="text-xs text-muted-foreground/70 mt-1">{landmark.name}</p>
                                </div>
                             )
                        })}

                        {/* Player */}
                        <div 
                            className="absolute flex flex-col items-center justify-center transition-all duration-1000 ease-out" 
                            style={{ top: playerPosition.top, left: playerPosition.left, transform: 'translate(-50%, -50%)' }}
                        >
                            <div className="w-8 h-8 rounded-full bg-primary border-2 border-primary-foreground shadow-lg flex items-center justify-center animate-pulse">
                                <User className="h-5 w-5 text-primary-foreground" />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export const ChronoQuestView = memo(ChronoQuestViewComponent);

    