import React, { useState } from "react";
import { motion } from "motion/react";
import { Article, AdInquiry, EditorApplication } from "../types";
import { ShieldCheck, Check, X, Trash2, Calendar, FileText, UserCheck, BarChart3, PieChart as PieIcon, RefreshCw, AlertCircle, Sparkles } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, PieChart, Pie } from "recharts";

interface AdminSectionProps {
  stats: {
    articlesCount: number;
    advertisersCount: number;
    editorsCount: number;
    advertiserInquiries: any[];
    editorApplications: any[];
  };
  refreshStats: () => Promise<void>;
  articles: Article[];
  refreshArticles: () => Promise<void>;
}

export default function AdminSection({ stats, refreshStats, articles, refreshArticles }: AdminSectionProps) {
  const [activeTab, setActiveTab] = useState<"articles" | "advertisers" | "editors" | "stats">("articles");
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

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
        setActionMessage(`신임 에디터 지원 신청이 ${status === "approved" ? "승인(최종 필진 등록)" : "반려"} 완료되었습니다.`);
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

  return (
    <div className="bg-white border border-stone-100 rounded-3xl p-6 md:p-8 space-y-8">
      
      {/* Admin header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-6">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-rose-600">
            <ShieldCheck size={20} className="animate-pulse" />
            <span className="text-xs font-bold tracking-[0.2em] uppercase font-mono">SUPREME DECK CONTROL</span>
          </div>
          <h2 className="text-2xl font-serif font-black text-stone-900">제주매거진 통합 어드민 대시보드</h2>
          <p className="text-stone-500 text-xs">
            발행 기사 검토, 광고 파트너십 심사, 지원 필진 위원회 승인 및 데이터 시각화를 제공하는 마스터 패널입니다.
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
      <div className="flex border-b border-stone-100 pb-1 overflow-x-auto gap-2">
        <button
          onClick={() => setActiveTab("articles")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold tracking-wider transition-all shrink-0 ${
            activeTab === "articles"
              ? "bg-stone-950 text-white shadow-md font-extrabold"
              : "text-stone-500 hover:bg-stone-50"
          }`}
        >
          아티클 저널 관리 ({articles.length})
        </button>

        <button
          onClick={() => setActiveTab("advertisers")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold tracking-wider transition-all shrink-0 ${
            activeTab === "advertisers"
              ? "bg-stone-950 text-white shadow-md font-extrabold"
              : "text-stone-500 hover:bg-stone-50"
          }`}
        >
          제휴 광고 신청 관리 ({stats.advertisersCount})
        </button>

        <button
          onClick={() => setActiveTab("editors")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold tracking-wider transition-all shrink-0 ${
            activeTab === "editors"
              ? "bg-stone-950 text-white shadow-md font-extrabold"
              : "text-stone-500 hover:bg-stone-50"
          }`}
        >
          신임 에디터 신청 심사 ({stats.editorsCount})
        </button>

        <button
          onClick={() => setActiveTab("stats")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold tracking-wider transition-all shrink-0 ${
            activeTab === "stats"
              ? "bg-stone-950 text-white shadow-md font-extrabold"
              : "text-stone-500 hover:bg-stone-50"
          }`}
        >
          인포그래픽 통계 리포트
        </button>
      </div>

      {/* Main Panel views */}
      <div className="pt-2 min-h-[350px]">
        
        {/* VIEW 1: Articles list and deletion */}
        {activeTab === "articles" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-bold tracking-wider text-stone-400 font-mono">PUBLISHED JOURNAL MASTER LIST</span>
              <span className="text-[11px] bg-stone-100 text-stone-600 px-2.5 py-1 rounded-full font-bold">총 {articles.length}개의 정기 간행 기사</span>
            </div>

            <div className="grid grid-cols-1 gap-3.5">
              {articles.map((art) => (
                <div key={art.id} className="border border-stone-100 bg-stone-50/40 p-4 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-center space-x-3.5">
                    <div className="w-14 h-14 rounded-xl overflow-hidden border border-stone-200 shrink-0">
                      <img src={art.imageUrl} alt="cover" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <span className="bg-stone-200/60 text-stone-700 text-[9px] font-bold px-2 py-0.5 rounded mr-2 uppercase font-mono">{art.categoryKo}</span>
                      <span className="text-stone-400 text-[10px] font-mono">ID: {art.id}</span>
                      <h4 className="font-bold text-sm text-stone-900 mt-1">{art.title}</h4>
                      <p className="text-[11px] text-stone-500 mt-0.5">에디터: {art.author} • 추천수: {art.likes}개 • {new Date(art.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteArticle(art.id)}
                    disabled={isProcessing}
                    className="flex items-center space-x-1 border border-rose-100 hover:bg-rose-50 text-rose-600 hover:text-rose-700 text-xs py-2 px-3 rounded-lg font-bold transition-all shrink-0 self-end md:self-center"
                  >
                    <Trash2 size={12} />
                    <span>영구 삭제</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW 2: Advertiser Inquiries Status Switcher */}
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

        {/* VIEW 3: Editor applications status */}
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

        {/* VIEW 4: Professional Recharts visualizations */}
        {activeTab === "stats" && (
          <div className="space-y-8">
            <span className="text-[11px] font-bold tracking-wider text-stone-400 font-mono block">MAGAZINE PLATFORM INTERACTIVE INFOGRAPHIC</span>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
              
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

    </div>
  );
}
