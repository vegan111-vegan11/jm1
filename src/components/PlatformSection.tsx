import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Article, Message, EditorApplication, User } from "../types";
import { Send, Sparkles, Image as ImageIcon, BookOpen, Feather, MessageSquare, AlertCircle, CheckCircle2, Languages, ArrowRight, UserCheck, RefreshCw } from "lucide-react";

interface PlatformSectionProps {
  onPublishArticle: (article: Partial<Article>) => Promise<boolean>;
  openImageGenerator: () => void;
  lastGeneratedImage: string | null;
  user: User;
}

export default function PlatformSection({ onPublishArticle, openImageGenerator, lastGeneratedImage, user }: PlatformSectionProps) {
  const [activeSubTab, setActiveSubTab] = useState<"write" | "chat" | "apply">("write");

  // Write Article states
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Cafe");
  const [categoryKo, setCategoryKo] = useState("카페 & 가스트로노미");
  const [author, setAuthor] = useState(user.isLoggedIn ? user.nickname : "");
  const [content, setContent] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [readTime, setReadTime] = useState("3분");
  const [publishStatus, setPublishStatus] = useState<"idle" | "success" | "error">("idle");
  const [publishMessage, setPublishMessage] = useState("");

  // Become Editor states
  const [editorName, setEditorName] = useState(user.isLoggedIn ? user.nickname.split(" ")[0] : "");
  const [editorEmail, setEditorEmail] = useState(user.isLoggedIn ? user.email : "");
  const [editorBio, setEditorBio] = useState("");
  const [editorSpecialty, setEditorSpecialty] = useState("Gastronomy");
  const [applyStatus, setApplyStatus] = useState<"idle" | "success" | "error">("idle");

  // Auto-Save and AI proofreading states
  const [draftSavedTime, setDraftSavedTime] = useState<string | null>(null);
  const [isProofreading, setIsProofreading] = useState(false);
  const [proofreadResult, setProofreadResult] = useState<{
    titleSuggested?: string;
    contentProofread?: string;
    tagsSuggested?: string[];
    feedback?: string;
  } | null>(null);

  // Load draft from LocalStorage on component mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("jeju_mag_draft");
      if (saved) {
        const { draftTitle, draftCategory, draftCategoryKo, draftContent, draftExcerpt, draftImageUrl, draftReadTime, timestamp } = JSON.parse(saved);
        // Only notify if there is actual content
        if (draftTitle || draftContent) {
          setTitle(draftTitle || "");
          setCategory(draftCategory || "Cafe");
          setCategoryKo(draftCategoryKo || "카페 & 가스트로노미");
          setContent(draftContent || "");
          setExcerpt(draftExcerpt || "");
          setImageUrl(draftImageUrl || "");
          setReadTime(draftReadTime || "3분");
          setDraftSavedTime(new Date(timestamp).toLocaleTimeString());
        }
      }
    } catch (e) {
      console.error("Failed to load draft:", e);
    }
  }, []);

  // Save draft to LocalStorage whenever content changes
  useEffect(() => {
    if (!title && !content && !excerpt && !imageUrl) return;
    const delayDebounce = setTimeout(() => {
      try {
        const draftData = {
          draftTitle: title,
          draftCategory: category,
          draftCategoryKo: categoryKo,
          draftContent: content,
          draftExcerpt: excerpt,
          draftImageUrl: imageUrl,
          draftReadTime: readTime,
          timestamp: new Date().toISOString()
        };
        localStorage.setItem("jeju_mag_draft", JSON.stringify(draftData));
        setDraftSavedTime(new Date().toLocaleTimeString());
      } catch (e) {
        console.error("Failed to save draft:", e);
      }
    }, 1500); // 1.5s debounce for auto-save

    return () => clearTimeout(delayDebounce);
  }, [title, category, categoryKo, content, excerpt, imageUrl, readTime]);

  const clearDraft = () => {
    try {
      localStorage.removeItem("jeju_mag_draft");
      setTitle("");
      setContent("");
      setExcerpt("");
      setImageUrl("");
      setDraftSavedTime(null);
      setProofreadResult(null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAiProofread = async () => {
    if (!content.trim()) {
      alert("교정할 본문 내용을 먼저 입력해 주세요.");
      return;
    }
    setIsProofreading(true);
    setProofreadResult(null);
    try {
      const response = await fetch("/api/ai/proofread", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content })
      });
      const data = await response.json();
      if (data.success && data.result) {
        setProofreadResult(data.result);
      } else {
        alert("AI 교정에 실패했습니다. 본문의 양을 조절하거나 잠시 후 다시 시도해 주세요.");
      }
    } catch (e) {
      console.error(e);
      alert("통신 중 오류가 발생했습니다.");
    } finally {
      setIsProofreading(false);
    }
  };

  const applyProofreadResult = () => {
    if (!proofreadResult) return;
    if (proofreadResult.titleSuggested) {
      setTitle(proofreadResult.titleSuggested);
    }
    if (proofreadResult.contentProofread) {
      setContent(proofreadResult.contentProofread);
    }
    setProofreadResult(null);
  };

  // Pre-fill fields on user login sync
  useEffect(() => {
    if (user.isLoggedIn) {
      setAuthor(user.nickname);
      setEditorName(user.nickname.split(" ")[0]);
      setEditorEmail(user.email);
    }
  }, [user]);

  // Chat states
  const [chatRole, setChatRole] = useState<"seo-editor" | "translator">("seo-editor");
  const [chatMessages, setChatMessages] = useState<Message[]>([
    {
      id: "msg-init-1",
      role: "model",
      text: "안녕하세요! 제주매거진 디지털 헤드 데스크 AI 편집장입니다. 올리실 제주 여행 기사의 매력적인 한글/영어 헤드라인을 기획해 드리고, 세련된 문장 교정 및 키워드 추천을 도와드립니다. 무엇을 도와드릴까요?",
      createdAt: new Date().toISOString()
    }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Sync cover image if one was generated in the image generation tab!
  useEffect(() => {
    if (lastGeneratedImage) {
      setImageUrl(lastGeneratedImage);
    }
  }, [lastGeneratedImage]);

  // Scroll to bottom on new message
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleCategoryChange = (val: string) => {
    setCategory(val);
    switch (val) {
      case "Cafe":
        setCategoryKo("카페 & 가스트로노미");
        break;
      case "Stay":
        setCategoryKo("로컬 스테이");
        break;
      case "Culture":
        setCategoryKo("문화 & 예술");
        break;
      case "Activity":
        setCategoryKo("액티비티 & 트렌드");
        break;
      default:
        setCategoryKo("일반 기사");
    }
  };

  const handlePublishSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content || !author) {
      setPublishStatus("error");
      setPublishMessage("제목, 필명(에디터 명), 본문 내용을 모두 입력해 주세요.");
      return;
    }

    const success = await onPublishArticle({
      title,
      category,
      categoryKo,
      author,
      content,
      excerpt: excerpt || (content.substring(0, 100) + "..."),
      imageUrl: imageUrl || "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1200&q=80",
      readTime
    });

    if (success) {
      setPublishStatus("success");
      setPublishMessage("기사가 성공적으로 매거진 플랫폼에 발행되었습니다!");
      setTitle("");
      setContent("");
      setExcerpt("");
      setImageUrl("");
    } else {
      setPublishStatus("error");
      setPublishMessage("발행에 실패했습니다. 다시 시도해 주세요.");
    }
  };

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editorName || !editorEmail || !editorBio) {
      setApplyStatus("error");
      return;
    }

    try {
      const response = await fetch("/api/editor-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editorName,
          email: editorEmail,
          bio: editorBio,
          specialty: editorSpecialty
        })
      });

      const data = await response.json();
      if (data.success) {
        setApplyStatus("success");
        setEditorName("");
        setEditorEmail("");
        setEditorBio("");
      } else {
        setApplyStatus("error");
      }
    } catch {
      setApplyStatus("error");
    }
  };

  const handleChatSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;

    const userMsgText = chatInput;
    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      role: "user",
      text: userMsgText,
      createdAt: new Date().toISOString()
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput("");
    setIsChatLoading(true);

    try {
      // Create request payload of history including current message
      const historyPayload = [...chatMessages, userMsg].map(m => ({
        role: m.role,
        text: m.text
      }));

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: historyPayload,
          role: chatRole
        })
      });

      const data = await response.json();
      if (data.success) {
        const modelMsg: Message = {
          id: `msg-res-${Date.now()}`,
          role: "model",
          text: data.text,
          createdAt: new Date().toISOString()
        };
        setChatMessages((prev) => [...prev, modelMsg]);
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      console.error(err);
      const errorMsg: Message = {
        id: `msg-err-${Date.now()}`,
        role: "model",
        text: "데스크 AI와 연결에 일시적 장애가 발생했습니다. 잠시 후 다시 조언을 요청해 주세요.",
        createdAt: new Date().toISOString()
      };
      setChatMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleRoleChange = (newRole: "seo-editor" | "translator") => {
    setChatRole(newRole);
    if (newRole === "seo-editor") {
      setChatMessages([
        {
          id: `msg-role-${Date.now()}`,
          role: "model",
          text: "수석 편집장 역할로 전환되었습니다. 기사 제목 다듬기, SEO 분석, 문장 교열 및 마케팅 문구 조언을 진행합니다. 아이디어나 텍스트를 남겨주세요.",
          createdAt: new Date().toISOString()
        }
      ]);
    } else {
      setChatMessages([
        {
          id: `msg-role-${Date.now()}`,
          role: "model",
          text: "글로벌 관광 통번역 가이드 역할로 전환되었습니다. 일본어, 영어, 중국어 문장이나 단어 통역, 그리고 실제 비즈니스에 쓰일 영어 광고 카피 번역 등을 초고속으로 대답해 드립니다.",
          createdAt: new Date().toISOString()
        }
      ]);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left Sidebar Menu */}
      <div className="lg:col-span-3 bg-stone-50 border border-stone-100 p-4 md:p-6 rounded-2xl space-y-3 lg:space-y-4">
        <div className="hidden lg:block space-y-2">
          <h3 className="text-xs font-bold tracking-[0.2em] text-stone-400 font-display">
            JOURNALIST STUDIO
          </h3>
          <p className="text-stone-500 text-xs leading-relaxed">
            관광업 광고주 매칭 및 고품격 트렌드 매거진을 채울 기자들을 위한 크리에이터 전용 스튜디오입니다.
          </p>
        </div>

        {/* Horizontal scrollable navigation menu on mobile, list/vertical on desktop */}
        <div className="flex lg:flex-col overflow-x-auto scrollbar-none gap-1.5 pb-1 lg:pb-0 -mx-4 px-4 lg:mx-0 lg:px-0">
          <button
            onClick={() => setActiveSubTab("write")}
            className={`flex items-center space-x-2.5 px-4 py-3 rounded-xl text-xs font-semibold tracking-wider font-display transition-all whitespace-nowrap shrink-0 active:scale-[0.98] ${
              activeSubTab === "write"
                ? "bg-stone-950 text-white shadow-md shadow-stone-900/10"
                : "text-stone-600 hover:bg-stone-100/85 bg-stone-100/40 lg:bg-transparent"
            }`}
          >
            <Feather size={14} />
            <span>기사 작성 & 발행</span>
          </button>

          <button
            onClick={() => setActiveSubTab("chat")}
            className={`flex items-center space-x-2.5 px-4 py-3 rounded-xl text-xs font-semibold tracking-wider font-display transition-all whitespace-nowrap shrink-0 active:scale-[0.98] ${
              activeSubTab === "chat"
                ? "bg-stone-950 text-white shadow-md shadow-stone-900/10"
                : "text-stone-600 hover:bg-stone-100/85 bg-stone-100/40 lg:bg-transparent"
            }`}
          >
            <MessageSquare size={14} />
            <span>데스크 AI 보좌관</span>
          </button>

          <button
            onClick={() => setActiveSubTab("apply")}
            className={`flex items-center space-x-2.5 px-4 py-3 rounded-xl text-xs font-semibold tracking-wider font-display transition-all whitespace-nowrap shrink-0 active:scale-[0.98] ${
              activeSubTab === "apply"
                ? "bg-stone-950 text-white shadow-md shadow-stone-900/10"
                : "text-stone-600 hover:bg-stone-100/85 bg-stone-100/40 lg:bg-transparent"
            }`}
          >
            <UserCheck size={14} />
            <span>신임 에디터 지원하기</span>
          </button>
        </div>
      </div>

      {/* Right Main Panel */}
      <div className="lg:col-span-9 bg-white border border-stone-100 rounded-3xl p-6 md:p-8 min-h-[500px]">
        {activeSubTab === "write" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
              <div>
                <h2 className="text-xl md:text-2xl font-serif font-black text-stone-900 mb-1">
                  새 트렌드 기사 발행하기
                </h2>
                <p className="text-stone-500 text-xs">
                  발행된 기사는 즉시 메인 저널 페이지에 등록되어, 수많은 관광 독자와 광고주들에게 공유됩니다.
                </p>
              </div>

              {/* Draft auto-saved indicator */}
              {draftSavedTime && (
                <div className="flex items-center space-x-2 bg-stone-50 border border-stone-200 px-3 py-1.5 rounded-xl text-[10px] text-stone-600 font-sans shadow-sm shrink-0 self-start sm:self-center">
                  <span className="inline-block w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  <span>임시저장 완료: {draftSavedTime}</span>
                  <button
                    type="button"
                    onClick={clearDraft}
                    className="text-stone-400 hover:text-stone-900 border-l border-stone-200 pl-2 font-bold hover:underline ml-1"
                  >
                    새로 쓰기
                  </button>
                </div>
              )}
            </div>

            <form onSubmit={handlePublishSubmit} className="space-y-5 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-stone-500 tracking-wider">에디터 필명</label>
                  <input
                    type="text"
                    required
                    placeholder="예: 홍길동 에디터"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    className="w-full bg-stone-50/50 border border-stone-100 rounded-xl px-4 py-3 text-xs focus:bg-white focus:ring-1 focus:ring-stone-950 focus:outline-none transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-stone-500 tracking-wider">기사 카테고리</label>
                  <select
                    value={category}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className="w-full bg-stone-50/50 border border-stone-100 rounded-xl px-4 py-3 text-xs focus:bg-white focus:ring-1 focus:ring-stone-950 focus:outline-none transition-all"
                  >
                    <option value="Cafe">카페 & 가스트로노미</option>
                    <option value="Stay">로컬 스테이</option>
                    <option value="Culture">문화 & 예술</option>
                    <option value="Activity">액티비티 & 트렌드</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-bold text-stone-500 tracking-wider">기사 제목 (헤드라인)</label>
                  <span className="text-[10px] text-stone-400 font-mono">{title.length} / 60자</span>
                </div>
                <input
                  type="text"
                  required
                  maxLength={100}
                  placeholder="예: 숲길 사이로 바람이 스치는 평대리 돌담 스테이 온하루"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-stone-50/50 border border-stone-100 rounded-xl px-4 py-3 text-xs focus:bg-white focus:ring-1 focus:ring-stone-950 focus:outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-stone-500 tracking-wider flex justify-between">
                  <span>기사 대표 이미지 URL (Unsplash 등)</span>
                  <button
                    type="button"
                    onClick={openImageGenerator}
                    className="text-amber-600 hover:text-amber-700 font-semibold flex items-center space-x-1"
                  >
                    <Sparkles size={11} />
                    <span>AI 시안 생성기에서 이미지 만들기</span>
                  </button>
                </label>
                <div className="flex space-x-2">
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/photo-..."
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="flex-grow bg-stone-50/50 border border-stone-100 rounded-xl px-4 py-3 text-xs focus:bg-white focus:ring-1 focus:ring-stone-950 focus:outline-none transition-all"
                  />
                  {imageUrl && (
                    <div className="w-11 h-11 bg-stone-100 rounded-xl overflow-hidden border border-stone-200 shrink-0">
                      <img src={imageUrl} alt="preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[11px] font-bold text-stone-500 tracking-wider">간략한 요약 (Excerpt)</label>
                    <span className="text-[10px] text-stone-400 font-mono">{excerpt.length} / 120자</span>
                  </div>
                  <input
                    type="text"
                    maxLength={150}
                    placeholder="기사 목록에 노출될 짧은 소개글"
                    value={excerpt}
                    onChange={(e) => setExcerpt(e.target.value)}
                    className="w-full bg-stone-50/50 border border-stone-100 rounded-xl px-4 py-3 text-xs focus:bg-white focus:ring-1 focus:ring-stone-950 focus:outline-none transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-stone-500 tracking-wider">예상 독서 시간</label>
                  <input
                    type="text"
                    value={readTime}
                    onChange={(e) => setReadTime(e.target.value)}
                    placeholder="예: 4분"
                    className="w-full bg-stone-50/50 border border-stone-100 rounded-xl px-4 py-3 text-xs focus:bg-white focus:ring-1 focus:ring-stone-950 focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-bold text-stone-500 tracking-wider">본문 내용 (Paragraphs)</label>
                  <span className="text-[10px] text-stone-400 font-mono">{content.length} / 5000자</span>
                </div>
                <textarea
                  required
                  rows={8}
                  placeholder="제주의 감성이 가득 담긴 기사 내용을 적어주세요. (줄바꿈 가능)"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full bg-stone-50/50 border border-stone-100 rounded-xl p-4 text-xs focus:bg-white focus:ring-1 focus:ring-stone-950 focus:outline-none transition-all leading-relaxed"
                />

                {/* AI Proofreader Box */}
                <div className="mt-3 bg-amber-50/40 rounded-2xl p-4 border border-amber-100/60 space-y-3">
                  <div className="flex justify-between items-center flex-wrap gap-2">
                    <div className="flex items-center space-x-2">
                      <Sparkles size={13} className="text-amber-600" />
                      <span className="text-xs font-bold text-stone-800">디지털 헤드데스크 AI 맞춤 교정 & 퇴고 조언</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleAiProofread}
                      disabled={isProofreading || !content.trim()}
                      className="text-[11px] font-bold bg-amber-600 text-white hover:bg-amber-700 disabled:bg-stone-100 disabled:text-stone-400 px-3.5 py-2 rounded-xl shadow-sm transition-all flex items-center space-x-1"
                    >
                      {isProofreading ? (
                        <>
                          <RefreshCw size={11} className="animate-spin" />
                          <span>AI 교열 요청중...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles size={11} />
                          <span>AI 퇴고 & 키워드 분석 받기</span>
                        </>
                      )}
                    </button>
                  </div>

                  {proofreadResult && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white p-3.5 rounded-xl border border-amber-100 space-y-3 text-left shadow-sm"
                    >
                      <div className="text-[10px] text-amber-800 font-bold bg-amber-50 px-2.5 py-1 rounded inline-block">
                        ★ AI 교정 및 키워드 조언 제안
                      </div>
                      
                      {proofreadResult.titleSuggested && (
                        <div className="space-y-1">
                          <span className="text-[10px] text-stone-400 block font-bold">권장 헤드라인 시안:</span>
                          <p className="text-xs font-bold text-stone-900 bg-stone-50 p-2 rounded border border-stone-100">
                            {proofreadResult.titleSuggested}
                          </p>
                        </div>
                      )}

                      {proofreadResult.feedback && (
                        <div className="space-y-1">
                          <span className="text-[10px] text-stone-400 block font-bold">감성 표현 및 가독성 개선 피드백:</span>
                          <p className="text-xs text-stone-600 leading-relaxed bg-stone-50 p-2.5 rounded border border-stone-100 whitespace-pre-line">
                            {proofreadResult.feedback}
                          </p>
                        </div>
                      )}

                      {proofreadResult.tagsSuggested && proofreadResult.tagsSuggested.length > 0 && (
                        <div className="space-y-1">
                          <span className="text-[10px] text-stone-400 block font-bold">추천 타깃 해시태그:</span>
                          <div className="flex flex-wrap gap-1">
                            {proofreadResult.tagsSuggested.map((t, idx) => (
                              <span key={idx} className="bg-stone-100 text-stone-600 text-[10px] px-2 py-0.5 rounded-md font-mono">
                                #{t}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center space-x-2 pt-1">
                        <button
                          type="button"
                          onClick={applyProofreadResult}
                          className="text-[11px] bg-stone-950 text-white font-bold px-3 py-2 rounded-xl hover:bg-stone-800 transition-all shadow"
                        >
                          제안안 본문에 적용하기 (Apply)
                        </button>
                        <button
                          type="button"
                          onClick={() => setProofreadResult(null)}
                          className="text-[11px] text-stone-500 border border-stone-200 px-3 py-2 rounded-xl hover:bg-stone-50 transition-all bg-white"
                        >
                          닫기
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>

              {publishStatus === "success" && (
                <div className="flex items-center space-x-2 bg-emerald-50 text-emerald-600 p-4 rounded-xl text-xs">
                  <CheckCircle2 size={16} />
                  <span>{publishMessage}</span>
                </div>
              )}

              {publishStatus === "error" && (
                <div className="flex items-center space-x-2 bg-rose-50 text-rose-600 p-4 rounded-xl text-xs">
                  <AlertCircle size={16} />
                  <span>{publishMessage}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-stone-950 hover:bg-stone-800 text-white font-semibold font-display text-xs tracking-wider py-4 rounded-xl transition-colors shadow-lg"
              >
                PUBLISH TO MAGAZINE
              </button>
            </form>
          </div>
        )}

        {activeSubTab === "chat" && (
          <div className="flex flex-col h-[550px] justify-between">
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-4">
                <div>
                  <h2 className="text-xl md:text-2xl font-serif font-bold text-stone-900 flex items-center gap-2">
                    <span>데스크 AI 보좌관</span>
                    <Sparkles size={16} className="text-amber-500" />
                  </h2>
                  <p className="text-stone-500 text-xs">
                    기사 헤드라인 정제, SEO 최적화 조언, 해외 관광객 전용 다국어 통역을 책임지는 인텔리전트 보좌 시스템입니다.
                  </p>
                </div>

                {/* Role Switcher */}
                <div className="bg-stone-50 p-1.5 rounded-xl border border-stone-100 flex">
                  <button
                    onClick={() => handleRoleChange("seo-editor")}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${
                      chatRole === "seo-editor"
                        ? "bg-stone-950 text-white"
                        : "text-stone-500 hover:text-stone-900"
                    }`}
                  >
                    수석 편집장 (Pro)
                  </button>
                  <button
                    onClick={() => handleRoleChange("translator")}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${
                      chatRole === "translator"
                        ? "bg-stone-950 text-white"
                        : "text-stone-500 hover:text-stone-900"
                    }`}
                  >
                    관광 통역 가이드 (Lite)
                  </button>
                </div>
              </div>
            </div>

            {/* Chat Thread */}
            <div className="flex-grow my-4 overflow-y-auto pr-2 space-y-4 border border-stone-50 bg-stone-50/20 rounded-2xl p-4 min-h-[300px]">
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl p-4 text-xs leading-relaxed ${
                      msg.role === "user"
                        ? "bg-stone-950 text-white rounded-br-none"
                        : "bg-white text-stone-800 border border-stone-100 rounded-bl-none shadow-sm"
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
                    <Sparkles className="animate-spin text-amber-500" size={12} />
                    <span>AI 보좌관이 글을 교열하는 중...</span>
                  </div>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Quick Templates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
              <button
                type="button"
                onClick={() => setChatInput("이 기사 제목을 20대 여성층이 좋아할 만한 감성 헤드라인 3가지로 정제해줘: ")}
                className="text-[10px] text-left border border-stone-100 hover:bg-stone-50 p-2 rounded-xl text-stone-600 transition-colors truncate"
              >
                💡 감성적인 타깃 헤드라인 추천받기
              </button>
              <button
                type="button"
                onClick={() => setChatInput("외국인 관광객을 위한 다국어 광고 안내문(영어, 일본어)으로 자연스럽게 번역해줘: ")}
                className="text-[10px] text-left border border-stone-100 hover:bg-stone-50 p-2 rounded-xl text-stone-600 transition-colors truncate"
              >
                🌐 영/일 어색하지 않은 비즈니스 번역하기
              </button>
            </div>

            {/* Input Bar */}
            <form onSubmit={handleChatSend} className="flex space-x-2">
              <input
                type="text"
                placeholder={
                  chatRole === "seo-editor"
                    ? "문장의 뼈대를 기입하시면 세련된 디지털 헤드라인과 SEO 키워드로 완성해 드립니다."
                    : "번역 또는 외국어 표현 교정이 필요한 문장을 기입해 주세요."
                }
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
        )}

        {activeSubTab === "apply" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl md:text-2xl font-serif font-bold text-stone-900 mb-2">
                신임 에디터 및 기자 등록 신청
              </h2>
              <p className="text-stone-500 text-xs">
                매월 수십만 명의 트렌드 관광객이 방문하는 제주매거진 필진으로 합류하여, 로컬 브랜딩을 시작해 보세요.
              </p>
            </div>

            {applyStatus === "success" ? (
              <div className="bg-emerald-50 text-emerald-700 p-8 rounded-2xl text-center space-y-3 border border-emerald-100">
                <CheckCircle2 size={40} className="mx-auto text-emerald-500 animate-bounce" />
                <h3 className="font-serif font-bold text-lg">에디터 지원 신청 완료!</h3>
                <p className="text-xs max-w-md mx-auto leading-relaxed text-stone-600">
                  작성하신 포트폴리오와 전문 카테고리를 데스크 위원회가 검토하여 1-2일 이내로 합류 승인 메일을 발송해 드립니다.
                </p>
              </div>
            ) : (
              <form onSubmit={handleApplySubmit} className="space-y-5 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-stone-500 tracking-wider">지원자 성명</label>
                    <input
                      type="text"
                      required
                      placeholder="본명 입력"
                      value={editorName}
                      onChange={(e) => setEditorName(e.target.value)}
                      className="w-full bg-stone-50/50 border border-stone-100 rounded-xl px-4 py-3 text-xs focus:bg-white focus:ring-1 focus:ring-stone-950 focus:outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-stone-500 tracking-wider">이메일 주소</label>
                    <input
                      type="email"
                      required
                      placeholder="info@example.com"
                      value={editorEmail}
                      onChange={(e) => setEditorEmail(e.target.value)}
                      className="w-full bg-stone-50/50 border border-stone-100 rounded-xl px-4 py-3 text-xs focus:bg-white focus:ring-1 focus:ring-stone-950 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-stone-500 tracking-wider">전문 기재 카테고리</label>
                  <select
                    value={editorSpecialty}
                    onChange={(e) => setEditorSpecialty(e.target.value)}
                    className="w-full bg-stone-50/50 border border-stone-100 rounded-xl px-4 py-3 text-xs focus:bg-white focus:ring-1 focus:ring-stone-950 focus:outline-none transition-all"
                  >
                    <option value="Gastronomy">미식 & 카페 가스트로노미</option>
                    <option value="Stay">로컬 재생 한옥 & 하이엔드 숙소</option>
                    <option value="Nature">자연주의 탐방 & 친환경 액티비티</option>
                    <option value="Arts">로컬 독립 서점 & 아티스트 투어</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-stone-500 tracking-wider">자기 소개 및 포트폴리오 이력</label>
                  <textarea
                    required
                    rows={6}
                    placeholder="제주 관광 발전에 기여하고자 하는 열정이나 과거 취재 경력, 브런치 채널 링크 등을 간략하게 기입해 주세요."
                    value={editorBio}
                    onChange={(e) => setEditorBio(e.target.value)}
                    className="w-full bg-stone-50/50 border border-stone-100 rounded-xl p-4 text-xs focus:bg-white focus:ring-1 focus:ring-stone-950 focus:outline-none transition-all leading-relaxed"
                  />
                </div>

                {applyStatus === "error" && (
                  <div className="flex items-center space-x-2 bg-rose-50 text-rose-600 p-4 rounded-xl text-xs">
                    <AlertCircle size={16} />
                    <span>필수 항목들을 바르게 채워주세요.</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full bg-stone-950 hover:bg-stone-800 text-white font-semibold font-display text-xs tracking-wider py-4 rounded-xl transition-colors shadow-lg"
                >
                  SUBMIT APPLICATION
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
