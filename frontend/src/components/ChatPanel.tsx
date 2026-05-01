import { useState } from "react";
import { sendChatQuestion } from "../services/api";

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
    } catch (error) {
      setAnswer("Something went wrong while getting a response.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ background: "white", padding: "18px", borderRadius: "18px", boxShadow: "0 8px 24px rgba(15, 23, 42, 0.08)" }}>
      <h2>AI Ops Assistant</h2>
      <p>Ask questions about incidents, regional latency, or service health.</p>

      <textarea
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        rows={4}
        style={{ width: "100%", marginBottom: "12px", padding: "12px", borderRadius: "10px" }}
        placeholder="Ask something like: Which service is showing the highest latency?"
      />

      <button onClick={handleAsk} disabled={loading} style={{ padding: "10px 16px", borderRadius: "10px", cursor: "pointer" }}>
        {loading ? "Thinking..." : "Ask Assistant"}
      </button>

      {answer && (
        <div style={{ marginTop: "16px", padding: "14px", background: "#f8fafc", borderRadius: "12px" }}>
          <strong>Assistant:</strong>
          <p style={{ whiteSpace: "pre-wrap" }}>{answer}</p>
        </div>
      )}
    </div>
  );
}