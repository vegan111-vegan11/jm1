import React, { useState } from "react";
import { motion } from "motion/react";
import { Article, AdInquiry, EditorApplication } from "../types";
import { ShieldCheck, Check, X, Trash2, Calendar, FileText, UserCheck, BarChart3, PieChart as PieIcon, RefreshCw, AlertCircle, Sparkles, Edit3, Search, Users, Award, Eye, MessageSquare, Percent, Sparkle } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, PieChart, Pie, Legend } from "recharts";

// Safe date and timestamp helpers for robust Firestore integration
const getTimestamp = (dateVal: any): number => {
  if (!dateVal) return 0;
  try {
    if (typeof dateVal === "object") {
      const seconds = dateVal.seconds ?? dateVal._seconds;
      if (typeof seconds === "number") {
        return seconds * 1000;
      }
    }
    const parsed = new Date(dateVal);
    return isNaN(parsed.getTime()) ? 0 : parsed.getTime();
  } catch (e) {
    return 0;
  }
};

const formatDate = (dateVal: any): string => {
  if (!dateVal) return "방금 전";
  try {
    if (typeof dateVal === "object") {
      const seconds = dateVal.seconds ?? dateVal._seconds;
      if (typeof seconds === "number") {
        return new Date(seconds * 1000).toLocaleDateString();
      }
    }
    const parsed = new Date(dateVal);
    if (isNaN(parsed.getTime())) {
      return "방금 전";
    }
    return parsed.toLocaleDateString();
  } catch (e) {
    return "방금 전";
  }
};

interface AdminSectionProps {
  stats: {
    articlesCount: number;
    advertisersCount: number;
    editorsCount: number;
    advertiserInquiries: any[];
    editorApplications: any[];
    registeredEditors?: any[];
  };
  refreshStats: () => Promise<void>;
  articles: Article[];
  refreshArticles: () => Promise<void>;
}

export default function AdminSection({ stats, refreshStats, articles, refreshArticles }: AdminSectionProps) {
  const [activeTab, setActiveTab] = useState<"articles" | "advertisers" | "editors" | "registered-reporters" | "stats">("articles");
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Search & Sort state
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState<"latest" | "likes" | "views">("latest");

  // Article Edit Modal states
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editExcerpt, setEditExcerpt] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editCategoryKo, setEditCategoryKo] = useState("");
  const [editImageUrl, setEditImageUrl] = useState("");
  const [editReadTime, setEditReadTime] = useState("");
  const [editTagsString, setEditTagsString] = useState("");

  // Article deletion
  const handleDeleteArticle = async (id: string) => {
    if (!confirm("정말 이 아티클을 매거진 데이터베이스에서 영구 삭제하시겠습니까?")) return;
    setIsProcessing(true);
    setActionMessage(null);

    try {
      const response = await fetch(`/api/articles/${id}`, {
        method: "DELETE"
      });
      const data = await response.json();
      if (data.success) {
        setActionMessage("아티클이 성공적으로 영구 삭제되었습니다.");
        await refreshArticles();
        await refreshStats();
      } else {
        setActionMessage(`삭제 실패: ${data.message}`);
      }
    } catch {
      setActionMessage("서버 통신 오류가 발생했습니다.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Advertiser inquiry approval/rejection
  const handleAdvertiserStatus = async (id: string, status: "approved" | "rejected") => {
    setIsProcessing(true);
    setActionMessage(null);

    try {
      const response = await fetch(`/api/admin/advertisers/${id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      const data = await response.json();
      if (data.success) {
        setActionMessage(`광고주 파트너십 제안이 성공적으로 ${status === "approved" ? "승인" : "반려"} 처리되었습니다.`);
        await refreshStats();
      } else {
        setActionMessage("처리에 실패했습니다.");
      }
    } catch {
      setActionMessage("서버 통신 오류가 발생했습니다.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Editor application approval/rejection
  const handleEditorStatus = async (id: string, status: "approved" | "rejected") => {
    setIsProcessing(true);
    setActionMessage(null);

    try {
      const response = await fetch(`/api/admin/editors/${id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      const data = await response.json();
      if (data.success) {
        setActionMessage(`신임 에디터 지원 신청이 ${status === "approved" ? "승인 및 소속 에디터로 임명 완료" : "반려"} 되었습니다.`);
        await refreshStats();
      } else {
        setActionMessage("처리에 실패했습니다.");
      }
    } catch {
      setActionMessage("서버 통신 오류가 발생했습니다.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Toggle registered journalist status (Active <-> On-Hold)
  const handleToggleJournalistStatus = async (id: string) => {
    setIsProcessing(true);
    setActionMessage(null);
    try {
      const response = await fetch(`/api/admin/editors/${id}/toggle`, {
        method: "POST"
      });
      const data = await response.json();
      if (data.success) {
        setActionMessage("에디터 파트너십 활동 지위 상태가 성공적으로 변경되었습니다.");
        await refreshStats();
      } else {
        setActionMessage("상태 변경에 실패했습니다.");
      }
    } catch {
      setActionMessage("서버 통신 오류가 발생했습니다.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Retire registered journalist
  const handleRetireJournalist = async (id: string) => {
    if (!confirm("정말 이 기자를 소속 풀에서 영구 제명/은퇴 처리하시겠습니까?")) return;
    setIsProcessing(true);
    setActionMessage(null);
    try {
      const response = await fetch(`/api/admin/editors/${id}`, {
        method: "DELETE"
      });
      const data = await response.json();
      if (data.success) {
        setActionMessage("해당 기자가 소속 기획단에서 정중히 은퇴/제명 처리되었습니다.");
        await refreshStats();
      } else {
        setActionMessage("처리에 실패했습니다.");
      }
    } catch {
      setActionMessage("서버 통신 오류가 발생했습니다.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Edit Article submit handler
  const handleEditArticleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingArticle) return;
    setIsProcessing(true);
    setActionMessage(null);

    const tags = editTagsString
      .split(",")
      .map(t => t.trim())
      .filter(t => t.length > 0);

    try {
      const response = await fetch(`/api/articles/${editingArticle.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle,
          excerpt: editExcerpt,
          content: editContent,
          category: editCategory,
          categoryKo: editCategoryKo,
          imageUrl: editImageUrl,
          readTime: editReadTime,
          tags
        })
      });

      const data = await response.json();
      if (data.success) {
        setActionMessage("기사가 완벽하게 수정 및 업데이트되었습니다.");
        setEditingArticle(null);
        await refreshArticles();
      } else {
        setActionMessage(`기사 수정 실패: ${data.message}`);
      }
    } catch {
      setActionMessage("서버 통신 중 오류가 발생했습니다.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Open Edit Modal helper
  const openEditModal = (art: Article) => {
    setEditingArticle(art);
    setEditTitle(art.title);
    setEditExcerpt(art.excerpt || "");
    setEditContent(art.content || "");
    setEditCategory(art.category || "Cafe");
    setEditCategoryKo(art.categoryKo || "카페 & 가스트로노미");
    setEditImageUrl(art.imageUrl || "");
    setEditReadTime(art.readTime || "3분");
    setEditTagsString(art.tags ? art.tags.join(", ") : "");
  };

  const handleCategoryChange = (val: string) => {
    setEditCategory(val);
    switch (val) {
      case "Cafe":
        setEditCategoryKo("카페 & 가스트로노미");
        break;
      case "Stay":
        setEditCategoryKo("로컬 스테이");
        break;
      case "Culture":
        setEditCategoryKo("문화 & 예술");
        break;
      case "Activity":
        setEditCategoryKo("액티비티 & 트렌드");
        break;
      default:
        setEditCategoryKo("일반 기사");
    }
  };

  // Recharts Data Processing
  // 1. Categories ratio for PieChart
  const categoryCounts: Record<string, number> = {};
  articles.forEach(art => {
    const cat = art.categoryKo || "일반 기사";
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  });
  const pieData = Object.keys(categoryCounts).map(cat => ({
    name: cat,
    value: categoryCounts[cat]
  }));

  // Colors for PieChart slices
  const PIE_COLORS = ["#78716c", "#d97706", "#292524", "#a8a29e", "#e7e5e4"];

  // 2. Likes per Article for BarChart
  const barData = articles.map(art => ({
    name: art.title.substring(0, 10) + "...",
    likes: art.likes,
    title: art.title
  }));

  // Filtered & Sorted Articles
  const filteredArticles = articles
    .filter(art => {
      const query = searchQuery.toLowerCase().trim();
      if (!query) return true;
      return (
        art.title.toLowerCase().includes(query) ||
        art.author.toLowerCase().includes(query) ||
        art.categoryKo.toLowerCase().includes(query) ||
        (art.tags && art.tags.some(t => t.toLowerCase().includes(query)))
      );
    })
    .sort((a, b) => {
      if (sortOption === "likes") {
        return (b.likes || 0) - (a.likes || 0);
      }
      if (sortOption === "views") {
        return (b.views || 0) - (a.views || 0);
      }
      // default "latest"
      return getTimestamp(b.createdAt) - getTimestamp(a.createdAt);
    });

  // 3. Journalist contribution statistics data
  const journalistsRoster = stats.registeredEditors || [];
  const journalistChartData = journalistsRoster.map(re => ({
    name: re.name.replace(" 에디터", "").replace(" 객원기자", ""),
    "발행 기사수": re.articlesCount || 0,
    "누적 추천수": re.likesReceived || 0
  }));

  return (
    <div className="bg-white border border-stone-100 rounded-3xl p-6 md:p-8 space-y-8 relative">
      
      {/* Admin header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-6">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-rose-600">
            <ShieldCheck size={20} className="animate-pulse" />
            <span className="text-xs font-bold tracking-[0.2em] uppercase font-mono">SUPREME DECK CONTROL</span>
          </div>
          <h2 className="text-2xl font-serif font-black text-stone-900">제주매거진 통합 어드민 대시보드</h2>
          <p className="text-stone-500 text-xs">
            발행 기사 검토, 기사 내용 수정, 소속 에디터 인사 평가, 광고 제휴 심사 및 데이터 시각화 통계를 총괄하는 전용 패널입니다.
          </p>
        </div>

        {/* Trigger Refresh */}
        <button
          onClick={async () => {
            setIsProcessing(true);
            await refreshArticles();
            await refreshStats();
            setIsProcessing(false);
          }}
          className="flex items-center space-x-1.5 border border-stone-200 hover:bg-stone-50 text-stone-600 text-xs py-2.5 px-4 rounded-xl font-semibold transition-all shadow-sm shrink-0"
        >
          <RefreshCw size={13} className={isProcessing ? "animate-spin" : ""} />
          <span>플랫폼 데이터 동기화</span>
        </button>
      </div>

      {/* Action feedback */}
      {actionMessage && (
        <div className="bg-stone-950 text-amber-400 p-4 rounded-xl text-xs flex items-center justify-between border border-stone-800 shadow-lg">
          <div className="flex items-center space-x-2">
            <Sparkles size={14} className="animate-spin text-amber-500" />
            <span>{actionMessage}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="text-stone-400 hover:text-white font-bold px-1 text-[11px]">
            [ 닫기 ]
          </button>
        </div>
      )}

      {/* Mini tabs */}
      <div className="flex border-b border-stone-100 pb-2 overflow-x-auto scrollbar-none flex-nowrap -mx-6 px-6 lg:mx-0 lg:px-0 gap-2 select-none">
        <button
          onClick={() => setActiveTab("articles")}
          className={`px-4 py-3 rounded-xl text-xs font-bold tracking-wider transition-all shrink-0 active:scale-[0.98] ${
            activeTab === "articles"
              ? "bg-stone-950 text-white shadow-md font-extrabold"
              : "text-stone-500 hover:bg-stone-50 bg-stone-100/30"
          }`}
        >
          📰 기사 저널 관리 ({articles.length})
        </button>

        <button
          onClick={() => setActiveTab("registered-reporters")}
          className={`px-4 py-3 rounded-xl text-xs font-bold tracking-wider transition-all shrink-0 active:scale-[0.98] ${
            activeTab === "registered-reporters"
              ? "bg-stone-950 text-white shadow-md font-extrabold"
              : "text-stone-500 hover:bg-stone-50 bg-stone-100/30"
          }`}
        >
          ✍️ 소속 기자 명단 ({journalistsRoster.length})
        </button>

        <button
          onClick={() => setActiveTab("advertisers")}
          className={`px-4 py-3 rounded-xl text-xs font-bold tracking-wider transition-all shrink-0 active:scale-[0.98] ${
            activeTab === "advertisers"
              ? "bg-stone-950 text-white shadow-md font-extrabold"
              : "text-stone-500 hover:bg-stone-50 bg-stone-100/30"
          }`}
        >
          💼 제휴 광고 심사 ({stats.advertisersCount})
        </button>

        <button
          onClick={() => setActiveTab("editors")}
          className={`px-4 py-3 rounded-xl text-xs font-bold tracking-wider transition-all shrink-0 active:scale-[0.98] ${
            activeTab === "editors"
              ? "bg-stone-950 text-white shadow-md font-extrabold"
              : "text-stone-500 hover:bg-stone-50 bg-stone-100/30"
          }`}
        >
          📬 에디터 신규 지원 ({stats.editorsCount})
        </button>

        <button
          onClick={() => setActiveTab("stats")}
          className={`px-4 py-3 rounded-xl text-xs font-bold tracking-wider transition-all shrink-0 active:scale-[0.98] ${
            activeTab === "stats"
              ? "bg-stone-950 text-white shadow-md font-extrabold"
              : "text-stone-500 hover:bg-stone-50 bg-stone-100/30"
          }`}
        >
          📊 인포그래픽 통계 리포트
        </button>
      </div>

      {/* Main Panel views */}
      <div className="pt-2 min-h-[350px]">
        
        {/* VIEW 1: Articles list, search, sort, update and deletion */}
        {activeTab === "articles" && (
          <div className="space-y-4">
            {/* Search and Sort controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-stone-50 p-3.5 rounded-2xl border border-stone-100">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 text-stone-400" size={14} />
                <input
                  type="text"
                  placeholder="기사 제목, 필명, 카테고리, 해시태그 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white text-xs pl-9 pr-4 py-2 rounded-xl border border-stone-200 focus:outline-none focus:border-stone-900 transition-all font-sans"
                />
              </div>
              <div className="flex items-center space-x-2 shrink-0">
                <span className="text-[10px] text-stone-500 font-bold">정렬 기준:</span>
                <select
                  value={sortOption}
                  onChange={(e: any) => setSortOption(e.target.value)}
                  className="bg-white text-xs px-3 py-2 rounded-xl border border-stone-200 focus:outline-none font-sans"
                >
                  <option value="latest">최신 등록순</option>
                  <option value="likes">독자 추천순</option>
                  <option value="views">누적 조회순</option>
                </select>
                <span className="text-[10px] bg-stone-950 text-white px-2.5 py-2 rounded-xl font-bold">
                  {filteredArticles.length} / {articles.length}건
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3.5">
              {filteredArticles.length === 0 ? (
                <div className="text-center py-12 bg-stone-50 rounded-2xl text-stone-400 text-xs">
                  검색 결과 조건에 맞는 기사가 없습니다. 다른 키워드로 검색해 보세요.
                </div>
              ) : (
                filteredArticles.map((art) => (
                  <div key={art.id} className="border border-stone-100 bg-stone-50/40 hover:bg-stone-50/70 p-4 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all">
                    <div className="flex items-center space-x-3.5">
                      <div className="w-14 h-14 rounded-xl overflow-hidden border border-stone-200 shrink-0 shadow-inner">
                        <img src={art.imageUrl} alt="cover" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="bg-amber-100 text-amber-800 text-[9px] font-black px-2 py-0.5 rounded-md uppercase font-sans">{art.categoryKo}</span>
                          <span className="text-stone-400 text-[10px] font-mono">ID: {art.id}</span>
                          <span className="text-stone-400 text-[10px] font-mono flex items-center gap-0.5">
                            <Eye size={10} /> {art.views || 0}
                          </span>
                        </div>
                        <h4 className="font-bold text-sm text-stone-900 mt-1">{art.title}</h4>
                        <div className="flex items-center space-x-2 mt-0.5 text-[11px] text-stone-500 flex-wrap">
                          <span>필진: <strong className="text-stone-700 font-semibold">{art.author}</strong></span>
                          <span>•</span>
                          <span>추천수: {art.likes}개</span>
                          <span>•</span>
                          <span>등록: {formatDate(art.createdAt)}</span>
                        </div>
                        {art.tags && art.tags.length > 0 && (
                          <div className="flex items-center gap-1 mt-1 flex-wrap">
                            {art.tags.map((t, idx) => (
                              <span key={idx} className="text-[10px] text-stone-500 font-mono">#{t}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0 self-end md:self-center">
                      <button
                        onClick={() => openEditModal(art)}
                        className="flex items-center space-x-1 border border-stone-200 bg-white hover:bg-stone-100 text-stone-700 text-xs py-2 px-3 rounded-lg font-bold transition-all shadow-sm"
                      >
                        <Edit3 size={11} />
                        <span>기사 수정</span>
                      </button>

                      <button
                        onClick={() => handleDeleteArticle(art.id)}
                        disabled={isProcessing}
                        className="flex items-center space-x-1 border border-rose-100 hover:bg-rose-50 text-rose-600 hover:text-rose-700 text-xs py-2 px-3 rounded-lg font-bold transition-all shrink-0"
                      >
                        <Trash2 size={11} />
                        <span>영구 삭제</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* VIEW 2: 소속 기자 명단 관리 (Roster Management) */}
        {activeTab === "registered-reporters" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-stone-100">
              <span className="text-[11px] font-bold tracking-wider text-stone-400 font-mono">ACTIVE JOURNALISTS MANAGEMENT POOL</span>
              <span className="text-[11px] bg-stone-100 text-stone-700 px-2.5 py-1 rounded-full font-bold">임명 필진 {journalistsRoster.length}명</span>
            </div>

            {journalistsRoster.length === 0 ? (
              <div className="bg-stone-50 p-10 rounded-2xl text-center text-stone-400 text-xs">
                등록된 활성 소속 기자가 아직 없습니다. "에디터 신규 지원"을 승인하면 기자가 이곳에 등재됩니다.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {journalistsRoster.map((editor: any) => (
                  <div key={editor.id} className="border border-stone-100 bg-white p-5 rounded-2xl space-y-4 hover:shadow-md transition-all border-l-4 border-l-stone-900">
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center text-2xl border border-stone-200 shrink-0">
                          {editor.avatar || "🍊"}
                        </div>
                        <div>
                          <h4 className="font-serif font-black text-sm text-stone-800 flex items-center gap-1.5">
                            {editor.name}
                            <span className="text-[9px] font-mono tracking-wider bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded">
                              {editor.specialty === "Gastronomy" ? "카페 미식" : editor.specialty === "Stay" ? "로컬 스테이" : editor.specialty === "Nature" ? "친환경 자연" : "문화 예술"}
                            </span>
                          </h4>
                          <p className="text-[11px] text-stone-400 font-mono mt-0.5">{editor.email}</p>
                        </div>
                      </div>

                      <div className="flex items-center shrink-0">
                        {editor.status === "Active" ? (
                          <span className="bg-emerald-50 text-emerald-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-100 flex items-center gap-1">
                            ● 활동중
                          </span>
                        ) : (
                          <span className="bg-stone-100 text-stone-500 text-[10px] font-bold px-2 py-0.5 rounded-full border border-stone-200 flex items-center gap-1">
                            ◌ 홀드됨
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-stone-500 leading-relaxed bg-stone-50 p-3 rounded-xl border border-stone-100">
                      {editor.bio}
                    </p>

                    <div className="flex justify-between items-center text-[11px] text-stone-500 border-t border-stone-100/60 pt-3">
                      <div className="flex items-center space-x-3">
                        <span>발행 기사: <strong className="text-stone-800 font-bold">{editor.articlesCount || 0}</strong>개</span>
                        <span>누적 추천: <strong className="text-amber-600 font-bold">{editor.likesReceived || 0}</strong>개</span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleToggleJournalistStatus(editor.id)}
                          className="text-[10px] font-bold text-stone-600 hover:text-stone-950 px-2 py-1 rounded border border-stone-200 hover:bg-stone-50 transition-all"
                        >
                          {editor.status === "Active" ? "활동 보류" : "활동 승인"}
                        </button>
                        <button
                          onClick={() => handleRetireJournalist(editor.id)}
                          className="text-[10px] font-bold text-rose-600 hover:text-rose-700 px-2 py-1 rounded border border-rose-100 hover:bg-rose-50 transition-all"
                        >
                          영구 탈퇴
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* VIEW 3: Advertiser Inquiries Status Switcher */}
        {activeTab === "advertisers" && (
          <div className="space-y-4">
            <span className="text-[11px] font-bold tracking-wider text-stone-400 font-mono block">PARTNERSHIP DEMAND CONTROL</span>
            
            {stats.advertiserInquiries.length === 0 ? (
              <div className="bg-stone-50 p-10 rounded-2xl text-center text-stone-400 text-xs">
                현재 등록된 광고 제휴 문의가 비어있습니다.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {stats.advertiserInquiries.map((adv: any) => (
                  <div key={adv.id} className="border border-stone-100 p-5 rounded-2xl space-y-4 bg-stone-50/20">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <span className="text-[9px] font-bold tracking-wider bg-stone-900 text-amber-400 px-2 py-0.5 rounded font-mono uppercase mr-2">
                          {adv.adType === "Banner" ? "지면 배너 광고" : adv.adType === "Sponsored" ? "네이티브 기획 기사" : "AI 가이드 추천핀"}
                        </span>
                        <h4 className="font-serif font-black text-base text-stone-800 mt-1">{adv.companyName}</h4>
                        <p className="text-xs text-stone-500 font-medium">담당자: {adv.contactPerson} ({adv.email})</p>
                      </div>

                      <div className="flex items-center space-x-1.5 shrink-0">
                        {adv.status === "approved" && <span className="bg-emerald-50 text-emerald-600 text-[10px] font-extrabold px-2.5 py-1 rounded-full border border-emerald-100">최종 승인됨</span>}
                        {adv.status === "rejected" && <span className="bg-rose-50 text-rose-600 text-[10px] font-extrabold px-2.5 py-1 rounded-full border border-rose-100">반려됨</span>}
                        {adv.status === "pending" && <span className="bg-amber-50 text-amber-600 text-[10px] font-extrabold px-2.5 py-1 rounded-full border border-amber-100">심사 대기중</span>}
                      </div>
                    </div>

                    <div className="bg-stone-50 p-3 rounded-xl border border-stone-100">
                      <p className="text-xs text-stone-600 leading-relaxed font-sans">{adv.message}</p>
                    </div>

                    {adv.status === "pending" && (
                      <div className="flex justify-end space-x-2 pt-1 border-t border-stone-100/60">
                        <button
                          onClick={() => handleAdvertiserStatus(adv.id, "approved")}
                          className="flex items-center space-x-1 bg-stone-950 text-white hover:bg-stone-800 text-xs px-3.5 py-2 rounded-xl font-bold transition-all"
                        >
                          <Check size={12} />
                          <span>광고 제휴 승인</span>
                        </button>
                        <button
                          onClick={() => handleAdvertiserStatus(adv.id, "rejected")}
                          className="flex items-center space-x-1 border border-stone-200 hover:bg-stone-100 text-stone-500 text-xs px-3.5 py-2 rounded-xl font-bold transition-all"
                        >
                          <X size={12} />
                          <span>반려</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* VIEW 4: Editor applications status */}
        {activeTab === "editors" && (
          <div className="space-y-4">
            <span className="text-[11px] font-bold tracking-wider text-stone-400 font-mono block">JOURNALIST TEAM EVALUATION</span>
            
            {stats.editorApplications.length === 0 ? (
              <div className="bg-stone-50 p-10 rounded-2xl text-center text-stone-400 text-xs">
                현재 신규 에디터 지원 신청서가 비어있습니다.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {stats.editorApplications.map((app: any) => (
                  <div key={app.id} className="border border-stone-100 p-5 rounded-2xl space-y-4 bg-stone-50/20">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <span className="text-[9px] font-bold tracking-wider bg-stone-200 text-stone-700 px-2 py-0.5 rounded font-mono uppercase mr-2">
                          전문분야: {app.specialty === "Gastronomy" ? "카페 미식" : app.specialty === "Stay" ? "로컬 숙소" : app.specialty === "Nature" ? "친환경 자연" : "문화 예술"}
                        </span>
                        <h4 className="font-serif font-black text-base text-stone-800 mt-1">{app.name} 지원작가</h4>
                        <p className="text-xs text-stone-500 font-medium">연락처: {app.email}</p>
                      </div>

                      <div className="flex items-center space-x-1.5 shrink-0">
                        {app.status === "approved" && <span className="bg-emerald-50 text-emerald-600 text-[10px] font-extrabold px-2.5 py-1 rounded-full border border-emerald-100">필진 임명 완료</span>}
                        {app.status === "rejected" && <span className="bg-rose-50 text-rose-600 text-[10px] font-extrabold px-2.5 py-1 rounded-full border border-rose-100">서류 보완 필요</span>}
                        {app.status === "applied" && <span className="bg-blue-50 text-blue-600 text-[10px] font-extrabold px-2.5 py-1 rounded-full border border-blue-100">서류 심사중</span>}
                      </div>
                    </div>

                    <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-100 text-xs text-stone-600 leading-relaxed font-sans">
                      <p className="font-bold text-stone-800 mb-1">[ 이력 및 포트폴리오 ]</p>
                      {app.bio}
                    </div>

                    {app.status === "applied" && (
                      <div className="flex justify-end space-x-2 pt-1 border-t border-stone-100/60">
                        <button
                          onClick={() => handleEditorStatus(app.id, "approved")}
                          className="flex items-center space-x-1 bg-stone-950 text-white hover:bg-stone-800 text-xs px-3.5 py-2 rounded-xl font-bold transition-all"
                        >
                          <UserCheck size={12} />
                          <span>정식 에디터 임명 승인</span>
                        </button>
                        <button
                          onClick={() => handleEditorStatus(app.id, "rejected")}
                          className="flex items-center space-x-1 border border-stone-200 hover:bg-stone-100 text-stone-500 text-xs px-3.5 py-2 rounded-xl font-bold transition-all"
                        >
                          <X size={12} />
                          <span>반려</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* VIEW 5: Professional Recharts visualizations */}
        {activeTab === "stats" && (
          <div className="space-y-8">
            <span className="text-[11px] font-bold tracking-wider text-stone-400 font-mono block">MAGAZINE PLATFORM INTERACTIVE INFOGRAPHIC</span>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              
              {/* Pie chart: Article category distribution */}
              <div className="border border-stone-100 p-5 rounded-2xl space-y-4">
                <div className="space-y-0.5">
                  <h4 className="font-serif font-bold text-sm text-stone-800 flex items-center gap-1.5">
                    <PieIcon size={14} className="text-stone-500" />
                    <span>카테고리별 발행 분포 비율</span>
                  </h4>
                  <p className="text-[10px] text-stone-400">제주매거진 정기 저널에 등록된 카테고리 기사의 도식 분포도입니다.</p>
                </div>

                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        outerRadius={70}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Bar Chart: Article likes distribution */}
              <div className="border border-stone-100 p-5 rounded-2xl space-y-4">
                <div className="space-y-0.5">
                  <h4 className="font-serif font-bold text-sm text-stone-800 flex items-center gap-1.5">
                    <BarChart3 size={14} className="text-stone-500" />
                    <span>아티클별 독자 추천수 활성 지표</span>
                  </h4>
                  <p className="text-[10px] text-stone-400">어떤 감성 아티클이 제주매거진 방문 독자들에게 가장 큰 울림을 주었는지 나타냅니다.</p>
                </div>

                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                      <YAxis tick={{ fontSize: 9 }} />
                      <Tooltip />
                      <Bar dataKey="likes" fill="#d97706" radius={[4, 4, 0, 0]}>
                        {barData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index % 2 === 0 ? "#78716c" : "#d97706"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* NEW Chart: Journalist Roster Contribution */}
              <div className="border border-stone-100 p-5 rounded-2xl space-y-4 lg:col-span-2">
                <div className="space-y-0.5">
                  <h4 className="font-serif font-bold text-sm text-stone-800 flex items-center gap-1.5">
                    <Award size={14} className="text-amber-500" />
                    <span>필진 기자별 인사 기여도 지표 (저널리즘 공헌 분석)</span>
                  </h4>
                  <p className="text-[10px] text-stone-400">각 에디터가 작성한 총 기사수 대비 독자로부터 얻은 누적 추천수(Likes)를 입체적으로 분석합니다.</p>
                </div>

                <div className="h-[240px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={journalistChartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                      <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: "bold" }} />
                      <YAxis tick={{ fontSize: 9 }} />
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: 10 }} />
                      <Bar dataKey="발행 기사수" fill="#78716c" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="누적 추천수" fill="#d97706" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>

            {/* Quick Summary card */}
            <div className="bg-amber-50/50 p-4 border border-amber-100 rounded-xl text-center space-y-1">
              <p className="text-xs font-bold text-stone-800">📊 어드민 비즈니스 통계 결론</p>
              <p className="text-[11px] text-stone-600 leading-relaxed">
                현재 구좌읍/평대리 일대 카페 가스트로노미 저널 및 차귀도 제로웨이스트 숙소 아티클이 높은 추천 활성도를 기록하고 있습니다.<br />
                독자 인입 효율 극대화를 위해 해당 에디터 필진의 기획 기사를 주간 헤드라인으로 승급 게재하는 것을 추천합니다.
              </p>
            </div>

          </div>
        )}

      </div>

      {/* ARTICLE EDIT MODAL POPUP */}
      {editingArticle && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 md:p-8 space-y-6 shadow-2xl border border-stone-100"
          >
            <div className="flex justify-between items-center border-b border-stone-100 pb-4">
              <div className="flex items-center space-x-2">
                <Edit3 className="text-stone-800" size={18} />
                <h3 className="font-serif font-black text-lg text-stone-900">제주매거진 기사 정보 수정</h3>
              </div>
              <button
                onClick={() => setEditingArticle(null)}
                className="text-stone-400 hover:text-stone-900 p-1 rounded-full hover:bg-stone-50 transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleEditArticleSubmit} className="space-y-4 text-left">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">기사 제목</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 focus:border-stone-950 focus:outline-none rounded-xl px-4 py-2.5 text-xs font-medium font-sans"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">카테고리 분류</label>
                  <select
                    value={editCategory}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 focus:border-stone-950 focus:outline-none rounded-xl px-4 py-2.5 text-xs font-medium font-sans"
                  >
                    <option value="Cafe">카페 & 미식 (Cafe)</option>
                    <option value="Stay">로컬 숙소 (Stay)</option>
                    <option value="Culture">문화 & 예술 (Culture)</option>
                    <option value="Activity">액티비티 & 자연 (Activity)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">기사 예상 리드 타임</label>
                  <input
                    type="text"
                    required
                    value={editReadTime}
                    onChange={(e) => setEditReadTime(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 focus:border-stone-950 focus:outline-none rounded-xl px-4 py-2.5 text-xs font-medium font-sans"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">대표 이미지 URL</label>
                <input
                  type="url"
                  required
                  value={editImageUrl}
                  onChange={(e) => setEditImageUrl(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 focus:border-stone-950 focus:outline-none rounded-xl px-4 py-2.5 text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">기사 요약문 (Excerpt)</label>
                <input
                  type="text"
                  required
                  value={editExcerpt}
                  onChange={(e) => setEditExcerpt(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 focus:border-stone-950 focus:outline-none rounded-xl px-4 py-2.5 text-xs font-medium font-sans"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">기사 본문 내용 (Markdown/일반 텍스트 지원)</label>
                <textarea
                  rows={8}
                  required
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 focus:border-stone-950 focus:outline-none rounded-xl p-4 text-xs font-medium font-sans leading-relaxed resize-y"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">검색 키워드 태그 (쉼표로 구분)</label>
                <input
                  type="text"
                  placeholder="예: 구좌읍, 평대리, 모카포트, 감성카페"
                  value={editTagsString}
                  onChange={(e) => setEditTagsString(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 focus:border-stone-950 focus:outline-none rounded-xl px-4 py-2.5 text-xs font-sans"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setEditingArticle(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold border border-stone-200 hover:bg-stone-50 text-stone-600 transition-all font-sans"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-stone-950 text-white hover:bg-stone-800 disabled:bg-stone-300 transition-all font-sans flex items-center space-x-1.5"
                >
                  {isProcessing && <RefreshCw size={12} className="animate-spin" />}
                  <span>수정 내용 저장하기</span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

    </div>
  );
}
