
import { Shield, Zap } from 'lucide-react';

export const shopItems = [
  {
    id: 'potion_double_xp_1h',
    name: 'Poção de Foco Intenso',
    description: 'Dobra todo o XP ganho de missões durante 1 hora. O tempo começa a contar a partir da compra.',
    price: 150,
    icon: Zap,
    category: 'Consumíveis',
    effect: { type: 'xp_boost', multiplier: 2, duration_hours: 1 }
  },
  {
    id: 'amulet_streak_recovery',
    name: 'Amuleto da Segunda Chance',
    description: 'Se a sua sequência for quebrada, este amuleto é consumido para a restaurar ao seu valor anterior. Uso único.',
    price: 300,
    icon: Shield,
    category: 'Consumíveis',
    effect: { type: 'streak_recovery' }
  },
];
