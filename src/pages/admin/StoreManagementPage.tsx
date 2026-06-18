import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, LogIn, Edit, Ban, Trash2 } from 'lucide-react';
import { useImpersonation } from '@/contexts/ImpersonationContext';
import { useNavigate } from 'react-router-dom';
import AddStoreDialog from '@/components/admin/AddStoreDialog';

export default function StoreManagementPage() {
  const [stores, setStores] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const { startImpersonation } = useImpersonation();
  const navigate = useNavigate();

  useEffect(() => {
    // In a real app, we fetch from public.stores joined with public.customers
    const mockData = [
      { id: 'store-1', name: 'Maxora Bandra', merchant: 'Maxora Waffles', location: 'Mumbai', status: 'Active' },
      { id: 'store-2', name: 'Maxora Juhu', merchant: 'Maxora Waffles', location: 'Mumbai', status: 'Active' },
      { id: 'store-3', name: 'BK Andheri', merchant: 'Burger King', location: 'Mumbai', status: 'Active' },
      { id: 'store-4', name: 'Cafe Mocha Central', merchant: 'Cafe Mocha', location: 'Delhi', status: 'Suspended' },
      { id: 'store-5', name: 'Pizza Hut North', merchant: 'Pizza Hut', location: 'Bangalore', status: 'Active' },
    ];
    setStores(mockData);
  }, []);

  const filteredStores = stores.filter(store => 
    store.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    store.merchant.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Store Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">View and manage all outlets and their data access.</p>
        </div>
        <div className="flex space-x-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
            <Input 
              placeholder="Search stores or merchants..." 
              className="pl-8 w-[250px] bg-white dark:bg-gray-800"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <AddStoreDialog>
            <Button>Add Store</Button>
          </AddStoreDialog>
        </div>
      </div>

      <Card className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl border-none shadow-md">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50/50 dark:bg-gray-800/50">
                <TableRow>
                  <TableHead>Store Name</TableHead>
                  <TableHead>Merchant</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStores.map((store) => (
                  <TableRow key={store.id}>
                    <TableCell className="font-medium text-gray-900 dark:text-white">{store.name}</TableCell>
                    <TableCell className="text-gray-600 dark:text-gray-300">{store.merchant}</TableCell>
                    <TableCell className="text-gray-500">{store.location}</TableCell>
                    <TableCell>
                      <Badge className={store.status === 'Active' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}>
                        {store.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        title="Login As Store"
                        onClick={async () => {
                          await startImpersonation('store', store.id, store.name);
                          navigate('/pos'); // Store managers/Super Admins log into POS primarily
                        }}
                      >
                        <LogIn className="w-4 h-4 text-blue-600" />
                      </Button>
                      <Button variant="ghost" size="icon" title="Edit"><Edit className="w-4 h-4 text-gray-600" /></Button>
                      <Button variant="ghost" size="icon" title="Suspend"><Ban className="w-4 h-4 text-orange-600" /></Button>
                      <Button variant="ghost" size="icon" title="Delete"><Trash2 className="w-4 h-4 text-red-600" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredStores.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">No stores found.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
