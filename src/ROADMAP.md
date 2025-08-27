# Roadmap de Evolução do Sistema Life

## 1. Visão Geral

Este documento delineia as futuras melhorias e novas funcionalidades planeadas para o Sistema Life, com o objetivo de o transformar numa ferramenta de gamificação da vida ainda mais poderosa, adaptativa e social.

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

### Fase 2: Engajamento e Desafios (Em Andamento)
**Objetivo:** Introduzir novos sistemas que criem um ciclo de engajamento contínuo e ofereçam diferentes tipos de desafios para além das missões diárias.

- **[x] Torre dos Desafios:**
    - **[x]** Implementar a estrutura base da Torre (andares, zonas).
    - **[x]** Criar o flow de IA `generate-tower-challenge` para gerar desafios com base no andar e no perfil do utilizador.
    - **[x]** Desenvolver a interface principal (`TowerView.tsx`) para visualizar o progresso.
    - **[x]** Implementar o sistema de recompensas progressivas (XP bónus, fragmentos premium, itens exclusivos).
    - **[x]** Adicionar a lógica de verificação (`checkAndApplyTowerRewards`) para validar a conclusão dos desafios e fazer o jogador avançar.
- **[ ] Melhorias no Sistema de Missões:**
    - **[ ]** Permitir a criação manual de missões "one-off" não ligadas a uma meta.
    - **[ ]** Desenvolver templates de missões reutilizáveis (ex: "Rotina Matinal Produtiva").
- **[ ] Melhorias no Sistema de Guildas:**
    - **[ ]** Implementar um leaderboard de contribuição dos membros.
    - **[ ]** Criar um sistema de recompensas de guilda que pode ser desbloqueado com esforço coletivo.
    - **[ ]** Desenvolver missões de guilda geradas por IA (`generate-guild-tower-challenge`).

### Fase 3: Interação Social e Competição
**Objetivo:** Expandir as funcionalidades sociais para tornar o Sistema Life uma experiência mais conectada e colaborativa.

- **[ ] Desafios de Guilda vs. Guilda (GvG):**
    - [ ] Sistema onde guildas competem para ver quem completa mais missões ou sobe mais andares na Torre num determinado período.
- **[ ] Missões Colaborativas:**
    - [ ] Permitir que dois amigos se juntem para completar uma missão diária juntos, partilhando o progresso.
- **[ ] Leaderboards Globais:**
    - [ ] Rankings para "Andar mais alto na Torre", "Maior Streak", "Maior Nível de Habilidade", etc.

### Fase 4: IA Adaptativa e Personalização Profunda
**Objetivo:** Utilizar a IA para criar uma experiência verdadeiramente única para cada utilizador, que se adapta ao seu comportamento.

- **[ ] Análise de Padrões pela IA:**
    - [ ] O "Arquiteto" analisará os seus horários de produtividade e sugerirá os melhores momentos para focar.
    - [ ] Deteção de sinais de burnout com sugestão de missões mais leves ou pausas.
- **[ ] Adaptação de Dificuldade Dinâmica:**
    - [ ] A IA ajustará não apenas a próxima missão, mas toda a árvore de progressão de uma meta com base no seu desempenho histórico.
- **[ ] Narrativa Adaptativa:**
    - [ ] Gerar pequenas histórias ou "eventos" com base nas suas ações. Ex: "A sua dedicação à habilidade 'Corrida' atraiu a atenção de um lendário maratonista, que lhe deixou um novo desafio..."

### Fase 5: Expansão e Ecossistema
**Objetivo:** Integrar o Sistema Life com outras ferramentas e expandir o conteúdo disponível.

- **[ ] Torre Infinita:**
    - [ ] Após o andar 100, gerar andares processualmente com desafios cada vez mais difíceis e recompensas aleatórias.
- **[ ] Novas Torres Temáticas:**
    - [ ] Torres focadas exclusivamente numa habilidade (ex: "A Torre do Mago" para Inteligência) ou numa área da vida.
- **[ ] Integrações Externas:**
    - [ ] Sincronização de missões com deadlines para o Google Calendar.
    - [ ] Integração com smartwatches para completar automaticamente missões de fitness.
