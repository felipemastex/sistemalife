
import { LucideIcon, Award, Book, BarChart, Gem, Shield, Flame, Trophy, BrainCircuit, Star, Swords } from 'lucide-react';

interface Achievement {
    id: string;
    name: string;
    description: string;
    icon: LucideIcon;
    criteria: {
        type: 'missions_completed' | 'level_reached' | 'goals_completed' | 'skill_level_reached' | 'streak_maintained';
        value: number;
        category?: string; // e.g., 'Saúde & Fitness'
    };
}

export const achievements: Achievement[] = [
    // Level Based
    {
        id: 'level_5',
        name: 'Caçador Promissor',
        description: 'Alcance o nível 5. A sua jornada está apenas a começar.',
        icon: Star,
        criteria: { type: 'level_reached', value: 5 }
    },
    {
        id: 'level_10',
        name: 'Veterano de Batalha',
        description: 'Alcance o nível 10. Você já viu alguns desafios e sobreviveu.',
        icon: Star,
        criteria: { type: 'level_reached', value: 10 }
    },
    {
        id: 'level_25',
        name: 'Herói do Reino',
        description: 'Alcance o nível 25. O seu nome começa a ser sussurrado em tavernas.',
        icon: Trophy,
        criteria: { type: 'level_reached', value: 25 }
    },

    // Mission Based
    {
        id: 'missions_1',
        name: 'O Primeiro Passo',
        description: 'Complete a sua primeira missão. Toda grande jornada começa com uma única tarefa.',
        icon: Award,
        criteria: { type: 'missions_completed', value: 1 }
    },
    {
        id: 'missions_10',
        name: 'Trabalhador Incansável',
        description: 'Complete 10 missões diárias. A consistência é a sua arma.',
        icon: Award,
        criteria: { type: 'missions_completed', value: 10 }
    },
    {
        id: 'missions_50',
        name: 'Mestre de Tarefas',
        description: 'Complete 50 missões diárias. A produtividade corre nas suas veias.',
        icon: Gem,
        criteria: { type: 'missions_completed', value: 50 }
    },

    // Streak Based
    {
        id: 'streak_3',
        name: 'Ímpeto Inicial',
        description: 'Mantenha uma sequência de 3 dias de missões concluídas.',
        icon: Flame,
        criteria: { type: 'streak_maintained', value: 3 }
    },
    {
        id: 'streak_7',
        name: 'Fogo Consistente',
        description: 'Mantenha uma sequência de 7 dias. Uma semana de pura dedicação!',
        icon: Flame,
        criteria: { type: 'streak_maintained', value: 7 }
    },
    {
        id: 'streak_30',
        name: 'Força do Hábito',
        description: 'Mantenha uma sequência de 30 dias. A sua disciplina é inabalável.',
        icon: Flame,
        criteria: { type: 'streak_maintained', value: 30 }
    },

    // Goal Based
    {
        id: 'goal_1',
        name: 'Visionário',
        description: 'Defina e conclua a sua primeira meta de longo prazo.',
        icon: Book,
        criteria: { type: 'goals_completed', value: 1 }
    },
];

export default achievements;
