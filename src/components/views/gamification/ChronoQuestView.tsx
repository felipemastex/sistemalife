
"use client";

import { useMemo, memo } from 'react';
import { usePlayerDataContext } from '@/hooks/use-player-data';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { LoaderCircle, User, Mountain, Castle, Shield, Skull, Tent, TowerControl } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';


// Path points defined as percentages { top, left }
const pathPoints = [
  { top: '88%', left: '8%' },    // 0: Start at Volcano
  { top: '80%', left: '15%' },   // 1
  { top: '75%', left: '25%' },   // 2
  { top: '68%', left: '35%' },   // 3: Near Hand
  { top: '60%', left: '45%' },   // 4
  { top: '65%', left: '55%' },   // 5
  { top: '73%', left: '62%' },   // 6
  { top: '65%', left: '70%' },   // 7
  { top: '55%', left: '78%' },   // 8: Near blue trench
  { top: '45%', left: '85%' },   // 9
  { top: '35%', left: '80%' },   // 10
  { top: '25%', left: '73%' },   // 11
  { top: '15%', left: '65%' },   // 12
  { top: '8%', left: '55%' },    // 13: End near top fortress
];


const landmarks = [
    { name: 'Cratera da Iniciação', position: 0, icon: Skull },
    { name: 'Acampamento da Perseverança', position: 4, icon: Tent },
    { name: 'Abismo do Conhecimento', position: 8, icon: TowerControl },
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
                       <div 
                         className="absolute inset-0 bg-cover bg-center"
                         style={{ backgroundImage: 'url(https://storage.googleapis.com/gen-prod-public-images/user/6216a655-a2d0-4467-8547-92572b83b194/a3d024b3-d2bc-4c3e-b7e6-764f693246a4.png)' }}
                       ></div>
                        <svg className="absolute inset-0 w-full h-full" width="100%" height="100%" preserveAspectRatio="none">
                            <path 
                                d={pathPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.left} ${p.top}`).join(' ')}
                                stroke="hsl(var(--primary) / 0.5)" 
                                strokeWidth="2" 
                                fill="none" 
                                strokeDasharray="5 5"
                            />
                        </svg>
                        
                        <TooltipProvider>
                        {landmarks.map(landmark => {
                             const point = pathPoints[landmark.position];
                             const LandmarkIcon = landmark.icon;
                             return (
                                <Tooltip key={landmark.name}>
                                    <TooltipTrigger asChild>
                                        <div className="absolute text-center" style={{ top: point.top, left: point.left, transform: 'translate(-50%, -50%)' }}>
                                            <LandmarkIcon className="h-10 w-10 text-background/80" strokeWidth={1.5} />
                                        </div>
                                    </TooltipTrigger>
                                     <TooltipContent>
                                        <p>{landmark.name}</p>
                                    </TooltipContent>
                                </Tooltip>
                             )
                        })}

                        <Tooltip>
                            <TooltipTrigger asChild>
                                 <div 
                                    className="absolute flex flex-col items-center justify-center transition-all duration-1000 ease-out" 
                                    style={{ top: playerPosition.top, left: playerPosition.left, transform: 'translate(-50%, -50%)' }}
                                >
                                    <div className="w-8 h-8 rounded-full bg-primary border-2 border-primary-foreground shadow-lg flex items-center justify-center animate-pulse">
                                        <User className="h-5 w-5 text-primary-foreground" />
                                    </div>
                                </div>
                            </TooltipTrigger>
                             <TooltipContent>
                                <p>Você está aqui</p>
                            </TooltipContent>
                        </Tooltip>
                        </TooltipProvider>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export const ChronoQuestView = memo(ChronoQuestViewComponent);
