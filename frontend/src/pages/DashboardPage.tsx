import React, { useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { Activity, Clock, Minimize2, Terminal, Zap } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { MetricCard } from '../components/ui/MetricCard';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { AdminNotice } from '../components/common/AdminNotice';
import { RequestOverviewChart } from '../components/charts/RequestOverviewChart';
import { CacheDonutChart } from '../components/charts/CacheDonutChart';
import { ApiError, BackendUsageResponse } from '../types/gateway';
import { getUsageSnapshot, mapActivity, mapCache, mapDashboard } from '../services/metrics';

export const DashboardPage: React.FC = () => {
  const { setIsMobileOpen, gatewayOnline } = useOutletContext<any>();
  const [data, setData] = useState<BackendUsageResponse | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  useEffect(() => { getUsageSnapshot().then(setData).catch(setError); }, []);
  const metrics = data ? mapDashboard(data) : null;
  const cache = data ? mapCache(data) : null;
  const activity = data ? mapActivity(data) : [];
  return <div className="space-y-6">
    <PageHeader title="Dashboard" description="Live gateway performance and optimization telemetry." onOpenMobileSidebar={() => setIsMobileOpen(true)} gatewayOnline={gatewayOnline} actions={<Link to="/playground"><Button variant="primary" size="sm" leftIcon={<Terminal className="w-3.5 h-3.5" />}>Open Playground</Button></Link>} />
    <div className="px-4 sm:px-8 max-w-7xl mx-auto space-y-6">
      {error ? <AdminNotice message={error.detail} /> : <>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <MetricCard label="Total Requests" value={metrics ? metrics.totalRequests.toLocaleString() : '...'} sublabel="Persisted gateway events" badgeVariant="live" badgeText="Live" icon={<Activity className="w-4 h-4" />} />
          <MetricCard label="Cache Hit Rate" value={metrics ? metrics.cacheHitRate + '%' : '...'} sublabel="Successful chat lookups" badgeVariant="live" badgeText="Live" icon={<Zap className="w-4 h-4 text-emerald-500" />} />
          <MetricCard label="Tokens Saved" value={metrics ? metrics.tokensSaved.toLocaleString() : '...'} sublabel="Prompt compression" badgeVariant="live" badgeText="Live" icon={<Minimize2 className="w-4 h-4 text-blue-500" />} />
          <MetricCard label="Calls Avoided" value={metrics ? metrics.callsAvoided.toLocaleString() : '...'} sublabel="Semantic cache hits" badgeVariant="live" badgeText="Live" icon={<Zap className="w-4 h-4 text-purple-500" />} />
          <MetricCard label="Avg. Latency" value={metrics?.averageLatencySec == null ? '...' : metrics.averageLatencySec.toFixed(2) + 's'} sublabel="Recorded requests" badgeVariant="live" badgeText="Live" icon={<Clock className="w-4 h-4 text-amber-500" />} />
        </div>
        <Card title="Request Overview" subtitle="Persisted requests over the last seven days" headerAction={<Badge variant="live">Live Data</Badge>}><RequestOverviewChart data={data?.history ?? []} /></Card>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card title="Cache Performance" subtitle="Semantic hits versus misses"><CacheDonutChart data={cache ?? { hits: 0, misses: 0, hitRate: 0 }} /></Card>
          <Card title="Recent Cache Activity" subtitle="Prompt-free request telemetry" className="lg:col-span-2">
            <div className="space-y-2">{activity.length ? activity.slice(0, 8).map(item => <div key={item.id} className="flex justify-between border-b border-slate-100 py-2 text-xs"><span className="font-mono">{item.id.slice(0, 18)}</span><Badge variant={item.result === 'HIT' ? 'hit' : 'miss'}>{item.result}</Badge><span>{item.similarity?.toFixed(4)}</span><span>{item.latency}</span></div>) : <p className="text-sm text-slate-500">No requests recorded yet.</p>}</div>
          </Card>
        </div>
      </>}
    </div>
  </div>;
};
