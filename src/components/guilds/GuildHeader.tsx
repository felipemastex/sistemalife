
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

const StatCard = ({ icon: Icon, title, value }) => (
    <Card className="bg-secondary/50 flex-1">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
        </CardContent>
    </Card>
);

export const GuildHeader = ({ guild, onEdit, onLeave, isLeader }) => {
    if (!guild) return null;

    const IconComponent = LucideIcons[guild.emblema_icon || 'Shield'];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-4 bg-card/50 border border-border rounded-lg">
            <div className="lg:col-span-2 flex flex-col sm:flex-row items-start sm:items-center gap-6">
                 <div 
                    className="h-24 w-24 rounded-md flex-shrink-0 flex items-center justify-center" 
                    style={{ backgroundColor: guild.emblema_bg || 'hsl(215, 28%, 48%)'}}
                >
                    {IconComponent ? (
                        <IconComponent className="h-12 w-12 text-white" />
                     ) : (
                        <AvatarFallback className="text-2xl font-bold text-white bg-transparent">{guild.tag}</AvatarFallback>
                    )}
                </div>
                <div className="flex-1">
                    <h1 className="text-3xl font-bold text-primary font-cinzel tracking-wider">{guild.nome} [{guild.tag}]</h1>
                    <p className="text-muted-foreground mt-1">{guild.descricao}</p>
                    <div className="flex items-center gap-2 mt-4">
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
            </div>

            <div className="lg:col-span-1 flex flex-col sm:flex-row lg:flex-col gap-4">
                <div className="flex flex-1 gap-4">
                    <StatCard icon={Star} title="Nível" value={guild.level || 1} />
                    <StatCard icon={Users} title="Membros" value={guild.membros?.length || 1} />
                </div>
                <div className="flex-1">
                    <Card className="bg-secondary/50 h-full">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                             <CardTitle className="text-sm font-medium">XP Total</CardTitle>
                             <Shield className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                             <div className="text-2xl font-bold">{guild.xp || 0}</div>
                             <p className="text-xs text-muted-foreground">Para o próximo nível: {guild.xp_para_proximo_nivel || 500}</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};
