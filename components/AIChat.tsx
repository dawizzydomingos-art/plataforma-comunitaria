import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Clock, ShieldAlert, Sparkles, MessageCircleSimple } from "lucide-react";
import type { ChatMessage } from "../types";

export const AIChat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      sender: "ai",
      text: "Olá! Sou o seu Assistente Comunitário Inteligente da plataforma. 👋\n\nEstou aqui para oferecer apoio psicológico, informações práticas e orientações de segurança em Moçambique. Todas as conversas são estritamente sigilosas e confidenciais.\n\nComo posso apoiar-lhe hoje?",
      timestamp: new Date().toLocaleTimeString("pt-MZ", { hour: "2-digit", minute: "2-digit" })
    }
  ]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickSugs = [
    "Estou em perigo agora, o que faço?",
    "Quero denunciar violência doméstica",
    "Como funciona a denúncia anónima?",
    "Quais os canais de apoio à criança?",
    "Quero saber os meus direitos legais em caso de abusos"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const sendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString("pt-MZ", { hour: "2-digit", minute: "2-digit" })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setIsTyping(true);

    try {
      // Gather formatted history for server
      // Format: { role: 'user' | 'assistant', content: string }
      const historyPayload = messages.map((m) => ({
        role: m.sender === "ai" ? "assistant" : "user",
        content: m.text
      }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          history: historyPayload
        })
      });

      if (!res.ok) {
        throw new Error("Erro na resposta do assistente.");
      }

      const data = await res.json();
      
      const aiMsg: ChatMessage = {
        id: `msg-ai-${Date.now()}`,
        sender: "ai",
        text: data.text || "Desculpe, neste momento estou indisponível. Por favor, utilize os contactos telefónicos fornecidos.",
        timestamp: new Date().toLocaleTimeString("pt-MZ", { hour: "2-digit", minute: "2-digit" })
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (error) {
      const errorMsg: ChatMessage = {
        id: `msg-err-${Date.now()}`,
        sender: "ai",
        text: "Desculpe, ocorreu uma falha de comunicação com o servidor. Recomendo ligar com urgência para a Linha 112 em caso de perigo imediato.",
        timestamp: new Date().toLocaleTimeString("pt-MZ", { hour: "2-digit", minute: "2-digit" })
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputText);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 fade-in">
      {/* Suggestions Column */}
      <div className="lg:col-span-4 space-y-4 order-2 lg:order-1">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-indigo-700 font-bold mb-3">
            <Sparkles className="w-5 h-5" />
            <h3 className="text-sm">Sugestões Rápidas</h3>
          </div>
          <div className="flex flex-col gap-2">
            {quickSugs.map((sug, idx) => (
              <button
                key={idx}
                onClick={() => sendMessage(sug)}
                className="w-full text-left text-xs text-slate-700 hover:text-indigo-800 bg-slate-50 hover:bg-indigo-50/50 p-2.5 rounded-xl border border-slate-100/50 hover:border-indigo-100 transition-all font-medium leading-relaxed cursor-pointer"
              >
                {sug}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-5 rounded-2xl border border-amber-100 text-amber-900 space-y-2.5 shadow-sm">
          <h4 className="font-bold text-xs flex items-center gap-2 text-amber-900 uppercase tracking-wide">
            <ShieldAlert className="w-4.5 h-4.5 text-amber-600" /> Aviso Importante
          </h4>
          <p className="text-[11px] leading-relaxed font-medium text-amber-800">
            A Inteligência Artificial é uma ferramenta complementar de orientação informativa. Ela não substitui tratamentos clínicos, apoio terapêutico profissional ou a intervenção direta das autoridades policiais em Moçambique.
          </p>
        </div>
      </div>

      {/* Chat Column */}
      <div className="lg:col-span-8 flex flex-col h-[520px] bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden order-1 lg:order-2">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-700 to-indigo-900 p-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-xl">
              <Bot className="w-5 h-5 text-indigo-200" />
            </div>
            <div>
              <h3 className="text-sm font-bold flex items-center gap-1.5">
                Apoio Inteligente PC
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </h3>
              <p className="text-[10px] text-indigo-200 font-medium">Resposta instantânea pelo modelo Gemini</p>
            </div>
          </div>
        </div>

        {/* Message Container */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-50 space-y-4">
          {messages.map((m) => {
            const isAi = m.sender === "ai";
            return (
              <div
                key={m.id}
                className={`flex gap-3 max-w-[85%] ${isAi ? "mr-auto" : "ml-auto flex-row-reverse"}`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${
                    isAi ? "bg-indigo-50 text-indigo-700 border border-indigo-100" : "bg-indigo-600 text-white"
                  }`}
                >
                  {isAi ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>
                <div className="space-y-1">
                  <div
                    className={`p-3 rounded-2xl text-xs font-medium leading-relaxed whitespace-pre-line shadow-sm ${
                      isAi ? "bg-white text-slate-800 border border-slate-100" : "bg-indigo-600 text-white"
                    }`}
                  >
                    {m.text}
                  </div>
                  <div
                    className={`text-[9px] text-slate-400 font-mono tracking-tight flex items-center gap-1 px-1 justify-end ${
                      isAi ? "text-left" : "text-right"
                    }`}
                  >
                    <Clock className="w-3 h-3" /> {m.timestamp}
                  </div>
                </div>
              </div>
            );
          })}

          {isTyping && (
            <div className="flex gap-3 max-w-[85%] mr-auto">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center justify-center shadow-sm">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-white border-t border-slate-100 flex gap-2 items-center">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Conte-me o que sente, escreva a sua mensagem..."
            rows={1}
            className="flex-1 resize-none overflow-y-auto max-h-20 py-2.5 px-4 bg-slate-50 border border-slate-200 text-slate-800 placeholder:text-slate-400 rounded-xl text-xs focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors"
          />
          <button
            onClick={() => sendMessage(inputText)}
            disabled={!inputText.trim() || isTyping}
            className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white border-none shadow-sm cursor-pointer disabled:bg-slate-200 disabled:text-slate-400 hover:scale-105 transition-all text-xs"
          >
            <Send className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
