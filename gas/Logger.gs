/**
 * Logger.gs — 会話ログ受け取り用の Google Apps Script Web App。
 *
 * 使い方は docs/SHEETS_LOGGING.md を参照。
 * 1. ログを保存したいスプレッドシートで「拡張機能 > Apps Script」を開く。
 * 2. このファイルの内容を貼り付ける。
 * 3. プロジェクトの設定 > スクリプト プロパティ に LOG_TOKEN を追加（長いランダム文字列）。
 * 4. デプロイ > 新しいデプロイ > 種類「ウェブアプリ」
 *      - 次のユーザーとして実行: 自分
 *      - アクセスできるユーザー: 全員
 *    → 発行された /exec URL を控える。
 * 5. Vercel の環境変数に設定:
 *      SHEETS_WEBAPP_URL   = その /exec URL
 *      SHEETS_WEBAPP_TOKEN = LOG_TOKEN と同じ値
 *
 * 列はヘッダー名に合わせて書き込みます（新しい項目が増えても列を自動追加）。
 * セキュリティ: token が一致しないリクエストは拒否。
 * プライバシー: 氏名は保存しない。利用者はセッションIDで扱う。
 */

var SHEET_NAME = 'Logs';
// 既定の列順（新規シート作成時のヘッダー）。
var FIELDS = [
  'timestamp',
  'sessionId',
  'region',
  'lang',
  'easyJp',
  'category',
  'question',
  'answer',
];

function getToken_() {
  return PropertiesService.getScriptProperties().getProperty('LOG_TOKEN');
}

function jsonOutput_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}

function getLogSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(FIELDS);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function formatVal_(key, body) {
  if (key === 'timestamp') return body.timestamp || new Date().toISOString();
  if (key === 'easyJp') return body.easyJp ? 'TRUE' : 'FALSE';
  var v = body[key];
  return v === undefined || v === null ? '' : v;
}

/** 動作確認用（ブラウザでURLを開くと {ok:true} が返る）。 */
function doGet() {
  return jsonOutput_({ ok: true, service: 'global-ai-chat logger' });
}

/** Next.js の /api/chat から会話ログを受け取り、ヘッダーに合わせて1行追記する。 */
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonOutput_({ ok: false, error: 'no body' });
    }
    var body = JSON.parse(e.postData.contents);

    var token = getToken_();
    if (!token || body.token !== token) {
      return jsonOutput_({ ok: false, error: 'unauthorized' });
    }

    var sheet = getLogSheet_();
    var lastCol = sheet.getLastColumn();
    var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];

    // payload に含まれるが未登録の列を末尾に追加する（token は除く）。
    FIELDS.concat(Object.keys(body)).forEach(function (k) {
      if (k === 'token') return;
      if (headers.indexOf(k) === -1) {
        headers.push(k);
        sheet.getRange(1, headers.length).setValue(k);
      }
    });

    var row = headers.map(function (h) {
      return formatVal_(h, body);
    });
    sheet.appendRow(row);

    return jsonOutput_({ ok: true });
  } catch (err) {
    return jsonOutput_({ ok: false, error: String(err) });
  }
}
