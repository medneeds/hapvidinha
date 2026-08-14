// Feature flags centralizadas. Para reativar um módulo, basta trocar para true.
export const FEATURE_FLAGS = {
  CLINIKUS_AI_ENABLED: false,
  /** Curvas de exames (Examinus clássico) */
  EXAMINUS_AI_ENABLED: false,
  /** Examinus IA — sugestão e análise de exames com inteligência artificial */
  EXAMINUS_AI_ASSIST_ENABLED: true,
} as const;

export const EXAMINUS_ENABLED =
  FEATURE_FLAGS.EXAMINUS_AI_ENABLED || FEATURE_FLAGS.EXAMINUS_AI_ASSIST_ENABLED;
