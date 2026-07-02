// 로봇 관련 타입
export interface Robot {
  id: string;
  name: string;
  type: string;
  status: "활성" | "대기중" | "오프라인";
  score: number;
  owner: string;
  createdAt: Date;
  description: string;
}

// 마켓플레이스 상품 타입
export interface MarketListing {
  id: string;
  title: string;
  seller: string;
  price: number;
  rating: number;
  reviews: number;
  description: string;
  category: string;
}

// 사용자 타입
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  rpBalance: number;
  rating: number;
  createdAt: Date;
  bio?: string;
}

// RP 포인트 트랜잭션
export interface RPTransaction {
  id: string;
  userId: string;
  amount: number;
  type: "earn" | "spend";
  reason: string;
  createdAt: Date;
}

// 거래 기록
export interface Transaction {
  id: string;
  sellerId: string;
  buyerId: string;
  listingId: string;
  amount: number;
  status: "pending" | "completed" | "cancelled";
  createdAt: Date;
  completedAt?: Date;
}

// API 응답 타입
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 대시보드 통계
export interface DashboardStats {
  totalRobots: number;
  activeRobots: number;
  totalVolume: number;
  activeUsers: number;
  averageRating: number;
}
