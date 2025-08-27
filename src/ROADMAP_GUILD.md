# Roadmap de Evolução das Guildas

## 1. Visão Geral

Este documento foca-se especificamente nas melhorias e novas funcionalidades planeadas para o sistema de Guildas. O objetivo é transformar as guildas de uma simples lista de membros num centro social dinâmico e colaborativo, essencial para a experiência do utilizador.

## 2. Fases de Implementação

### Fase 1: Fundação (Concluída)
- **[x]** Criação e gestão de guildas (nome, tag, emblema).
- **[x]** Sistema de convites e pedidos para entrar.
- **[x]** Hierarquia de membros (Líder, Oficial, Membro, Recruta).
- **[x]** Chat de guilda em tempo real.
- **[x]** Associação de uma meta principal à guilda.

### Fase 2: Dashboard e Engajamento (Concluída)
**Objetivo:** Criar um hub central para a guilda que forneça informações úteis e promova a interação.

- **[x]** **Dashboard de Guilda (`GuildDashboard.tsx`):**
    - **[x]** Desenvolver um layout com abas para "Visão Geral", "Membros", "Chat" e "Gestão".
    - **[x]** Criar um painel de "Visão Geral" (`GuildOverview.tsx`) com estatísticas chave (nível da guilda, membros, missões ativas) e os últimos anúncios.
- **[x]** **Leaderboard de Membros (`MemberLeaderboard.tsx`):**
    - **[x]** Implementar um ranking de membros baseado na contribuição para missões da guilda.
    - **[x]** Destacar visualmente os melhores contribuidores para incentivar a competição amigável.
- **[x]** **Estatísticas da Guilda (`GuildStats.tsx`):**
    - **[x]** Adicionar gráficos que mostrem a contribuição da guilda ao longo do tempo (semanal, mensal, total).
    - **[x]** Visualizar a distribuição de esforço por categoria de missão.
- **[x]** **Anúncios da Guilda (`GuildAnnouncements.tsx`):**
    - **[x]** Sistema para a liderança publicar e gerir anúncios para todos os membros.

### Fase 3: Colaboração e Recompensas (A Fazer)
**Objetivo:** Introduzir sistemas que incentivem o trabalho em equipa e recompensem o esforço coletivo.

- **[ ] Missões de Guilda (`GuildQuests.tsx`):**
    - **[x]** Implementar a interface para visualizar e interagir com missões cooperativas.
    - **[x]** Criar um flow de IA (`generate-guild-quest`) para gerar missões de guilda com base num tema (ex: "Foco em fitness esta semana").
    - **[ ]** Desenvolver a lógica para que as contribuições de múltiplos membros contem para um objetivo comum.
- **[ ] Sistema de Recompensas da Guilda (`GuildRewards.tsx`):**
    - **[ ]** Criar um "tesouro" da guilda que acumula uma moeda especial (ex: "Pontos de Contribuição") quando os membros completam missões.
    - **[ ]** Desenvolver uma loja de recompensas de guilda onde a liderança pode gastar esses pontos para ativar bónus para todos os membros (ex: "+10% de XP por 24h", "Item cosmético exclusivo para a guilda").

### Fase 4: Competição e Prestígio (A Fazer)
**Objetivo:** Expandir as funcionalidades para incluir competição entre guildas e formas de exibir o prestígio.

- **[ ] Desafios de Guilda vs. Guilda (GvG):**
    - [ ] Sistema de eventos onde duas ou mais guildas competem para ver quem completa mais missões ou sobe mais andares na Torre dos Desafios num determinado período.
- **[ ] Leaderboards Globais de Guildas:**
    - [ ] Criar rankings globais para "Guilda de Maior Nível", "Guilda com Maior Contribuição", etc.
- **[ ] Perfil Público da Guilda:**
    - [ ] Uma página que mostra as conquistas, membros de destaque e estatísticas de uma guilda para outros jogadores.
