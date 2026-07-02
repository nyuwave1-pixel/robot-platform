// 로봇 데이터
export const ROBOTS = [
  { id: "spot", name: "Spot", brand: "Boston Dynamics", price: 74500, specs: "4-legged, 70kg" },
  { id: "h1", name: "H1", brand: "Unitree", price: 90000, specs: "Humanoid, 47kg" },
  { id: "go2", name: "Go2", brand: "Unitree", price: 1600, specs: "Quadruped, 3kg" },
];

// RP Points 설정
export const RP_ACTIONS = {
  SIGN_UP: 100,
  POST_COMMENT: 10,
  LIKE_POST: 1,
  SHARE_POST: 5,
  BUY_ROBOT: 50,
};

// 포럼 카테고리
export const FORUM_CATEGORIES = [
  { id: "general", name: "일반", color: "blue" },
  { id: "robots", name: "로봇", color: "cyan" },
  { id: "market", name: "마켓", color: "green" },
  { id: "tech", name: "기술", color: "purple" },
];

// API 엔드포인트
export const API_ENDPOINTS = {
  ROBOTS: "/api/robots",
  FORUM: "/api/forum",
  AUTH: "/api/auth",
  USER: "/api/user",
  HEALTH: "/api/health",
};

// 페이지 경로
export const ROUTES = {
  HOME: "/",
  ABOUT: "/about",
  DOCS: "/docs",
  ROBOTS: "/robots",
  FORUM: "/forum",
  MARKET: "/market",
  DASHBOARD: "/dashboard",
  PROFILE: "/profile",
  SIGNIN: "/signin",
  SIGNUP: "/signup",
};
