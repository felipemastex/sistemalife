# Melhoria da Aba de Guilda no Sistema Life

## 1. Visão Geral

### 1.1 Objetivo
Melhorar a experiência do usuário na aba de guildas do Sistema Life, otimizando a interface, adicionando novas funcionalidades e aprimorando a usabilidade geral do sistema de guildas, com foco em engajamento e colaboração entre os membros.

### 1.2 Contexto Atual
O Sistema Life possui um sistema de guildas funcional com os seguintes componentes principais:
- Criação e gerenciamento de guildas
- Sistema de missões colaborativas
- Chat em tempo real
- Anúncios da guilda
- Gerenciamento de membros e solicitações de entrada
- Hierarquia de papéis (Líder, Oficial, Veterano, Membro, Recruta)

## 2. Fases de Implementação

### Fase 1: Fundação da Interface e Estrutura
**Objetivo:** Estabelecer a nova estrutura visual e os componentes base do dashboard da guilda.

- **[x] Redesign da Interface da Guilda (3.1.1):**
    - [x] Implementar um layout de dashboard mais moderno com `Card`s bem definidos.
    - [x] Criar os *placeholders* para os novos componentes no `GuildDashboard.tsx`.
- **[x] Criação de Componentes:**
    - [x] Criar os ficheiros e as estruturas básicas para: `GuildOverview.tsx`, `GuildStats.tsx`, `MemberLeaderboard.tsx`, `GuildNotifications.tsx`, e `GuildRewards.tsx`.
- **[x] Expansão do Modelo de Dados (Backend):**
    - [x] Adicionar os novos campos ao `erDiagram` e planear a sua integração no Firestore. Campos como `guild_xp`, `MEMBER_CONTRIBUTION`, `GUILD_REWARD`, etc.

### Fase 2: Visualização de Dados e Engajamento
**Objetivo:** Implementar a lógica para exibir dados e estatísticas, aumentando a visibilidade do progresso.

- **[x] Implementar `GuildOverview` (3.1.2):**
    - [x] Exibir estatísticas principais da guilda (nível, XP).
    - [x] Mostrar progresso das missões ativas.
    - [x] Exibir um resumo dos anúncios recentes.
- **[x] Implementar `GuildStats` (3.2.1):**
    - [x] Adicionar gráficos (`recharts`) para mostrar a contribuição da guilda ao longo do tempo.
    - [x] Implementar o seletor de período (semanal, mensal, total).
- **[x] Implementar `MemberLeaderboard` (3.3.2):**
    - [x] Criar a lista de membros classificada por contribuição.
    - [x] Adicionar indicadores visuais para as primeiras posições (Ouro, Prata, Bronze).

### Fase 3: Sistemas de Recompensas e Notificações
**Objetivo:** Introduzir mecânicas de recompensa e melhorar a comunicação.

- **[ ] Implementar `GuildRewards` (3.2.2):**
    - [x] Desenvolver a interface para visualizar as recompensas disponíveis na guilda.
    - [ ] Implementar a lógica para os utilizadores reclamarem recompensas com base nas suas contribuições.
- **[ ] Implementar `GuildNotifications` (3.4.1):**
    - [ ] Criar a interface para exibir as notificações da guilda.
    - [ ] Implementar a lógica de tempo real para receber e marcar notificações como lidas.
- **[ ] Melhorar o Perfil de Membro (3.3.1):**
    - [ ] Adicionar as estatísticas de contribuição e conquistas da guilda ao perfil de cada membro.

### Fase 4: Refinamentos e Melhorias de Qualidade de Vida
**Objetivo:** Polir a experiência do utilizador com base nas novas funcionalidades.

- **[ ] Melhorias no Chat (3.4.2):**
    - [ ] Avaliar a implementação de canais ou menções.
- **[ ] Acessibilidade e Responsividade (6.1, 6.2):**
    - [ ] Realizar testes em diferentes dispositivos e garantir a conformidade com as diretrizes de acessibilidade.
- **[ ] Testes e Lançamento (7, 8):**
    - [ ] Executar o plano de testes e preparar para o lançamento iterativo.

## 3. Funcionalidades Detalhadas (Referência)

### 3.1 Interface e Experiência do Usuário

#### 3.1.1 Redesign da Interface da Guilda
- Implementação de um layout mais moderno e intuitivo com cards bem definidos
- Melhoria na visualização de informações importantes com destaque visual
- Otimização para dispositivos móveis com layout responsivo
- Adição de indicadores visuais para notificações e atividades
- Implementação de tema dark/light mode

#### 3.1.2 Painel de Visão Geral da Guilda
- Exibição de estatísticas da guilda (nível, XP, número de membros) com gráficos
- Destaque para missões em andamento e seu progresso com barras de progresso visuais
- Resumo de anúncios recentes com preview
- Indicadores de atividade dos membros com badges
- Seção de eventos recentes e próximos eventos

### 3.2 Sistema de Missões Aprimorado

#### 3.2.1 Visualização de Progresso Individual
- Adição de gráficos de progresso por membro (semanal, mensal)
- Comparação de contribuições entre membros com ranking
- Histórico de contribuições por período selecionável
- Indicadores de desempenho em relação à média da guilda

#### 3.2.2 Sistema de Recompensas
- Implementação de recompensas por participação em missões
- Sistema de conquistas específicas para missões de guilda
- Mostradores de recompensas pendentes de coleta
- Recompensas especiais por marcos de contribuição
- Sistema de loot por conclusão de missões

### 3.3 Sistema de Membros

#### 3.3.1 Perfil do Membro
- Expansão do perfil com estatísticas de contribuição
- Histórico de participação em missões
- Conquistas específicas da guilda
- Nível e XP específicos da guilda
- Atividade recente do membro

#### 3.3.2 Sistema de Classificação
- Ranking de membros por contribuição (semanal, mensal, total)
- Categorias de desempenho (Ouro, Prata, Bronze)
- Recompensas especiais para os membros mais ativos
- Distintivos visuais para posições no ranking
- Comparação com o desempenho anterior

### 3.4 Comunicação e Interações

#### 3.4.1 Sistema de Notificações
- Notificações em tempo real para eventos da guilda
- Configurações personalizáveis de notificações
- Histórico de notificações
- Notificações push para eventos importantes
- Indicador de notificações não lidas

#### 3.4.2 Melhorias no Chat
- Sistema de canais de chat (geral, oficiais, social)
- Menções e destaque de mensagens
- Histórico de conversas
- Emojis e formatação de texto
- Integração com sistema de recompensas por participação
