import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { TrendingUp, Users, Store, DollarSign, ShoppingBag, CreditCard, Activity } from 'lucide-react';
import { DEMO_KPIS, generateRevenueData, generateGrowthData } from '@/lib/demoDataGenerator';

const KPICard = ({ title, value, icon: Icon, trend, trendValue, isCurrency = false }: any) => (
  <Card className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl border-gray-200/50 dark:border-gray-800/50 shadow-sm hover:shadow-md transition-all duration-300">
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
        {title}
      </CardTitle>
      <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <Icon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
      </div>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold text-gray-900 dark:text-white">
        {isCurrency ? '₹' : ''}{typeof value === 'number' ? value.toLocaleString('en-IN') : value}
      </div>
      <p className={`text-xs mt-1 flex items-center ${trend === 'up' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
        {trend === 'up' ? <TrendingUp className="w-3 h-3 mr-1" /> : <Activity className="w-3 h-3 mr-1" />}
        {trendValue} from last month
      </p>
    </CardContent>
  </Card>
);

export default function ExecutiveDashboardPage() {
  const revenueData = generateRevenueData(30); // Last 30 days
  const growthData = generateGrowthData(6); // Last 6 months

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Executive Overview</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Your SaaS platform performance at a glance.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard title="Total Revenue" value={DEMO_KPIS.totalRevenue} icon={DollarSign} trend="up" trendValue="+12.5%" isCurrency />
        <KPICard title="Monthly Revenue" value={DEMO_KPIS.monthlyRevenue} icon={TrendingUp} trend="up" trendValue="+8.2%" isCurrency />
        <KPICard title="Active Merchants" value={DEMO_KPIS.activeMerchants} icon={Users} trend="up" trendValue="+15" />
        <KPICard title="Active Stores" value={DEMO_KPIS.activeStores} icon={Store} trend="up" trendValue="+34" />
        <KPICard title="Total Orders" value={DEMO_KPIS.totalOrders} icon={ShoppingBag} trend="up" trendValue="+15.3%" />
        <KPICard title="Total Subscriptions" value={DEMO_KPIS.activeMerchants} icon={CreditCard} trend="up" trendValue="+2.1%" />
        <KPICard title="Total Customers" value={DEMO_KPIS.totalCustomers} icon={Users} trend="up" trendValue="+5.4%" />
        <KPICard title="New Signups (30d)" value={DEMO_KPIS.newSignups} icon={Activity} trend="up" trendValue="+5" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-1 bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl">
          <CardHeader>
            <CardTitle>Revenue Trend (30 Days)</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" className="dark:stroke-gray-800" />
                <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value/1000}k`} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Revenue']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="col-span-1 bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl">
          <CardHeader>
            <CardTitle>Platform Growth</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" className="dark:stroke-gray-800" />
                <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                <RechartsTooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '8px', border: 'none' }} />
                <Legend />
                <Bar dataKey="merchants" name="Merchants" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="stores" name="Stores" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
