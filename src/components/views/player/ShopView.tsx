
"use client";

import { useState, memo, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Gem, LoaderCircle, Sparkles, Zap, Shield, BookOpen, Repeat, RefreshCw, Ticket, Heart, Shirt, KeySquare } from 'lucide-react';
import { allShopItems } from '@/lib/shopItems';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { usePlayerDataContext } from '@/hooks/use-player-data';
import { generateShopItems } from '@/ai/flows/generate-shop-items';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { isToday, parseISO } from 'date-fns';
import { useIsMobile } from '@/hooks/use-mobile';

const iconMap: { [key: string]: React.ElementType } = {
    Zap,
    Shield,
    BookOpen,
    Repeat,
    Ticket,
    Heart,
    Shirt,
    KeySquare,
};

const ShopViewComponent = () => {
    const { profile, missions, skills, persistData, isDataLoaded } = usePlayerDataContext();
    const { toast } = useToast();
    const [isBuying, setIsBuying] = useState<string | null>(null);
    const [isGeneratingItems, setIsGeneratingItems] = useState(false);
    const isMobile = useIsMobile();

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
            
            let updatedProfile = { ...profile };

            if (item.id === 'tower_ticket') {
                 updatedProfile.tower_progress = {
                    ...updatedProfile.tower_progress!,
                    tower_tickets: (updatedProfile.tower_progress?.tower_tickets || 0) + 1
                };
            } else {
                 updatedProfile.inventory = [...(profile.inventory || []), newInventoryItem];
            }

            updatedProfile.fragmentos = (updatedProfile.fragmentos || 0) - item.price;
            
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
                <div className={cn(
                    "grid gap-4", 
                    isMobile 
                        ? "grid-cols-1 sm:grid-cols-2" 
                        : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                )}>
                    {[...Array(3)].map((_, i) => (
                        <Card key={i} className={cn("bg-card/60 border-border/80 flex flex-col", isMobile ? "p-2" : "p-0")}>
                            <CardHeader className={cn("flex flex-row items-center gap-3", isMobile ? "p-3" : "p-6")}>
                                <div className={cn("rounded-lg bg-secondary flex-shrink-0", isMobile ? "w-12 h-12" : "w-14 h-14")}></div>
                                <div className="flex-1 space-y-2">
                                    <div className={cn("rounded bg-secondary", isMobile ? "h-4 w-3/4" : "h-5 w-3/4")}></div>
                                </div>
                            </CardHeader>
                            <CardContent className={cn("flex-grow space-y-2", isMobile ? "p-3 pt-0" : "p-6 pt-0")}>
                                <div className={cn("rounded bg-secondary", isMobile ? "h-3 w-full" : "h-4 w-full")}></div>
                                <div className={cn("rounded bg-secondary", isMobile ? "h-3 w-5/6" : "h-4 w-5/6")}></div>
                            </CardContent>
                            <CardFooter className={isMobile ? "p-3 pt-0" : "p-6 pt-0"}>
                                <div className={cn("rounded bg-secondary", isMobile ? "h-8 w-full" : "h-10 w-full")}></div>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            );
        }

        if (shopItems.length === 0) {
            return (
                 <div className={cn("flex flex-col items-center justify-center text-center text-muted-foreground border-2 border-dashed border-border rounded-lg", isMobile ? "h-48 p-4" : "h-64 p-8")}>
                    <p className={cn("font-semibold", isMobile ? "text-base" : "text-lg")}>O Mercador do Sistema está a reabastecer.</p>
                    <p className={cn("mt-1", isMobile ? "text-xs" : "text-sm")}>Volte mais tarde para ver novas ofertas personalizadas.</p>
                </div>
            )
        }

        return (
             <div className={cn(
                "grid gap-4", 
                isMobile 
                    ? "grid-cols-1 sm:grid-cols-2" 
                    : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            )}>
                {shopItems.map((item: any) => {
                    const itemDetails = allShopItems.find(i => i.id === item.id);
                    if (!itemDetails) return null;

                    const Icon = iconMap[itemDetails.icon];
                    const canAfford = (profile.fragmentos || 0) >= item.price;
                    return (
                        <Card 
                            key={item.id}
                            className={cn(
                                "bg-card/60 border-border/80 flex flex-col transition-all duration-300",
                                canAfford ? 'hover:border-primary/50' : 'opacity-70',
                                isMobile ? 'p-2' : 'p-0'
                            )}
                        >
                            <CardHeader className={cn("flex flex-row items-center gap-3", isMobile ? "p-3" : "p-6")}>
                                 <div className={cn("rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0", isMobile ? "w-12 h-12" : "w-14 h-14")}>
                                    <Icon className={isMobile ? "w-6 h-6" : "w-8 h-8"}/>
                                </div>
                                <div className="flex-1">
                                    <CardTitle className={cn("text-foreground", isMobile ? "text-base" : "text-lg")}>
                                        {item.name}
                                    </CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className={cn("flex-grow", isMobile ? "p-3 pt-0" : "p-6 pt-0")}>
                                <CardDescription className={cn("text-muted-foreground", isMobile ? "text-xs" : "")}>
                                    {item.description}
                                </CardDescription>
                                {item.reasoning && (
                                     <Alert className={cn("border-cyan-500/30 bg-cyan-900/10 text-cyan-200 p-2 mt-3", isMobile ? "text-[10px]" : "text-xs")}>
                                        <Sparkles className={cn("text-cyan-400", isMobile ? "h-3 w-3" : "h-4 w-4")} />
                                        <AlertDescription>{item.reasoning}</AlertDescription>
                                    </Alert>
                                )}
                            </CardContent>
                            <CardFooter className={isMobile ? "p-3 pt-0" : "p-6 pt-0"}>
                                <Button 
                                    className={cn("w-full", isMobile ? "h-8 text-sm" : "")} 
                                    onClick={() => handleBuyItem(item)}
                                    disabled={!canAfford || isBuying === item.id}
                                >
                                    <Gem className={cn("mr-2", isMobile ? "h-3 w-3" : "h-4 w-4")} />
                                    {isBuying === item.id ? (isMobile ? 'A comprar...' : 'A comprar...') : `Comprar por ${item.price}`}
                                </Button>
                            </CardFooter>
                        </Card>
                    );
                })}
            </div>
        )
    }

    return (
        <div className={cn("h-full overflow-y-auto", isMobile ? "p-2" : "p-4 md:p-6")}>
            <div className={cn("flex flex-col gap-4 mb-4", isMobile ? "sm:flex-row sm:items-center sm:justify-between" : "sm:flex-row sm:items-center sm:justify-between")}>
                <div>
                    <h1 className={cn("font-bold text-primary font-cinzel tracking-wider", isMobile ? "text-2xl" : "text-3xl")}>Loja do Sistema</h1>
                    <p className={cn("text-muted-foreground max-w-3xl", isMobile ? "mt-1 text-sm" : "mt-2")}>
                        Ofertas diárias geradas pela IA para otimizar a sua jornada.
                    </p>
                </div>
                <div className={cn("flex items-center gap-2", isMobile ? "" : "")}>
                     <Button variant="outline" size="icon" onClick={() => fetchShopItems(true)} disabled={isGeneratingItems} className={isMobile ? "h-8 w-8" : ""}>
                        <RefreshCw className={cn("h-4 w-4", isGeneratingItems && "animate-spin")} />
                    </Button>
                    <div className={cn("flex-shrink-0 bg-secondary border border-border rounded-lg", isMobile ? "p-2" : "p-3")}>
                        <div className="flex items-center gap-2">
                            <Gem className={cn("text-yellow-400", isMobile ? "h-5 w-5" : "h-6 w-6")} />
                            <span className={cn("font-bold text-foreground", isMobile ? "text-lg" : "text-xl")}>{profile.fragmentos || 0}</span>
                            <span className={cn("text-muted-foreground", isMobile ? "text-xs" : "text-sm")}>Fragmentos</span>
                        </div>
                    </div>
                </div>
            </div>

            {renderShopContent()}
        </div>
    );
};

export default memo(ShopViewComponent);
