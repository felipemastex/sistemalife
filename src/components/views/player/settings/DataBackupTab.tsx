
"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { usePlayerDataContext } from '@/hooks/use-player-data';
import { Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function DataBackupTab() {
    const { profile, metas, missions, skills, routine, routineTemplates } = usePlayerDataContext();
    const { toast } = useToast();

    const handleExportData = () => {
        try {
            const userBackupData = {
                profile,
                metas,
                missions,
                skills,
                routine,
                routineTemplates,
                export_date: new Date().toISOString(),
            };

            const jsonString = JSON.stringify(userBackupData, null, 2);
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

    return (
        <Card>
            <CardHeader>
                <CardTitle>Dados & Backup</CardTitle>
                <CardDescription>Faça o download de todos os seus dados do Sistema de Vida.</CardDescription>
            </CardHeader>
            <CardContent>
                 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 rounded-lg border border-border p-4">
                    <div>
                        <p className="font-bold text-foreground">Exportar os seus dados</p>
                        <p className="text-sm text-muted-foreground mt-1">
                            Crie um ficheiro JSON com todo o seu progresso, incluindo perfil, metas, missões, habilidades e rotinas.
                        </p>
                    </div>
                    <Button onClick={handleExportData} className="w-full sm:w-auto">
                        <Download className="mr-2 h-4 w-4" />
                        Descarregar Backup
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
