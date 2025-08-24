
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart3, LoaderCircle, Sparkles } from 'lucide-react';
import { usePlayerDataContext } from '@/hooks/use-player-data';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useMemo } from 'react';
import { format, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background/80 backdrop-blur-sm border border-border p-2 rounded-md shadow-lg">
        <p className="font-bold text-foreground">{label}</p>
        <p className="text-sm text-primary">{`Contagem: ${payload[0].value}`}</p>
      </div>
    );
  }
  return null;
};


export default function AnalyticsTab() {
    const { metas, missions, isDataLoaded } = usePlayerDataContext();

    const goalsByCategory = useMemo(() => {
        if (!metas || metas.length === 0) return [];
        
        const categoryCount = metas.reduce((acc, meta) => {
            const category = meta.categoria || "Sem Categoria";
            acc[category] = (acc[category] || 0) + 1;
            return acc;
        }, {});

        return Object.entries(categoryCount).map(([name, count]) => ({ name, count }));

    }, [metas]);
    
    const weeklyProductivity = useMemo(() => {
        if (!missions || missions.length === 0) return [];
        
        const last7Days = Array.from({ length: 7 }).map((_, i) => subDays(new Date(), i));
        
        const data = last7Days.map(date => {
            const dateString = date.toISOString().split('T')[0];
            const count = missions
                .flatMap(m => m.missoes_diarias || [])
                .filter(dm => dm.concluido && dm.completed_at?.startsWith(dateString))
                .length;
            
            return {
                name: format(date, 'EEE', { locale: ptBR }), // Ex: 'seg', 'ter'
                fullName: format(date, 'dd/MM', { locale: ptBR }),
                count: count
            };
        }).reverse();
        
        return data;

    }, [missions]);


    if (!isDataLoaded) {
        return (
             <Card>
                <CardHeader>
                    <CardTitle>Analytics Pessoais</CardTitle>
                    <CardDescription>
                       A carregar dados para análise...
                    </CardDescription>
                </CardHeader>
                <CardContent>
                     <div className="flex flex-col items-center justify-center h-64 text-center text-muted-foreground p-8 border-2 border-dashed border-border rounded-lg">
                        <LoaderCircle className="h-16 w-16 mb-4 animate-spin" />
                    </div>
                </CardContent>
            </Card>
        )
    }

    const ProductivityTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const fullDateLabel = weeklyProductivity.find(d => d.name === label)?.fullName;
            return (
            <div className="bg-background/80 backdrop-blur-sm border border-border p-2 rounded-md shadow-lg">
                <p className="font-bold text-foreground">{fullDateLabel}</p>
                <p className="text-sm text-primary">{`Missões Concluídas: ${payload[0].value}`}</p>
            </div>
            );
        }
        return null;
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Analytics Pessoais</CardTitle>
                <CardDescription>
                    Visualize o seu progresso, identifique padrões e otimize a sua jornada com insights baseados nos seus dados.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
                 <Card className="bg-secondary/30">
                    <CardHeader>
                        <CardTitle className="text-lg">Produtividade da Última Semana</CardTitle>
                        <CardDescription>Missões diárias concluídas nos últimos 7 dias.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {weeklyProductivity.length > 0 ? (
                             <div style={{ width: '100%', height: 300 }}>
                                <ResponsiveContainer>
                                    <BarChart data={weeklyProductivity} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)" />
                                        <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} width={30} />
                                        <Tooltip content={<ProductivityTooltip />} cursor={{ fill: 'hsl(var(--primary) / 0.1)' }}/>
                                        <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-48 text-center text-muted-foreground p-4 border-2 border-dashed border-border rounded-lg">
                                <p>Nenhum dado de produtividade encontrado.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="bg-secondary/30">
                    <CardHeader>
                        <CardTitle className="text-lg">Distribuição de Metas por Categoria</CardTitle>
                        <CardDescription>Uma visão geral de onde o seu foco está distribuído.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {goalsByCategory.length > 0 ? (
                             <div style={{ width: '100%', height: 300 }}>
                                <ResponsiveContainer>
                                    <BarChart data={goalsByCategory} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)" />
                                        <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                                        <YAxis type="category" dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} width={150} />
                                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--primary) / 0.1)' }}/>
                                        <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-48 text-center text-muted-foreground p-4 border-2 border-dashed border-border rounded-lg">
                                <p>Nenhuma meta encontrada para análise.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                 <Alert className="border-cyan-500/30 bg-cyan-900/10">
                    <Sparkles className="h-5 w-5 text-cyan-400" />
                    <AlertTitle className="text-cyan-300">Análise Proativa da IA em Breve</AlertTitle>
                    <AlertDescription className="text-cyan-300/80">
                        O Sistema está a aprender com os seus padrões. Em breve, esta secção irá fornecer-lhe insights e sugestões personalizadas para otimizar a sua jornada.
                    </AlertDescription>
                </Alert>
            </CardContent>
        </Card>
    );
}
