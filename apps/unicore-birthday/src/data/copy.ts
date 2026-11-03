/**
 * 섹션별 카피. source 가 'detail-page-261102' 인 문구는 상세페이지 수정본 원문이며 재작성 금지.
 * 'directive' 는 기획 지시문의 영문 보조 카피, 'film' 은 시네마틱 필름 번인 텍스트.
 */
export type CopySource = "detail-page-261102" | "directive" | "film" | "package";

export interface CopyLine {
  text: string;
  source: CopySource;
  legalReview?: boolean;
}

const dp = (text: string, legalReview = false): CopyLine => ({ text, source: "detail-page-261102", legalReview });
const dir = (text: string): CopyLine => ({ text, source: "directive" });
const film = (text: string): CopyLine => ({ text, source: "film" });

export const copy = {
  intro: {
    q1: dp("피부에도 생일이 있다는 거 알고 계셨나요?"),
    q2: dir("오늘, 당신 피부의 첫 번째 생일이 시작됩니다."),
    soundHint: dir("사운드와 함께 감상하시는 것을 권장합니다."),
    soundOn: dir("SOUND ON"),
    soundOff: dir("SOUND OFF"),
    skip: dir("SKIP INTRO"),
    rememberSkip: dir("다음 방문 시 인트로 건너뛰기"),
  },
  s01: {
    en: dir("YOUR SKIN HAS A BIRTHDAY."),
    ko1: dp("시간을 되돌려 처음으로 맞이할"),
    ko2: dp("내 피부의 첫 번째 생일"),
    cake1: dp("당신의 피부가 기다리는 첫 번째 생일"),
    cake2: dp("유니앤코어 퍼스트 벌스데이 크림"),
  },
  s02: {
    d1: dp("각질이 떨어져 나가는 14일"),
    d2: dp("세포가 생성되는 14일"),
    total: dp("총 28일"),
    line1: dp("피부가 다시 태어나기까지"),
    line2: dp("28일이면 충분합니다"),
    filmLine: film("피부의 시간을 되돌려, 새로운 피부의 생일을 맞이하다"),
    days: [dir("DAY 01–14"), dir("DAY 15–28"), dir("TOTAL 28 DAYS")],
    footnote: dir("피부 턴오버 주기에 관한 일반적인 개념을 바탕으로 한 스토리텔링이며, 개인의 피부 상태에 따라 다를 수 있습니다."),
  },
  s03: {
    hint: dir("DRAG TO ROTATE"),
    openLid: dir("OPEN LID"),
    reset: dir("RESET"),
    hotspots: [
      { title: "1ST BIRTHDAY CREAM", desc: "골드 호일 인쇄 · 원본 비율 디칼" },
      { title: "SKIN RE:BIRTH", desc: "피부의 첫 번째 생일" },
      { title: "50 g · 1.76 oz", desc: "브러시드 골드 캡" },
    ],
  },
  s04: {
    concern: dp("피부 처짐과 눈가주름, 목주름 고민"),
    h1a: dp("단 4주, 피부처짐 (볼 리프팅)"),
    h1b: dp("개선"),
    cheekLabel: dp("볼 리프팅(볼륨) 개선율"),
    cheekChart: dp("볼 함몰 부피(㎣)"),
    cheekLine1: dp("단 4주, 벌스데이 크림이"),
    cheekLine2: dp("피부에 볼륨을 부드럽게 채워넣는 시간"),
    neckIntro: dp("4GF로 눈가주름·목주름 걱정 끝!"),
    neckLabel: dp("목 주름 감소율"),
    neckChart: dp("주름 지수 측정값"),
    neckLine1: dp("단 4주, 벌스데이 크림이"),
    neckLine2: dp("피부 주름을 부드럽게 채워주는 시간"),
    safeH: dp("4주동안 피부 이상반응 0건"),
    safeSub: dp("지성·복합성·건성 피부 21명 대상"),
    bridge1: dp("당신의 첫 번째 생일을 위하여"),
    bridge2: dp("볼륨 다음은 재건입니다"),
  },
  s05: {
    eyebrow: dp("유니앤코어의 첫 프리미엄 스킨케어 라인업"),
    h: dp("더 마스터피스"),
    en: dp("THE MASTERPIECE"),
    caption: dp("유니앤코어 퍼스트 벌스데이 크림"),
    line1: dp("마스터 포뮬레이션을 적용한"),
    line2: dp("유니앤코어의 첫 프리미엄 스킨케어 라인업"),
  },
  s06: {
    eyebrow: dp("Key Points"),
    h1: dp("기억할 건"),
    h2: dp("딱 4가지"),
  },
  s07: {
    q1: dp("좋다는 PDRN 많이 써봤는데 솔직히 잘 모르겠다구요?"),
    a1: dp("진짜 PDRN을"),
    a2: dp("안 발라봐서 그래요"),
    h1: dp("그냥 PDRN이 아닙니다"),
    h2: dp("순도 99% 인삼 유래 성분을 그대로"),
    h3: dp("유니앤코어의 3세대 PDRN"),
    cmp1: dp("같은 PDRN도"),
    cmp2: dp("유니앤코어가 하면 다릅니다"),
    cmpSub: dp("왜 유니앤코어 3세대 인삼 PDRN 일까요?"),
    end: dp("PDRN으로 처짐·꺼짐 걱정 끝!"),
  },
  s08: {
    nobel1: dp("인류가 최초로 발견한 상피세포 성장인자"),
    nobel2: dp("노벨상 받은 성분 EGF를 아시나요?", true),
    gf: dp("EGF · IGF · FGF · KGF"),
    gfDesc1: dp("노벨상 성분인 성장인자 EGF와", true),
    gfDesc2: dp("EGF의 작용을 돕는 세 성분이 만나"),
    gfDesc3: dp("피부 주름과 장벽을 케어합니다"),
    exp1: dp("웃을 때, 찡그릴 때"),
    exp2: dp("얼굴에 생기는 표정 주름들"),
    exp3: dp("새로 태어날 수 있다면"),
    pep: dp("아세틸헥사펩타이드-8"),
    pepDesc1: dp("보톡스 펩타이드로 알려진", true),
    pepDesc2: dp("핵심 성분으로"),
    pepDesc3: dp("집중 표정주름 케어"),
    conceptLabel: dir("교육적 개념 시각화"),
  },
  s09: {
    cica1: dp("마무리 진정 솔루션"),
    cica2: dp("시카 카밍 컴플렉스"),
    cicaBridge1: dp("핵심 성분이 많을수록"),
    cicaBridge2: dp("매일 편안하게 사용해야 하니까"),
    h: dp("우레아 & 세라마이드"),
    l1: dp("우레아로 수분을 채우고"),
    l2: dp("세라마이드로 수분을 지키는"),
    l3: dp("수분의 공급과 잠금을 한 번에!"),
  },
  s10: {
    h1: dp("새로운 피부의"),
    h2: dp("생일을 맞이하세요"),
  },
  s11: {
    h: dp("HOW TO USE"),
    sub: dp("세안 후 스킨케어 마지막 단계에 사용하세요"),
  },
  s12: {
    ko: dir("다시 태어날 피부를 위하여"),
    en: dir("YOUR SKIN. YOUR FIRST BIRTHDAY."),
    name: dir("UNI&CORE 1ST BIRTHDAY CREAM"),
    cta1: dir("제품 구매하기"),
    cta2: dir("제품 상세정보"),
    cta3: dir("유니앤코어 브랜드 소개"),
  },
  s13: {
    h1: dp("유니앤코어"),
    h2: dp("스킨케어 가이드"),
    en: dp("Skincare Guide"),
  },
} as const;
