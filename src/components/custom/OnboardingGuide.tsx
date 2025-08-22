
"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, CheckCircle, LayoutDashboard, Target, BarChart3, BookOpen } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const onboardingSteps = [
    {
        icon: LayoutDashboard,
        title: 'Bem-vindo ao Sistema de Vida!',
        description: 'Este é o seu Dashboard, o centro de comando da sua jornada. Aqui, você pode ver o seu status, nível, rank e as suas estatísticas principais, que evoluem com o seu progresso.',
    },
    {
        icon: BookOpen,
        title: 'Defina as suas Metas',
        description: 'Tudo começa com um objetivo. Na secção "Metas", você define os seus grandes objetivos de longo prazo (ex: "Aprender a programar"). Use o poder da IA para o ajudar a criar metas SMART e acionáveis.',
    },
    {
        icon: Target,
        title: 'Conquiste as suas Missões',
        description: 'Cada meta é dividida em "Missões Épicas" (grandes marcos) e "Missões Diárias" (tarefas atómicas). Ao completar missões diárias, você ganha XP e avança na sua jornada.',
    },
    {
        icon: BarChart3,
        title: 'Evolua as suas Habilidades',
        description: 'Ao criar uma meta, uma "Habilidade" correspondente é gerada. Completar missões relacionadas a essa meta fará com que a sua habilidade suba de nível, melhorando os seus atributos base e desbloqueando novos desafios.',
    },
    {
        icon: CheckCircle,
        title: 'Você Está Pronto, Caçador',
        description: 'O Sistema foi inicializado. A sua jornada para se tornar uma versão melhor de si mesmo começa agora. Explore, complete missões e suba de nível. Boa sorte!',
    }
];

export const OnboardingGuide = ({ onFinish }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const totalSteps = onboardingSteps.length;
    const progressPercentage = ((currentStep + 1) / totalSteps) * 100;

    const handleNext = () => {
        if (currentStep < totalSteps - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            onFinish();
        }
    };

    const handlePrev = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const { icon: Icon, title, description } = onboardingSteps[currentStep];

    return (
        <Dialog open={true} onOpenChange={(isOpen) => !isOpen && onFinish()}>
            <DialogContent className="max-w-md w-full bg-card/90 backdrop-blur-md border-primary/30 text-white">
                <DialogHeader className="text-center items-center">
                    <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                        <Icon className="w-8 h-8 text-primary" />
                    </div>
                    <DialogTitle className="text-2xl font-bold font-cinzel text-primary">{title}</DialogTitle>
                    <DialogDescription className="text-muted-foreground pt-2 text-base">
                        {description}
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                     <Progress value={progressPercentage} className="h-2"/>
                </div>

                <DialogFooter className="flex justify-between w-full">
                    <Button variant="ghost" onClick={handlePrev} disabled={currentStep === 0}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Anterior
                    </Button>
                    <Button onClick={handleNext}>
                        {currentStep === totalSteps - 1 ? 'Concluir' : 'Próximo'}
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
