"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { LoaderCircle } from 'lucide-react';
import { usePlayerDataContext } from '@/hooks/use-player-data';

export default function DangerZoneTab() {
    const { handleFullReset } = usePlayerDataContext();
    const [isResetting, setIsResetting] = useState(false);

    const onReset = async () => {
        setIsResetting(true);
        await handleFullReset();
        // A página deve recarregar ou redirecionar após o reset, o que é tratado no contexto.
        // Não é necessário setar `isResetting` para false aqui.
    };

    return (
        <Card className="border-red-500/30">
            <CardHeader>
                <CardTitle className="text-red-400">Zona de Perigo</CardTitle>
                <CardDescription>Ações nesta secção são permanentes e não podem ser desfeitas.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 rounded-lg border border-red-500/30 p-4">
                    <div>
                        <p className="font-bold text-foreground">Resetar a sua conta</p>
                        <p className="text-sm text-muted-foreground">Isto irá apagar permanentemente todos os seus dados.</p>
                    </div>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" disabled={isResetting} className="w-full sm:w-auto">
                                {isResetting ? <LoaderCircle className="animate-spin" /> : "Resetar Conta"}
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Tem a certeza absoluta?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Esta ação é irreversível. Todos os seus dados, incluindo perfil, metas, missões e habilidades, serão apagados permanentemente. Não será possível recuperar a sua conta.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={onReset} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                                    Sim, quero resetar a conta
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </CardContent>
        </Card>
    );
}
