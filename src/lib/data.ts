import type { LucideIcon } from "lucide-react";
import { Swords, Brain, Zap, ShieldCheck, Star, BookOpen } from 'lucide-react';

export const perfis = [
  {
    id: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
    nome_utilizador: 'Cazador_01',
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
    nome: 'Dominar os Fundamentos de Python',
    categoria: 'Desenvolvimento de Carreira',
    detalhes_smart: {
        specific: "Aprender os fundamentos de Python, incluindo tipos de dados, loops, funções, classes e manipulação de dados com a biblioteca Pandas.",
        measurable: "Concluir um curso online de Python para iniciantes (ex: 'Python for Everybody') e construir 3 projetos pequenos: um web scraper, uma API simples com Flask e uma análise de dados básica.",
        achievable: "Dedicar 1 hora por dia, 5 dias por semana, para estudo e prática focada.",
        relevant: "Ganhar uma habilidade fundamental para fazer a transição para uma carreira em Engenharia de Dados.",
        timeBound: "Alcançar a proficiência básica e completar todos os projetos em 3 meses."
    }
  },
  {
    id: 2,
    user_id: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
    nome: 'Correr uma Prova de 5km',
    categoria: 'Saúde & Fitness',
    detalhes_smart: {
        specific: "Treinar consistentemente para conseguir correr 5 quilómetros sem parar e participar de um evento de corrida oficial.",
        measurable: "Aumentar a distância de corrida em 500 metros a cada semana e registar todos os treinos numa aplicação como o Strava.",
        achievable: "Seguir um plano de treino para iniciantes 'Couch to 5k', correndo 3 vezes por semana e fazendo treino de força 2 vezes por semana.",
        relevant: "Melhorar a minha saúde cardiovascular, aumentar os meus níveis de energia e bem-estar geral.",
        timeBound: "Estar pronto para correr os 5km numa prova oficial dentro de 8 semanas."
    }
  },
  {
    id: 3,
    user_id: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
    nome: 'Ler 12 Livros de Não-Ficção',
    categoria: 'Crescimento Pessoal',
    detalhes_smart: {
        specific: "Ler um livro de não-ficção por mês, cobrindo tópicos como ciência, história, psicologia e produtividade.",
        measurable: "Acompanhar o progresso no Goodreads e escrever um breve resumo ou os 3 principais insights de cada livro lido.",
        achievable: "Ler durante 30 minutos sem distrações todas as noites antes de dormir.",
        relevant: "Expandir o meu conhecimento em diferentes áreas, melhorar o meu pensamento crítico e desenvolver o hábito da leitura.",
        timeBound: "Ler 12 livros até 31 de dezembro."
    }
  },
];


export const missoes = [
  // Missões Épicas (Ranqueadas)
  {
    id: 201,
    nome: 'O Primeiro "Hello World"',
    descricao: 'A jornada para se tornar um mestre em Python começa com uma única linha de código. Execute o seu primeiro script.',
    concluido: false,
    rank: 'E',
    level_requirement: 1,
    meta_associada: "Dominar os Fundamentos de Python",
    total_missoes_diarias: 10,
    ultima_missao_concluida_em: null, // Novo campo
    missoes_diarias: [
        { id: 101, nome: 'Instalar o Compilador Python', descricao: 'Aceda a python.org, descarregue e instale a versão mais recente do Python no seu sistema operativo.', concluido: true, xp_conclusao: 15, tipo: 'diaria' },
        { id: 102, nome: 'Configurar o Editor de Código', descricao: 'Abra o VS Code, aceda à loja de extensões e instale a extensão oficial "Python" da Microsoft.', concluido: true, xp_conclusao: 15, tipo: 'diaria' },
        { id: 103, nome: 'Invocar o Terminal', descricao: 'Crie um novo ficheiro chamado hello.py e escreva a linha: print("Hello, World!"). Execute o ficheiro no terminal com o comando `python hello.py`.', concluido: false, xp_conclusao: 20, tipo: 'diaria' },
    ]
  },
  {
    id: 202,
    nome: 'O Despertar do Corredor',
    descricao: 'Sinta o vento no rosto e o chão sob os seus pés. Complete a sua primeira corrida de 1km sem parar.',
    concluido: false,
    rank: 'E',
    level_requirement: 3,
    meta_associada: "Correr uma Prova de 5km",
    total_missoes_diarias: 10,
    ultima_missao_concluida_em: null, // Novo campo
    missoes_diarias: [
       { id: 104, nome: 'Preparar o Equipamento de Batalha', descricao: 'Separe os seus sapatos de corrida, meias confortáveis e roupas adequadas para o clima de hoje.', concluido: true, xp_conclusao: 10, tipo: 'diaria' },
       { id: 105, nome: 'Ritual de Aquecimento', descricao: 'Faça uma caminhada rápida de 5 minutos seguida de 5 minutos de alongamentos dinâmicos focados nas pernas e ancas.', concluido: false, xp_conclusao: 20, tipo: 'diaria' },
    ]
  },
    {
    id: 203,
    nome: 'Páginas do Conhecimento',
    descricao: 'A sabedoria dos antigos e modernos espera por si. Conclua a leitura do seu primeiro livro do ano.',
    concluido: false,
    rank: 'D',
    level_requirement: 5,
    meta_associada: "Ler 12 Livros de Não-Ficção",
    total_missoes_diarias: 12,
    ultima_missao_concluida_em: null,
    missoes_diarias: [
        { id: 106, nome: 'A Escolha do Tomo', descricao: 'Pesquise e selecione o primeiro livro de não-ficção que você lerá este ano. Adicione-o à sua lista de leitura no Goodreads ou numa aplicação similar.', concluido: false, xp_conclusao: 20, tipo: 'diaria' },
    ]
    },
  {
    id: 204,
    nome: 'Conquistador de Algoritmos',
    descricao: 'A lógica é a sua espada. Resolva 20 problemas de algoritmos de nível fácil para afiar a sua lâmina.',
    concluido: false,
    rank: 'B',
    level_requirement: 15,
    meta_associada: "Dominar os Fundamentos de Python",
    total_missoes_diarias: 20,
    ultima_missao_concluida_em: null, // Novo campo
     missoes_diarias: [
        { id: 107, nome: 'Entrar na Arena', descricao: 'Crie uma conta no LeetCode, HackerRank ou Beecrowd e resolva o primeiro problema "Two Sum".', concluido: false, xp_conclusao: 25, tipo: 'diaria' },
    ]
  },
    {
    id: 205,
    nome: 'O Arquiteto de Dados',
    descricao: 'Construa uma API RESTful totalmente funcional que sirva como a espinha dorsal para futuras aplicações.',
    concluido: false,
    rank: 'A',
    level_requirement: 25,
    meta_associada: "Dominar os Fundamentos de Python",
    total_missoes_diarias: 25,
    ultima_missao_concluida_em: null,
     missoes_diarias: [
        { id: 108, nome: 'Fundação com Flask', descricao: 'Configure um novo projeto Flask e crie um endpoint básico que retorne um JSON de "status: online".', concluido: false, xp_conclusao: 35, tipo: 'diaria' },
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
    'Desenvolvimento de Carreira',
    'Saúde & Fitness',
    'Crescimento Pessoal',
    'Finanças',
    'Hobbies & Criatividade',
    'Social & Relacionamentos',
    'Cultura & Conhecimento',
    'Viagens & Aventura'
];
