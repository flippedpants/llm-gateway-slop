import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Database, Layers, Sparkles, Zap } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { MetricCard } from '../components/ui/MetricCard';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { AdminNotice } from '../components/common/AdminNotice';
import { SimilarityBarChart } from '../components/charts/SimilarityBarChart';
import { ApiError, BackendUsageResponse, RuntimeConfig } from '../types/gateway';
import { getRuntimeConfig, getUsageSnapshot, mapActivity, mapCache } from '../services/metrics';

export const CachePage: React.FC = () => {
  const { setIsMobileOpen, gatewayOnline } = useOutletContext<any>();
  const [usage, setUsage] = useState<BackendUsageResponse | null>(null);
  const [config, setConfig] = useState<RuntimeConfig | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  useEffect(() => { Promise.all([getUsageSnapshot(), getRuntimeConfig()]).then(([u, c]) => { setUsage(u); setConfig(c); }).catch(setError); }, []);
  const cache = usage ? mapCache(usage) : null;
  const activity = usage ? mapActivity(usage) : [];
  return <div className="space-y-6">
    <PageHeader title="Semantic Cache" description="Live pgvector deduplication telemetry without prompt exposure." onOpenMobileSidebar={() => setIsMobileOpen(true)} gatewayOnline={gatewayOnline} />
    <div className="px-4 sm:px-8 max-w-7xl mx-auto space-y-6">
      {error ? <AdminNotice message={error.detail} /> : <>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard label="Cache Hit Rate" value={cache ? cache.hitRate + '%' : '...'} sublabel={'Threshold >= ' + (config?.cache_similarity_threshold ?? '...')} badgeVariant="live" badgeText="Live" icon={<Zap className="w-4 h-4 text-emerald-500" />} />
          <MetricCard label="Cache Hits" value={cache ? cache.hits.toLocaleString() : '...'} sublabel="Provider calls avoided" badgeVariant="live" badgeText="Live" icon={<Database className="w-4 h-4 text-blue-500" />} />
          <MetricCard label="Cache Misses" value={cache ? cache.misses.toLocaleString() : '...'} sublabel="Forwarded requests" badgeVariant="live" badgeText="Live" icon={<Layers className="w-4 h-4 text-purple-500" />} />
          <MetricCard label="Active Entries" value={cache?.activeEntries?.toLocaleString() ?? '...'} sublabel="HNSW-indexed responses" badgeVariant="live" badgeText="Live" icon={<Sparkles className="w-4 h-4 text-amber-500" />} />
        </div>
        <Card title="Similarity Distribution" subtitle="Cosine similarity scores from successful chat requests" headerAction={<Badge variant="live">Live Data</Badge>}><SimilarityBarChart data={usage?.similarity_distribution ?? []} /><p className="text-[11px] text-slate-500 mt-3">Model: {config?.embedding_model} ({config?.embedding_dimensions} dimensions)</p></Card>
        <Card title="Recent Cache Activity" subtitle="Request IDs, lookup outcomes, and latency; prompts are never returned">
          <div className="space-y-2">{activity.length ? activity.map(item => <div key={item.id} className="grid grid-cols-4 gap-3 border-b border-slate-100 py-2 text-xs"><span>{item.time}</span><span className="font-mono truncate">{item.id}</span><Badge variant={item.result === 'HIT' ? 'hit' : 'miss'}>{item.result}</Badge><span className="text-right">{item.similarity?.toFixed(4)} / {item.latency}</span></div>) : <p className="text-sm text-slate-500">No cache activity recorded yet.</p>}</div>
        </Card>
      </>}
    </div>
  </div>;
};
