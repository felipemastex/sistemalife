
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Check, X } from "lucide-react";
import { ScrollArea } from "../ui/scroll-area";


export const JoinRequests = ({ requests, allUsers, onAccept, onDecline }) => {
    if (!requests || requests.length === 0) {
        return (
             <Card>
                <CardHeader>
                    <CardTitle>Pedidos de Entrada</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">Nenhum pedido pendente.</p>
                </CardContent>
            </Card>
        );
    }
    
    return (
        <Card className="flex flex-col">
            <CardHeader>
                <CardTitle>Pedidos de Entrada ({requests.length})</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow overflow-hidden">
                <ScrollArea className="h-48">
                    <div className="space-y-3 pr-4">
                        {requests.map(req => {
                            const userProfile = allUsers.find(u => u.id === req.user_id);
                            if (!userProfile) return null;

                            return (
                                <div key={req.user_id} className="flex items-center justify-between p-2 rounded-md bg-secondary/50">
                                    <div className="flex items-center gap-3">
                                        <Avatar>
                                            <AvatarImage src={userProfile.avatar_url} />
                                            <AvatarFallback>{userProfile.nome_utilizador?.substring(0, 2).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-semibold">{userProfile.nome_utilizador}</p>
                                            <p className="text-xs text-muted-foreground">Nível {userProfile.nivel}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <Button onClick={() => onAccept(userProfile)} size="icon" variant="ghost" className="h-8 w-8 text-green-400 hover:bg-green-500/20 hover:text-green-300">
                                            <Check className="h-5 w-5" />
                                        </Button>
                                        <Button onClick={() => onDecline(req.user_id)} size="icon" variant="ghost" className="h-8 w-8 text-red-400 hover:bg-red-500/20 hover:text-red-300">
                                            <X className="h-5 w-5" />
                                        </Button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    )
};
