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
    </main>
  );
}
