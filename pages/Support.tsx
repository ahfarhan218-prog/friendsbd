
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleGenAI } from "@google/genai";

const Support: React.FC = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<{role: 'user' | 'ai', text: string}[]>([
    { role: 'ai', text: 'Hello! I am your FriendsBD assistant. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      // Use the API key from environment variables and initialize a fresh GoogleGenAI instance for the request
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      // Selecting 'gemini-3-flash-preview' for basic text/Q&A tasks as per guidelines
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: userMsg,
        config: {
          systemInstruction: "You are a friendly and helpful customer support agent for 'FriendsBD', a social gaming platform for users in Bangladesh. You help with cricket tournaments, points, rewards, and technical issues. Be concise and polite.",
        },
      });

      // Extract text output from response.text (property access)
      const aiText = response.text || "I'm sorry, I couldn't process that. Please try again.";
      setMessages(prev => [...prev, { role: 'ai', text: aiText }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'ai', text: "Error connecting to service. Please try again later." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] md:h-[calc(100vh-64px)] bg-slate-50 w-full max-w-full max-w-5xl mx-auto px-4 sm:px-6 mx-auto md:rounded-3xl md:border md:border-slate-100 md:shadow-sm">
      <header className="bg-purple-700 text-white p-4 sm:p-6 pb-12 rounded-b-[3rem] flex flex-wrap items-center gap-4 shrink-0">
        <button onClick={() => navigate(-1)} className="p-2 bg-purple-600 rounded-full">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
        </button>
        <div>
          <h2 className="text-xl font-bold">Help & Support</h2>
          <div className="flex flex-wrap items-center gap-1">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
            <p className="text-xs sm:text-sm opacity-70">AI Assistant Online</p>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 no-scrollbar">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-4 rounded-3xl text-sm ${
              m.role === 'user' 
                ? 'bg-purple-600 text-white rounded-br-none' 
                : 'bg-white text-slate-700 shadow-sm border border-slate-100 rounded-bl-none'
            }`}>
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex flex-wrap gap-2">
              <span className="w-2 h-2 bg-purple-300 rounded-full animate-bounce"></span>
              <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
              <span className="w-2 h-2 bg-purple-600 rounded-full animate-bounce [animation-delay:0.4s]"></span>
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      <div className="p-4 bg-white border-t border-slate-100 shrink-0">
        <div className="flex flex-wrap gap-2">
          <input 
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && handleSend()}
            placeholder="Type your message..."
            className="flex-1 bg-slate-50 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-purple-200 outline-none"
          />
          <button 
            onClick={handleSend}
            disabled={loading}
            className="bg-purple-600 text-white p-3 rounded-2xl shadow-lg shadow-purple-100 disabled:opacity-50"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Support;

