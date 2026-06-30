import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Article, User, Comment } from "./types";
import JournalSection from "./components/JournalSection";
import PlatformSection from "./components/PlatformSection";
import AdvertiserSection from "./components/AdvertiserSection";
import AiGuideSection from "./components/AiGuideSection";
import AdminSection from "./components/AdminSection";
import RagSection from "./components/RagSection";
import { Compass, BookOpen, Feather, Briefcase, Sparkles, MapPin, Eye, MessageCircle, AlertCircle, LogIn, LogOut, ShieldAlert, CloudSun, Calendar, Share2, Award, Heart, Sparkle, Brain } from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState<"journal" | "platform" | "advertiser" | "guide" | "rag" | "admin">("journal");
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastGeneratedImage, setLastGeneratedImage] = useState<string | null>(null);

  // Kakao Login simulated state (Prefilled with hyeonw213 for seamless premium experience)
  const [user, setUser] = useState<User>({
    isLoggedIn: false,
    nickname: "",
    email: "",
    profileImageUrl: "",
    role: "user"
  });

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [sharingArticle, setSharingArticle] = useState<Article | null>(null);

  // Platform counters from server
  const [stats, setStats] = useState({
    articlesCount: 4,
    advertisersCount: 2,
    editorsCount: 1,
    advertiserInquiries: [],
    editorApplications: []
  });

  // Current Jeju weather & Citrus index state
  const [jejuWeather, setJejuWeather] = useState({
    temp: 22,
    status: "구름 조금, 선선한 동풍",
    citrusIndex: 92, // 귤빛 여행 지수
    citrusStatus: "최상의 사색 기후 (평대리 걷기 최적)"
  });

  const fetchArticles = async () => {
    try {
      const response = await fetch("/api/articles");
      const data = await response.json();
      if (data.success) {
        setArticles(data.articles);
      }
    } catch (error) {
      console.error("Error fetching articles:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/admin/stats");
      const data = await response.json();
      if (data.success) {
        setStats({
          articlesCount: data.stats.articlesCount,
          advertisersCount: data.stats.advertisersCount,
          editorsCount: data.stats.editorsCount,
          advertiserInquiries: data.stats.advertiserInquiries,
          editorApplications: data.stats.editorApplications
        });
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  useEffect(() => {
    fetchArticles();
    fetchStats();
    // Auto-login with user email from platform to feel premium and connected
    setTimeout(() => {
      handleKakaoLoginSimulate();
    }, 1000);
  }, []);

  const handleLikeArticle = async (id: string) => {
    setArticles((prev) =>
      prev.map((art) => (art.id === id ? { ...art, likes: art.likes + 1 } : art))
    );
  };

  const handlePublishArticle = async (articleData: Partial<Article>): Promise<boolean> => {
    try {
      const response = await fetch("/api/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(articleData)
      });

      const data = await response.json();
      if (data.success) {
        await fetchArticles();
        await fetchStats();
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error publishing article:", error);
      return false;
    }
  };

  const handleImageGenerated = (url: string) => {
    setLastGeneratedImage(url);
  };

  // Kakao Login Simulation
  const handleKakaoLoginSimulate = () => {
    setUser({
      isLoggedIn: true,
      nickname: "hyeonw213 (제주 러버)",
      email: "hyeonw213@gmail.com",
      profileImageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80",
      role: "admin" // Automatically grant admin privilege for convenient feature testing
    });
    setShowLoginModal(false);
  };

  const handleLogout = () => {
    setUser({
      isLoggedIn: false,
      nickname: "",
      email: "",
      profileImageUrl: "",
      role: "user"
    });
  };

  // Kakao Share Trigger
  const triggerKakaoShare = (art: Article) => {
    setSharingArticle(art);
    setShowShareModal(true);
  };

  // Dynamic Weather Refresh Simulation
  const refreshWeather = () => {
    const temps = [20, 21, 22, 23, 19, 24];
    const statuses = ["평대 바다 해안길 미풍", "구좌리 맑음, 돌담 그늘 선선", "한라산 산안개 걷히는 중", "차귀도 수평선 시야 가시거리 양호"];
    const indices = [88, 92, 95, 98, 90];
    const randomTemp = temps[Math.floor(Math.random() * temps.length)];
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
    const randomIdx = indices[Math.floor(Math.random() * indices.length)];

    setJejuWeather({
      temp: randomTemp,
      status: randomStatus,
      citrusIndex: randomIdx,
      citrusStatus: randomIdx >= 95 ? "인생 노을 사색 타이밍 (카메라 필수)" : "평온한 차 한 잔의 여유 기후"
    });
  };

  return (
    <div className="min-h-screen bg-[#fafaf9] text-stone-900 font-sans selection:bg-amber-100 selection:text-stone-950 flex flex-col justify-between overflow-x-hidden">
      
      {/* 1. Dynamic Brand Announcement & Multi-Indicator Top Rail */}
      <div className="bg-stone-950 text-stone-200 py-2.5 px-4 text-xs tracking-wider flex flex-col md:flex-row items-center justify-between gap-2.5 shrink-0 border-b border-stone-800">
        <div className="flex items-center space-x-3 text-[10.5px] font-mono">
          <span className="inline-block w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
          <span className="font-bold text-amber-400">● 제주 매거진 프리미엄 라이브 엔진</span>
          <span className="opacity-30">|</span>
          <span>저널 {stats.articlesCount}개</span>
          <span className="opacity-30">|</span>
          <span>제휴 광고 {stats.advertisersCount}건</span>
          <span className="opacity-30">|</span>
          <span>필진 지원 {stats.editorsCount}명</span>
        </div>

        {/* Dynamic Jeju Sentiment Weather Widget (Bespoke Trend Design) */}
        <div className="flex items-center space-x-4 text-[10.5px]">
          <div className="flex items-center space-x-1.5 bg-stone-900 px-3 py-1 rounded-full text-stone-300 border border-stone-800">
            <CloudSun size={12} className="text-amber-500" />
            <span className="font-semibold text-stone-200">제주 {jejuWeather.temp}°C</span>
            <span className="opacity-40">•</span>
            <span>{jejuWeather.status}</span>
          </div>
          <button 
            onClick={refreshWeather}
            className="flex items-center space-x-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 px-3 py-1 rounded-full font-bold transition-all border border-amber-500/20"
          >
            <Sparkle size={10} className="animate-spin-slow text-amber-500" />
            <span>감귤 사색지수 {jejuWeather.citrusIndex}% ({jejuWeather.citrusStatus})</span>
          </button>
        </div>
      </div>

      {/* 2. Primary Luxury Header & Nav */}
      <header className="border-b border-stone-200/60 bg-white/90 backdrop-blur-md sticky top-0 z-40 px-4 md:px-8 py-5 shrink-0 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          
          {/* Elegant Logo Area */}
          <div className="flex items-center space-x-4">
            <div className="bg-stone-950 text-white p-3 rounded-2xl flex items-center justify-center shadow-lg shadow-stone-950/10">
              <Compass size={24} className="text-amber-400 animate-spin-slow" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-serif font-black tracking-tight text-stone-900 uppercase flex items-center gap-1.5">
                <span>제주매거진</span>
                <span className="font-serif font-light text-stone-400 text-sm tracking-widest hidden sm:inline">JEJU JOURNAL</span>
              </h1>
              <p className="text-[10px] tracking-[0.22em] text-amber-600 font-bold uppercase">
                감성 로컬 아카이브 & 브랜드 비즈니스 플랫폼
              </p>
            </div>
          </div>

          {/* Luxury Navigation Menu (Fully localized in Korean as requested) */}
          <nav className="flex overflow-x-auto lg:flex-wrap scrollbar-none max-w-full lg:justify-center gap-1.5 bg-stone-100 p-1.5 rounded-2xl border border-stone-200/50 flex-nowrap shrink-0 select-none">
            <button
              onClick={() => setActiveTab("journal")}
              className={`flex items-center space-x-2 px-3.5 py-2.5 rounded-xl text-xs font-bold tracking-wider transition-all shrink-0 whitespace-nowrap active:scale-[0.97] ${
                activeTab === "journal"
                  ? "bg-white text-stone-950 shadow-md font-extrabold"
                  : "text-stone-500 hover:text-stone-900 hover:bg-stone-50"
              }`}
            >
              <BookOpen size={13.5} />
              <span>매거진 저널</span>
            </button>

            <button
              onClick={() => setActiveTab("platform")}
              className={`flex items-center space-x-2 px-3.5 py-2.5 rounded-xl text-xs font-bold tracking-wider transition-all shrink-0 whitespace-nowrap active:scale-[0.97] ${
                activeTab === "platform"
                  ? "bg-white text-stone-950 shadow-md font-extrabold"
                  : "text-stone-500 hover:text-stone-900 hover:bg-stone-50"
              }`}
            >
              <Feather size={13.5} />
              <span>크리에이터 데스크</span>
            </button>

            <button
              onClick={() => setActiveTab("advertiser")}
              className={`flex items-center space-x-2 px-3.5 py-2.5 rounded-xl text-xs font-bold tracking-wider transition-all shrink-0 whitespace-nowrap active:scale-[0.97] ${
                activeTab === "advertiser"
                  ? "bg-white text-stone-950 shadow-md font-extrabold"
                  : "text-stone-500 hover:text-stone-900 hover:bg-stone-50"
              }`}
            >
              <Briefcase size={13.5} />
              <span>광고 제휴 센터</span>
            </button>

            <button
              onClick={() => setActiveTab("guide")}
              className={`flex items-center space-x-2 px-3.5 py-2.5 rounded-xl text-xs font-bold tracking-wider transition-all shrink-0 whitespace-nowrap active:scale-[0.97] ${
                activeTab === "guide"
                  ? "bg-white text-stone-950 shadow-md font-extrabold"
                  : "text-stone-500 hover:text-stone-900 hover:bg-stone-50"
              }`}
            >
              <Sparkles size={13.5} className="text-amber-500 animate-pulse" />
              <span>제주 AI 가이드</span>
            </button>

            <button
              onClick={() => setActiveTab("rag")}
              className={`flex items-center space-x-2 px-3.5 py-2.5 rounded-xl text-xs font-bold tracking-wider transition-all shrink-0 whitespace-nowrap active:scale-[0.97] ${
                activeTab === "rag"
                  ? "bg-white text-stone-950 shadow-md font-extrabold"
                  : "text-stone-500 hover:text-stone-900 hover:bg-stone-50"
              }`}
            >
              <Brain size={13.5} className="text-amber-500" />
              <span>AI RAG 검색</span>
            </button>

            {/* Simulated Unified Admin Dashboard menu - accessible to demo user */}
            {user.isLoggedIn && user.role === "admin" && (
              <button
                onClick={() => setActiveTab("admin")}
                className={`flex items-center space-x-2 px-3.5 py-2.5 rounded-xl text-xs font-bold tracking-wider transition-all border-l border-stone-200 pl-4 shrink-0 whitespace-nowrap active:scale-[0.97] ${
                  activeTab === "admin"
                    ? "bg-stone-950 text-white shadow-md font-extrabold"
                    : "text-rose-600 hover:bg-rose-50"
                }`}
              >
                <ShieldAlert size={13.5} />
                <span>통합 어드민</span>
              </button>
            )}
          </nav>

          {/* Kakao Authentication integration bar */}
          <div className="flex items-center space-x-3 shrink-0">
            {user.isLoggedIn ? (
              <div className="flex items-center space-x-2.5 bg-stone-50 border border-stone-100 p-1.5 pr-4 rounded-full">
                <img 
                  src={user.profileImageUrl} 
                  alt="profile" 
                  className="w-7 h-7 rounded-full border border-stone-200/50"
                />
                <div className="text-left">
                  <p className="text-[10px] font-bold text-stone-800 leading-none">{user.nickname}</p>
                  <p className="text-[9px] text-stone-400 leading-none font-mono mt-0.5">{user.email}</p>
                </div>
                <button 
                  onClick={handleLogout} 
                  title="로그아웃"
                  className="p-1 hover:bg-stone-200 rounded-full text-stone-400 hover:text-stone-600 transition-colors shrink-0"
                >
                  <LogOut size={13} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowLoginModal(true)}
                className="bg-[#fee500] hover:bg-[#fdd000] text-[#191919] font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center space-x-2"
              >
                <LogIn size={13} />
                <span>카카오 1초 간편 로그인</span>
              </button>
            )}
          </div>

        </div>
      </header>

      {/* 3. Main Stage Container */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 md:px-8 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22 }}
          >
            {activeTab === "journal" && (
              <JournalSection
                articles={articles}
                onLikeArticle={handleLikeArticle}
                onKakaoShare={triggerKakaoShare}
                user={user}
                refreshArticles={fetchArticles}
              />
            )}

            {activeTab === "platform" && (
              <PlatformSection
                onPublishArticle={handlePublishArticle}
                openImageGenerator={() => setActiveTab("advertiser")}
                lastGeneratedImage={lastGeneratedImage}
                user={user}
              />
            )}

            {activeTab === "advertiser" && (
              <AdvertiserSection onImageGenerated={handleImageGenerated} />
            )}

            {activeTab === "guide" && <AiGuideSection />}

            {activeTab === "rag" && <RagSection />}

            {activeTab === "admin" && (
              <AdminSection 
                stats={stats} 
                refreshStats={fetchStats} 
                articles={articles} 
                refreshArticles={fetchArticles}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* 4. Kakao login simulator modal */}
      <AnimatePresence>
        {showLoginModal && (
          <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-sm w-full p-6 text-center border border-stone-100 shadow-2xl relative"
            >
              <div className="bg-[#fee500] text-[#191919] p-4 rounded-t-3xl -mx-6 -mt-6 flex items-center justify-center space-x-2">
                <Compass size={24} className="text-[#191919] animate-spin-slow" />
                <span className="font-serif font-black tracking-wider text-base">JEJU KAKAO LOGIN</span>
              </div>

              <div className="space-y-4 py-6">
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto text-amber-600">
                  <Award size={28} className="animate-pulse" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-base text-stone-900">제주매거진 회원가입 & 로그인</h3>
                  <p className="text-xs text-stone-500 leading-relaxed">
                    카카오톡 계정 1초 연동으로 제주의 숨겨진 맛집 지도 저장, 인공지능 여정 공유, 프리미엄 아티클 댓글 작성이 즉시 활성화됩니다.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <button
                  onClick={handleKakaoLoginSimulate}
                  className="w-full bg-[#fee500] hover:bg-[#fdd000] text-[#191919] font-black text-xs py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center space-x-2"
                >
                  <LogIn size={14} />
                  <span>카카오톡 계정으로 간편 시작</span>
                </button>
                <button
                  onClick={() => setShowLoginModal(false)}
                  className="w-full border border-stone-200 hover:bg-stone-50 text-stone-500 font-bold text-xs py-3.5 rounded-xl transition-colors"
                >
                  취소하기
                </button>
              </div>

              <p className="text-[10px] text-stone-400 mt-4 leading-normal">
                개인 정보는 안전하게 암호화 보관되며, 가이드 서비스 이용을 위한 목적 외에는 절대로 사용되지 않습니다.
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. Kakao Sharing simulator modal (Highly visual bespoke layout) */}
      <AnimatePresence>
        {showShareModal && sharingArticle && (
          <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-[#bacdbe] rounded-3xl max-w-md w-full overflow-hidden shadow-2xl relative border border-emerald-900/10"
            >
              {/* Fake Kakao Chatroom Header */}
              <div className="bg-[#a9bdad] px-4 py-3 flex items-center justify-between text-[#3d493f]">
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-bold bg-[#8ea092] text-white px-2 py-0.5 rounded-md font-mono">My Talk</span>
                  <span className="text-xs font-bold font-serif">제주매거진 감성 링크 전송</span>
                </div>
                <button 
                  onClick={() => setShowShareModal(false)}
                  className="text-xs font-bold hover:text-stone-900 bg-white/20 px-2.5 py-1 rounded-lg transition-colors"
                >
                  닫기
                </button>
              </div>

              {/* Chatroom Main area */}
              <div className="p-4 space-y-4 max-h-[480px] overflow-y-auto">
                <p className="text-[10px] text-emerald-900/60 font-mono text-center">오후 12:30 • 카카오 링크 발송 성공 시뮬레이션</p>

                {/* Simulated Shared Bubble Card */}
                <div className="flex items-start space-x-2">
                  <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center text-stone-950 font-bold text-xs shrink-0 shadow-sm font-serif">
                    귤
                  </div>
                  <div className="max-w-[85%]">
                    <span className="text-[10px] text-stone-700 block mb-0.5">제주매거진 오피셜</span>
                    <div className="bg-white rounded-2xl rounded-tl-none overflow-hidden shadow-sm border border-stone-200/40">
                      
                      {/* Image cover */}
                      <div className="h-44 relative bg-stone-100">
                        <img 
                          src={sharingArticle.imageUrl} 
                          alt="shared" 
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute top-2 left-2 bg-stone-950/80 text-white text-[9px] px-2 py-0.5 rounded font-mono">
                          {sharingArticle.categoryKo}
                        </span>
                      </div>

                      {/* Content block */}
                      <div className="p-4 space-y-2">
                        <h4 className="font-serif font-bold text-sm text-stone-900 line-clamp-1">
                          {sharingArticle.title}
                        </h4>
                        <p className="text-[11px] text-stone-500 leading-relaxed line-clamp-2">
                          {sharingArticle.excerpt}
                        </p>
                        <div className="text-[10px] text-stone-400 font-mono flex items-center space-x-2 pt-1 border-t border-stone-100">
                          <span>글: {sharingArticle.author}</span>
                          <span>•</span>
                          <span>읽는시간: {sharingArticle.readTime}</span>
                        </div>
                      </div>

                      {/* Fake Quick CTA */}
                      <div className="bg-stone-50 border-t border-stone-100 py-3 text-center">
                        <span className="text-[10.5px] font-bold text-amber-600 hover:underline cursor-pointer flex items-center justify-center gap-1">
                          <span>매거진 저널에서 기사 전문 읽기</span>
                          <Compass size={11} />
                        </span>
                      </div>

                    </div>
                  </div>
                </div>

                {/* Simulation success feedback */}
                <div className="bg-white/80 border border-emerald-800/10 rounded-2xl p-4 text-center text-xs space-y-2 max-w-xs mx-auto shadow-sm">
                  <p className="font-bold text-emerald-900">✨ 카카오톡 공유 API 모사 기능</p>
                  <p className="text-[10px] text-emerald-800 leading-relaxed">
                    실제 비즈니스 환경에서는 Kakao SDK를 이용해 지정 템플릿 형태로 사용자의 친구 혹은 단톡방에 직접 감성 카드를 보낼 수 있습니다.
                  </p>
                </div>
              </div>

              {/* Chat Input Bar */}
              <div className="bg-white/95 border-t border-emerald-900/10 p-3 flex items-center justify-between gap-2 shrink-0">
                <span className="text-[11px] text-stone-400">카카오톡 전송 시뮬레이션 활성화 완료</span>
                <button 
                  onClick={() => setShowShareModal(false)}
                  className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-[11px] px-4 py-2 rounded-xl transition-colors shrink-0"
                >
                  확인 완료
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 6. Exquisite Footer */}
      <footer className="border-t border-stone-200/60 bg-white py-12 px-4 md:px-8 text-center text-stone-400 text-xs shrink-0">
        <div className="max-w-7xl mx-auto space-y-5">
          <p className="font-serif font-bold text-stone-800 tracking-wider">JEJU MAGAZINE CO. LTD</p>
          <p className="max-w-lg mx-auto leading-relaxed text-[11px] text-stone-500 font-sans">
            제주특별자치도 제주시 평대리 가스트로노미 밸리 • 라이선스 제 2026-JEJU-09A호 • 관광업 제휴 및 보도 자료 문의 메일: <span className="underline font-mono">hyeonw213@gmail.com</span> • © 2026 Jeju Magazine. All rights reserved.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-[10.5px] font-mono font-bold text-stone-500 pt-2 uppercase tracking-widest">
            <span className="hover:text-stone-900 cursor-pointer">이용약관</span>
            <span>•</span>
            <span className="hover:text-stone-900 cursor-pointer">개인정보처리방침</span>
            <span>•</span>
            <span className="hover:text-stone-900 cursor-pointer">광고 제휴 데스크</span>
            <span>•</span>
            <span className="hover:text-stone-900 cursor-pointer" onClick={() => setActiveTab("admin")}>통합 어드민 대시보드</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
