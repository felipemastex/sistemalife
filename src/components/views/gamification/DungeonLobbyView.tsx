
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { usePlayerDataContext } from "@/hooks/use-player-data";
import { KeySquare, Send } from "lucide-react";

const DungeonLobbyView = ({ onNavigateToSkills }) => {
    const { profile } = usePlayerDataContext();
    const crystalCount = profile?.dungeon_crystals || 0;

    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <div className="absolute inset-0 bg-grid-cyan-400/10 [mask-image:linear-gradient(to_bottom,white_5%,transparent_80%)] -z-10"></div>
            
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center border-4 border-primary/30 mb-4">
                <KeySquare className="w-10 h-10 text-primary" />
            </div>

            <h2 className="text-3xl font-bold text-primary font-cinzel mb-4">Masmorra das Habilidades</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
                As masmorras são desafios intensivos e focados, projetados para acelerar a maestria de uma habilidade específica. Não há vidas aqui, apenas o seu conhecimento e a sua vontade de evoluir.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl w-full">
                <Card className="bg-card/70 backdrop-blur-sm border-cyan-400/20">
                    <CardHeader>
                        <CardTitle className="text-center font-cinzel">Eventos Aleatórios</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <CardDescription className="text-center">
                            O Sistema pode desafiá-lo a qualquer momento, convidando-o para uma masmorra de uma habilidade específica. Fique atento aos convites!
                        </CardDescription>
                    </CardContent>
                </Card>

                 <Card className="bg-card/70 backdrop-blur-sm border-cyan-400/20">
                    <CardHeader>
                        <CardTitle className="text-center font-cinzel">Cristais da Masmorra</CardTitle>
                    </CardHeader>
                    <CardContent>
                         <CardDescription className="text-center mb-4">
                            Use um Cristal para forçar a entrada na masmorra de uma habilidade à sua escolha.
                        </CardDescription>
                        <div className="p-3 bg-secondary rounded-md text-center">
                            <p className="text-sm text-muted-foreground">Cristais Disponíveis</p>
                            <p className="text-3xl font-bold text-primary">{crystalCount}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
             <Button onClick={onNavigateToSkills} className="mt-8">
                <Send className="mr-2 h-4 w-4" />
                Ir para Habilidades e Usar Cristal
            </Button>
        </div>
    );
};

export default DungeonLobbyView;
