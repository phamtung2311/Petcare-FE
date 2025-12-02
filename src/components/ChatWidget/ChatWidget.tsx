import React, { useState, useRef, useEffect } from "react";
import "./ChatWidget.css";

interface Message {
  role: "user" | "model";
  message: string;
}

const ChatWidget: React.FC = () => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: Message = { role: "user", message: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:8080/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg.message,
          history: messages,
        }),
      });

      const data = await response.json();

      if (data.status === 200) {
        const aiMsg: Message = { role: "model", message: data.data.reply };
        setMessages(prev => [...prev, aiMsg]);
      } else {
        setMessages(prev => [
          ...prev,
          { role: "model", message: "Lỗi: " + data.message }
        ]);
      }
    } catch (err) {
      setMessages(prev => [
        ...prev,
        { role: "model", message: "Không thể kết nối tới server 😿" }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSend();
  };

  return (
    <div className="chat-window">
      <div className="chat-header">
        🐶 PetCare Support
      </div>

      <div className="chat-body">
        {messages.length === 0 && (
          <div style={{ textAlign: "center", color: "#888", marginTop: 20 }}>
            Xin chào! Tôi có thể giúp gì cho thú cưng của bạn? 🐾
          </div>
        )}

        {messages.map((msg, index) => (
          <div
            key={index}
            style={{
              display: "flex",
              justifyContent:
                msg.role === "user" ? "flex-end" : "flex-start",
            }}
          >
            <div
              className={`message-bubble ${
                msg.role === "user" ? "message-user" : "message-model"
              }`}
            >
              {msg.message}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="loading-dots">
            PetBot đang suy nghĩ...
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="chat-footer">
        <input
          type="text"
          placeholder="Nhập câu hỏi..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
        />
        <button onClick={handleSend} disabled={isLoading}>
          Gửi
        </button>
      </div>
    </div>
  );
};

export default ChatWidget;
