/**
 * 구매 후기 이벤트 카피·설정. 화면 문구는 이 파일만 수정합니다.
 * 접수 기준(글자 수·사진 필수 여부·기간·보상 상품명)은 관리자 화면(/admin) > 벌스데이 크림 후기 이벤트에서 바꾸며,
 * 페이지는 접수 API(/config)의 값을 우선 사용하고 아래 값은 API 응답 전의 기본 표시용입니다.
 */
export const reviewEvent = {
  /** 접수 API — Supabase Edge Function. 로컬 검수 시 NEXT_PUBLIC_REVIEW_API 로 교체 (backend: npm run serve) */
  apiBase: (process.env.NEXT_PUBLIC_REVIEW_API || "https://qeabsjyglethzkwlkmaw.supabase.co/functions/v1/birthday-review").replace(/\/$/, ""),
  /** 브랜드 페이지 (제품 이야기) */
  brandSite: "https://birthday.unincore.com",
  hero: {
    en: "YOUR SKIN HAS A BIRTHDAY.",
    ko: "나의 피부가 다시 맞이하는 특별한 생일",
    product: "UNI&CORE 1ST BIRTHDAY CREAM",
    badge: "REVIEW EVENT",
    lead: "구매하고 경험한 특별한 순간을 공유해 주세요.",
    sub1: "벌스데이 크림과 함께한 피부의 변화를 들려주세요.",
    sub2: "소중한 후기를 남겨주신 모든 참여자에게 특별한 선물을 드립니다.",
    cta: "지금 후기 이벤트 참여하기",
  },
  reward: {
    en: "SPECIAL GIFT FOR YOU",
    ko: "여러분의 소중한 후기에 감사의 마음을 담았습니다.",
    winner: {
      no: "REWARD 01", who: "우수 후기 선정", product: "UNI&CORE 1ST BIRTHDAY CREAM", productKo: "퍼스트 벌스데이 크림 50g",
      notes: ["관리자가 후기 내용을 검토하여 선정합니다", "당첨되신 분께는 개별 연락을 드립니다", "선정되신 분께도 프로틴 쉐이크를 함께 드립니다"],
    },
    all: {
      no: "REWARD 02", who: "전체 이벤트 참가자", product: "프로틴 쉐이크 1박스",
      notes: ["참여 조건을 충족한 모든 참가자에게 드립니다", "관리자 확인 후 지급 처리됩니다"],
    },
  },
  guide: {
    en: "HOW TO PARTICIPATE",
    ko: "참여 방법은 단 3단계입니다.",
    steps: [
      { no: "STEP 01", text: "벌스데이 크림 사용 경험을 작성해 주세요." },
      { no: "STEP 02", text: "사용 전 / 사용 후 사진을 업로드해 주세요." },
      { no: "STEP 03", text: "개인정보를 입력하고 이벤트 참여를 완료해 주세요." },
    ],
    after: ["참여 완료 메시지를 바로 확인하실 수 있습니다", "접수 번호가 자동으로 발급됩니다", "접수 번호와 휴대폰 번호로 신청 내용을 확인하실 수 있습니다", "보상 지급 진행 상황을 안내해 드립니다"],
  },
  productCta: "벌스데이 크림 후기 작성하기",
  form: {
    contentPlaceholder: "벌스데이 크림을 사용하면서 느꼈던 피부 변화와 사용 경험을 자유롭게 작성해 주세요.",
  },
  complete: {
    en1: "THANK YOU FOR SHARING", en2: "YOUR FIRST BIRTHDAY.",
    ko1: "소중한 후기를 남겨주셔서 감사합니다.", ko2: "이벤트 참여가 정상적으로 접수되었습니다.",
  },
  notes: [
    "한 분당 1회 참여하실 수 있습니다. 같은 휴대폰 번호로는 다시 접수되지 않습니다.",
    "사용 전·후 사진은 공개되지 않으며, 후기 심사를 위해 관리자만 확인합니다. (마케팅 활용에 동의하신 경우에만 홍보 콘텐츠에 사용될 수 있습니다)",
    "타인의 사진·후기를 도용했거나 제품과 무관한 내용, 중복·부정 참여로 확인되면 참여와 당첨이 취소될 수 있습니다.",
    "사은품은 관리자 확인 후 입력하신 주소로 발송되며, 주소·연락처 오류로 인한 미수령은 재발송이 어려울 수 있습니다.",
    "후기는 개인의 사용 경험이며, 제품의 효과는 개인에 따라 차이가 있을 수 있습니다.",
  ],
  company: { name: "주식회사 유니앤코어", tel: "1551-7970", privacy: "https://www.unincore.com/policy/personal/page.do", terms: "https://www.unincore.com/policy/agreement/page.do" },
} as const;
