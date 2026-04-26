// Bayesian ortalama — az oylanan fotoğrafları global ortalamayla dengeler.
// score = (C * globalMean + totalScore) / (C + voteCount)
// C arttıkça az oylular global ortalamaya daha çok çekilir.
export const BAYESIAN_C = 5;
export const DEFAULT_MEAN = 5.0;

export function bayesianScore(totalScore: number, voteCount: number, globalMean: number): number {
  if (voteCount === 0) return globalMean;
  return (BAYESIAN_C * globalMean + totalScore) / (BAYESIAN_C + voteCount);
}
