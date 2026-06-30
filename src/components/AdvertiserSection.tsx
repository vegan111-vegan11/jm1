import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, Image as ImageIcon, CheckCircle2, AlertCircle, FileText, Send, Loader2 } from "lucide-react";

interface AdvertiserSectionProps {
  onImageGenerated: (url: string) => void;
}

export default function AdvertiserSection({ onImageGenerated }: AdvertiserSectionProps) {
  const [activeSubTab, setActiveSubTab] = useState<"partnership" | "generator">("partnership");

  // Partnership Proposal states
  const [companyName, setCompanyName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [email, setEmail] = useState("");
  const [adType, setAdType] = useState("Banner");
  const [message, setMessage] = useState("");
  const [proposalStatus, setProposalStatus] = useState<"idle" | "success" | "error">("idle");

  // AI Ad Image Generator states
  const [imagePrompt, setImagePrompt] = useState("");
  const [imageSize, setImageSize] = useState<"1K" | "2K" | "4K">("1K");
  const [aspectRatio, setAspectRatio] = useState<"1:1" | "16:9" | "9:16">("16:9");
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  const handleProposalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName || !contactPerson || !email) {
      setProposalStatus("error");
      return;
    }

    try {
      const response = await fetch("/api/advertisers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName,
          contactPerson,
          email,
          adType,
          message
        })
      });

      const data = await response.json();
      if (data.success) {
        setProposalStatus("success");
        setCompanyName("");
        setContactPerson("");
        setEmail("");
        setMessage("");
      } else {
        setProposalStatus("error");
      }
    } catch {
      setProposalStatus("error");
    }
  };

  const handleGenerateImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imagePrompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setGenError(null);
    setGeneratedImageUrl(null);

    try {
      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: imagePrompt,
          size: imageSize,
          aspectRatio
        })
      });

      const data = await response.json();
      if (data.success) {
        setGeneratedImageUrl(data.image);
        onImageGenerated(data.image); // Send to App parent to share with write tab
      } else {
        throw new Error(data.message || "이미지 생성 오류");
      }
    } catch (err: any) {
      console.error(err);
      setGenError("AI 광고 시안 생성 중 오류가 발생했습니다. 키 유효성이나 제한 상태를 확인해 주세요.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left Menu / Header Guide */}
      <div className="lg:col-span-3 bg-stone-50 border border-stone-100 p-6 rounded-2xl space-y-4">
        <h3 className="text-xs font-bold tracking-[0.2em] text-stone-400 font-display">
          ADVERTISER CENTER
        </h3>
        <p className="text-stone-500 text-xs leading-relaxed">
          제주 최고의 감성 매거진 플랫폼에서 귀사의 브랜드 가치를 고취시켜 보세요. 트렌디한 타깃 독자들과 완벽히 연결해 드립니다.
        </p>

        <div className="flex flex-col gap-1 pt-4">
          <button
            onClick={() => setActiveSubTab("partnership")}
            className={`flex items-center space-x-3 w-full px-4 py-3 rounded-xl text-xs font-semibold tracking-wider font-display transition-all ${
              activeSubTab === "partnership"
                ? "bg-stone-950 text-white shadow-md shadow-stone-900/10"
                : "text-stone-600 hover:bg-stone-100/80"
            }`}
          >
            <FileText size={14} />
            <span>광고 제휴 신청</span>
          </button>

          <button
            onClick={() => setActiveSubTab("generator")}
            className={`flex items-center space-x-3 w-full px-4 py-3 rounded-xl text-xs font-semibold tracking-wider font-display transition-all ${
              activeSubTab === "generator"
                ? "bg-stone-950 text-white shadow-md shadow-stone-900/10"
                : "text-stone-600 hover:bg-stone-100/80"
            }`}
          >
            <Sparkles size={14} />
            <span>AI 광고 시안 생성기</span>
          </button>
        </div>
      </div>

      {/* Right Main Content Panel */}
      <div className="lg:col-span-9 bg-white border border-stone-100 rounded-3xl p-6 md:p-8 min-h-[500px]">
        {activeSubTab === "partnership" && (
          <div className="space-y-8">
            <div>
              <h2 className="text-xl md:text-2xl font-serif font-bold text-stone-900 mb-2">
                광고 & 브랜드 파트너십 안내
              </h2>
              <p className="text-stone-500 text-xs">
                제주 감성 콘텐츠와 자연스럽게 어우러지는 네이티브 애드 솔루션으로 탁월한 마케팅 성과를 보장합니다.
              </p>
            </div>

            {/* Showcase Ads Options */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="border border-stone-100 p-5 rounded-2xl bg-stone-50/30">
                <span className="text-[10px] text-amber-600 font-bold tracking-wider font-mono">SPONSORED</span>
                <h4 className="font-serif font-bold text-sm text-stone-800 mt-1 mb-2">기획 네이티브 애드</h4>
                <p className="text-[11px] text-stone-500 leading-relaxed">
                  전문 에디터가 직접 방문하여 고품격 스토리와 고해상도 화보를 활용해 매거진 기사 형태로 노출합니다.
                </p>
              </div>

              <div className="border border-stone-100 p-5 rounded-2xl bg-stone-50/30">
                <span className="text-[10px] text-amber-600 font-bold tracking-wider font-mono">BANNER</span>
                <h4 className="font-serif font-bold text-sm text-stone-800 mt-1 mb-2">프리미엄 지면 배너</h4>
                <p className="text-[11px] text-stone-500 leading-relaxed">
                  독자들의 시선이 집중되는 메인 저널 및 상세 아티클 하단에 세련된 비주얼 배너를 게재합니다.
                </p>
              </div>

              <div className="border border-stone-100 p-5 rounded-2xl bg-stone-50/30">
                <span className="text-[10px] text-amber-600 font-bold tracking-wider font-mono">PARTNER PIN</span>
                <h4 className="font-serif font-bold text-sm text-stone-800 mt-1 mb-2">추천 로컬 플레이스</h4>
                <p className="text-[11px] text-stone-500 leading-relaxed">
                  제주 AI 여행 가이드 추천 시스템에 파트너 업장으로 등록되어, 맞춤형 명소 추천 시 우선 제안됩니다.
                </p>
              </div>
            </div>

            {/* Proposal Form */}
            <div className="border-t border-stone-100 pt-8 space-y-5">
              <h3 className="font-serif font-bold text-lg text-stone-900">제휴 제안서 제출하기</h3>

              {proposalStatus === "success" ? (
                <div className="bg-emerald-50 text-emerald-700 p-6 rounded-2xl text-center space-y-2 border border-emerald-100">
                  <CheckCircle2 size={32} className="mx-auto text-emerald-500" />
                  <h4 className="font-bold text-sm">성공적으로 제휴 제안서가 등록되었습니다!</h4>
                  <p className="text-xs">담당 매니저가 내용을 상세히 검토한 뒤 기재하신 이메일로 24시간 이내 연락해 드립니다.</p>
                </div>
              ) : (
                <form onSubmit={handleProposalSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-stone-500 tracking-wider">회사명 / 브랜드명</label>
                      <input
                        type="text"
                        required
                        placeholder="예: 평대 하우스"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="w-full bg-stone-50/50 border border-stone-100 rounded-xl px-4 py-3 text-xs focus:bg-white focus:ring-1 focus:ring-stone-950 focus:outline-none transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-stone-500 tracking-wider">제휴 광고 유형</label>
                      <select
                        value={adType}
                        onChange={(e) => setAdType(e.target.value)}
                        className="w-full bg-stone-50/50 border border-stone-100 rounded-xl px-4 py-3 text-xs focus:bg-white focus:ring-1 focus:ring-stone-950 focus:outline-none transition-all"
                      >
                        <option value="Banner">브랜드 지면 배너 광고</option>
                        <option value="Sponsored">기획 네이티브 애드 (Sponsored)</option>
                        <option value="Pin">AI 가이드 파트너 명소 등록</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-stone-500 tracking-wider">담당자 성함</label>
                      <input
                        type="text"
                        required
                        placeholder="이름 입력"
                        value={contactPerson}
                        onChange={(e) => setContactPerson(e.target.value)}
                        className="w-full bg-stone-50/50 border border-stone-100 rounded-xl px-4 py-3 text-xs focus:bg-white focus:ring-1 focus:ring-stone-950 focus:outline-none transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-stone-500 tracking-wider">회신 연락 메일</label>
                      <input
                        type="email"
                        required
                        placeholder="brand@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-stone-50/50 border border-stone-100 rounded-xl px-4 py-3 text-xs focus:bg-white focus:ring-1 focus:ring-stone-950 focus:outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-stone-500 tracking-wider">상세 제안 및 요청 사항</label>
                    <textarea
                      rows={4}
                      placeholder="원하시는 예산 규모, 진행하고자 하는 제품 설명이나 프로모션 일정을 알려주시면 더욱 매끄러운 파트너 매칭이 가능합니다."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full bg-stone-50/50 border border-stone-100 rounded-xl p-4 text-xs focus:bg-white focus:ring-1 focus:ring-stone-950 focus:outline-none transition-all leading-relaxed"
                    />
                  </div>

                  {proposalStatus === "error" && (
                    <div className="flex items-center space-x-2 bg-rose-50 text-rose-600 p-4 rounded-xl text-xs">
                      <AlertCircle size={16} />
                      <span>기재란을 정확히 작성해 주세요.</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full bg-stone-950 hover:bg-stone-800 text-white font-semibold font-display text-xs tracking-wider py-4 rounded-xl transition-colors shadow-lg flex items-center justify-center space-x-2"
                  >
                    <span>제안 신청하기</span>
                    <Send size={13} />
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {activeSubTab === "generator" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl md:text-2xl font-serif font-bold text-stone-900 flex items-center gap-2">
                <span>AI 광고 및 기사 화보 시안 생성기</span>
                <Sparkles size={16} className="text-amber-500" />
              </h2>
              <p className="text-stone-500 text-xs">
                Gemini 3 Pro의 파워로 잡지에 삽입될 것 같은 트렌디하고 아름다운 제주 테마 화보 및 광고 비주얼 시안을 생성합니다.
              </p>
            </div>

            <form onSubmit={handleGenerateImage} className="space-y-5 pt-2">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-stone-500 tracking-wider">시안 이미지 연출 프롬프트 (세부 묘사할수록 예쁜 결과가 나와요)</label>
                <textarea
                  required
                  rows={3}
                  placeholder="예: 돌담에 핀 가을 수국과 그 옆에 아늑하게 올려진 한라봉 허브차 에이드 유리컵, 멀리 아스라이 보이는 비양도 바다, 따스한 아침 햇살과 긴 그림자"
                  value={imagePrompt}
                  onChange={(e) => setImagePrompt(e.target.value)}
                  className="w-full bg-stone-50/50 border border-stone-100 rounded-xl p-4 text-xs focus:bg-white focus:ring-1 focus:ring-stone-950 focus:outline-none transition-all leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Resolution Configurator (1K, 2K, 4K as requested) */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-stone-500 tracking-wider">해상도 밀도 규격 (Size Affordance)</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["1K", "2K", "4K"] as const).map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setImageSize(size)}
                        className={`py-2 rounded-xl text-xs font-semibold font-mono border transition-all ${
                          imageSize === size
                            ? "bg-stone-950 text-white border-stone-950 shadow-sm"
                            : "bg-white text-stone-500 border-stone-200 hover:bg-stone-50"
                        }`}
                      >
                        {size}
                        <span className="block text-[8px] opacity-75">
                          {size === "1K" ? "1024px" : size === "2K" ? "2048px" : "4096px"}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Aspect Ratio Configurator */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-stone-500 tracking-wider">화면 종횡비 규격 (Aspect Ratio)</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["1:1", "16:9", "9:16"] as const).map((ratio) => (
                      <button
                        key={ratio}
                        type="button"
                        onClick={() => setAspectRatio(ratio)}
                        className={`py-2 rounded-xl text-xs font-semibold font-mono border transition-all ${
                          aspectRatio === ratio
                            ? "bg-stone-950 text-white border-stone-950 shadow-sm"
                            : "bg-white text-stone-500 border-stone-200 hover:bg-stone-50"
                        }`}
                      >
                        {ratio}
                        <span className="block text-[8px] opacity-75">
                          {ratio === "1:1" ? "정사각형 배너" : ratio === "16:9" ? "잡지 헤더" : "스토리 전면"}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {genError && (
                <div className="flex items-start space-x-2 bg-rose-50 text-rose-600 p-4 rounded-xl text-xs">
                  <AlertCircle size={15} className="mt-0.5 shrink-0" />
                  <span>{genError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isGenerating || !imagePrompt.trim()}
                className="w-full bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold font-display text-xs tracking-wider py-4 rounded-xl transition-colors shadow-lg flex items-center justify-center space-x-2 disabled:bg-stone-100 disabled:text-stone-400 disabled:shadow-none"
              >
                {isGenerating ? (
                  <>
                    <Loader2 size={15} className="animate-spin text-stone-900" />
                    <span>AI가 고화소 광학 렌더링 중...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={15} />
                    <span>GENERATE HIGH-FIDELITY VISION</span>
                  </>
                )}
              </button>
            </form>

            {/* Generated Image Preview & Application Shortcut */}
            <AnimatePresence>
              {isGenerating && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-stone-50 border border-stone-100/50 rounded-2xl p-10 text-center space-y-4"
                >
                  <Loader2 size={32} className="animate-spin mx-auto text-amber-500" />
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-stone-800">
                      최첨단 초거대 생성 모델 <span className="font-mono text-amber-600">gemini-3-pro-image</span>로 예술적 구도를 잡고 있습니다.
                    </p>
                    <p className="text-[10px] text-stone-400">
                      이 작업은 약 10~20초가량 소요될 수 있으며, 잡지 매체 전용 하이엔드 광원 필터가 자동으로 조절됩니다.
                    </p>
                  </div>
                </motion.div>
              )}

              {generatedImageUrl && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-4 pt-4 border-t border-stone-100"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-stone-400 font-mono font-bold uppercase">
                      GENERATED CONCEPT PREVIEW ({imageSize} / {aspectRatio})
                    </span>
                    <span className="bg-emerald-50 text-emerald-600 text-[10px] font-bold px-2 py-0.5 rounded">
                      성공적으로 렌더링됨
                    </span>
                  </div>

                  <div className="overflow-hidden rounded-2xl border border-stone-100 bg-stone-50 shadow-inner max-h-[500px] flex items-center justify-center relative">
                    <img
                      src={generatedImageUrl}
                      alt="Generated AI concept"
                      className="object-contain w-full h-full max-h-[480px]"
                    />
                  </div>

                  <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100/40 flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-stone-800">기사 발행 커버 연동 기능</p>
                      <p className="text-[10px] text-stone-500">
                        생성된 명품 시안이 에디터 기사 작성 페이지의 이미지 URL 입력창으로 완벽히 전송되었습니다!
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-amber-600 font-mono bg-white px-3 py-1.5 rounded-lg shadow-sm border border-amber-100 shrink-0">
                      커버 연동 완료
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
