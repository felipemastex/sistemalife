
"use client";

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Backpack } from 'lucide-react';
import { shopItems } from '@/lib/shopItems';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { formatDistanceToNowStrict } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const InventoryView = ({ profile, setProfile }) => {
    const { toast } = useToast();

    if (!profile) {
        return <div>A carregar perfil...</div>;
    }

    const inventoryItems = (profile.inventory || []).map(invItem => {
        const details = shopItems.find(shopItem => shopItem.id === invItem.itemId);
        return { ...invItem, ...details };
    });

    const handleUseItem = (itemInstanceId) => {
        // Lógica de uso a ser implementada no futuro
        toast({
            title: "Função em Desenvolvimento",
            description: "A lógica para ativar o efeito deste item será implementada em breve.",
        });
    }

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

                        return (
                            <Card 
                                key={item.instanceId}
                                className="bg-card/60 border-border/80 flex flex-col"
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
                                        onClick={() => handleUseItem(item.instanceId)}
                                        disabled={true} // Habilitar quando a lógica de uso for implementada
                                    >
                                        Usar Item
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

    
