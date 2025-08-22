
import { Award, Book, BarChart, Gem, Shield } from 'lucide-react';

export const achievements = [
  // Missões
  {
    id: 'missions_1',
    name: 'Primeiro Passo',
    description: 'Complete a sua primeira missão diária.',
    icon: Award,
    criteria: { type: 'missions_completed', value: 1 },
  },
  {
    id: 'missions_2',
    name: 'Novato Determinado',
    description: 'Complete 10 missões diárias.',
    icon: Award,
    criteria: { type: 'missions_completed', value: 10 },
  },
  {
    id: 'missions_3',
    name: 'Guerreiro Consistente',
    description: 'Complete 50 missões diárias.',
    icon: Award,
    criteria: { type: 'missions_completed', value: 50 },
  },
  {
    id: 'missions_4',
    name: 'Mestre de Tarefas',
    description: 'Complete 100 missões diárias.',
    icon: Award,
    criteria: { type: 'missions_completed', value: 100 },
  },
  // Nível
  {
    id: 'level_1',
    name: 'Despertar do Caçador',
    description: 'Atinja o nível 5.',
    icon: Gem,
    criteria: { type: 'level_reached', value: 5 },
  },
  {
    id: 'level_2',
    name: 'Força Emergente',
    description: 'Atinja o nível 10.',
    icon: Gem,
    criteria: { type: 'level_reached', value: 10 },
  },
  {
    id: 'level_3',
    name: 'Veterano',
    description: 'Atinja o nível 25.',
    icon: Gem,
    criteria: { type: 'level_reached', value: 25 },
  },
  {
    id: 'level_4',
    name: 'Grão-Mestre',
    description: 'Atinja o nível 50.',
    icon: Gem,
    criteria: { type: 'level_reached', value: 50 },
  },
  // Metas
  {
    id: 'goals_1',
    name: 'O Arquiteto',
    description: 'Defina a sua primeira meta.',
    icon: Book,
    criteria: { type: 'goals_created', value: 1 },
  },
  {
    id: 'goals_2',
    name: 'Maratonista',
    description: 'Complete a sua primeira meta épica.',
    icon: Book,
    criteria: { type: 'goals_completed', value: 1 },
  },
  // Habilidades
  {
    id: 'skills_1',
    name: 'O Aprendiz',
    description: 'Adquira a sua primeira habilidade.',
    icon: BarChart,
    criteria: { type: 'skills_acquired', value: 1 },
  },
  {
    id: 'skills_2',
    name: 'Mestre de Habilidades',
    description: 'Leve uma habilidade ao nível máximo.',
    icon: BarChart,
    criteria: { type: 'skill_max_level', value: 1 },
  },
];
