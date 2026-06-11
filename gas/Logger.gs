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
 * セキュリティ: token が一致しないリクエストは拒否する。
 * プライバシー: 氏名は保存しない。利用者はセッションIDで扱う。
 */

var SHEET_NAME = 'Logs';
var HEADERS = [
  'timestamp',
  'sessionId',
  'locale',
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
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

/** 動作確認用（ブラウザでURLを開くと {ok:true} が返る）。 */
function doGet() {
  return jsonOutput_({ ok: true, service: 'global-ai-chat logger' });
}

/** Next.js の /api/chat から会話ログを受け取り、1行追記する。 */
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
    sheet.appendRow([
      body.timestamp || new Date().toISOString(),
      body.sessionId || '',
      body.locale || '',
      body.easyJp ? 'TRUE' : 'FALSE',
      body.category || '',
      body.question || '',
      body.answer || '',
    ]);

    return jsonOutput_({ ok: true });
  } catch (err) {
    return jsonOutput_({ ok: false, error: String(err) });
  }
}
