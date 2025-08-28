
"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { usePlayerDataContext } from '@/hooks/use-player-data';
import { Download, Upload, AlertTriangle, LoaderCircle, Check, Link, Unlink, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import Image from 'next/image';
import { useSession, signIn, signOut } from "next-auth/react"

export default function DataBackupTab() {
    const { profile, persistData, handleImportData, isDataLoaded } = usePlayerDataContext();
    const { data: session } = useSession()
    const { toast } = useToast();
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isImporting, setIsImporting] = useState(false);
    const [isTestingConnection, setIsTestingConnection] = useState(false);


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

    const handleTestConnection = async () => {
        setIsTestingConnection(true);
        try {
            const response = await fetch('/api/test-google-calendar');
            const data = await response.json();
            if (response.ok) {
                toast({
                    title: "Sucesso!",
                    description: data.message,
                });
            } else {
                 toast({
                    variant: "destructive",
                    title: "Falha na Conexão",
                    description: data.error || "Não foi possível conectar à API do Google.",
                });
            }
        } catch (error) {
             toast({
                variant: "destructive",
                title: "Erro de Rede",
                description: "Não foi possível comunicar com o servidor de teste.",
            });
        } finally {
            setIsTestingConnection(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Dados & Integrações</CardTitle>
                <CardDescription>Faça o download dos seus dados, restaure-os a partir de um backup e gira as suas integrações.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 rounded-lg border border-border p-4">
                    <div>
                        <p className="font-bold text-foreground">Exportar os seus dados</p>
                        <p className="text-sm text-muted-foreground mt-1">
                            Crie um ficheiro JSON com todo o seu progresso, incluindo perfil, metas, missões, habilidades e rotinas.
                        </p>
                    </div>
                    <Button onClick={handleExportData} className="w-full sm:w-auto" disabled={!isDataLoaded}>
                        <Download className="mr-2 h-4 w-4" />
                        Descarregar Backup
                    </Button>
                </div>
                
                <Separator />

                <div className="flex flex-col gap-4 rounded-lg border border-destructive/30 p-4">
                     <div>
                        <div className="flex items-center gap-2">
                             <AlertTriangle className="h-5 w-5 text-destructive" />
                            <p className="font-bold text-destructive">Importar dados de um backup</p>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                            Esta ação é destrutiva e irá substituir todos os seus dados atuais pelos dados do ficheiro de backup. Use com cuidado.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-4">
                         <Input 
                            type="file" 
                            accept=".json"
                            onChange={handleFileSelect}
                            className="flex-grow file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                            disabled={isImporting}
                        />
                         <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" className="w-full sm:w-auto" disabled={!selectedFile || isImporting}>
                                    {isImporting ? <LoaderCircle className="animate-spin mr-2" /> : <Upload className="mr-2 h-4 w-4" />}
                                    {isImporting ? "A importar..." : "Importar Dados"}
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Tem a certeza absoluta?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Esta ação irá **substituir permanentemente** todos os seus dados atuais pelos dados do ficheiro <span className="font-bold text-foreground">{selectedFile?.name}</span>. Esta operação não pode ser desfeita.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel disabled={isImporting}>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={onImportConfirm} disabled={isImporting} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                                        Sim, substituir tudo
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>

                </div>
                 <Separator />

                 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 rounded-lg border border-border p-4">
                    <div>
                        <p className="font-bold text-foreground">Integrações de Serviços</p>
                        <p className="text-sm text-muted-foreground mt-1">
                           Conecte o Sistema de Vida a outras aplicações para automatizar o seu progresso.
                        </p>
                    </div>
                    {session ? (
                        <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                            <span className="text-sm text-green-400 flex items-center gap-2"><Check /> Conectado como {session.user?.email}</span>
                            <Button onClick={handleTestConnection} className="w-full sm:w-auto" variant="secondary" disabled={isTestingConnection}>
                                {isTestingConnection ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin"/> : <RefreshCw className="h-4 w-4 mr-2" />}
                                Testar Conexão
                            </Button>
                            <Button onClick={() => signOut()} className="w-full sm:w-auto" variant="outline">
                                <Unlink className="h-4 w-4 mr-2" />
                                Desconectar
                            </Button>
                        </div>
                    ) : (
                        <Button onClick={() => signIn('google')} className="w-full sm:w-auto" variant="outline">
                            <Image src="/google-calendar.svg" alt="Google Calendar" width={16} height={16} className="mr-2" />
                            Conectar Google Calendar
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
