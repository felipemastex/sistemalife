
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TowerControl } from 'lucide-react';

const TowerView = () => {
    return (
        <div className="p-4 md:p-6 h-full flex flex-col">
            <div className="flex-shrink-0">
                <h1 className="text-3xl font-bold text-primary font-cinzel tracking-wider">Torre dos Desafios</h1>
                <p className="text-muted-foreground mt-2 max-w-3xl">
                    Suba andares ao completar desafios de dificuldade crescente e ganhe recompensas exclusivas.
                </p>
            </div>

            <div className="flex-grow flex items-center justify-center mt-8">
                 <Card className="w-full max-w-lg text-center bg-card/60 border-border/80">
                     <CardHeader>
                        <div className="flex justify-center mb-4">
                            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center border-4 border-primary/30">
                                <TowerControl className="w-10 h-10 text-primary" />
                            </div>
                        </div>
                        <CardTitle className="text-2xl">Em Construção</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <CardDescription className="text-base">
                            A Torre dos Desafios é uma funcionalidade futura que está a ser desenvolvida pelo Sistema. Volte em breve para enfrentar o seu primeiro andar!
                        </CardDescription>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default TowerView;
