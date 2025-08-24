
"use client";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Edit, LogOut, Star, Users, Shield } from "lucide-react";
import * as LucideIcons from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export const GuildHeader = ({ guild, onEdit, onLeave, isLeader }) => {
    if (!guild) return null;

    const IconComponent = LucideIcons[guild.emblema_icon || 'Shield'];

    return (
        <div className="flex flex-col sm:flex-row sm:items-center gap-6 p-4 bg-card/50 border border-border rounded-lg">
            <div 
                className="h-24 w-24 rounded-md flex-shrink-0 flex items-center justify-center self-center sm:self-auto" 
                style={{ backgroundColor: guild.emblema_bg || 'hsl(215, 28%, 48%)'}}
            >
                {IconComponent ? (
                    <IconComponent className="h-12 w-12 text-white" />
                 ) : (
                    <AvatarFallback className="text-2xl font-bold text-white bg-transparent">{guild.tag}</AvatarFallback>
                )}
            </div>
            <div className="flex-1 text-center sm:text-left">
                <h1 className="text-3xl font-bold text-primary font-cinzel tracking-wider">{guild.nome} [{guild.tag}]</h1>
                <p className="text-muted-foreground mt-1">{guild.descricao}</p>
            </div>
            <div className="flex items-center justify-center gap-2 mt-4 sm:mt-0 w-full sm:w-auto">
                {isLeader && (
                    <Button onClick={onEdit} variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                    </Button>
                )}
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                            <LogOut className="h-4 w-4 mr-2" />
                            Sair da Guilda
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Tem a certeza que quer sair da guilda?</AlertDialogTitle>
                            <AlertDialogDescription>
                                {isLeader ? "Como líder, se houver outros membros, a liderança será transferida para o membro de mais alto escalão. Se for o último membro, a guilda será desfeita." : "Você pode pedir para entrar novamente mais tarde, mas terá de ser aceite."}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={onLeave}>Sim, Sair</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </div>
    );
};
