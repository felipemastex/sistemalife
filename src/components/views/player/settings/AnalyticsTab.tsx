"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';

export default function AnalyticsTab() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Analytics Pessoais</CardTitle>
                <CardDescription>
                    Visualize o seu progresso, identifique padrões e otimize a sua jornada com insights baseados nos seus dados.
                </CardDescription>
            </CardHeader>
            <CardContent>
                 <div className="flex flex-col items-center justify-center h-64 text-center text-muted-foreground p-8 border-2 border-dashed border-border rounded-lg">
                    <BarChart3 className="h-16 w-16 mb-4" />
                    <p className="font-semibold text-lg">Em Desenvolvimento</p>
                    <p className="text-sm mt-1">Esta funcionalidade está a ser forjada pelo Sistema e estará disponível em breve.</p>
                </div>
            </CardContent>
        </Card>
    );
}
