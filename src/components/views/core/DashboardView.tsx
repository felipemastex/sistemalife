"use client";

import { memo, useMemo } from 'react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip } from 'recharts';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Flame, Gem, ShieldAlert, Zap, Clock, Users, Heart, KeySquare } from 'lucide-react';
import { usePlayerDataContext } from '@/hooks/use-player-data';
import { Progress } from '@/components/ui/progress';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import type { SVGProps } from 'react';

const getProfileRank = (level: number) => {
    if (level <= 5) return { rank: 'F', title: 'Novato' };
    if (level <= 10) return { rank: 'E', title: 'Iniciante' };
    if (level <= 20) return { rank: 'D', title: 'Adepto' };
    if (level <= 30) return { rank: 'C', title: 'Experiente' };
    if (level <= 40) return { rank: 'B', 'title': 'Perito' };
    if (level <= 50) return { rank: 'A', title: 'Mestre' };
    if (level <= 70) return { rank: 'S', title: 'Grão-Mestre' };
    if (level <= 90) return { rank: 'SS', title: 'Herói' };
    return { rank: 'SSS', title: 'Lendário' };
};
  
const StatItem = ({ label, value, icon: Icon = null, isMobile = false }: { label: string; value: string | number; icon?: React.ComponentType<SVGProps<SVGSVGElement>> | null; isMobile?: boolean }) => (
    <div className={cn("rounded-lg border border-border/50 transition-all hover:bg-secondary/80 hover:border-primary/50", 
        isMobile ? "bg-secondary/50 p-2" : "bg-secondary/50 p-4")}>
        <span className={cn("flex items-center gap-2", isMobile ? "text-xs text-muted-foreground" : "text-sm text-muted-foreground")}>
            {Icon && <Icon className={isMobile ? "h-3 w-3" : "h-4 w-4"} />}
            {label}
        </span>
        <p className={cn("font-bold text-foreground", isMobile ? "text-base" : "text-lg")}>{value}</p>
    </div>
);

const WorldEventCard = ({ event, userContribution, isMobile = false }: { event: any; userContribution: number; isMobile?: boolean }) => {
    if (!event || !event.isActive) return null;

    const progressPercentage = (event.progress / event.goal.target) * 100;
    const endDate = parseISO(event.endDate);
    const timeLeft = formatDistanceToNow(endDate, { locale: ptBR, addSuffix: true });

    return (
        <Card className={cn("bg-gradient-to-br from-purple-900/30 to-red-900/30 border-purple-500/50 animate-in fade-in-50 duration-500", 
            isMobile ? "mt-4" : "mt-6")}>
            <CardHeader className={isMobile ? "p-3" : "p-6"}>
                <div className={cn("items-center gap-3", isMobile ? "flex" : "flex items-center gap-3")}>
                    <ShieldAlert className={isMobile ? "h-6 w-6 text-purple-400" : "h-8 w-8 text-purple-400"} />
                    <div>
                        <CardTitle className={cn("text-purple-300", isMobile ? "text-base" : "text-xl")}>{event.name}</CardTitle>
                        <CardDescription className={isMobile ? "text-xs" : ""}>{event.description}</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className={cn("space-y-3", isMobile ? "p-3" : "p-6 space-y-4")}>
                <div>
                    <div className={cn("justify-between mb-1", isMobile ? "flex text-xs text-muted-foreground" : "flex justify-between text-sm text-muted-foreground mb-1")}>
                        <span>Progresso Global</span>
                        <span>{event.progress.toLocaleString()} / {event.goal.target.toLocaleString()}</span>
                    </div>
                    <Progress value={progressPercentage} className={cn("bg-purple-400/20 [&>div]:bg-purple-500", isMobile ? "h-2" : "h-3")} />
                </div>
                <div className={cn("gap-2", isMobile ? "grid grid-cols-2" : "grid grid-cols-2 gap-4")}>
                    <div className={cn("rounded-md", isMobile ? "bg-background/30 p-1" : "bg-background/30 p-2")}>
                        <p className={cn("text-muted-foreground", isMobile ? "text-xs" : "text-xs text-muted-foreground")}>Sua Contribuição</p>
                        <p className={cn("font-bold flex items-center justify-center gap-2", isMobile ? "text-base" : "text-lg font-bold flex items-center justify-center gap-2")}>
                            <Zap className={isMobile ? "h-3 w-3 text-yellow-400" : "h-4 w-4 text-yellow-400"} />
                            {userContribution}
                        </p>
                    </div>
                    <div className={cn("rounded-md", isMobile ? "bg-background/30 p-1" : "bg-background/30 p-2")}>
                        <p className={cn("text-muted-foreground", isMobile ? "text-xs" : "text-xs text-muted-foreground")}>Tempo Restante</p>
                        <p className={cn("font-bold flex items-center justify-center gap-2", isMobile ? "text-base" : "text-lg font-bold flex items-center justify-center gap-2")}>
                           <Clock className={isMobile ? "h-3 w-3" : "h-4 w-4"} />
                           {timeLeft.replace('em ','')}
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

const DashboardViewComponent = () => {
  const { profile, worldEvents, triggerDungeonEvent, addDungeonCrystal, activateTestWorldEvent } = usePlayerDataContext();
  const isMobile = useIsMobile();
  
  const activeEvent = useMemo(() => {
    return (worldEvents || []).find((e: any) => e.isActive);
  }, [worldEvents]);

  const userContribution = useMemo(() => {
    if (!profile?.event_contribution || !activeEvent) return 0;
    return profile.event_contribution.eventId === activeEvent.id ? profile.event_contribution.contribution : 0;
  }, [profile, activeEvent]);

  if (!profile || !profile.estatisticas) {
    return (
      <div className="p-6 h-full flex items-center justify-center">
        <p className="text-primary text-lg">A carregar dados do Sistema...</p>
      </div>
    );
  }

  const xpPercentage = (profile.xp / profile.xp_para_proximo_nivel) * 100;
  const maxHP = Math.floor(profile.estatisticas.constituicao / 5) * 100;
  const hpPercentage = ((profile.hp_atual || maxHP) / maxHP) * 100;
  const profileRank = getProfileRank(profile.nivel);

  const statsData = [
    { subject: 'Força', value: profile.estatisticas.forca, fullMark: 100 },
    { subject: 'Inteligência', value: profile.estatisticas.inteligencia, fullMark: 100 },
    { subject: 'Sabedoria', value: profile.estatisticas.sabedoria, fullMark: 100 },
    { subject: 'Constituição', value: profile.estatisticas.constituicao, fullMark: 100 },
    { subject: 'Destreza', value: profile.estatisticas.destreza, fullMark: 100 },
    { subject: 'Carisma', value: profile.estatisticas.carisma, fullMark: 100 },
  ];

  return (
    <div className={cn("p-4 h-full overflow-y-auto font-sans", isMobile ? "p-2" : "md:p-6")}>
        <div className={cn("flex flex-col mb-4 gap-2", isMobile ? "sm:flex-col items-start" : "sm:flex-row justify-between items-start mb-6 gap-2")}>
            <h1 className={cn("font-cinzel font-bold text-primary tracking-wider", isMobile ? "text-2xl" : "text-4xl")}>STATUS</h1>
        </div>

        <div className={cn("bg-card/50 border border-border rounded-lg space-y-4 backdrop-blur-sm", isMobile ? "p-2" : "p-4 md:p-6")}>
            
            <div className={cn("flex flex-col gap-4", isMobile ? "sm:flex-col items-center" : "sm:flex-row items-center gap-6")}>
                 <div className={cn("border-2 border-primary/50 flex items-center justify-center bg-secondary/30 p-1 flex-shrink-0", 
                    isMobile ? "w-full max-w-[100px] aspect-[3/4]" : "w-full max-w-[150px] sm:max-w-[200px] aspect-[4/5]")}>
                    <Avatar className={cn("rounded-none", isMobile ? "w-full h-full" : "w-full h-full")}>
                        <AvatarImage src={profile.avatar_url} alt={profile.nome_utilizador} />
                        <AvatarFallback>{profile.nome_utilizador?.[0]}</AvatarFallback>
                    </Avatar>
                </div>
                <div className={cn("w-full text-center", isMobile ? "sm:text-center" : "sm:text-left")}>
                    <p className={cn("font-bold tracking-widest text-muted-foreground", isMobile ? "text-xs" : "text-sm")}>RANK {profileRank.rank}</p>
                    <p className={cn("font-bold text-foreground", isMobile ? "text-xl" : "text-3xl")}>{profile.nome_utilizador}</p>
                    <p className={cn("text-primary", isMobile ? "text-base" : "text-lg")}>{profileRank.title}</p>
                    
                    <div className={cn("mt-2 space-y-2", isMobile ? "space-y-1" : "space-y-3")}>
                        <div>
                            <div className={cn("flex justify-between mb-1", isMobile ? "text-xs" : "text-sm text-muted-foreground")}>
                                <span>Nível {profile.nivel}</span>
                                <span className="font-mono">{profile.xp} / {profile.xp_para_proximo_nivel} XP</span>
                            </div>
                            <Progress value={xpPercentage} className={cn("bg-primary/20", isMobile ? "h-2" : "h-4")} />
                        </div>
                         <div>
                            <div className={cn("flex justify-between mb-1", isMobile ? "text-xs" : "text-sm text-muted-foreground")}>
                                <span className="flex items-center gap-1.5"><Heart className={cn("text-red-500", isMobile ? "h-3 w-3" : "h-4 w-4")} /> Vida</span>
                                <span className="font-mono">{profile.hp_atual || maxHP} / {maxHP} HP</span>
                            </div>
                            <Progress value={hpPercentage} className={cn("bg-red-500/20 [&>div]:bg-red-500", isMobile ? "h-2" : "h-4")} />
                        </div>
                    </div>
                </div>
            </div>

            <div className={cn("gap-2", isMobile ? "grid grid-cols-2" : "grid grid-cols-2 lg:grid-cols-4 gap-4")}>
                <StatItem label="Nome" value={`${profile.primeiro_nome} ${profile.apelido}`} isMobile={isMobile}/>
                <StatItem label="Streak" value={`${profile.streak_atual || 0} Dias`} icon={Flame} isMobile={isMobile}/>
                <StatItem label="Fragmentos" value={profile.fragmentos || 0} icon={Gem} isMobile={isMobile}/>
                <StatItem label="Cristais" value={profile.dungeon_crystals || 0} icon={KeySquare} isMobile={isMobile}/>
            </div>
            
             <WorldEventCard event={activeEvent} userContribution={userContribution} isMobile={isMobile} />

            <hr className="border-border/50" />
            
            <div className={cn("items-center", isMobile ? "grid grid-cols-1 gap-4" : "grid grid-cols-1 md:grid-cols-2 gap-6")}>
                <div className={cn("w-full", isMobile ? "h-60" : "h-80")}>
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={statsData}>
                            <defs>
                                <radialGradient id="radar-fill">
                                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.5}/>
                                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.1}/>
                                </radialGradient>
                            </defs>
                            <PolarGrid stroke="hsl(var(--border))" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: 'hsl(var(--foreground))', fontSize: isMobile ? 10 : 14 }} />
                            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                            <Radar name={profile.nome_utilizador} dataKey="value" stroke="hsl(var(--primary))" fill="url(#radar-fill)" fillOpacity={0.8} />
                             <Tooltip 
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--popover))',
                                    borderColor: 'hsl(var(--border))',
                                    color: 'hsl(var(--foreground))',
                                    borderRadius: 'var(--radius)',
                                }}
                                cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1, strokeDasharray: '3 3' }}
                            />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>

                <div className={cn("gap-2", isMobile ? "grid grid-cols-2" : "grid grid-cols-1 sm:grid-cols-2 gap-4")}>
                    {statsData.map((stat) => (
                        <StatItem key={stat.subject} label={stat.subject} value={stat.value} isMobile={isMobile} />
                    ))}
                </div>
            </div>
        </div>
    </div>
  );
};

export const DashboardView = memo(DashboardViewComponent);
