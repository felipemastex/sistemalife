# Roadmap de Melhorias - Módulo de Guildas

## 1. Visão Geral
Este roadmap foca-se exclusivamente na evolução do módulo de Guildas, transformando-o de uma simples lista de membros num centro social dinâmico e colaborativo, essencial para a experiência de jogo a longo prazo.

## 2. Fase 1: Fundação do Dashboard (Concluída)
**Objetivo:** Criar um hub central para todas as atividades da guilda, melhorando a organização e o acesso à informação.

- **[x]** Desenvolver um novo layout `GuildDashboard.tsx` com um sistema de abas.
- **[x]** Criar o componente `GuildOverview.tsx` para mostrar estatísticas rápidas.
- **[x]** Desenvolver o componente `MemberLeaderboard.tsx` para o ranking de membros.
- **[ ]** Implementar a lógica de cálculo de contribuição de membros.
- **[ ]** Criar o componente `GuildStats.tsx` para visualização de dados.
- **[ ]** Melhorar a interface do `GuildChat.tsx`.

## 3. Fase 2: Missões e Recompensas de Guilda (A Fazer)
**Objetivo:** Introduzir sistemas que promovam a colaboração ativa e recompensem o esforço coletivo.

- **[ ]** Implementar o sistema de Missões de Guilda (`GuildQuests.tsx`).
    - [ ] Desenvolver o flow de IA `generate-guild-quest.ts` para criar missões cooperativas.
    - [ ] Permitir que membros contribuam para sub-tarefas partilhadas.
    - [ ] Calcular o progresso geral da missão com base na contribuição de todos.
- **[ ]** Criar o sistema de Recompensas de Guilda (`GuildRewards.tsx`).
    - [ ] Desenvolver uma "loja" de guilda onde os pontos de contribuição podem ser gastos em bónus para todos os membros.
    - [ ] Implementar diferentes tipos de recompensas (ex: Bónus de XP, itens cosméticos, etc.).

## 4. Fase 3: Competição e Eventos (A Fazer)
**Objetivo:** Adicionar uma camada de competição saudável e eventos dinâmicos para manter a guilda engajada.

- **[ ]** Desenvolver o sistema de Desafios de Guilda vs. Guilda (GvG).
    - [ ] Rankings semanais onde as guildas competem por quem completa mais missões ou sobe mais andares na Torre.
- **[ ]** Integrar as guildas com os Eventos Mundiais.
    - [ ] Contribuições de membros da guilda contam em dobro para o progresso do evento.
    - [ ] Recompensas especiais para as guildas mais bem classificadas num evento.

## 5. Fase 4: Personalização e Legado (A Fazer)
**Objetivo:** Permitir que as guildas desenvolvam uma identidade única e um legado duradouro.

- **[ ]** Implementar um sistema de melhorias para a guilda (Guild Upgrades).
    - [ ] Gastar recursos coletivos para desbloquear bónus permanentes (ex: +1% de ganho de XP para todos os membros).
- **[ ]** Permitir a personalização do perfil da guilda com banners e emblemas desbloqueáveis.
- **[ ]** Criar um "Salão de Honra" para exibir as maiores conquistas da guilda.
