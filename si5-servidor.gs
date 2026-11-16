/**
 * Cultivve Inventário — servidor de consulta de produtos (cascata)
 * -----------------------------------------------------------------
 * Recebe um código de barras e procura, nesta ordem:
 *   1) SI5 Global   (nome, marca, foto)
 *   2) Cosmos       (Bluesoft — nome, marca, foto) — só se a SI5 não achar
 * A primeira que achar responde. Os tokens ficam só aqui no servidor.
 * Também recebe as FOTOS tiradas pelos contadores e guarda na pasta
 * "Cultivve Inventário - Fotos de produtos" do seu Google Drive.
 *
 * COMO INSTALAR / ATUALIZAR:
 * 1. Abra o projeto em https://script.google.com (ou crie um "Novo projeto").
 * 2. Apague tudo e cole este arquivo inteiro.
 * 3. Cole os tokens nas linhas TOKEN_SI5 e TOKEN_COSMOS (deixe '' para desligar uma fonte). Salve.
 * 4. Clique no menu de funções (ao lado de "Depurar"), escolha "autorizar" e clique em "Executar".
 *    Autorize o acesso ao Google Drive (Avançado › Acessar projeto, se pedir). Só precisa uma vez.
 * 5. Primeira vez: Implantar › Nova implantação › App da Web
 *      Executar como: Eu  |  Quem pode acessar: Qualquer pessoa
 *    Copie o URL (termina em /exec) e cole no app em Cultivve › Catálogo e imagens.
 *    ATUALIZANDO um script que já existe: Implantar › Gerenciar implantações › lápis ›
 *      Versão: "Nova versão" › Implantar.  (assim o endereço /exec continua o mesmo)
 */

const TOKEN_SI5 = 'COLE_AQUI_O_TOKEN_DA_SI5';
const TOKEN_COSMOS = 'COLE_AQUI_O_TOKEN_DO_COSMOS';

function doGet(e) {
  const gtin = String((e && e.parameter && e.parameter.gtin) || '').replace(/\D/g, '');
  let out;
  if (gtin.length < 8) {
    out = { status: 400, erro: 'código inválido' };
  } else {
    const cache = CacheService.getScriptCache();
    const salvo = cache.get('v2_' + gtin);
    if (salvo) {
      out = JSON.parse(salvo);
    } else {
      out = cascata(gtin);
      // guarda 6 horas para não gastar consulta repetida
      if (out.status === 200 || out.status === 404) cache.put('v2_' + gtin, JSON.stringify(out), 21600);
    }
  }
  return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON);
}

/* tenta cada fonte; devolve a primeira que achar, ou o "pior" motivo se nenhuma achar */
function cascata(gtin) {
  const fontes = [];
  if (temToken(TOKEN_SI5)) fontes.push(si5);
  if (temToken(TOKEN_COSMOS)) fontes.push(cosmos);
  if (!fontes.length) return { status: 401, erro: 'nenhum token configurado no servidor' };
  const motivos = [];
  for (const f of fontes) {
    const r = f(gtin);
    if (r.status === 200 && r.data && r.data.produto) return r;
    motivos.push(r.fonte + ': ' + (r.status === 404 ? 'não encontrado' : r.status === 429 ? 'limite do dia atingido' : r.status === 401 || r.status === 403 ? 'token inválido' : (r.erro || ('erro ' + r.status))));
  }
  const todos404 = motivos.every(m => /não encontrado/.test(m));
  return { status: todos404 ? 404 : 502, erro: motivos.join(' · ') };
}

function temToken(t) { return t && t.indexOf('COLE_AQUI') !== 0; }

function si5(gtin) {
  try {
    const r = UrlFetchApp.fetch('https://global.si5.com.br/api/produtos/' + gtin, {
      headers: { Authorization: 'Bearer ' + TOKEN_SI5, Accept: 'application/json' }, muteHttpExceptions: true
    });
    const st = r.getResponseCode(); let j = null; try { j = JSON.parse(r.getContentText()); } catch (x) {}
    if (st !== 200 || !j) return { status: st, fonte: 'SI5' };
    return { status: 200, fonte: 'SI5', data: {
      produto: j.produto || j.descricao || j.nome || '', marca: j.marca || '', categoria: j.categoria || '',
      ncm: j.ncm || '', imagem_url: j.imagem_url || '', fonte: 'SI5 Global' } };
  } catch (err) { return { status: 0, fonte: 'SI5', erro: String(err) }; }
}

function cosmos(gtin) {
  try {
    const r = UrlFetchApp.fetch('https://api.cosmos.bluesoft.com.br/gtins/' + gtin + '.json', {
      headers: { 'X-Cosmos-Token': TOKEN_COSMOS, 'User-Agent': 'Cosmos-API-Request', 'Content-Type': 'application/json' },
      muteHttpExceptions: true
    });
    const st = r.getResponseCode(); let j = null; try { j = JSON.parse(r.getContentText()); } catch (x) {}
    if (st !== 200 || !j) return { status: st, fonte: 'Cosmos' };
    const marca = (j.brand && (j.brand.name || j.brand.brand)) || j.brand_name || '';
    const cat = (j.gpc && j.gpc.description) || (j.category && j.category.description) || '';
    const ncm = (j.ncm && (j.ncm.code || j.ncm)) || '';
    return { status: 200, fonte: 'Cosmos', data: {
      produto: j.description || '', marca: marca, categoria: cat, ncm: String(ncm),
      imagem_url: j.thumbnail || '', fonte: 'Cosmos' } };
  } catch (err) { return { status: 0, fonte: 'Cosmos', erro: String(err) }; }
}

/* ---------- FOTOS DOS PRODUTOS (Google Drive) ---------- */
const PASTA_FOTOS = 'Cultivve Inventário - Fotos de produtos';

function doPost(e) {
  let out;
  try {
    const b = JSON.parse(e.postData.contents);
    if (b.acao !== 'foto') throw new Error('ação inválida');
    const gtin = String(b.gtin || '').replace(/\D/g, '');
    if (gtin.length < 8) throw new Error('código inválido');
    const bytes = Utilities.base64Decode(String(b.b64 || ''));
    if (!bytes.length || bytes.length > 1500000) throw new Error('foto inválida ou grande demais');
    const pasta = pastaFotos();
    const velhas = pasta.getFilesByName(gtin + '.jpg');
    while (velhas.hasNext()) velhas.next().setTrashed(true);   // troca a foto antiga, se houver
    const f = pasta.createFile(Utilities.newBlob(bytes, 'image/jpeg', gtin + '.jpg'));
    f.setDescription(String(b.nome || '').slice(0, 200));
    f.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    CacheService.getScriptCache().remove('v2_' + gtin);
    out = { status: 200, id: f.getId(), url: 'https://drive.google.com/thumbnail?id=' + f.getId() + '&sz=w800' };
  } catch (err) {
    out = { status: 400, erro: String(err && err.message || err) };
  }
  return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON);
}

function pastaFotos() {
  const it = DriveApp.getFoldersByName(PASTA_FOTOS);
  return it.hasNext() ? it.next() : DriveApp.createFolder(PASTA_FOTOS);
}

/* rode esta função uma vez pelo editor para autorizar o acesso ao Drive */
function autorizar() {
  const p = pastaFotos();
  Logger.log('Pasta de fotos pronta: ' + p.getUrl());
}
