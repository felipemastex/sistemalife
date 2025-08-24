
"use client";

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Eye, Users, Shield, Megaphone, Star } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const GuildOverview = ({ guild, announcements, quests }) => {
    const guildLevel = guild.level || 1;
    const guildXp = guild.xp || 150;
    const xpToNextLevel = guild.xp_para_proximo_nivel || 500;
    const xpProgress = (guildXp / xpToNextLevel) * 100;

    const memberCount = guild.membros?.length || 1;
    const activeQuestsCount = (quests || []).filter(q => !q.concluida).length;
    
    const latestAnnouncement = (announcements || [])
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        [0];

    const StatCard = ({ icon: Icon, title, value, description }) => (
        <Card className="bg-secondary/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                {description && <p className="text-xs text-muted-foreground">{description}</p>}
            </CardContent>
        </Card>
    );

    return (
        <Card className="h-full flex flex-col">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Visão Geral da Guilda
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-grow space-y-6">
                {/* Stats Cards */}
                <div className="grid gap-4 grid-cols-2">
                    <StatCard icon={Star} title="Nível da Guilda" value={guildLevel} />
                    <StatCard icon={Users} title="Membros" value={memberCount} />
                </div>
                <div className="grid gap-4 grid-cols-1">
                     <StatCard icon={Shield} title="Missões Ativas" value={activeQuestsCount} description="Objetivos cooperativos em andamento."/>
                </div>

                {/* Guild XP Progress */}
                <div>
                    <h3 className="text-sm font-medium mb-2">Progresso da Guilda</h3>
                    <div className="space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>XP Atual</span>
                            <span>{guildXp} / {xpToNextLevel}</span>
                        </div>
                        <Progress value={xpProgress} className="h-2" />
                    </div>
                </div>

                {/* Latest Announcement */}
                <div>
                     <h3 className="text-sm font-medium mb-2">Último Anúncio</h3>
                     {latestAnnouncement ? (
                        <Card className="bg-secondary/50 border-l-4 border-primary">
                            <CardContent className="p-3">
                                <p className="text-sm truncate">{latestAnnouncement.content}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Por {latestAnnouncement.author_name} - {formatDistanceToNow(new Date(latestAnnouncement.date), { addSuffix: true, locale: ptBR })}
                                </p>
                            </CardContent>
                        </Card>
                     ) : (
                         <div className="text-center text-sm text-muted-foreground p-4 border-2 border-dashed border-border rounded-lg">
                             Nenhum anúncio recente.
                         </div>
                     )}
                </div>
            </CardContent>
        </Card>
    );
};
