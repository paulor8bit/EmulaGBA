# Configuração do Dropbox

Para permitir que o emulador acesse suas ROMs e Save States diretamente do Dropbox, você precisa criar um aplicativo no Dropbox e configurar as credenciais.

## Passo a Passo

1. Acesse o [Dropbox App Console](https://www.dropbox.com/developers/apps) e faça login com sua conta.
2. Clique no botão **"Create app"**.
3. Escolha as seguintes opções:
   - **Choose an API**: Selecione `Scoped access`.
   - **Choose the type of access you need**: Selecione `App folder` (Isso criará uma pasta específica para o emulador no seu Dropbox, garantindo mais segurança).
   - **Name your app**: Diga um nome para o seu app (ex: `Meu Emulador GBA Web`).
4. Clique em **"Create app"**.

## Configurando Permissões

1. Na página do seu aplicativo recém-criado, vá para a aba **"Permissions"**.
2. Marque as seguintes permissões:
   - `files.metadata.read` (Para listar as ROMs e saves)
   - `files.content.read` (Para baixar as ROMs e carregar os saves)
   - `files.content.write` (Para salvar os states no Dropbox)
3. Clique no botão **"Submit"** no final da página para salvar as permissões.

## Configurando as URLs de Redirecionamento (OAuth)

1. Volte para a aba **"Settings"**.
2. Na seção **"OAuth 2"**, procure por **"Redirect URIs"**.
3. Adicione as seguintes URLs:
   - URL de Desenvolvimento: `https://ais-dev-5z3jhtetbte7iez2afnbug-60667220363.us-east1.run.app/auth/callback`
   - URL Compartilhada: `https://ais-pre-5z3jhtetbte7iez2afnbug-60667220363.us-east1.run.app/auth/callback`
4. Clique em **"Add"** para cada uma delas.

## Configurando as Variáveis de Ambiente

1. Ainda na aba **"Settings"**, copie os valores de **"App key"** e **"App secret"**.
2. No AI Studio, configure as seguintes variáveis de ambiente (Secrets):
   - `DROPBOX_CLIENT_ID`: Cole o valor do seu **App key**.
   - `DROPBOX_CLIENT_SECRET`: Cole o valor do seu **App secret**.

## Estrutura de Pastas no Dropbox

Após conectar o aplicativo pela primeira vez, o Dropbox criará uma pasta em `Aplicativos/NomeDoSeuApp` (ou `Apps/NomeDoSeuApp`).
Coloque seus arquivos `.gba` dentro dessa pasta para que o emulador possa encontrá-los! Os saves (`.state`) também serão salvos automaticamente nesta mesma pasta.
