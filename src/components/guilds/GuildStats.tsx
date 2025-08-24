
"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

export const GuildStats = () => {
    return (
        <Card className="h-full flex flex-col">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Estatísticas da Guilda
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-grow flex items-center justify-center">
                <p className="text-muted-foreground text-center">
                    (WIP) Gráficos e estatísticas sobre o desempenho da guilda.
                </p>
            </CardContent>
        </Card>
    );
};
