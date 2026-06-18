import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { generateSystemPerformance } from '@/lib/demoDataGenerator';
import { Server, Activity, Users } from 'lucide-react';

export default function SystemAnalyticsPage() {
  const performanceData = generateSystemPerformance();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">System Analytics</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Real-time system health and performance monitoring.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500 flex items-center"><Users className="w-4 h-4 mr-2" /> Online Users</CardTitle>
          </CardHeader>
          <CardContent><div className="text-3xl font-bold">4,289</div></CardContent>
        </Card>
        <Card className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500 flex items-center"><Activity className="w-4 h-4 mr-2" /> Active Sessions</CardTitle>
          </CardHeader>
          <CardContent><div className="text-3xl font-bold">12,450</div></CardContent>
        </Card>
        <Card className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl border-l-4 border-l-purple-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500 flex items-center"><Server className="w-4 h-4 mr-2" /> Server Load</CardTitle>
          </CardHeader>
          <CardContent><div className="text-3xl font-bold">42%</div></CardContent>
        </Card>
      </div>

      <Card className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl">
        <CardHeader>
          <CardTitle>CPU & Memory Usage (Last 24h)</CardTitle>
        </CardHeader>
        <CardContent className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" className="dark:stroke-gray-800" />
              <XAxis dataKey="time" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
              <RechartsTooltip />
              <Line type="monotone" dataKey="cpu" name="CPU %" stroke="#3b82f6" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="memory" name="Memory %" stroke="#8b5cf6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
