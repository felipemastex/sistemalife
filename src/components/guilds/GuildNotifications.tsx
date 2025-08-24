
"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Bell } from "lucide-react";

export const GuildNotifications = () => {
    return (
        <Card className="h-full flex flex-col">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Notificações
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-grow flex items-center justify-center">
                <p className="text-muted-foreground text-center">
                    (WIP) Histórico de notificações importantes da guilda.
                </p>
            </CardContent>
        </Card>
    );
};
