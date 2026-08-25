import { useEffect, useRef } from "react";
import { Game } from "@/game/engine";
import { useGame } from "@/game/store";
import {
  GameOver,
  HelpScreen,
  HighScores,
  Hud,
  PauseMenu,
  SkillMap,
  TitleScreen,
  TouchControls,
} from "@/components/game-overlays";
import { FullscreenButtons } from "@/components/fullscreen-ui";

export function GameView() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const phase = useGame((s) => s.phase);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const game = new Game(canvas);
    game.startLoop();
    return () => game.destroy();
  }, []);

  return (
    <main
      data-game-root
      className="relative h-dvh w-full touch-none overflow-hidden bg-bg text-fg"
      style={{ touchAction: "none" }}
    >
      <canvas
        ref={canvasRef}
        className="block h-full w-full touch-none select-none"
        style={{ touchAction: "none" }}
      />
      <Hud />
      <TouchControls />
      {phase === "title" ? <TitleScreen /> : null}
      {phase === "help" ? <HelpScreen /> : null}
      {phase === "paused" ? <PauseMenu /> : null}
      {phase === "skills" || phase === "forge" ? <SkillMap /> : null}
      {phase === "gameover" ? <GameOver /> : null}
      {phase === "scores" ? <HighScores /> : null}
      {phase === "title" || phase === "help" || phase === "scores" ? (
        <div className="pointer-events-none absolute right-3 top-[max(0.75rem,env(safe-area-inset-top))] z-30 flex gap-2 sm:right-5">
          <FullscreenButtons className="pointer-events-auto" />
        </div>
      ) : null}
    </main>
  );
}
