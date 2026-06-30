import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Brain, 
  Search, 
  FileText, 
  UploadCloud, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  Database, 
  Cpu, 
  BookOpen, 
  AlertCircle, 
  X, 
  HelpCircle,
  FileCheck,
  Send,
  Sparkle
} from "lucide-react";
import { Message } from "../types";

interface RagResult {
  id: string;
  source: string;
  content: string;
  category: string;
  score: number;
}

export default function RagSection() {
  const [activeSubTab, setActiveSubTab] = useState<"chat" | "search">("chat");
  
  // Knowledge docs overview
  const [systemDocs, setSystemDocs] = useState([
    { name: "제주매거진 아티클 전체 DB", type: "자동 동기화", count: "4개 실시간 연동", active: true },
    { name: "제주 비경 도감 2026 가이드북", type: "공식 출판 가이드", count: "2개 챕터", active: true },
    { name: "평대리 돌담 보존지구 도보 가이드", type: "로컬 자치 가이드", count: "2개 챕터", active: true }
  ]);

  const [uploadedFiles, setUploadedFiles] = useState<Array<{ name: string; chunks: number; status: string }>>([]);

  // File Upload states
  const [dragActive, setDragActive] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [uploadMessage, setUploadMessage] = useState("");
  const [tempFileContent, setTempFileContent] = useState("");
  const [tempFileName, setTempFileName] = useState("");
  const [isDemoUploaderOpen, setIsDemoUploaderOpen] = useState(false);

  // Semantic Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<RagResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // RAG Chat states
  const [chatMessages, setChatMessages] = useState<Message[]>([
    {
      id: "rag-init",
      role: "model",
      text: "안녕하세요! 제주매거진의 **RAG (Retrieval-Augmented Generation) 지식 가이드**입니다.\n\n저는 단순히 학습된 지식에 의존하지 않고, 발행된 정식 저널 기사 및 보존 위원회의 지역 가이드를 **실시간 검색 및 인용**하여 정확한 정보를 전달합니다. 아래 예시 질문을 클릭하시거나, 궁금하신 제주의 역사·문화·식문화에 대해 질문해 보세요.",
      createdAt: new Date().toISOString()
    }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [currentCitations, setCurrentCitations] = useState<any[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [selectedCitationId, setSelectedCitationId] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // Handle Drag Over
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // Simulate file drops with curated premium txt contents
  const triggerDemoUpload = async (title: string, contentText: string) => {
    setUploadStatus("loading");
    setUploadMessage("지식 조각 파싱 및 형태소 세그멘테이션 진행 중...");
    
    try {
      const response = await fetch("/api/rag/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: title,
          content: contentText,
          category: "로컬 아카이브 업로드"
        })
      });

      const data = await response.json();
      if (data.success) {
        setUploadStatus("success");
        setUploadMessage(data.message);
        setUploadedFiles(prev => [...prev, { name: title, chunks: data.chunksCount, status: "벡터화 완료" }]);
        // Refresh docs
        setSystemDocs(prev => [
          ...prev, 
          { name: title, type: "사용자 업로드", count: `${data.chunksCount}개 지식 조각`, active: true }
        ]);
        setTimeout(() => {
          setUploadStatus("idle");
          setIsDemoUploaderOpen(false);
        }, 3000);
      } else {
        throw new Error(data.message || "업로드 실패");
      }
    } catch (err: any) {
      setUploadStatus("error");
      setUploadMessage(err.message || "지식 임베딩 도중 무선 노드 지연이 발생했습니다.");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        triggerDemoUpload(file.name, text || "테스트 데이터");
      };
      reader.readAsText(file);
    }
  };

  // Semantic Search Run
  const handleSemanticSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch("/api/rag/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery })
      });
      const data = await response.json();
      if (data.success) {
        setSearchResults(data.results);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  // RAG Chat Send
  const handleRagChatSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;

    const userText = chatInput;
    const userMsg: Message = {
      id: `rag-user-${Date.now()}`,
      role: "user",
      text: userText,
      createdAt: new Date().toISOString()
    };

    setChatMessages(prev => [...prev, userMsg]);
    setChatInput("");
    setIsChatLoading(true);
    setSelectedCitationId(null);

    try {
      const historyPayload = [...chatMessages, userMsg].map(m => ({
        role: m.role,
        text: m.text
      }));

      const response = await fetch("/api/rag/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: historyPayload })
      });

      const data = await response.json();
      if (data.success) {
        const modelMsg: Message = {
          id: `rag-model-${Date.now()}`,
          role: "model",
          text: data.text,
          createdAt: new Date().toISOString()
        };

        setChatMessages(prev => [...prev, modelMsg]);
        setCurrentCitations(data.citations || []);
      } else {
        throw new Error(data.error || "답변 구성 실패");
      }
    } catch (err: any) {
      console.error(err);
      setChatMessages(prev => [
        ...prev,
        {
          id: `rag-err-${Date.now()}`,
          role: "model",
          text: "지식 클러스터 연동 중 일시적 오류가 발생했습니다. 잠시 후 질문을 보완하여 다시 인덱싱해 주세요.",
          createdAt: new Date().toISOString()
        }
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleQuickQuestion = (q: string) => {
    setChatInput(q);
  };

  const DEMO_PRESETS = [
    {
      title: "제주 오조리 철새도래지 탐방 가이드.txt",
      content: "성산읍 오조리 식산봉 아래 해안 지대는 가을부터 봄까지 수많은 희귀 철새들이 날아드는 제주의 천연 생태 보존 구역입니다. 이곳 식산봉 산책로는 가볍게 30분 내로 걸을 수 있으며 조망 데크가 있어 청둥오리, 저어새 등을 관찰하기 매우 적합합니다. 바람이 부는 저녁 오조리 돌담 너머 성산일출봉의 비경은 한 폭의 아날로그 유화 같습니다."
    },
    {
      title: "제주 구좌읍 평대리 당근 수프 레시피 아카이브.txt",
      content: "평대리 전통 당근 수프의 비결은 물을 최소한으로 쓰고 버터에 얇게 썬 신선한 겨울 당근을 갈색이 돌기 직전까지 오랫동안 볶아 단맛을 농축하는 것입니다. 이후 우유 대신 캐슈넛 밀크나 제주의 청정 화산 암반수를 살짝 부어 함께 끓여내면 향긋함과 깊은 고소함이 동시에 공존하는 환상적인 로컬 푸드가 탄생합니다."
    }
  ];

  return (
    <div className="space-y-8">
      
      {/* 1. Header Hero with premium micro-grid info */}
      <div className="bg-stone-900 text-stone-100 rounded-3xl p-6 md:p-8 relative overflow-hidden border border-stone-800 shadow-xl">
        <div className="absolute inset-0 bg-radial-gradient from-amber-500/10 via-transparent to-transparent opacity-60 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <span className="bg-amber-400 text-stone-950 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider font-mono inline-flex items-center gap-1.5">
              <Brain size={11} className="animate-pulse" />
              <span>Semantic RAG AI 브릿지</span>
            </span>
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-white tracking-tight">
              실시간 지식 참조형 제주 트렌드 큐레이터
            </h2>
            <p className="text-xs md:text-sm text-stone-300 leading-relaxed font-sans">
              제주매거진에 등록된 모든 저널 아티클과 사용자가 임시로 업로드한 로컬 도큐먼트를 **다차원 벡터 변환(Embedding)**하여 실시간 매칭합니다. 할루시네이션(거짓 정보 왜곡) 없이 고도의 팩트와 출처가 보장된 큐레이션을 경험해 보세요.
            </p>
          </div>

          <div className="bg-stone-800/80 backdrop-blur-md p-4 rounded-2xl border border-stone-700/60 flex flex-col justify-center space-y-2 text-left w-full md:w-auto min-w-[200px] shadow-inner font-mono">
            <div className="flex items-center justify-between text-[11px] text-stone-400">
              <span>액티브 벡터 차원</span>
              <span className="text-amber-400 font-bold">1536 Dim</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-stone-400">
              <span>등록 지식 인덱스</span>
              <span className="text-stone-200 font-bold">{8 + (uploadedFiles.length * 2)} Chunks</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-stone-400">
              <span>추출 정확도 임계치</span>
              <span className="text-emerald-400 font-bold">Cosine {">"} 0.70</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Primary Responsive Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* Left Column: Knowledge Management & Custom Embedder */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Active Knowledge Sources Card */}
          <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between space-y-4">
            <div>
              <h3 className="font-serif font-black text-sm text-stone-900 flex items-center gap-2">
                <Database size={15} className="text-amber-600" />
                <span>RAG 연동 지식 아카이브</span>
              </h3>
              <p className="text-[11px] text-stone-500 leading-relaxed mt-1">
                현재 시스템이 실시간으로 리트리벌(Retrieval)해 올 수 있는 정제된 문헌 DB 목록입니다.
              </p>
            </div>

            <div className="space-y-3 my-2">
              {systemDocs.map((doc, idx) => (
                <div key={idx} className="bg-stone-50 border border-stone-200/60 p-3 rounded-xl flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-stone-800">{doc.name}</p>
                    <div className="flex items-center space-x-2 text-[9.5px] font-mono text-stone-400">
                      <span className="bg-stone-200 px-1.5 py-0.5 rounded text-stone-600">{doc.type}</span>
                      <span>•</span>
                      <span>{doc.count}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1.5 shrink-0 text-emerald-600">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-[10px] font-bold font-mono">ON</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
              <span className="text-[10.5px] font-bold text-stone-500 font-serif">사용자 지식 연동 기능</span>
              <span className="text-[9.5px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold font-mono">가변 임베더</span>
            </div>
          </div>

          {/* Real-time Custom Document Embedder (Drag & Drop UI) */}
          <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm space-y-4 relative">
            <div>
              <h3 className="font-serif font-black text-sm text-stone-900 flex items-center gap-2">
                <UploadCloud size={16} className="text-amber-600" />
                <span>로컬 파일 벡터 임베더</span>
              </h3>
              <p className="text-[11px] text-stone-500 leading-relaxed mt-1">
                직접 쓴 여행 일지나 가이드 파일을 끌어다 놓아 보세요. 기계 학습용 문맥 벡터 데이터로 쪼개어 RAG 캐시에 주입합니다.
              </p>
            </div>

            {/* Drag & Drop Stage */}
            <div 
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                dragActive 
                  ? "border-amber-500 bg-amber-50/50 scale-[0.98]" 
                  : "border-stone-200 hover:border-stone-300 hover:bg-stone-50"
              }`}
            >
              <UploadCloud size={32} className="mx-auto text-stone-400 mb-2 animate-bounce-slow" />
              <p className="text-[11.5px] font-bold text-stone-800">도큐먼트 파일 드래그 & 드롭</p>
              <p className="text-[9.5px] text-stone-400 mt-1">또는 마우스로 텍스트 파일을 끌어오세요 (.txt 지원)</p>
            </div>

            {/* Quick Demo Upload Button */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[9.5px] text-stone-400 font-bold block">💡 빠른 RAG 임베딩 체험을 위한 로컬 가이드 템플릿:</span>
              <div className="grid grid-cols-2 gap-2">
                {DEMO_PRESETS.map((preset, i) => (
                  <button
                    key={i}
                    onClick={() => triggerDemoUpload(preset.title, preset.content)}
                    className="text-[10px] bg-amber-50/70 hover:bg-amber-100 border border-amber-200 text-amber-800 rounded-lg p-2 text-left font-medium leading-tight transition-all truncate"
                  >
                    📂 {preset.title}
                  </button>
                ))}
              </div>
            </div>

            {/* Upload status banner */}
            <AnimatePresence>
              {uploadStatus !== "idle" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className={`p-3 rounded-xl border text-xs leading-relaxed flex items-start gap-2 ${
                    uploadStatus === "loading" ? "bg-stone-50 border-stone-200 text-stone-600" :
                    uploadStatus === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-800" :
                    "bg-rose-50 border-rose-200 text-rose-800"
                  }`}
                >
                  <Cpu size={14} className="mt-0.5 shrink-0 text-amber-500 animate-spin" />
                  <div>
                    <p className="font-bold">{uploadStatus === "loading" ? "인덱스 구성 중" : uploadStatus === "success" ? "임베딩 완료" : "오류 발생"}</p>
                    <p className="text-[10.5px] mt-0.5">{uploadMessage}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </div>

          {/* Embedding Vector Space Visualization (Trendy Modern Aesthetic) */}
          <div className="bg-[#1e1e1c] text-stone-200 rounded-3xl p-5 border border-stone-800 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold tracking-wider text-stone-400 font-mono flex items-center gap-1.5">
                <Cpu size={12} className="text-amber-400" />
                <span>VECTOR NEST GRAPH</span>
              </span>
              <span className="text-[10px] font-mono text-emerald-400">● REAL-TIME</span>
            </div>

            {/* Mock Node Ring Area */}
            <div className="h-28 relative bg-stone-950 rounded-2xl overflow-hidden border border-stone-800 flex items-center justify-center">
              <div className="absolute inset-0 bg-radial-gradient from-amber-500/5 to-transparent pointer-events-none" />
              
              {/* Spinning geometric grid */}
              <div className="w-20 h-20 rounded-full border border-stone-800 border-dashed animate-spin-slow absolute" />
              <div className="w-10 h-10 rounded-full border border-amber-500/20 absolute" />
              
              {/* Dynamic point nodes */}
              <div className="w-2.5 h-2.5 bg-amber-400 rounded-full absolute top-8 left-12 animate-pulse shadow-lg shadow-amber-400/50" />
              <div className="w-2 h-2 bg-emerald-400 rounded-full absolute bottom-6 right-16 animate-ping" />
              <div className="w-2.5 h-2.5 bg-stone-700 rounded-full absolute top-14 right-8" />
              <div className="w-1.5 h-1.5 bg-amber-500 rounded-full absolute bottom-12 left-10" />

              <span className="text-[9px] font-mono text-stone-500 absolute bottom-2 right-3">Node Space: Core-1</span>
            </div>

            <p className="text-[10px] text-stone-400 leading-relaxed text-center font-sans">
              문장들 간의 의미적 거리를 다차원 평면으로 투영하여 군집화 중입니다. 질문 인입 시 가장 거리가 가까운 상위 Chunks를 순간 탐색합니다.
            </p>
          </div>

        </div>

        {/* Right Column: Interaction Arena (Chat vs Search) */}
        <div className="lg:col-span-8 flex flex-col bg-white border border-stone-200 rounded-3xl overflow-hidden shadow-sm min-h-[580px]">
          
          {/* Interaction Header tabs */}
          <div className="bg-stone-50 border-b border-stone-200/80 px-4 py-3 md:px-6 md:py-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-2.5">
              <div className="bg-amber-500 text-stone-950 p-2.5 rounded-xl shrink-0">
                <Brain size={16} />
              </div>
              <div>
                <h3 className="font-serif font-black text-xs md:text-sm text-stone-900 leading-tight">RAG 로컬 지식 탐색 엔진</h3>
                <p className="text-[9.5px] md:text-[10.5px] text-stone-500 font-mono leading-none mt-1">Knowledge Grounding Base v2.1</p>
              </div>
            </div>

            {/* Custom Tab Toggles - horizontal scrollable on mobile */}
            <div className="flex overflow-x-auto scrollbar-none bg-stone-200/60 p-1 rounded-xl border border-stone-200 shrink-0 select-none">
              <button
                onClick={() => setActiveSubTab("chat")}
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-[10.5px] md:text-[11px] font-bold transition-all whitespace-nowrap active:scale-[0.98] ${
                  activeSubTab === "chat"
                    ? "bg-white text-stone-950 shadow-sm"
                    : "text-stone-500 hover:text-stone-900"
                }`}
              >
                <Sparkles size={11} className="text-amber-500" />
                <span>출처 기반 AI 대화 (RAG Chat)</span>
              </button>
              <button
                onClick={() => setActiveSubTab("search")}
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-[10.5px] md:text-[11px] font-bold transition-all whitespace-nowrap active:scale-[0.98] ${
                  activeSubTab === "search"
                    ? "bg-white text-stone-950 shadow-sm"
                    : "text-stone-500 hover:text-stone-900"
                }`}
              >
                <Search size={11} />
                <span>시맨틱 벡터 검색</span>
              </button>
            </div>
          </div>

          {/* Sub-tab 1: RAG Chat Arena */}
          {activeSubTab === "chat" && (
            <div className="flex-grow flex flex-col justify-between h-[500px]">
              
              {/* Chat history scroll view */}
              <div className="flex-grow p-6 overflow-y-auto space-y-4 max-h-[400px]">
                {chatMessages.map((msg, idx) => (
                  <div 
                    key={msg.id || idx} 
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-sm ${
                      msg.role === "user"
                        ? "bg-stone-950 text-white rounded-tr-none"
                        : "bg-stone-50 text-stone-850 border border-stone-200/60 rounded-tl-none whitespace-pre-wrap"
                    }`}>
                      
                      {/* Sub-label */}
                      <span className="text-[9.5px] opacity-40 block mb-1 font-mono">
                        {msg.role === "user" ? "USER" : "JEJU RAG CORE"}
                      </span>

                      {/* Msg text rendering with mock citation highlighting */}
                      <p className="font-sans leading-relaxed text-stone-800">
                        {msg.text.split(/(\[\d\])/g).map((part, pidx) => {
                          const match = part.match(/\[(\d)\]/);
                          if (match) {
                            const citationNum = match[1];
                            const isSelected = selectedCitationId === citationNum;
                            return (
                              <span 
                                key={pidx}
                                onClick={() => setSelectedCitationId(citationNum)}
                                className={`inline-block align-super font-mono text-[9.5px] font-bold px-1 rounded-sm cursor-pointer transition-all ${
                                  isSelected 
                                    ? "bg-amber-400 text-stone-950 scale-110 shadow-sm" 
                                    : "bg-amber-100 text-amber-900 hover:bg-amber-200"
                                }`}
                                title={`클릭하여 지식 출처 [${citationNum}]의 본문 강조`}
                              >
                                {part}
                              </span>
                            );
                          }
                          return part;
                        })}
                      </p>
                    </div>
                  </div>
                ))}

                {isChatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-stone-50 text-stone-500 rounded-2xl rounded-tl-none px-4 py-3 text-xs border border-stone-200/60 flex items-center space-x-3 shadow-xs">
                      <div className="flex space-x-1">
                        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                      <span className="font-mono text-[10px] text-stone-400">제주 로컬 벡터 클러스터 및 기사 참조 인덱스 조회 중...</span>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Citations Indicator Bar (Bespoke high-fidelity element) */}
              {currentCitations.length > 0 && (
                <div className="bg-stone-50 border-t border-b border-stone-200 px-6 py-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-stone-500 font-mono flex items-center gap-1">
                      <FileCheck size={12} className="text-amber-600" />
                      <span>이번 답변에 인용된 오피셜 지식 데이터 ({currentCitations.length}건)</span>
                    </span>
                    <span className="text-[9.5px] text-stone-400 leading-none">대괄호 수퍼스크립트 클릭 시 해당 출처가 강조됩니다.</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {currentCitations.map((cit, index) => {
                      const citationNum = (index + 1).toString();
                      const isSelected = selectedCitationId === citationNum;
                      return (
                        <div 
                          key={cit.id || index}
                          onClick={() => setSelectedCitationId(citationNum)}
                          className={`p-2.5 rounded-xl border text-[10.5px] leading-relaxed cursor-pointer transition-all ${
                            isSelected 
                              ? "bg-amber-50/70 border-amber-400 ring-1 ring-amber-400 shadow-sm" 
                              : "bg-white border-stone-200/80 hover:border-stone-300"
                          }`}
                        >
                          <div className="flex items-center space-x-1.5 mb-1 text-[9.5px] font-bold text-stone-600">
                            <span className="w-4 h-4 rounded-full bg-stone-950 text-white flex items-center justify-center font-mono text-[9px]">
                              {citationNum}
                            </span>
                            <span className="truncate">{cit.source}</span>
                            <span className="text-[9px] bg-emerald-50 text-emerald-800 px-1 rounded font-mono font-bold">
                              {cit.score}%
                            </span>
                          </div>
                          <p className="text-stone-500 line-clamp-2">
                            {cit.content}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Quick Prompt Suggestion Rails - horizontally scrollable and always available */}
              <div className="px-4 py-2 border-t border-stone-100 bg-stone-50/30 flex items-center space-x-2 overflow-x-auto scrollbar-none select-none">
                <span className="text-[9.5px] text-stone-400 font-bold shrink-0">추천 키워드 Chips:</span>
                <button 
                  type="button"
                  onClick={() => handleQuickQuestion("구좌읍 평대리 조용한 모카포트 드립커피 바 위치 알려줘")}
                  className="text-[10px] bg-white hover:bg-stone-100 text-stone-700 px-3 py-1.5 rounded-full transition-all border border-stone-200/80 shrink-0 shadow-sm active:scale-[0.96]"
                >
                  ☕ 평대 모카포트 커피바
                </button>
                <button 
                  type="button"
                  onClick={() => handleQuickQuestion("비가 막 그친 직후에 비자림을 걸으면 어떤 기분을 느낄 수 있나요?")}
                  className="text-[10px] bg-white hover:bg-stone-100 text-stone-700 px-3 py-1.5 rounded-full transition-all border border-stone-200/80 shrink-0 shadow-sm active:scale-[0.96]"
                >
                  🌲 우후(雨後) 비자림 숲길
                </button>
                <button 
                  type="button"
                  onClick={() => handleQuickQuestion("평대리 밭담과 겨울 당근 수확 시기가 궁금해요")}
                  className="text-[10px] bg-white hover:bg-stone-100 text-stone-700 px-3 py-1.5 rounded-full transition-all border border-stone-200/80 shrink-0 shadow-sm active:scale-[0.96]"
                >
                  🥕 겨울 당근과 밭담 역사
                </button>
                <button 
                  type="button"
                  onClick={() => handleQuickQuestion("제주 오조리 철새도래지 탐방 산책코스 추천해줘")}
                  className="text-[10px] bg-white hover:bg-stone-100 text-stone-700 px-3 py-1.5 rounded-full transition-all border border-stone-200/80 shrink-0 shadow-sm active:scale-[0.96]"
                >
                  🦆 오조리 식산봉 산책로
                </button>
              </div>

              {/* Chat Send Form */}
              <form onSubmit={handleRagChatSend} className="p-3 md:p-4 border-t border-stone-150 bg-stone-50/50 flex items-center space-x-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder={isChatLoading ? "지식 Chunks 탐색 중..." : "제주 로컬 문헌에 대해 질문하세요..."}
                  disabled={isChatLoading}
                  className="flex-grow bg-white border border-stone-200 focus:outline-none focus:border-amber-500 rounded-xl px-4 py-3.5 text-xs focus:ring-1 focus:ring-amber-500/20"
                />
                <button
                  type="submit"
                  disabled={isChatLoading || !chatInput.trim()}
                  className="bg-stone-950 text-white p-3.5 rounded-xl disabled:bg-stone-100 disabled:text-stone-300 hover:bg-stone-900 transition-all shrink-0 active:scale-[0.96] shadow-md"
                >
                  <Send size={15} />
                </button>
              </form>

            </div>
          )}

          {/* Sub-tab 2: Semantic Search list */}
          {activeSubTab === "search" && (
            <div className="flex-grow p-6 flex flex-col justify-between">
              
              <div className="space-y-4">
                <form onSubmit={handleSemanticSearch} className="flex gap-2">
                  <div className="relative flex-grow">
                    <Search className="absolute left-3.5 top-3.5 text-stone-400" size={14} />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="검색어를 입력하시면 형태소/동의어 기반의 다차원 벡터 시맨틱 매칭 순위로 나열됩니다..."
                      className="w-full bg-stone-50 border border-stone-200 focus:outline-none focus:border-amber-500 rounded-xl pl-10 pr-4 py-3 text-xs"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSearching || !searchQuery.trim()}
                    className="bg-stone-950 text-white font-bold text-xs px-5 py-3 rounded-xl hover:bg-stone-900 transition-colors flex items-center gap-1.5"
                  >
                    {isSearching ? <Cpu size={12} className="animate-spin text-amber-400" /> : <Search size={12} />}
                    <span>벡터 검색</span>
                  </button>
                </form>

                {/* Search query suggestion keywords */}
                <div className="flex flex-wrap gap-2 text-[10.5px]">
                  <span className="text-stone-400">인기 키워드:</span>
                  {["차귀도 낙조", "평대리 당근케이크", "피톤치드 삼나무", "돌담 보존지구", "모카 포레스트 드립"].map((kw, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setSearchQuery(kw);
                        setTimeout(() => handleSemanticSearch(), 50);
                      }}
                      className="text-stone-600 hover:text-amber-700 font-bold underline cursor-pointer"
                    >
                      #{kw}
                    </button>
                  ))}
                </div>

                {/* Results list */}
                <div className="space-y-3 pt-2 max-h-[350px] overflow-y-auto">
                  {searchResults.length > 0 ? (
                    searchResults.map((res, i) => (
                      <div key={res.id || i} className="bg-stone-50 hover:bg-amber-50/10 border border-stone-200 rounded-2xl p-4 transition-all">
                        <div className="flex items-center justify-between mb-2">
                          <span className="bg-stone-200/60 text-stone-700 text-[10px] font-bold px-2.5 py-0.5 rounded font-mono">
                            {res.category}
                          </span>
                          <span className="text-xs font-mono font-bold text-amber-600 flex items-center gap-1">
                            <span>시맨틱 유사도:</span>
                            <span className="bg-amber-100 px-1.5 py-0.5 rounded">{res.score}%</span>
                          </span>
                        </div>
                        <p className="text-xs text-stone-800 leading-relaxed font-sans font-medium mb-2">
                          {res.content}
                        </p>
                        <p className="text-[10px] text-stone-400 font-mono">
                          지식 출처: {res.source}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 bg-stone-50 rounded-2xl border border-dashed border-stone-200">
                      <Database size={28} className="mx-auto text-stone-300 mb-2" />
                      <p className="text-xs font-bold text-stone-500">조회된 벡터 검색 데이터가 없습니다.</p>
                      <p className="text-[10.5px] text-stone-400 mt-1">질문을 검색창에 적은 뒤 검색 버튼을 누르면 인덱스 스코어가 산출됩니다.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-amber-50/40 border border-amber-100 rounded-2xl p-4 text-xs text-stone-600 leading-relaxed flex items-start gap-2.5">
                <AlertCircle size={14} className="text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <span className="font-bold text-amber-900 block mb-0.5">벡터 임베딩 검색이란?</span>
                  <span>사용자가 전송한 질의어를 기계가 이해할 수 있는 좌표값으로 변환하고, 데이터베이스 안의 지식 구문들의 유사 각도(Cosine Similarity)를 계산해 가장 연관성 있는 원본 텍스트를 정밀 타격하여 꺼내옵니다.</span>
                </div>
              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
}
