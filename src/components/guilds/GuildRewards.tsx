
"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Gift } from "lucide-react";

export const GuildRewards = () => {
    return (
        <Card className="h-full flex flex-col">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Gift className="h-5 w-5" />
                    Recompensas da Guilda
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-grow flex items-center justify-center">
                <p className="text-muted-foreground text-center">
                    (WIP) Recompensas por contribuição e conquistas da guilda.
                </p>
            </CardContent>
        </Card>
    );
};
