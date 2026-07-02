import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Article, Comment, Place, User } from "../types";
import { Play, Pause, Volume2, Sparkles, Clock, Heart, Share2, BookOpen, ChevronRight, X, AlertCircle, Search, Hash, MapPin, Languages, MessageCircle, Send, SendHorizontal, AlertTriangle, Loader2, Sparkle } from "lucide-react";

// Safe date formatter helper for robust Firebase & Client-side data integration
const formatDate = (dateVal: any): string => {
  if (!dateVal) return "방금 전";
  try {
    // If it is a Firestore Timestamp object with seconds
    if (typeof dateVal === "object") {
      const seconds = dateVal.seconds ?? dateVal._seconds;
      if (typeof seconds === "number") {
        return new Date(seconds * 1000).toLocaleDateString("ko-KR");
      }
    }
    const parsed = new Date(dateVal);
    if (isNaN(parsed.getTime())) {
      return "방금 전";
    }
    return parsed.toLocaleDateString("ko-KR");
  } catch (e) {
    return "방금 전";
  }
};

const formatTime = (dateVal: any): string => {
  if (!dateVal) return "방금 전";
  try {
    if (typeof dateVal === "object") {
      const seconds = dateVal.seconds ?? dateVal._seconds;
      if (typeof seconds === "number") {
        return new Date(seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
    }
    const parsed = new Date(dateVal);
    if (isNaN(parsed.getTime())) {
      return "방금 전";
    }
    return parsed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    return "방금 전";
  }
};

interface JournalSectionProps {
  articles: Article[];
  onLikeArticle: (id: string) => Promise<void>;
  onKakaoShare: (art: Article) => void;
  user: User;
  refreshArticles: () => Promise<void>;
}

export default function JournalSection({ articles, onLikeArticle, onKakaoShare, user, refreshArticles }: JournalSectionProps) {
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const [scrollPercent, setScrollPercent] = useState(0);

  const handleModalScroll = () => {
    if (modalRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = modalRef.current;
      const total = scrollHeight - clientHeight;
      if (total > 0) {
        setScrollPercent((scrollTop / total) * 100);
      }
    }
  };

  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);

  // Translation states
  const [translateLang, setTranslateLang] = useState<string | null>(null); // null, 'en', 'ja', 'zh'
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedTitle, setTranslatedTitle] = useState<string | null>(null);
  const [translatedContent, setTranslatedContent] = useState<string | null>(null);

  // Comments state inside modal
  const [commentsList, setCommentsList] = useState<Comment[]>([]);
  const [newCommentAuthor, setNewCommentAuthor] = useState("");
  const [newCommentText, setNewCommentText] = useState("");
  const [isCommentSubmitting, setIsCommentSubmitting] = useState(false);

  // TTS states
  const [isTtsLoading, setIsTtsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeAudio, setActiveAudio] = useState<HTMLAudioElement | null>(null);
  const [ttsVoice, setTtsVoice] = useState<string>("Kore"); // Kore, Zephyr, Fenrir, Puck
  const [ttsError, setTtsError] = useState<string | null>(null);

  const categories = [
    { key: "All", name: "전체 아카이브" },
    { key: "Cafe", name: "카페 & 푸드" },
    { key: "Stay", name: "로컬 스테이" },
    { key: "Culture", name: "문화 & 사색" },
    { key: "Activity", name: "액티비티" }
  ];

  // Synchronize local name if user is logged in
  useEffect(() => {
    if (user.isLoggedIn) {
      setNewCommentAuthor(user.nickname);
    } else {
      setNewCommentAuthor("");
    }
  }, [user]);

  // Synchronize comments inside open modal if articles updates globally
  useEffect(() => {
    if (selectedArticle) {
      const freshArt = articles.find(a => a.id === selectedArticle.id);
      if (freshArt && freshArt.comments) {
        setCommentsList(freshArt.comments);
      }
    }
  }, [articles, selectedArticle]);

  // Filtering Logic
  const filteredArticles = articles.filter(art => {
    // 1. Category Filter
    const matchCategory = selectedCategory === "All" || art.category === selectedCategory;
    
    // 2. Hash Tag Filter
    const matchTag = !activeTag || (art.tags && art.tags.includes(activeTag));
    
    // 3. Search Query Filter
    const q = searchQuery.toLowerCase().trim();
    const matchSearch = !q || 
      art.title.toLowerCase().includes(q) ||
      art.excerpt.toLowerCase().includes(q) ||
      art.content.toLowerCase().includes(q) ||
      art.author.toLowerCase().includes(q) ||
      (art.tags && art.tags.some(t => t.toLowerCase().includes(q)));

    return matchCategory && matchTag && matchSearch;
  });

  const featuredArticle = articles[0];
  const regularArticles = filteredArticles; // Show all matching search filter

  const handleOpenArticle = (article: Article) => {
    setSelectedArticle(article);
    setCommentsList(article.comments || []);
    setTranslateLang(null);
    setTranslatedTitle(null);
    setTranslatedContent(null);
    setTtsError(null);
    setScrollPercent(0);
    stopAudio();
  };

  const handleCloseArticle = () => {
    setSelectedArticle(null);
    stopAudio();
  };

  const stopAudio = () => {
    if (activeAudio) {
      activeAudio.pause();
      setActiveAudio(null);
    }
    setIsPlaying(false);
  };

  // TTS execution
  const handlePlayTTS = async (textToSpeak: string) => {
    if (isPlaying && activeAudio) {
      activeAudio.pause();
      setIsPlaying(false);
      return;
    }

    if (activeAudio) {
      activeAudio.play();
      setIsPlaying(true);
      return;
    }

    setIsTtsLoading(true);
    setTtsError(null);

    try {
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: textToSpeak,
          voice: ttsVoice
        })
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || "TTS 생성 실패");
      }

      const audioUrl = `data:audio/mp3;base64,${data.audio}`;
      const audio = new Audio(audioUrl);
      
      audio.onended = () => {
        setIsPlaying(false);
        setActiveAudio(null);
      };

      audio.onerror = () => {
        setTtsError("오디오 재생 중 오류가 발생했습니다.");
        setIsPlaying(false);
        setActiveAudio(null);
      };

      setActiveAudio(audio);
      audio.play();
      setIsPlaying(true);
    } catch (err: any) {
      console.error(err);
      setTtsError("AI 오디오 낭독 보이스 가동 중 일시적 오류가 발생했습니다.");
    } finally {
      setIsTtsLoading(false);
    }
  };

  // Article translation on the fly (Gemini powered)
  const handleTranslateArticle = async (target: string) => {
    if (!selectedArticle) return;
    setIsTranslating(true);
    setTranslateLang(target);

    try {
      const response = await fetch("/api/articles/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: selectedArticle.title,
          content: selectedArticle.content,
          targetLanguage: target
        })
      });

      const data = await response.json();
      if (data.success) {
        setTranslatedTitle(data.translatedTitle);
        setTranslatedContent(data.translatedContent);
      } else {
        throw new Error("번역 실패");
      }
    } catch (err) {
      console.error(err);
      alert("AI 고속 번역 가동 중 오류가 발생했습니다. 잠시 후 다시 조율해 주세요.");
      setTranslateLang(null);
    } finally {
      setIsTranslating(false);
    }
  };

  // Submit dynamic comments with AI user response simulation
  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedArticle) return;
    if (!newCommentAuthor.trim() || !newCommentText.trim()) {
      alert("닉네임과 본문 내용을 바르게 작성해 주세요.");
      return;
    }

    setIsCommentSubmitting(true);

    try {
      const response = await fetch(`/api/articles/${selectedArticle.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          author: newCommentAuthor,
          text: newCommentText
        })
      });

      const data = await response.json();
      if (data.success) {
        setCommentsList(data.comments);
        setNewCommentText("");
        await refreshArticles(); // Sync main articles DB
      } else {
        alert("댓글 작성에 실패했습니다.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsCommentSubmitting(false);
    }
  };

  return (
    <div className="space-y-12">
      
      {/* 1. Brand Premium Search Bar & Hashtags */}
      <div className="bg-white border border-stone-100 p-6 rounded-3xl shadow-sm space-y-4">
        <div className="relative">
          <Search size={16} className="absolute left-4.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="제목, 에디터 명칭, 해시태그(#), 혹은 제주 여행 꿀팁 키워드를 실시간 검색하세요."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setActiveTag(null); // Clear hashtag filtering if typing search
            }}
            className="w-full bg-stone-50 border border-stone-100 rounded-2xl pl-11 pr-5 py-4 text-xs font-semibold focus:bg-white focus:ring-1 focus:ring-stone-950 focus:outline-none transition-all placeholder:text-stone-400"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-900 text-xs font-mono"
            >
              [지우기]
            </button>
          )}
        </div>

        {/* Hot Hashtags recommended tag navigation bar */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-stone-600">
          <span className="text-[10px] font-bold text-stone-400 font-mono uppercase tracking-wider flex items-center gap-1">
            <Hash size={11} />
            <span>추천 로컬 태그 :</span>
          </span>
          <button
            onClick={() => { setActiveTag(null); setSearchQuery(""); }}
            className={`px-3 py-1 rounded-full text-[10.5px] font-bold transition-all ${
              !activeTag && !searchQuery
                ? "bg-amber-500/15 text-amber-700 border border-amber-500/20"
                : "bg-stone-50 text-stone-500 border border-transparent hover:bg-stone-100"
            }`}
          >
            #전체보기
          </button>
          {["구좌읍", "평대리", "차귀도", "친환경스테이", "독립서점", "투명카약", "감성카페", "업사이클링"].map((tag) => (
            <button
              key={tag}
              onClick={() => {
                setActiveTag(tag);
                setSearchQuery(""); // Override general text search for exact tag match
              }}
              className={`px-3 py-1 rounded-full text-[10.5px] font-bold transition-all border ${
                activeTag === tag
                  ? "bg-stone-950 text-white border-stone-950 shadow-sm"
                  : "bg-stone-50 text-stone-500 border-stone-200/40 hover:bg-stone-100 hover:text-stone-700"
              }`}
            >
              #{tag}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Featured Big Header Card */}
      {selectedCategory === "All" && !searchQuery && !activeTag && featuredArticle && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl bg-stone-900 text-stone-100"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
            <div className="lg:col-span-7 h-[280px] lg:h-[480px] relative overflow-hidden">
              <img
                src={featuredArticle.imageUrl}
                alt={featuredArticle.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover filter brightness-90 hover:scale-103 transition-transform duration-700 ease-out"
              />
              <span className="absolute top-6 left-6 bg-amber-500 text-stone-950 text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-wider font-mono shadow-lg">
                ★ 오늘의 저널 추천작
              </span>
            </div>
            
            <div className="lg:col-span-5 p-8 lg:p-12 flex flex-col justify-between space-y-8 bg-gradient-to-br from-stone-900 via-stone-950 to-stone-900 border-l border-stone-800">
              <div className="space-y-6">
                <div className="flex items-center space-x-3 text-xs text-amber-400 font-bold">
                  <span>{featuredArticle.categoryKo}</span>
                  <span className="opacity-30">•</span>
                  <span>{featuredArticle.readTime} 읽기</span>
                </div>
                <h2 className="text-xl lg:text-2xl font-serif font-bold leading-snug tracking-tight text-white">
                  {featuredArticle.title}
                </h2>
                <p className="text-stone-400 text-xs lg:text-sm leading-relaxed line-clamp-4">
                  {featuredArticle.excerpt}
                </p>
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-stone-800">
                <div className="text-xs">
                  <p className="font-semibold text-stone-200">{featuredArticle.author}</p>
                  <p className="text-stone-500 font-mono">
                    {formatDate(featuredArticle.createdAt)}
                  </p>
                </div>
                <button
                  onClick={() => handleOpenArticle(featuredArticle)}
                  className="flex items-center space-x-1.5 bg-white text-stone-950 hover:bg-stone-200 px-5 py-3 rounded-full text-xs font-bold tracking-wider transition-colors"
                >
                  <span>아티클 정독하기</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* 3. Categories Bar & Grid Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-stone-200/50 pb-6">
        <div className="space-y-1">
          <h3 className="text-xs tracking-[0.2em] text-stone-400 font-bold uppercase">
            EXPLORE COZY STORIES
          </h3>
          <h2 className="text-2xl font-serif font-black text-stone-900">
            {activeTag ? `#${activeTag} 태그 검색 결과` : searchQuery ? `"${searchQuery}" 검색 결과` : "제주의 깊은 서사를 간행하다"}
          </h2>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => {
                setSelectedCategory(cat.key);
                setActiveTag(null); // Clear tag filter on main category switch
              }}
              className={`px-4 py-2.5 rounded-full text-xs font-bold transition-all border ${
                selectedCategory === cat.key
                  ? "bg-stone-950 text-white border-stone-950 shadow-sm"
                  : "bg-stone-50 text-stone-600 border-transparent hover:bg-stone-100"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Article Grid */}
      {filteredArticles.length === 0 ? (
        <div className="text-center py-24 bg-stone-50 rounded-3xl border border-dashed border-stone-200 space-y-3">
          <AlertCircle size={24} className="mx-auto text-stone-400 animate-bounce" />
          <p className="text-stone-500 text-xs font-serif">요청하신 키워드나 분류에 맞는 새로운 제주 저널 아티클을 준비하고 있습니다.</p>
          <button 
            onClick={() => { setSearchQuery(""); setSelectedCategory("All"); setActiveTag(null); }}
            className="text-xs text-amber-600 font-bold hover:underline"
          >
            전체 매거진 리셋해서 다시 보기
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {regularArticles.map((article, idx) => (
            <motion.article
              key={article.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              className="group cursor-pointer bg-white rounded-2xl overflow-hidden border border-stone-100 hover:border-stone-200 hover:shadow-xl hover:shadow-stone-200/40 transition-all duration-300 flex flex-col h-full"
              onClick={() => handleOpenArticle(article)}
            >
              {/* Cover cover */}
              <div className="aspect-[4/3] relative overflow-hidden bg-stone-100">
                <img
                  src={article.imageUrl}
                  alt={article.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-104 transition-transform duration-500 ease-out"
                />
                <span className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm text-stone-950 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                  {article.categoryKo}
                </span>
              </div>

              {/* Text detail */}
              <div className="p-6 flex flex-col justify-between flex-grow space-y-4">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-[11px] text-stone-400 font-mono">
                    <span className="font-bold text-stone-700">{article.author}</span>
                    <span>{article.readTime}</span>
                  </div>
                  <h3 className="font-serif font-extrabold text-base text-stone-900 group-hover:text-stone-600 transition-colors line-clamp-2 leading-snug">
                    {article.title}
                  </h3>
                  <p className="text-stone-500 text-[11.5px] leading-relaxed line-clamp-3">
                    {article.excerpt}
                  </p>
                </div>

                <div className="space-y-3 pt-3 border-t border-stone-50">
                  {/* Article Hash tags rendering inside cards */}
                  {article.tags && article.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {article.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="text-[10px] text-stone-400 bg-stone-50 px-2 py-0.5 rounded font-medium">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[11px] text-stone-400 font-mono pt-1">
                    <span>{formatDate(article.createdAt)}</span>
                    <div className="flex items-center space-x-3 text-stone-500 font-bold">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onLikeArticle(article.id);
                        }}
                        className="flex items-center space-x-1 hover:text-rose-500 transition-colors"
                      >
                        <Heart size={12} className="fill-rose-50 text-rose-400" />
                        <span>{article.likes}</span>
                      </button>
                      <span>•</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onKakaoShare(article);
                        }}
                        className="hover:text-amber-600 transition-colors flex items-center space-x-1"
                      >
                        <Share2 size={12} />
                        <span>공유</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      )}

      {/* 5. Rich Editorial Reading Overlay Modal */}
      <AnimatePresence>
        {selectedArticle && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/70 backdrop-blur-md flex items-center justify-center p-3 lg:p-10"
          >
            <motion.div
              ref={modalRef}
              onScroll={handleModalScroll}
              initial={{ scale: 0.96, y: 25 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.96, y: 25 }}
              className="bg-white rounded-3xl w-full max-w-4xl max-h-[92vh] overflow-y-auto shadow-2xl relative scrollbar-none"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Luxury Sticky Scroll Progress Bar */}
              <div className="sticky top-0 left-0 right-0 h-1.5 bg-stone-100 z-30">
                <div 
                  className="h-full bg-gradient-to-r from-amber-500 to-amber-600 transition-all duration-75" 
                  style={{ width: `${scrollPercent}%` }}
                />
              </div>

              {/* Floating Close Button */}
              <button
                onClick={handleCloseArticle}
                className="absolute top-6 right-6 z-10 bg-stone-900 text-white hover:bg-stone-700 p-2.5 rounded-full shadow-lg transition-colors"
              >
                <X size={16} />
              </button>

              {/* Giant Hero Image Cover with fade gradient */}
              <div className="h-[240px] md:h-[380px] w-full relative bg-stone-100">
                <img
                  src={selectedArticle.imageUrl}
                  alt={selectedArticle.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-stone-900/35 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6 text-white space-y-2">
                  <span className="bg-amber-500 text-stone-950 text-[10px] font-black px-3 py-1 rounded-full tracking-wider font-mono">
                    {selectedArticle.categoryKo}
                  </span>
                  <h2 className="text-lg md:text-2xl lg:text-3xl font-serif font-black tracking-tight leading-snug">
                    {translatedTitle || selectedArticle.title}
                  </h2>
                </div>
              </div>

              {/* Main reading content body */}
              <div className="p-5 md:p-10 space-y-8">
                
                {/* A. Multilingual Real-Time Translator Tooling (Bespoke premium design) */}
                <div className="bg-stone-950 text-stone-100 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-stone-800 shadow-inner">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-amber-400 flex items-center gap-1">
                      <Languages size={13} className="animate-pulse" />
                      <span>Gemini 원클릭 다국어 기사 번역기 (AI Realtime Translate)</span>
                    </p>
                    <p className="text-[10px] text-stone-400 leading-relaxed">
                      국내외 글로벌 관광객들을 위해 터치 한 번으로 타이틀과 본문 전체를 완벽한 문맥으로 번역합니다.
                    </p>
                  </div>

                  <div className="flex gap-1.5 shrink-0">
                    <button
                      onClick={() => { setTranslateLang(null); setTranslatedTitle(null); setTranslatedContent(null); }}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border ${
                        !translateLang 
                          ? "bg-white text-stone-950 border-white" 
                          : "bg-transparent text-stone-400 border-stone-800 hover:text-white"
                      }`}
                    >
                      한국어 원문
                    </button>
                    <button
                      onClick={() => handleTranslateArticle("en")}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border ${
                        translateLang === "en" 
                          ? "bg-white text-stone-950 border-white" 
                          : "bg-transparent text-stone-400 border-stone-800 hover:text-white"
                      }`}
                    >
                      English (영어)
                    </button>
                    <button
                      onClick={() => handleTranslateArticle("ja")}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border ${
                        translateLang === "ja" 
                          ? "bg-white text-stone-950 border-white" 
                          : "bg-transparent text-stone-400 border-stone-800 hover:text-white"
                      }`}
                    >
                      日本語 (일본어)
                    </button>
                  </div>
                </div>

                {/* B. Metadata & Audio Player Panel */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-stone-50 p-5 rounded-2xl border border-stone-100">
                  <div className="flex items-center space-x-3.5">
                    <div className="w-10 h-10 rounded-full bg-stone-950 text-white flex items-center justify-center font-bold font-serif text-sm border border-stone-800">
                      {selectedArticle.author[0]}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-stone-800">{selectedArticle.author} 에디터</h4>
                      <div className="flex items-center space-x-2 text-xs text-stone-400 font-mono mt-0.5">
                        <span>{formatDate(selectedArticle.createdAt)}</span>
                        <span>•</span>
                        <span>{selectedArticle.readTime} 읽기</span>
                      </div>
                    </div>
                  </div>

                  {/* Audio Player and voice select */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-1.5 text-xs text-stone-500">
                        <Volume2 size={14} className="text-amber-500" />
                        <span className="font-bold">AI 감성 오디오 낭독 바</span>
                      </div>
                      <select
                        value={ttsVoice}
                        onChange={(e) => {
                          setTtsVoice(e.target.value);
                          stopAudio();
                        }}
                        disabled={isTtsLoading}
                        className="bg-white border border-stone-200 rounded-lg text-[10.5px] font-semibold px-2 py-1 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      >
                        <option value="Kore">지혜 (편안한 한국어 여성)</option>
                        <option value="Zephyr">시우 (중저음 한국어 남성)</option>
                        <option value="Puck">푸크 (밝고 경쾌한 리포터)</option>
                        <option value="Fenrir">펜리르 (진중한 다큐멘터리 성우)</option>
                      </select>
                    </div>

                    <button
                      onClick={() => handlePlayTTS(translatedContent || selectedArticle.content)}
                      disabled={isTtsLoading}
                      className={`w-full flex items-center justify-center space-x-2 rounded-xl text-xs font-bold py-2.5 px-4 transition-all ${
                        isPlaying
                          ? "bg-stone-950 text-white hover:bg-stone-800"
                          : isTtsLoading
                          ? "bg-stone-100 text-stone-400 cursor-wait"
                          : "bg-amber-500 text-stone-950 hover:bg-amber-600 shadow-md"
                      }`}
                    >
                      {isTtsLoading ? (
                        <>
                          <Loader2 size={13} className="animate-spin text-stone-700" />
                          <span>AI 명품 보이스 오디오 굽는 중...</span>
                        </>
                      ) : isPlaying ? (
                        <>
                          <Pause size={13} />
                          <span>본문 낭독 정지하기</span>
                        </>
                      ) : (
                        <>
                          <Play size={13} />
                          <span>기사 본문 귀로 듣기</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {ttsError && (
                  <div className="flex items-center space-x-2 bg-rose-50 text-rose-600 p-4 rounded-xl text-xs">
                    <AlertCircle size={15} className="shrink-0" />
                    <span>{ttsError}</span>
                  </div>
                )}

                {/* C. Primary Article Content Text */}
                {isTranslating ? (
                  <div className="py-16 text-center space-y-3">
                    <Loader2 size={32} className="animate-spin mx-auto text-stone-400" />
                    <p className="text-stone-500 text-xs font-serif font-bold">
                      Gemini 가 고급 지면 번역 체계를 가동하여 고해상도 외국어로 정제하는 중입니다...
                    </p>
                  </div>
                ) : (
                  <div className="prose prose-stone max-w-none text-stone-700 leading-relaxed text-[13.5px] md:text-base space-y-6">
                    {(translatedContent || selectedArticle.content).split("\n").map((para, i) => (
                      <p key={i} className="font-sans leading-relaxed text-justify">
                        {para}
                      </p>
                    ))}
                  </div>
                )}

                {/* D. Recommended Local Place Guide Card (Bespoke visual point) */}
                {selectedArticle.places && selectedArticle.places.length > 0 && (
                  <div className="bg-amber-500/5 border border-amber-500/15 p-5 md:p-6 rounded-2xl space-y-3.5">
                    <div className="flex items-center space-x-2 text-amber-700">
                      <MapPin size={16} className="text-amber-600 animate-bounce" />
                      <h4 className="font-serif font-extrabold text-sm tracking-wider uppercase">제주매거진 추천 로컬 플레이스 가이드</h4>
                    </div>

                    {selectedArticle.places.map((place, idx) => (
                      <div key={idx} className="space-y-1 bg-white p-4 rounded-xl border border-stone-100 shadow-xs">
                        <p className="font-bold text-xs text-stone-900">{place.name}</p>
                        <p className="text-[11px] text-stone-400 font-mono">{place.address}</p>
                        <p className="text-[11px] text-amber-700 leading-relaxed pt-1.5 border-t border-stone-50 mt-1.5">
                          <span className="font-bold">[에디터 꿀팁] </span>
                          {place.tip}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* E. Action Buttons */}
                <div className="flex items-center justify-between pt-6 border-t border-stone-100">
                  <button
                    onClick={() => onLikeArticle(selectedArticle.id)}
                    className="flex items-center space-x-2 text-stone-600 hover:text-rose-500 transition-colors py-2.5 px-4 rounded-xl hover:bg-rose-50"
                  >
                    <Heart size={15} className="fill-rose-50 text-rose-500" />
                    <span className="text-xs font-bold font-mono">기사 추천하기 ({selectedArticle.likes})</span>
                  </button>

                  <button
                    onClick={() => onKakaoShare(selectedArticle)}
                    className="flex items-center space-x-2 bg-[#fee500] hover:bg-[#fdd000] text-[#191919] font-bold text-xs py-2.5 px-4.5 rounded-xl transition-all shadow-sm"
                  >
                    <Share2 size={13} />
                    <span>카카오톡으로 친구 공유</span>
                  </button>
                </div>

                {/* F. Live Interactive Comments Feed with Simulated AI Response */}
                <div className="border-t border-stone-100 pt-8 space-y-5">
                  <div className="flex items-center justify-between">
                    <h3 className="font-serif font-black text-base text-stone-900 flex items-center gap-1.5">
                      <MessageCircle size={15} className="text-stone-500" />
                      <span>실시간 독자 반응 데크 ({commentsList.length})</span>
                    </h3>
                    <span className="text-[10px] bg-stone-100 text-stone-500 px-2 py-0.5 rounded font-mono font-bold uppercase">
                      AI AUTONOMOUS ENGAGEMENT
                    </span>
                  </div>

                  {/* Comment input form */}
                  <form onSubmit={handleCommentSubmit} className="space-y-3 bg-stone-50/50 p-4 rounded-2xl border border-stone-100">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-stone-400 tracking-wider">독자 필명/닉네임</label>
                        <input
                          type="text"
                          required
                          disabled={user.isLoggedIn}
                          placeholder="댓글 닉네임 입력"
                          value={newCommentAuthor}
                          onChange={(e) => setNewCommentAuthor(e.target.value)}
                          className="w-full bg-white border border-stone-200/60 rounded-xl px-3.5 py-2.5 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-stone-950 transition-all disabled:bg-stone-100 disabled:text-stone-500"
                        />
                      </div>
                      <div className="flex items-end text-[10px] text-stone-400 pb-1.5">
                        <span>💡 댓글을 달면 가상의 제주 매거진 독자 AI 가 2초 안에 반응 대댓글을 자동 작성합니다!</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-stone-400 tracking-wider">댓글 내용</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          required
                          placeholder={user.isLoggedIn ? "제주 감성이 담긴 따뜻한 한 줄 댓글을 남겨주세요." : "로그인 후 댓글을 달아주시면 더 재미있는 대화가 활성화됩니다."}
                          value={newCommentText}
                          onChange={(e) => setNewCommentText(e.target.value)}
                          className="flex-grow bg-white border border-stone-200/60 rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-1 focus:ring-stone-950 transition-all"
                        />
                        <button
                          type="submit"
                          disabled={isCommentSubmitting || !newCommentText.trim() || !newCommentAuthor.trim()}
                          className="bg-stone-950 text-white hover:bg-stone-800 disabled:bg-stone-100 disabled:text-stone-300 p-3 rounded-xl transition-all shadow-sm shrink-0 flex items-center justify-center"
                        >
                          {isCommentSubmitting ? (
                            <Loader2 size={14} className="animate-spin text-stone-400" />
                          ) : (
                            <Send size={14} />
                          )}
                        </button>
                      </div>
                    </div>
                  </form>

                  {/* Comments Thread List with Stagger flow */}
                  <div className="space-y-3">
                    {commentsList.length === 0 ? (
                      <p className="text-center py-6 text-stone-400 text-xs font-serif">이 따뜻한 기사의 첫 번째 평론 독자가 되어 소감을 작성해 보세요.</p>
                    ) : (
                      <div className="flex flex-col gap-2.5">
                        {commentsList.map((com) => {
                          const isAI = com.author.startsWith("🍊");
                          return (
                            <div 
                              key={com.id} 
                              className={`p-4.5 rounded-2xl text-xs leading-relaxed border transition-all ${
                                isAI 
                                  ? "bg-amber-500/5 border-amber-500/10 ml-6" 
                                  : "bg-white border-stone-100"
                              }`}
                            >
                              <div className="flex justify-between items-center mb-1.5">
                                <span className={`font-bold ${isAI ? "text-amber-700" : "text-stone-800"}`}>
                                  {com.author}
                                </span>
                                <span className="text-[9px] text-stone-400 font-mono">
                                  {formatTime(com.createdAt)}
                                </span>
                              </div>
                              <p className="text-stone-600 leading-relaxed font-sans">{com.text}</p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
