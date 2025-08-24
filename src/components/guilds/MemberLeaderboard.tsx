
"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Trophy } from "lucide-react";

export const MemberLeaderboard = () => {
    return (
        <Card className="h-full flex flex-col">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5" />
                    Ranking de Membros
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-grow flex items-center justify-center">
                <p className="text-muted-foreground text-center">
                    (WIP) Ranking de contribuição dos membros (semanal, mensal, total).
                </p>
            </CardContent>
        </Card>
    );
};
