git 
# Sistema de Vida: A Sua Vida, Gamificada

Bem-vindo ao repositório do **Sistema de Vida**, uma aplicação web progressiva (PWA) e aplicação móvel (via Capacitor) desenhada para transformar a sua vida e os seus objetivos num emocionante RPG. Inspirado nos melhores elementos de gamificação, este sistema ajuda-o a manter-se motivado, organizado e focado em tornar-se a melhor versão de si mesmo.

## Visão Geral

O Sistema de Vida é mais do que uma simples lista de tarefas. É um ecossistema completo onde você é o protagonista da sua própria jornada. Defina metas de longo prazo, quebre-as em missões épicas e conquiste tarefas diárias para ganhar XP, evoluir habilidades, subir de nível e desbloquear recompensas.

## Funcionalidades Principais

- **Sistema de Metas (SMART):** Defina objetivos de longo prazo claros e acionáveis. A nossa IA ajuda-o a transformar ideias vagas em metas específicas, mensuráveis, atingíveis, relevantes e com prazo.
- **Missões Épicas e Diárias:** Cada meta gera uma "árvore de progressão" com missões épicas (grandes marcos) e missões diárias (tarefas atómicas) para o manter no caminho certo.
- **Habilidades e Atributos:** Cada meta está ligada a uma habilidade (ex: "Programação Python", "Corrida de Resistência"). Ao completar missões, você ganha XP para essa habilidade, subindo o seu nível e melhorando os seus 6 atributos base: Força, Inteligência, Sabedoria, Constituição, Destreza e Carisma.
- **Perfil do Caçador:** Um dashboard completo que mostra o seu nível, XP, rank (de Novato a Lendário), estatísticas, streak de missões e avatar personalizável gerado por IA.
- **Classes Dinâmicas:** A sua classe (Guerreiro, Mago, Artesão, etc.) adapta-se dinamicamente com base no foco das suas metas ativas, concedendo-lhe bónus passivos relevantes.
- **Guildas:** Crie ou junte-se a uma guilda para colaborar com outros "Caçadores". O sistema inclui um dashboard completo com chat em tempo real, ranking de membros, anúncios, missões cooperativas e uma loja de recompensas de guilda.
- **Loja e Inventário:** Use "Fragmentos" ganhos em missões para comprar itens na loja que oferecem bónus temporários, como poções de XP ou amuletos para proteger a sua sequência.
- **Torre dos Desafios:** Um modo de jogo onde você sobe andares de dificuldade crescente, completando desafios para ganhar recompensas exclusivas.
- **Afazeres Recorrentes:** Um sistema simples para gerir hábitos e tarefas que não se encaixam como missões de metas.
- **Integração com IA (Google Gemini):** O sistema utiliza IA generativa para:
  - Sugerir metas personalizadas.
  - Gerar missões diárias e épicas.
  - Criar avatares únicos.
  - Fornecer um assistente de chat ("O Arquiteto") para dar conselhos estratégicos.
  - Gerar desafios para a Torre e Masmorras de Habilidade.

## Stack Tecnológica

- **Frontend:** Next.js, React, TypeScript
- **UI:** Tailwind CSS, shadcn/ui, Radix UI
- **IA Generativa:** Google AI (Gemini Pro) através do Genkit
- **Base de Dados:** Firebase Firestore
- **Autenticação:** Firebase Auth
- **Mobile:** Capacitor

## Como Começar

### Pré-requisitos

- Node.js (v18 ou superior)
- npm ou yarn
- Uma conta Firebase e um projeto configurado.

### Instalação

1.  **Clone o repositório:**
    ```bash
    git clone https://github.com/seu-usuario/sistema-vida.git
    cd sistema-vida
    ```

2.  **Instale as dependências:**
    ```bash
    npm install
    ```

3.  **Configure as variáveis de ambiente:**
    - Crie um ficheiro `.env` na raiz do projeto.
    - Adicione a sua chave da API do Gemini e a configuração do seu projeto Firebase:
    ```env
    # Chave da API do Google AI Studio
    GEMINI_API_KEY=SUA_CHAVE_AQUI

    # Configuração do Firebase (substitua com a do seu projeto)
    NEXT_PUBLIC_FIREBASE_API_KEY=...
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
    NEXT_PUBLIC_FIREBASE_APP_ID=...
    ```

### Executar a Aplicação

-   **Para desenvolvimento:**
    ```bash
    npm run dev
    ```
    A aplicação estará disponível em `http://localhost:3000`.

-   **Para produção:**
    ```bash
    npm run build
    npm run start
    ```

## Roadmap e Futuro

Este projeto está em constante evolução. Para ver o que já foi implementado e o que está planeado para o futuro, consulte os nossos documentos de roadmap:
- [Roadmap Principal](./src/ROADMAP.md)
- [Roadmap de Guildas](./src/ROADMAP_GUILD.md)

---

*Esta aplicação foi desenvolvida com o objetivo de tornar o desenvolvimento pessoal e a produtividade uma aventura emocionante e recompensadora.*
