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
        ) : 'Ask Assistant'}
      </button>
      {answer && (
        <div className="chat-answer">
          <div className="chat-answer-label">Assistant</div>
          <p className="chat-answer-text">{answer}</p>
        </div>
      )}
    </div>
  );
}
