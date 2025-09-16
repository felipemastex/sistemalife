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

### Fase 2: Engajamento e Desafios (Concluída)
**Objetivo:** Introduzir novos sistemas que criem um ciclo de engajamento contínuo e ofereçam diferentes tipos de desafios para além das missões diárias.

- **[x] Torre dos Desafios:**
    - **[x]** Implementar a estrutura base da Torre (andares, zonas).
    - **[x]** Criar o flow de IA `generate-tower-challenge` para gerar desafios com base no andar e no perfil do utilizador.
    - **[x]** Desenvolver a interface principal (`TowerView.tsx`) para visualizar o progresso.
    - **[x]** Implementar o sistema de recompensas progressivas (XP bónus, fragmentos premium, itens exclusivos).
    - **[x]** Adicionar a lógica de verificação (`checkAndApplyTowerRewards`) para validar a conclusão dos desafios e fazer o jogador avançar.
- **[x] Melhorias no Sistema de Missões:**
    - **[x]** Permitir a criação manual de missões "one-off" não ligadas a uma meta.
    - **[x]** Desenvolver templates de rotinas reutilizáveis para agilizar o planeamento.
- **[x] Melhorias no Sistema de Guildas:**
    - **[x]** Implementar um dashboard de guilda mais completo e um leaderboard de contribuição dos membros.
    - **[x]** Criar um sistema de recompensas de guilda que pode ser desbloqueado com esforço coletivo.
    - **[x]** Desenvolver missões de guilda geradas por IA (`generate-guild-quest`).

### Fase 3: Competição e Mundo Vivo (Concluída)
**Objetivo:** Expandir as funcionalidades sociais e introduzir eventos dinâmicos que tornem o mundo mais reativo.

- **[x] Eventos Mundiais e Invasões de "Corrupção":**
    - **[x]** Implementar a lógica de backend para agregar o progresso global.
    - **[x]** Criar diferentes tipos de eventos (ex: "Semana da Produtividade", "Festival da Criatividade").
    - **[x]** Desenvolver um sistema de recompensas comunitárias.
- **[x] Desafios de Guilda vs. Guilda (GvG):**
    - **[x]** Sistema onde guildas competem para ver quem completa mais andares na Torre.
- **[x] Leaderboards Globais:**
    - **[x]** Rankings para "Andar mais alto na Torre", "Maior Streak", "Maior Nível de Habilidade", etc. (Interface implementada na aba de Analytics).

### Fase 4: IA Adaptativa e Personalização Profunda (Concluída)
**Objetivo:** Utilizar a IA para criar uma experiência verdadeiramente única para cada utilizador, que se adapta ao seu comportamento.

- **[x] Análise de Padrões pela IA (O Mentor do Sistema):**
    - **[x]** Implementar a lógica para a IA analisar dados e gerar insights textuais (`generate-analytics-insights`).
    - **[x]** O "Arquiteto" analisará os seus horários de produtividade e sugerirá os melhores momentos para focar.
    - **[x]** Deteção de sinais de burnout com sugestão de missões mais leves ou pausas.
- **[x] Narrativa Adaptativa:**
    - **[x]** Gerar pequenas histórias ou "eventos" com base nas suas ações (ex: "A sua dedicação à habilidade 'Corrida' atraiu a atenção de um lendário maratonista...").

### Fase 5: Expansão de Conteúdo (Concluída)
**Objetivo:** Integrar o Sistema Life com outras ferramentas e expandir o conteúdo disponível.

- **[x] Torre Infinita:**
    - [x] Após o andar 100, gerar andares processualmente com desafios cada vez mais difíceis.
- **[x] Masmorras de Habilidade:**
    - [x] Sistema focado no desenvolvimento intensivo de uma única habilidade com desafios práticos.
- **[x] Afazeres Recorrentes:**
    - [x] Sistema simples para gerir hábitos e tarefas que não se encaixam como missões de metas.

### Fase 6: Expansão Contínua (Em Progresso)
**Objetivo:** Expandir o sistema com integrações complexas e conteúdo gerado pela comunidade.

- **[ ] Integrações Externas:**
    - **[x]** Fundação da interface para integração com o Google Calendar.
    - [ ] Lógica de API e OAuth para Google Calendar.
    - [ ] Integração com smartwatches para completar automaticamente missões de fitness.
- **[ ] Conteúdo Gerado pelo Utilizador:**
    - [ ] Permitir que os jogadores criem e partilhem templates de metas ou missões.
    - [ ] Guildas poderem criar os seus próprios desafios internos.
