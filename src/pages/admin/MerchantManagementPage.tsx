import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Ban, LogIn, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useImpersonation } from '@/contexts/ImpersonationContext';
import { useNavigate } from 'react-router-dom';
import AddMerchantDialog from '@/components/admin/AddMerchantDialog';

export default function MerchantManagementPage() {
  const [merchants, setMerchants] = useState<any[]>([]);
  const { startImpersonation } = useImpersonation();
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch real merchants or use mock
    const fetchMerchants = async () => {
      const { data } = await supabase.from('customers').select('*').limit(10);
      setMerchants(data || []);
    };
    fetchMerchants();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Merchant Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">View and manage all registered merchants.</p>
        </div>
        <AddMerchantDialog>
          <Button>Add Merchant</Button>
        </AddMerchantDialog>
      </div>

      <Card className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl overflow-hidden border-none shadow-md">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50/50 dark:bg-gray-800/50">
              <TableRow>
                <TableHead>Business Name</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {merchants.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-500">No merchants found</TableCell>
                </TableRow>
              ) : merchants.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium">{m.business_name}</TableCell>
                  <TableCell>{m.owner_name}<br/><span className="text-xs text-gray-500">{m.owner_email}</span></TableCell>
                  <TableCell><Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">{m.subscription_plan || 'Basic'}</Badge></TableCell>
                  <TableCell>
                    <Badge className={m.is_active !== false ? 'bg-green-500' : 'bg-red-500'}>
                      {m.is_active !== false ? 'Active' : 'Suspended'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      title="Login As Merchant"
                      onClick={async () => {
                        await startImpersonation('merchant', m.id, m.business_name);
                        navigate('/dashboard');
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
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
