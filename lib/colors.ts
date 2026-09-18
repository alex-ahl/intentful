// Sampled from assets/images/icon.png: navy ground, sand mark, teal pause bars.
export const colors = {
  ground: "#10243D",
  surface: "#16304C",
  surfaceRaised: "#24405F",
  sand: "#E3CFAD",
  teal: "#78A59C",
  text: "#E8DFD0",
  textMuted: "#8FA3B8",
} as const;

// The shield APIs take channels, not hex.
export function rgb(hex: string): { red: number; green: number; blue: number } {
  return {
    red: parseInt(hex.slice(1, 3), 16),
    green: parseInt(hex.slice(3, 5), 16),
    blue: parseInt(hex.slice(5, 7), 16),
  };
}
