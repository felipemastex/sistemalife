
"use client";

import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip } from 'recharts';
import { cn } from '@/lib/utils';


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

  const getRankColor = (rank) => {
    switch (rank) {
      case 'F': return 'border-gray-500 text-gray-300';
      case 'E': return 'border-green-500 text-green-300';
      case 'D': return 'border-cyan-500 text-cyan-300';
      case 'C': return 'border-blue-500 text-blue-300';
      case 'B': return 'border-purple-500 text-purple-300';
      case 'A': return 'border-red-500 text-red-300';
      case 'S': return 'border-yellow-400 text-yellow-300 shadow-[0_0_15px_rgba(250,204,21,0.5)]';
      case 'SS': return 'border-orange-500 text-orange-300 shadow-[0_0_15px_rgba(249,115,22,0.5)]';
      case 'SSS': return 'border-fuchsia-500 text-fuchsia-300 shadow-[0_0_20px_rgba(217,70,239,0.6)] animate-pulse';
      default: return 'border-gray-600 text-gray-400';
    }
  };

  if (!profile || !profile.estatisticas) {
    return (
      <div className="p-6 h-full flex items-center justify-center">
        <p className="text-cyan-400 text-lg">A carregar dados do Sistema...</p>
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
  
  const StatItem = ({ label, value }) => (
    <div>
        <p className="text-sm text-gray-400">{label}</p>
        <p className="text-lg font-bold text-gray-100">{value}</p>
    </div>
  );

  return (
    <div className="p-4 md:p-6 space-y-6 bg-background h-full overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center">
            <h1 className="text-2xl md:text-3xl font-bold text-primary">STATUS</h1>
            <div className="text-right">
                <p className="text-lg font-semibold text-gray-200">{profile.nome_utilizador}</p>
                <p className="text-sm text-gray-400">Nível: {profile.nivel}</p>
            </div>
        </div>

        {/* Main Content Card */}
        <div className="bg-card border border-border rounded-lg p-4 md:p-6 space-y-6">
            
            {/* Profile Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                <div className="md:col-span-2 space-y-3">
                    <StatItem label="Nome" value={profile.nome_utilizador} />
                    <StatItem label="Nível" value={profile.nivel} />
                    <StatItem label="Título" value={profileRank.title} />
                </div>
                <div className="flex flex-col items-center justify-center space-y-2">
                    <div className={cn("w-24 h-24 border-2 flex items-center justify-center font-bold text-5xl bg-black/20", getRankColor(profileRank.rank))}>
                        {profileRank.rank}
                    </div>
                    <p className="text-lg font-semibold text-gray-300">RANK</p>
                </div>
            </div>
            
            <hr className="border-border/50" />
            
            {/* Stats Grid & Radar Chart */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div className="space-y-3">
                   {statsData.map(stat => (
                     <div key={stat.subject} className="flex justify-between items-baseline">
                         <p className="text-base text-gray-300">{stat.subject}</p>
                         <p className="font-mono text-lg font-medium text-primary">{stat.value}</p>
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
                                    backgroundColor: 'hsl(var(--card))',
                                    borderColor: 'hsl(var(--border))',
                                    color: 'hsl(var(--foreground))'
                                }}
                            />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>
            </div>

        </div>

         {/* XP Bar */}
        <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex justify-between text-sm text-gray-300 mb-1">
                <span>XP para o próximo Nível</span>
                <span className="font-mono">{profile.xp} / {profile.xp_para_proximo_nivel}</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-4 overflow-hidden border border-border">
                <div className="bg-primary h-full transition-all duration-500" style={{ width: `${xpPercentage}%` }}></div>
            </div>
        </div>
    </div>
  );
};
