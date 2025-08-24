
"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Eye } from "lucide-react";

export const GuildOverview = () => {
    return (
        <Card className="h-full flex flex-col">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Visão Geral
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-grow flex items-center justify-center">
                <p className="text-muted-foreground text-center">
                    (WIP) Visão geral da guilda, com estatísticas chave, missões e anúncios.
                </p>
            </CardContent>
        </Card>
    );
};
