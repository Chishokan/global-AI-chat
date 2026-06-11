'use client';

import { useEffect, useRef, useState } from 'react';

type Role = 'user' | 'assistant';

interface Message {
  role: Role;
  content: string;
}

// セッションIDは氏名等を含まない匿名識別子。Phase 2 のログ保存で利用予定。
function makeSessionId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `sess-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

const WELCOME =
  'こんにちは。日本での生活や手続きの質問にお答えします。あなたの言葉で気軽に聞いてください。\n（Hello! Ask me anything about daily life and procedures in your own language.）';

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [easyJp, setEasyJp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showStaffBanner, setShowStaffBanner] = useState(false);
  const sessionIdRef = useRef<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    sessionIdRef.current = makeSessionId();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading, showStaffBanner]);

  function autoGrow() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  }

  async function send() {
    const text = input.trim();
    if (!text || loading) return;

    const nextMessages: Message[] = [...messages, { role: 'user', content: text }];
    setMessages(nextMessages);
    setInput('');
    setError(null);
    setLoading(true);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextMessages,
          easyJp,
          sessionId: sessionIdRef.current,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error ?? '応答の生成に失敗しました。');
      }
      setMessages([...nextMessages, { role: 'assistant', content: data.reply }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : '通信エラーが発生しました。');
    } finally {
      setLoading(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    // Enterで送信、Shift+Enterで改行（モバイルではボタン送信が主）。
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>日本生活サポート チャット</h1>
          <div className="sub">佐世保エリアの生活・手続きQ&amp;A</div>
        </div>
        <label className="easy-toggle" title="日本語の回答をやさしい日本語にします">
          <input
            type="checkbox"
            checked={easyJp}
            onChange={(e) => setEasyJp(e.target.checked)}
          />
          やさしい日本語
        </label>
      </header>

      <main className="messages">
        <div className="intro">
          <strong>{WELCOME}</strong>
          <div style={{ marginTop: 8, fontSize: 12 }}>
            ※ 回答はFAQ知識ベースに基づきます。在留資格・ビザの法的判断はできません。
            正確な情報が必要なときは「スタッフに相談」をご利用ください。
            緊急のときは 119（救急・消防）/ 110（警察）/ 118（海）。
          </div>
        </div>

        {messages.map((m, i) => (
          <div key={i} className={`row ${m.role}`}>
            <div className="bubble">{m.content}</div>
          </div>
        ))}

        {loading && (
          <div className="row assistant">
            <div className="bubble">
              <span className="typing">
                <span />
                <span />
                <span />
              </span>
            </div>
          </div>
        )}

        {error && <div className="error">{error}</div>}

        {showStaffBanner && (
          <div className="staff-banner">
            <strong>スタッフにおつなぎします</strong>
            <div style={{ marginTop: 6 }}>
              ご相談の内容を運用チームに記録しました（セッションID:{' '}
              {sessionIdRef.current.slice(0, 8)}…）。担当スタッフが対応します。
              緊急のときは、119（救急・消防）/ 110（警察）/ 118（海の事故）にすぐ連絡してください。
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </main>

      <div className="composer">
        <button
          type="button"
          className="staff-btn"
          onClick={() => setShowStaffBanner(true)}
        >
          スタッフに相談する
        </button>
        <div className="composer-row">
          <textarea
            ref={textareaRef}
            value={input}
            placeholder="質問を入力してください…"
            rows={1}
            onChange={(e) => {
              setInput(e.target.value);
              autoGrow();
            }}
            onKeyDown={onKeyDown}
            disabled={loading}
          />
          <button
            type="button"
            className="send-btn"
            onClick={send}
            disabled={loading || !input.trim()}
            aria-label="送信"
          >
            ➤
          </button>
        </div>
      </div>
    </div>
  );
}
