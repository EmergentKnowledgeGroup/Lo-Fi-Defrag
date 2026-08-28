export function normalizeFrequencyEnergy(
  data: Uint8Array<ArrayBufferLike>,
): number {
  if (data.length === 0) {
    return 0;
  }

  let total = 0;
  for (const value of data) {
    total += value;
  }

  return total / (data.length * 255);
}

export function estimateBpmFromPeaks(peaksMs: number[]): number | null {
  if (peaksMs.length < 6) {
    return null;
  }

  const histogram = new Map<number, number>();

  for (let index = 1; index < peaksMs.length; index += 1) {
    const interval = peaksMs[index] - peaksMs[index - 1];
    if (interval < 240 || interval > 2000) {
      continue;
    }

    let bpm = 60000 / interval;
    while (bpm < 70) {
      bpm *= 2;
    }
    while (bpm > 160) {
      bpm /= 2;
    }

    const rounded = Math.round(bpm);
    histogram.set(rounded, (histogram.get(rounded) ?? 0) + 1);
  }

  let winner: number | null = null;
  let winnerScore = 0;
  for (const [candidate, score] of histogram.entries()) {
    if (score > winnerScore) {
      winner = candidate;
      winnerScore = score;
    }
  }

  return winnerScore >= 4 ? winner : null;
}
