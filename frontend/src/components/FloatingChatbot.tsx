import { useState } from 'react';

const initialMessages = [
  { sender: 'assistant', text: 'Hi! I am PulseMate Assistant. Ask about health monitoring or incident tickets.' },
];

type Message = {
  sender: 'user' | 'assistant';
  text: string;
};

export default function FloatingChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [draft, setDraft] = useState('');

  const handleSend = () => {
    if (!draft.trim()) return;
    const nextMessages = [...messages, { sender: 'user', text: draft }];
    setMessages(nextMessages);
    setDraft('');
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: 'Thanks for your question. I am ready to connect you with ticket status and health insights.',
        },
      ]);
    }, 400);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {isOpen && (
        <div className="w-[360px] rounded-3xl border border-slate-700/80 bg-slate-950/95 p-4 shadow-soft backdrop-blur-xl">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-white">PulseMate Chat</p>
              <p className="text-xs text-slate-400">AI knowledge assistant</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-full bg-slate-800 px-3 py-1 text-sm text-slate-200 hover:bg-slate-700"
            >
              Close
            </button>
          </div>
          <div className="max-h-80 space-y-3 overflow-y-auto pb-2 pr-1">
            {messages.map((message, idx) => (
              <div
                key={idx}
                className={`rounded-3xl px-4 py-3 text-sm leading-6 ${
                  message.sender === 'assistant'
                    ? 'bg-slate-900 text-slate-200'
                    : 'ml-auto bg-violet-500/10 text-violet-100'
                }`}
              >
                {message.text}
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-violet-400"
              placeholder="Ask about tickets or vitals..."
            />
            <button
              onClick={handleSend}
              className="inline-flex items-center rounded-2xl bg-violet-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-400"
            >
              Send
            </button>
          </div>
        </div>
      )}
      <button
        onClick={() => setIsOpen((open) => !open)}
        className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-500 to-sky-400 px-5 py-3 text-sm font-semibold text-white shadow-soft transition hover:scale-[1.01]"
      >
        Chat
      </button>
    </div>
  );
}
