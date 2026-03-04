# EmulaGBA

🎮 **Jogue agora:** [https://emulagba.surge.sh/](https://emulagba.surge.sh/)

Um emulador de Game Boy Advance (GBA) via web, construído com React, TypeScript e Tailwind CSS, que permite jogar suas ROMs diretamente do navegador e sincronizar seus "Save States" com o Dropbox.

## 🚀 Funcionalidades

- **Emulação Web**: Jogue jogos de GBA diretamente no seu navegador, sem precisar instalar nada.
- **Integração com Dropbox**:
  - Conecte sua conta do Dropbox.
  - O emulador lê automaticamente arquivos `.gba` da pasta do aplicativo no seu Dropbox.
  - Salve e carregue o estado do jogo (Save States) diretamente na nuvem, permitindo continuar de onde parou em qualquer dispositivo.
- **Controles Personalizáveis**:
  - Mapeie as teclas do teclado para os botões do GBA (A, B, L, R, Start, Select, D-Pad).
  - As configurações são salvas localmente no navegador.
- **Modo Mobile (Celular)**:
  - Alterne entre o modo "PC (Teclado)" e "Celular (Toque)".
  - O modo Celular exibe um Gamepad Virtual na tela (D-Pad, botões de ação e ombro) otimizado para telas de toque.
- **Internacionalização (i18n)**:
  - Suporte para os idiomas Português (PT) e Inglês (EN).

## 🛠️ Tecnologias Utilizadas

- **Frontend**:
  - [React](https://reactjs.org/) (com Hooks)
  - [TypeScript](https://www.typescriptlang.org/)
  - [Tailwind CSS](https://tailwindcss.com/) (para estilização e responsividade)
  - [Lucide React](https://lucide.dev/) (para ícones)
- **Emulação**:
  - [Nostalgist.js](https://nostalgist.js.org/) (Wrapper para RetroArch no navegador, utilizando o core `mgba`).
- **Autenticação**:
  - Fluxo **OAuth 2.0 PKCE** (Proof Key for Code Exchange) com a API do Dropbox.
  - 100% Client-Side (não requer backend).

## 📦 Como Executar Localmente

### Pré-requisitos

1.  **Node.js** (versão 18 ou superior recomendada).
2.  Uma conta de desenvolvedor no [Dropbox](https://www.dropbox.com/developers) para criar um aplicativo e obter as credenciais.

### Configuração do Dropbox App

1.  Acesse o [App Console do Dropbox](https://www.dropbox.com/developers/apps).
2.  Clique em **Create app**.
3.  Escolha **Scoped access**.
4.  Escolha **App folder** (Acesso apenas a uma pasta específica do aplicativo).
5.  Dê um nome ao seu aplicativo (ex: `MeuEmulaGBA`).
6.  Na aba **Permissions**, marque as seguintes opções:
    - `files.metadata.read`
    - `files.content.read`
    - `files.content.write`
7.  Na aba **Settings**, adicione a URL de redirecionamento OAuth (ex: `http://localhost:3000/auth/callback`) em **Redirect URIs**.
8.  Anote o **App key** (Client ID). O Client Secret não é necessário para este fluxo PKCE.

### Instalação

1.  Clone o repositório:
    ```bash
    git clone https://github.com/seu-usuario/emulagba.git
    cd emulagba
    ```

2.  Instale as dependências:
    ```bash
    npm install
    ```

3.  Crie um arquivo `.env` na raiz do projeto baseado no `.env.example` e preencha com o seu Client ID do Dropbox:
    ```env
    VITE_DROPBOX_CLIENT_ID=seu_app_key_aqui
    APP_URL=http://localhost:3000
    ```

4.  Inicie o servidor de desenvolvimento:
    ```bash
    npm run dev
    ```

5.  Acesse `http://localhost:3000` no seu navegador.

### Hospedagem (Deploy)

Como o projeto é 100% Frontend (Static Site), você pode hospedá-lo facilmente em serviços como **Surge.sh**, **Vercel**, **Netlify** ou **GitHub Pages**.

Para compilar o projeto para produção:
```bash
npm run build
```
Os arquivos compilados estarão na pasta `dist/`.

**Exemplo com Surge.sh**:
```bash
npm install --global surge
surge dist/ seu-dominio-emulagba.surge.sh
```
*(Lembre-se de adicionar a URL do seu domínio nas configurações do Dropbox em "Redirect URIs" como `https://seu-dominio-emulagba.surge.sh/auth/callback`)*

## 🎮 Como Usar

1.  **Conectar**: Clique em "Conectar com o Dropbox" e autorize o aplicativo.
2.  **Adicionar ROMs**: Após conectar, uma pasta será criada no seu Dropbox em `Aplicativos/NOME_DO_SEU_APP`. Coloque seus arquivos `.gba` (ROMs) dentro desta pasta.
3.  **Jogar**: Volte ao EmulaGBA, clique em "Atualizar" se necessário, e clique em "Jogar" ao lado da ROM desejada.
4.  **Controles**:
    - Clique no ícone de engrenagem (⚙️) para configurar suas teclas ou ativar o Gamepad Virtual para celular.
5.  **Saves**:
    - Durante o jogo, clique em "Salvar Estado" para salvar seu progresso no Dropbox.
    - Clique em "Carregar Estado" para continuar de onde parou.

## 📝 Licença

Este projeto é apenas para fins educacionais e de demonstração.

**Aviso Legal**: O uso de emuladores é legal, mas baixar ou distribuir ROMs de jogos protegidos por direitos autorais sem possuir a cópia original é ilegal na maioria das jurisdições. Use este software apenas com backups de jogos que você possui legalmente.
