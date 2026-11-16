/**
 * Cultivve Inventário — servidor de consulta SI5 Global
 * ------------------------------------------------------
 * A SI5 não aceita consulta feita direto do navegador; ela exige que a chamada
 * saia de um servidor. Este script roda grátis no Google (Apps Script),
 * guarda o token da SI5 e devolve o produto para o app.
 *
 * COMO INSTALAR (uma vez só):
 * 1. Acesse https://script.google.com com a conta da Cultivve e clique em "Novo projeto".
 * 2. Apague tudo o que estiver no editor e cole este arquivo inteiro.
 * 3. Na linha TOKEN abaixo, cole o token da SI5 entre as aspas. Salve (ícone de disquete).
 * 4. Clique em "Implantar" › "Nova implantação" › engrenagem › "App da Web".
 *      Executar como: Eu
 *      Quem pode acessar: Qualquer pessoa
 *    Clique em "Implantar" e autorize com a sua conta Google
 *    (se aparecer "app não verificado": Avançado › Acessar projeto).
 * 5. Copie o "URL do app da Web" (termina em /exec).
 * 6. No app: Cultivve › Catálogo e imagens › "Servidor de consulta", cole o endereço,
 *    toque em "Testar consulta" e depois em "Salvar".
 *
 * Se trocar o token depois: altere a linha TOKEN, salve e faça
 * Implantar › Gerenciar implantações › lápis › Versão: Nova versão › Implantar.
 */

const TOKEN = 'COLE_AQUI_O_TOKEN_DA_SI5';

function doGet(e) {
  const gtin = String((e && e.parameter && e.parameter.gtin) || '').replace(/\D/g, '');
  let out;
  if (gtin.length < 8) {
    out = { status: 400, erro: 'código inválido' };
  } else {
    const cache = CacheService.getScriptCache();
    const salvo = cache.get(gtin);
    if (salvo) {
      out = JSON.parse(salvo);
    } else {
      try {
        const r = UrlFetchApp.fetch('https://global.si5.com.br/api/produtos/' + gtin, {
          headers: { Authorization: 'Bearer ' + TOKEN, Accept: 'application/json' },
          muteHttpExceptions: true
        });
        out = { status: r.getResponseCode() };
        try { out.data = JSON.parse(r.getContentText()); } catch (x) {}
        // guarda por 6 horas para não gastar consulta repetida
        if (out.status === 200 || out.status === 404) cache.put(gtin, JSON.stringify(out), 21600);
      } catch (err) {
        out = { status: 0, erro: 'servidor não conseguiu falar com a SI5: ' + err };
      }
    }
  }
  return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON);
}
