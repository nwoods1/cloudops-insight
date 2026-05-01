import { useState } from "react";
import { sendChatQuestion } from "../services/api";
import "./ChatPanel.css";

export default function ChatPanel() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleAsk() {
    if (!question.trim()) return;
    try {
      setLoading(true);
      const response = await sendChatQuestion(question);
      setAnswer(response.answer);
    } catch {
      setAnswer("Something went wrong while getting a response.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card-body chat-panel">
      <p className="chat-desc">Ask questions about incidents, regional latency, or service health.</p>
      <textarea
        className="chat-textarea"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        rows={3}
        placeholder="e.g. Which service is showing the highest latency?"
      />
      <button className="chat-btn" onClick={handleAsk} disabled={loading}>
        {loading ? (
          <><span className="chat-spinner" />Thinking…</>
        ) : (
          <><AskIcon />Ask Assistant</>
        )}
      </button>
      {answer && (
        <div className="chat-answer">
          <div className="chat-answer-label">
            <AssistantIcon />
            Assistant
          </div>
          <p className="chat-answer-text">{answer}</p>
        </div>
      )}
    </div>
  );
}

function AskIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
    </svg>
  );
}

function AssistantIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>
    </svg>
  );
}
