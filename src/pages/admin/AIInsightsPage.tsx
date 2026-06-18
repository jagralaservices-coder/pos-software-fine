import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';

export default function AIInsightsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
        <Sparkles className="text-blue-500" /> AI Insights
      </h1>
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
        <CardHeader><CardTitle>Business Health Score</CardTitle></CardHeader>
        <CardContent>
          <p>Revenue predictions, sales forecasts, and intelligent recommendations.</p>
        </CardContent>
      </Card>
    </div>
  );
}
