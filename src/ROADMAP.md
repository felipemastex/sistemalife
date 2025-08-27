# Roadmap de Evolução do Sistema Life

## 1. Visão Geral

Este documento delineia as futuras melhorias e novas funcionalidades planeadas para o Sistema Life, com o objetivo de o transformar numa ferramenta de gamificação da vida ainda mais poderosa, adaptativa e social. Para mais detalhes sobre os conceitos de design, consulte o [documento de evolução do sistema](./roadmap-evolution.md).

## 2. Fases de Implementação

### Fase 1: Fundação (Concluída)
- **[x]** Sistema de Metas (SMART)
- **[x]** Geração de Missões (Épicas e Diárias)
- **[x]** Sistema de Habilidades e Progressão de Atributos
- **[x]** Perfil do Utilizador (Nível, XP, Estatísticas)
- **[x]** Rotina Semanal
- **[x]** Loja e Inventário
- **[x]** Conquistas Personalizadas
- **[x]** Sistema de Classes Dinâmicas
- **[x]** Guildas (funcionalidade base)
- **[x]** Configurações de Personalização (Tema, IA)
- **[x]** Sistema de Feedback e Penalidades (Corrupção)

### Fase 2: Engajamento e Desafios (Em Progresso)
**Objetivo:** Introduzir novos sistemas que criem um ciclo de engajamento contínuo e ofereçam diferentes tipos de desafios para além das missões diárias.

- **[x] Torre dos Desafios:**
    - **[x]** Implementar a estrutura base da Torre (andares, zonas).
    - **[x]** Criar o flow de IA `generate-tower-challenge` para gerar desafios com base no andar e no perfil do utilizador.
    - **[x]** Desenvolver a interface principal (`TowerView.tsx`) para visualizar o progresso.
    - **[x]** Implementar o sistema de recompensas progressivas (XP bónus, fragmentos premium, itens exclusivos).
    - **[x]** Adicionar a lógica de verificação (`checkAndApplyTowerRewards`) para validar a conclusão dos desafios e fazer o jogador avançar.
- **[ ] Melhorias no Sistema de Missões:**
    - [ ] Permitir a criação manual de missões "one-off" não ligadas a uma meta.
    - [ ] Desenvolver templates de missões reutilizáveis (ex: "Rotina Matinal Produtiva").
- **[ ] Melhorias no Sistema de Guildas:**
    - **[x]** Implementar um dashboard de guilda mais completo e um leaderboard de contribuição dos membros. Para mais detalhes, ver o [roadmap de guildas](./ROADMAP_GUILD.md).
    - [ ] Criar um sistema de recompensas de guilda que pode ser desbloqueado com esforço coletivo.
    - [ ] Desenvolver missões de guilda geradas por IA (`generate-guild-tower-challenge`).

### Fase 3: Competição e Mundo Vivo (A Fazer)
**Objetivo:** Expandir as funcionalidades sociais e introduzir eventos dinâmicos que tornem o mundo mais reativo.

- **[ ] Eventos Mundiais e Invasões de "Corrupção":**
    - [ ] Implementar a lógica de backend para agregar o progresso global.
    - [ ] Criar diferentes tipos de eventos (ex: "Semana da Produtividade", "Festival da Criatividade").
    - [ ] Desenvolver um sistema de recompensas comunitárias.
- **[ ] Desafios de Guilda vs. Guilda (GvG):**
    - [ ] Sistema onde guildas competem para ver quem completa mais missões ou sobe mais andares na Torre.
- **[ ] Leaderboards Globais:**
    - [ ] Rankings para "Andar mais alto na Torre", "Maior Streak", "Maior Nível de Habilidade", etc.
- **[ ] Sistema de Némesis:**
    - [ ] Desenvolver a lógica de IA para gerar um "Némesis" com base numa meta.
    - [ ] Criar a UI para visualizar a "vida" do Némesis e os seus "ataques".

### Fase 4: IA Adaptativa e Personalização Profunda (A Fazer)
**Objetivo:** Utilizar a IA para criar uma experiência verdadeiramente única para cada utilizador, que se adapta ao seu comportamento.

- **[ ] Análise de Padrões pela IA (O Mentor do Sistema):**
    - **[x]** Implementar a lógica para a IA analisar dados e gerar insights textuais (`generate-analytics-insights`).
    - [ ] O "Arquiteto" analisará os seus horários de produtividade e sugerirá os melhores momentos para focar.
    - [ ] Deteção de sinais de burnout com sugestão de missões mais leves ou pausas.
- **[ ] Narrativa Adaptativa:**
    - [ ] Gerar pequenas histórias ou "eventos" com base nas suas ações (ex: "A sua dedicação à habilidade 'Corrida' atraiu a atenção de um lendário maratonista...").

### Fase 5: Expansão de Conteúdo (Em Progresso)
**Objetivo:** Integrar o Sistema Life com outras ferramentas e expandir o conteúdo disponível.

- **[x] Masmorras de Habilidade:**
    - **[x]** Desenvolver a interface para as "Masmorras" (`SkillDungeonView.tsx`).
    - **[x]** Criar um flow de IA para gerar desafios práticos e específicos para cada habilidade (`generate-skill-dungeon-challenge.ts`).
    - **[x]** Implementar o sistema de validação e recompensas de XP focado.
- **[x] Afazeres Recorrentes:**
    - **[x]** Adicionar um novo sistema para gerir tarefas e hábitos recorrentes que não se encaixam como missões de metas.
    - **[x]** Criar a interface `TasksView.tsx` com vistas semanal e mensal.
- **[ ] Torre Infinita:**
    - [ ] Após o andar 100, gerar andares processualmente com desafios cada vez mais difíceis.
- **[ ] Integrações Externas:**
    - [ ] Sincronização de missões com deadlines para o Google Calendar.
    - [ ] Integração com smartwatches para completar automaticamente missões de fitness.
