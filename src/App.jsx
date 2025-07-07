import React, { useState, useEffect } from "react";
import axios from "axios";
import SpeechRecognition, { useSpeechRecognition } from "react-speech-recognition";
import { jsPDF } from "jspdf";
import "./App.css";

function App() {
  const [messages, setMessages] = useState([
    {
      role: "bot",
      content:
        "👩‍⚕️ Hello! I am your Health Assistance Bot. How can I help you today with your health-related concern?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastUserMessage, setLastUserMessage] = useState("");

  const { transcript, listening, resetTranscript } = useSpeechRecognition();

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = { role: "user", content: input };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setLastUserMessage(input);
    setInput("");
    setLoading(true);

    const chatHistory = [
      {
        role: "system",
        content: `You are a helpful medical assistant. 
Always provide medically accurate and ethical responses. 
If unsure, say so. Never give prescriptions.

🔹 When explaining steps or tips, always present them as **numbered or bullet points**, not in paragraphs.

🔹 Use formatting like bold headings, line breaks, and short sentences to improve clarity.

🔹 End every answer with a friendly reminder and a medical disclaimer.`,
      },
      ...updatedMessages,
    ];

    try {
      const res = await axios.post(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          model: "llama3-70b-8192",
          messages: chatHistory,
          temperature: 0.7,
        },
        {
          headers: {
            Authorization: `Bearer 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`,
            "Content-Type": "application/json",
          },
        }
      );

      const reply =
        res.data.choices[0].message.content +
        "\n\n⚠️ This is general information. Consult a licensed doctor for medical advice.";

      setMessages([...updatedMessages, { role: "bot", content: reply }]);
    } catch (err) {
      console.error("Error talking to Groq:", err);
      setMessages([
        ...updatedMessages,
        {
          role: "bot",
          content:
            "Sorry, there was a problem connecting to the medical assistant. Please try again later.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSpeechInput = () => {
    resetTranscript();
    SpeechRecognition.startListening({ continuous: false, language: "en-US" });
  };

  useEffect(() => {
    if (!listening && transcript) {
      setInput(transcript);
    }
  }, [listening, transcript]);

  const handleRegenerate = () => {
    if (lastUserMessage) {
      setInput(lastUserMessage);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        role: "bot",
        content:
          "👩‍⚕️ Hello! I am your Health Assistance Bot. How can I help you today with your health-related concern?",
      },
    ]);
    setInput("");
    setLastUserMessage("");
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    let y = 10;

    messages.forEach((msg) => {
      const label = msg.role === "user" ? "You: " : "Bot: ";
      const lines = doc.splitTextToSize(label + msg.content, 180);
      doc.text(lines, 10, y);
      y += lines.length * 10;
    });

    doc.save("chat.pdf");
  };

  return (
    <div className="chat-container">
      <h1 className="chat-title">👩‍⚕️ MediCare Assistant</h1>
      <p className="chat-subtitle">Ask health questions and get ethical, accurate guidance.</p>

      <div className="chat-box">
        {messages.map((msg, index) => (
          <div key={index} className={`chat-message ${msg.role}`}>
            <div className="message-content">{msg.content}</div>
            {msg.role === "bot" && (
              <div className="feedback">
                <span role="img" aria-label="like">👍</span>
                <span role="img" aria-label="dislike">👎</span>
              </div>
            )}
          </div>
        ))}
        {loading && <div className="chat-message bot">Typing...</div>}
      </div>

      <div className="chat-input-area">
        <input
          type="text"
          placeholder="Type or speak your question..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <button onClick={handleSend}>Send</button>
        <button onClick={handleSpeechInput}>🎤</button>
      </div>

      <div className="chat-actions">
        <button onClick={handleRegenerate}>🔄 Regenerate</button>
        <button onClick={handleClearChat}>🧹 Clear Chat</button>
        <button onClick={handleExportPDF}>📄 Export to PDF</button>
      </div>

      <p className="chat-disclaimer">
        Disclaimer: This chatbot provides general information only. Always consult a healthcare professional for medical advice.
      </p>
    </div>
  );
}

export default App;
