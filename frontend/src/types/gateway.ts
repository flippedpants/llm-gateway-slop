export interface ChatMessage { role: 'user' | 'assistant' | 'system' | 'tool'; content: string; }
export interface TokenUsage { prompt_tokens: number; completion_tokens: number; total_tokens: number; }
export interface CompressionMetadata { strategy?: string; original_tokens: number; compressed_tokens: number; tokens_saved: number; reduction_percent: number; }
export interface GatewayMetadata { request_id: string; provider: string; model: string; cache_hit: boolean; similarity: number; llm_called: boolean; latency_ms: number; compression: CompressionMetadata | null; }
export interface ChatCompletionResponse { choices: Array<{ message: { role: string; content: string } }>; usage: TokenUsage; gateway: GatewayMetadata; }
export interface CandidateResult { candidate_id: string; provider: string; model: string; text: string; latency_ms: number; usage?: TokenUsage | null; error?: string | null; }
export interface JudgeResult { provider: string; model: string; scores: Record<string, number>; reasoning: string; fallback_used: boolean; }
export interface TournamentResponse { winner_id: string; winning_response: string; candidates: Array<{ candidate_id: string; provider: string; model: string; response: string | null; latency_ms: number; usage?: TokenUsage | null; error?: string | null }>; judge: JudgeResult; usage: TokenUsage; compression: CompressionMetadata; latency_ms: number; }
export interface LiveRequestResult { response: string; cache_hit: boolean; similarity: number; provider: string; model: string; candidates?: CandidateResult[]; winning_model?: string; winner_id?: string; judge_score?: number; judge?: JudgeResult; usage: TokenUsage; compression: CompressionMetadata | null; roundTripLatencyMs: number; timestamp: string; tournament: boolean; }
export interface HealthResponse { status: string; }
export interface ApiError { detail: string; status?: number; retryAfter?: number; requestId?: string; }
export interface RequestDataPoint { day: string; date?: string; requests: number; }
export interface SimilarityBucket { range: string; count: number; }
export interface ActivityLogItem { id: string; time: string; result: 'HIT' | 'MISS'; similarity: number | null; latency: string; }
export type CacheEntryActivity = ActivityLogItem;
export interface CacheBreakdown { hits: number; misses: number; hitRate: number; activeEntries?: number; }
export interface CompressionMetrics { originalTokens: number; compressedTokens: number; tokensSaved: number; compressionRatio: number; }
export interface TournamentMetrics { tournamentsCount: number; averageCandidates: number; averageWinningScore: number; judgeFallbackRate: number; }
export interface BackendUsageResponse { total_requests: number; cache_hits: number; cache_misses: number; cache_hit_rate: number; active_cache_entries: number; llm_calls: number; llm_calls_avoided: number; rate_limited_requests: number; avg_latency_ms: number | null; total_input_tokens: number; total_output_tokens: number; total_tokens: number; compressed_tokens_saved: number; compression: { original_tokens: number; compressed_tokens: number; tokens_saved: number; reduction_percent: number }; tournaments: { count: number; average_candidates: number; average_winning_score: number; judge_fallback_rate: number }; history: RequestDataPoint[]; recent_activity: Array<{ id: string; time: string; result: 'HIT' | 'MISS'; similarity: number; latency_ms: number }>; similarity_distribution: SimilarityBucket[]; }
export interface DashboardMetrics { totalRequests: number; cacheHitRate: number; tokensSaved: number; callsAvoided: number; averageLatencySec: number | null; }
export interface UsageMetrics { totalRequests: number; llmCalls: number; cacheHits: number; callsAvoided: number; rateLimitedRequests: number; totalInputTokens: number; totalOutputTokens: number; totalTokens: number; tokensSaved: number; }
export interface ApiKeyItem { id: string; name: string; maskedKey: string; createdAt: string; lastUsed: string | null; status: 'active' | 'revoked'; rateLimitCapacity: number; refillRatePerSecond: number; }
export interface RuntimeConfig { cache_similarity_threshold: number; embedding_model: string; embedding_dimensions: number; compression_min_tokens: number; compression_target_ratio: number; enabled_providers: string[]; tournament_providers: string[]; judge_provider: string; }
