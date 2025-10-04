"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart3, LoaderCircle, Sparkles, TrendingUp, Target, Activity, ShieldCheck, Zap } from 'lucide-react';
import { usePlayerDataContext } from '@/hooks/use-player-data';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useMemo, useState, useCallback } from 'react';
import { format, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { generateAnalyticsInsights } from '@/ai/flows/generate-analytics-insights';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

const iconMap = {
    TrendingUp,
    Target,
    Activity,
    BarChart,
    Sparkles,
    Zap,
    ShieldCheck,
};

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) => {
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
    const [isLoadingInsights, setIsLoadingInsights] = useState(false);
    const [insights, setInsights] = useState<any[]>([]);
    const { toast } = useToast();
    const isMobile = useIsMobile();

    const goalsByCategory = useMemo(() => {
        if (!metas || metas.length === 0) return [];
        
        const categoryCount = metas.reduce((acc: { [key: string]: number }, meta: { categoria: string }) => {
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
                .flatMap((m: { missoes_diarias: any[]; }) => m.missoes_diarias || [])
                .filter((dm: { concluido: any; completed_at: string | number | Date; }) => dm.concluido && dm.completed_at?.toString().startsWith(dateString))
                .length;
            
            return {
                name: format(date, 'EEE', { locale: ptBR }), // Ex: 'seg', 'ter'
                fullName: format(date, 'dd/MM', { locale: ptBR }),
                count: count
            };
        }).reverse();
        
        return data;

    }, [missions]);
    
    const handleGenerateInsights = useCallback(async () => {
        setIsLoadingInsights(true);
        setInsights([]);
        try {
            const result = await generateAnalyticsInsights({
                metas: JSON.stringify(metas),
                missions: JSON.stringify(missions),
            });
            setInsights(result.insights);
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Erro na Análise',
                description: 'Não foi possível gerar os insights. Tente novamente mais tarde.'
            });
        } finally {
            setIsLoadingInsights(false);
        }
    }, [metas, missions, toast]);


    if (!isDataLoaded) {
        return (
             <Card className={isMobile ? "p-2" : ""}>
                <CardHeader className={cn(isMobile ? "p-3" : "p-6")}>
                    <CardTitle className={isMobile ? "text-lg" : ""}>Analytics Pessoais</CardTitle>
                    <CardDescription className={isMobile ? "text-xs" : ""}>
                       A carregar dados para análise...
                    </CardDescription>
                </CardHeader>
                <CardContent className={isMobile ? "p-3" : ""}>
                     <div className={cn(
                        "flex flex-col items-center justify-center text-center text-muted-foreground border-2 border-dashed border-border rounded-lg",
                        isMobile ? "h-32 p-4" : "h-64 p-8"
                     )}>
                        <LoaderCircle className={cn("mb-4 animate-spin", isMobile ? "h-8 w-8" : "h-16 w-16")} />
                    </div>
                </CardContent>
            </Card>
        )
    }

    const ProductivityTooltip = ({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) => {
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
        <Card className={isMobile ? "p-2" : ""}>
            <CardHeader className={cn(isMobile ? "p-3" : "p-6")}>
                <CardTitle className={isMobile ? "text-lg" : ""}>Analytics Pessoais</CardTitle>
                <CardDescription className={isMobile ? "text-xs" : ""}>
                    Visualize o seu progresso, identifique padrões e otimize a sua jornada com insights baseados nos seus dados.
                </CardDescription>
            </CardHeader>
            <CardContent className={cn("space-y-6", isMobile && "space-y-4 p-3")}>
                 <Card className={cn("bg-secondary/30", isMobile ? "p-2" : "")}>
                    <CardHeader className={cn(isMobile ? "p-3" : "p-6")}>
                        <CardTitle className={cn("text-lg", isMobile && "text-sm")}>Análise do Oráculo</CardTitle>
                        <CardDescription className={isMobile ? "text-xs" : ""}>Peça ao Sistema para analisar os seus dados e fornecer conselhos estratégicos.</CardDescription>
                    </CardHeader>
                    <CardContent className={isMobile ? "p-3" : ""}>
                         {isLoadingInsights ? (
                             <div className={cn(
                                "flex flex-col items-center justify-center text-center text-muted-foreground border-2 border-dashed border-border rounded-lg",
                                isMobile ? "h-32 p-4 text-xs" : "h-48 p-4"
                             )}>
                                <LoaderCircle className={cn("mb-4 animate-spin text-primary", isMobile ? "h-6 w-6" : "h-12 w-12")}/>
                                <p>{isMobile ? "O Oráculo está a consultar..." : "O Oráculo está a consultar os seus dados..."}</p>
                            </div>
                         ) : insights.length > 0 ? (
                            <div className={cn("space-y-4", isMobile && "space-y-2")}>
                                {insights.map((insight: any, index) => {
                                    const Icon = iconMap[insight.icon as keyof typeof iconMap] || Sparkles;
                                    return (
                                        <Alert key={index} className={cn("border-cyan-500/30 bg-cyan-900/10", isMobile ? "p-2" : "")}>
                                            <Icon className={cn("text-cyan-400", isMobile ? "h-4 w-4" : "h-5 w-5")} />
                                            <AlertTitle className={cn("text-cyan-300", isMobile ? "text-sm" : "")}>{insight.title}</AlertTitle>
                                            <AlertDescription className={cn("text-cyan-300/80", isMobile ? "text-xs" : "")}>
                                                <p>{insight.description}</p>
                                                <p className={cn("font-semibold mt-2", isMobile && "mt-1")}>{insight.suggestion}</p>
                                            </AlertDescription>
                                        </Alert>
                                    )
                                })}
                            </div>
                         ) : (
                            <div className={cn(
                                "flex flex-col items-center justify-center text-center text-muted-foreground border-2 border-dashed border-border rounded-lg",
                                isMobile ? "h-32 p-4 text-xs" : "h-48 p-4"
                            )}>
                                <p className="mb-4">{isMobile ? "Clique para análise" : "Clique no botão para receber uma análise proativa da sua jornada."}</p>
                                 <Button onClick={handleGenerateInsights} disabled={isLoadingInsights} className={isMobile ? "text-xs py-1 h-8" : ""}>
                                    <Sparkles className={cn("mr-2", isMobile ? "h-3 w-3" : "h-4 w-4")} />
                                    {isMobile ? "Analisar" : "Analisar Padrões"}
                                </Button>
                            </div>
                         )}
                    </CardContent>
                </Card>

                 <Card className={cn("bg-secondary/30", isMobile ? "p-2" : "")}>
                    <CardHeader className={cn(isMobile ? "p-3" : "p-6")}>
                        <CardTitle className={cn("text-lg", isMobile && "text-sm")}>Produtividade da Última Semana</CardTitle>
                        <CardDescription className={isMobile ? "text-xs" : ""}>Missões diárias concluídas nos últimos 7 dias.</CardDescription>
                    </CardHeader>
                    <CardContent className={isMobile ? "p-3" : ""}>
                        {weeklyProductivity.length > 0 ? (
                             <div style={{ width: '100%', height: isMobile ? 200 : 300 }}>
                                <ResponsiveContainer>
                                    <BarChart data={weeklyProductivity} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)" />
                                        <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={isMobile ? 10 : 12} tickLine={false} axisLine={false} />
                                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={isMobile ? 10 : 12} tickLine={false} axisLine={false} allowDecimals={false} width={isMobile ? 20 : 30} />
                                        <Tooltip content={<ProductivityTooltip />} cursor={{ fill: 'hsl(var(--primary) / 0.1)' }}/>
                                        <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className={cn(
                                "flex flex-col items-center justify-center text-center text-muted-foreground border-2 border-dashed border-border rounded-lg",
                                isMobile ? "h-32 p-4 text-xs" : "h-48 p-4"
                            )}>
                                <p>{isMobile ? "Sem dados" : "Nenhum dado de produtividade encontrado."}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className={cn("bg-secondary/30", isMobile ? "p-2" : "")}>
                    <CardHeader className={cn(isMobile ? "p-3" : "p-6")}>
                        <CardTitle className={cn("text-lg", isMobile && "text-sm")}>Distribuição de Metas por Categoria</CardTitle>
                        <CardDescription className={isMobile ? "text-xs" : ""}>Uma visão geral de onde o seu foco está distribuído.</CardDescription>
                    </CardHeader>
                    <CardContent className={isMobile ? "p-3" : ""}>
                        {goalsByCategory.length > 0 ? (
                             <div style={{ width: '100%', height: isMobile ? 200 : 300 }}>
                                <ResponsiveContainer>
                                    <BarChart data={goalsByCategory} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)" />
                                        <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={isMobile ? 10 : 12} tickLine={false} axisLine={false} allowDecimals={false} />
                                        <YAxis type="category" dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={isMobile ? 10 : 12} tickLine={false} axisLine={false} width={isMobile ? 80 : 150} />
                                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--primary) / 0.1)' }}/>
                                        <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className={cn(
                                "flex flex-col items-center justify-center text-center text-muted-foreground border-2 border-dashed border-border rounded-lg",
                                isMobile ? "h-32 p-4 text-xs" : "h-48 p-4"
                            )}>
                                <p>{isMobile ? "Sem metas" : "Nenhuma meta encontrada para análise."}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </CardContent>
        </Card>
    );
}