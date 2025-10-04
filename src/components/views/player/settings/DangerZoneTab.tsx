"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { LoaderCircle } from 'lucide-react';
import { usePlayerDataContext } from '@/hooks/use-player-data';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

export default function DangerZoneTab() {
    const { handleFullReset } = usePlayerDataContext();
    const [isResetting, setIsResetting] = useState(false);
    const isMobile = useIsMobile();

    const onReset = async () => {
        setIsResetting(true);
        await handleFullReset();
        // A página deve recarregar ou redirecionar após o reset, o que é tratado no contexto.
        // Não é necessário setar `isResetting` para false aqui.
    };

    return (
        <Card className={cn("border-red-500/30", isMobile ? "p-2" : "")}>
            <CardHeader className={cn(isMobile ? "p-3" : "p-6")}>
                <CardTitle className={cn("text-red-400", isMobile ? "text-lg" : "")}>Zona de Perigo</CardTitle>
                <CardDescription className={isMobile ? "text-xs" : ""}>Ações nesta secção são permanentes e não podem ser desfeitas.</CardDescription>
            </CardHeader>
            <CardContent className={isMobile ? "p-3" : ""}>
                <div className={cn(
                    "flex items-start justify-between gap-4 rounded-lg border border-red-500/30 p-4",
                    isMobile ? "flex-col p-2 gap-2" : "flex-row p-4"
                )}>
                    <div className={isMobile ? "space-y-1" : ""}>
                        <p className={cn("font-bold text-foreground", isMobile ? "text-sm" : "")}>Resetar a sua conta</p>
                        <p className={cn("text-muted-foreground", isMobile ? "text-xs" : "text-sm")}>Isto irá apagar permanentemente todos os seus dados.</p>
                    </div>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" disabled={isResetting} className={cn("w-full sm:w-auto", isMobile ? "text-xs py-1 h-8" : "")}>
                                {isResetting ? <LoaderCircle className={cn("animate-spin", isMobile ? "h-4 w-4" : "")} /> : (isMobile ? "Resetar" : "Resetar Conta")}
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className={isMobile ? "p-4" : ""}>
                            <AlertDialogHeader>
                                <AlertDialogTitle className={isMobile ? "text-sm" : ""}>Tem a certeza absoluta?</AlertDialogTitle>
                                <AlertDialogDescription className={isMobile ? "text-xs" : ""}>
                                    Esta ação é irreversível. Todos os seus dados, incluindo perfil, metas, missões e habilidades, serão apagados permanentemente. Não será possível recuperar a sua conta.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className={isMobile ? "flex-col gap-2" : ""}>
                                <AlertDialogCancel className={isMobile ? "text-xs py-1 h-8" : ""}>Cancelar</AlertDialogCancel>
                                <AlertDialogAction 
                                    onClick={onReset} 
                                    className={cn(
                                        "bg-destructive hover:bg-destructive/90 text-destructive-foreground",
                                        isMobile ? "text-xs py-1 h-8" : ""
                                    )}
                                >
                                    {isMobile ? "Sim, resetar" : "Sim, quero resetar a conta"}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </CardContent>
        </Card>
    );
}