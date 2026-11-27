export const howto = {
  intro: "세안 후 스킨케어 마지막 단계에 사용하세요",
  steps: [
    { step: "STEP 1.", area: "얼굴", line1: "진주알 1개 크기만큼 덜어", line2: "얼굴 전체에 부드럽게 펴 발라주세요" },
    { step: "STEP 2.", area: "목", line1: "목 앞뒤로 충분히 도포하여", line2: "부드럽게 펴 발라주세요" },
    { step: "STEP 3.", area: "마무리", line1: "얼굴과 목을 아래에서 위로", line2: "부드럽게 쓸어 올리며 마무리해 주세요" },
  ],
} as const;

/** 유니앤코어 스킨케어 가이드 (상세페이지 마지막 섹션) */
export const lineup = {
  dayRange: [1, 6],
  nightRange: [1, 4],
  steps: [
    { step: "01", tag: "정돈/진정", name: "데일리 카밍 토너 패드" },
    { step: "02", tag: "미백", name: "비타 씨 13.5 수퍼 화이트닝 앰플 or 비타 씨 수퍼 브라이트닝 마스크" },
    { step: "03", tag: "탄력/보습", name: "딥 리페어 액티베이팅 뉴트리션 크림" },
    { step: "04", tag: "처짐/주름", name: "1ST 벌스데이 크림", highlight: true },
    { step: "05", tag: "자외선차단", name: "하이드레이팅 래디언스 선크림 SPF50 PA+++" },
    { step: "06", tag: "보습/보호", name: "하이드레이팅 스킨 배리어 세럼 미스트" },
  ],
} as const;
