
"use client";

import { useMemo, memo } from 'react';
import { usePlayerDataContext } from '@/hooks/use-player-data';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Swords, Brain, User, Paintbrush, Handshake, Heart, LoaderCircle } from 'lucide-react';
import { statCategoryMapping } from '@/lib/mappings';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

const classData = {
    'Guerreiro': {
        icon: Swords,
        color: 'text-red-400',
        bgColor: 'bg-red-900/20',
        borderColor: 'border-red-500/30',
        description: 'Focado na superação de desafios físicos e no fortalecimento do corpo. Ganha bónus em atividades de Força e Constituição.',
        categories: ['Saúde & Fitness'],
        bonus: '+5% XP em missões de Saúde & Fitness.'
    },
    'Mago': {
        icon: Brain,
        color: 'text-blue-400',
        bgColor: 'bg-blue-900/20',
        borderColor: 'border-blue-500/30',
        description: 'Dedicado à expansão do conhecimento e ao domínio de novas competências. Aprende habilidades de Inteligência mais rapidamente.',
        categories: ['Desenvolvimento de Carreira', 'Finanças', 'Cultura & Conhecimento'],
        bonus: 'Requer 10% menos XP para evoluir habilidades de Inteligência.'
    },
    'Artesão': {
        icon: Paintbrush,
        color: 'text-yellow-400',
        bgColor: 'bg-yellow-900/20',
        borderColor: 'border-yellow-500/30',
        description: 'Um mestre da criação e da expressão. Transforma ideias em realidade com bónus em atividades de Destreza.',
        categories: ['Hobbies & Criatividade'],
        bonus: '+10% de chance de "acerto crítico" em tarefas criativas (recompensas em dobro).'
    },
    'Diplomata': {
        icon: Handshake,
        color: 'text-green-400',
        bgColor: 'bg-green-900/20',
        borderColor: 'border-green-500/30',
        description: 'Especialista em construir pontes e fortalecer laços. Ganha bónus em interações sociais e missões de Carisma.',
        categories: ['Social & Relacionamentos'],
        bonus: '+5% de reputação em interações de guilda.'
    },
    'Sábio': {
        icon: Heart,
        color: 'text-purple-400',
        bgColor: 'bg-purple-900/20',
        borderColor: 'border-purple-500/30',
        description: 'Focado no autoconhecimento e equilíbrio interior. Ganha bónus em atividades de Sabedoria e crescimento pessoal.',
        categories: ['Crescimento Pessoal'],
        bonus: 'Reduz a perda de XP por corrupção de habilidades em 25%.'
    },
     'Explorador': {
        icon: Heart,
        color: 'text-orange-400',
        bgColor: 'bg-orange-900/20',
        borderColor: 'border-orange-500/30',
        description: 'Um aventureiro que desbrava o mundo e novas experiências. Recebe bónus em missões de Viagem e Aventura.',
        categories: ['Viagens & Aventura'],
        bonus: 'Aumenta a chance de encontrar "missões raras" em 10%.'
    },
    'Neófito': {
        icon: User,
        color: 'text-gray-400',
        bgColor: 'bg-gray-900/20',
        borderColor: 'border-gray-500/30',
        description: 'Um caçador no início da sua jornada, ainda a descobrir o seu caminho. Todas as áreas estão abertas para exploração.',
        categories: [],
        bonus: 'Ganha +5% de XP em todas as atividades até atingir o nível 5.'
    }
};

const ClassViewComponent = () => {
    const { profile, metas, isDataLoaded } = usePlayerDataContext();

    const userClass = useMemo(() => {
        if (!metas || metas.length === 0) return classData['Neófito'];

        const activeGoals = metas.filter(m => !m.concluida);
        if (activeGoals.length === 0) return classData['Neófito'];
        
        const categoryCounts = activeGoals.reduce((acc, meta) => {
            const category = meta.categoria || "Crescimento Pessoal";
            acc[category] = (acc[category] || 0) + 1;
            return acc;
        }, {});

        const primaryCategory = Object.keys(categoryCounts).reduce((a, b) => categoryCounts[a] > categoryCounts[b] ? a : b);
        
        for (const className in classData) {
            if (classData[className].categories.includes(primaryCategory)) {
                return classData[className];
            }
        }
        
        return classData['Neófito'];

    }, [metas]);
    
    if (!isDataLoaded) {
        return (
            <div className="p-4 md:p-6 h-full flex items-center justify-center">
                <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }
    
    const Icon = userClass.icon;

    return (
        <div className="p-4 md:p-6 h-full overflow-y-auto">
             <div className="mb-8">
                <h1 className="text-3xl font-bold text-primary font-cinzel tracking-wider">Classe de Caçador</h1>
                <p className="text-muted-foreground mt-2 max-w-3xl">
                    A sua classe é um reflexo dinâmico do seu foco atual. Ela evolui à medida que as suas metas e prioridades mudam.
                </p>
            </div>
            
             <Card className={cn("max-w-4xl mx-auto", userClass.bgColor, userClass.borderColor)}>
                 <CardHeader className="text-center items-center">
                    <div className={cn("w-24 h-24 rounded-full flex items-center justify-center mb-4 border-4", userClass.bgColor, userClass.borderColor)}>
                         <Icon className={cn("w-12 h-12", userClass.color)} />
                    </div>
                    <CardTitle className={cn("text-4xl font-cinzel tracking-wider", userClass.color)}>
                        {Object.keys(classData).find(key => classData[key] === userClass)}
                    </CardTitle>
                    <CardDescription className="text-base">
                        {userClass.description}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="p-4 bg-background/30 rounded-lg">
                        <h3 className="text-lg font-semibold text-center mb-2">Bónus Passivo de Classe</h3>
                        <p className="text-center text-primary font-medium">{userClass.bonus}</p>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold text-center mb-3">Progresso de Classe</h3>
                        <div className="space-y-4">
                           {Object.keys(statCategoryMapping).map(category => {
                                const goalsInCategory = metas.filter(m => m.categoria === category && !m.concluida).length;
                                const totalGoals = metas.filter(m => !m.concluida).length || 1;
                                const progress = (goalsInCategory / totalGoals) * 100;
                                
                                if(goalsInCategory > 0) {
                                    return (
                                        <div key={category}>
                                            <div className="flex justify-between items-center text-sm mb-1">
                                                <span className="text-muted-foreground">{category}</span>
                                                <span className="font-semibold text-foreground">{goalsInCategory} meta(s)</span>
                                            </div>
                                             <Progress value={progress} className="h-2" />
                                        </div>
                                    )
                                }
                                return null;
                           })}
                        </div>
                    </div>
                </CardContent>
             </Card>
        </div>
    );
};

export const ClassView = memo(ClassViewComponent);
