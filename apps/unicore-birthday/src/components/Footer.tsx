import { product } from "@/data/product";
import { trial } from "@/data/clinical";

export default function Footer() {
  return (
    <footer className="section" style={{ borderTop: "1px solid var(--line)", background: "var(--bg-midnight)", color: "var(--muted)", fontSize: 12, lineHeight: 1.7 }}>
      <div className="section-inner" style={{ paddingBlock: 40, display: "grid", gap: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ font: "500 13px/1 var(--font-serif)", letterSpacing: ".35em", color: "var(--ivory)" }}>{product.brand}</span>
          <nav style={{ display: "flex", gap: 18, flexWrap: "wrap" }} aria-label="하단">
            <a href="#clinical">임상 시험 조건</a>
            <a href="#ingredients">성분</a>
            <a href="#how-to-use">사용법</a>
            <a href={product.urls.brand} target="_blank" rel="noopener">브랜드 소개</a>
          </nav>
        </div>
        <p style={{ margin: 0 }}>
          임상 수치는 {trial.institute} 인체적용시험({trial.code}, {trial.subjects}, {trial.period}, {trial.usage}) 결과이며 {trial.disclaimer} 사용 만족도는 동일 시험의 주관적 설문 결과입니다.
        </p>
        <p style={{ margin: 0 }}>{product.name} {product.volume.g} g / {product.volume.oz} oz · {product.subtitle} · © {product.brandKo}</p>
      </div>
    </footer>
  );
}
