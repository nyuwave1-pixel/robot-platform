/**
 * UNI&CORE 공식 상품 → 게임 아이템 데이터베이스
 *
 * [실제 데이터] name / productCode / mallSeq / priceKRW / volume / ingredients / howTo / functional / maker
 *   출처: https://www.unincore.com 공개 상품 목록·상세·상품정보제공고시 (2026-11-11 수집)
 *         https://dermahome.unincore.com 케어 라인·루틴 가이드
 *   → 임의 변경 금지. `verified: true` 는 상품정보고시까지 대조한 항목.
 *
 * [게임 데이터] rarity / coinPrice / unlock / theme / shape / colors
 *   → 게임 내 수집·희귀도 기준일 뿐, 실제 제품의 품질·효능 순위가 아니다.
 */
import type { ModeId } from "./devices";

export type Rarity = "COMMON" | "RARE" | "EPIC" | "LEGENDARY" | "PREMIUM";
export type ProductKind = "skincare" | "hairbody" | "device" | "health" | "living" | "brand";
export type BottleShape = "jar" | "ampoule" | "pouch" | "pad" | "mist" | "tube" | "pump" | "stick" | "cushion" | "box" | "tall";

export interface Product {
  id: string;
  /** 공식 쇼핑몰 상품명 (표기 그대로) */
  name: string;
  /** 공식 영문 표기가 확인된 경우에만 기재 (더마홈 케어라인) */
  nameEn?: string;
  /** 공식몰 카테고리 */
  category: "스킨케어" | "헬스케어" | "리빙" | "브랜드 아이템" | "더마 디바이스";
  kind: ProductKind;
  /** 공식몰 상품코드 (상세페이지 표기) */
  productCode?: string;
  /** 공식몰 상세 조회 일련번호 (공개 URL 파라미터) */
  mallSeq: number;
  /** 공식몰 표시가(원). 0 = 가격문의 */
  priceKRW: number;
  volume?: string;
  /** 상품정보제공고시 「화장품법」 전성분 */
  ingredients?: string;
  /** 게임 UI 에 노출하는 대표 성분 (전성분 표기에서 발췌, 창작 없음) */
  keyIngredients?: string[];
  /** 상품정보제공고시 사용방법 원문 */
  howTo?: string;
  /** 기능성 화장품 심사(보고) 여부 */
  functional?: boolean;
  maker?: string;
  /** 더마홈 가이드에 명시된 소개 문구(요약) */
  officialNote?: string;
  verified: boolean;
  /** 더마홈 공식 루틴에서 함께 쓰는 모드 */
  modes: ModeId[];
  /** 루틴 마무리 전용(미스트 등) */
  finisher?: boolean;

  // ── 이하 게임 데이터 ──
  rarity: Rarity;
  coinPrice: number;
  unlock: { stage?: number; lounge?: number };
  /** 판타지 연출 테마 (효능 표현 아님) */
  theme: "glow" | "moist" | "calm" | "warm" | "fresh" | "none";
  shape: BottleShape;
  colors: [string, string];
}

const A = (p: Product) => p;

export const PRODUCTS: Product[] = [
  // ─────────────── 스킨케어 (17) ───────────────
  A({
    id: "first-birthday-cream", name: "퍼스트 벌스데이 크림 50g", category: "스킨케어", kind: "skincare",
    productCode: "100000145", mallSeq: 507, priceKRW: 598000, volume: "50g", verified: false, modes: [],
    rarity: "PREMIUM", coinPrice: 2400, unlock: { stage: 4 }, theme: "glow", shape: "jar", colors: ["#3a2a1e", "#b98a4e"],
  }),
  A({
    id: "vitac-ampoule", name: "비타씨 13.5 수퍼 화이트닝 앰플 30g", category: "스킨케어", kind: "skincare",
    productCode: "100000117", mallSeq: 50, priceKRW: 189600, volume: "30 g", functional: true, maker: "㈜덤스토리", verified: true,
    howTo: "세안 후 첫 단계에 적당량을 덜어 얼굴에 부드럽게 펴 바릅니다.",
    keyIngredients: ["아스코빅애씨드(135,000ppm)", "글루타티온", "판테놀", "소듐하이알루로네이트"],
    ingredients:
      "정제수, 아스코빅애씨드(135,000ppm), 부틸렌글라이콜, 다이프로필렌글라이콜, 프로판다이올, 다이카프릴릴카보네이트, 프로필렌글라이콜다이카프릴레이트/다이카프레이트, 다이아이소프로필세바케이트, 폴리솔베이트60, 글루타티온, 글리세린, 글리세릴스테아레이트, 판테놀, 키토산, 풀루란, 소듐글루코네이트, 소듐하이알루로네이트, 해바라기씨오일, 다이메티콘, 에칠헥실살리실레이트, 구아하이드록시프로필트라이모늄클로라이드, 소듐메타바이설파이트, 잔탄검, 사이클로펜타실록세인, 다이메티콘/비닐다이메티콘크로스폴리머, 물푸레나무추출물, 연꽃씨추출물, 녹두씨추출물, 자몽추출물, 보검선인장열매추출물, 까무까무열매추출물, 베타-카로틴, 당근씨오일, 당근추출물, 울금뿌리추출물, 카카두플럼추출물, 베타-글루칸, 자작나무껍질추출물, 에틸헥실글리세린, 아스코빌팔미테이트, 소리쟁이뿌리추출물, 하이드롤라이즈드엘라스틴, 다이소듐이디티에이, 소듐하이드록사이드, 1,2-헥산다이올, 향료, 벤질살리실레이트, 리모넨, 헥실신남알, 리날룰",
    modes: ["us"], rarity: "EPIC", coinPrice: 260, unlock: {}, theme: "glow", shape: "ampoule", colors: ["#eeeadb", "#d8cfae"],
  }),
  A({
    id: "glutaglow-ampoule", name: "비타 씨 글루타글로우 수퍼 브라이트닝 앰플 30g", category: "스킨케어", kind: "skincare",
    productCode: "100000114", mallSeq: 135, priceKRW: 189600, volume: "30g", verified: false, modes: [],
    rarity: "EPIC", coinPrice: 320, unlock: { stage: 3 }, theme: "glow", shape: "pump", colors: ["#f7f7f5", "#cfd4cc"],
  }),
  A({
    id: "vitac-mask", name: "비타씨 수퍼 브라이트닝 마스크 5매", category: "스킨케어", kind: "skincare",
    productCode: "100000108", mallSeq: 40, priceKRW: 63200, volume: "16 g * 5매", functional: true, maker: "㈜덤스토리", verified: true,
    howTo: "1. 마스크를 꺼내어 얼굴에 맞추어 붙여 줍니다. (마스크 시트는 어두운 쪽이 밖으로 향하게 붙여 줍니다.) 2. 약 10~20분 후 마스크를 떼어내고 피부에 남은 앰플은 가볍게 두드려 흡수시켜 줍니다.",
    keyIngredients: ["아스코빅애씨드(20,000ppm)", "알파-비사보롤", "글루타티온", "아세틸헥사펩타이드-8"],
    ingredients:
      "정제수, 프로판다이올, 부틸렌글라이콜, 다이프로필렌글라이콜, 아스코빅애씨드(20,000ppm), 카프릴릭/카프릭트라이글리세라이드, 프로필렌글라이콜다이카프릴레이트/다이카프레이트, 폴리솔베이트60, 폴리글리세릴-10라우레이트, 글리세린, 알파-비사보롤, 판테놀, 글루타티온, 다이메티콘, 키토산, 풀루란, 소듐글루코네이트, 소듐하이알루로네이트, 해바라기씨오일, 다이소듐이디티에이, 에칠헥실살리실레이트, 구아하이드록시프로필트라이모늄클로라이드, 소듐메타바이설파이트, 사이클로펜타실록세인, 파이틱애씨드, 다이메티콘/비닐다이메티콘크로스폴리머, 베타-글루칸, 물푸레나무추출물, 연꽃씨추출물, 하이드롤라이즈드엘라스틴, 금불초꽃추출물, 녹두씨추출물, 소리쟁이뿌리추출물, 자작나무껍질추출물, 자몽추출물, 아세틸헥사펩타이드-8, 베타-카로틴, 당근추출물, 당근씨오일, 에틸헥실글리세린, 아스코빌팔미테이트, 잔탄검, 소듐하이드록사이드, 1,2-헥산다이올, 향료, 벤질살리실레이트",
    modes: ["ionto"], rarity: "RARE", coinPrice: 120, unlock: {}, theme: "glow", shape: "pouch", colors: ["#e9e6d6", "#cfc9ad"],
  }),
  A({
    id: "deep-repair-cream", name: "딥 리페어 액티베이팅 뉴트리션 크림 30ml", category: "스킨케어", kind: "skincare",
    productCode: "000000101", mallSeq: 27, priceKRW: 148800, volume: "30 ml", functional: true, maker: "㈜덤스토리", verified: true,
    howTo: "세안 후 코어 비타씨 13.5 수퍼 화이트닝 앰플 다음 단계에 적당량을 덜어 얼굴에 부드럽게 펴 바릅니다.",
    keyIngredients: ["나이아신아마이드", "세라마이드엔피", "아데노신", "카퍼트라이펩타이드-1"],
    ingredients:
      "정제수, 글리세린, 펜타에리스리틸테트라에틸헥사노에이트, 세틸에틸헥사노에이트, 메도우폼씨오일, 펜타에리스리틸테트라아이소스테아레이트, 나이아신아마이드, 다이아이소스테아릴말레이트, 카카오씨버터, 피토스테릴/베헤닐/옥틸도데실라우로일글루타메이트, 폴리글리세릴-6폴리리시놀리에이트, 부틸렌글라이콜, 다이프로필렌글라이콜, 사이클로펜타실록세인, 다이메티콘, 비즈왁스, 시어버터, 세틸피이지/피피지-10/1다이메티콘, 바쿠치올, 아사이팜열매추출물, 귤껍질추출물, 라우릴피이지-9폴리다이메틸실록시에틸다이메티콘, 사이클로헥사실록세인, 소듐클로라이드, 다이스테아다이모늄헥토라이트, 소듐락테이트, 자몽추출물, 스테아랄코늄헥토라이트, 하이드롤라이즈드엘라스틴, 하이드로제네이티드레시틴, 세라마이드엔피, 레시틴, 판테놀, 프로필렌카보네이트, 토코페릴아세테이트, 녹두씨추출물, 자작나무껍질추출물, 소리쟁이뿌리추출물, 카라멜, 소듐하이알루로네이트, 헥실데칸올, 치자추출물, 물푸레나무추출물, 금불초꽃추출물, 아데노신, 아시아티코사이드, 마데카식애씨드, 아시아틱애씨드, 베타-글루칸, 폴리솔베이트60, 솔비탄스테아레이트, 카퍼트라이펩타이드-1, 다이소듐이디티에이, 에틸헥실글리세린, 1,2-헥산다이올, 향료, 벤질벤조에이트, 벤질살리실레이트, 헥실신남알, 시트로넬올, 부틸페닐메틸프로피오날, 리모넨, 리날룰",
    modes: ["rf"], rarity: "EPIC", coinPrice: 220, unlock: {}, theme: "warm", shape: "jar", colors: ["#d9d2bd", "#c3baa0"],
  }),
  A({
    id: "serum-mist", name: "하이드레이팅 스킨 베리어 세럼 미스트 50ml", category: "스킨케어", kind: "skincare",
    productCode: "100000107", mallSeq: 37, priceKRW: 55600, volume: "50 ml", functional: false, maker: "㈜덤스토리", verified: true,
    howTo: "스킨케어 마지막 단계에 10-20cm 떨어져 눈을 감고 얼굴 전체에 골고루 분사한 후 자연스럽게 흡수되도록 둡니다. 눈에 들어가지 않도록 주의합니다.",
    keyIngredients: ["판테놀", "스쿠알란", "세라마이드엔피", "소듐하이알루로네이트"],
    ingredients:
      "정제수, 부틸렌글라이콜, 글리세린, 1,2-헥산다이올, 판테놀, 녹두씨추출물, 스쿠알란, 하이드로제네이티드레시틴, 알란토인, 에틸헥실글리세린, 스페인감초뿌리추출물, 피이지-60하이드로제네이티드캐스터오일, 카퍼트라이펩타이드-1, 다이포타슘글리시리제이트, 헥실데칸올, 베타-글루칸, 마데카식애씨드, 아시아티코사이드, 세라마이드엔피, 아시아틱애씨드, 소듐하이알루로네이트, 향료",
    modes: [], finisher: true, rarity: "COMMON", coinPrice: 80, unlock: {}, theme: "moist", shape: "mist", colors: ["#e8eef6", "#4f79b8"],
  }),
  A({
    id: "toner-pad", name: "데일리 카밍 토너 패드 180ml (70매)", category: "스킨케어", kind: "skincare",
    productCode: "100000112", mallSeq: 43, priceKRW: 84000, volume: "70매 / 180 ml", functional: false, maker: "㈜덤스토리", verified: true,
    howTo: "1. 뚜껑을 열어 내장된 집게로 패드 1장을 꺼냅니다. 2. 눈가를 제외한 얼굴 전체의 피부결을 따라 부드럽게 닦아내어 피부를 진정시켜 줍니다. 3. 사용 후 패드가 마르지 않도록 뚜껑을 정확히 닫아 밀봉해 줍니다. *긴급 진정이 필요한 부위에는 마스크팩처럼 올려두어 사용해주세요.",
    keyIngredients: ["세라마이드엔피", "마데카식애씨드", "아시아티코사이드", "소듐하이알루로네이트"],
    ingredients:
      "정제수, 다이프로필렌글라이콜, 글리세린, 부틸렌글라이콜, 에탄올, 폴리솔베이트60, 다이메티콘, 다이-C12-13알킬말레이트, 레시틴, 하이드로제네이티드레시틴, 녹두씨추출물, 스클레로튬검, 소듐하이알루로네이트, 베타-글루칸, 자작나무껍질추출물, 카프릴릭/카프릭트라이글리세라이드, 소리쟁이뿌리추출물, 토코페롤, 포스포리피드, 세라마이드엔피, 아시아티코사이드, 아시아틱애씨드, 카퍼트라이펩타이드-1, 마데카식애씨드, 자몽추출물, 1,2-헥산다이올, 에틸헥실글리세린, 향료",
    modes: ["ionto"], rarity: "RARE", coinPrice: 110, unlock: {}, theme: "calm", shape: "pad", colors: ["#e6e2cf", "#cfc8ac"],
  }),
  A({
    id: "sun-cream", name: "하이드레이팅 래디언스 선크림 SPF50 PA+++30ml", category: "스킨케어", kind: "skincare",
    productCode: "000000104", mallSeq: 33, priceKRW: 44800, volume: "30ml", verified: false, modes: [],
    rarity: "COMMON", coinPrice: 70, unlock: {}, theme: "fresh", shape: "stick", colors: ["#f0f3e6", "#dfe6cf"],
  }),
  A({
    id: "enzyme-wash", name: "비타씨 엔자임 파우더 워시", category: "스킨케어", kind: "skincare",
    productCode: "100000127", mallSeq: 213, priceKRW: 55600, volume: "1 g X 30EA", functional: false, maker: "㈜덤스토리", verified: true,
    howTo: "파우더 워시 1포를 소량의 미온수와 함께 충분히 거품을 낸 후 얼굴 전체를 마사지하듯 부드럽게 롤링해 줍니다. 미온수로 깨끗하게 헹구어 냅니다.",
    keyIngredients: ["파파인", "브로멜라인", "아스코빅애씨드", "알란토인"],
    ingredients:
      "옥수수전분, 소듐코코일이세티오네이트, 소듐라우로일글루타메이트, 티타늄디옥사이드, 소듐팔미테이트, 다이글리세린, 알란토인, 마이카, 말토덱스트린, 오렌지껍질가루, 야생딸기씨, 파파인, 브로멜라인, 아스코빅애씨드, 수크로오스, 셀룰로오스검, 황색산화철, 커큐민, 스타이렌/아크릴레이트코폴리머, 리파아제",
    modes: [], rarity: "COMMON", coinPrice: 80, unlock: {}, theme: "fresh", shape: "box", colors: ["#ffffff", "#f3d83a"],
  }),
  A({
    id: "scalp-serum", name: "하이퍼루프 스칼프 세럼 300ml", nameEn: "HYPERLOOP SCALP SERUM", category: "스킨케어", kind: "hairbody",
    productCode: "300000315", mallSeq: 115, priceKRW: 504000, volume: "300ml", functional: true, maker: "㈜더마스내추럴", verified: true,
    howTo: "제품을 충분히 흔든 후에 두피와 모근에 적당량을 도포해 줍니다. 이어서 유니 더마 10의 이온토포레시스헤드를 사용하여 세럼의 영양성분을 두피 깊숙이 침투시켜 줍니다.",
    officialNote: "데일리 두피 케어 · 하이드라 배리어 콤플렉스 · 파이토 카밍 콤플렉스",
    keyIngredients: ["푸코이단", "황련뿌리추출물", "황금추출물", "하이알루로닉애씨드"],
    ingredients:
      "정제수, 부틸렌글라이콜, 1,2-헥산다이올, 푸코이단, 폴리솔베이트20, 황련뿌리추출물, 황금추출물, 뽕나무껍질추출물, 고삼뿌리추출물, 암모늄폴리아크릴로일다이메틸타우레이트, 하이드록시에틸셀룰로오스, 하이알루로닉애씨드, 소듐포스페이트, 다이소듐포스페이트, 피이지-60솔비탄스테아레이트, 카프릴릴글라이콜, t-부틸알코올, 향료",
    modes: ["ionto"], rarity: "LEGENDARY", coinPrice: 480, unlock: { lounge: 2 }, theme: "calm", shape: "tall", colors: ["#f6f6f4", "#bfc4c4"],
  }),
  A({
    id: "soothing-gel", name: "수딩 앤 모이스트 케어 부스팅 젤 250ml", nameEn: "SOOTHING & MOIST CARE BOOSTING GEL", category: "스킨케어", kind: "hairbody",
    productCode: "300000318", mallSeq: 61, priceKRW: 74400, volume: "250ml", functional: true, maker: "㈜서흥", verified: true,
    howTo: "제품을 충분히 흔든 후에 피부에 적당량을 도포해 줍니다. 이어서 유니 더마 10의 울트라소닉을 사용하여 초음파의 고속 진동파를 피부 깊은 곳까지 전달해 줍니다.",
    officialNote: "페이스·바디·두피 멀티 수딩 젤 · 네바네바 콤플렉스 · 폴리글루타믹애씨드",
    keyIngredients: ["폴리글루타믹애씨드", "참마뿌리추출물", "오크라열매추출물", "다시마추출물"],
    ingredients:
      "정제수, 부틸렌글라이콜, 다이글리세린, 하이드록시에틸우레아, 1,2-헥산다이올, 하이드록시아세토페논, 아크릴레이트/C10-30알킬아크릴레이트크로스폴리머, 알지닌, 잔탄검, 참마뿌리추출물, 오크라열매추출물, 다시마추출물, 연꽃추출물, 몰로키아잎추출물, 폴리글루타믹애씨드",
    modes: ["us", "ionto"], rarity: "RARE", coinPrice: 100, unlock: {}, theme: "calm", shape: "pump", colors: ["#f4f4f2", "#1c1c1c"],
  }),
  A({
    id: "body-cream", name: "하이퍼루프 바디크림 150g", nameEn: "HYPERLOOP BODY CREAM", category: "스킨케어", kind: "hairbody",
    productCode: "300000328", mallSeq: 403, priceKRW: 189200, volume: "150g", functional: true, maker: "㈜더마스내추럴", verified: true,
    howTo: "적당량을 취해 원하는 부위에 부드럽게 마사지 하듯 도포해 주세요.",
    officialNote: "바디 쉐입 커팅 크림 · 3단계 온열 시스템(바닐릴부틸에터·카페인·카르니틴) · 푸코이단",
    keyIngredients: ["바닐릴부틸에터", "카페인", "카르니틴", "푸코이단"],
    ingredients:
      "정제수, 해바라기씨오일, 글리세린, 부틸렌글라이콜, 시어버터, 비즈왁스, 세테아릴알코올, 바닐릴부틸에터, 글리세릴스테아레이트, 1,2-헥산디올, 폴리솔베이트60, 솔비탄스테아레이트, 알란토인, 향료, 피이지-100스테아레이트, 카페인, 카르니틴, 카프릴릴글라이콜, 카보머, 알지닌, 옥틸도데칸올, 올리브나무잎추출물, 옐로우체이스트위드추출물, 포도추출물, 파파야열매추출물, 사과추출물, 매실추출물, 해당화추출물, 하이드롤라이즈드콜라겐, 토코페릴아세테이트, 컴프리잎추출물, 올리브오일, 연꽃꽃추출물, 소듐폴리아크릴레이트, 라벤더꽃추출물, 동백나무씨오일, 다마스크장미꽃추출물, 개똥쑥추출물, 병풀추출물, 하이드로제네이티드레시틴, 다이소듐이디티에이, 황벽나무껍질추출물, 하이알루로닉애씨드, 세라마이드엔피, 푸코이단, 콜라겐",
    modes: ["rf"], rarity: "EPIC", coinPrice: 240, unlock: { lounge: 2 }, theme: "warm", shape: "tube", colors: ["#f5f5f3", "#151515"],
  }),
  A({
    id: "cool-gel", name: "액티브 리커버 쿨 젤 150ml", nameEn: "ACTIVE RECOVER COOL GEL", category: "스킨케어", kind: "hairbody",
    productCode: "300000327", mallSeq: 402, priceKRW: 252000, volume: "150g", functional: true, maker: "㈜더마스내추럴", verified: true,
    howTo: "적당량을 취해 원하는 부위에 부드럽게 마사지 하듯 도포해 주세요.",
    officialNote: "활동 후 열감 부위용 쿨링 젤 · 디바이스 사용 시 전도 젤로도 활용",
    keyIngredients: ["엘-멘톨", "키토산", "하이드롤라이즈드콜라겐", "3-O-에틸아스코빅애씨드"],
    ingredients:
      "정제수, 부틸렌글라이콜, 엘-멘톨, 변성알코올, 1,2-헥산다이올, 피이지-60하이드로제네이티드캐스터오일, 하이드록시에틸아크릴레이트/소듐아크릴로일다이메틸타우레이트코폴리머, 알지닌, 카보머, 카프릴릴글라이콜, 효모/해바라기씨오일발효여과물, 토코페릴아세테이트, 자일리틸글루코사이드, 안하이드로자일리톨, 솔비탄아이소스테아레이트, 알진, 자일리톨, 트로메타민, 테트라하이드록시프로필에틸렌다이아민, 글루코오스, 말라카이트추출물, 하이드롤라이즈드콜라겐, 3-O-에틸아스코빅애씨드, 키토산, 글라이신",
    modes: [], rarity: "EPIC", coinPrice: 280, unlock: { lounge: 3 }, theme: "fresh", shape: "tube", colors: ["#f2f6f8", "#274a6e"],
  }),
  A({
    id: "cleansing-oil", name: "퓨어 비타 라이스 클렌징 오일 150ml", category: "스킨케어", kind: "skincare",
    productCode: "100000146", mallSeq: 330, priceKRW: 89600, volume: "150ml", verified: false, modes: [],
    rarity: "RARE", coinPrice: 110, unlock: {}, theme: "fresh", shape: "pump", colors: ["#f2e36a", "#f7f3df"],
  }),
  A({
    id: "tightup-refill", name: "루미너스 레이어 타이트업 리필", category: "스킨케어", kind: "skincare",
    productCode: "100000130", mallSeq: 252, priceKRW: 73200, verified: false, modes: [],
    rarity: "COMMON", coinPrice: 90, unlock: { stage: 2 }, theme: "none", shape: "pouch", colors: ["#efe6cd", "#d9cba3"],
  }),
  A({
    id: "tightup-cushion", name: "루미너스 레이어 타이트업 쿠션", category: "스킨케어", kind: "skincare",
    productCode: "100000129", mallSeq: 251, priceKRW: 132000, verified: false, modes: [],
    rarity: "EPIC", coinPrice: 200, unlock: { stage: 2 }, theme: "none", shape: "cushion", colors: ["#161616", "#d9d9dc"],
  }),
  A({
    id: "shampoo", name: "시그니처 리바이탈라이징 샴푸", category: "스킨케어", kind: "hairbody",
    productCode: "100000131", mallSeq: 201, priceKRW: 88400, verified: false, modes: [],
    rarity: "RARE", coinPrice: 110, unlock: { lounge: 2 }, theme: "fresh", shape: "tall", colors: ["#cfe3df", "#b7d3ce"],
  }),

  // ─────────────── 더마 디바이스 (2) ───────────────
  A({
    id: "derma-home", name: "더마-HOME (가격문의)", category: "더마 디바이스", kind: "device", mallSeq: 492, priceKRW: 0, verified: true,
    officialNote: "RF 1,000,000Hz · 울트라소닉 800kHz~1MHz · 이온토포레시스 2-WAY (파트너 안내 페이지 표기)",
    modes: ["rf", "us", "ionto"], rarity: "PREMIUM", coinPrice: 0, unlock: {}, theme: "none", shape: "box", colors: ["#f4f4f4", "#1a1a1a"],
  }),
  A({
    id: "derma10-light", name: "더마10 - 올인원 Light패키지", category: "더마 디바이스", kind: "device", mallSeq: 133, priceKRW: 7600000, verified: false,
    modes: [], rarity: "PREMIUM", coinPrice: 9000, unlock: { lounge: 4 }, theme: "none", shape: "box", colors: ["#eef3f8", "#7aa7d6"],
  }),

  // ─────────────── 헬스케어 (9) — 라운지 진열 컬렉션 ───────────────
  ...(
    [
      ["immune-ahcc", "이뮨 메가 플러스 AHCC", 505, 549600, "LEGENDARY"],
      ["daily-energizer", "데일리 메가 에너자이저 플러스 30포", 28, 239600, "EPIC"],
      ["triple-extension", "트리플 메가 익스텐션 60캡슐", 26, 136800, "RARE"],
      ["bone-joint", "본 앤 조인트 액티브 메가 포뮬러 60캡슐", 56, 126000, "RARE"],
      ["protein-shake", "슬림핏 프로틴 쉐이크 고소한 멀티 그레인 40g X 10개입", 58, 90800, "COMMON"],
      ["slimming-probiotics", "슬리밍 메가 프로바이오틱스", 48, 131200, "RARE"],
      ["double-cut", "더블 컷 메가 슬림 플러스", 47, 100800, "RARE"],
      ["propolis", "데일리 츄어블 프로폴리스 90캡슐", 30, 43200, "COMMON"],
      ["vapple-night", "브이애플 나이트 액션", 202, 148800, "RARE"],
    ] as const
  ).map(([id, name, mallSeq, priceKRW, rarity]) =>
    A({ id, name, category: "헬스케어", kind: "health", mallSeq, priceKRW, verified: false, modes: [], rarity, coinPrice: Math.round(priceKRW / 900), unlock: { lounge: 2 }, theme: "none", shape: "box", colors: ["#f3efe6", "#c9a66b"] }),
  ),

  // ─────────────── 리빙 (5) ───────────────
  ...(
    [
      ["bamboo-towel", "리얼 그린라이프 프리미엄 대나무 압축타올 30입", 22, 36000],
      ["facial-tissue", "리얼 그린라이프 프리미엄 페이셜 티슈 5입", 20, 27600],
      ["kitchen-towel", "리얼 그린라이프 프리미엄 키친타올 점보롤 4입", 24, 74400],
      ["toilet-tissue", "리얼 그린라이프 프리미엄 토일렛 화장지 12롤", 23, 32400],
      ["tissue-case", "리얼 그린라이프 프리미엄 페이셜 티슈 케이스", 21, 32400],
    ] as const
  ).map(([id, name, mallSeq, priceKRW]) =>
    A({ id, name, category: "리빙", kind: "living", mallSeq, priceKRW, verified: false, modes: [], rarity: "COMMON", coinPrice: Math.round(priceKRW / 900), unlock: { lounge: 2 }, theme: "none", shape: "box", colors: ["#eef2e4", "#9bb07c"] }),
  ),

  // ─────────────── 브랜드 아이템 (15) ───────────────
  ...(
    [
      ["biz-note", "유니앤코어 비즈니스 노트 2+2 세트", 410, 40400],
      ["vday-bottle", "유니앤코어 V:DAY 보틀", 332, 25200],
      ["desk-mirror", "유니앤코어 탁상거울", 331, 17800],
      ["banner-health", "유니앤코어 공식 배너 건강기능식품 4종", 262, 327600],
      ["banner-cosmetic", "유니앤코어 공식 배너 화장품 4종", 125, 327600],
      ["mist-bottle", "유니앤코어 휴대용 미스트 용기", 73, 5200],
      ["bag-l5", "유니앤코어 쇼핑백 (대형, 5입)", 75, 15200],
      ["bag-s5", "유니앤코어 쇼핑백 (소형, 5입)", 95, 12800],
      ["gift-box5", "유니앤코어 기프트 박스 (5입)", 102, 19000],
      ["ice-bottle", "아이스 워터보틀", 69, 5200],
      ["bag-l", "유니앤코어 쇼핑백 (대형)", 74, 3200],
      ["bag-s", "유니앤코어 쇼핑백 (소형)", 76, 2800],
      ["gift-box1", "유니앤코어 기프트 박스(1입)", 78, 4000],
      ["cotton-pouch", "유니앤코어 코튼 파우치", 81, 7800],
      ["paper-cup", "유니앤코어 친환경 종이컵 8oz (200개)", 80, 50400],
    ] as const
  ).map(([id, name, mallSeq, priceKRW]) =>
    A({ id, name, category: "브랜드 아이템", kind: "brand", mallSeq, priceKRW, verified: false, modes: [], rarity: "COMMON", coinPrice: Math.max(20, Math.round(priceKRW / 900)), unlock: { lounge: 3 }, theme: "none", shape: "box", colors: ["#f5f1e8", "#1b1719"] }),
  ),
];

/** [게임 데이터] 게임 내 1회 구매로 얻는 사용 횟수 (실제 용량·사용 횟수와 무관한 게임 밸런스 값) */
const USES: Record<string, number> = { "vitac-mask": 5, "vitac-ampoule": 8, "deep-repair-cream": 8, "toner-pad": 10, "soothing-gel": 10, "serum-mist": 10, "scalp-serum": 10, "body-cream": 8 };
export const usesOf = (id: string) => USES[id] ?? 1;

export const PRODUCT_MAP: Record<string, Product> = Object.fromEntries(PRODUCTS.map((p) => [p.id, p]));
export const CARE_PRODUCTS = PRODUCTS.filter((p) => p.modes.length > 0 && p.kind !== "device");
export const productImage = (p: Product) => `./products/${p.mallSeq}.webp`;
/** 공식몰 상세는 폼 전송 방식이라 목록 페이지로 연결한다 (비공개 API 호출 없음). */
export const MALL_URL = "https://www.unincore.com/shopping/search/list.do?schBigCategoryId=01";

export const RARITY_COLOR: Record<Rarity, string> = {
  COMMON: "#9aa3ad", RARE: "#5aa0e6", EPIC: "#a678e2", LEGENDARY: "#e2a13a", PREMIUM: "#1b1719",
};
