import type { SizeSpec } from "../rendering/types";

/**
 * Every deliverable size. Online = px, print = mm (trim) + 3 mm bleed.
 * Safe zones follow the platform guidance checked on 2026-11-27 (see docs/PLATFORM_SPECS.md):
 *  - Meta Stories/Reels 9:16: keep ~14% top, 20% (Stories) / 35% (Reels) bottom and 6% sides free of key content
 *  - YouTube channel art 2560x1440: everything important inside the centred 1546x423 area
 *  - Google responsive display: 1200x628 / 1200x1200 / 900x1600, max 5120 KB
 *  - Kakao channel message image 800x400 (10 MB), list image 800x800
 *  - Naver GFA: limit not published in the docs we could reach — kept ≤ 500 KB to be safe
 * Print raster resolution follows common Korean print-shop guidance: 300 dpi for A-series/POP,
 * 150 dpi for roll-up / X-banners, 100 dpi for banners, 72–100 dpi for walls (viewing distance > 2 m).
 */

const L = (ko: string, en: string, zh: string) => ({ ko, en, zh });

export const ONLINE: SizeSpec[] = [
  // A. Homepage / website
  { id: "web-pc-main", kind: "online", group: "web", label: L("PC 메인 배너", "PC main banner", "PC主横幅"), w: 1920, h: 700, safe: { margin: 0.07, left: 0.12, right: 0.12 }, format: "jpg", notes: "Keep content inside the centre 1440 px for 1440 px wide screens" },
  { id: "web-mo-main", kind: "online", group: "web", label: L("모바일 메인 배너", "Mobile main banner", "移动端主横幅"), w: 750, h: 1000, safe: { margin: 0.07 }, format: "jpg" },
  { id: "web-pc-promo-wide", kind: "online", group: "web", label: L("PC 와이드 프로모션", "PC wide promotion", "PC宽幅促销"), w: 1920, h: 300, safe: { margin: 0.1, left: 0.12, right: 0.12 }, format: "jpg" },
  { id: "web-mo-promo", kind: "online", group: "web", label: L("모바일 프로모션", "Mobile promotion", "移动端促销"), w: 750, h: 300, safe: { margin: 0.08 }, format: "jpg" },
  { id: "web-pc-product", kind: "online", group: "web", label: L("PC 제품 홍보", "PC product feature", "PC产品推广"), w: 1440, h: 600, safe: { margin: 0.07 }, format: "jpg" },
  { id: "web-global-main", kind: "online", group: "web", label: L("글로벌 쇼핑몰 메인", "Global mall main", "全球商城主图"), w: 1920, h: 600, safe: { margin: 0.07, left: 0.12, right: 0.12 }, format: "jpg" },
  { id: "web-detail", kind: "online", group: "web", label: L("제품 상세 배너", "Product detail banner", "产品详情横幅"), w: 1200, h: 800, safe: { margin: 0.07 }, format: "jpg" },
  { id: "web-bottom-cta", kind: "online", group: "web", label: L("하단 구매 유도 배너", "Bottom purchase banner", "底部购买横幅"), w: 1920, h: 500, safe: { margin: 0.08, left: 0.12, right: 0.12 }, format: "jpg" },
  // B. Naver / Google
  { id: "ad-1200x628", kind: "online", group: "search", label: L("네이버·구글 가로형", "Naver/Google landscape", "Naver/谷歌横版"), w: 1200, h: 628, safe: { margin: 0.07 }, format: "jpg", maxKB: 500 },
  { id: "ad-1200x1200", kind: "online", group: "search", label: L("네이버·구글 정사각형", "Naver/Google square", "Naver/谷歌方形"), w: 1200, h: 1200, safe: { margin: 0.07 }, format: "jpg", maxKB: 500 },
  { id: "ad-900x1600", kind: "online", group: "search", label: L("네이버·구글 세로형", "Naver/Google vertical", "Naver/谷歌竖版"), w: 900, h: 1600, safe: { margin: 0.07, top: 0.08, bottom: 0.1 }, format: "jpg", maxKB: 500 },
  { id: "ad-1200x300", kind: "online", group: "search", label: L("네이버 띠배너", "Naver strip banner", "Naver条幅"), w: 1200, h: 300, safe: { margin: 0.1 }, format: "jpg", maxKB: 500 },
  { id: "ad-1080x1080", kind: "online", group: "search", label: L("네이버 피드 정사각형", "Naver feed square", "Naver信息流方形"), w: 1080, h: 1080, safe: { margin: 0.07 }, format: "jpg", maxKB: 500 },
  { id: "ad-1080x1920", kind: "online", group: "search", label: L("네이버 세로 풀스크린", "Naver vertical full screen", "Naver竖版全屏"), w: 1080, h: 1920, safe: { margin: 0.07, top: 0.12, bottom: 0.18 }, format: "jpg", maxKB: 500 },
  // C. Facebook / Instagram
  { id: "sns-feed-square", kind: "online", group: "social", label: L("피드 정사각형", "Feed square", "信息流方形"), w: 1080, h: 1080, safe: { margin: 0.06 }, format: "jpg" },
  { id: "sns-feed-portrait", kind: "online", group: "social", label: L("피드 세로형", "Feed portrait", "信息流竖版"), w: 1080, h: 1350, safe: { margin: 0.06 }, format: "jpg" },
  { id: "sns-story", kind: "online", group: "social", label: L("스토리", "Story", "快拍"), w: 1080, h: 1920, safe: { margin: 0.06, top: 0.14, bottom: 0.2 }, format: "jpg" },
  { id: "sns-reels-cover", kind: "online", group: "social", label: L("릴스 커버", "Reels cover", "Reels封面"), w: 1080, h: 1920, safe: { margin: 0.06, top: 0.14, bottom: 0.35 }, format: "jpg" },
  { id: "sns-ad-landscape", kind: "online", group: "social", label: L("광고 가로형", "Ad landscape", "广告横版"), w: 1200, h: 628, safe: { margin: 0.07 }, format: "jpg" },
  { id: "sns-carousel", kind: "online", group: "social", label: L("캐러셀 광고", "Carousel card", "轮播卡片"), w: 1080, h: 1080, safe: { margin: 0.06 }, format: "jpg" },
  { id: "sns-profile-brand", kind: "online", group: "social", label: L("프로필·브랜드 홍보", "Profile / brand post", "主页品牌推广"), w: 1080, h: 1080, safe: { margin: 0.08 }, format: "jpg" },
  // D. YouTube / video
  { id: "yt-thumbnail", kind: "online", group: "video", label: L("유튜브 썸네일", "YouTube thumbnail", "YouTube缩略图"), w: 1280, h: 720, safe: { margin: 0.06, right: 0.12, bottom: 0.1 }, format: "jpg", maxKB: 2000, notes: "Duration badge sits bottom-right" },
  { id: "yt-channel-art", kind: "online", group: "video", label: L("유튜브 채널 아트", "YouTube channel art", "YouTube频道横幅"), w: 2560, h: 1440, safe: { centerBox: { w: 1546, h: 423 } }, format: "jpg", maxKB: 6000 },
  { id: "video-landscape", kind: "online", group: "video", label: L("영상 광고 가로형", "Video ad landscape", "视频广告横版"), w: 1920, h: 1080, safe: { margin: 0.07 }, format: "jpg" },
  { id: "video-shorts", kind: "online", group: "video", label: L("쇼츠 광고 세로형", "Shorts ad vertical", "Shorts竖版"), w: 1080, h: 1920, safe: { margin: 0.06, top: 0.14, bottom: 0.3 }, format: "jpg" },
  { id: "video-cover", kind: "online", group: "video", label: L("제품 소개 영상 커버", "Product video cover", "产品视频封面"), w: 1920, h: 1080, safe: { margin: 0.07 }, format: "jpg" },
  // E. Kakao / content
  { id: "kakao-promo", kind: "online", group: "kakao", label: L("카카오톡 프로모션", "KakaoTalk promotion", "KakaoTalk促销"), w: 800, h: 400, safe: { margin: 0.07 }, format: "jpg", maxKB: 500 },
  { id: "kakao-square", kind: "online", group: "kakao", label: L("카카오톡 정사각형", "KakaoTalk square", "KakaoTalk方形"), w: 800, h: 800, safe: { margin: 0.07 }, format: "jpg", maxKB: 500 },
  { id: "blog-cover", kind: "online", group: "kakao", label: L("블로그 대표 이미지", "Blog cover", "博客封面"), w: 1200, h: 630, safe: { margin: 0.07 }, format: "jpg" },
  { id: "email-promo", kind: "online", group: "kakao", label: L("이메일 프로모션", "Email promotion", "邮件促销"), w: 1200, h: 600, safe: { margin: 0.07 }, format: "jpg", maxKB: 400 },
  { id: "content-card", kind: "online", group: "kakao", label: L("콘텐츠 카드", "Content card", "内容卡片"), w: 1080, h: 1080, safe: { margin: 0.07 }, format: "jpg" },
];

export const PRINT: SizeSpec[] = [
  // A. Store / event banners
  { id: "p-rollup-850", kind: "print", group: "stand", label: L("롤업 배너", "Roll-up banner", "易拉宝"), w: 850, h: 2000, bleed: 3, dpi: 150, hiddenBottom: 120, qr: true, safe: { margin: 0.05 } },
  { id: "p-rollup-1000", kind: "print", group: "stand", label: L("대형 롤업", "Large roll-up", "大型易拉宝"), w: 1000, h: 2000, bleed: 3, dpi: 150, hiddenBottom: 120, qr: true, safe: { margin: 0.05 } },
  { id: "p-xbanner", kind: "print", group: "stand", label: L("X배너", "X-banner", "X展架"), w: 600, h: 1800, bleed: 3, dpi: 150, qr: true, safe: { margin: 0.06, top: 0.04, bottom: 0.04 }, notes: "Grommet corners 40 mm kept clear" },
  { id: "p-mini", kind: "print", group: "stand", label: L("미니 배너", "Mini banner", "迷你展架"), w: 400, h: 1200, bleed: 3, dpi: 200, qr: true, safe: { margin: 0.06 } },
  { id: "p-store-banner", kind: "print", group: "stand", label: L("매장 현수막", "Store banner", "店铺横幅"), w: 3000, h: 900, bleed: 3, dpi: 100, safe: { margin: 0.08 }, notes: "Eyelets every 500 mm — 50 mm edge kept clear" },
  { id: "p-large-banner", kind: "print", group: "stand", label: L("대형 현수막", "Large banner", "大型横幅"), w: 5000, h: 900, bleed: 3, dpi: 72, safe: { margin: 0.08 } },
  { id: "p-wide-promo", kind: "print", group: "stand", label: L("가로형 홍보 배너", "Horizontal promo banner", "横版宣传横幅"), w: 2000, h: 600, bleed: 3, dpi: 100, safe: { margin: 0.08 } },
  { id: "p-table", kind: "print", group: "stand", label: L("테이블 배너", "Table banner", "桌面展架"), w: 300, h: 450, bleed: 3, dpi: 300, qr: true, safe: { margin: 0.07 } },
  // B. Posters / POP
  { id: "p-a1", kind: "print", group: "poster", label: L("A1 포스터", "A1 poster", "A1海报"), w: 594, h: 841, bleed: 3, dpi: 150, qr: true, safe: { margin: 0.06 } },
  { id: "p-a2", kind: "print", group: "poster", label: L("A2 포스터", "A2 poster", "A2海报"), w: 420, h: 594, bleed: 3, dpi: 200, qr: true, safe: { margin: 0.06 } },
  { id: "p-a3", kind: "print", group: "poster", label: L("A3 포스터", "A3 poster", "A3海报"), w: 297, h: 420, bleed: 3, dpi: 300, qr: true, safe: { margin: 0.06 } },
  { id: "p-a4", kind: "print", group: "poster", label: L("A4 제품 소개", "A4 product sheet", "A4产品介绍"), w: 210, h: 297, bleed: 3, dpi: 300, qr: true, safe: { margin: 0.07 } },
  { id: "p-counter-pop", kind: "print", group: "poster", label: L("카운터 POP", "Counter POP", "柜台POP"), w: 150, h: 210, bleed: 3, dpi: 300, qr: true, safe: { margin: 0.07 } },
  { id: "p-shelf-pop", kind: "print", group: "poster", label: L("제품 진열 POP", "Shelf POP", "陈列POP"), w: 210, h: 297, bleed: 3, dpi: 300, qr: true, safe: { margin: 0.07 } },
  // C. Exhibition / event
  { id: "p-backwall", kind: "print", group: "event", label: L("전시회 백월", "Exhibition backwall", "展会背景墙"), w: 3000, h: 2300, bleed: 3, dpi: 72, safe: { margin: 0.06, bottom: 0.1 } },
  { id: "p-photowall", kind: "print", group: "event", label: L("프리미엄 포토월", "Premium photo wall", "高端拍照墙"), w: 4000, h: 2500, bleed: 3, dpi: 72, safe: { margin: 0.06, bottom: 0.12 } },
  { id: "p-stage", kind: "print", group: "event", label: L("행사 무대 배경", "Stage backdrop", "活动舞台背景"), w: 5000, h: 2500, bleed: 3, dpi: 60, safe: { margin: 0.06, bottom: 0.14 } },
  { id: "p-experience", kind: "print", group: "event", label: L("제품 체험존 배경", "Experience zone backdrop", "产品体验区背景"), w: 3000, h: 2000, bleed: 3, dpi: 72, safe: { margin: 0.06, bottom: 0.1 } },
];

export const ALL_SIZES = [...ONLINE, ...PRINT];
export const sizeById = (id: string) => ALL_SIZES.find((s) => s.id === id);
