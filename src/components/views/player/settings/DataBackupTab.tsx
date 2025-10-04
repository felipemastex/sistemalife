"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { usePlayerDataContext } from '@/hooks/use-player-data';
import { Download, Upload, AlertTriangle, LoaderCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

export default function DataBackupTab() {
    const { profile, handleImportData, isDataLoaded } = usePlayerDataContext();
    const { toast } = useToast();
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isImporting, setIsImporting] = useState(false);
    const isMobile = useIsMobile();

    const handleExportData = () => {
        try {
            const allData = (isDataLoaded && profile) ? {
                profile,
                metas: (window as any).playerDataContext?.metas,
                missions: (window as any).playerDataContext?.missions,
                skills: (window as any).playerDataContext?.skills,
                routine: (window as any).playerDataContext?.routine,
                routineTemplates: (window as any).playerDataContext?.routineTemplates,
                export_date: new Date().toISOString(),
            } : null;

            if (!allData || !allData.metas || !allData.missions || !allData.skills) {
                toast({ variant: "destructive", title: "Erro na Exportação", description: "Os dados do jogador ainda não foram carregados." });
                return;
            }

            const jsonString = JSON.stringify(allData, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = url;
            const date = new Date().toISOString().split('T')[0];
            link.download = `sistemavida_backup_${profile.nome_utilizador}_${date}.json`;
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            URL.revokeObjectURL(url);

            toast({
                title: "Exportação Concluída!",
                description: "O seu backup de dados foi descarregado com sucesso.",
            });

        } catch (error) {
            console.error("Erro ao exportar dados:", error);
            toast({
                variant: "destructive",
                title: "Erro na Exportação",
                description: "Não foi possível gerar o seu ficheiro de backup.",
            });
        }
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files.length > 0) {
            const file = event.target.files[0];
            if (file.type === 'application/json') {
                setSelectedFile(file);
            } else {
                toast({ variant: 'destructive', title: 'Ficheiro Inválido', description: 'Por favor, selecione um ficheiro .json válido.'});
                setSelectedFile(null);
            }
        }
    };
    
    const onImportConfirm = async () => {
        if (!selectedFile) return;
        setIsImporting(true);
        try {
            await handleImportData(selectedFile);
            // A página deve recarregar automaticamente após a importação bem-sucedida.
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Erro na Importação', description: error.message });
            setIsImporting(false);
        }
    };

    return (
        <Card className={isMobile ? "p-2" : ""}>
            <CardHeader className={cn(isMobile ? "p-3" : "p-6")}>
                <CardTitle className={isMobile ? "text-lg" : ""}>Dados & Integrações</CardTitle>
                <CardDescription className={isMobile ? "text-xs" : ""}>
                    Faça o download dos seus dados, restaure-os a partir de um backup e gira as suas integrações.
                </CardDescription>
            </CardHeader>
            <CardContent className={cn("space-y-6", isMobile && "space-y-4 p-3")}>
                 <div className={cn(
                    "flex items-start justify-between gap-4 rounded-lg border border-border p-4",
                    isMobile ? "flex-col p-2 gap-2" : "flex-row p-4"
                 )}>
                    <div className={isMobile ? "space-y-1" : ""}>
                        <p className={cn("font-bold text-foreground", isMobile ? "text-sm" : "")}>Exportar os seus dados</p>
                        <p className={cn("text-muted-foreground mt-1", isMobile ? "text-xs" : "text-sm")}>
                            Crie um ficheiro JSON com todo o seu progresso, incluindo perfil, metas, missões, habilidades e rotinas.
                        </p>
                    </div>
                    <Button onClick={handleExportData} className={cn("w-full sm:w-auto", isMobile ? "text-xs py-1 h-8" : "")} disabled={!isDataLoaded}>
                        <Download className={cn("mr-2", isMobile ? "h-3 w-3" : "h-4 w-4")} />
                        {isMobile ? "Backup" : "Descarregar Backup"}
                    </Button>
                </div>
                
                <Separator className={isMobile ? "my-2" : ""} />

                <div className={cn(
                    "flex flex-col gap-4 rounded-lg border border-destructive/30 p-4",
                    isMobile ? "p-2 gap-2" : "p-4"
                )}>
                     <div>
                        <div className="flex items-center gap-2">
                             <AlertTriangle className={cn("text-destructive", isMobile ? "h-4 w-4" : "h-5 w-5")} />
                            <p className={cn("font-bold text-destructive", isMobile ? "text-sm" : "")}>Importar dados de um backup</p>
                        </div>
                        <p className={cn("text-muted-foreground mt-1", isMobile ? "text-xs" : "text-sm")}>
                            Esta ação é destrutiva e irá substituir todos os seus dados atuais pelos dados do ficheiro de backup. Use com cuidado.
                        </p>
                    </div>

                    <div className={cn(
                        "flex items-center gap-4",
                        isMobile ? "flex-col gap-2" : "flex-row"
                    )}>
                         <Input 
                            type="file" 
                            accept=".json"
                            onChange={handleFileSelect}
                            className={cn(
                                "flex-grow file:mr-4 file:rounded-full file:border-0 file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20",
                                isMobile 
                                    ? "text-xs file:py-1 file:px-2 file:text-xs h-8" 
                                    : "file:py-2 file:px-4 file:text-sm h-10"
                            )}
                            disabled={isImporting}
                        />
                         <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" className={cn("w-full sm:w-auto", isMobile ? "text-xs py-1 h-8" : "")} disabled={!selectedFile || isImporting}>
                                    {isImporting ? <LoaderCircle className={cn("animate-spin mr-2", isMobile ? "h-3 w-3" : "")} /> : <Upload className={cn("mr-2", isMobile ? "h-3 w-3" : "h-4 w-4")} />}
                                    {isImporting ? (isMobile ? "A importar..." : "A importar...") : (isMobile ? "Importar" : "Importar Dados")}
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className={isMobile ? "p-4" : ""}>
                                <AlertDialogHeader>
                                    <AlertDialogTitle className={isMobile ? "text-sm" : ""}>Tem a certeza absoluta?</AlertDialogTitle>
                                    <AlertDialogDescription className={isMobile ? "text-xs" : ""}>
                                        Esta ação irá **substituir permanentemente** todos os seus dados atuais pelos dados do ficheiro <span className="font-bold text-foreground">{selectedFile?.name}</span>. Esta operação não pode ser desfeita.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter className={isMobile ? "flex-col gap-2" : ""}>
                                    <AlertDialogCancel disabled={isImporting} className={isMobile ? "text-xs py-1 h-8" : ""}>
                                        {isMobile ? "Cancelar" : "Cancelar"}
                                    </AlertDialogCancel>
                                    <AlertDialogAction 
                                        onClick={onImportConfirm} 
                                        disabled={isImporting} 
                                        className={cn(
                                            "bg-destructive hover:bg-destructive/90 text-destructive-foreground",
                                            isMobile ? "text-xs py-1 h-8" : ""
                                        )}
                                    >
                                        {isMobile ? "Substituir" : "Sim, substituir tudo"}
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>

                </div>
            </CardContent>
        </Card>
    );
}