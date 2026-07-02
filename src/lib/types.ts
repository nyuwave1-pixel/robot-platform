export interface Robot {
  id: string;
  name: string;
  brand: string;
  price: number;
  specs: string;
  image: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  rpPoints: number;
  createdAt: Date;
}

export interface ForumPost {
  id: string;
  title: string;
  content: string;
  author: string;
  category: string;
  replies: number;
  createdAt: Date;
}

export interface RPTransaction {
  id: string;
  userId: string;
  amount: number;
  type: "earn" | "spend";
  reason: string;
  createdAt: Date;
}
