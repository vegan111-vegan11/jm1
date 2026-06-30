export interface Place {
  name: string;
  address: string;
  tip: string;
}

export interface Comment {
  id: string;
  author: string;
  avatarUrl?: string;
  text: string;
  createdAt: string;
}

export interface Article {
  id: string;
  title: string;
  category: string;
  categoryKo: string;
  author: string;
  content: string;
  excerpt: string;
  imageUrl: string;
  readTime: string;
  likes: number;
  createdAt: string;
  tags?: string[];
  places?: Place[];
  comments?: Comment[];
}

export interface Message {
  id: string;
  role: "user" | "model";
  text: string;
  createdAt: string;
}

export interface AdInquiry {
  id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  adType: string;
  message: string;
  status: string;
  createdAt: string;
}

export interface EditorApplication {
  id: string;
  name: string;
  email: string;
  bio: string;
  specialty: string;
  status: string;
  createdAt: string;
}

export interface User {
  isLoggedIn: boolean;
  nickname: string;
  email: string;
  profileImageUrl: string;
  role: "user" | "editor" | "admin";
}
