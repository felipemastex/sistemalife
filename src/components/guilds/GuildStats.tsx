"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { BarChart3, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from 'recharts';
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";


const weeklyData = [
  { name: 'Seg', contribution: 120 },
  { name: 'Ter', contribution: 200 },
  { name: 'Qua', contribution: 150 },
  { name: 'Qui', contribution: 80 },
  { name: 'Sex', contribution: 70 },
  { name: 'Sáb', contribution: 110 },
  { name: 'Dom', contribution: 130 },
];

const monthlyData = [
  { name: 'Sem 1', contribution: 830 },
  { name: 'Sem 2', contribution: 950 },
  { name: 'Sem 3', contribution: 780 },
  { name: 'Sem 4', contribution: 1100 },
];

const totalData = [
  { name: 'Fitness', contribution: 2500 },
  { name: 'Código', contribution: 4500 },
  { name: 'Social', contribution: 1800 },
  { name: 'Leitura', contribution: 3200 },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background/80 backdrop-blur-sm border border-border p-2 rounded-md shadow-lg">
        <p className="font-bold text-foreground">{label}</p>
        <p className="text-sm text-primary">{`Contribuição: ${payload[0].value}`}</p>
      </div>
    );
  }

  return null;
};

export const GuildStats = () => {
    const [period, setPeriod] = useState("weekly");

    const dataMap = {
        weekly: weeklyData,
        monthly: monthlyData,
        total: totalData,
    };
    
    const currentData = dataMap[period];
    const xAxisKey = "name";


    return (
        <Card className="h-full flex flex-col">
            <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="h-5 w-5" />
                            Estatísticas da Guilda
                        </CardTitle>
                        <CardDescription>Análise de contribuição da guilda.</CardDescription>
                    </div>
                     <div className="flex-shrink-0 bg-secondary p-1 rounded-full flex self-start sm:self-center">
                        <Button 
                            size="sm" 
                            variant={period === 'weekly' ? 'default' : 'ghost'} 
                            onClick={() => setPeriod('weekly')}
                            className="rounded-full"
                        >
                            Semanal
                        </Button>
                         <Button 
                            size="sm" 
                            variant={period === 'monthly' ? 'default' : 'ghost'} 
                            onClick={() => setPeriod('monthly')}
                            className="rounded-full"
                        >
                            Mensal
                        </Button>
                         <Button 
                            size="sm" 
                            variant={period === 'total' ? 'default' : 'ghost'} 
                            onClick={() => setPeriod('total')}
                            className="rounded-full"
                        >
                            Total
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex-grow flex items-center justify-center">
                 <div className="w-full h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={currentData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)"/>
                            <XAxis dataKey={xAxisKey} stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false}/>
                            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false}/>
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--primary) / 0.1)' }}/>
                            <Bar dataKey="contribution" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]}>
                               <LabelList dataKey="contribution" position="top" className="fill-foreground" fontSize={12} />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
};
