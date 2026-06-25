'use client';

import { useState, useRef, useEffect } from 'react';
import {
  LANGS,
  REGIONS,
  tr,
  qLabel,
  faqsByCategory,
  categoryLabelKey,
  regionName,
  type Lang,
  type Region,
} from '@/lib/i18n';

type Role = 'user' | 'assistant';
type Tab = 'chat' | 'faq' | 'help' | 'proc' | 'set';

interface Msg {
  role: Role;
  content: string;
  sys?: 'staff' | 'note';
}

// セッションIDは氏名等を含まない匿名識別子（Phase 2 のログで利用）。
function makeSessionId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `sess-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export default function App() {
  const [tab, setTab] = useState<Tab>('chat');
  const [region, setRegion] = useState<Region>('sasebo');
  const [lang, setLang] = useState<Lang>('ja');
  const [bilingual, setBilingual] = useState(true);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const sessionIdRef = useRef<string>('');

  useEffect(() => {
    sessionIdRef.current = makeSessionId();
  }, []);
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading, tab]);

  const accent = region === 'saikai' ? 'var(--saikai)' : 'var(--accent)';
  const L = (k: string) => tr(lang, k);

  async function send(text?: string) {
    const userText = (text ?? input).trim();
    if (!userText || loading) return;
    setErr('');
    setInput('');
    const next: Msg[] = [...messages, { role: 'user', content: userText }];
    setMessages(next);
    setLoading(true);
    setTab('chat');
    try {
      // 会話履歴は role/content のみ（システムメッセージは除外）をサーバーへ。
      const history = next
        .filter((m) => !m.sys)
        .map((m) => ({ role: m.role, content: m.content }));
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: history,
          region,
          lang,
          bilingual,
          sessionId: sessionIdRef.current,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || L('errNet'));
      setMessages((m) => [...m, { role: 'assistant', content: data.reply || '…' }]);
    } catch {
      setErr(L('errNet'));
    } finally {
      setLoading(false);
    }
  }

  function staff() {
    setMessages((m) => [...m, { role: 'assistant', sys: 'staff', content: L('staffMsg') }]);
    setTab('chat');
  }

  function switchRegion(r: Region) {
    setRegion(r);
    if (messages.length) {
      setMessages((m) => [
        ...m,
        { role: 'assistant', sys: 'note', content: `${L('switched')}: ${regionName(r)}` },
      ]);
    }
  }

  return (
    <div
      style={{
        background: 'var(--bg)',
        minHeight: '100dvh',
        display: 'flex',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 440,
          height: 'min(700px, calc(100dvh - 32px))',
          background: 'var(--card)',
          borderRadius: 26,
          border: '1px solid var(--line)',
          boxShadow: '0 24px 60px -28px rgba(80,50,20,.45)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* ===== Top bar: region + language ===== */}
        <div
          style={{
            padding: '12px 14px',
            borderBottom: '1px solid var(--line)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 11,
              background: 'var(--accent-soft)',
              display: 'grid',
              placeItems: 'center',
              fontSize: 17,
            }}
          >
            🧭
          </div>
          <div style={{ display: 'flex', background: '#F3ECE0', borderRadius: 999, padding: 3 }}>
            {REGIONS.map((r) => (
              <button
                key={r.code}
                onClick={() => switchRegion(r.code)}
                style={{
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontWeight: 700,
                  fontSize: 12,
                  borderRadius: 999,
                  padding: '5px 12px',
                  background:
                    region === r.code
                      ? r.code === 'saikai'
                        ? 'var(--saikai)'
                        : 'var(--accent)'
                      : 'transparent',
                  color: region === r.code ? '#fff' : 'var(--muted)',
                }}
              >
                {r.short}
              </button>
            ))}
          </div>
          <div style={{ flex: 1 }} />
          <span style={{ fontSize: 13 }}>🌐</span>
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value as Lang)}
            style={{
              fontFamily: 'inherit',
              fontSize: 12,
              border: '1px solid var(--line)',
              borderRadius: 10,
              padding: '6px 6px',
              background: '#fff',
              color: 'var(--ink)',
              maxWidth: 130,
            }}
          >
            {LANGS.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>
        </div>

        {/* ===== Body ===== */}
        <div
          ref={scrollRef}
          style={{ flex: 1, overflowY: 'auto', background: 'linear-gradient(180deg,#fff,#FFFBF5)' }}
        >
          {tab === 'chat' && (
            <div style={{ padding: 18 }}>
              {messages.length === 0 && (
                <div style={{ color: 'var(--muted)', fontSize: 13, lineHeight: 1.7, marginBottom: 14 }}>
                  {L('intro')}
                </div>
              )}
              {messages.map((m, i) => {
                const u = m.role === 'user';
                const s = m.sys;
                if (s === 'note')
                  return (
                    <div key={i} style={{ textAlign: 'center', margin: '8px 0' }}>
                      <span
                        style={{
                          fontSize: 11,
                          color: 'var(--muted)',
                          background: '#F3ECE0',
                          padding: '3px 10px',
                          borderRadius: 999,
                        }}
                      >
                        {m.content}
                      </span>
                    </div>
                  );
                return (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      justifyContent: u ? 'flex-end' : 'flex-start',
                      marginBottom: 12,
                      animation: 'rise .25s ease both',
                    }}
                  >
                    <div
                      style={{
                        maxWidth: '82%',
                        padding: '10px 13px',
                        borderRadius: 16,
                        fontSize: 13.5,
                        lineHeight: 1.65,
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        background: u ? accent : s === 'staff' ? 'var(--accent-soft)' : '#fff',
                        color: u ? '#fff' : 'var(--ink)',
                        border: u ? 'none' : '1px solid var(--line)',
                        borderBottomRightRadius: u ? 5 : 16,
                        borderBottomLeftRadius: u ? 16 : 5,
                      }}
                    >
                      {s === 'staff' && (
                        <div style={{ fontWeight: 800, fontSize: 11.5, color: 'var(--accent)', marginBottom: 4 }}>
                          👩‍💼 {L('consult')}
                        </div>
                      )}
                      {m.content}
                    </div>
                  </div>
                );
              })}
              {loading && (
                <div style={{ display: 'flex', gap: 5, padding: '6px 4px' }}>
                  {[0, 1, 2].map((d) => (
                    <span
                      key={d}
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: 99,
                        background: accent,
                        animation: `blink 1.2s ${d * 0.2}s infinite`,
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'faq' && (
            <div style={{ padding: 18 }}>
              <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--ink)' }}>{L('faqTitle')}</div>
              <div style={{ color: 'var(--muted)', fontSize: 12, margin: '4px 0 14px' }}>{L('faqHint')}</div>
              {faqsByCategory().map(({ category, items }) => (
                <div key={category} style={{ marginBottom: 16 }}>
                  <div style={{ fontWeight: 700, fontSize: 12.5, color: accent, marginBottom: 7 }}>
                    {L(categoryLabelKey(category))}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                    {items.map((f) => {
                      const ql = qLabel(f, lang);
                      return (
                        <button
                          key={f.id}
                          onClick={() => send(ql)}
                          style={{
                            textAlign: 'left',
                            border: '1px solid var(--line)',
                            background: '#fff',
                            borderRadius: 12,
                            padding: '10px 12px',
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                            color: 'var(--ink)',
                            fontSize: 13,
                          }}
                        >
                          {ql}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'help' && (
            <div style={{ padding: 18 }}>
              <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--ink)', marginBottom: 14 }}>
                {L('helpTitle')}
              </div>
              <div style={{ border: '1px solid var(--line)', borderRadius: 14, padding: 14, marginBottom: 12 }}>
                <div style={{ fontWeight: 700, fontSize: 12.5, color: '#C0392B', marginBottom: 8 }}>
                  🚨 {L('emerg')}
                </div>
                <div style={{ fontSize: 14, lineHeight: 2 }}>
                  🚑 119（{L('lblAmb')}）<br />🚓 110（{L('lblPol')}）<br />⚓ 118（{L('lblSea')}）
                </div>
              </div>
              <div style={{ border: '1px solid var(--line)', borderRadius: 14, padding: 14, marginBottom: 12 }}>
                <div style={{ fontWeight: 700, fontSize: 12.5, color: accent, marginBottom: 6 }}>🏥 {L('med')}</div>
                <div style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--ink)' }}>
                  {region === 'saikai' ? L('medSaikai') : L('medSasebo')}
                </div>
              </div>
              <div style={{ border: '1px solid var(--line)', borderRadius: 14, padding: 14, marginBottom: 12 }}>
                <div style={{ fontWeight: 700, fontSize: 12.5, color: accent, marginBottom: 6 }}>☎️ {L('consult')}</div>
                <div style={{ fontSize: 13, lineHeight: 1.7 }}>{L('consultBody')}</div>
              </div>
              <button
                onClick={staff}
                style={{
                  width: '100%',
                  border: 'none',
                  background: accent,
                  color: '#fff',
                  fontFamily: 'inherit',
                  fontWeight: 700,
                  fontSize: 14,
                  borderRadius: 12,
                  padding: 12,
                  cursor: 'pointer',
                }}
              >
                👩‍💼 {L('staff')}
              </button>
            </div>
          )}

          {tab === 'proc' && (
            <div style={{ padding: 18 }}>
              <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--ink)', marginBottom: 14 }}>
                {L('procTitle')}
              </div>
              <div
                style={{
                  border: '1px dashed var(--line)',
                  borderRadius: 14,
                  padding: 20,
                  textAlign: 'center',
                  color: 'var(--muted)',
                  fontSize: 13,
                  lineHeight: 1.7,
                }}
              >
                🗓
                <br />
                {L('procSoon')}
              </div>
            </div>
          )}

          {tab === 'set' && (
            <div style={{ padding: 18 }}>
              <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--ink)', marginBottom: 14 }}>{L('set')}</div>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>{L('setLang')}</div>
                <select
                  value={lang}
                  onChange={(e) => setLang(e.target.value as Lang)}
                  style={{
                    width: '100%',
                    fontFamily: 'inherit',
                    fontSize: 14,
                    border: '1px solid var(--line)',
                    borderRadius: 10,
                    padding: '10px',
                    background: '#fff',
                  }}
                >
                  {LANGS.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.label}
                    </option>
                  ))}
                </select>
              </div>
              {lang !== 'ja' && lang !== 'ja-easy' && (
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                    marginBottom: 16,
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={bilingual}
                    onChange={(e) => setBilingual(e.target.checked)}
                    style={{ width: 18, height: 18, marginTop: 1, accentColor: accent, flexShrink: 0 }}
                  />
                  <span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>{L('bilingual')}</span>
                    <span style={{ display: 'block', fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                      {L('bilingualHint')}
                    </span>
                  </span>
                </label>
              )}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>{L('setRegion')}</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {REGIONS.map((r) => (
                    <button
                      key={r.code}
                      onClick={() => switchRegion(r.code)}
                      style={{
                        flex: 1,
                        border: '1px solid var(--line)',
                        borderRadius: 10,
                        padding: '10px',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        fontWeight: 700,
                        fontSize: 13,
                        background:
                          region === r.code
                            ? r.code === 'saikai'
                              ? 'var(--saikai)'
                              : 'var(--accent)'
                            : '#fff',
                        color: region === r.code ? '#fff' : 'var(--ink)',
                      }}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
              <div
                style={{
                  fontSize: 11.5,
                  color: 'var(--muted)',
                  lineHeight: 1.6,
                  background: '#FAF6EF',
                  borderRadius: 10,
                  padding: 12,
                }}
              >
                {L('setAbout')}
              </div>
            </div>
          )}
        </div>

        {/* ===== Chat input (only on chat tab) ===== */}
        {tab === 'chat' && (
          <div style={{ borderTop: '1px solid var(--line)', padding: '10px 12px' }}>
            {err && <div style={{ color: '#C0392B', fontSize: 12, marginBottom: 6 }}>{err}</div>}
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  // IME変換確定のEnterは送信しない（日本語などの誤送信を防ぐ）。
                  const composing = e.nativeEvent.isComposing || e.keyCode === 229;
                  if (e.key === 'Enter' && !e.shiftKey && !composing) {
                    e.preventDefault();
                    send();
                  }
                }}
                rows={1}
                placeholder={L('ph')}
                style={{
                  flex: 1,
                  resize: 'none',
                  border: '1px solid var(--line)',
                  borderRadius: 14,
                  padding: '11px 13px',
                  fontFamily: 'inherit',
                  fontSize: 13.5,
                  color: 'var(--ink)',
                  outline: 'none',
                  background: '#FFFCF8',
                  maxHeight: 96,
                }}
              />
              <button
                onClick={() => send()}
                disabled={loading || !input.trim()}
                style={{
                  border: 'none',
                  background: input.trim() ? accent : 'var(--line)',
                  color: '#fff',
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  cursor: input.trim() ? 'pointer' : 'default',
                  fontSize: 18,
                  flexShrink: 0,
                }}
              >
                ↑
              </button>
            </div>
          </div>
        )}

        {/* ===== Bottom tab bar ===== */}
        <div style={{ borderTop: '1px solid var(--line)', display: 'flex', background: '#fff' }}>
          {(
            [
              ['chat', '💬', L('chat')],
              ['faq', '📋', L('faq')],
              ['help', '🆘', L('help')],
              ['proc', '🗓', L('proc')],
              ['set', '⚙️', L('set')],
            ] as [Tab, string, string][]
          ).map(([t, ic, lab]) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                flex: 1,
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                padding: '9px 2px 10px',
                fontFamily: 'inherit',
                color: tab === t ? accent : 'var(--muted)',
              }}
            >
              <div style={{ fontSize: 18, lineHeight: 1.1, filter: tab === t ? 'none' : 'grayscale(0.4) opacity(0.7)' }}>
                {ic}
              </div>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  marginTop: 3,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {lab}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
