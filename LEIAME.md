# Cultivve Inventário — Contagem Cega

App web instalável (PWA) para inventário de mercados com 1ª e 2ª contagens cegas, confronto, 3ª contagem dos divergentes e relatório final com entradas e saídas.

## Arquivos
- `index.html`: o aplicativo inteiro
- `manifest.json` e `sw.js`: fazem o app instalar no celular e abrir offline
- `icons/`: ícones do app
- `libs/`: leitor de código de barras (ZXing em WebAssembly), usado no iPhone e em aparelhos sem leitor nativo
- `firestore.rules`: regras do banco para colar no Firebase

## 1. Publicar no GitHub Pages
1. Suba **todos** os arquivos (com a pasta `icons`) na raiz de um repositório.
2. Settings → Pages → Branch `main` / pasta `/ (root)` → Save.
3. O app fica em `https://SEU-USUARIO.github.io/NOME-DO-REPO/`.
A câmera só funciona em HTTPS, e o GitHub Pages já é HTTPS.

## 2. Configurar o Firebase (para vários celulares)
1. Acesse https://console.firebase.google.com → **Adicionar projeto** (pode desativar o Google Analytics).
2. Menu **Criação → Firestore Database → Criar banco de dados**
   - Local: `southamerica-east1 (São Paulo)`
   - Modo: **produção**
3. Aba **Regras**: apague tudo, cole o conteúdo de `firestore.rules` e clique em **Publicar**.
4. Engrenagem ⚙ → **Configurações do projeto** → em "Seus apps" clique no ícone **Web `</>`** → dê um nome → **Registrar app** (não precisa do Hosting).
5. Copie o bloco `const firebaseConfig = { ... }`.
6. Duas formas de usar:
   - **Fixo no app (recomendado):** no `index.html`, troque `const FIREBASE_CONFIG = null;` pelo objeto copiado e suba de novo no GitHub. Todo celular já abre conectado.
   - **Pelo app:** ⚙ Config. → cole o bloco → Salvar. Depois use "Copiar link" e mande o link para os contadores pelo WhatsApp.

> As regras liberam leitura e gravação até 01/06/2027, para a fase de piloto. Antes de vender em escala, a próxima versão deve ter login (Firebase Authentication) e regras por empresa.

## 3. Instalar no celular
- **iPhone (Safari):** Compartilhar → "Adicionar à Tela de Início".
- **Android (Chrome):** menu ⋮ → "Instalar app".

## 4. Fluxo de uso
1. Cadastre a **empresa** (com PIN do gestor).
2. Crie o **inventário** e importe a planilha (código, descrição, código de barras, estoque, unidade). Há um botão para baixar a planilha modelo.
3. **1ª e 2ª contagens:** pessoas diferentes, cada uma no seu celular. Quem conta não vê o estoque nem a contagem do outro.
4. **Gestor** (PIN): encerra a 1ª e a 2ª → Confronto → **Liberar 3ª contagem** só com os itens divergentes.
5. **Resultado:** se 1ª = 2ª, vale esse número; se não, vale a 3ª. Diferença = final − estoque. Produto da base que ninguém achou conta como zero.
6. Relatório em **PDF** (contagem completa, entradas, saídas, pendentes e assinaturas) e **Excel** (abas: contagem completa, divergências, entradas, saídas, lançamentos).

## Leitura rápida de código de barras
- **Android (Chrome):** usa o leitor nativo do aparelho.
- **iPhone:** usa o ZXing em WebAssembly, que roda no próprio celular, sem internet.
- **Vai buscar o código (estilo Telegram):** a cada 3 quadros a imagem inteira é analisada; quando um código aparece fora do centro, o quadro verde desliza até ele e acompanha o produto. Nos outros quadros só a faixa central é lida, para manter a velocidade.
- **Zoom automático** (Android e aparelhos que permitem controlar o zoom pelo navegador): aproxima quando o código está pequeno ou quando nada é lido por alguns segundos. Dá para desligar na tela de contagem.
- Apenas formatos de varejo (EAN-13/8, UPC, Code 128/39, ITF), com foco contínuo. O dígito verificador do EAN é conferido antes de aceitar a leitura.
- **Modo "Bipar + quantidade":** a câmera não para. Bipe, ajuste a quantidade (vazio = 1) e bipe o próximo para confirmar o anterior. Bipar o mesmo item de novo soma +1.
- **Modo "Cada bipe = 1":** cada leitura já lança 1 unidade, com botão Desfazer.
- **Leitor Bluetooth ou coletor de dados (Zebra, Honeywell, Urovo etc.):** configure em modo teclado (HID / keyboard wedge) com Enter no final. O app reconhece a leitura sozinho, mesmo com o campo de quantidade aberto.

## Atualizações
Ao mudar o app, altere `CACHE` em `sw.js` (ex.: `cvinv-v1.0.1`) para os celulares buscarem a versão nova.
