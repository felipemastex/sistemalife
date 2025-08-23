
import type { LucideIcon } from "lucide-react";
import { Swords, Brain, Zap, ShieldCheck, Star, BookOpen } from 'lucide-react';

export const perfis = [
  {
    id: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
    nome_utilizador: 'Cazador_01',
    primeiro_nome: 'Cazador',
    apelido: '01',
    avatar_url: 'https://placehold.co/100x100.png',
    nivel: 1,
    xp: 0,
    xp_para_proximo_nivel: 100, // XP necessário para ir do nível 1 para o 2
    fragmentos: 0, // Moeda do jogo
    inventory: [], // Inventário de itens. Ex: [{ itemId: 'potion_double_xp_1h', purchaseDate: '...', instanceId: '...' }]
    active_effects: [], // Efeitos ativos. Ex: [{ itemId: 'potion_double_xp_1h', type: 'xp_boost', expires_at: '...' }]
    estatisticas: {
      forca: 5,
      inteligencia: 5,
      destreza: 5,
      constituicao: 5,
      sabedoria: 5,
      carisma: 5,
    },
    genero: 'Não especificado',
    nacionalidade: 'Não especificada',
    status: 'Ativo',
    missoes_concluidas_total: 0,
    achievements: [], // Ex: [{ achievementId: 'missions_1', date: '2024-01-01' }]
    streak_atual: 0,
    ultimo_dia_de_missao_concluida: null, // formato ISO: 'YYYY-MM-DD'
    guild_id: null,
    guild_role: null,
    mission_view_style: 'inline', // 'inline' or 'popup'
  },
];

export const metas = [
  {
    id: 1,
    user_id: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
    nome: 'Dominar os Fundamentos de Python',
    categoria: 'Desenvolvimento de Carreira',
    habilidade_associada_id: 1,
    prazo: '2024-12-31',
    concluida: false,
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
    habilidade_associada_id: 2,
    prazo: '2024-10-25',
    concluida: false,
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
    habilidade_associada_id: 3,
    prazo: null,
    concluida: false,
    detalhes_smart: {
        specific: "Ler um livro de não-ficção por mês, cobrindo tópicos como ciência, história, psicologia e produtividade.",
        measurable: "Acompanhar o progresso no Goodreads e escrever um breve resumo ou os 3 principais insights de cada livro lido.",
        achievable: "Ler durante 30 minutos sem distrações todas as noites antes de dormir.",
        relevant: "Expandir o meu conhecimento em diferentes áreas, melhorar o meu pensamento crítico e desenvolver o hábito da leitura.",
        timeBound: "Ler 12 livros até 31 de dezembro."
    }
  },
];

export const habilidades = [
    { 
        id: 1, 
        nome: 'Programação Python', 
        descricao: 'A capacidade de escrever código limpo, eficiente e robusto em Python.', 
        categoria: 'Desenvolvimento de Carreira',
        nivel_atual: 5, 
        nivel_maximo: 10,
        xp_atual: 120, 
        xp_para_proximo_nivel: 250, 
        pre_requisito: null, 
        nivel_minimo_para_desbloqueio: null,
        ultima_atividade_em: new Date().toISOString(),
    },
    { 
        id: 2, 
        nome: 'Corrida de Resistência', 
        descricao: 'A capacidade de correr longas distâncias mantendo um ritmo consistente.', 
        categoria: 'Saúde & Fitness',
        nivel_atual: 3, 
        nivel_maximo: 10,
        xp_atual: 50, 
        xp_para_proximo_nivel: 150, 
        pre_requisito: null, 
        nivel_minimo_para_desbloqueio: null,
        ultima_atividade_em: new Date().toISOString(),
    },
    { 
        id: 3, 
        nome: 'Leitura Focada', 
        descricao: 'A capacidade de ler, compreender e reter informações de textos complexos.', 
        categoria: 'Crescimento Pessoal',
        nivel_atual: 7, 
        nivel_maximo: 10,
        xp_atual: 400, 
        xp_para_proximo_nivel: 600, 
        pre_requisito: null, 
        nivel_minimo_para_desbloqueio: null,
        ultima_atividade_em: new Date().toISOString(),
    },
];

export const missoes = [
  // --- Cadeia de Missões: Dominar os Fundamentos de Python ---
  {
    id: 201,
    nome: 'O Primeiro "Hello World"',
    descricao: 'A jornada para se tornar um mestre em Python começa com uma única linha de código. Execute o seu primeiro script.',
    concluido: false,
    rank: 'E',
    level_requirement: 1,
    meta_associada: "Dominar os Fundamentos de Python",
    total_missoes_diarias: 10,
    ultima_missao_concluida_em: null,
    missoes_diarias: [
        { id: 101, nome: 'Sessão de Instalação', concluido: true, xp_conclusao: 15, fragmentos_conclusao: 2, tipo: 'diaria', subTasks: [{ name: 'Instalar Python', target: 1, unit: 'ação', current: 1}] },
        { id: 102, nome: 'Configuração do Ambiente', concluido: true, xp_conclusao: 15, fragmentos_conclusao: 2, tipo: 'diaria', subTasks: [{ name: 'Instalar extensão Python no VSCode', target: 1, unit: 'ação', current: 1}] },
        { id: 103, nome: 'Invocando o Terminal', concluido: false, xp_conclusao: 20, fragmentos_conclusao: 3, tipo: 'diaria', subTasks: [{ name: 'Executar "Hello, World!"', target: 1, unit: 'vez', current: 0 }] },
    ]
  },
   {
    id: 204,
    nome: 'O Conquistador de Algoritmos',
    descricao: 'A lógica é a sua espada. Resolva problemas de algoritmos para afiar a sua lâmina.',
    concluido: false,
    rank: 'D',
    level_requirement: 5,
    meta_associada: "Dominar os Fundamentos de Python",
    total_missoes_diarias: 15,
    ultima_missao_concluida_em: null,
     missoes_diarias: [
        { id: 107, nome: 'Entrar na Arena', concluido: false, xp_conclusao: 25, fragmentos_conclusao: 5, tipo: 'diaria', subTasks: [{ name: 'Resolver problema "Two Sum" no LeetCode', target: 1, unit: 'problema', current: 0 }] },
    ]
  },
  {
    id: 205,
    nome: 'O Ferreiro de Dados',
    descricao: 'Domine a arte de manipular dados com a biblioteca Pandas, o canivete suíço dos analistas de dados.',
    concluido: false,
    rank: 'C',
    level_requirement: 10,
    meta_associada: "Dominar os Fundamentos de Python",
    total_missoes_diarias: 20,
    ultima_missao_concluida_em: null,
    missoes_diarias: [
        { id: 109, nome: 'Importar o Arsenal', concluido: false, xp_conclusao: 30, fragmentos_conclusao: 6, tipo: 'diaria', subTasks: [{ name: 'Importar Pandas em Jupyter Notebook', target: 1, unit: 'vez', current: 0 }] },
    ]
  },
  {
    id: 206,
    nome: 'O Arquiteto de APIs',
    descricao: 'Construa uma API RESTful totalmente funcional que sirva como a espinha dorsal para futuras aplicações.',
    concluido: false,
    rank: 'B',
    level_requirement: 15,
    meta_associada: "Dominar os Fundamentos de Python",
    total_missoes_diarias: 25,
    ultima_missao_concluida_em: null,
     missoes_diarias: [
        { id: 108, nome: 'Fundação com Flask', concluido: false, xp_conclusao: 35, fragmentos_conclusao: 7, tipo: 'diaria', subTasks: [{ name: 'Criar endpoint básico com Flask', target: 1, unit: 'endpoint', current: 0 }] },
    ]
  },
  {
    id: 207,
    nome: 'O Mestre de Engenharia de Dados',
    descricao: 'Aplique todo o seu conhecimento para construir um pipeline de dados completo, desde a extração até à visualização.',
    concluido: false,
    rank: 'A',
    level_requirement: 25,
    meta_associada: "Dominar os Fundamentos de Python",
    total_missoes_diarias: 30,
    ultima_missao_concluida_em: null,
     missoes_diarias: [
        { id: 110, nome: 'Desenhar a Arquitetura', concluido: false, xp_conclusao: 40, fragmentos_conclusao: 8, tipo: 'diaria', subTasks: [{ name: 'Desenhar fluxo de pipeline de dados', target: 1, unit: 'diagrama', current: 0 }] },
    ]
  },
  
  // --- Cadeia de Missões: Saúde & Fitness ---
  {
    id: 202,
    nome: 'O Despertar do Corredor',
    descricao: 'Sinta o vento no rosto e o chão sob os seus pés. Complete a sua primeira corrida de 1km sem parar.',
    concluido: false,
    rank: 'E',
    level_requirement: 3,
    meta_associada: "Correr uma Prova de 5km",
    total_missoes_diarias: 10,
    ultima_missao_concluida_em: null,
    missoes_diarias: [
       { id: 104, nome: 'Preparação Estratégica', concluido: true, xp_conclusao: 10, fragmentos_conclusao: 1, tipo: 'diaria', subTasks: [{ name: 'Separar equipamento de corrida', target: 1, unit: 'conjunto', current: 1 }] },
       { id: 105, nome: 'A Caminhada de Adaptação', concluido: false, xp_conclusao: 20, fragmentos_conclusao: 3, tipo: 'diaria', subTasks: [{ name: 'Caminhada leve', target: 20, unit: 'minutos', current: 0 }] },
    ]
  },
  {
    id: 208,
    nome: 'Resistência do Soldado',
    descricao: 'A marca dos 5km foi alcançada. Agora, o desafio é dobrar a distância. Prepare-se para correr 10km.',
    concluido: false,
    rank: 'D',
    level_requirement: 8,
    meta_associada: "Correr uma Prova de 5km",
    total_missoes_diarias: 15,
    ultima_missao_concluida_em: null,
    missoes_diarias: [
       { id: 111, nome: 'Análise Pós-Batalha', concluido: false, xp_conclusao: 25, fragmentos_conclusao: 5, tipo: 'diaria', subTasks: [{ name: 'Anotar 3 lições aprendidas', target: 3, unit: 'lições', current: 0 }] },
    ]
  },
  {
    id: 209,
    nome: 'Fôlego do Maratonista',
    descricao: 'O corpo e a mente estão prontos para um novo patamar. O seu próximo objetivo: completar uma meia maratona (21km).',
    concluido: false,
    rank: 'C',
    level_requirement: 15,
    meta_associada: "Correr uma Prova de 5km",
    total_missoes_diarias: 20,
    ultima_missao_concluida_em: null,
    missoes_diarias: [
       { id: 112, nome: 'Estudar o Terreno', concluido: false, xp_conclusao: 30, fragmentos_conclusao: 6, tipo: 'diaria', subTasks: [{ name: 'Inscrever-se num plano de treino', target: 1, unit: 'plano', current: 0 }] },
    ]
  },

  // --- Cadeia de Missões: Crescimento Pessoal ---
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
        { id: 106, nome: 'A Escolha do Tomo', concluido: false, xp_conclusao: 20, fragmentos_conclusao: 4, tipo: 'diaria', subTasks: [{ name: 'Escolher e listar próximo livro', target: 1, unit: 'livro', current: 0 }] },
    ]
  },
  {
    id: 210,
    nome: 'A Biblioteca da Mente',
    descricao: '12 livros foram conquistados. O hábito está formado. Agora, o desafio é dobrar a meta e ler 24 livros num ano.',
    concluido: false,
    rank: 'C',
    level_requirement: 12,
    meta_associada: "Ler 12 Livros de Não-Ficção",
    total_missoes_diarias: 24,
    ultima_missao_concluida_em: null,
    missoes_diarias: [
        { id: 113, nome: 'Otimizar a Fila de Leitura', concluido: false, xp_conclusao: 30, fragmentos_conclusao: 6, tipo: 'diaria', subTasks: [{ name: 'Selecionar os próximos 3 livros', target: 3, unit: 'livros', current: 0 }] },
    ]
  }
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

export const rotina = {
  domingo: [
    { id: 10, start_time: '09:00', end_time: '10:00', activity: 'Pequeno-almoço em família' },
    { id: 11, start_time: '11:00', end_time: '13:00', activity: 'Passeio no parque' },
    { id: 12, start_time: '18:00', end_time: '19:00', activity: 'Planear a semana' },
  ],
  segunda: [
    { id: 1, start_time: '07:00', end_time: '07:30', activity: 'Acordar e Meditar' },
    { id: 2, start_time: '08:00', end_time: '09:00', activity: 'Exercício Físico' },
    { id: 3, start_time: '09:30', end_time: '12:30', activity: 'Trabalho Focado (Bloco 1)' },
    { id: 4, start_time: '12:30', end_time: '13:30', activity: 'Almoço' },
    { id: 5, start_time: '13:30', end_time: '17:00', activity: 'Trabalho Focado (Bloco 2)' },
    { id: 6, start_time: '18:00', end_time: '19:00', activity: 'Estudo/Leitura' },
  ],
  terca: [
    { id: 1, start_time: '07:00', end_time: '07:30', activity: 'Acordar e Meditar' },
    { id: 2, start_time: '08:00', end_time: '09:00', activity: 'Exercício Físico' },
    { id: 3, start_time: '09:30', end_time: '12:30', activity: 'Trabalho Focado (Bloco 1)' },
    { id: 4, start_time: '12:30', end_time: '13:30', activity: 'Almoço' },
    { id: 5, start_time: '13:30', end_time: '17:00', activity: 'Trabalho Focado (Bloco 2)' },
    { id: 7, start_time: '20:00', end_time: '21:00', activity: 'Aula de Inglês' },
  ],
  quarta: [
    { id: 1, start_time: '07:00', end_time: '07:30', activity: 'Acordar e Meditar' },
    { id: 2, start_time: '08:00', end_time: '09:00', activity: 'Exercício Físico' },
    { id: 3, start_time: '09:30', end_time: '12:30', activity: 'Trabalho Focado (Bloco 1)' },
    { id: 4, start_time: '12:30', end_time: '13:30', activity: 'Almoço' },
    { id: 5, start_time: '13:30', end_time: '17:00', activity: 'Trabalho Focado (Bloco 2)' },
    { id: 6, start_time: '18:00', end_time: '19:00', activity: 'Estudo/Leitura' },
  ],
  quinta: [
     { id: 1, start_time: '07:00', end_time: '07:30', activity: 'Acordar e Meditar' },
    { id: 2, start_time: '08:00', end_time: '09:00', activity: 'Exercício Físico' },
    { id: 3, start_time: '09:30', end_time: '12:30', activity: 'Trabalho Focado (Bloco 1)' },
    { id: 4, start_time: '12:30', end_time: '13:30', activity: 'Almoço' },
    { id: 5, start_time: '13:30', end_time: '17:00', activity: 'Trabalho Focado (Bloco 2)' },
    { id: 7, start_time: '20:00', end_time: '21:00', activity: 'Jantar com amigos' },
  ],
  sexta: [
     { id: 1, start_time: '07:00', end_time: '07:30', activity: 'Acordar e Meditar' },
    { id: 2, start_time: '08:00', end_time: '09:00', activity: 'Exercício Físico' },
    { id: 3, start_time: '09:30', end_time: '12:30', activity: 'Trabalho Focado (Bloco 1)' },
    { id: 4, start_time: '12:30', end_time: '13:30', activity: 'Almoço' },
    { id: 5, start_time: '13:30', end_time: '16:00', activity: 'Revisão da Semana' },
  ],
  sabado: [
    { id: 13, start_time: '10:00', end_time: '12:00', activity: 'Limpeza e organização da casa' },
    { id: 14, start_time: '15:00', end_time: '18:00', activity: 'Hobby: Pintura' },
  ]
};


export const rotinaTemplates = {
    'Dia de Semana': [
        { id: 1, start_time: '07:00', end_time: '07:30', activity: 'Acordar e Meditar' },
        { id: 2, start_time: '08:00', end_time: '09:00', activity: 'Exercício Físico' },
        { id: 3, start_time: '09:30', end_time: '12:30', activity: 'Trabalho Focado (Bloco 1)' },
        { id: 4, start_time: '12:30', end_time: '13:30', activity: 'Almoço' },
        { id: 5, start_time: '13:30', end_time: '17:00', activity: 'Trabalho Focado (Bloco 2)' },
        { id: 6, start_time: '18:00', end_time: '19:00', activity: 'Estudo/Leitura' },
    ],
    'Fim de Semana': [
        { id: 10, start_time: '09:00', end_time: '10:00', activity: 'Pequeno-almoço em família' },
        { id: 11, start_time: '11:00', end_time: '13:00', activity: 'Passeio ou Hobby' },
        { id: 12, start_time: '18:00', end_time: '19:00', activity: 'Planear a semana' },
        { id: 13, start_time: '15:00', end_time: '18:00', activity: 'Tempo livre / Social' },
    ]
};
