
"use client";

import { useMemo, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePlayerDataContext } from '@/hooks/use-player-data';
import { Flame, CheckCircle, Percent, Trophy } from 'lucide-react';
import { subDays, isAfter } from 'date-fns';

const StatCard = memo(({ icon: Icon, title, value, unit, color }) => (
    <Card className="bg-card/60 border-border/80">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
            <Icon className={`h-5 w-5 ${color || 'text-muted-foreground'}`} />
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold text-foreground">{value} <span className="text-base font-normal">{unit}</span></div>
        </CardContent>
    </Card>
));

const MissionStatsPanelComponent = () => {
    const { profile, missions } = usePlayerDataContext();

    const weeklyCompletionRate = useMemo(() => {
        const oneWeekAgo = subDays(new Date(), 7);
        const missionsLastWeek = missions
            .flatMap(m => m.missoes_diarias || [])
            .filter(dm => dm.completed_at && isAfter(new Date(dm.completed_at), oneWeekAgo));
            
        // This is a simplification. A more accurate rate would need to know how many missions were *available* in the last 7 days.
        // For now, we'll just count completed ones.
        const completedCount = missionsLastWeek.length;
        
        // Let's assume an average of 1 mission per day for the rate calculation.
        const totalPossible = 7;
        
        if (totalPossible === 0) return 0;
        return Math.round((completedCount / totalPossible) * 100);

    }, [missions]);

    return (
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard 
                icon={Flame} 
                title="Streak Atual" 
                value={profile?.streak_atual || 0} 
                unit="dias"
                color="text-orange-400"
            />
            <StatCard 
                icon={Trophy} 
                title="Melhor Streak" 
                value={profile?.best_streak || profile?.streak_atual || 0} 
                unit="dias"
            />
            <StatCard 
                icon={CheckCircle} 
                title="Total de Missões" 
                value={profile?.missoes_concluidas_total || 0}
            />
            <StatCard 
                icon={Percent} 
                title="Conclusão Semanal" 
                value={weeklyCompletionRate}
                unit="%"
            />
        </div>
    );
};

export const MissionStatsPanel = memo(MissionStatsPanelComponent);
