import type { LucideIcon } from "lucide-react";
import { Swords, Brain, Zap, ShieldCheck, Star, BookOpen } from 'lucide-react';

export const perfis = [
  {
    id: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
    nome_utilizador: 'Utilizador_01',
    nivel: 12,
    xp: 450,
    xp_para_proximo_nivel: 1200,
    estatisticas: {
      forca: 15,
      inteligencia: 22,
      destreza: 18,
      constituicao: 16,
      sabedoria: 20,
      carisma: 17,
    },
  },
];

export const metas = [
  {
    id: 1,
    user_id: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
    nome: 'Aprender a programar em Python',
    categoria: 'Desenvolvimento Pessoal',
  },
  {
    id: 2,
    user_id: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
    nome: 'Correr uma maratona de 5km',
    categoria: 'Saúde & Fitness',
  },
  {
    id: 3,
    user_id: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
    nome: 'Ler 12 livros este ano',
    categoria: 'Cultura',
  },
];

export const missoes = [
  // Missões Diárias (serão geradas pela IA)
  {
    id: 101,
    user_id: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
    nome: 'Estudar Python por 30 minutos',
    descricao: 'Complete uma lição no seu curso de Python.',
    concluido: true,
    tipo: 'diaria',
    xp_conclusao: 25,
  },
  {
    id: 102,
    user_id: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
    nome: 'Caminhada de 15 minutos',
    descricao: 'Faça uma pequena pausa para se movimentar.',
    concluido: false,
    tipo: 'diaria',
    xp_conclusao: 15,
  },
  // Missões Ranqueadas
  {
    id: 201,
    nome: 'O Primeiro "Hello World"',
    descricao: 'Escreva e execute o seu primeiro script em Python.',
    concluido: true,
    xp_conclusao: 100,
    rank: 'E',
    level_requirement: 1,
  },
  {
    id: 202,
    nome: 'O Despertar do Corredor',
    descricao: 'Complete a sua primeira corrida de 1km sem parar.',
    concluido: false,
    xp_conclusao: 150,
    rank: 'E',
    level_requirement: 3,
  },
  {
    id: 203,
    nome: 'Iniciativa do Investidor',
    descricao: 'Abra uma conta numa corretora e faça o seu primeiro investimento.',
    concluido: false,
    xp_conclusao: 500,
    rank: 'D',
    level_requirement: 10,
  },
   {
    id: 204,
    nome: 'Conquistador de Algoritmos',
    descricao: 'Resolva 10 problemas de algoritmos de nível fácil em qualquer plataforma online.',
    concluido: false,
    xp_conclusao: 1200,
    rank: 'C',
    level_requirement: 15,
  }
];

export const habilidades = [
    { id: 1, nome: 'Programação Python', descricao: 'Capacidade de escrever código em Python.', nivel_atual: 2, nivel_maximo: 10, pre_requisito: null },
    { id: 2, nome: 'Lógica de Programação', descricao: 'Compreensão fundamental de algoritmos e estruturas de dados.', nivel_atual: 3, nivel_maximo: 10, pre_requisito: null },
    { id: 3, nome: 'Web Scraping com Python', descricao: 'Extrair dados de websites usando bibliotecas como BeautifulSoup e Scrapy.', nivel_atual: 0, nivel_maximo: 5, pre_requisito: 1 },
    { id: 4, nome: 'Corrida de Resistência', descricao: 'Capacidade de correr por longos períodos.', nivel_atual: 1, nivel_maximo: 10, pre_requisito: null },
    { id: 5, nome: 'Gestão Financeira Pessoal', descricao: 'Capacidade de gerir orçamento, investimentos e poupanças.', nivel_atual: 2, nivel_maximo: 10, pre_requisito: null },
];
