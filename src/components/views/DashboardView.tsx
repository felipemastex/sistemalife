
"use client";

import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip } from 'recharts';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";


export const DashboardView = ({ profile }) => {
  const getProfileRank = (level) => {
    if (level <= 5) return { rank: 'F', title: 'Novato' };
    if (level <= 10) return { rank: 'E', title: 'Iniciante' };
    if (level <= 20) return { rank: 'D', title: 'Adepto' };
    if (level <= 30) return { rank: 'C', title: 'Experiente' };
    if (level <= 40) return { rank: 'B', title: 'Perito' };
    if (level <= 50) return { rank: 'A', title: 'Mestre' };
    if (level <= 70) return { rank: 'S', title: 'Grão-Mestre' };
    if (level <= 90) return { rank: 'SS', title: 'Herói' };
    return { rank: 'SSS', title: 'Lendário' };
  };
  
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
    { subject: 'Força', value: profile.estatisticas.forca, fullMark: 50 },
    { subject: 'Int.', value: profile.estatisticas.inteligencia, fullMark: 50 },
    { subject: 'Sab.', value: profile.estatisticas.sabedoria, fullMark: 50 },
    { subject: 'Const.', value: profile.estatisticas.constituicao, fullMark: 50 },
    { subject: 'Destr.', value: profile.estatisticas.destreza, fullMark: 50 },
    { subject: 'Carisma', value: profile.estatisticas.carisma, fullMark: 50 },
  ];
  
  const StatItem = ({ label, value, className = '' }) => (
    <div className={className}>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-lg font-bold text-foreground">{value}</p>
    </div>
  );

  return (
    <div className="p-4 md:p-6 h-full overflow-y-auto">
        <div className="bg-card/50 border border-border rounded-lg p-4 md:p-6 space-y-6 backdrop-blur-sm">
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1">
                     <Avatar className="h-full w-full rounded-md border-2 border-primary/50">
                        <AvatarImage src={profile.avatar_url} alt={profile.nome_utilizador} className="object-cover"/>
                        <AvatarFallback className="text-6xl rounded-md bg-secondary">
                          {profile.nome_utilizador?.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                </div>

                <div className="md:col-span-2 grid grid-cols-2 gap-x-6 gap-y-4">
                    <StatItem label="Nome" value={profile.nome_utilizador} className="col-span-2" />
                    <StatItem label="Nível" value={profile.nivel} />
                    <StatItem label="Título" value={profileRank.title} />
                    <StatItem label="Rank" value={profileRank.rank} />
                    <StatItem label="Status" value="Ativo" />
                </div>
            </div>
            
            <hr className="border-border/50" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div className="grid grid-cols-2 gap-4">
                   {statsData.map(stat => (
                     <div key={stat.subject} className="bg-secondary/50 p-3 rounded-md border border-border/50">
                        <p className="text-base text-muted-foreground">{stat.subject}</p>
                        <p className="font-mono text-xl font-medium text-primary">{stat.value}</p>
                     </div>
                   ))}
                </div>
                <div className="w-full h-64 md:h-80">
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
                            <PolarRadiusAxis angle={30} domain={[0, 'dataMax + 10']} tick={false} axisLine={false} />
                            <Radar name={profile.nome_utilizador} dataKey="value" stroke="hsl(var(--primary))" fill="url(#radar-fill)" fillOpacity={0.8} />
                             <Tooltip 
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--popover))',
                                    borderColor: 'hsl(var(--border))',
                                    color: 'hsl(var(--foreground))'
                                }}
                                cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1, strokeDasharray: '3 3' }}
                            />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>
            </div>

             {/* XP Bar */}
            <div>
                <div className="flex justify-between text-sm text-muted-foreground mb-1">
                    <span>XP</span>
                    <span className="font-mono">{profile.xp} / {profile.xp_para_proximo_nivel}</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-4 overflow-hidden border border-border/50">
                    <div className="bg-primary h-full transition-all duration-500" style={{ width: `${xpPercentage}%` }}></div>
                </div>
            </div>
        </div>
    </div>
  );
};
