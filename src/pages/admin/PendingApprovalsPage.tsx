import React, { useState, useEffect } from 'react';
import { UserCheck, Store, UserSquare2, Check, X, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';

export default function PendingApprovalsPage() {
  const [pendingCustomers, setPendingCustomers] = useState<any[]>([]);
  const [pendingStores, setPendingStores] = useState<any[]>([]);
  const [pendingStaff, setPendingStaff] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useSupabaseAuth();

  const fetchPendingData = async () => {
    setIsLoading(true);
    try {
      // Fetch Pending Customers
      const { data: customers, error: err1 } = await supabase
        .from('customers')
        .select('*')
        .eq('approval_status', 'pending');
      if (err1) throw err1;
      setPendingCustomers(customers || []);

      // Fetch Pending Stores
      const { data: stores, error: err2 } = await supabase
        .from('stores')
        .select('*, customers(owner_name, business_name)')
        .eq('is_active', false);
      if (err2) throw err2;
      setPendingStores(stores || []);

      // Fetch Pending Staff
      const { data: staffRoles, error: err3 } = await supabase
        .from('user_roles')
        .select('*, stores(store_name)')
        .eq('is_active', false)
        .in('role', ['staff', 'store_manager']);
      if (err3) throw err3;

      let mergedStaff = staffRoles || [];
      if (mergedStaff.length > 0) {
        const staffIds = mergedStaff.map((s: any) => s.user_id).filter(Boolean);
        if (staffIds.length > 0) {
          const { data: staffProfiles, error: profErr } = await supabase
            .from('profiles')
            .select('id, full_name, email')
            .in('id', staffIds);
            
          if (!profErr && staffProfiles) {
            mergedStaff = mergedStaff.map((staff: any) => ({
              ...staff,
              profiles: staffProfiles.find(p => p.id === staff.user_id) || null
            }));
          }
        }
      }
      setPendingStaff(mergedStaff);

    } catch (error: any) {
      toast({ title: 'Error fetching pending approvals', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingData();
  }, []);

  const handleAction = async (table: string, id: string, action: 'approved' | 'rejected') => {
    try {
      let updateData: any = {};
      
      if (table === 'customers') {
        updateData = { 
          approval_status: action,
          approved_at: new Date().toISOString(),
          approved_by: user?.id
        };
      } else {
        // For stores and user_roles, we use is_active flag since approval_status might not exist in db
        if (action === 'approved') {
          updateData = { is_active: true };
        } else {
          // If rejected, we might just delete or leave inactive
          // For now, let's leave inactive or you could do a delete
          toast({ title: 'Action not fully supported', description: 'Rejection simply keeps them inactive.'});
          return;
        }
      }

      const { error } = await supabase
        .from(table)
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
      toast({ title: `Successfully ${action}`, description: `The account has been ${action}.` });
      fetchPendingData();
    } catch (error: any) {
      toast({ title: 'Action Failed', description: error.message, variant: 'destructive' });
    }
  };

  const ApprovalCard = ({ title, subtitle, date, onApprove, onReject }: any) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription className="flex items-center gap-1.5 mt-2">
          {subtitle}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
          <Clock className="w-4 h-4" />
          Created {format(new Date(date), 'MMM d, yyyy HH:mm')}
        </div>
        <div className="flex gap-2 pt-2">
          <Button onClick={onApprove} className="flex-1 bg-green-600 hover:bg-green-700 text-white">
            <Check className="w-4 h-4 mr-2" /> Approve
          </Button>
          <Button onClick={onReject} variant="outline" className="flex-1 text-red-600 border-red-200 hover:bg-red-50">
            <X className="w-4 h-4 mr-2" /> Reject
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6 animate-in fade-in zoom-in duration-300">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent flex items-center gap-2">
          <UserCheck className="w-6 h-6 text-primary" />
          Pending Approvals
        </h2>
        <p className="text-slate-500 mt-1">Review and approve accounts created by Platform Admins.</p>
      </div>

      <Tabs defaultValue="owners" className="space-y-6">
        <TabsList className="bg-white border shadow-sm w-full justify-start h-auto p-1 overflow-x-auto">
          <TabsTrigger value="owners" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary py-2.5 px-6">
            <UserCheck className="w-4 h-4 mr-2" />
            Owners ({pendingCustomers.length})
          </TabsTrigger>
          <TabsTrigger value="stores" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary py-2.5 px-6">
            <Store className="w-4 h-4 mr-2" />
            Stores ({pendingStores.length})
          </TabsTrigger>
          <TabsTrigger value="staff" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary py-2.5 px-6">
            <UserSquare2 className="w-4 h-4 mr-2" />
            Staff ({pendingStaff.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="owners">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? <div className="col-span-full py-12 text-center text-slate-500">Loading...</div> :
             pendingCustomers.length === 0 ? <div className="col-span-full py-12 text-center text-slate-500 bg-white rounded-xl shadow-sm border">No pending owners.</div> :
             pendingCustomers.map(customer => (
               <ApprovalCard
                 key={customer.id}
                 title={customer.business_name}
                 subtitle={`${customer.owner_name} (${customer.owner_email})`}
                 date={customer.created_at}
                 onApprove={() => handleAction('customers', customer.id, 'approved')}
                 onReject={() => handleAction('customers', customer.id, 'rejected')}
               />
             ))
            }
          </div>
        </TabsContent>

        <TabsContent value="stores">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? <div className="col-span-full py-12 text-center text-slate-500">Loading...</div> :
             pendingStores.length === 0 ? <div className="col-span-full py-12 text-center text-slate-500 bg-white rounded-xl shadow-sm border">No pending stores.</div> :
             pendingStores.map(store => (
               <ApprovalCard
                 key={store.id}
                 title={store.store_name}
                 subtitle={`Linked to: ${store.customers?.business_name || 'Unknown'}`}
                 date={store.created_at}
                 onApprove={() => handleAction('stores', store.id, 'approved')}
                 onReject={() => handleAction('stores', store.id, 'rejected')}
               />
             ))
            }
          </div>
        </TabsContent>

        <TabsContent value="staff">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? <div className="col-span-full py-12 text-center text-slate-500">Loading...</div> :
             pendingStaff.length === 0 ? <div className="col-span-full py-12 text-center text-slate-500 bg-white rounded-xl shadow-sm border">No pending staff.</div> :
             pendingStaff.map(staff => (
               <ApprovalCard
                 key={staff.id}
                 title={staff.profiles?.full_name || 'Unknown'}
                 subtitle={`Role: ${staff.role} | Store: ${staff.stores?.store_name || 'None'}`}
                 date={staff.created_at}
                 onApprove={() => handleAction('user_roles', staff.id, 'approved')}
                 onReject={() => handleAction('user_roles', staff.id, 'rejected')}
               />
             ))
            }
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
