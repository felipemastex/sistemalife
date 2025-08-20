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
    detalhes_smart: {
        specific: "Aprender os fundamentos de Python, incluindo tipos de dados, loops, funções e manipulação de dados.",
        measurable: "Concluir um curso online de Python para iniciantes e construir 3 projetos pequenos.",
        achievable: "Dedicar 1 hora por dia, 5 dias por semana, para estudo e prática.",
        relevant: "Ganhar uma habilidade fundamental para avançar na minha carreira de tecnologia.",
        timeBound: "Alcançar a proficiência básica e completar os projetos em 3 meses."
    }
  },
  {
    id: 2,
    user_id: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
    nome: 'Correr uma maratona de 5km',
    categoria: 'Saúde & Fitness',
    detalhes_smart: {
        specific: "Treinar para conseguir correr 5 quilómetros sem parar.",
        measurable: "Aumentar a distância de corrida em 500 metros a cada semana.",
        achievable: "Seguir um plano de treino para iniciantes, correndo 3 vezes por semana.",
        relevant: "Melhorar a minha saúde cardiovascular e bem-estar geral.",
        timeBound: "Estar pronto para correr os 5km em 8 semanas."
    }
  },
  {
    id: 3,
    user_id: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
    nome: 'Ler 12 livros este ano',
    categoria: 'Cultura',
    detalhes_smart: {
        specific: "Ler um livro de não-ficção por mês.",
        measurable: "Acompanhar o progresso de leitura e terminar um livro a cada 4 semanas.",
        achievable: "Ler durante 30 minutos antes de dormir todas as noites.",
        relevant: "Expandir o meu conhecimento em diferentes áreas e desenvolver o hábito da leitura.",
        timeBound: "Ler 12 livros até o final do ano."
    }
  },
];


export const missoes = [
  // Missões Épicas (Ranqueadas)
  {
    id: 201,
    nome: 'O Primeiro "Hello World"',
    descricao: 'Escreva e execute o seu primeiro script em Python.',
    concluido: false,
    rank: 'E',
    level_requirement: 1,
    meta_associada: "Aprender a programar em Python",
    total_missoes_diarias: 5,
    ultima_missao_concluida_em: null, // Novo campo
    missoes_diarias: [
        { id: 101, nome: 'Instalar o Python', descricao: 'Instale a versão mais recente do Python no seu sistema.', concluido: true, xp_conclusao: 15, tipo: 'diaria' },
        { id: 102, nome: 'Abrir um Editor de Código', descricao: 'Abra o VS Code ou outro editor e crie um novo ficheiro chamado hello.py.', concluido: true, xp_conclusao: 15, tipo: 'diaria' },
        { id: 103, nome: 'Escrever uma linha de código', descricao: 'Digite `print("Hello, World!")` no seu ficheiro hello.py.', concluido: false, xp_conclusao: 20, tipo: 'diaria' },
    ]
  },
  {
    id: 202,
    nome: 'O Despertar do Corredor',
    descricao: 'Complete a sua primeira corrida de 1km sem parar.',
    concluido: false,
    rank: 'E',
    level_requirement: 3,
    meta_associada: "Correr uma maratona de 5km",
    total_missoes_diarias: 10,
    ultima_missao_concluida_em: null, // Novo campo
    missoes_diarias: [
       { id: 104, nome: 'Prepare o seu equipamento', descricao: 'Separe os seus sapatos de corrida e roupas adequadas.', concluido: true, xp_conclusao: 10, tipo: 'diaria' },
       { id: 105, nome: 'Caminhada Rápida de 5 Minutos', descricao: 'Faça uma caminhada rápida de 5 minutos para aquecer o corpo.', concluido: false, xp_conclusao: 20, tipo: 'diaria' },
    ]
  },
    {
    id: 203,
    nome: 'Páginas do Conhecimento',
    descricao: 'Conclua a leitura do seu primeiro livro do ano.',
    concluido: false,
    rank: 'D',
    level_requirement: 5,
    meta_associada: "Ler 12 livros este ano",
    total_missoes_diarias: 12,
    ultima_missao_concluida_em: null,
    missoes_diarias: [
        { id: 106, nome: 'Escolha seu primeiro livro', descricao: 'Selecione o primeiro livro que você lerá este ano.', concluido: false, xp_conclusao: 20, tipo: 'diaria' },
    ]
    },
  {
    id: 204,
    nome: 'Conquistador de Algoritmos',
    descricao: 'Resolva 10 problemas de algoritmos de nível fácil em qualquer plataforma online.',
    concluido: false,
    rank: 'C',
    level_requirement: 15,
    meta_associada: "Aprender a programar em Python",
    total_missoes_diarias: 10,
    ultima_missao_concluida_em: null, // Novo campo
     missoes_diarias: [
        { id: 107, nome: 'Escolha a sua plataforma', descricao: 'Crie uma conta no LeetCode, HackerRank ou Beecrowd.', concluido: false, xp_conclusao: 25, tipo: 'diaria' },
    ]
  }
];

export const habilidades = [
    { id: 1, nome: 'Programação Python', descricao: 'Capacidade de escrever código em Python.', nivel_atual: 2, nivel_maximo: 10, pre_requisito: null },
    { id: 2, nome: 'Lógica de Programação', descricao: 'Compreensão fundamental de algoritmos e estruturas de dados.', nivel_atual: 3, nivel_maximo: 10, pre_requisito: null },
    { id: 3, nome: 'Web Scraping com Python', descricao: 'Extrair dados de websites usando bibliotecas como BeautifulSoup e Scrapy.', nivel_atual: 0, nivel_maximo: 5, pre_requisito: 1 },
    { id: 4, nome: 'Corrida de Resistência', descricao: 'Capacidade de correr por longos períodos.', nivel_atual: 1, nivel_maximo: 10, pre_requisito: null },
    { id: 5, nome: 'Gestão Financeira Pessoal', descricao: 'Capacidade de gerir orçamento, investimentos e poupanças.', nivel_atual: 2, nivel_maximo: 10, pre_requisito: null },
];

export const categoriasMetas = [
    'Desenvolvimento Pessoal',
    'Saúde & Fitness',
    'Carreira',
    'Finanças',
    'Hobbies & Criatividade',
    'Social & Relacionamentos',
    'Cultura & Conhecimento',
    'Viagens & Aventura'
];
