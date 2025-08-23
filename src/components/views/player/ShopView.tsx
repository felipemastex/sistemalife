"use client";

import { useState, memo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Gem } from 'lucide-react';
import { shopItems } from '@/lib/shopItems';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { usePlayerDataContext } from '@/hooks/use-player-data.tsx';

const ShopViewComponent = () => {
    const { profile, persistData } = usePlayerDataContext();
    const { toast } = useToast();
    const [isBuying, setIsBuying] = useState(null);

    const handleBuyItem = (item) => {
        if (!profile || isBuying) return;

        if ((profile.fragmentos || 0) < item.price) {
            toast({
                variant: 'destructive',
                title: 'Fundos Insuficientes',
                description: `Você precisa de mais ${item.price - (profile.fragmentos || 0)} fragmentos para comprar este item.`,
            });
            return;
        }

        setIsBuying(item.id);
        
        setTimeout(() => {
            const newInventoryItem = {
                itemId: item.id,
                purchaseDate: new Date().toISOString(),
                instanceId: `${item.id}_${Date.now()}`
            };
            
            const updatedProfile = {
                ...profile,
                fragmentos: (profile.fragmentos || 0) - item.price,
                inventory: [...(profile.inventory || []), newInventoryItem]
            };

            persistData('profile', updatedProfile);

            toast({
                title: 'Compra Efetuada!',
                description: `Você adquiriu "${item.name}".`,
            });
            setIsBuying(null);
        }, 500);

    };

    if (!profile) {
        return <div>A carregar perfil...</div>;
    }

    return (
        <div className="p-4 md:p-6 h-full overflow-y-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-primary font-cinzel tracking-wider">Loja do Sistema</h1>
                    <p className="text-muted-foreground mt-2 max-w-3xl">
                        Use os seus Fragmentos para adquirir itens que podem auxiliar na sua jornada.
                    </p>
                </div>
                <div className="flex-shrink-0 bg-secondary border border-border rounded-lg p-3">
                    <div className="flex items-center gap-2">
                        <Gem className="h-6 w-6 text-yellow-400" />
                        <span className="text-xl font-bold text-foreground">{profile.fragmentos || 0}</span>
                        <span className="text-sm text-muted-foreground">Fragmentos</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {shopItems.map(item => {
                    const Icon = item.icon;
                    const canAfford = (profile.fragmentos || 0) >= item.price;
                    return (
                        <Card 
                            key={item.id}
                            className={cn(
                                "bg-card/60 border-border/80 flex flex-col transition-all duration-300",
                                canAfford ? 'hover:border-primary/50' : 'opacity-70'
                            )}
                        >
                            <CardHeader className="flex flex-row items-center gap-4">
                                 <div className="w-14 h-14 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                                    <Icon className="w-8 h-8"/>
                                </div>
                                <div className="flex-1">
                                    <CardTitle className="text-lg text-foreground">
                                        {item.name}
                                    </CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-grow">
                                <CardDescription className="text-muted-foreground">
                                    {item.description}
                                </CardDescription>
                            </CardContent>
                            <CardFooter>
                                <Button 
                                    className="w-full" 
                                    onClick={() => handleBuyItem(item)}
                                    disabled={!canAfford || isBuying === item.id}
                                >
                                    <Gem className="mr-2 h-4 w-4" />
                                    {isBuying === item.id ? 'A comprar...' : `Comprar por ${item.price}`}
                                </Button>
                            </CardFooter>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
};

export const ShopView = memo(ShopViewComponent);
