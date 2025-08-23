
"use client";

import { useState, memo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Backpack } from 'lucide-react';
import { shopItems } from '@/lib/shopItems';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { formatDistanceToNowStrict } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const InventoryViewComponent = ({ profile, setProfile }) => {
    const { toast } = useToast();

    if (!profile) {
        return <div>A carregar perfil...</div>;
    }

    const inventoryItems = (profile.inventory || []).map(invItem => {
        const details = shopItems.find(shopItem => shopItem.id === invItem.itemId);
        return { ...invItem, ...details };
    });

    const handleUseItem = (item) => {
        if (!item || !item.effect) return;

        let updatedProfile = { ...profile };
        const now = new Date();

        // Filter out expired effects before applying new ones
        updatedProfile.active_effects = (updatedProfile.active_effects || []).filter(eff => 
            new Date(eff.expires_at).getTime() > now.getTime()
        );

        switch (item.effect.type) {
            case 'xp_boost':
                const expires_at = new Date(now.getTime() + item.effect.duration_hours * 60 * 60 * 1000).toISOString();
                updatedProfile.active_effects.push({
                    itemId: item.id,
                    type: 'xp_boost',
                    multiplier: item.effect.multiplier,
                    expires_at,
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
                    // This effect doesn't expire with time, but is consumed on use
                    expires_at: new Date(now.setFullYear(now.getFullYear() + 1)).toISOString(), // Expires in 1 year
                });
                 toast({
                    title: `${item.name} Ativado!`,
                    description: `A sua próxima quebra de sequência será evitada.`,
                });
                break;
            default:
                toast({ title: 'Item sem efeito', description: 'Este item ainda não tem um efeito implementado.' });
                return;
        }

        // Consume item by removing it from inventory
        updatedProfile.inventory = (updatedProfile.inventory || []).filter(invItem => invItem.instanceId !== item.instanceId);
        
        setProfile(updatedProfile);
    };


    return (
        <div className="p-4 md:p-6 h-full overflow-y-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-primary font-cinzel tracking-wider">Inventário</h1>
                <p className="text-muted-foreground mt-2 max-w-3xl">
                    Estes são os itens que você adquiriu na sua jornada. Use-os com sabedoria.
                </p>
            </div>

            {inventoryItems.length > 0 ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {inventoryItems.map(item => {
                        const Icon = item.icon;
                        const purchaseDate = new Date(item.purchaseDate);
                        const timeAgo = formatDistanceToNowStrict(purchaseDate, { addSuffix: true, locale: ptBR });
                        const isEffectActive = profile.active_effects?.some(eff => eff.itemId === item.id);

                        return (
                            <Card 
                                key={item.instanceId}
                                className={cn("bg-card/60 border-border/80 flex flex-col", isEffectActive && "border-primary/50")}
                            >
                                <CardHeader className="flex flex-row items-center gap-4">
                                     <div className="w-14 h-14 rounded-lg bg-secondary text-primary flex items-center justify-center flex-shrink-0">
                                        <Icon className="w-8 h-8"/>
                                    </div>
                                    <div className="flex-1">
                                        <CardTitle className="text-lg text-foreground">
                                            {item.name}
                                        </CardTitle>
                                        <CardDescription className="text-xs">Adquirido {timeAgo}</CardDescription>
                                    </div>
                                </CardHeader>
                                <CardContent className="flex-grow">
                                    <p className="text-sm text-muted-foreground">
                                        {item.description}
                                    </p>
                                </CardContent>
                                <CardFooter>
                                    <Button 
                                        className="w-full" 
                                        onClick={() => handleUseItem(item)}
                                        disabled={isEffectActive}
                                    >
                                        {isEffectActive ? "Efeito Ativo" : "Usar Item"}
                                    </Button>
                                </CardFooter>
                            </Card>
                        );
                    })}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-64 text-center text-muted-foreground p-8 border-2 border-dashed border-border rounded-lg">
                    <Backpack className="h-16 w-16 mb-4" />
                    <p className="font-semibold text-lg">Inventário Vazio</p>
                    <p className="text-sm mt-1">Visite a Loja para adquirir itens e melhorar a sua jornada.</p>
                </div>
            )}
        </div>
    );
};

export const InventoryView = memo(InventoryViewComponent);

    