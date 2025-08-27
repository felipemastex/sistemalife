
"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Flame, Calendar, Shield, Users, Trophy, ChevronUp, ChevronDown, CheckCircle, Gem, Zap, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

const challengeTypes = {
  daily: { icon: Flame, color: 'text-orange-400' },
  weekly: { icon: Calendar, color: 'text-blue-400' },
  special: { icon: Shield, color: 'text-purple-400' },
  guild: { icon: Users, color: 'text-green-400' },
};

const mockTowerData = [
  {
    floor: 1,
    status: 'completed',
    challenges: [],
  },
  {
    floor: 2,
    status: 'completed',
    challenges: [],
  },
  {
    floor: 3,
    status: 'current',
    challenges: [
      {
        id: 'd3-1',
        type: 'daily',
        title: 'Foco Absoluto',
        description: 'Mantenha 2 horas de foco ininterrupto usando uma técnica como a Pomodoro.',
        rewards: { xp: 50, fragments: 10 },
        timeLimit: 24, // em horas
        completed: false,
      },
      {
        id: 'd3-2',
        type: 'daily',
        title: 'Conquistador de Missões',
        description: 'Complete todas as suas missões diárias de uma única meta.',
        rewards: { xp: 40, fragments: 8 },
        timeLimit: 24,
        completed: true,
      },
      {
        id: 'd3-3',
        type: 'daily',
        title: 'Mestre de Habilidades',
        description: 'Ganhe XP em 3 habilidades diferentes hoje.',
        rewards: { xp: 30, fragments: 5 },
        timeLimit: 24,
        completed: false,
      },
    ],
  },
    {
    floor: 4,
    status: 'locked',
    challenges: [],
  },
  {
    floor: 5,
    status: 'locked',
    challenges: [
      {
        id: 'w5-1',
        type: 'weekly',
        title: 'Maratona de Consistência',
        description: 'Mantenha uma sequência de 5 dias de missões concluídas.',
        rewards: { xp: 250, fragments: 50 },
        timeLimit: 168, // 7 dias
        completed: false,
      },
    ],
  },
  {
    floor: 10,
    status: 'locked',
    isBossFloor: true,
    challenges: [
        {
            id: 's10-1',
            type: 'special',
            title: 'O Guardião da Disciplina',
            description: 'Conclua uma meta de Rank E do início ao fim.',
            rewards: { xp: 1000, fragments: 200, special: 'Item Cosmético' },
            completed: false,
        }
    ]
  },
];


const TowerView = () => {
    const [currentFloor, setCurrentFloor] = useState(3);

    return (
        <div className="p-4 md:p-6 h-full flex flex-col">
            <div className="flex-shrink-0">
                <h1 className="text-3xl font-bold text-primary font-cinzel tracking-wider">Torre dos Desafios</h1>
                <p className="text-muted-foreground mt-2 max-w-3xl">
                    Suba andares ao completar desafios de dificuldade crescente e ganhe recompensas exclusivas.
                </p>
            </div>

            <div className="mt-6 flex-grow overflow-y-auto">
                <div className="space-y-4">
                    {mockTowerData.map((floor) => {
                        const isCurrent = floor.status === 'current';
                        const isCompleted = floor.status === 'completed';
                        
                        const Icon = challengeTypes[floor.challenges[0]?.type]?.icon || Trophy;


                        if (floor.isBossFloor) {
                            return (
                                 <Card key={floor.floor} className={cn("border-2", isCurrent ? 'border-purple-500' : 'border-border/50')}>
                                    <CardHeader>
                                        <div className="flex justify-between items-center">
                                            <CardTitle className="text-xl flex items-center gap-3">
                                                 <Trophy className="h-6 w-6 text-purple-400" />
                                                Andar {floor.floor}: Andar do Guardião
                                            </CardTitle>
                                             {isCompleted ? <CheckCircle className="h-6 w-6 text-green-500" /> : null}
                                        </div>
                                    </CardHeader>
                                     {isCurrent && (
                                        <CardContent>
                                           {floor.challenges.map((challenge) => {
                                                 const ChallengeIcon = challengeTypes[challenge.type].icon;
                                                return (
                                                    <Card key={challenge.id} className="bg-secondary/50 border-purple-500/50">
                                                         <CardHeader>
                                                            <div className="flex justify-between items-center">
                                                                <CardTitle className="text-lg flex items-center gap-2">
                                                                     <ChallengeIcon className={cn("h-5 w-5", challengeTypes[challenge.type].color)} />
                                                                     {challenge.title}
                                                                </CardTitle>
                                                            </div>
                                                            <CardDescription>{challenge.description}</CardDescription>
                                                        </CardHeader>
                                                         <CardFooter className="flex justify-between items-center">
                                                             <div className="flex gap-4">
                                                                <div className="flex items-center gap-1 text-sm text-primary"><Zap className="h-4 w-4"/> {challenge.rewards.xp} XP</div>
                                                                <div className="flex items-center gap-1 text-sm text-amber-400"><Gem className="h-4 w-4"/> {challenge.rewards.fragments}</div>
                                                                <div className="flex items-center gap-1 text-sm text-purple-400"><Trophy className="h-4 w-4"/> {challenge.rewards.special}</div>
                                                            </div>
                                                            <Button disabled={challenge.completed}>
                                                                {challenge.completed ? "Concluído" : "Aceitar Desafio"}
                                                            </Button>
                                                         </CardFooter>
                                                    </Card>
                                                )
                                            })}
                                        </CardContent>
                                    )}
                                </Card>
                            )
                        }

                        return (
                             <Card key={floor.floor} className={cn('transition-all duration-300', isCompleted ? 'opacity-50' : '', isCurrent ? 'border-primary' : 'border-border/50')}>
                                <CardHeader>
                                    <div className="flex justify-between items-center">
                                        <CardTitle className="text-lg">Andar {floor.floor}</CardTitle>
                                        {isCompleted ? <CheckCircle className="h-6 w-6 text-green-500" /> : null}
                                    </div>
                                    
                                </CardHeader>
                                {isCurrent && (
                                    <CardContent className="space-y-3">
                                        {floor.challenges.map((challenge) => {
                                            const ChallengeIcon = challengeTypes[challenge.type].icon;
                                            return(
                                                <Card key={challenge.id} className={cn("bg-secondary/50", challenge.completed && "opacity-60")}>
                                                    <CardHeader className="p-4">
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <CardTitle className="text-base flex items-center gap-2">
                                                                    <ChallengeIcon className={cn("h-5 w-5", challengeTypes[challenge.type].color)} />
                                                                    {challenge.title}
                                                                </CardTitle>
                                                                <CardDescription className="mt-1">{challenge.description}</CardDescription>
                                                            </div>
                                                            {challenge.completed && <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />}
                                                        </div>
                                                    </CardHeader>
                                                    <CardFooter className="flex justify-between items-center p-4 pt-0">
                                                        <div className="flex gap-4">
                                                           <div className="flex items-center gap-1 text-sm text-primary"><Zap className="h-4 w-4"/> {challenge.rewards.xp} XP</div>
                                                            <div className="flex items-center gap-1 text-sm text-amber-400"><Gem className="h-4 w-4"/> {challenge.rewards.fragments}</div>
                                                        </div>
                                                        <div className='flex items-center gap-2'>
                                                            {challenge.timeLimit && (
                                                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                                    <Clock className="h-3 w-3" />
                                                                    {challenge.timeLimit}h restantes
                                                                </div>
                                                            )}
                                                            <Button size="sm" variant="outline" disabled={challenge.completed}>
                                                                {challenge.completed ? "Concluído" : "Aceitar"}
                                                            </Button>
                                                        </div>
                                                    </CardFooter>
                                                </Card>
                                            )
                                        })}
                                    </CardContent>
                                )}
                            </Card>
                        )
                    })}
                </div>
                 <div className="mt-8 text-center text-muted-foreground">
                    <p>A torre continua... Mais andares serão revelados à medida que você progride.</p>
                </div>
            </div>
        </div>
    );
};

export default TowerView;
