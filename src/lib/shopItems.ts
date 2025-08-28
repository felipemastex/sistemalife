
import { LucideIcon } from 'lucide-react';

interface ShopItem {
    id: string;
    name: string;
    description: string;
    price: number;
    icon: string; // Changed from LucideIcon to string
    category: 'Consumíveis' | 'Cosméticos' | 'Especiais';
    effect?: {
        type: 'xp_boost' | 'streak_recovery' | 'skill_xp_boost' | 'mission_reroll';
        multiplier?: number;
        duration_hours?: number;
        amount?: number;
    }
}


export const allShopItems: ShopItem[] = [
  {
    id: 'potion_double_xp_1h',
    name: 'Poção de Foco Intenso',
    description: 'Dobra todo o XP ganho de missões durante 1 hora. O tempo começa a contar a partir do momento em que o item é usado.',
    price: 150,
    icon: 'Zap',
    category: 'Consumíveis',
    effect: { type: 'xp_boost', multiplier: 2, duration_hours: 1 }
  },
  {
    id: 'amulet_streak_recovery',
    name: 'Amuleto da Segunda Chance',
    description: 'Se a sua sequência de missões diárias for quebrada, este amuleto é consumido para a restaurar ao seu valor anterior. Uso único.',
    price: 300,
    icon: 'Shield',
    category: 'Consumíveis',
    effect: { type: 'streak_recovery' }
  },
  {
    id: 'essence_of_skill',
    name: 'Essência de Habilidade',
    description: 'Concede um impulso de 50 XP a uma habilidade à sua escolha. Perfeito para acelerar o progresso numa área específica.',
    price: 200,
    icon: 'BookOpen',
    category: 'Consumíveis',
    effect: { type: 'skill_xp_boost', amount: 50 }
  },
  {
    id: 'scroll_of_reroll',
    name: 'Pergaminho do Esquecimento',
    description: 'Permite-lhe substituir as sub-tarefas de uma missão diária ativa por um novo conjunto gerado pela IA. Uso único.',
    price: 100,
    icon: 'Repeat',
    category: 'Consumíveis',
    effect: { type: 'mission_reroll' }
  },
   {
    id: 'cosmetic_leather_armor',
    name: 'Armadura de Couro do Caçador',
    description: 'Um conjunto de armadura de couro simples, mas resistente. Um visual clássico para qualquer aventureiro.',
    price: 500,
    icon: 'Shirt',
    category: 'Cosméticos',
  },
  {
    id: 'tower_ticket',
    name: 'Ticket da Torre',
    description: 'Concede uma tentativa para enfrentar um desafio na Torre. Pode comprar 1 por dia.',
    price: 250,
    icon: 'Ticket',
    category: 'Especiais',
  },
];
