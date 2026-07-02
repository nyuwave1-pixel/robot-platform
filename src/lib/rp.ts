// RP Points System Utilities

export const RP_REWARDS = {
  SIGNUP: 100,           // 가입 보너스
  DAILY_LOGIN: 10,       // 매일 로그인
  ROBOT_LIKE: 5,         // 로봇 좋아요
  MARKET_PURCHASE: 0.1,  // 구매금액의 0.1%
  MARKET_SELL: 0.2,      // 판매금액의 0.2%
  REVIEW_WRITE: 20,      // 리뷰 작성
  REFERRAL: 50,          // 친구 초대
};

export const RP_COSTS = {
  ROBOT_PURCHASE: 50,    // 로봇 API 구독
  MARKET_LISTING: 10,    // 상품 등록
  MARKET_BUMP: 5,        // 상품 상위 이동
  BADGE_PREMIUM: 500,    // 프리미엄 배지
};

export interface RPTransaction {
  userId: string;
  amount: number;
  reason: string;
  type: "earn" | "spend";
  timestamp: Date;
}

// RP 획득 함수들
export async function awardSignupBonus(userId: string) {
  return addRPTransaction(userId, RP_REWARDS.SIGNUP, "가입 보너스");
}

export async function awardDailyLogin(userId: string) {
  return addRPTransaction(userId, RP_REWARDS.DAILY_LOGIN, "일일 로그인");
}

export async function awardReview(userId: string) {
  return addRPTransaction(userId, RP_REWARDS.REVIEW_WRITE, "리뷰 작성");
}

export async function awardReferral(userId: string) {
  return addRPTransaction(userId, RP_REWARDS.REFERRAL, "친구 초대");
}

// RP 차감 함수들
export async function deductRobotPurchase(userId: string) {
  return addRPTransaction(userId, -RP_COSTS.ROBOT_PURCHASE, "로봇 API 구독");
}

export async function deductMarketListing(userId: string) {
  return addRPTransaction(userId, -RP_COSTS.MARKET_LISTING, "상품 등록");
}

// 실제 API 호출 (Firebase 설정 필요)
async function addRPTransaction(
  userId: string,
  amount: number,
  reason: string
) {
  try {
    const response = await fetch("/api/rp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, amount, reason }),
    });
    return await response.json();
  } catch (error) {
    console.error("Failed to add RP transaction:", error);
    return null;
  }
}
