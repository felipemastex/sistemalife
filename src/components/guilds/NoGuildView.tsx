
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, ShieldCheck } from 'lucide-react';


export const NoGuildView = ({ onCreate, onSearch }) => {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <div className="absolute inset-0 bg-grid-cyan-400/10 [mask-image:linear-gradient(to_bottom,white_5%,transparent_80%)] -z-10"></div>
            
            <h2 className="text-3xl font-bold text-primary font-cinzel mb-4">Portal da Guilda</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
                A jornada é perigosa para se enfrentar sozinho, Caçador. Forje o seu próprio clã ou junte-se a camaradas para conquistar desafios maiores e colher recompensas lendárias.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl w-full">
                <Card className="bg-card/70 backdrop-blur-sm border-cyan-400/20 hover:border-cyan-400/50 transition-all cursor-pointer" onClick={onCreate}>
                    <CardHeader>
                        <div className="flex justify-center mb-4">
                            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                                <ShieldCheck className="w-8 h-8 text-primary" />
                            </div>
                        </div>
                        <CardTitle className="text-center font-cinzel">Forjar Nova Guilda</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <CardDescription className="text-center">
                            Torne-se um líder. Defina o seu emblema, estabeleça as suas regras e recrute outros Caçadores para a sua causa.
                        </CardDescription>
                    </CardContent>
                </Card>

                 <Card className="bg-card/70 backdrop-blur-sm border-cyan-400/20 hover:border-cyan-400/50 transition-all cursor-pointer" onClick={onSearch}>
                    <CardHeader>
                        <div className="flex justify-center mb-4">
                            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                                <Search className="w-8 h-8 text-primary" />
                            </div>
                        </div>
                        <CardTitle className="text-center font-cinzel">Juntar-se a uma Guilda</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <CardDescription className="text-center">
                            Procure por clãs existentes, encontre um que se alinhe com os seus objetivos e envie um pedido para se juntar à aventura.
                        </CardDescription>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
