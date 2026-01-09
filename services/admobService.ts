// Este arquivo foi esvaziado pois o uso de AdMob Nativo foi revertido.
// Mantém-se o arquivo para evitar erros de importação residual, se houver, mas exportando funções vazias.

export const initializeAdMob = async () => {
  // No-op
};

export const showBanner = async () => {
  // No-op
};

export const hideBanner = async () => {
  // No-op
};

export const showRewardedInterstitial = async (
  onDismiss: () => void,
  onError: () => void
) => {
  // Fallback imediato se chamado acidentalmente
  onError();
};