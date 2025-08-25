
"use client";

import { useState, memo, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Gem, LoaderCircle, Sparkles, Zap, Shield, BookOpen, Repeat, RefreshCw } from 'lucide-react';
import { allShopItems } from '@/lib/shopItems';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { usePlayerDataContext } from '@/hooks/use-player-data.tsx';
import { generateShopItems } from '@/ai/flows/generate-shop-items';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { isToday, parseISO } from 'date-fns';

const iconMap: { [key: string]: React.ElementType } = {
    Zap,
    Shield,
    BookOpen,
    Repeat
};

const ShopViewComponent = () => {
    const { profile, missions, skills, persistData, isDataLoaded } = usePlayerDataContext();
    const { toast } = useToast();
    const [isBuying, setIsBuying] = useState<string | null>(null);
    const [isGeneratingItems, setIsGeneratingItems] = useState(false);

    const fetchShopItems = useCallback(async (forceRefresh = false) => {
        if (!isDataLoaded || !profile) return;

        const lastGenerated = profile.shop_last_generated_at;
        const itemsExist = profile.recommended_shop_items && profile.recommended_shop_items.length > 0;

        if (itemsExist && lastGenerated && isToday(parseISO(lastGenerated)) && !forceRefresh) {
            console.log("A usar itens da loja em cache.");
            return;
        }
        
        setIsGeneratingItems(true);
        try {
            const activeMissions = missions.filter((m: { concluido: any; }) => !m.concluido);
            const serializableShopItems = allShopItems.map(({ icon, ...rest }) => rest);

            const result = await generateShopItems({
                profile: JSON.stringify(profile),
                skills: JSON.stringify(skills),
                activeMissions: JSON.stringify(activeMissions),
                allItems: serializableShopItems,
            });
            
            const updatedProfile = {
                ...profile,
                recommended_shop_items: result.recommendedItems || [],
                shop_last_generated_at: new Date().toISOString(),
            };
            await persistData('profile', updatedProfile);

            if (forceRefresh) {
                 toast({ title: "Loja Atualizada!", description: "O Mercador trouxe novas ofertas." });
            }

        } catch (error) {
            console.error("Failed to generate shop items:", error);
            toast({
                variant: 'destructive',
                title: "Erro ao Carregar a Loja",
                description: "O Mercador do Sistema está indisponível. A usar ofertas padrão."
            });
            const fallbackItems = {
                ...profile,
                recommended_shop_items: allShopItems.slice(0, 3),
                shop_last_generated_at: new Date().toISOString(),
            }
             await persistData('profile', fallbackItems);
        } finally {
            setIsGeneratingItems(false);
        }
    }, [isDataLoaded, profile, missions, skills, toast, persistData]);
    
    useEffect(() => {
        fetchShopItems();
    }, [isDataLoaded]);


    const handleBuyItem = (item: any) => {
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
        return (
            <div className="p-4 md:p-6 h-full flex items-center justify-center">
                <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }
    
    const shopItems = profile.recommended_shop_items || [];
    
    const renderShopContent = () => {
        if (isGeneratingItems) {
            return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                    {[...Array(3)].map((_, i) => (
                        <Card key={i} className="bg-card/60 border-border/80 flex flex-col">
                            <CardHeader className="flex flex-row items-center gap-4">
                                <div className="w-14 h-14 rounded-lg bg-secondary flex-shrink-0"></div>
                                <div className="flex-1 space-y-2">
                                    <div className="h-5 w-3/4 rounded bg-secondary"></div>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-grow space-y-2">
                                <div className="h-4 w-full rounded bg-secondary"></div>
                                <div className="h-4 w-5/6 rounded bg-secondary"></div>
                            </CardContent>
                            <CardFooter>
                                <div className="h-10 w-full rounded bg-secondary"></div>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            );
        }

        if (shopItems.length === 0) {
            return (
                 <div className="flex flex-col items-center justify-center h-64 text-center text-muted-foreground p-8 border-2 border-dashed border-border rounded-lg">
                    <p className="font-semibold text-lg">O Mercador do Sistema está a reabastecer.</p>
                    <p className="text-sm mt-1">Volte mais tarde para ver novas ofertas personalizadas.</p>
                </div>
            )
        }

        return (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {shopItems.map(item => {
                    const itemDetails = allShopItems.find(i => i.id === item.id);
                    if (!itemDetails) return null;

                    const Icon = iconMap[itemDetails.icon];
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
                                {item.reasoning && (
                                     <Alert className="mt-4 border-cyan-500/30 bg-cyan-900/10 text-cyan-200 text-xs p-2">
                                        <Sparkles className="h-4 w-4 text-cyan-400" />
                                        <AlertDescription>{item.reasoning}</AlertDescription>
                                    </Alert>
                                )}
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
        )
    }

    return (
        <div className="p-4 md:p-6 h-full overflow-y-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-primary font-cinzel tracking-wider">Loja do Sistema</h1>
                    <p className="text-muted-foreground mt-2 max-w-3xl">
                        Ofertas diárias geradas pela IA para otimizar a sua jornada.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                     <Button variant="outline" size="icon" onClick={() => fetchShopItems(true)} disabled={isGeneratingItems}>
                        <RefreshCw className={cn("h-4 w-4", isGeneratingItems && "animate-spin")} />
                    </Button>
                    <div className="flex-shrink-0 bg-secondary border border-border rounded-lg p-3">
                        <div className="flex items-center gap-2">
                            <Gem className="h-6 w-6 text-yellow-400" />
                            <span className="text-xl font-bold text-foreground">{profile.fragmentos || 0}</span>
                            <span className="text-sm text-muted-foreground">Fragmentos</span>
                        </div>
                    </div>
                </div>
            </div>

            {renderShopContent()}
        </div>
    );
};

export const ShopView = memo(ShopViewComponent);
