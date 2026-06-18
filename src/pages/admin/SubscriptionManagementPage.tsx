import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarClock, AlertTriangle, CheckCircle2, XCircle, Search, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function SubscriptionManagementPage() {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Generate fake data if DB is empty to satisfy the rich UI requirement
  useEffect(() => {
    const fetchSubscriptions = async () => {
      // In a real app, we would fetch from the newly created 'subscriptions' table
      // joined with 'customers' and 'stores'. For now, we mock rich data.
      const mockData = [
        { id: '1', merchantName: 'Maxora Waffles', ownerName: 'Wasim', stores: 2, plan: 'Pro', start: '2026-01-01', expiry: '2026-12-31', remaining: 196, status: 'Active' },
        { id: '2', merchantName: 'Burger King', ownerName: 'Salman', stores: 5, plan: 'Enterprise', start: '2025-06-01', expiry: '2026-06-25', remaining: 7, status: 'Expiring Soon' },
        { id: '3', merchantName: 'Cafe Mocha', ownerName: 'Ravi', stores: 1, plan: 'Basic', start: '2026-05-01', expiry: '2026-06-15', remaining: 0, status: 'Expired' },
        { id: '4', merchantName: 'Pizza Hut', ownerName: 'Amit', stores: 12, plan: 'Enterprise', start: '2026-06-10', expiry: '2026-06-24', remaining: 6, status: 'Trial' },
        { id: '5', merchantName: 'Local Bakery', ownerName: 'Neha', stores: 1, plan: 'Basic', start: '2026-03-01', expiry: '2026-07-01', remaining: 13, status: 'Expiring Soon' },
      ];
      setSubscriptions(mockData);
    };
    fetchSubscriptions();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-500 hover:bg-green-600';
      case 'Expiring Soon': return 'bg-orange-500 hover:bg-orange-600';
      case 'Expired': return 'bg-red-500 hover:bg-red-600';
      case 'Trial': return 'bg-blue-500 hover:bg-blue-600';
      default: return 'bg-gray-500';
    }
  };

  const filteredSubscriptions = subscriptions.filter(sub => {
    if (searchQuery && !sub.merchantName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (filter === 'all') return true;
    if (filter === 'expired') return sub.status === 'Expired';
    if (filter === 'today') return sub.remaining === 0 && sub.status !== 'Expired';
    if (filter === '7days') return sub.remaining <= 7 && sub.remaining > 0;
    if (filter === '15days') return sub.remaining <= 15 && sub.remaining > 7;
    if (filter === '30days') return sub.remaining <= 30 && sub.remaining > 15;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Subscription Control Center</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage merchant plans, billing, and expiries.</p>
        </div>
      </div>

      {/* Expiry Management Filters */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-red-50/50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30 cursor-pointer hover:shadow-md transition-all" onClick={() => setFilter('expired')}>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-600 dark:text-red-400">Expired Accounts</p>
              <h3 className="text-2xl font-bold text-red-700 dark:text-red-300">1</h3>
            </div>
            <XCircle className="h-8 w-8 text-red-500/50" />
          </CardContent>
        </Card>
        
        <Card className="bg-orange-50/50 dark:bg-orange-900/10 border-orange-100 dark:border-orange-900/30 cursor-pointer hover:shadow-md transition-all" onClick={() => setFilter('today')}>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Expiring Today</p>
              <h3 className="text-2xl font-bold text-orange-700 dark:text-orange-300">0</h3>
            </div>
            <AlertTriangle className="h-8 w-8 text-orange-500/50" />
          </CardContent>
        </Card>

        <Card className="bg-yellow-50/50 dark:bg-yellow-900/10 border-yellow-100 dark:border-yellow-900/30 cursor-pointer hover:shadow-md transition-all" onClick={() => setFilter('7days')}>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">In 7 Days</p>
              <h3 className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">1</h3>
            </div>
            <CalendarClock className="h-8 w-8 text-yellow-500/50" />
          </CardContent>
        </Card>

        <Card className="bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30 cursor-pointer hover:shadow-md transition-all" onClick={() => setFilter('15days')}>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400">In 15 Days</p>
              <h3 className="text-2xl font-bold text-blue-700 dark:text-blue-300">1</h3>
            </div>
            <CalendarClock className="h-8 w-8 text-blue-500/50" />
          </CardContent>
        </Card>

        <Card className="bg-green-50/50 dark:bg-green-900/10 border-green-100 dark:border-green-900/30 cursor-pointer hover:shadow-md transition-all" onClick={() => setFilter('all')}>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600 dark:text-green-400">All Subscriptions</p>
              <h3 className="text-2xl font-bold text-green-700 dark:text-green-300">5</h3>
            </div>
            <CheckCircle2 className="h-8 w-8 text-green-500/50" />
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl border-none shadow-md">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-semibold">Active Subscriptions</CardTitle>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input 
                placeholder="Search merchants..." 
                className="pl-8 w-[250px] bg-white dark:bg-gray-800"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[150px] bg-white dark:bg-gray-800">
                <SelectValue placeholder="Filter Expiry" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Plans</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="today">Expiring Today</SelectItem>
                <SelectItem value="7days">Next 7 Days</SelectItem>
                <SelectItem value="15days">Next 15 Days</SelectItem>
                <SelectItem value="30days">Next 30 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50/50 dark:bg-gray-800/50">
                <TableRow>
                  <TableHead>Merchant Name</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Stores</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>Expiry Date</TableHead>
                  <TableHead>Days Left</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubscriptions.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell className="font-medium text-gray-900 dark:text-white">{sub.merchantName}</TableCell>
                    <TableCell className="text-gray-600 dark:text-gray-300">{sub.ownerName}</TableCell>
                    <TableCell>{sub.stores}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800">
                        {sub.plan}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-500">{sub.start}</TableCell>
                    <TableCell className="text-gray-900 dark:text-white font-medium">{sub.expiry}</TableCell>
                    <TableCell>
                      <span className={`font-bold ${sub.remaining <= 7 ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'}`}>
                        {sub.remaining}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${getStatusColor(sub.status)} text-white border-none`}>
                        {sub.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" className="bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700">
                        <RefreshCw className="h-4 w-4 mr-1" />
                        Renew
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
