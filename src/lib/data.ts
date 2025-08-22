
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
    guild_id: 'guilda_dos_devs_123',
    guild_role: 'Líder',
  },
   {
    id: 'b2c3d4e5-f6g7-8901-2345-67890abcdef1',
    nome_utilizador: 'Novato_Curioso',
    primeiro_nome: 'Novato',
    apelido: 'Curioso',
    avatar_url: 'https://placehold.co/100x100.png?text=NC',
    nivel: 3,
    xp: 150,
    xp_para_proximo_nivel: 300,
     estatisticas: {
      forca: 6,
      inteligencia: 8,
      destreza: 5,
      constituicao: 7,
      sabedoria: 9,
      carisma: 6,
    },
    genero: 'Masculino',
    nacionalidade: 'Brasileira',
    status: 'Ativo',
    guild_id: 'guilda_dos_devs_123',
    guild_role: 'Membro'
  },
  {
    id: 'c3d4e5f6-g7h8-9012-3456-7890abcdef2',
    nome_utilizador: 'Aventureira_Beta',
    primeiro_nome: 'Aventureira',
    apelido: 'Beta',
    avatar_url: 'https://placehold.co/100x100.png?text=AB',
    nivel: 5,
    xp: 400,
    xp_para_proximo_nivel: 600,
     estatisticas: {
      forca: 8,
      inteligencia: 6,
      destreza: 9,
      constituicao: 8,
      sabedoria: 5,
      carisma: 7,
    },
    genero: 'Feminino',
    nacionalidade: 'Portuguesa',
    status: 'Ativo',
    guild_id: 'guilda_dos_devs_123',
    guild_role: 'Oficial'
  },
  {
    id: 'd4e5f6g7-h8i9-0123-4567-890abcdef3',
    nome_utilizador: 'Mestre_Zen',
    primeiro_nome: 'Mestre',
    apelido: 'Zen',
    avatar_url: 'https://placehold.co/100x100.png?text=MZ',
    nivel: 15,
    xp: 2500,
    xp_para_proximo_nivel: 3000,
     estatisticas: {
      forca: 7,
      inteligencia: 15,
      destreza: 10,
      constituicao: 12,
      sabedoria: 18,
      carisma: 11,
    },
    genero: 'Não especificado',
    nacionalidade: 'Japonesa',
    status: 'Ativo',
    guild_id: null,
  }
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
        { id: 101, nome: 'Instalar o Compilador Python', descricao: 'Aceda a python.org, descarregue e instale a versão mais recente do Python no seu sistema operativo.', concluido: true, xp_conclusao: 15, tipo: 'diaria' },
        { id: 102, nome: 'Configurar o Editor de Código', descricao: 'Abra o VS Code, aceda à loja de extensões e instale a extensão oficial "Python" da Microsoft.', concluido: true, xp_conclusao: 15, tipo: 'diaria' },
        { id: 103, nome: 'Invocar o Terminal', descricao: 'Crie um novo ficheiro chamado hello.py e escreva a linha: print("Hello, World!"). Execute o ficheiro no terminal com o comando `python hello.py`.', concluido: false, xp_conclusao: 20, tipo: 'diaria' },
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
        { id: 107, nome: 'Entrar na Arena', descricao: 'Crie uma conta no LeetCode, HackerRank ou Beecrowd e resolva o primeiro problema "Two Sum".', concluido: false, xp_conclusao: 25, tipo: 'diaria' },
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
        { id: 109, nome: 'Importar o Arsenal', descricao: 'Crie um novo Jupyter Notebook e importe a biblioteca Pandas com o alias `pd`.', concluido: false, xp_conclusao: 30, tipo: 'diaria' },
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
        { id: 108, nome: 'Fundação com Flask', descricao: 'Configure um novo projeto Flask e crie um endpoint básico que retorne um JSON de "status: online".', concluido: false, xp_conclusao: 35, tipo: 'diaria' },
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
        { id: 110, nome: 'Desenhar a Arquitetura', descricao: 'Num quadro branco ou ferramenta de diagramação, desenhe o fluxo do seu pipeline de dados: de onde os dados virão, como serão transformados e onde serão armazenados.', concluido: false, xp_conclusao: 40, tipo: 'diaria' },
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
       { id: 104, nome: 'Preparar o Equipamento de Batalha', descricao: 'Separe os seus sapatos de corrida, meias confortáveis e roupas adequadas para o clima de hoje.', concluido: true, xp_conclusao: 10, tipo: 'diaria' },
       { id: 105, nome: 'Ritual de Aquecimento', descricao: 'Faça uma caminhada rápida de 5 minutos seguida de 5 minutos de alongamentos dinâmicos focados nas pernas e ancas.', concluido: false, xp_conclusao: 20, tipo: 'diaria' },
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
       { id: 111, nome: 'Análise Pós-Batalha', descricao: 'Reflita sobre o seu treino de 5km. O que funcionou? O que pode ser melhorado? Anote 3 lições aprendidas.', concluido: false, xp_conclusao: 25, tipo: 'diaria' },
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
       { id: 112, nome: 'Estudar o Terreno', descricao: 'Pesquise e inscreva-se num plano de treino de 12 semanas para uma meia maratona.', concluido: false, xp_conclusao: 30, tipo: 'diaria' },
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
        { id: 106, nome: 'A Escolha do Tomo', descricao: 'Pesquise e selecione o primeiro livro de não-ficção que você lerá este ano. Adicione-o à sua lista de leitura no Goodreads ou numa aplicação similar.', concluido: false, xp_conclusao: 20, tipo: 'diaria' },
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
        { id: 113, nome: 'Otimizar a Fila de Leitura', descricao: 'Selecione os próximos 3 livros que você lerá. Tenha-os prontos para começar assim que terminar o atual.', concluido: false, xp_conclusao: 30, tipo: 'diaria' },
    ]
  }
];

export const guilds = [
  {
    id: 'guilda_dos_devs_123',
    nome: 'Devs Lendários',
    tag: 'LND',
    descricao: 'Uma guilda para aspirantes a mestres do código. Focada em projetos colaborativos e na partilha de conhecimento.',
    emblema_icon: 'Code',
    emblema_bg: 'bg-blue-800',
    meta_principal_id: 1, // 'Dominar os Fundamentos de Python'
    config: {
      recrutamento: 'Aberto', // 'Fechado', 'Apenas por convite'
    },
    join_requests: [
        { user_id: 'd4e5f6g7-h8i9-0123-4567-890abcdef3', nome_utilizador: 'Mestre_Zen', status: 'Pendente' }
    ],
    quests: [
        {
            id: 'quest_1',
            nome: 'Maratona de Algoritmos Semanal',
            descricao: 'Esta semana, vamos afiar as nossas espadas lógicas! Cada membro deve resolver problemas de algoritmos para contribuir para o progresso da guilda.',
            criador_id: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
            isRaid: false,
            progresso: [
                { id: 'sub_1', nome: 'Resolver problemas "Fácil"', target: 50, current: 23, daily_limit_per_member: 3, attribute: 'inteligencia' },
                { id: 'sub_2', nome: 'Resolver problemas "Médio"', target: 25, current: 10, daily_limit_per_member: 2, attribute: 'sabedoria' },
                { id: 'sub_3', nome: 'Resolver problemas "Difícil"', target: 5, current: 1, daily_limit_per_member: 1, attribute: 'inteligencia' },
            ],
            recompensa: {
                nome: 'Bónus de Foco',
                descricao: '+10% de XP em missões de Inteligência por 3 dias.',
                type: 'xp_boost',
                value: 1.1,
                duration_days: 3,
                category: 'inteligencia'
            },
            concluida: false
        }
    ],
    chat: [
        { id: 'chat_1', user_id: 'a1b2c3d4-e5f6-7890-1234-567890abcdef', nome_utilizador: 'Cazador_01', message: 'Bem-vindos à guilda, pessoal! Vamos começar a nossa primeira missão.', timestamp: new Date(Date.now() - 3600000) },
        { id: 'chat_2', user_id: 'c3d4e5f6-g7h8-9012-3456-7890abcdef2', nome_utilizador: 'Aventureira_Beta', message: 'Entendido, líder! Já comecei a resolver os problemas fáceis.', timestamp: new Date(Date.now() - 3500000) },
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

    

