import ModerationAPI from '@moderation-api/sdk';

export type ProviderModerationResponse = Awaited<
  ReturnType<ModerationAPI['content']['submit']>
>;

export type ModerationEvaluation = ProviderModerationResponse['evaluation'];
export type ModerationRecommendation =
  ProviderModerationResponse['recommendation'];

export interface ModerationResult<T = ProviderModerationResponse> {
  flagged: boolean;
  /**
   * Provider recommendation keyword (e.g. allow, review, reject).
   */
  action: 'allow' | 'review' | 'reject';
  evaluation: ModerationEvaluation;
  recommendation: ModerationRecommendation;
  raw: T;
}

export interface BaseModerationParams {
  contentId: string;
  authorId: string;
  metadata?: Record<string, unknown>;
}

export interface ImageModerationParams extends BaseModerationParams {
  url: string;
}
