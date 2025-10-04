

"use client";

import { useState, memo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Backpack, Gem, Zap, Shield, BookOpen, Repeat, Shirt, Heart } from 'lucide-react';
import { allShopItems } from '@/lib/shopItems';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { formatDistanceToNowStrict } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { usePlayerDataContext } from '@/hooks/use-player-data';
import { useIsMobile } from '@/hooks/use-mobile';

// Define iconMap similar to ShopView
const iconMap: { [key: string]: React.ElementType } = {
    Zap,
    Shield,
    BookOpen,
    Repeat,
    Shirt,
    Heart,
};

const InventoryViewComponent = () => {
    const { profile, persistData } = usePlayerDataContext();
    const { toast } = useToast();
    const isMobile = useIsMobile();

    if (!profile) {
        return <div>A carregar perfil...</div>;
    }

    const inventoryItems = (profile.inventory || []).map((invItem: any) => {
        const details = allShopItems.find(shopItem => shopItem.id === invItem.itemId);
        return { ...invItem, ...details };
    });
    
     const handleEquipItem = (itemToEquip: any) => {
        if (!itemToEquip || itemToEquip.category !== 'Cosméticos') return;

        const updatedProfile = {
            ...profile,
            inventory: (profile.inventory || []).filter((invItem: any) => invItem.instanceId !== itemToEquip.instanceId),
            equipped_items: [
                ...(profile.equipped_items || []),
                {
                    itemId: itemToEquip.id,
                    name: itemToEquip.name,
                    instanceId: itemToEquip.instanceId
                }
            ]
        };

        persistData('profile', updatedProfile);
        toast({
            title: "Item Equipado!",
            description: `Você equipou ${itemToEquip.name}.`,
        });
    };

    const handleUseItem = (item: any) => {
        if (!item || !item.effect) return;

        let updatedProfile = { ...profile };
        const now = new Date();

        updatedProfile.active_effects = (updatedProfile.active_effects || []).filter((eff: any) => 
            new Date(eff.expires_at).getTime() > now.getTime()
        );

        switch (item.effect.type) {
            case 'xp_boost':
                const expires_at_xp = new Date(now.getTime() + item.effect.duration_hours * 60 * 60 * 1000).toISOString();
                updatedProfile.active_effects.push({
                    itemId: item.id,
                    type: 'xp_boost',
                    multiplier: item.effect.multiplier,
                    expires_at: expires_at_xp,
                });
                toast({
                    title: `${item.name} Ativado!`,
                    description: `Você ganhará ${item.effect.multiplier}x mais XP durante a próxima hora.`,
                });
                break;
            case 'streak_recovery':
                 updatedProfile.active_effects.push({
                    itemId: item.id,
                    type: 'streak_recovery',
                    expires_at: new Date(now.setFullYear(now.getFullYear() + 1)).toISOString(), 
                });
                 toast({
                    title: `${item.name} Ativado!`,
                    description: `A sua próxima quebra de sequência será evitada.`,
                });
                break;
            case 'health_potion':
                const currentHP = updatedProfile.estatisticas.constituicao;
                const maxHP = 100; // Assuming max HP is 100
                const restoredHP = Math.min(maxHP, currentHP + item.effect.amount);
                updatedProfile.estatisticas.constituicao = restoredHP;
                toast({
                    title: `${item.name} Usada!`,
                    description: `Você restaurou ${item.effect.amount} de HP. Sua vida agora é ${restoredHP}/${maxHP}.`,
                });
                break;
            default:
                toast({ title: 'Item sem efeito', description: 'Este item ainda não tem um efeito implementado.' });
                return;
        }

        updatedProfile.inventory = (updatedProfile.inventory || []).filter((invItem: any) => invItem.instanceId !== item.instanceId);
        
        persistData('profile', updatedProfile);
    };


    return (
        <div className={cn("h-full overflow-y-auto", isMobile ? "p-2" : "p-4 md:p-6")}>
            <div className={cn("mb-4", isMobile ? "mb-4" : "mb-8")}>
                <h1 className={cn("font-bold text-primary font-cinzel tracking-wider", isMobile ? "text-2xl" : "text-3xl")}>Inventário</h1>
                <p className={cn("text-muted-foreground max-w-3xl", isMobile ? "mt-1 text-sm" : "mt-2")}>
                    Estes são os itens que você adquiriu na sua jornada. Use-os com sabedoria.
                </p>
            </div>

            {inventoryItems.length > 0 ? (
                 <div className={cn(
                    "grid gap-4", 
                    isMobile 
                        ? "grid-cols-1 sm:grid-cols-2" 
                        : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                )}>
                    {inventoryItems.map((item: any) => {
                        // Use iconMap to get the correct icon component
                        const Icon = iconMap[item.icon] || Backpack;
                        const purchaseDate = new Date(item.purchaseDate);
                        const timeAgo = formatDistanceToNowStrict(purchaseDate, { addSuffix: true, locale: ptBR });
                        const isEffectActive = profile.active_effects?.some((eff: any) => eff.itemId === item.id);
                        const isCosmetic = item.category === 'Cosméticos';

                        return (
                            <Card 
                                key={item.instanceId}
                                className={cn("bg-card/60 border-border/80 flex flex-col", isEffectActive && "border-primary/50", isMobile ? "p-2" : "p-0")}
                            >
                                <CardHeader className={cn("flex flex-row items-center gap-3", isMobile ? "p-3" : "p-6")}>
                                     <div className={cn("rounded-lg bg-secondary text-primary flex items-center justify-center flex-shrink-0", isMobile ? "w-12 h-12" : "w-14 h-14")}>
                                        <Icon className={isMobile ? "w-6 h-6" : "w-8 h-8"}/>
                                    </div>
                                    <div className="flex-1">
                                        <CardTitle className={cn("text-foreground", isMobile ? "text-base" : "text-lg")}>
                                            {item.name}
                                        </CardTitle>
                                        <CardDescription className={cn("", isMobile ? "text-[10px]" : "text-xs")}>Adquirido {timeAgo}</CardDescription>
                                    </div>
                                </CardHeader>
                                <CardContent className={cn("flex-grow", isMobile ? "p-3 pt-0" : "p-6 pt-0")}>
                                    <p className={cn("text-muted-foreground", isMobile ? "text-xs" : "text-sm")}>
                                        {item.description}
                                    </p>
                                </CardContent>
                                <CardFooter className={isMobile ? "p-3 pt-0" : "p-6 pt-0"}>
                                     {isCosmetic ? (
                                        <Button className={cn("w-full", isMobile ? "h-8 text-sm" : "")} onClick={() => handleEquipItem(item)}>
                                            Equipar
                                        </Button>
                                    ) : (
                                        <Button 
                                            className={cn("w-full", isMobile ? "h-8 text-sm" : "")} 
                                            onClick={() => handleUseItem(item)}
                                            disabled={isEffectActive}
                                        >
                                            {isEffectActive ? (isMobile ? "Efeito Ativo" : "Efeito Ativo") : (isMobile ? "Usar Item" : "Usar Item")}
                                        </Button>
                                    )}
                                </CardFooter>
                            </Card>
                        );
                    })}
                </div>
            ) : (
                <div className={cn("flex flex-col items-center justify-center text-center text-muted-foreground border-2 border-dashed border-border rounded-lg", isMobile ? "h-48 p-4" : "h-64 p-8")}>
                    <Backpack className={isMobile ? "h-12 w-12 mb-3" : "h-16 w-16 mb-4"} />
                    <p className={cn("font-semibold", isMobile ? "text-base" : "text-lg")}>Inventário Vazio</p>
                    <p className={cn("mt-1", isMobile ? "text-xs" : "text-sm")}>Visite a Loja para adquirir itens e melhorar a sua jornada.</p>
                </div>
            )}
        </div>
    );
};

export const InventoryView = memo(InventoryViewComponent);
