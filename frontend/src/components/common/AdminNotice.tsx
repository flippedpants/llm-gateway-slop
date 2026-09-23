import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../ui/Card';

export const AdminNotice: React.FC<{ message: string }> = ({ message }) => (
  <Card title="Admin access required" subtitle="Live operational data is protected by the gateway admin key.">
    <p className="text-sm text-slate-600">{message}</p>
    <Link to="/settings" className="inline-block mt-3 text-sm font-semibold text-blue-600 hover:underline">Configure admin key in Settings</Link>
  </Card>
);
