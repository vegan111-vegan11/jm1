import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Message } from "../types";
import { Send, Sparkles, MapPin, Compass, AlertCircle, RefreshCw, MessageCircle } from "lucide-react";

export default function AiGuideSection() {
  const [chatMessages, setChatMessages] = useState<Message[]>([
    {
      id: "guide-msg-1",
      role: "model",
      text: "안녕하세요! 제주매거진 공식 AI 트래블 메이트입니다. 🍊\n\n조용한 평대리의 돌담 마을을 걷고 싶으신가요, 아니면 차귀도 너머 바다 위 낙조를 감상하며 사색하고 싶으신가요? 제주의 힙한 미식 카페, 친환경 슬로우 스테이, 에코 액티비티까지 귀하의 일정과 취향에 맞는 완벽한 로컬 스토리를 맞춤 설계해 드릴게요.",
      createdAt: new Date().toISOString()
    }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleChatSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;

    const userMsgText = chatInput;
    const userMsg: Message = {
      id: `guide-user-${Date.now()}`,
      role: "user",
      text: userMsgText,
      createdAt: new Date().toISOString()
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput("");
    setIsChatLoading(true);

    try {
      // Create chat history mapped precisely
      const historyPayload = [...chatMessages, userMsg].map((m) => ({
        role: m.role,
        text: m.text
      }));

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: historyPayload,
          role: "travel-planner" // Jeju Travel Planner
        })
      });

      const data = await response.json();
      if (data.success) {
        const modelMsg: Message = {
          id: `guide-model-res-${Date.now()}`,
          role: "model",
          text: data.text,
          createdAt: new Date().toISOString()
        };
        setChatMessages((prev) => [...prev, modelMsg]);
      } else {
        throw new Error(data.error || "응답 생성 불가");
      }
    } catch (err: any) {
      console.error(err);
      const errorMsg: Message = {
        id: `guide-err-${Date.now()}`,
        role: "model",
        text: "AI 가이드 서버와의 연결 상태를 조율하고 있습니다. 잠시 후 다시 여정을 물어봐 주세요.",
        createdAt: new Date().toISOString()
      };
      setChatMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    setChatInput(prompt);
  };

  const clearChat = () => {
    setChatMessages([
      {
        id: `guide-reset-${Date.now()}`,
        role: "model",
        text: "여정이 새롭게 리셋되었습니다! 가고 싶은 제주의 지역(동부/서부/남부)이나 취향(사색/미식/해양 레저)을 편하게 들려주세요.",
        createdAt: new Date().toISOString()
      }
    ]);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:h-[700px] h-auto items-stretch">
      {/* Travel Planner Info Side Panel */}
      <div className="lg:col-span-4 bg-stone-50 border border-stone-100 p-6 rounded-3xl flex flex-col justify-between">
        <div className="space-y-6">
          <div className="flex items-center space-x-2 bg-amber-500/10 text-amber-600 font-bold px-3 py-1.5 rounded-full text-[11px] w-fit font-mono">
            <Compass size={12} className="animate-spin text-amber-500" />
            <span>LOCAL CONCIERGE SERVICE</span>
          </div>

          <div className="space-y-3">
            <h2 className="text-xl md:text-2xl font-serif font-bold text-stone-900 leading-tight">
              제주 AI 로컬 가이드 플래너
            </h2>
            <p className="text-stone-500 text-xs leading-relaxed">
              제주의 소박한 일상과 깊은 서사가 어우러진 맞춤형 여정을 기획하는 동반자입니다. 실시간 카페 트렌드 정보부터 노을 명소 한옥 숙소까지 섬세하게 안내해 드립니다.
            </p>
          </div>

          {/* Quick Guide Points */}
          <div className="space-y-3 pt-2 text-xs text-stone-600">
            <div className="flex items-start space-x-2.5">
              <MapPin size={14} className="text-stone-900 mt-0.5 shrink-0" />
              <span>동부 구좌 평대리 및 서부 고산 차귀도 인근 추천 최적화</span>
            </div>
            <div className="flex items-start space-x-2.5">
              <Compass size={14} className="text-stone-900 mt-0.5 shrink-0" />
              <span>자연을 지키는 제로웨이스트 에코 투어 루트 제안</span>
            </div>
            <div className="flex items-start space-x-2.5">
              <MessageCircle size={14} className="text-stone-900 mt-0.5 shrink-0" />
              <span>친절하고 감성적인 로컬 가이드 어조 탑재</span>
            </div>
          </div>
        </div>

        {/* Action button */}
        <button
          onClick={clearChat}
          className="w-full flex items-center justify-center space-x-2 border border-stone-200 hover:bg-stone-100 text-stone-600 font-semibold font-display text-xs py-3.5 rounded-xl transition-colors mt-6"
        >
          <RefreshCw size={12} />
          <span>여정 새로고침 (대화 리셋)</span>
        </button>
      </div>

      {/* Interactive Chat Panel */}
      <div className="lg:col-span-8 bg-white border border-stone-100 rounded-3xl p-6 md:p-8 flex flex-col justify-between h-full">
        {/* Chat Thread */}
        <div className="flex-grow overflow-y-auto pr-2 space-y-4 bg-stone-50/20 border border-stone-50 rounded-2xl p-4 min-h-[350px]">
          {chatMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl p-4 text-xs leading-relaxed ${
                  msg.role === "user"
                    ? "bg-stone-950 text-white rounded-br-none"
                    : "bg-white text-stone-800 border border-stone-100/80 rounded-bl-none shadow-sm font-sans"
                }`}
              >
                {msg.text.split("\n").map((para, i) => (
                  <p key={i} className="mb-2 last:mb-0">
                    {para}
                  </p>
                ))}
              </div>
            </div>
          ))}
          {isChatLoading && (
            <div className="flex justify-start">
              <div className="bg-white text-stone-500 border border-stone-100 rounded-2xl rounded-bl-none p-4 text-xs flex items-center space-x-2 shadow-sm">
                <Compass className="animate-spin text-amber-500" size={13} />
                <span>AI 가이드가 최적의 제주 비밀 코스를 물색 중...</span>
              </div>
            </div>
          )}
          <div ref={chatBottomRef} />
        </div>

        {/* Quick Suggestion Prompts */}
        <div className="mt-4 mb-3 space-y-1.5">
          <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">이런 명소들을 추천받을 수 있어요</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleQuickPrompt("아날로그 감성을 느낄 수 있는 동부 구좌읍 평대리 카페 중심의 1박 2일 사색 코스를 제안해줘.")}
              className="text-[10px] bg-stone-50 border border-stone-100 hover:bg-stone-100 text-stone-600 py-1.5 px-3 rounded-full transition-colors text-left"
            >
              🪵 구좌읍 평대리 1박 2일 코스
            </button>
            <button
              onClick={() => handleQuickPrompt("바다 환경을 지키고 정화할 수 있는 의미 있는 에코 플로깅/업사이클링 액티비티 체험을 알려줘.")}
              className="text-[10px] bg-stone-50 border border-stone-100 hover:bg-stone-100 text-stone-600 py-1.5 px-3 rounded-full transition-colors text-left"
            >
              🌱 친환경 레저/플로깅 투어
            </button>
            <button
              onClick={() => handleQuickPrompt("서쪽 고산 차귀도 인근의 아늑하고 자연 친화적인 제로웨이스트 한옥 독채 숙소 정보를 원해요.")}
              className="text-[10px] bg-stone-50 border border-stone-100 hover:bg-stone-100 text-stone-600 py-1.5 px-3 rounded-full transition-colors text-left"
            >
              🏡 차귀도 친환경 감성 숙소
            </button>
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleChatSend} className="flex space-x-2">
          <input
            type="text"
            required
            placeholder="AI 동반자에게 가고 싶은 제주 코스나 궁금한 카페/명소를 편하게 질문하세요."
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            className="flex-grow bg-stone-50 border border-stone-100 rounded-xl px-4 py-3.5 text-xs focus:bg-white focus:ring-1 focus:ring-stone-950 focus:outline-none transition-all"
          />
          <button
            type="submit"
            disabled={isChatLoading || !chatInput.trim()}
            className="bg-stone-950 text-white hover:bg-stone-800 disabled:bg-stone-100 disabled:text-stone-300 p-3.5 rounded-xl transition-all shadow-md shrink-0"
          >
            <Send size={15} />
          </button>
        </form>
      </div>
    </div>
  );
}
