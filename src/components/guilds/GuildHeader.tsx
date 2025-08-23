
"use client";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Edit, LogOut } from "lucide-react";
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

    const getIconComponent = (iconName) => {
        const Icon = LucideIcons[iconName];
        return Icon ? <Icon className="h-10 w-10 text-white" /> : null;
    };

    return (
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 p-4 bg-card/50 border border-border rounded-lg">
            <Avatar className="h-24 w-24 rounded-md flex-shrink-0" style={{ backgroundColor: `hsl(${guild.emblema_bg || '215 28% 48%'})`}}>
                <div className="flex items-center justify-center h-full w-full">
                    {getIconComponent(guild.emblema_icon || 'Shield')}
                </div>
                <AvatarFallback>{guild.tag}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
                <h1 className="text-3xl font-bold text-cyan-400 font-cinzel tracking-wider">{guild.nome} [{guild.tag}]</h1>
                <p className="text-muted-foreground mt-1">{guild.descricao}</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 self-start sm:self-center">
                {isLeader && (
                    <Button onClick={onEdit} variant="outline">
                        <Edit className="h-4 w-4 mr-2" />
                        Editar Guilda
                    </Button>
                )}
                 <AlertDialog>
                    <AlertDialogTrigger asChild>
                         <Button variant="destructive">
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
