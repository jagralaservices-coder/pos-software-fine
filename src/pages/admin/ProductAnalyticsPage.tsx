import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ProductAnalyticsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Product Analytics</h1>
      <Card>
        <CardHeader><CardTitle>Top Products</CardTitle></CardHeader>
        <CardContent>
          <p>Product performance and dead stock analysis.</p>
        </CardContent>
      </Card>
    </div>
  );
}
