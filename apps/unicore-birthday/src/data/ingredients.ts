import { detail } from "@/data/images";

export interface Ingredient {
  id: string;
  index: string;
  name: string;
  claim1: string;
  claim2: string;
  color: string;
  sub?: { name: string; desc: string }[];
  still?: string;
  /** 상세페이지 비주얼 (텍스트 없는 크롭) */
  image?: string;
}

/** 상세페이지 「기억할 건 딱 4가지」 원문 */
export const keyIngredients: Ingredient[] = [
  { id: "pdrn", index: "01", name: "3세대 인삼유래 PDRN", claim1: "내려앉은 피부에", claim2: "차세대 PDRN 리프팅", color: "#C6A16A", image: detail.ingGinseng },
  { id: "gf", index: "02", name: "EGF IGF FGF KGF", claim1: "4GF 4종 성장인자로", claim2: "매끈하고 쫀쫀한 피부", color: "#E5C58D", image: detail.ingGoldDrop },
  {
    id: "peptide", index: "03", name: "아세틸헥사펩타이드-8", claim1: "생기 없는 피부에", claim2: "깊은주름 억제 & 케어", color: "#F4EFE7", image: detail.ingPeptide,
    sub: [{ name: "아세틸헥사펩타이드-8", desc: "집중 표정주름 케어" }, { name: "카퍼트라이펩타이드-1", desc: "" }],
  },
  {
    id: "cica", index: "04", name: "시카컴플렉스 & 우레아 · 세라마이드", claim1: "지친 피부 진정 케어,", claim2: "수분 충전 & 보습", color: "#7FB08A", image: detail.ingCica,
    sub: [
      { name: "자작나무껍질추출물", desc: "피부를 정돈하는 자작나무 껍질" },
      { name: "병풀 유래 3종 성분", desc: "지친 피부를 차분하게 진정" },
      { name: "베타-글루칸", desc: "건조한 피부를 촉촉하게 진정" },
    ],
  },
];

/** PDRN 세대 비교 — 원문 */
export const pdrnGenerations = [
  { gen: 1, name: "1세대 연어 PDRN", line1: "동물 유래 원료로,", line2: "외부 환경에 민감한 한계", color: "#E8A399", highlight: false, image: detail.pdrnSalmon },
  { gen: 2, name: "2세대 식물성 PDRN", line1: "식물 유래이지만,", line2: "유효 성분 순도·함량 편차가 큰 한계", color: "#B7D9A1", highlight: false, image: detail.pdrnPlant },
  { gen: 3, name: "3세대 인삼 PDRN", line1: "99% 인삼 유효성분 보존으로", line2: "순도·함량 편차가 일관적이고 부드럽고 강력한 리프팅 성능", color: "#E5C58D", highlight: true, image: detail.pdrnGinseng },
] as const;

/** 순도 99% 문구는 원문 그대로 사용, 원료사 근거 자료는 수령 대기 */
export const purityClaim = { text: "순도 99% 인삼 유래 성분", evidence: "pending" as const };
