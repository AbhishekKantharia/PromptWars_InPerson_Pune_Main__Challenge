"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Mic, Volume2, Info, Loader2 } from "lucide-react";
import { sendMessage, ChatMessage } from "@/lib/gemini";

interface ChatScreenProps {
  language: string;
}

export default function ChatScreen({ language }: ChatScreenProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initial welcome message
    const initialWelcome =
      language === "hi"
        ? "नमस्ते! मैं वर्षा (Varsha) हूँ, आपकी मानसून सहायता गाइड। मैं बाढ़ सुरक्षा, आश्रय स्थानों, स्वास्थ्य युक्तियों और तैयारी योजनाओं के बारे में आपकी सहायता कर सकती हूँ। आप मुझसे क्या पूछना चाहते हैं?"
        : "Namaste! I am Varsha, your MonsoonShield assistant. I can guide you on flood safety, shelters, health, preparedness, or help you submit an SOS. How can I help you today?";

    setMessages([
      {
        role: "assistant",
        content: initialWelcome,
        timestamp: new Date(),
      },
    ]);
  }, [language]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: ChatMessage = {
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsLoading(true);

    try {
      const responseText = await sendMessage(text, [...messages, userMsg], {
        location: "Pune, Maharashtra",
        riskScore: 58,
        language: language,
      });

      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: responseText,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMsg]);

      // If TTS enabled, try to read the response using Web Speech API
      if (ttsEnabled && typeof window !== "undefined" && window.speechSynthesis) {
        const utterance = new SpeechSynthesisUtterance(responseText.replace(/[#*`_-]/g, ""));
        utterance.lang = language === "hi" ? "hi-IN" : "en-IN";
        window.speechSynthesis.speak(utterance);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const startVoiceRecognition = () => {
    if (typeof window === "undefined") return;
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Voice input is not supported in this browser. Try Chrome.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = language === "hi" ? "hi-IN" : "en-IN";
    recognition.start();

    recognition.onresult = (event: any) => {
      const resultText = event.results[0][0].transcript;
      setInputValue(resultText);
    };

    recognition.onerror = (e: any) => {
      console.error(e);
    };
  };

  const promptSuggestions =
    language === "hi"
      ? [
          "बाढ़ आने पर मुझे क्या करना चाहिए?",
          "मेरे पास का सबसे नजदीकी आश्रय खोजें",
          "मानसून स्वास्थ्य युक्तियाँ",
          "आपातकालीन किट में क्या होना चाहिए?",
        ]
      : [
          "What should I do if my area floods?",
          "Find the nearest emergency shelter",
          "Monsoon health & dengue protection",
          "What to pack in my emergency kit?",
        ];

  return (
    <div className="flex flex-col h-[calc(100vh-73px)] w-full bg-slate-950">
      {/* Header Info */}
      <div className="px-6 py-3 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-cyan-400" />
          <div>
            <h3 className="text-sm font-bold text-white leading-none">Chat with Varsha AI</h3>
            <span className="text-[10px] text-green-400 font-semibold uppercase tracking-wider">
              🟢 Online & Grounded in NDMA Rules
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTtsEnabled(!ttsEnabled)}
            className={`p-2 rounded-lg border transition-colors ${
              ttsEnabled
                ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400"
                : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white"
            }`}
            title="Toggle Text-to-Speech"
          >
            <Volume2 className="h-4 w-4" />
          </button>
          <div className="text-[10px] text-slate-500 flex items-center gap-1">
            <Info className="h-3 w-3" />
            <span>Gemini 2.5 Active</span>
          </div>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[75%] p-4 text-sm leading-relaxed whitespace-pre-line ${
                msg.role === "user"
                  ? "chat-bubble-user text-white shadow-md shadow-blue-900/10"
                  : "chat-bubble-ai text-slate-200"
              }`}
            >
              {msg.content}
              <span className="block text-[9px] text-slate-400/80 text-right mt-1.5 font-medium">
                {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="chat-bubble-ai text-slate-400 p-4 rounded-xl flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-cyan-400" />
              <span>Varsha is thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestion Chips */}
      {messages.length === 1 && (
        <div className="px-6 py-2 flex flex-wrap gap-2 justify-center bg-slate-950">
          {promptSuggestions.map((sug) => (
            <button
              key={sug}
              onClick={() => handleSend(sug)}
              className="text-xs px-3 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/50 hover:text-white transition-colors"
            >
              {sug}
            </button>
          ))}
        </div>
      )}

      {/* Input Field */}
      <div className="p-4 border-t border-slate-800 bg-slate-900/30">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(inputValue);
          }}
          className="flex gap-2 max-w-4xl mx-auto relative"
        >
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={
              language === "hi"
                ? "यहाँ टाइप करें (उदा. 'बाढ़ से बचाव कैसे करें?')"
                : "Type message (e.g. 'How to prevent dengue?')"
            }
            className="flex-1 px-4 py-3.5 pr-24 rounded-xl bg-slate-900 border border-slate-800 focus:outline-none focus:border-cyan-500/50 text-sm text-white placeholder-slate-500"
          />
          <div className="absolute right-2 top-2 flex gap-1">
            <button
              type="button"
              onClick={startVoiceRecognition}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-cyan-400 transition-colors"
              title="Voice Input"
            >
              <Mic className="h-4 w-4" />
            </button>
            <button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className="p-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 hover:opacity-90 text-white transition-all disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
