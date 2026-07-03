const PALETTE = ['#e6194b', '#3cb44b', '#4363d8', '#f58231', '#911eb4', '#008080'];

export function machineColor(index: number): string {
  return PALETTE[index % PALETTE.length];
}
