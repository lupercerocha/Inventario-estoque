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

## 4. Área da Cultivve (administração)
- Na tela inicial, toque em **"Sou da Cultivve"** (ou 5 toques no rodapé) e entre com o **e-mail e senha de administrador** (Firebase Authentication). Enquanto o login por e-mail não estiver ativado no Firebase, o app usa o PIN mestre.
- Só o Master vê dados técnicos (leitor, fontes externas, diagnóstico). Para os demais aparece "Tecnologia by Cultivve".
- Lá você cadastra as empresas, gera o **link de acesso** de cada uma (ou o código de 6 letras), bloqueia/ativa empresas, configura o token da SI5 e limpa dados de teste.
- O gestor da empresa recebe o link, entra com o PIN dele, cadastra os colaboradores e sobe a planilha.

## 5. Modos de contagem (por empresa, pode mudar a cada inventário)
- **Duas contagens cegas + desempate** (padrão): 1ª e 2ª cegas; divergências entre elas vão para a 3ª.
- **Uma contagem + conferência:** uma contagem; o que divergir do estoque do sistema vai para a conferência.
- **Uma contagem, sem conferência:** resultado direto para os ajustes.

## 6. Imagens dos produtos
Ao subir a planilha, o app associa os códigos de barras ao **catálogo da Cultivve** e, aos poucos (dentro do limite diário da SI5), busca os que faltam. Ao bipar um produto sem imagem, ele busca na hora. As imagens aparecem no painel de contagem, na lista de produtos e na busca, e ficam guardadas para todos os clientes.

## 7. Usuários e escala
- **Gestor:** vê tudo (estoque, confronto, resultado, painel, configurações). Pode haver vários.
- **Contador:** entra com o PIN e vê só a contagem liberada para ele. Pode receber a permissão de encerrar o inventário.
- Em cada contagem o gestor marca **quem conta** (1ª, 2ª e desempate). Se a mesma pessoa estiver na 1ª e na 2ª, o app avisa, mas deixa salvar.
- Contagem sem ninguém escalado fica livre para qualquer pessoa.

## 8. Painel do gestor (celular ou computador)
Abra o mesmo link no computador para ter tela larga. O painel tem indicadores (acurácia, itens ajustados, valor das perdas), o histórico de inventários, o histórico de um produto, o relatório geral (produtos × inventários), os usuários, o layout de exportação para o ERP e os dados da empresa.

## 9. Ajustes para o ERP
No Resultado, há dois arquivos separados: **Ajuste de ENTRADA** e **Ajuste de SAÍDA**, cada um também em PDF. O formato do arquivo (CSV, TXT posicional ou Excel), as colunas, o separador, as casas decimais, a codificação e os códigos de movimento são configurados em Painel → Exportação ERP.

## 10. Fluxo de uso
1. Cadastre a **empresa**: digite o CNPJ e toque em Buscar (ou envie o cartão CNPJ em PDF) que os dados são preenchidos sozinhos. Defina seu PIN de gestor.
2. Crie o **inventário** e importe a planilha (código, descrição, código de barras, estoque, unidade e, opcionalmente, **grupo** e **subgrupo**). Há um botão para baixar a planilha modelo.
3. Na contagem, o botão **📋 Ver lista de produtos por grupo** mostra todos os itens filtrados por grupo e subgrupo, com o que você já contou marcado com ✓ (sem mostrar o estoque).
4. **1ª e 2ª contagens:** pessoas diferentes, cada uma no seu celular. Quem conta não vê o estoque nem a contagem do outro.
5. **Gestor**: encerra a 1ª e a 2ª → Confronto → **Liberar 3ª contagem** só com os itens divergentes e escala quem faz o desempate.
6. **Resultado:** se 1ª = 2ª, vale esse número; se não, vale a 3ª. Diferença = final − estoque. Produto da base que ninguém achou conta como zero.
7. **Encerrar inventário e iniciar novo:** o resultado vai para o histórico. O novo inventário pode vir de uma nova planilha do ERP ou da contagem final do anterior.
8. Relatório em **PDF** (contagem completa, entradas, saídas, pendentes e assinaturas) e **Excel** (abas: contagem completa, divergências, entradas, saídas, lançamentos).

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

## Segurança (v3.2) — como ativar
1. Firebase → **Authentication** → Começar → em **Método de login** ative **Anônimo** e **E-mail/senha**.
2. Em **Authentication → Usuários → Adicionar usuário**, crie o seu e-mail de administrador e uma senha forte.
3. O e-mail de administrador nas regras é `lupercerocha@gmail.com`. Para adicionar outro, inclua-o na lista em `firestore.rules`.
4. Suba a versão nova no GitHub, entre como Cultivve (e-mail e senha) e abra a aba **Empresas** uma vez (isso cria os códigos de acesso no formato novo).
5. Em cada celular, abra o **link de acesso** da empresa uma vez (vincula o aparelho à empresa).
6. Por último, cole o conteúdo de `firestore.rules` em Firestore → Regras → **Publicar**.
7. Se algo bloquear, volte publicando `firestore.rules.piloto` (regras abertas) e fale com o suporte.

## Consulta de produtos (SI5 Global + Cosmos, em cascata)

As APIs de produto não aceitam consulta direto do navegador, por isso o app usa um
servidor grátis no Google Apps Script (arquivo **si5-servidor.gs**). Ele guarda os tokens
e procura primeiro na SI5; se a SI5 não achar, procura no Cosmos (Bluesoft).

1. Em https://script.google.com abra o projeto (ou crie um **Novo projeto**).
2. Apague o conteúdo e cole o arquivo **si5-servidor.gs** inteiro.
3. Cole os tokens nas linhas `TOKEN_SI5` e `TOKEN_COSMOS` e salve.
   Depois, no menu de funções (ao lado de **Depurar**), escolha **autorizar** e clique em **Executar** — autorize o acesso ao Google Drive (é onde ficam as fotos tiradas pelos contadores, na pasta *Cultivve Inventário - Fotos de produtos*).
4. Primeira vez: **Implantar › Nova implantação › App da Web** — Executar como: **Eu**; Quem pode acessar: **Qualquer pessoa**. Copie o URL (termina em `/exec`) e cole no app em **Cultivve › Catálogo e imagens › Servidor de consulta**.
   Atualizando: **Implantar › Gerenciar implantações › lápis › Versão: Nova versão › Implantar** (o endereço não muda).
5. No app, **Testar consulta** mostra o produto e de qual fonte ele veio.

## Importar o relatório de estoque do ERP (CSV)

O app aceita o CSV "Listagem de Estoque Gerencial" do Inteligence ERP (e relatórios parecidos) do jeito que sai do sistema:
cabeçalhos repetidos em cada página, linhas de GRUPO/SUB-GRUPO e colunas deslocadas são reorganizados automaticamente.
- PR.COMPRA vira o **custo unitário**; REFERENCIA vira **código de barras** quando é um EAN e **referência do fabricante** quando não é; MARCA também é importada.
- Em bases grandes (milhares de itens com estoque zero), só os itens com estoque entram na lista de contagem; os de estoque zero ficam como **consulta** e entram na hora se forem bipados ou buscados.
- No resultado: estoque no sistema e contado em R$, **saídas = perdas**, **entradas = sobras**, resultado do inventário e **possíveis trocas** de código entre itens parecidos.

## Exclusão e lixeira (v3.9.0)
- Gestor exclui um inventário ou todos (Todos os inventários → 🗑). Cultivve exclui uma empresa ou todas (Administração → Empresas → 🗑).
- Nada é apagado de verdade: vai para **Administração → 🗑 Lixeira**, que só a Cultivve vê. Lá dá para **Restaurar** ou **Apagar definitivo**.

## Log (v3.9.0)
- Painel do gestor → **📜 Log**: por inventário(s) ou por período, filtrando por produto e por contador. Mostra cada contagem (quem, quanto, rodada, hora, aparelho), exclusões e correções de lançamento e ações do gestor. Exporta para Excel.

## Caixa fechada (v3.9.3)
- Bipar o código da caixa (DUN-14, 14 dígitos começando de 1 a 8) acha o produto pelo código da unidade — não precisa cadastrar o código da caixa no ERP.
- A contagem abre em "Caixas fechadas × Unid. por caixa + Avulsas". Na 1ª vez o contador informa quantas unidades vêm na caixa; o fator fica guardado na empresa (campo `caixas`) e vale para os próximos inventários.
- Bipar de novo a caixa soma +1 caixa; bipar a unidade soma +1 avulsa. Sem código de caixa: botão "📦 Caixas fechadas + avulsas" ou digitar `2x12+6`.
- O lançamento guarda cx, fator e avulsas; aparece na lista, no log e no Excel do log ("2 cx × 12 + 6 avulsas").
- (v3.9.4) Caixas com código próprio (ex.: PFERD — EAN/UPC da caixa sem relação com o da unidade): ao bipar, em "Produto não está na planilha" use "📦 É a caixa fechada de um produto da planilha", escolha o produto e informe as unidades por caixa. O vínculo fica na empresa e vale para todos os celulares e próximos inventários.

## Resultado em tempo real, ordenação e cabeçalho fixo (v3.9.5–3.9.6)
- Resultado: "Só itens já contados" (ligado por padrão enquanto o inventário está aberto) — KPIs, financeiro e tabelas consideram só o que já foi bipado; atualiza a cada lançamento. Item ainda sem a 2ª contagem mostra a diferença parcial com * (última contagem − estoque). Os arquivos para o ERP e os relatórios continuam usando o inventário inteiro.
- Todas as tabelas do sistema ordenam clicando no título da coluna (▲/▼); a ordem se mantém quando a tela atualiza.
- Cabeçalho das tabelas fica fixo abaixo da barra do topo ao rolar a página (e acompanha a rolagem lateral).

## Código do fornecedor (v3.9.7)
- Campo opcional na importação ("Cód. Fornecedor", "Código Fornecedor", "Cod Forn", "Ref. Fornecedor" são reconhecidos sozinhos; outro título → escolher em "Conferir colunas"). Zeros da frente são removidos.
- Bipar/digitar o código do fornecedor ou o código interno, com ou sem zeros na frente, acha o produto (ex.: etiqueta 000000011802 → produto 11802). A busca por texto também acha pelo código do fornecedor.
- Aparece como "Forn. 610101324" na linha do produto; está no "Completar cadastro", nos itens de consulta (reserva) e é atualizado no modo "Atualizar" da planilha.

## Painel do gestor em abas (v3.9.8)
- Barra de abas fixa abaixo do topo: Painel · Contagem × estoque (ou Confronto 1ª × 2ª) · Resultado · Lançamentos · Produtos · Atividades · Códigos de barras · Planilha. Trocar de aba não empilha telas: "voltar" sai do gestor.
- Painel: indicadores clicáveis (abrem a aba já filtrada), cartões das contagens e "Encerrar inventário". Os 8 cartões de navegação saíram.
- Encerrar contagem com menos de 90% da base contada mostra aviso: os não contados valem zero e, na conferência, entram na lista.
