import { Component, type ReactNode } from "react";
import { useUI } from "./store/ui";
import { Create, Intro, Splash } from "./ui/Screens";
import { World } from "./three/World";
import { Hud } from "./ui/Hud";
import { PanelHost } from "./ui/Panels";
import { CarePanel } from "./ui/CarePanel";

/** WebGL 미지원·렌더 오류 시에도 흰 화면 대신 안내와 복구 버튼을 보여 준다. */
class Boundary extends Component<{ children: ReactNode }, { err: string | null }> {
  state = { err: null as string | null };
  static getDerivedStateFromError(e: Error) { return { err: e?.message ?? "error" }; }
  render() {
    if (!this.state.err) return this.props.children;
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-cream p-6 text-center">
        <p className="text-4xl">🌸</p>
        <p className="text-lg font-black text-ink">문제가 발생했어요 · Something went wrong</p>
        <p className="max-w-sm text-xs text-ink/60">브라우저가 WebGL(3D)을 지원하는지 확인한 뒤 다시 시도해 주세요. 저장된 진행도는 유지됩니다.</p>
        <p className="max-w-sm break-all text-[10px] text-ink/35">{this.state.err}</p>
        <button className="btn-primary" onClick={() => location.reload()}>새로고침 · Reload</button>
      </div>
    );
  }
}

export function App() {
  const screen = useUI((s) => s.screen);
  const mode = useUI((s) => s.mode);
  return (
    <Boundary>
      <div className="fixed inset-0 overflow-hidden bg-cream font-sans text-ink">
        {screen === "splash" && <Splash />}
        {screen === "intro" && <Intro />}
        {screen === "create" && <Create />}
        {screen === "game" && (
          <>
            <World />
            <Hud />
            {mode === "care" && <CarePanel />}
            <PanelHost />
          </>
        )}
      </div>
    </Boundary>
  );
}
