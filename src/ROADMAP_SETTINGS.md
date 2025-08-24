# Melhorias na Aba de Configurações do Sistema Life

## 1. Visão Geral

### 1.1 Objetivo
Aprimorar a aba de configurações do "Sistema de Vida" para fornecer aos usuários mais controle sobre a sua experiência, personalização da interface e gestão de dados pessoais. O objetivo é criar uma secção de configurações que seja intuitiva, poderosa e alinhada com a temática de RPG da aplicação.

## 2. Funcionalidades Propostas

### Fase 1: Fundação e Perfil
- **[x] Estrutura de Abas:** Implementar uma navegação por abas para organizar as diferentes secções de configurações (`Perfil`, `IA & Interface`, `Notificações`, `Dados`, `Zona de Perigo`).
- **[x] Perfil do Caçador:**
    - **[x] Edição de Dados Básicos:** Permitir a alteração de `primeiro_nome`, `apelido`, `genero` e `nacionalidade`.
    - **[x] URL do Avatar:** Permitir que o utilizador cole um URL de imagem para o seu avatar.
    - **[x] Geração de Avatar com IA:** Criar um botão "Gerar com IA" que utiliza o `generateHunterAvatar` para criar e definir um novo avatar com base no nível, rank e estatísticas do utilizador.
- **[x] Componentes de Formulário Reutilizáveis:** Usar `shadcn/ui` para criar formulários consistentes e robustos.

### Fase 2: Personalização da Experiência (IA & Interface)
- **[x] Personalização de Tema:**
    - **[x] Cor de Destaque:** Permitir que o utilizador escolha uma cor de destaque principal (`--theme-accent-color`) a partir de uma paleta pré-definida. A alteração deve refletir-se em toda a aplicação.
- **[x] Personalidade da IA:**
    - **[x] Seletor de Personalidade:** Adicionar um `Select` para o utilizador escolher o tom de voz da IA (`balanced`, `mentor`, `strategist`, `friendly`).
    - **[x] Integração com o Flow:** Modificar o flow `generateSystemAdvice` para aceitar um parâmetro `personality` e ajustar o prompt do sistema de acordo.
- **[x] Layout Adaptativo:**
    - **[x] Densidade da Interface:** Opções para layout `Compacto`, `Padrão` ou `Confortável`, ajustando o espaçamento e o padding em componentes chave.
- **[x] Acessibilidade:**
    - **[x] Reduzir Animações:** Adicionar um `Switch` que, quando ativado, adiciona uma classe ao `body` para desativar ou reduzir as animações da interface.

### Fase 3: Gestão de Notificações e Dados
- **[ ] Aba de Notificações:**
    - **[ ] Controlos de Ativação/Desativação:** Switches para os principais tipos de notificações (`Briefing Diário`, `Meta Concluída`, `Nível Aumentado`).
    - **[ ] Horário de "Não Perturbar":** Permitir que o utilizador defina um intervalo de tempo durante o qual nenhuma notificação será enviada.
- **[ ] Aba de Dados & Backup:**
    - **[ ] Exportar Dados:** Um botão para descarregar um ficheiro JSON com todos os dados do utilizador (`profile`, `metas`, `missions`, `skills`, `routine`, etc.).
    - **[ ] Importar Dados:** Uma interface para carregar um ficheiro JSON de backup, que irá substituir os dados existentes (com um `AlertDialog` de confirmação claro sobre a ação destrutiva).
- **[ ] Aba "Zona de Perigo":**
    - **[ ] Resetar Conta:** Um botão (com múltipla confirmação) para apagar todos os dados do utilizador e reverter a conta para o estado inicial de mock.
- **[ ] Aba de Analytics Pessoais:**
    - **[ ] Estrutura da Aba:** Criar o componente `AnalyticsTab`.
    - **[ ] Gráfico de Distribuição de Metas:** Adicionar um gráfico de barras que mostra quantas metas o utilizador tem em cada categoria.
    - **[ ] Gráfico de Produtividade:** Adicionar um gráfico de linhas ou barras que mostra o número de missões concluídas por dia/semana.
    - **[ ] Identificação de Padrões pela IA:** (Futuro) Secção onde a IA apresenta insights textuais com base nos dados.

### Fase 4: Privacidade e Gamificação
- **[ ] Configurações de Privacidade:**
    - **[ ] Visibilidade do Perfil:** Um `Switch` para permitir que o perfil seja `público` ou `privado` (relevante para futuras funcionalidades sociais como guildas).
    - **[ ] Opt-in de Analytics:** Um `Switch` para permitir que dados anónimos sejam usados para melhorar o sistema.
- **[ ] Configurações de Gamificação:**
    - **[ ] Nova Aba "Gamificação":** Criar a estrutura para esta secção.
    - **[ ] Intensidade do Feedback:** Adicionar um controlo para o quão "celebratório" o sistema é (efeitos visuais, etc.).

## 3. Considerações Técnicas
- **Centralização de Estado:** A maior parte do estado da aplicação e das configurações será gerida através do `PlayerDataContext`.
- **Persistência:** As alterações feitas nas configurações serão guardadas no documento `profile` do utilizador no Firestore, sob a chave `user_settings`.
- **Componentização:** Cada aba de configuração será o seu próprio componente (`ProfileSettingsTab.tsx`, `AISettingsTab.tsx`, etc.) para manter a organização.
- **Segurança:** A importação de dados deve ser tratada com cuidado, validando a estrutura do JSON se possível antes de o aplicar. Ações destrutivas (reset, importação) devem ter diálogos de confirmação robustos.

Este roadmap guiará o desenvolvimento iterativo da secção de configurações, transformando-a de uma simples página de perfil num centro de comando completo para a experiência do utilizador.
