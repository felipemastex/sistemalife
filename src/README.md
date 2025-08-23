
# SISTEMA DE VIDA - A Real-Life RPG

Bem-vindo ao **SISTEMA DE VIDA**, uma aplicação gamificada de produtividade e desenvolvimento pessoal. Este projeto transforma o crescimento pessoal numa aventura de RPG, onde o utilizador, um "Caçador", sobe de nível ao completar metas e missões do mundo real. Guiado por uma IA mentora chamada "O Sistema", o utilizador define objetivos, constrói hábitos e adquire novas habilidades.

## Conceito

A filosofia central é aplicar os princípios de gamificação (progressão, recompensas, estatísticas, níveis) a objetivos de vida concretos. O utilizador não joga um jogo; ele *vive* o jogo.

-   **Caçador:** O utilizador. Começa no nível 1 e evolui ao ganhar XP.
-   **Metas:** Objetivos de longo prazo (ex: "Aprender uma nova linguagem de programação").
-   **Missões Épicas:** Grandes marcos que compõem uma Meta (ex: "Construir o primeiro website").
-   **Missões Diárias:** Tarefas pequenas e atómicas que compõem uma Missão Épica (ex: "Estudar HTML por 30 minutos").
-   **O Sistema:** Uma IA que atua como mentor, estratega e narrador da jornada do Caçador.

## Arquitetura Tecnológica

-   **Framework:** [Next.js](https://nextjs.org/) (com App Router)
-   **Linguagem:** [TypeScript](https://www.typescriptlang.org/)
-   **Backend & Base de Dados:** [Firebase](https://firebase.google.com/) (Firestore para a base de dados, Authentication para utilizadores).
-   **Inteligência Artificial:** [Google AI & Genkit](https://firebase.google.com/docs/genkit)
-   **UI & Estilização:** [Shadcn/UI](https://ui.shadcn.com/) e [Tailwind CSS](https://tailwindcss.com/)
-   **Deployment:** Firebase App Hosting

## Estrutura de Dados (Firestore)

A base de dados está organizada da seguinte forma, centrada no utilizador:

```
/users/{userId} (Documento)
|-- // Dados do Perfil do Caçador
|-- /metas/{metaId} (Coleção)
|-- /missions/{missionId} (Coleção)
|-- /skills/{skillId} (Coleção)
|-- /routine/main (Documento com a rotina semanal)
|-- /routine/templates (Documento com os templates de rotina)
```

## Funcionalidades e Integrações com IA

O coração da aplicação é a sua capacidade de usar IA generativa para personalizar a jornada do utilizador. Abaixo estão os principais fluxos de IA (implementados com Genkit) e as funcionalidades correspondentes.

### 1. **Dashboard**

-   **O quê:** O ecrã principal que exibe o "Status" do Caçador.
-   **Funcionalidades:**
    -   Visualização do nome, título, nível e avatar.
    -   Barra de progresso de XP.
    -   Rank (de F a SSS) que evolui com o nível.
    -   Um gráfico de radar exibe as seis estatísticas principais: Força, Inteligência, Sabedoria, Constituição, Destreza e Carisma.

### 2. **Metas**

-   **O quê:** Onde o Caçador define os seus objetivos de longo prazo.
-   **Funcionalidades:**
    -   **Criação de Metas Assistida por IA:**
        -   **Modo Rápido:** O utilizador fornece um nome simples para a meta (ex: "Ficar em forma"). A IA (`generateSimpleSmartGoal`) expande-o para uma meta SMART completa e detalhada.
        -   **Modo Detalhado:** Um assistente conversacional (`generateSmartGoalQuestion`) guia o utilizador passo a passo na definição da sua meta SMART.
        -   **Sugestões de Metas:** A IA (`generateGoalSuggestion`) analisa o perfil, habilidades e metas concluídas para sugerir novos desafios personalizados.
    -   **Criação Automática de Habilidades:** Ao criar uma meta, a IA (`generateSkillFromGoal`) cria uma habilidade correspondente (ex: Meta "Correr uma maratona" -> Habilidade "Corrida de Longa Distância").
    -   **Geração de Árvore de Progressão:** Ao salvar uma nova meta, a IA (`generateInitialEpicMission`) cria uma sequência completa de "Missões Épicas", com ranks de dificuldade progressivos e a primeira missão diária pronta para começar.
    -   **Categorização Automática:** A IA (`generateGoalCategory`) sugere a categoria mais apropriada para a meta criada.

### 3. **Missões**

-   **O quê:** O diário de missões onde o utilizador vê e completa as suas tarefas.
-   **Funcionalidades:**
    -   **Geração Dinâmica de Missões Diárias:** Ao completar uma missão diária, a IA (`generateNextDailyMission`) gera a próxima, garantindo que seja um passo lógico, atómico e de dificuldade ajustada.
    -   **Feedback Inteligente:** O fluxo de geração de missões leva em conta o feedback do utilizador ("muito fácil", "muito difícil") para calibrar o próximo desafio.
    -   **Cooldown:** Novas missões diárias ficam disponíveis após um cooldown (reset à meia-noite), incentivando a consistência.
    -   **Assistência e Dicas:** O utilizador pode pedir ajuda (`generateMissionSuggestion`), e a IA fornecerá uma dica útil ou confirmará que a dificuldade será ajustada.
    -   **Cálculo de XP da Missão:** A IA (`generateXpValue`) analisa a complexidade de cada missão para atribuir uma quantidade justa de XP.

### 4. **Habilidades**

-   **O quê:** A árvore de habilidades que o Caçador desenvolve.
-   **Funcionalidades:**
    -   **Progressão Automática:** As habilidades sobem de nível automaticamente à medida que as missões relacionadas são concluídas.
    -   **Cálculo de XP de Habilidade:** A IA (`generateSkillExperience`) analisa a missão concluída para calcular quanto XP a habilidade correspondente deve receber.
    -   **Melhora de Atributos:** Ao subir de nível numa habilidade, os atributos base do Caçador (Força, Inteligência, etc.) são melhorados, dependendo da categoria da habilidade.

### 5. **Rotina**

-   **O quê:** Um calendário semanal para organizar as atividades diárias.
-   **Funcionalidades:**
    -   **Sugestão de Horário com IA:** O utilizador pode selecionar uma missão por agendar, e a IA (`generateRoutineSuggestion`) analisa a rotina do dia, o contexto das atividades existentes e os tempos livres para sugerir o melhor horário para encaixar a missão.
    -   **Gestão de Templates:** O utilizador pode salvar rotinas diárias como templates (ex: "Dia de Semana Produtivo") e carregá-los noutros dias.

### 6. **Arquiteto (Chat com IA)**

-   **O quê:** Uma interface de chat direto com o "Sistema".
-   **Funcionalidades:**
    -   **Aconselhamento Personalizado:** A IA (`generateSystemAdvice`) tem acesso a todo o perfil do Caçador (metas, missões, rotina) para fornecer conselhos contextuais e estratégicos.
    -   **Fonte Personalizada:** A aba "Arquiteto" tem uma fonte `Cinzel Decorative` para uma identidade visual única e épica.

### 7. **Configurações (Ficha de Caçador)**

-   **O quê:** Onde o utilizador pode editar os seus dados de perfil.
-   **Funcionalidades:**
    -   **Avatar Gerado por IA:** O utilizador pode clicar num botão para que a IA (`generateHunterAvatar`) gere uma imagem de avatar única com base no seu nível, rank e estatísticas principais.
    -   **Edição de Perfil:** Alteração de nome, apelido, etc.
    -   **Reset de Conta:** Uma opção para apagar todos os dados e começar de novo.

### 8. **Navegação & UI/UX**

-   **Design Responsivo:** A aplicação é totalmente funcional em dispositivos móveis, com um menu lateral que se transforma num painel deslizante ("sheet").
-   **Animações e Estilo:** A interface foi refinada com animações de fade-in, fontes estilizadas (`Inter` e `Cinzel Decorative`) e um tema visual coeso para criar uma experiência imersiva e profissional.

## Funcionalidades Futuras e Melhorias (Roadmap)

### 1. Gamificação e Engajamento
- **Descrição:** Adicionar mais camadas de motivação e recompensa para os usuários.
- **1.1. Sistema de "Streaks" (Sequências):** Recompensar usuários por manterem a consistência.
- **1.2. Mapa do Mundo e Progressão Visual:** Transformar a jornada do usuário em uma experiência visual.
- **1.3. Eventos Sazonais e Temáticos:** Criar eventos de curta duração com temas e recompensas extras.

### 2. Personalização e Inteligência Artificial
- **Descrição:** Evoluir o uso da IA para uma experiência ainda mais personalizada.
- **2.1. Mentor de IA Proativo:** Fazer com que a IA envie dicas, celebre marcos e alerte sobre prazos de forma proativa.
- **2.2. Ajuste Dinâmico de Dificuldade:** A IA analisa a taxa de sucesso e sugere missões com dificuldade ajustada.
- **2.3. Análise de Dependências de Metas:** A IA sugere um "roadmap" de habilidades e a ordem recomendada para metas complexas.
- **2.4. Avatar de IA Evolutivo:** O avatar gerado evolui visualmente com o progresso do usuário.

### 3. Monetização Ética e Recompensas
- **Descrição:** Introduzir formas de monetização que recompensam a atividade sem prejudicar a experiência gratuita.
- **3.1. Passe de Batalha (Battle Pass) Sazonal:** Um sistema de progressão sazonal com duas trilhas (gratuita e premium). Conforme os usuários ganham XP, eles desbloqueiam recompensas. A trilha premium ofereceria recompensas cosméticas exclusivas e bônus.
- **Benefícios:** Cria um modelo de receita recorrente e incentiva o engajamento contínuo sem usar mecânicas "pay-to-win".

### 4. Melhorias Técnicas e de Arquitetura
- **Descrição:** Aprimorar a base técnica da aplicação para garantir estabilidade e escalabilidade.
- **4.1. Modo Offline Básico:** Usar o Service Worker do PWA para permitir que os usuários visualizem e completem tarefas offline, sincronizando com o Firebase quando a conexão for restabelecida.
- **4.2. Estratégia de Testes:** Implementar testes unitários (Jest/Vitest), de integração (React Testing Library) e end-to-end (Cypress/Playwright).
- **Benefícios:** Previne bugs, facilita a refatoração e garante a estabilidade do sistema a longo prazo.

### 5. Melhorias na Aba Missões (`MissionsView.tsx`)
- **Descrição:** Refatoração técnica do componente de Missões para melhorar performance, manutenibilidade e clareza do código.
- **5.1. Gerenciamento de Estado e Fluxo de Dados:**
  - **Objetivo:** Reduzir a complexidade do estado e o acoplamento entre componentes.
  - **Ação:** Centralizar a lógica de atualização de dados (ganhar XP, completar missão, etc.) no componente pai (`page.tsx`) usando `useReducer` ou um Contexto global. O componente `MissionsView` passaria a apenas disparar ações em vez de manipular o estado diretamente, tornando-o mais declarativo.
- **5.2. Estrutura do Componente e Lógica:**
  - **Objetivo:** Melhorar a legibilidade e facilitar testes.
  - **Ação:** Dividir a função monolítica `completeDailyMission` em funções menores e com responsabilidades únicas (ex: `calculateProfileUpdate`, `handleSkillProgression`). Utilizar `React.memo` e `useCallback` para otimizar renderizações.
- **5.3. Interação com a IA e Tratamento de Erros:**
  - **Objetivo:** Evitar duplicação de código e centralizar o tratamento de erros.
  - **Ação:** Criar um hook personalizado (`useAIFlow`) que abstrai a lógica de chamada à IA, gerenciamento de estado de carregamento e exibição de `toasts` de erro.
- **5.4. Melhorias na Interface (UI/UX):**
  - **Objetivo:** Tornar a experiência do usuário mais fluida e informativa.
  - **Ação:** Implementar feedback visual imediato ao completar missões (ex: animações de "check"). Adicionar paginação ou um botão "Carregar Mais" para a secção de missões concluídas. Mover o "Modo Hacker" para um menu de configurações de desenvolvedor.
