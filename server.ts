import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));

// Initialize Gemini Client
// ALWAYS use process.env.GEMINI_API_KEY and set the User-Agent header to 'aistudio-build'
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// Mock Database / In-Memory Store
let articles = [
  {
    id: "art-1",
    title: "구좌읍 평대리 해변길의 아늑한 모카포트 드립커피 바",
    category: "Cafe",
    categoryKo: "카페 & 가스트로노미",
    author: "김지민 에디터",
    content: "제주 동쪽 구좌읍 평대리 해변을 따라 걷다 보면, 고요한 돌담집 한 구석에서 퍼지는 깊은 에스프레소 향을 만날 수 있습니다. 이곳은 화려한 머신 대신 클래식 모카포트와 손으로 직접 갈아낸 원두를 고집하는 '모카 포레스트'입니다. 제주의 거친 바닷바람을 맞고 난 뒤 마시는 따뜻한 모카포트 밀크티와 직접 재배한 제철 무화과 타르트는 지친 여행자에게 오감의 휴식을 선사합니다. 통창 너머로 부서지는 파도를 보며 커피 한 잔의 서사를 즐겨보세요.",
    excerpt: "제주 동쪽의 조용한 바닷가 마을 평대리, 돌담 집 속 아날로그 커피 향을 고집하는 에디터의 최애 모카포트 커피 맛집.",
    imageUrl: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1200&q=80",
    readTime: "3분",
    likes: 24,
    views: 312,
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(), // 4 hours ago
    tags: ["구좌읍", "평대리", "모카포트", "감성카페"],
    places: [
      { name: "모카 포레스트", address: "제주 제주시 구좌읍 해맞이해안로 1024", tip: "주차는 해안도로 갓길에 편하게 대실 수 있고, 매주 수요일은 정기 휴무입니다." }
    ],
    comments: [
      { id: "com-1", author: "바람의제주", text: "여기 지난 여름에 가봤는데 모카포트 끓을 때 나는 소리랑 커피 향이 정말 기가 막힙니다..", createdAt: new Date(Date.now() - 3600000 * 3).toISOString() }
    ]
  },
  {
    id: "art-2",
    title: "차귀도 노을을 바라보는 친환경 제로웨이스트 한옥 스테이",
    category: "Stay",
    categoryKo: "로컬 스테이",
    author: "박서연 에디터",
    content: "서쪽 끝 자락, 고산리 차귀도 포구와 인접한 곳에 위치한 '온하루' 스테이는 제주의 전통 돌한옥을 재생하여 만든 친환경 숙소입니다. 건축 과정부터 폐자재를 최소화하고 황토와 참숯, 편백나무 등 자연에서 온 재료들만을 사용했습니다. 어메니티 역시 고체 샴푸 바와 대나무 칫솔, 제주 녹차로 만든 입욕제를 준비하여 제로웨이스트 라이프스타일을 몸소 체험할 수 있도록 돕습니다. 해질 무렵, 툇마루에 앉아 차귀도 너머로 붉게 타들어가는 제주의 노을을 바라보면 문득 우주의 평화가 찾아옵니다.",
    excerpt: "제주의 숨겨진 노을 명소 차귀도 인근, 자연을 훼손하지 않고 숨쉬는 온전한 휴식을 제공하는 제로웨이스트 재생 돌한옥 독채.",
    imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
    readTime: "5분",
    likes: 42,
    views: 489,
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(), // 1 day ago
    tags: ["차귀도", "친환경스테이", "한옥스테이", "제로웨이스트"],
    places: [
      { name: "온하루 스테이", address: "제주 제주시 한경면 고산로4길 12", tip: "하루에 단 한 팀만 받는 온전한 독채이며, 텀블러 지참 시 환대 웰컴 티를 직접 우려 주십니다." }
    ],
    comments: [
      { id: "com-2", author: "슬로우트래블", text: "플라스틱이 없는 욕실이라니.. 진짜 의미있고 노을 뷰가 환상적이네요.", createdAt: new Date(Date.now() - 3600000 * 20).toISOString() }
    ]
  },
  {
    id: "art-3",
    title: "사색가를 위한 처마 밑 독립서점 '안덕서가'",
    category: "Culture",
    categoryKo: "문화 & 예술",
    author: "최도현 객원기자",
    content: "관광지의 번잡함에서 벗어나 서귀포 안덕면의 한적한 감귤밭 사잇길로 들어가면, 동양적인 선과 여백의 미가 돋보이는 모던 한옥 '안덕서가'가 서 있습니다. 이곳은 단순한 책방을 넘어 한 명의 손님을 위한 사색의 자리를 판매합니다. 주인장이 엄선한 철학, 로컬 라이프, 식물 도감들이 정갈하게 꽂혀 있으며, 처마 끝에 매달린 풍경 소리와 제주의 바람 소리가 완벽한 백색소음을 이룹니다. 서가에서 추천하는 시집 한 권과 함께 따뜻한 메밀차를 마시며 나 자신에게 집중하는 시간을 가져보세요.",
    excerpt: "안덕면 감귤밭 깊은 곳, 사색과 비움을 위한 프리미엄 아날로그 독립 책방. 나만의 인생 책을 만나는 특별한 공간.",
    imageUrl: "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=1200&q=80",
    readTime: "4분",
    likes: 18,
    views: 243,
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(), // 2 days ago
    tags: ["안덕면", "독립서점", "사색의시간", "로컬책방"],
    places: [
      { name: "안덕서가", address: "제주 서귀포시 안덕면 사계리 456-1", tip: "사전 예약제로만 운영되는 고요한 독서 전용 서가입니다. 카메라 촬영 시 셔터음은 삼가는 에티켓이 필요합니다." }
    ],
    comments: [
      { id: "com-3", author: "북러버제주", text: "여백의 미라는 단어가 가장 잘 어울리는 비밀 기지 같은 서점이네요.", createdAt: new Date(Date.now() - 3600000 * 40).toISOString() }
    ]
  },
  {
    id: "art-4",
    title: "함덕 무지개 바다 투명카약과 해양 쓰레기 업사이클링 클래스",
    category: "Activity",
    categoryKo: "액티비티 & 트렌드",
    author: "이수아 에디터",
    content: "제주 함덕의 서우봉 아래 에메랄드빛 투명한 바다를 온몸으로 느끼는 최고의 방법은 투명카약입니다. 하지만 제주 해양레저 '에코패들'은 한 발 더 나아갑니다. 카약을 타고 바다를 만끽함과 동시에 바다 위에 부유하는 플라스틱이나 해양 쓰레기를 수집하는 '비치코밍 투어'를 결합했습니다. 투어를 마친 뒤 수거한 바다 유리나 알록달록한 폐플라스틱 조각들을 녹이고 프레스 가공하여 나만의 키링이나 마그넷 등 독창적인 기념품을 만드는 작은 클래스도 열립니다. 바다를 살리는 착한 액티비티에 동참해보세요.",
    excerpt: "짜릿한 투명 카약 서핑과 해양 정화 활동을 결합한 에코 액티비티. 바다에서 구한 업사이클링 키링 제작 클래스 포함.",
    imageUrl: "https://images.unsplash.com/photo-1506929562872-bb421503ef21?auto=format&fit=crop&w=1200&q=80",
    readTime: "4분",
    likes: 31,
    views: 395,
    createdAt: new Date(Date.now() - 3600000 * 72).toISOString(), // 3 days ago
    tags: ["함덕서우봉", "투명카약", "업사이클링", "에코액티비티"],
    places: [
      { name: "에코패들 함덕점", address: "제주 제주시 조천읍 함덕리 24", tip: "밀물 썰물 물때에 따라 투어 시간이 바뀌므로 반드시 전화 예약 후 이용하시는 것을 추천합니다." }
    ],
    comments: [
      { id: "com-4", author: "에코라이프", text: "단순히 노는 것을 넘어서 제주 환경에 조금이나마 보탬이 된다는 게 매력적이에요.", createdAt: new Date(Date.now() - 3600000 * 60).toISOString() }
    ]
  }
];

// List of officially registered active editors/journalists
let registeredEditors = [
  { id: "reg-ed-1", name: "김지민 에디터", email: "jimin.jeju@jejumagazine.com", specialty: "Gastronomy", avatar: "🍊", status: "Active", bio: "평대리 당근밭과 구좌 모카포트 드립 바의 정수를 취재하는 제주 토박이 에디터입니다.", articlesCount: 1, likesReceived: 24, createdAt: new Date(Date.now() - 3600000 * 200).toISOString() },
  { id: "reg-ed-2", name: "박서연 에디터", email: "seoyeon.eco@jejumagazine.com", specialty: "Stay", avatar: "⛰️", status: "Active", bio: "차귀도와 협재 바다를 정화하고 제로웨이스트 스테이를 직접 탐방하는 친환경 에디터입니다.", articlesCount: 1, likesReceived: 42, createdAt: new Date(Date.now() - 3600000 * 180).toISOString() },
  { id: "reg-ed-3", name: "최도현 객원기자", email: "dohyeon.book@gmail.com", specialty: "Culture", avatar: "🌊", status: "Active", bio: "안덕면 처마 끝 서가를 사랑하는 독립 도서관 및 현대적 아키텍처 비평가입니다.", articlesCount: 1, likesReceived: 18, createdAt: new Date(Date.now() - 3600000 * 120).toISOString() },
  { id: "reg-ed-4", name: "이수아 에디터", email: "sua.eco@naver.com", specialty: "Activity", avatar: "🐴", status: "Active", bio: "함덕의 물때에 맞춰 바다 유리를 줍고 카약 노를 젓는 해양 업사이클 아카이버입니다.", articlesCount: 1, likesReceived: 31, createdAt: new Date(Date.now() - 3600000 * 90).toISOString() }
];

let advertiserInquiries: any[] = [
  {
    id: "adv-init-1",
    companyName: "성산 푸른귤 협동조합",
    contactPerson: "고창수 대표",
    email: "gcs1102@daum.net",
    adType: "Sponsored",
    message: "푸른귤 에이드 신제품을 런칭하는데, 제주 동부지역 카페 에디터 특집 기사 본문에 네이티브 광고 형태로 협동조합 소개를 싣고 싶습니다.",
    status: "pending",
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString()
  },
  {
    id: "adv-init-2",
    companyName: "한림 해녀 밥상",
    contactPerson: "김말순 이사",
    email: "haenyeobabsang@naver.com",
    adType: "Banner",
    message: "제주 서부 한림읍 포구에 신규 개업한 해녀 해산물 식당 브랜드 지면 배너 광고 단가 및 게재 스케줄을 문의합니다.",
    status: "approved",
    createdAt: new Date(Date.now() - 3600000 * 36).toISOString()
  }
];

let editorApplications: any[] = [
  {
    id: "ed-init-1",
    name: "강하랑",
    email: "harang.jeju@gmail.com",
    bio: "제주 이주 5년 차 디지털 노마드 작가입니다. 제주 서귀포 곳곳의 유기농 텃밭, 대안 공동체 한옥, 제주 전통 장인들을 1년간 쫓아다니며 브런치와 개인 웹진에 기재한 이력이 있습니다.",
    specialty: "Stay",
    status: "applied",
    createdAt: new Date(Date.now() - 3600000 * 8).toISOString()
  }
];

// API: Get Articles
app.get("/api/articles", (req, res) => {
  res.json({ success: true, articles });
});

// API: Add Article (Journalist publish with tags and places)
app.post("/api/articles", (req, res) => {
  try {
    const { title, category, categoryKo, author, content, excerpt, imageUrl, readTime, tags, places } = req.body;
    if (!title || !content || !author) {
      return res.status(400).json({ success: false, message: "Required fields are missing." });
    }

    const newArticle = {
      id: `art-${Date.now()}`,
      title,
      category: category || "General",
      categoryKo: categoryKo || "일반 기사",
      author,
      content,
      excerpt: excerpt || (content.substring(0, 100) + "..."),
      imageUrl: imageUrl || "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1200&q=80",
      readTime: readTime || "3분",
      likes: 0,
      views: Math.floor(Math.random() * 50) + 25, // Randomized initial views
      createdAt: new Date().toISOString(),
      tags: tags || [],
      places: places || [],
      comments: []
    };

    articles.unshift(newArticle);

    // Increment journalist's article count if registered
    const editor = registeredEditors.find(e => e.name === author || author.includes(e.name) || e.name.includes(author));
    if (editor) {
      editor.articlesCount += 1;
    }

    res.json({ success: true, article: newArticle });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// API: Update Article (Journalist edit with tags and places)
app.put("/api/articles/:id", (req, res) => {
  try {
    const { id } = req.params;
    const { title, category, categoryKo, author, content, excerpt, imageUrl, readTime, tags, places } = req.body;

    const idx = articles.findIndex(a => a.id === id);
    if (idx === -1) {
      return res.status(404).json({ success: false, message: "Article not found." });
    }

    articles[idx] = {
      ...articles[idx],
      title: title || articles[idx].title,
      category: category || articles[idx].category,
      categoryKo: categoryKo || articles[idx].categoryKo,
      author: author || articles[idx].author,
      content: content || articles[idx].content,
      excerpt: excerpt || articles[idx].excerpt,
      imageUrl: imageUrl || articles[idx].imageUrl,
      readTime: readTime || articles[idx].readTime,
      tags: tags || articles[idx].tags || [],
      places: places || articles[idx].places || []
    };

    res.json({ success: true, article: articles[idx] });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// API: Write comment & AI Auto reader comments simulation using Gemini
app.post("/api/articles/:id/comments", async (req, res) => {
  try {
    const { id } = req.params;
    const { author, text } = req.body;
    if (!author || !text) {
      return res.status(400).json({ success: false, message: "Name and comment text are required." });
    }

    const articleIndex = articles.findIndex((a) => a.id === id);
    if (articleIndex === -1) {
      return res.status(404).json({ success: false, message: "Article not found." });
    }

    const mainComment = {
      id: `com-u-${Date.now()}`,
      author,
      text,
      createdAt: new Date().toISOString()
    };

    if (!articles[articleIndex].comments) {
      articles[articleIndex].comments = [];
    }

    articles[articleIndex].comments!.push(mainComment);

    // AI reader response simulation triggers using Gemini 3.5-flash!
    // Let's generate 1 or 2 virtual readers comments responding to this or commenting further about this article!
    let aiComments: any[] = [];
    try {
      const prompt = `기사 제목: "${articles[articleIndex].title}"
기사 요약: "${articles[articleIndex].excerpt}"
최근 독자 댓글: "${author}: ${text}"

당신은 제주매거진의 가상 독자 2명입니다. 이 기사와 최근 독자 댓글을 읽고, 각각 개성 있고 감성 넘치는 한국어 댓글 1개씩을 작성해 주세요.
댓글은 한 문장 내지 두 문장으로 자연스럽게 제주의 정서를 드러내야 하며, 닉네임과 함께 JSON 형식으로 출력하세요.
출력 스키마:
[
  {"author": "닉네임1", "text": "댓글 내용1"},
  {"author": "닉네임2", "text": "댓글 내용2"}
]
절대로 다른 텍스트는 덧붙이지 말고 JSON만 반환하세요.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseMimeType: "application/json"
        }
      });

      const responseText = response.text || "[]";
      const parsed = JSON.parse(responseText);
      if (Array.isArray(parsed)) {
        parsed.forEach((c: any, index: number) => {
          if (c.author && c.text) {
            articles[articleIndex].comments!.push({
              id: `com-ai-${Date.now()}-${index}`,
              author: `🍊 ${c.author}`,
              text: c.text,
              createdAt: new Date(Date.now() + (index + 1) * 2000).toISOString()
            });
          }
        });
      }
    } catch (err) {
      console.error("AI Comments Generation failed, falling back to basic Mocks:", err);
      // Fallback
      articles[articleIndex].comments!.push({
        id: `com-mock-1`,
        author: "🍊 소박한제주",
        text: "댓글 보고 기사 한 번 더 정독했습니다. 이번 주말 여행지로 콕 찝고 갑니다!",
        createdAt: new Date().toISOString()
      });
    }

    res.json({ success: true, comments: articles[articleIndex].comments });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// API: Translate full Article content on-the-fly using Gemini
app.post("/api/articles/translate", async (req, res) => {
  try {
    const { title, content, targetLanguage } = req.body;
    if (!content || !targetLanguage) {
      return res.status(400).json({ success: false, message: "Content and targetLanguage are required." });
    }

    const languageNames: Record<string, string> = {
      en: "English",
      ja: "Japanese",
      zh: "Simplified Chinese"
    };

    const targetLangName = languageNames[targetLanguage] || "English";

    const prompt = `Please act as a professional tourism and editorial translator.
Translate the following Korean article title and content into gorgeous, highly professional, flowy and modern ${targetLangName}. Preserve the beautiful emotional sentiment, cultural nuances of Jeju island, and editorial style perfectly.

Original Title: ${title}
Original Content: ${content}

Provide your translation as a raw JSON with "translatedTitle" and "translatedContent" keys. No extra markdown codeblocks outside the JSON format.
JSON schema:
{
  "translatedTitle": "...",
  "translatedContent": "..."
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        temperature: 0.3
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json({
      success: true,
      translatedTitle: parsed.translatedTitle || title,
      translatedContent: parsed.translatedContent || content
    });
  } catch (error: any) {
    console.error("Translation Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// API: Delete Article (Admin)
app.delete("/api/articles/:id", (req, res) => {
  try {
    const { id } = req.params;
    const initialLen = articles.length;
    articles = articles.filter(a => a.id !== id);

    if (articles.length === initialLen) {
      return res.status(404).json({ success: false, message: "Article not found." });
    }
    res.json({ success: true, message: "Article deleted successfully." });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// API: Update Advertiser status (Admin approval)
app.post("/api/admin/advertisers/:id/status", (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'approved' | 'rejected' | 'pending'

    const idx = advertiserInquiries.findIndex(a => a.id === id);
    if (idx === -1) {
      return res.status(404).json({ success: false, message: "Inquiry not found." });
    }

    advertiserInquiries[idx].status = status || "approved";
    res.json({ success: true, inquiry: advertiserInquiries[idx] });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// API: Update Editor status (Admin approval) and register them as official journalists
app.post("/api/admin/editors/:id/status", (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'approved' | 'rejected' | 'applied'

    const idx = editorApplications.findIndex(e => e.id === id);
    if (idx === -1) {
      return res.status(404).json({ success: false, message: "Application not found." });
    }

    editorApplications[idx].status = status || "approved";

    // If approved, add to registeredEditors roster
    if (status === "approved") {
      const app = editorApplications[idx];
      const avatars = ["🍊", "🌊", "⛰️", "🐚", "🐴"];
      const randomAvatar = avatars[Math.floor(Math.random() * avatars.length)];
      
      const newEditor = {
        id: `reg-ed-${Date.now()}`,
        name: `${app.name} 에디터`,
        email: app.email,
        specialty: app.specialty || "General",
        avatar: randomAvatar,
        status: "Active",
        bio: app.bio,
        articlesCount: 0,
        likesReceived: 0,
        createdAt: new Date().toISOString()
      };
      
      // Prevent duplicates
      if (!registeredEditors.some(re => re.email === app.email)) {
        registeredEditors.unshift(newEditor);
      }
    }

    res.json({ success: true, application: editorApplications[idx] });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// API: Get Registered Journalists (Active List)
app.get("/api/admin/editors", (req, res) => {
  res.json({ success: true, editors: registeredEditors });
});

// API: Toggle Journalist active/on-hold status
app.post("/api/admin/editors/:id/toggle", (req, res) => {
  try {
    const { id } = req.params;
    const idx = registeredEditors.findIndex(e => e.id === id);
    if (idx === -1) {
      return res.status(404).json({ success: false, message: "Journalist not found." });
    }
    registeredEditors[idx].status = registeredEditors[idx].status === "Active" ? "On-Hold" : "Active";
    res.json({ success: true, editor: registeredEditors[idx] });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// API: Retire/Delete registered journalist
app.delete("/api/admin/editors/:id", (req, res) => {
  try {
    const { id } = req.params;
    registeredEditors = registeredEditors.filter(e => e.id !== id);
    res.json({ success: true, message: "Journalist retired successfully from active pool." });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// API: Gemini 3.5-flash AI Proofreading & SEO Keyword Extraction
app.post("/api/ai/proofread", async (req, res) => {
  try {
    const { title, content } = req.body;
    if (!content) {
      return res.status(400).json({ success: false, message: "Content to proofread is required." });
    }

    const prompt = `제주 로컬 잡지 기사를 교정, 퇴고하고 SEO 분석을 해주는 수석 에디터 역할을 맡으세요.
사용자가 작성한 기사의 가안을 검토하여:
1. 맞춤법과 띄어쓰기를 완벽하게 교정한 다듬어진 세련된 감성 한글 본문 (contentProofread)
2. 검색 유입이 잘 되고 시선을 끄는 감성적이고 세련된 수정 헤드라인 제목 (titleSuggested)
3. 기사 내용에서 자동 추출한 어울리는 SEO 인스타그램 스타일 한글 해시태그 4개 (tagsSuggested - 배열 형식)
4. 어떤 부분을 중점적으로 왜 교정했는지에 대한 짤막하고 전문적인 2줄짜리 에디터 피드백 (feedback)

를 분석하여 아래 JSON 포맷으로 응답하세요. 잡담은 절대 출력하지 말고 정확히 JSON만 반환해 주세요.

---
원문 제목: ${title || "미지정"}
원문 본문: ${content}
---

JSON 출력 스키마:
{
  "titleSuggested": "세련된 헤드라인 추천",
  "contentProofread": "교정된 본문 텍스트",
  "tagsSuggested": ["키워드1", "키워드2", "키워드3", "키워드4"],
  "feedback": "에디터 퇴고 코멘트 요약"
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        temperature: 0.3
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json({
      success: true,
      result: parsed
    });
  } catch (error: any) {
    console.error("AI Proofread error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// API: Multi-turn chat
app.post("/api/chat", async (req, res) => {
  try {
    const { messages, role } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ success: false, message: "Messages array is required." });
    }

    // Determine target model and system instruction based on role
    let systemInstruction = "";
    let targetModel = "gemini-3.5-flash"; // Default

    if (role === "travel-planner") {
      targetModel = "gemini-3.5-flash";
      systemInstruction = `당신은 제주의 숨겨진 보물 같은 명소, 힙한 로컬 카페, 친환경 숙소 등을 잘 아는 트렌디한 제주 여행 플래너이자 로컬 가이드입니다.
독자(사용자)의 성향에 맞춘 정성스럽고 감각적인 제주 여행 코스를 제안하고 추천해주세요.
가벼운 대화라도 제주의 감성과 따뜻한 환대 분위기가 묻어나오도록 한국어로 친근하고 우아하게 대답하세요.`;
    } else if (role === "seo-editor") {
      targetModel = "gemini-3.1-pro-preview"; // Complex tasks
      systemInstruction = `당신은 제주매거진(Jeju Magazine)의 수석 편집장이자 디지털 마케팅/SEO 전문가입니다.
사용자(기자 혹은 광고주)가 작성한 기사 기획안이나 글을 바탕으로, 검색 최적화가 잘 되는 세련된 제목 추천, 본문 구성 조언, 핵심 키워드 제안, 가독성 향상을 위한 피드백을 제공해주세요.
매우 세련되고 지적인 어조의 한국어로 대답하세요.`;
    } else if (role === "translator") {
      targetModel = "gemini-3.1-flash-lite"; // Fast tasks
      systemInstruction = `당신은 제주도를 방문한 글로벌 여행객들을 위한 초고속 번역가이자 언어 가이드입니다.
한국어, 영어, 일본어, 중국어 등 사용자가 요청하는 문장을 다른 언어로 즉시 번역해주고, 제주 현지에서 바로 쓸 수 있는 생생한 발음 팁이나 유용한 여행 회화를 제안합니다.
최대한 간결하고 명확하게 핵심 번역 결과만 초고속으로 대답하세요.`;
    }

    // Map message history to Gemini SDK parts format
    // Format: { role: 'user' | 'model', parts: [{ text: string }] }
    const formattedContents = messages.map((m: any) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.text }],
    }));

    const response = await ai.models.generateContent({
      model: targetModel,
      contents: formattedContents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    res.json({ success: true, text: response.text });
  } catch (error: any) {
    console.error("Gemini Chat Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// API: Convert text to speech (TTS)
app.post("/api/tts", async (req, res) => {
  try {
    const { text, voice } = req.body;
    if (!text) {
      return res.status(400).json({ success: false, message: "Text is required." });
    }

    const voiceName = voice || "Kore"; // 'Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text: `Say naturally and beautifully in Korean: ${text}` }] }],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      return res.status(500).json({ success: false, message: "Failed to generate TTS audio." });
    }

    res.json({ success: true, audio: base64Audio });
  } catch (error: any) {
    console.error("Gemini TTS Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// API: Generate Image (supports 1K, 2K, 4K)
app.post("/api/generate-image", async (req, res) => {
  try {
    const { prompt, size, aspectRatio } = req.body;
    if (!prompt) {
      return res.status(400).json({ success: false, message: "Prompt is required." });
    }

    // Map resolution: 1K (default), 2K, 4K
    const imageSize = size || "1K"; // '1K' | '2K' | '4K'
    const imageAspect = aspectRatio || "16:9"; // "1:1" | "3:4" | "4:3" | "9:16" | "16:9"

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-image-preview",
      contents: {
        parts: [{ text: `A modern, ultra-high-resolution, atmospheric professional editorial photograph of: ${prompt}. Elegant branding style suitable for a high-end travel magazine.` }],
      },
      config: {
        imageConfig: {
          aspectRatio: imageAspect,
          imageSize: imageSize,
        },
      },
    });

    let base64Image = "";
    const parts = response.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData) {
        base64Image = part.inlineData.data;
        break;
      }
    }

    if (!base64Image) {
      return res.status(500).json({ success: false, message: "No image was returned by Gemini." });
    }

    res.json({ success: true, image: `data:image/png;base64,${base64Image}` });
  } catch (error: any) {
    console.error("Gemini Image Gen Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// API: Advertiser Recruitment
app.post("/api/advertisers", (req, res) => {
  try {
    const { companyName, contactPerson, email, adType, message } = req.body;
    if (!companyName || !contactPerson || !email || !adType) {
      return res.status(400).json({ success: false, message: "Required fields are missing." });
    }

    const newInquiry = {
      id: `adv-${Date.now()}`,
      companyName,
      contactPerson,
      email,
      adType,
      message: message || "",
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    advertiserInquiries.unshift(newInquiry);
    res.json({ success: true, inquiry: newInquiry });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// API: Editor/Journalist Application
app.post("/api/editor-applications", (req, res) => {
  try {
    const { name, email, bio, specialty } = req.body;
    if (!name || !email || !bio || !specialty) {
      return res.status(400).json({ success: false, message: "Required fields are missing." });
    }

    const newApplication = {
      id: `ed-${Date.now()}`,
      name,
      email,
      bio,
      specialty,
      status: "applied",
      createdAt: new Date().toISOString(),
    };

    editorApplications.unshift(newApplication);
    res.json({ success: true, application: newApplication });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// API: Admin stats (for showcase)
app.get("/api/admin/stats", (req, res) => {
  res.json({
    success: true,
    stats: {
      articlesCount: articles.length,
      advertisersCount: advertiserInquiries.length,
      editorsCount: editorApplications.length,
      advertiserInquiries,
      editorApplications,
      registeredEditors
    }
  });
});

// --- RAG (Retrieval-Augmented Generation) Knowledge & Chat Section ---

// Premium static documents for RAG system
const staticDocuments = [
  {
    id: "doc-1",
    source: "제주 비경 도감 2026 가이드북",
    content: "제주 서부 차귀도 포구의 석양은 해질녘 바다 전체가 깊은 석류색으로 물드는 비경을 선사합니다. 차귀도는 제주의 무인도 중 가장 크며, 낚시 포인트로 유명하지만 비양도나 성산일출봉 못지않은 일몰 경관을 자랑합니다. 포구 앞 수월봉에서 내려다보는 지질 트레일과 당산봉 둘레길은 노을 감상에 최적화된 하이킹 명소입니다.",
    category: "서부 비경 / 일몰"
  },
  {
    id: "doc-2",
    source: "제주 비경 도감 2026 가이드북",
    content: "비 온 직후의 비자림은 수백 년 된 비자나무 잎사귀들이 피톤치드를 한껏 뿜어내어 지친 마음을 어루만집니다. 비가 내리는 제주는 외롭거나 쓸쓸하지 않으며, 안개 낀 삼나무 숲길과 축축한 흙 향이 사색의 깊이를 더해주는 특별한 치유 여정을 가능하게 합니다.",
    category: "숲 / 힐링"
  },
  {
    id: "doc-3",
    source: "평대리 돌담 보존지구 도보 가이드",
    content: "평대리는 구좌읍의 고요한 밭담 마을로 유명합니다. 현무암을 하나하나 손으로 정교하게 쌓아 올려 바람길을 열어주고 강력한 대풍에도 무너지지 않는 '제주 밭담(제주 밭의 전통 돌담)'의 정수가 원형 그대로 온전하게 보존되어 있는 대표적 농업 유산 지구입니다.",
    category: "평대리 / 농업 유산"
  },
  {
    id: "doc-4",
    source: "평대리 돌담 보존지구 도보 가이드",
    content: "구좌읍 평대리는 수분이 아주 많고 단맛이 월등히 뛰어난 제주 겨울 당근의 주산지입니다. 12월부터 이듬해 2월까지 사각거리는 당근 수확이 이뤄지며, 평대리 골목 안쪽 로컬 베이커리와 카페에서는 설탕 없이 오직 당근 수분과 당도만으로 착즙해 낸 무첨가 순수 건강 주스와 유기농 당근 케이크를 맛볼 수 있습니다.",
    category: "평대리 / 특산품"
  }
];

// Memory store for user-uploaded custom documents
let uploadedDocuments: Array<{ id: string; source: string; content: string; category: string }> = [];

// Semantic score simulation function based on text overlap and dense-like variance
function calculateSemanticScore(text: string, query: string): number {
  const cleanQuery = query.toLowerCase().replace(/[^\wㄱ-ㅎㅏ-ㅣ가-힣\s]/g, "");
  const queryWords = cleanQuery.split(/\s+/).filter(Boolean);
  if (queryWords.length === 0) return 0;
  
  let matchCount = 0;
  queryWords.forEach(word => {
    if (text.toLowerCase().includes(word)) {
      matchCount += 1.5; // Weight exact keyword match
    } else {
      // Check partial matches
      for (let i = 0; i < word.length - 1; i++) {
        const sub = word.substring(i, i + 2);
        if (text.toLowerCase().includes(sub)) {
          matchCount += 0.3;
          break;
        }
      }
    }
  });

  const ratio = Math.min(1, matchCount / queryWords.length);
  if (ratio > 0) {
    const baseScore = 55 + ratio * 42;
    return Math.min(99.8, parseFloat((baseScore + Math.random() * 2).toFixed(1)));
  } else {
    // Return low background dense vector matching score
    return parseFloat((12 + Math.random() * 15).toFixed(1));
  }
}

// Generate chunks dynamically combining Articles + Premium Docs + Uploaded Docs
function getCombinedKnowledgeChunks() {
  const articleChunks = articles.map(art => ({
    id: `chunk-${art.id}`,
    source: `제주매거진 아티클: <${art.title}> (작성: ${art.author})`,
    content: `${art.title}. ${art.excerpt} 본문 내용: ${art.content}`,
    category: art.categoryKo
  }));

  return [...articleChunks, ...staticDocuments, ...uploadedDocuments];
}

// API: Retrieve semantic knowledge chunks
app.post("/api/rag/search", (req, res) => {
  try {
    const { query } = req.body;
    if (!query || typeof query !== "string") {
      return res.status(400).json({ success: false, message: "Search query is required." });
    }

    const chunks = getCombinedKnowledgeChunks();
    const scored = chunks.map(chunk => {
      const score = calculateSemanticScore(chunk.content, query);
      return { ...chunk, score };
    });

    // Sort by semantic similarity score
    const results = scored
      .filter(item => item.score > 15) // Filter out noise
      .sort((a, b) => b.score - a.score)
      .slice(0, 5); // Return top 5

    res.json({ success: true, results });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// API: Document chunker & uploader (Simulating Vector Embeddings)
app.post("/api/rag/upload", (req, res) => {
  try {
    const { filename, content, category } = req.body;
    if (!filename || !content) {
      return res.status(400).json({ success: false, message: "Filename and content are required." });
    }

    // Segment input content into smaller chunks based on paragraph/sentence break
    const lines = content.split(/\n+/).map((l: string) => l.trim()).filter(Boolean);
    const newChunks: any[] = [];
    
    let currentChunk = "";
    lines.forEach((line: string) => {
      if ((currentChunk + line).length > 200) {
        newChunks.push({
          id: `up-${Date.now()}-${newChunks.length}`,
          source: `사용자 업로드: [${filename}]`,
          content: currentChunk.trim(),
          category: category || "사용자 지식"
        });
        currentChunk = line + " ";
      } else {
        currentChunk += line + " ";
      }
    });

    if (currentChunk.trim()) {
      newChunks.push({
        id: `up-${Date.now()}-${newChunks.length}`,
        source: `사용자 업로드: [${filename}]`,
        content: currentChunk.trim(),
        category: category || "사용자 지식"
      });
    }

    uploadedDocuments.push(...newChunks);

    res.json({
      success: true,
      message: `파일 [${filename}]이 성공적으로 파싱되어 ${newChunks.length}개의 지식 조각으로 분할·임베딩 완료되었습니다.`,
      chunksCount: newChunks.length,
      chunks: newChunks
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// API: RAG Retrieval-Augmented Generation Chat with citations
app.post("/api/rag/chat", async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ success: false, message: "Messages history is required." });
    }

    const lastUserMessage = messages[messages.length - 1]?.text || "";
    
    // 1. Semantic Retrieval Step
    const allChunks = getCombinedKnowledgeChunks();
    const scored = allChunks.map(chunk => ({
      ...chunk,
      score: calculateSemanticScore(chunk.content, lastUserMessage)
    }));

    // Select chunks with high similarity
    const retrievedCitations = scored
      .filter(item => item.score > 30)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    // 2. Synthesize prompt context
    let knowledgeContext = "";
    if (retrievedCitations.length > 0) {
      knowledgeContext = retrievedCitations.map((cit, index) => 
        `[지식출처 ${index + 1}]: ${cit.source}\n내용: ${cit.content}`
      ).join("\n\n");
    } else {
      knowledgeContext = "조회된 로컬 지식이 없습니다. 제주의 일반적인 정취를 바탕으로 따뜻하게 답변해주세요.";
    }

    // 3. Construct prompt with system instructions enforcing citations
    const systemInstruction = `당신은 제주매거진의 '인공지능 RAG 지식 가이드'입니다.
귀하에게 제공된 [지식출처 1], [지식출처 2], [지식출처 3] 등의 실시간 검색 데이터를 바탕으로 독자의 질문에 답변하세요.

**핵심 규칙**:
1. 답변 도중 인용한 사실이 어떤 지식출처에서 나왔는지 본문 중간이나 문장 끝에 반드시 [1], [2], [3] 형태로 대괄호 superscript 표기를 남겨주세요.
2. 예시: "구좌읍 평대리는 제주 겨울 당근의 주산지로, 12월부터 당근 수확이 집중적으로 이뤄집니다[1]."
3. 만약 제공된 지식출처 내용만으로 대답하기 어렵다면 일반적인 지식을 쓰되, "로컬 문헌 상의 근거가 다소 제한적이나..." 등으로 설명하세요.
4. 매우 고급스럽고 감성적인 한국어로 존댓말을 사용하여 서정적으로 서술해 주세요.`;

    // Map chat history to Gemini SDK
    const formattedContents = messages.map((m: any) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.text }],
    }));

    // Prefix last user message with retrieved context
    if (formattedContents.length > 0) {
      const lastIndex = formattedContents.length - 1;
      formattedContents[lastIndex].parts[0].text = `사용자 질문: ${lastUserMessage}

[검색된 실시간 지식 브릿지 컨텍스트]:
${knowledgeContext}

이 검색 정보를 참고하여 답변 규칙에 맞춰 철저하고 감성적으로 대답해주세요.`;
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: formattedContents,
      config: {
        systemInstruction,
        temperature: 0.4, // Lower temperature to prevent hallucination in RAG
      },
    });

    res.json({
      success: true,
      text: response.text,
      citations: retrievedCitations
    });
  } catch (error: any) {
    console.error("RAG Chat Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Vite Middleware & SPA serving
const startServer = async () => {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Jeju Magazine Server] running on http://localhost:${PORT} with Node.js`);
  });
};

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
