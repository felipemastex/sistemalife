
"use client";

import { memo, useMemo } from 'react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip } from 'recharts';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Flame, Gem, ShieldAlert, Zap, Clock, Users } from 'lucide-react';
import { usePlayerDataContext } from '@/hooks/use-player-data.tsx';
import { Progress } from '@/components/ui/progress';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const getProfileRank = (level) => {
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
  
const StatItem = ({ label, value, icon: Icon = null }) => (
    <div className="bg-secondary/50 p-4 rounded-lg border border-border/50 transition-all hover:bg-secondary/80 hover:border-primary/50">
        <span className="text-sm text-muted-foreground flex items-center gap-2">
            {Icon && <Icon className="h-4 w-4" />}
            {label}
        </span>
        <p className="text-lg font-bold text-foreground">{value}</p>
    </div>
);

const WorldEventCard = ({ event, userContribution }) => {
    if (!event || !event.isActive) return null;

    const progressPercentage = (event.progress / event.goal.target) * 100;
    const endDate = parseISO(event.endDate);
    const timeLeft = formatDistanceToNow(endDate, { locale: ptBR, addSuffix: true });

    return (
        <Card className="bg-gradient-to-br from-purple-900/30 to-red-900/30 border-purple-500/50 mt-6 animate-in fade-in-50 duration-500">
            <CardHeader>
                <div className="flex items-center gap-3">
                    <ShieldAlert className="h-8 w-8 text-purple-400" />
                    <div>
                        <CardTitle className="text-purple-300">{event.name}</CardTitle>
                        <CardDescription>{event.description}</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <div className="flex justify-between text-sm text-muted-foreground mb-1">
                        <span>Progresso Global</span>
                        <span>{event.progress.toLocaleString()} / {event.goal.target.toLocaleString()}</span>
                    </div>
                    <Progress value={progressPercentage} className="h-3 bg-purple-400/20 [&>div]:bg-purple-500"/>
                </div>
                <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="bg-background/30 p-2 rounded-md">
                        <p className="text-xs text-muted-foreground">Sua Contribuição</p>
                        <p className="text-lg font-bold flex items-center justify-center gap-2">
                            <Zap className="h-4 w-4 text-yellow-400"/>
                            {userContribution}
                        </p>
                    </div>
                    <div className="bg-background/30 p-2 rounded-md">
                        <p className="text-xs text-muted-foreground">Tempo Restante</p>
                        <p className="text-lg font-bold flex items-center justify-center gap-2">
                           <Clock className="h-4 w-4"/>
                           {timeLeft.replace('em ','')}
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

const DashboardViewComponent = () => {
  const { profile, worldEvents } = usePlayerDataContext();
  
  const activeEvent = useMemo(() => {
    return (worldEvents || []).find(e => e.isActive);
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
    <div className="p-4 md:p-6 h-full overflow-y-auto font-sans">
        <div className="flex flex-col sm:flex-row justify-between items-start mb-6 gap-2">
            <h1 className="font-cinzel text-4xl font-bold text-primary tracking-wider">STATUS</h1>
        </div>

        <div className="bg-card/50 border border-border rounded-lg p-4 md:p-6 space-y-6 backdrop-blur-sm">
            
            <div className="flex flex-col sm:flex-row items-center gap-6">
                 <div className="w-full max-w-[150px] sm:max-w-[200px] aspect-[4/5] border-2 border-primary/50 flex items-center justify-center bg-secondary/30 p-1 flex-shrink-0">
                    <Avatar className="w-full h-full rounded-none">
                        <AvatarImage src={profile.avatar_url} alt={profile.nome_utilizador} />
                        <AvatarFallback>{profile.nome_utilizador?.[0]}</AvatarFallback>
                    </Avatar>
                </div>
                <div className="flex-1 w-full text-center sm:text-left">
                    <p className="text-sm font-bold tracking-widest text-muted-foreground">RANK {profileRank.rank}</p>
                    <p className="text-3xl font-bold text-foreground">{profile.nome_utilizador}</p>
                    <p className="text-lg text-primary">{profileRank.title}</p>
                    <div className="mt-4">
                        <div className="flex justify-between text-sm text-muted-foreground mb-1">
                            <span>Nível {profile.nivel}</span>
                            <span className="font-mono">{profile.xp} / {profile.xp_para_proximo_nivel} XP</span>
                        </div>
                        <Progress value={xpPercentage} className="h-4" />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatItem label="Nome" value={`${profile.primeiro_nome} ${profile.apelido}`}/>
                <StatItem label="Streak Atual" value={`${profile.streak_atual || 0} Dias`} icon={Flame}/>
                <StatItem label="Fragmentos" value={profile.fragmentos || 0} icon={Gem} />
                <StatItem label="Melhor Streak" value={`${profile.best_streak || 0} Dias`}/>
            </div>
            
             <WorldEventCard event={activeEvent} userContribution={userContribution} />

            <hr className="border-border/50" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div className="w-full h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={statsData}>
                            <defs>
                                <radialGradient id="radar-fill">
                                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.5}/>
                                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.1}/>
                                </radialGradient>
                            </defs>
                            <PolarGrid stroke="hsl(var(--border))" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: 'hsl(var(--foreground))', fontSize: 14 }} />
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {statsData.map((stat) => (
                        <StatItem key={stat.subject} label={stat.subject} value={stat.value} />
                    ))}
                </div>
            </div>
        </div>
    </div>
  );
};

export const DashboardView = memo(DashboardViewComponent);
