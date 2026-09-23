import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Database, Eye, EyeOff, RefreshCw, Server, ShieldCheck } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { StatusDot } from '../components/common/StatusDot';
import { ApiError, RuntimeConfig } from '../types/gateway';
import { checkGatewayHealth } from '../services/gateway';
import { getAdminApiKey, setAdminApiKey } from '../services/api';
import { getRuntimeConfig } from '../services/metrics';

export const SettingsPage: React.FC = () => {
  const { setIsMobileOpen, gatewayOnline: initialOnline } = useOutletContext<any>();
  const [adminKey, setKey] = useState(getAdminApiKey() ?? '');
  const [showKey, setShowKey] = useState(false);
  const [config, setConfig] = useState<RuntimeConfig | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [online, setOnline] = useState<boolean | null>(initialOnline);
  const [checking, setChecking] = useState(false);

  const loadConfig = () => { setError(null); getRuntimeConfig().then(setConfig).catch(setError); };
  useEffect(() => { if (getAdminApiKey()) loadConfig(); }, []);
  const saveAdmin = () => { setAdminApiKey(adminKey); setConfig(null); if (adminKey.trim()) setTimeout(loadConfig, 0); };
  const test = async () => { setChecking(true); setOnline(await checkGatewayHealth()); setChecking(false); };

  return <div className="space-y-6">
    <PageHeader title="Settings" description="Connection credentials and read-only gateway runtime configuration." onOpenMobileSidebar={() => setIsMobileOpen(true)} gatewayOnline={online} />
    <div className="px-4 sm:px-8 max-w-4xl mx-auto space-y-6">
      <Card title={<span className="flex items-center gap-2"><Server className="w-4 h-4 text-blue-600" />Gateway Connection</span>} subtitle="Vite proxies /api requests to FastAPI on port 8000" headerAction={<Badge variant="live">Live</Badge>}>
        <div className="flex justify-between items-center"><StatusDot status={online === null ? 'checking' : online ? 'online' : 'offline'} /><Button variant="secondary" size="sm" onClick={test} isLoading={checking} leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>Test Connection</Button></div>
      </Card>
      <Card title={<span className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-emerald-600" />Admin Session</span>} subtitle="Used for telemetry, cache, and API-key administration; cleared when this browser session ends.">
        <div className="space-y-3"><label className="text-xs font-semibold text-slate-700">Admin key</label><div className="flex gap-2"><div className="relative flex-1"><input type={showKey ? 'text' : 'password'} value={adminKey} onChange={event => setKey(event.target.value)} className="w-full px-3 py-2 pr-10 border rounded-md font-mono text-sm" autoComplete="off" /><button type="button" onClick={() => setShowKey(!showKey)} className="absolute right-3 top-2.5 text-slate-400">{showKey ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}</button></div><Button variant="primary" size="sm" onClick={saveAdmin}>Save for session</Button></div>{error && <p className="text-xs text-red-600">{error.detail}</p>}</div>
      </Card>
      <Card title={<span className="flex items-center gap-2"><Database className="w-4 h-4 text-purple-600" />Runtime Configuration</span>} subtitle="Environment-controlled and intentionally read-only">
        {config ? <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div><dt className="text-slate-500">Cache threshold</dt><dd className="font-mono font-semibold">{config.cache_similarity_threshold}</dd></div>
          <div><dt className="text-slate-500">Embedding model</dt><dd className="font-mono font-semibold break-all">{config.embedding_model}</dd></div>
          <div><dt className="text-slate-500">Embedding dimensions</dt><dd className="font-mono font-semibold">{config.embedding_dimensions}</dd></div>
          <div><dt className="text-slate-500">Compression target</dt><dd className="font-mono font-semibold">{Math.round(config.compression_target_ratio * 100)}%</dd></div>
          <div><dt className="text-slate-500">Enabled providers</dt><dd className="font-mono font-semibold">{config.enabled_providers.join(', ')}</dd></div>
          <div><dt className="text-slate-500">Judge provider</dt><dd className="font-mono font-semibold">{config.judge_provider}</dd></div>
        </dl> : <p className="text-sm text-slate-500">Save a valid admin key to load the live configuration.</p>}
      </Card>
    </div>
  </div>;
};
