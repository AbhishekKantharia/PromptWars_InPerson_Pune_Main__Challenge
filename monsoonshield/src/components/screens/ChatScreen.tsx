"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Mic, Volume2, Info, Loader2, Trash2 } from "lucide-react";
import { sendMessage, ChatMessage } from "@/lib/gemini";
import { useAuth } from "@/lib/AuthContext";

interface ChatScreenProps {
  language: string;
}

export default function ChatScreen({ language }: ChatScreenProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: `Namaste! 🙏 I'm Varsha (वर्षा), your MonsoonShield AI assistant.

I can help you with:
🌊 Flood safety & emergency guidance
🏠 Finding nearest emergency shelters
📋 Personalized monsoon preparedness plans
🏥 Health advisories — dengue, malaria prevention
🏛️ Government relief schemes & insurance claims
👨‍👩‍👧 Family safety & check-in protocols

**Try asking me:**
• "What should I do if my area floods?"
• "Find nearest emergency shelter"
• "Generate my preparedness checklist"
• "How to prevent dengue?"

⚡ Powered by Google Gemini AI | Grounded in NDMA guidelines`,
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const welcomeHi = `नमस्ते! 🙏 मैं वर्षा (Varsha) हूँ, आपकी MonsoonShield AI सहायता गाइड।

मैं आपकी इन चीज़ों में मदद कर सकती हूँ:
🌊 बाढ़ से बचाव और सुरक्षा
🏠 नज़दीकी आश्रय केंद्र
📋 मानसून तैयारी योजना
🏥 स्वास्थ्य सलाह (डेंगू, मलेरिया)
🏛️ सरकारी योजनाएँ और राहत
👨‍👩‍👧 परिवार सुरक्षा

**मुझसे पूछें:**
• "बाढ़ आने पर क्या करूँ?"
• "मेरे पास का आश्रय खोजें"
• "मेरी तैयारी योजना बनाएँ"

⚡ Google Gemini AI द्वारा संचालित | NDMA दिशानिर्देशों पर आधारित`;

    const welcomeEn = `Namaste! 🙏 I'm Varsha (वर्षा), your MonsoonShield AI assistant.

I can help you with:
🌊 Flood safety & emergency guidance
🏠 Finding nearest emergency shelters
📋 Personalized monsoon preparedness plans
🏥 Health advisories — dengue, malaria prevention
🏛️ Government relief schemes & insurance claims
👨‍👩‍👧 Family safety & check-in protocols

**Try asking me:**
• "What should I do if my area floods?"
• "Find nearest emergency shelter"
• "Generate my preparedness checklist"
• "How to prevent dengue?"

⚡ Powered by Google Gemini AI | Grounded in NDMA guidelines`;

    setMessages([
      {
        role: "assistant",
        content: language === "hi" ? welcomeHi : welcomeEn,
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
    if (!text.trim() || isLoading) return;

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
        location: user?.location || "Pune, Maharashtra",
        riskScore: 58,
        language: language,
        familySize: user?.familySize,
        hasChildren: user?.hasChildren,
        hasElderly: user?.hasElderly,
        hasMedical: user?.hasMedical,
        profile: user ? `${user.name}, ${user.familySize} members, ${user.floor} floor` : undefined,
      });

      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: responseText,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMsg]);

      if (ttsEnabled && typeof window !== "undefined" && window.speechSynthesis) {
        const cleaned = responseText
          .replace(/[#*`_-]/g, "")
          .replace(/\n+/g, ". ")
          .slice(0, 500);
        const utterance = new SpeechSynthesisUtterance(cleaned);
        utterance.lang = language === "hi" ? "hi-IN" : "en-IN";
        utterance.rate = 0.9;
        window.speechSynthesis.speak(utterance);
      }
    } catch (err) {
      console.error("Chat error:", err);
      const errorMsg: ChatMessage = {
        role: "assistant",
        content: "I apologize — I'm having trouble connecting right now. Please try again in a moment, or call 112 if this is an emergency.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const startVoiceRecognition = () => {
    if (typeof window === "undefined") return;
    interface SpeechRecognitionLike {
      new (): SpeechRecognitionInstance;
    }
    interface SpeechRecognitionInstance {
      lang: string;
      continuous: boolean;
      interimResults: boolean;
      onresult: ((event: SpeechRecognitionEvent) => void) | null;
      onerror: ((event: unknown) => void) | null;
      start: () => void;
    }
    interface SpeechRecognitionEvent {
      results: SpeechRecognitionResultList;
    }
    interface SpeechRecognitionResultList {
      [index: number]: SpeechRecognitionResult;
    }
    interface SpeechRecognitionResult {
      [index: number]: SpeechRecognitionAlternative;
    }
    interface SpeechRecognitionAlternative {
      transcript: string;
    }

    const WinWithSR = window as unknown as { SpeechRecognition?: SpeechRecognitionLike; webkitSpeechRecognition?: SpeechRecognitionLike };
    const SpeechRecognition = WinWithSR.SpeechRecognition || WinWithSR.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Voice input is not supported in this browser. Try Chrome.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = language === "hi" ? "hi-IN" : "en-IN";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event: any) => {
      const resultText = event.results[0][0].transcript;
      setInputValue(resultText);
    };

    recognition.onerror = (e: any) => {
      console.error("Voice recognition error:", e);
    };

    recognition.start();
  };

  const clearChat = () => {
    setMessages([]);
    setTimeout(() => {
      const welcomeMsg: ChatMessage = {
        role: "assistant",
        content: language === "hi"
          ? "Chat साफ़ कर दिया गया। मैं वर्षा हूँ — आपकी मानसून सहायता गाइड। आपकी क्या मदद करूँ?"
          : "Chat cleared. I'm Varsha — your monsoon preparedness guide. How can I help you today?",
        timestamp: new Date(),
      };
      setMessages([welcomeMsg]);
    }, 100);
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
      {/* Header */}
      <div className="px-6 py-3 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-cyan-400" />
          <div>
            <h3 className="text-sm font-bold text-white leading-none">Chat with Varsha AI</h3>
            <span className="text-[10px] text-green-400 font-semibold uppercase tracking-wider">
              Online &middot; NDMA-Grounded &middot; Gemini 2.5
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {messages.length > 1 && (
            <button
              onClick={clearChat}
              className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-red-400 hover:border-red-500/30 transition-colors"
              title="Clear chat"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={() => setTtsEnabled(!ttsEnabled)}
            className={`p-2 rounded-lg border transition-colors ${
              ttsEnabled
                ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400"
                : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white"
            }`}
            title={ttsEnabled ? "Disable text-to-speech" : "Enable text-to-speech"}
          >
            <Volume2 className="h-4 w-4" />
          </button>
          <div className="text-[10px] text-slate-500 flex items-center gap-1">
            <Info className="h-3 w-3" />
            <span>Gemini 2.5 Active</span>
          </div>
        </div>
      </div>

      {/* Messages */}
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
              <span className="text-sm">Varsha is thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestion Chips */}
      {messages.length <= 1 && (
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

      {/* Input */}
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
            disabled={isLoading}
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
