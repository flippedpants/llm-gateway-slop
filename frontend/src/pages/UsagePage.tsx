import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Minimize2, ShieldCheck, Trophy } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { MetricCard } from '../components/ui/MetricCard';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { AdminNotice } from '../components/common/AdminNotice';
import { TokenUsageComparisonChart } from '../components/charts/TokenUsageComparisonChart';
import { ApiError, BackendUsageResponse } from '../types/gateway';
import { getUsageSnapshot, mapCompression, mapTournament, mapUsage } from '../services/metrics';

export const UsagePage: React.FC = () => {
  const { setIsMobileOpen, gatewayOnline } = useOutletContext<any>();
  const [data, setData] = useState<BackendUsageResponse | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  useEffect(() => { getUsageSnapshot().then(setData).catch(setError); }, []);
  const usage = data ? mapUsage(data) : null;
  const compression = data ? mapCompression(data) : null;
  const tournament = data ? mapTournament(data) : null;
  const withoutCompression = usage ? usage.totalTokens + usage.tokensSaved : 0;
  return <div className="space-y-6">
    <PageHeader title="Usage & Efficiency" description="Measured request, token, compression, and tournament behavior." onOpenMobileSidebar={() => setIsMobileOpen(true)} gatewayOnline={gatewayOnline} />
    <div className="px-4 sm:px-8 max-w-7xl mx-auto space-y-6">
      {error ? <AdminNotice message={error.detail} /> : <>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <MetricCard label="Total Requests" value={usage ? usage.totalRequests.toLocaleString() : '...'} sublabel="Persisted events" badgeVariant="live" badgeText="Live" />
          <MetricCard label="Provider Calls" value={usage ? usage.llmCalls.toLocaleString() : '...'} sublabel="Logical model calls" badgeVariant="live" badgeText="Live" />
          <MetricCard label="Calls Avoided" value={usage ? usage.callsAvoided.toLocaleString() : '...'} sublabel="Semantic cache hits" badgeVariant="live" badgeText="Live" />
          <MetricCard label="Tokens Saved" value={usage ? usage.tokensSaved.toLocaleString() : '...'} sublabel="Prompt compression" badgeVariant="live" badgeText="Live" />
          <MetricCard label="Rate Limited" value={usage ? usage.rateLimitedRequests.toLocaleString() : '...'} sublabel="HTTP 429 responses" badgeVariant="live" badgeText="Live" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title="Token Efficiency" subtitle="Recorded tokens with and without compression" headerAction={<Badge variant="live">Live Data</Badge>}><TokenUsageComparisonChart withoutGateway={withoutCompression} withGateway={usage?.totalTokens ?? 0} /></Card>
          <Card title="Token Totals" subtitle="Provider-reported and locally counted usage">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 bg-slate-50 rounded border"><p className="text-xs text-slate-500">Input</p><p className="text-2xl font-mono font-bold">{usage?.totalInputTokens.toLocaleString() ?? '...'}</p></div>
              <div className="p-4 bg-slate-50 rounded border"><p className="text-xs text-slate-500">Output</p><p className="text-2xl font-mono font-bold">{usage?.totalOutputTokens.toLocaleString() ?? '...'}</p></div>
              <div className="p-4 bg-blue-50 rounded border border-blue-200"><p className="text-xs text-blue-700">Total</p><p className="text-2xl font-mono font-bold text-blue-700">{usage?.totalTokens.toLocaleString() ?? '...'}</p></div>
              <div className="p-4 bg-emerald-50 rounded border border-emerald-200"><p className="text-xs text-emerald-700">Compression saved</p><p className="text-2xl font-mono font-bold text-emerald-700">{usage?.tokensSaved.toLocaleString() ?? '...'}</p></div>
            </div>
          </Card>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title={<span className="flex items-center gap-2"><Minimize2 className="w-4 h-4 text-emerald-600" />Prompt Compression</span>} subtitle="Aggregated only when prompts are forwarded upstream">
            <div className="grid grid-cols-2 gap-3 text-sm"><div>Original tokens<br/><strong className="text-xl">{compression?.originalTokens.toLocaleString()}</strong></div><div>Compressed tokens<br/><strong className="text-xl">{compression?.compressedTokens.toLocaleString()}</strong></div><div>Tokens saved<br/><strong className="text-xl text-emerald-600">{compression?.tokensSaved.toLocaleString()}</strong></div><div>Reduction<br/><strong className="text-xl text-blue-600">{compression?.compressionRatio}%</strong></div></div>
          </Card>
          <Card title={<span className="flex items-center gap-2"><Trophy className="w-4 h-4 text-purple-600" />Response Tournaments</span>} subtitle="Persisted judge outcomes">
            <div className="grid grid-cols-2 gap-3 text-sm"><div>Tournaments<br/><strong className="text-xl">{tournament?.tournamentsCount}</strong></div><div>Average candidates<br/><strong className="text-xl">{tournament?.averageCandidates}</strong></div><div>Winning score<br/><strong className="text-xl text-purple-600">{tournament?.averageWinningScore}</strong></div><div>Judge fallback rate<br/><strong className="text-xl text-amber-600">{tournament?.judgeFallbackRate}%</strong></div></div>
          </Card>
        </div>
        <Card title={<span className="flex items-center gap-2"><ShieldCheck className="w-4 h-4" />Metric interpretation</span>} subtitle="No fictional pricing assumptions"><p className="text-sm text-slate-600">Efficiency is reported from request logs, token counts, cache decisions, and judge traces. The local deterministic provider has no monetary price, so this page intentionally does not estimate dollar savings.</p></Card>
      </>}
    </div>
  </div>;
};
