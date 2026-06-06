import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, Store, Plus, Search, 
  LogOut, AlertCircle, CheckCircle, XCircle, Eye, EyeOff,
  Trash2, Ban, ShieldOff, Settings, Crown, UtensilsCrossed, ShoppingBag,
  Copy, RefreshCw, FileText, Check, ShieldAlert, Key, ClipboardList, MapPin, 
  Phone, EyeIcon, CreditCard, Sparkles, Building, UserCheck
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { AdminCustomerManagement } from '@/components/admin/AdminCustomerManagement';
import { AdminPlanManagement } from '@/components/admin/AdminPlanManagement';

interface Customer {
  id: string;
  business_name: string;
  owner_name: string;
  owner_email: string;
  phone: string | null;
  subscription_plan: string;
  subscription_start: string;
  subscription_end: string;
  is_active: boolean;
  created_at: string;
  max_stores: number;
  approval_status?: string;
  approved_at?: string;
  mobile_verified?: boolean;
  email_verified?: boolean;
  address_line1?: string;
  locality?: string;
  city?: string;
  state?: string;
  pincode?: string;
  last_login?: string;
  gov_id_url?: string;
}

const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, userRole, logout, isLoading } = useSupabaseAuth();
  const { toast } = useToast();
  
  // Tab control state
  const [activeTab, setActiveTab] = useState('owners');

  // Owners list and loading states
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    business_name: '',
    owner_name: '',
    owner_email: '',
    owner_password: '',
    phone: '',
    subscription_plan: 'monthly',
    subscription_days: 30,
    max_stores: 2,
    business_type: 'restaurant',
    subscription_tier: 'basic',
    address_line1: '',
    locality: '',
    city: '',
    state: '',
    pincode: '',
  });

  // Owner OTP simulation states
  const [ownerOtpSent, setOwnerOtpSent] = useState(false);
  const [ownerOtpVerified, setOwnerOtpVerified] = useState(false);
  const [ownerOtpCode, setOwnerOtpCode] = useState('');
  const [ownerEnteredOtp, setOwnerEnteredOtp] = useState('');
  const [isSendingOwnerOtp, setIsSendingOwnerOtp] = useState(false);

  // Stores states
  const [stores, setStores] = useState<any[]>([]);
  const [isLoadingStores, setIsLoadingStores] = useState(false);
  const [storeSearchQuery, setStoreSearchQuery] = useState('');
  const [showAddStore, setShowAddStore] = useState(false);
  const [isCreatingStore, setIsCreatingStore] = useState(false);
  const [newStore, setNewStore] = useState({
    customer_id: '',
    name: '',
    email: '',
    phone: '',
    password: '',
    addressLine1: '',
    locality: '',
    city: '',
    state: '',
    pincode: '',
    business_type: 'restaurant',
  });
  const [storeOtpSent, setStoreOtpSent] = useState(false);
  const [storeOtpVerified, setStoreOtpVerified] = useState(false);
  const [storeOtpCode, setStoreOtpCode] = useState('');
  const [storeEnteredOtp, setStoreEnteredOtp] = useState('');
  const [isSendingStoreOtp, setIsSendingStoreOtp] = useState(false);

  // Staff states
  const [staff, setStaff] = useState<any[]>([]);
  const [isLoadingStaff, setIsLoadingStaff] = useState(false);
  const [staffSearchQuery, setStaffSearchQuery] = useState('');
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [isCreatingStaff, setIsCreatingStaff] = useState(false);
  const [newStaff, setNewStaff] = useState({
    customer_id: '',
    store_id: '',
    name: '',
    email: '',
    phone: '',
    pin: '',
    role: 'staff',
    addressLine1: '',
    locality: '',
    city: '',
    state: '',
    pincode: '',
    aadhaarNumber: '',
    aadhaarName: '',
  });
  const [staffOtpSent, setStaffOtpSent] = useState(false);
  const [staffOtpVerified, setStaffOtpVerified] = useState(false);
  const [staffOtpCode, setStaffOtpCode] = useState('');
  const [staffEnteredOtp, setStaffEnteredOtp] = useState('');
  const [isSendingStaffOtp, setIsSendingStaffOtp] = useState(false);

  // Aadhaar scan files for staff creation
  const [aadhaarFrontFile, setAadhaarFrontFile] = useState<File | null>(null);
  const [aadhaarBackFile, setAadhaarBackFile] = useState<File | null>(null);
  const [aadhaarFrontPreview, setAadhaarFrontPreview] = useState<string | null>(null);
  const [aadhaarBackPreview, setAadhaarBackPreview] = useState<string | null>(null);

  // Audit Logs states
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [logSearchQuery, setLogSearchQuery] = useState('');

  // System Explorer states
  const [explorerOwnerId, setExplorerOwnerId] = useState('');
  const [explorerStoreId, setExplorerStoreId] = useState('');
  const [explorerTab, setExplorerTab] = useState('orders');
  const [explorerData, setExplorerData] = useState<{
    orders: any[];
    menuItems: any[];
    inventory: any[];
    expenses: any[];
    credits: any[];
    whatsapp: any | null;
  }>({
    orders: [],
    menuItems: [],
    inventory: [],
    expenses: [],
    credits: [],
    whatsapp: null
  });
  const [isFetchingExplorer, setIsFetchingExplorer] = useState(false);

  // Delete owner states
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteCustomerData, setDeleteCustomerData] = useState<Customer | null>(null);
  const [connectedCounts, setConnectedCounts] = useState<{
    stores: number;
    staff: number;
    products: number;
    orders: number;
    customers: number;
    expenses: number;
    credits: number;
    total: number;
  } | null>(null);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [verifyingPassword, setVerifyingPassword] = useState(false);

  // View image preview dialog state
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Protect Admin route
  useEffect(() => {
    if (!isLoading && (!user || userRole?.role !== 'admin')) {
      navigate('/auth');
    }
  }, [user, userRole, isLoading, navigate]);

  // Initial loads
  useEffect(() => {
    if (user && userRole?.role === 'admin') {
      fetchCustomers();
      fetchAllStores();
      fetchAllStaff();
      fetchAuditLogs();
    }
  }, [user, userRole]);

  // Fetch Owner / customers list
  const fetchCustomers = async () => {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching customers:', error);
      toast({
        title: 'Error',
        description: 'Failed to load owners list',
        variant: 'destructive',
      });
      return;
    }

    setCustomers(data as Customer[]);
  };

  // Fetch all stores (and join customer name in memory)
  const fetchAllStores = async () => {
    setIsLoadingStores(true);
    try {
      const { data: storesData, error: storesError } = await supabase
        .from('stores')
        .select('*')
        .order('created_at', { ascending: false });

      if (storesError) throw storesError;

      const { data: customersData } = await supabase
        .from('customers')
        .select('id, owner_name, owner_email');

      const customersMap = new Map(customersData?.map(c => [c.id, c]));

      const mappedStores = (storesData || []).map(store => {
        const customer = store.customer_id ? customersMap.get(store.customer_id) : null;
        return {
          ...store,
          owner_name: customer?.owner_name || 'N/A',
          owner_email: customer?.owner_email || 'N/A'
        };
      });

      setStores(mappedStores);
    } catch (err: any) {
      console.error('Error fetching stores:', err);
    } finally {
      setIsLoadingStores(false);
    }
  };

  // Fetch all staff system-wide (using memory joining for profiles, customers, stores)
  const fetchAllStaff = async () => {
    setIsLoadingStaff(true);
    try {
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('*')
        .in('role', ['staff', 'store_manager'])
        .order('created_at', { ascending: false });

      if (rolesError) throw rolesError;

      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*');

      if (profilesError) throw profilesError;

      const { data: customersData } = await supabase
        .from('customers')
        .select('id, owner_name, business_name');

      const { data: storesData } = await supabase
        .from('stores')
        .select('id, store_name');

      const profilesMap = new Map(profilesData?.map(p => [p.id, p]));
      const customersMap = new Map(customersData?.map(c => [c.id, c]));
      const storesMap = new Map(storesData?.map(s => [s.id, s]));

      const mappedStaff = (rolesData || []).map(role => {
        const profile = profilesMap.get(role.user_id);
        const customer = role.customer_id ? customersMap.get(role.customer_id) : null;
        const store = role.store_id ? storesMap.get(role.store_id) : null;
        return {
          ...role,
          email: profile?.email || '',
          full_name: profile?.full_name || '',
          phone: profile?.phone || '',
          locality: profile?.locality || '',
          city: profile?.city || '',
          state: profile?.state || '',
          pincode: profile?.pincode || '',
          address_line1: profile?.address_line1 || '',
          last_login: profile?.last_login || null,
          mobile_verified: profile?.mobile_verified || false,
          email_verified: profile?.email_verified || false,
          owner_name: customer?.owner_name || 'N/A',
          business_name: customer?.business_name || 'N/A',
          store_name: store?.store_name || 'N/A'
        };
      });

      setStaff(mappedStaff);
    } catch (err: any) {
      console.error('Error fetching staff:', err);
    } finally {
      setIsLoadingStaff(false);
    }
  };

  // Fetch security audit logs
  const fetchAuditLogs = async () => {
    setIsLoadingLogs(true);
    try {
      const { data: logsData, error: logsError } = await supabase
        .from('security_audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(150);

      if (logsError) throw logsError;

      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, email, full_name');

      const profilesMap = new Map(profilesData?.map(p => [p.id, p]));

      const mappedLogs = (logsData || []).map(log => {
        const profile = log.user_id ? profilesMap.get(log.user_id) : null;
        return {
          ...log,
          user_email: profile?.email || log.user_id || 'System/Trigger',
          user_name: profile?.full_name || 'System'
        };
      });

      setAuditLogs(mappedLogs);
    } catch (err: any) {
      console.error('Error fetching audit logs:', err);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  // Fetch Explorer detailed data for a specific store
  const fetchExplorerData = async (storeId: string) => {
    if (!storeId) return;
    setIsFetchingExplorer(true);
    try {
      // Fetch Orders
      const { data: ordersData } = await supabase
        .from('orders')
        .select('*')
        .eq('store_id', storeId)
        .order('created_at', { ascending: false });

      // Fetch Menu Items
      const { data: menuData } = await supabase
        .from('menu_items')
        .select('*')
        .eq('store_id', storeId)
        .order('name');

      // Fetch Inventory
      const { data: invData } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('store_id', storeId)
        .order('name');

      // Fetch Expenses
      const { data: expData } = await supabase
        .from('expenses')
        .select('*')
        .eq('store_id', storeId)
        .order('date', { ascending: false });

      // Fetch Credit Ledger
      const { data: credData } = await supabase
        .from('credit_ledger')
        .select('*')
        .eq('store_id', storeId)
        .order('customer_name');

      // Fetch Whatsapp Config
      const { data: waConfig } = await supabase
        .from('store_whatsapp_config')
        .select('*')
        .eq('store_id', storeId)
        .maybeSingle();

      setExplorerData({
        orders: ordersData || [],
        menuItems: menuData || [],
        inventory: invData || [],
        expenses: expData || [],
        credits: credData || [],
        whatsapp: waConfig || null
      });
    } catch (err: any) {
      console.error('Error fetching explorer data:', err);
      toast({
        title: 'Error',
        description: 'Failed to explore store details',
        variant: 'destructive',
      });
    } finally {
      setIsFetchingExplorer(false);
    }
  };

  // OTP simulation handlers for Owners
  const handleSendOwnerOtp = () => {
    if (!newCustomer.phone || newCustomer.phone.trim().length < 10) {
      toast({
        title: 'Error',
        description: 'Please enter a valid 10-digit mobile number first',
        variant: 'destructive'
      });
      return;
    }
    setIsSendingOwnerOtp(true);
    setTimeout(() => {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setOwnerOtpCode(code);
      setOwnerOtpSent(true);
      setIsSendingOwnerOtp(false);
      toast({
        title: 'OTP Sent',
        description: `Verification OTP Sent! Code is ${code} (Mocked)`,
      });
      console.log(`[Verification System] Generated OTP for owner phone ${newCustomer.phone}: ${code}`);
    }, 800);
  };

  const handleVerifyOwnerOtp = () => {
    if (ownerEnteredOtp === ownerOtpCode) {
      setOwnerOtpVerified(true);
      toast({
        title: 'Success',
        description: 'Mobile number verified successfully!',
      });
    } else {
      toast({
        title: 'Error',
        description: 'Invalid OTP. Please try again.',
        variant: 'destructive'
      });
    }
  };

  // OTP simulation handlers for Stores
  const handleSendStoreOtp = () => {
    if (!newStore.phone || newStore.phone.trim().length < 10) {
      toast({
        title: 'Error',
        description: 'Please enter a valid 10-digit mobile number first',
        variant: 'destructive'
      });
      return;
    }
    setIsSendingStoreOtp(true);
    setTimeout(() => {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setStoreOtpCode(code);
      setStoreOtpSent(true);
      setIsSendingStoreOtp(false);
      toast({
        title: 'OTP Sent',
        description: `Verification OTP Sent! Code is ${code} (Mocked)`,
      });
      console.log(`[Verification System] Generated OTP for store phone ${newStore.phone}: ${code}`);
    }, 800);
  };

  const handleVerifyStoreOtp = () => {
    if (storeEnteredOtp === storeOtpCode) {
      setStoreOtpVerified(true);
      toast({
        title: 'Success',
        description: 'Mobile number verified successfully!',
      });
    } else {
      toast({
        title: 'Error',
        description: 'Invalid OTP. Please try again.',
        variant: 'destructive'
      });
    }
  };

  // OTP simulation handlers for Staff
  const handleSendStaffOtp = () => {
    if (!newStaff.phone || newStaff.phone.trim().length < 10) {
      toast({
        title: 'Error',
        description: 'Please enter a valid 10-digit mobile number first',
        variant: 'destructive'
      });
      return;
    }
    setIsSendingStaffOtp(true);
    setTimeout(() => {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setStaffOtpCode(code);
      setStaffOtpSent(true);
      setIsSendingStaffOtp(false);
      toast({
        title: 'OTP Sent',
        description: `Verification OTP Sent! Code is ${code} (Mocked)`,
      });
      console.log(`[Verification System] Generated OTP for staff phone ${newStaff.phone}: ${code}`);
    }, 800);
  };

  const handleVerifyStaffOtp = () => {
    if (staffEnteredOtp === staffOtpCode) {
      setStaffOtpVerified(true);
      toast({
        title: 'Success',
        description: 'Mobile number verified successfully!',
      });
    } else {
      toast({
        title: 'Error',
        description: 'Invalid OTP. Please try again.',
        variant: 'destructive'
      });
    }
  };

  // Upload Aadhaar scan to storage
  const uploadAadhaarScan = async (file: File, side: 'front' | 'back', name: string) => {
    try {
      const extension = file.name.split('.').pop() || 'jpg';
      const fileName = `${name.replace(/\s+/g, '_')}_aadhaar_${side}_${Date.now()}.${extension}`;
      
      const { data, error } = await supabase.storage
        .from('aadhaar-documents')
        .upload(fileName, file, {
          contentType: file.type,
          upsert: true
        });

      if (error) {
        console.error(`Aadhaar ${side} upload error:`, error);
        return null;
      }

      const { data: urlData } = supabase.storage
        .from('aadhaar-documents')
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    } catch (err) {
      console.error('Error in uploadAadhaarScan:', err);
      return null;
    }
  };

  const handleAadhaarUpload = (e: React.ChangeEvent<HTMLInputElement>, side: 'front' | 'back') => {
    const file = e.target.files?.[0];
    if (file) {
      if (side === 'front') {
        setAadhaarFrontFile(file);
        setAadhaarFrontPreview(URL.createObjectURL(file));
      } else {
        setAadhaarBackFile(file);
        setAadhaarBackPreview(URL.createObjectURL(file));
      }
    }
  };

  // Add Owner handler
  const handleAddCustomer = async () => {
    if (!newCustomer.business_name || !newCustomer.owner_name || !newCustomer.owner_email || !newCustomer.owner_password || !newCustomer.phone) {
      toast({
        title: 'Missing Fields',
        description: 'Please fill in all required fields including mobile number and password.',
        variant: 'destructive',
      });
      return;
    }

    if (!newCustomer.address_line1 || !newCustomer.locality || !newCustomer.city || !newCustomer.state || !newCustomer.pincode) {
      toast({
        title: 'Missing Address',
        description: 'Please enter a complete address (Line 1, Locality, City, State, and Pincode).',
        variant: 'destructive',
      });
      return;
    }

    if (!ownerOtpVerified) {
      toast({
        title: 'Mobile OTP Verification Required',
        description: 'Please verify the owner\'s mobile number via simulated OTP first.',
        variant: 'destructive',
      });
      return;
    }

    if (newCustomer.owner_password.length < 6) {
      toast({
        title: 'Invalid Password',
        description: 'Password must be at least 6 characters.',
        variant: 'destructive',
      });
      return;
    }

    setIsCreating(true);

    try {
      const response = await supabase.functions.invoke('create-owner', {
        body: {
          business_name: newCustomer.business_name,
          owner_name: newCustomer.owner_name,
          owner_email: newCustomer.owner_email.trim().toLowerCase(),
          owner_password: newCustomer.owner_password,
          phone: newCustomer.phone.trim(),
          subscription_plan: newCustomer.subscription_plan,
          subscription_days: newCustomer.subscription_days,
          max_stores: newCustomer.max_stores,
          business_type: newCustomer.business_type,
          subscription_tier: newCustomer.subscription_tier,
          address_line1: newCustomer.address_line1,
          locality: newCustomer.locality,
          city: newCustomer.city,
          state: newCustomer.state,
          pincode: newCustomer.pincode,
          mobile_verified: true
        }
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to create owner');
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      toast({
        title: 'Owner Account Created!',
        description: `${newCustomer.owner_name} created successfully as pending verification. A verification email has been sent.`,
      });

      setShowAddCustomer(false);
      setNewCustomer({
        business_name: '',
        owner_name: '',
        owner_email: '',
        owner_password: '',
        phone: '',
        subscription_plan: 'monthly',
        subscription_days: 30,
        max_stores: 2,
        business_type: 'restaurant',
        subscription_tier: 'basic',
        address_line1: '',
        locality: '',
        city: '',
        state: '',
        pincode: '',
      });
      setOwnerOtpSent(false);
      setOwnerOtpVerified(false);
      setOwnerOtpCode('');
      setOwnerEnteredOtp('');
      fetchCustomers();
      fetchAuditLogs();
    } catch (error: any) {
      console.error('Error creating owner:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create owner account',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  // Add Store handler (Admin only)
  const handleAddStore = async () => {
    if (!newStore.customer_id || !newStore.name || !newStore.email || !newStore.password || !newStore.phone) {
      toast({
        title: 'Missing Fields',
        description: 'Owner, Store Name, Email, Password, and Phone are required.',
        variant: 'destructive',
      });
      return;
    }

    if (!newStore.addressLine1 || !newStore.locality || !newStore.city || !newStore.state || !newStore.pincode) {
      toast({
        title: 'Missing Address',
        description: 'Please enter a complete address (Line 1, Locality, City, State, and Pincode).',
        variant: 'destructive',
      });
      return;
    }

    if (!storeOtpVerified) {
      toast({
        title: 'Mobile OTP Verification Required',
        description: 'Please verify the store\'s mobile number via simulated OTP first.',
        variant: 'destructive',
      });
      return;
    }

    setIsCreatingStore(true);

    try {
      const response = await supabase.functions.invoke('create-store', {
        body: {
          customer_id: newStore.customer_id,
          store_name: newStore.name,
          email: newStore.email.trim().toLowerCase(),
          password: newStore.password,
          phone: newStore.phone.trim(),
          address_line1: newStore.addressLine1,
          locality: newStore.locality,
          city: newStore.city,
          state: newStore.state,
          pincode: newStore.pincode,
          business_type: newStore.business_type,
        }
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to create store');
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      toast({
        title: 'Store Created Successfully!',
        description: `Store "${newStore.name}" is now ready.`,
      });

      setShowAddStore(false);
      setNewStore({
        customer_id: '',
        name: '',
        email: '',
        phone: '',
        password: '',
        addressLine1: '',
        locality: '',
        city: '',
        state: '',
        pincode: '',
        business_type: 'restaurant',
      });
      setStoreOtpSent(false);
      setStoreOtpVerified(false);
      setStoreOtpCode('');
      setStoreEnteredOtp('');
      fetchAllStores();
      fetchAuditLogs();
    } catch (error: any) {
      console.error('Error creating store:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create store',
        variant: 'destructive',
      });
    } finally {
      setIsCreatingStore(false);
    }
  };

  // Add Staff handler (Admin / Owner level helper)
  const handleAddStaff = async () => {
    if (!newStaff.customer_id || !newStaff.store_id || !newStaff.name || !newStaff.email || !newStaff.phone || !newStaff.pin) {
      toast({
        title: 'Missing Fields',
        description: 'Please fill in all required fields including mobile, email, name and pin code.',
        variant: 'destructive',
      });
      return;
    }

    if (!newStaff.addressLine1 || !newStaff.locality || !newStaff.city || !newStaff.state || !newStaff.pincode) {
      toast({
        title: 'Missing Address',
        description: 'Complete Address is required.',
        variant: 'destructive',
      });
      return;
    }

    if (!newStaff.aadhaarNumber || newStaff.aadhaarNumber.length !== 12 || isNaN(Number(newStaff.aadhaarNumber))) {
      toast({
        title: 'Invalid Aadhaar Number',
        description: 'Please enter a valid 12-digit numeric Aadhaar number.',
        variant: 'destructive',
      });
      return;
    }

    if (!newStaff.aadhaarName) {
      toast({
        title: 'Aadhaar Name Required',
        description: 'Please enter the name exactly as it appears on the Aadhaar card.',
        variant: 'destructive',
      });
      return;
    }

    if (!aadhaarFrontFile || !aadhaarBackFile) {
      toast({
        title: 'Aadhaar Document Scans Required',
        description: 'Please upload both front and back scans of the Aadhaar card.',
        variant: 'destructive',
      });
      return;
    }

    if (!staffOtpVerified) {
      toast({
        title: 'Mobile OTP Verification Required',
        description: 'Please verify the staff\'s mobile number via simulated OTP first.',
        variant: 'destructive',
      });
      return;
    }

    setIsCreatingStaff(true);

    try {
      // Upload Aadhaar Front Scan
      const frontUrl = await uploadAadhaarScan(aadhaarFrontFile, 'front', newStaff.name);
      if (!frontUrl) throw new Error('Failed to upload Aadhaar front scan');

      // Upload Aadhaar Back Scan
      const backUrl = await uploadAadhaarScan(aadhaarBackFile, 'back', newStaff.name);
      if (!backUrl) throw new Error('Failed to upload Aadhaar back scan');

      const response = await supabase.functions.invoke('create-staff', {
        body: {
          name: newStaff.name,
          email: newStaff.email.trim().toLowerCase(),
          phone: newStaff.phone.trim(),
          role: newStaff.role,
          store_id: newStaff.store_id,
          customer_id: newStaff.customer_id,
          pin: newStaff.pin,
          password: newStaff.pin, // password is set to PIN
          address_line1: newStaff.addressLine1,
          locality: newStaff.locality,
          city: newStaff.city,
          state: newStaff.state,
          pincode: newStaff.pincode,
          aadhaar_number: newStaff.aadhaarNumber.trim(),
          aadhaar_name: newStaff.aadhaarName.trim(),
          aadhaar_front_url: frontUrl,
          aadhaar_back_url: backUrl
        }
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to create staff');
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      toast({
        title: 'Staff Created Successfully!',
        description: `${newStaff.name} created and initialized as inactive pending verification.`,
      });

      setShowAddStaff(false);
      setNewStaff({
        customer_id: '',
        store_id: '',
        name: '',
        email: '',
        phone: '',
        pin: '',
        role: 'staff',
        addressLine1: '',
        locality: '',
        city: '',
        state: '',
        pincode: '',
        aadhaarNumber: '',
        aadhaarName: '',
      });
      setAadhaarFrontFile(null);
      setAadhaarBackFile(null);
      setAadhaarFrontPreview(null);
      setAadhaarBackPreview(null);
      setStaffOtpSent(false);
      setStaffOtpVerified(false);
      setStaffOtpCode('');
      setStaffEnteredOtp('');
      fetchAllStaff();
      fetchAuditLogs();
    } catch (error: any) {
      console.error('Error creating staff:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create staff account',
        variant: 'destructive',
      });
    } finally {
      setIsCreatingStaff(false);
    }
  };

  // Toggle customer (Owner) status
  const toggleCustomerStatus = async (customerId: string, currentStatus: boolean) => {
    if (customers.find(c => c.id === customerId)?.owner_email === 'jagralasalman786@gmail.com') {
      toast({
        title: 'Protected Account',
        description: 'The primary admin account status cannot be modified.',
        variant: 'destructive',
      });
      return;
    }

    const { error } = await supabase
      .from('customers')
      .update({ is_active: !currentStatus })
      .eq('id', customerId);

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: currentStatus ? 'Account Disabled' : 'Account Enabled',
      description: currentStatus ? 'Owner access has been disabled.' : 'Owner access has been enabled.',
    });
    fetchCustomers();
    fetchAuditLogs();
  };

  // Initiate Delete Owner (calculates records then shows modal)
  const initiateDeleteOwner = async (customer: Customer) => {
    if (customer.owner_email === 'jagralasalman786@gmail.com') {
      toast({
        title: 'Error',
        description: 'The primary admin account cannot be deleted.',
        variant: 'destructive',
      });
      return;
    }
    
    setDeleteCustomerData(customer);
    setConfirmPassword('');
    setShowDeleteConfirm(true);
    setConnectedCounts(null);
    
    try {
      const { data, error } = await supabase.rpc('get_owner_connected_records_count', {
        p_customer_id: customer.id
      });
      
      if (error) throw error;
      setConnectedCounts(data as any);
    } catch (err: any) {
      console.error('Error fetching connected counts:', err);
      toast({
        title: 'Error',
        description: 'Failed to fetch connected records count.',
        variant: 'destructive',
      });
    }
  };

  // Confirm delete owner
  const handleConfirmDelete = async () => {
    if (!deleteCustomerData) return;
    if (!confirmPassword) {
      toast({
        title: 'Required',
        description: 'Please enter your admin password to confirm.',
        variant: 'destructive',
      });
      return;
    }

    setVerifyingPassword(true);
    try {
      // Re-authenticate admin using email + entered password
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: user?.email!,
        password: confirmPassword,
      });

      if (authError || !authData.user) {
        toast({
          title: 'Authentication Failed',
          description: 'Incorrect admin password.',
          variant: 'destructive',
        });
        setVerifyingPassword(false);
        return;
      }

      setVerifyingPassword(false);
      setIsDeleting(true);
      
      const response = await supabase.functions.invoke('delete-owner', {
        body: { customer_id: deleteCustomerData.id }
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to delete owner');
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      toast({
        title: 'Owner Deleted',
        description: 'Owner account and all related data have been deleted successfully.',
      });
      setShowDeleteConfirm(false);
      setDeleteCustomerData(null);
      fetchCustomers();
      fetchAllStores();
      fetchAllStaff();
      fetchAuditLogs();
    } catch (error: any) {
      console.error('Error deleting owner:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete owner',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setVerifyingPassword(false);
    }
  };

  // Suspend owner
  const suspendOwner = async (customerId: string) => {
    if (customers.find(c => c.id === customerId)?.owner_email === 'jagralasalman786@gmail.com') {
      toast({
        title: 'Protected Account',
        description: 'The primary admin account cannot be suspended.',
        variant: 'destructive',
      });
      return;
    }

    const { error } = await supabase
      .from('customers')
      .update({ 
        is_active: false,
        approval_status: 'suspended'
      })
      .eq('id', customerId);

    // Also deactivate user_roles
    await supabase
      .from('user_roles')
      .update({ is_active: false })
      .eq('customer_id', customerId);

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Account Suspended',
      description: 'Owner account has been suspended. They cannot login anymore.',
      variant: 'destructive',
    });
    fetchCustomers();
    fetchAllStaff();
    fetchAuditLogs();
  };

  // Unsuspend owner
  const unsuspendOwner = async (customerId: string) => {
    const { error } = await supabase
      .from('customers')
      .update({ 
        is_active: true,
        approval_status: 'approved'
      })
      .eq('id', customerId);

    // Also reactivate user_roles
    await supabase
      .from('user_roles')
      .update({ is_active: true })
      .eq('customer_id', customerId);

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Account Restored',
      description: 'Owner account has been restored. They can login again.',
    });
    fetchCustomers();
    fetchAllStaff();
    fetchAuditLogs();
  };

  // Extend owner subscription
  const extendSubscription = async (customerId: string, days: number) => {
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return;

    const currentEnd = new Date(customer.subscription_end);
    currentEnd.setDate(currentEnd.getDate() + days);

    const { error } = await supabase
      .from('customers')
      .update({ subscription_end: currentEnd.toISOString().split('T')[0] })
      .eq('id', customerId);

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Subscription Extended',
      description: `Extended by ${days} days.`,
    });
    fetchCustomers();
    fetchAuditLogs();
  };

  // Update customer store limit
  const updateMaxStores = async (customerId: string, maxStores: number) => {
    const { error } = await supabase
      .from('customers')
      .update({ max_stores: maxStores })
      .eq('id', customerId);

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Store Limit Updated',
      description: `Max stores set to ${maxStores}.`,
    });
    fetchCustomers();
    fetchAuditLogs();
  };

  // Approve Owner Signup
  const approveCustomer = async (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return;

    try {
      const response = await supabase.functions.invoke('approve-owner', {
        body: { 
          customer_id: customerId,
          owner_email: customer.owner_email
        }
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to approve owner');
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      toast({
        title: 'Owner Approved!',
        description: 'The owner can now login and access their dashboard.',
      });
      fetchCustomers();
      fetchAuditLogs();
    } catch (error: any) {
      console.error('Error approving owner:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to approve owner',
        variant: 'destructive',
      });
    }
  };

  // Reject Owner Signup
  const rejectCustomer = async (customerId: string) => {
    const { error } = await supabase
      .from('customers')
      .update({ 
        approval_status: 'rejected',
        is_active: false,
      })
      .eq('id', customerId);

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Request Rejected',
      description: 'The owner request has been rejected.',
    });
    fetchCustomers();
    fetchAuditLogs();
  };

  // Approve Staff Aadhaar
  const approveStaffAadhaar = async (roleId: string) => {
    const { error } = await supabase
      .from('user_roles')
      .update({ 
        aadhaar_verification_status: 'verified',
        is_active: true
      })
      .eq('id', roleId);

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Staff Aadhaar Approved!',
      description: 'The staff account has been approved and activated.',
    });
    fetchAllStaff();
    fetchAuditLogs();
  };

  // Reject Staff Aadhaar
  const rejectStaffAadhaar = async (roleId: string) => {
    const { error } = await supabase
      .from('user_roles')
      .update({ 
        aadhaar_verification_status: 'rejected',
        is_active: false
      })
      .eq('id', roleId);

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Staff Aadhaar Rejected',
      description: 'The staff account has been rejected.',
      variant: 'destructive',
    });
    fetchAllStaff();
    fetchAuditLogs();
  };

  // Helper copy function
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied!',
      description: `${label} copied to clipboard.`,
    });
  };

  // Search filter functions
  const filteredCustomers = customers.filter(c => 
    (c.approval_status === 'approved' || c.approval_status === 'suspended' || !c.approval_status) && (
      c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.business_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.owner_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.owner_email.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const filteredStores = stores.filter(s => 
    s.id.toLowerCase().includes(storeSearchQuery.toLowerCase()) ||
    s.store_name.toLowerCase().includes(storeSearchQuery.toLowerCase()) ||
    s.owner_name.toLowerCase().includes(storeSearchQuery.toLowerCase()) ||
    (s.phone && s.phone.includes(storeSearchQuery))
  );

  const filteredStaffList = staff.filter(s => 
    s.id.toLowerCase().includes(staffSearchQuery.toLowerCase()) ||
    s.full_name.toLowerCase().includes(staffSearchQuery.toLowerCase()) ||
    s.email.toLowerCase().includes(staffSearchQuery.toLowerCase()) ||
    s.phone.includes(staffSearchQuery) ||
    s.aadhaar_number?.includes(staffSearchQuery)
  );

  const filteredLogs = auditLogs.filter(log => 
    log.action.toLowerCase().includes(logSearchQuery.toLowerCase()) ||
    log.table_name?.toLowerCase().includes(logSearchQuery.toLowerCase()) ||
    log.record_id?.toLowerCase().includes(logSearchQuery.toLowerCase()) ||
    log.user_email?.toLowerCase().includes(logSearchQuery.toLowerCase()) ||
    log.user_name?.toLowerCase().includes(logSearchQuery.toLowerCase())
  );

  // Stats calculation
  const pendingOwners = customers.filter(c => c.approval_status === 'pending');
  const pendingStaff = staff.filter(s => s.aadhaar_verification_status === 'pending');
  const totalPendingVerifications = pendingOwners.length + pendingStaff.length;

  const activeCustomers = customers.filter(c => c.is_active && c.approval_status !== 'pending').length;
  const expiringCustomers = customers.filter(c => {
    if (c.approval_status === 'pending') return false;
    const daysLeft = differenceInDays(new Date(c.subscription_end), new Date());
    return daysLeft <= 7 && daysLeft > 0;
  }).length;
  const expiredCustomers = customers.filter(c => 
    c.approval_status !== 'pending' && new Date(c.subscription_end) < new Date()
  ).length;

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  // Watch Store selector changes in Explorer tab to load its details
  useEffect(() => {
    if (explorerStoreId) {
      fetchExplorerData(explorerStoreId);
    }
  }, [explorerStoreId]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="animate-spin w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 antialiased font-sans pb-12">
      {/* Premium Header */}
      <header className="bg-gradient-to-r from-violet-800 via-indigo-900 to-slate-900 border-b border-indigo-950 p-6 shadow-2xl">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Crown className="w-8 h-8 text-amber-400 animate-pulse" />
              <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-violet-200 to-indigo-300 bg-clip-text text-transparent">
                Antigravity Master Control
              </h1>
            </div>
            <p className="text-violet-200/80 mt-1 text-sm font-medium">
              System Administration • Central Control & Security Audit Panel
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="border-indigo-500/50 bg-indigo-505/20 text-indigo-300 px-3 py-1 text-xs font-semibold gap-1.5 uppercase tracking-wider">
              <UserCheck className="w-3.5 h-3.5" />
              Admin Mode
            </Badge>
            <Button 
              variant="destructive" 
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-lg border border-rose-500/30 rounded-xl transition-all"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout Session
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 md:p-6 space-y-8 mt-4">
        {/* Dynamic Global Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="flex flex-wrap h-auto bg-slate-900 border border-slate-800 p-1 rounded-2xl max-w-full justify-start gap-1 overflow-x-auto">
            <TabsTrigger value="owners" className="rounded-xl px-4 py-2.5 text-sm font-medium transition-all gap-2 text-slate-400 data-[state=active]:bg-violet-600 data-[state=active]:text-white">
              <Users className="w-4 h-4" />
              Owners
            </TabsTrigger>
            <TabsTrigger value="stores" className="rounded-xl px-4 py-2.5 text-sm font-medium transition-all gap-2 text-slate-400 data-[state=active]:bg-violet-600 data-[state=active]:text-white">
              <Store className="w-4 h-4" />
              Stores
            </TabsTrigger>
            <TabsTrigger value="staff" className="rounded-xl px-4 py-2.5 text-sm font-medium transition-all gap-2 text-slate-400 data-[state=active]:bg-violet-600 data-[state=active]:text-white">
              <Crown className="w-4 h-4" />
              Staff
            </TabsTrigger>
            <TabsTrigger value="verification" className="rounded-xl px-4 py-2.5 text-sm font-medium transition-all gap-2 text-slate-400 data-[state=active]:bg-violet-600 data-[state=active]:text-white relative">
              <UserCheck className="w-4 h-4" />
              Verification Queue
              {totalPendingVerifications > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-500 text-slate-950 font-black rounded-full text-[10px] w-5 h-5 flex items-center justify-center animate-bounce border border-slate-950">
                  {totalPendingVerifications}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="explorer" className="rounded-xl px-4 py-2.5 text-sm font-medium transition-all gap-2 text-slate-400 data-[state=active]:bg-violet-600 data-[state=active]:text-white">
              <Building className="w-4 h-4" />
              System Explorer
            </TabsTrigger>
            <TabsTrigger value="audit_logs" className="rounded-xl px-4 py-2.5 text-sm font-medium transition-all gap-2 text-slate-400 data-[state=active]:bg-violet-600 data-[state=active]:text-white">
              <ClipboardList className="w-4 h-4" />
              Audit Logs
            </TabsTrigger>
            <TabsTrigger value="plans" className="rounded-xl px-4 py-2.5 text-sm font-medium transition-all gap-2 text-slate-400 data-[state=active]:bg-violet-600 data-[state=active]:text-white">
              <Crown className="w-4 h-4" />
              Plans & Features
            </TabsTrigger>
            <TabsTrigger value="settings" className="rounded-xl px-4 py-2.5 text-sm font-medium transition-all gap-2 text-slate-400 data-[state=active]:bg-violet-600 data-[state=active]:text-white">
              <Settings className="w-4 h-4" />
              Customer Settings
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: OWNERS */}
          <TabsContent value="owners" className="mt-6 space-y-6">
            {/* Stats Dashboard */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-slate-900 border-slate-800 hover:border-violet-500/40 transition-all shadow-md transform hover:-translate-y-0.5">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="p-3 bg-violet-500/10 rounded-xl text-violet-400">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Total Owners</p>
                    <p className="text-3xl font-extrabold text-white mt-1">{customers.length}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-900 border-slate-800 hover:border-emerald-500/40 transition-all shadow-md transform hover:-translate-y-0.5">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Active Owners</p>
                    <p className="text-3xl font-extrabold text-emerald-400 mt-1">{activeCustomers}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-900 border-slate-800 hover:border-amber-500/40 transition-all shadow-md transform hover:-translate-y-0.5">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Expiring Soon</p>
                    <p className="text-3xl font-extrabold text-amber-400 mt-1">{expiringCustomers}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-900 border-slate-800 hover:border-rose-500/40 transition-all shadow-md transform hover:-translate-y-0.5">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="p-3 bg-rose-500/10 rounded-xl text-rose-400">
                    <XCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Expired / Suspended</p>
                    <p className="text-3xl font-extrabold text-rose-500 mt-1">{expiredCustomers}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filter and Actions Bar */}
            <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                  placeholder="Search owners by Business, Email, or Owner ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-slate-900 border-slate-800 text-slate-100 placeholder-slate-500 focus:border-violet-500 rounded-xl"
                />
              </div>

              {/* Add Owner trigger */}
              <Dialog open={showAddCustomer} onOpenChange={setShowAddCustomer}>
                <DialogTrigger asChild>
                  <Button className="bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl shadow-lg hover:shadow-violet-600/20">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Owner
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-xl bg-slate-900 border-slate-800 text-slate-100 rounded-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-bold bg-gradient-to-r from-white to-violet-300 bg-clip-text text-transparent">
                      Create New Owner Account
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 max-h-[72vh] overflow-y-auto pr-2">
                    {/* Business Details */}
                    <div className="space-y-2 border-b border-slate-800 pb-3">
                      <Label className="text-slate-300 font-bold text-xs uppercase tracking-wider">Category & Plans</Label>
                      <div className="grid grid-cols-2 gap-3 mt-1">
                        <button
                          type="button"
                          onClick={() => setNewCustomer({...newCustomer, business_type: 'restaurant'})}
                          className={`p-3.5 rounded-xl border-2 text-center transition-all ${
                            newCustomer.business_type === 'restaurant' 
                              ? 'border-violet-500 bg-violet-500/10 text-violet-300' 
                              : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <UtensilsCrossed className="w-6 h-6 mx-auto mb-1.5" />
                          <p className="font-semibold text-xs">Restaurant</p>
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewCustomer({...newCustomer, business_type: 'retail'})}
                          className={`p-3.5 rounded-xl border-2 text-center transition-all ${
                            newCustomer.business_type === 'retail' 
                              ? 'border-violet-500 bg-violet-500/10 text-violet-300' 
                              : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <ShoppingBag className="w-6 h-6 mx-auto mb-1.5" />
                          <p className="font-semibold text-xs">Retail Store</p>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-slate-300">Subscription Tier *</Label>
                        <Select
                          value={newCustomer.subscription_tier}
                          onValueChange={(v) => setNewCustomer({...newCustomer, subscription_tier: v})}
                        >
                          <SelectTrigger className="bg-slate-950 border-slate-800 rounded-xl">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-950 border-slate-800 text-slate-100">
                            <SelectItem value="basic">Basic</SelectItem>
                            <SelectItem value="gold">Gold</SelectItem>
                            <SelectItem value="platinum">Platinum</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-slate-300">Max Stores *</Label>
                        <Input
                          type="number"
                          value={newCustomer.max_stores}
                          onChange={(e) => setNewCustomer({...newCustomer, max_stores: parseInt(e.target.value) || 2})}
                          className="bg-slate-950 border-slate-800 rounded-xl text-slate-100"
                        />
                      </div>
                    </div>

                    {/* Contact details */}
                    <div className="space-y-3 pt-2">
                      <div className="space-y-1">
                        <Label className="text-xs text-slate-300">Business Name *</Label>
                        <Input
                          value={newCustomer.business_name}
                          onChange={(e) => setNewCustomer({...newCustomer, business_name: e.target.value})}
                          placeholder="Restaurant / Outlet Name"
                          className="bg-slate-950 border-slate-800 rounded-xl"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-slate-300">Owner Full Name *</Label>
                        <Input
                          value={newCustomer.owner_name}
                          onChange={(e) => setNewCustomer({...newCustomer, owner_name: e.target.value})}
                          placeholder="Full Name"
                          className="bg-slate-950 border-slate-800 rounded-xl"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-slate-300">Owner Email *</Label>
                        <Input
                          type="email"
                          value={newCustomer.owner_email}
                          onChange={(e) => setNewCustomer({...newCustomer, owner_email: e.target.value})}
                          placeholder="owner@email.com"
                          className="bg-slate-950 border-slate-800 rounded-xl"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-slate-300">Password *</Label>
                        <div className="relative">
                          <Input
                            type={showPassword ? 'text' : 'password'}
                            value={newCustomer.owner_password}
                            onChange={(e) => setNewCustomer({...newCustomer, owner_password: e.target.value})}
                            placeholder="Minimum 6 characters"
                            className="bg-slate-950 border-slate-800 rounded-xl pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* COMPULSORY ADDRESS COMPONENTS */}
                      <div className="space-y-2 border-t border-slate-800 pt-3">
                        <Label className="text-slate-300 font-bold text-xs uppercase tracking-wider flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-violet-400" />
                          Compulsory Address Details
                        </Label>
                        <div className="space-y-2">
                          <Input
                            placeholder="Address Line 1 (Street, Building) *"
                            value={newCustomer.address_line1}
                            onChange={(e) => setNewCustomer({...newCustomer, address_line1: e.target.value})}
                            className="bg-slate-950 border-slate-800 rounded-xl"
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <Input
                              placeholder="Locality / Area *"
                              value={newCustomer.locality}
                              onChange={(e) => setNewCustomer({...newCustomer, locality: e.target.value})}
                              className="bg-slate-950 border-slate-800 rounded-xl"
                            />
                            <Input
                              placeholder="City *"
                              value={newCustomer.city}
                              onChange={(e) => setNewCustomer({...newCustomer, city: e.target.value})}
                              className="bg-slate-950 border-slate-800 rounded-xl"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <Input
                              placeholder="State *"
                              value={newCustomer.state}
                              onChange={(e) => setNewCustomer({...newCustomer, state: e.target.value})}
                              className="bg-slate-950 border-slate-800 rounded-xl"
                            />
                            <Input
                              placeholder="Pincode *"
                              value={newCustomer.pincode}
                              onChange={(e) => setNewCustomer({...newCustomer, pincode: e.target.value})}
                              className="bg-slate-950 border-slate-800 rounded-xl"
                            />
                          </div>
                        </div>
                      </div>

                      {/* SIMULATED MOBILE OTP VERIFICATION GATE */}
                      <div className="space-y-2 border-t border-slate-800 pt-3">
                        <Label className="text-slate-300 font-bold text-xs uppercase tracking-wider flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-violet-400" />
                          Simulated Mobile OTP Gateway *
                        </Label>
                        <div className="flex gap-2">
                          <Input
                            type="text"
                            placeholder="Mobile Number *"
                            value={newCustomer.phone}
                            onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
                            disabled={ownerOtpVerified}
                            className="bg-slate-950 border-slate-800 rounded-xl flex-1"
                          />
                          <Button
                            type="button"
                            onClick={handleSendOwnerOtp}
                            disabled={ownerOtpVerified || isSendingOwnerOtp}
                            variant="secondary"
                            className="rounded-xl font-semibold bg-slate-800 hover:bg-slate-700 text-slate-100"
                          >
                            {isSendingOwnerOtp ? 'Sending...' : ownerOtpSent ? 'Resend' : 'Send OTP'}
                          </Button>
                        </div>

                        {ownerOtpSent && !ownerOtpVerified && (
                          <div className="flex gap-2 mt-2 p-3 bg-slate-950 rounded-xl border border-slate-850">
                            <Input
                              placeholder="Enter 6-digit OTP *"
                              value={ownerEnteredOtp}
                              onChange={(e) => setOwnerEnteredOtp(e.target.value)}
                              className="bg-slate-900 border-slate-800 rounded-xl flex-1 text-center font-mono tracking-widest text-lg"
                            />
                            <Button
                              type="button"
                              onClick={handleVerifyOwnerOtp}
                              className="bg-violet-600 hover:bg-violet-700 text-white rounded-xl"
                            >
                              Verify OTP
                            </Button>
                          </div>
                        )}

                        {ownerOtpVerified && (
                          <div className="flex items-center gap-2 text-emerald-400 bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20 text-xs font-semibold">
                            <CheckCircle className="w-4 h-4 text-emerald-400" />
                            Mobile number verified! Proceed to save.
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <Button 
                      onClick={handleAddCustomer} 
                      className="w-full mt-4 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl h-11" 
                      disabled={isCreating || !ownerOtpVerified}
                    >
                      {isCreating ? 'Creating Owner...' : 'Create Owner Account'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Owners Table */}
            <Card className="bg-slate-900 border-slate-800 shadow-xl overflow-hidden rounded-2xl">
              <CardHeader className="border-b border-slate-850">
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <Users className="w-5 h-5 text-violet-400" />
                  Active System Owners
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Total of {filteredCustomers.length} approved system owners listed with full details
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-950 text-slate-400 text-xs font-bold uppercase tracking-wider">
                        <th className="p-4">Owner ID</th>
                        <th className="p-4">Business & Email</th>
                        <th className="p-4">Owner Name</th>
                        <th className="p-4">Phone & Address</th>
                        <th className="p-4">Verification</th>
                        <th className="p-4 text-center">Stores</th>
                        <th className="p-4">Plan / Expiry</th>
                        <th className="p-4 text-center">Status</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCustomers.map((customer) => {
                        const daysLeft = differenceInDays(new Date(customer.subscription_end), new Date());
                        const isExpired = daysLeft < 0;
                        const isExpiring = daysLeft <= 7 && daysLeft > 0;

                        return (
                          <tr key={customer.id} className="border-b border-slate-850 hover:bg-slate-900/50 transition-colors text-sm">
                            {/* OWNER ID */}
                            <td className="p-4 font-mono text-xs text-slate-400">
                              <div className="flex items-center gap-1.5 bg-slate-950/80 p-1.5 rounded-lg border border-slate-850 max-w-[140px] justify-between">
                                <span className="truncate">{customer.id}</span>
                                <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  className="w-5 h-5 text-slate-500 hover:text-slate-300"
                                  onClick={() => copyToClipboard(customer.id, 'Owner ID')}
                                >
                                  <Copy className="w-3 h-3" />
                                </Button>
                              </div>
                            </td>
                            {/* Business Info */}
                            <td className="p-4">
                              <div>
                                <p className="font-bold text-white text-base">{customer.business_name}</p>
                                <p className="text-xs text-slate-400 font-medium mt-0.5">{customer.owner_email}</p>
                              </div>
                            </td>
                            {/* Owner Name */}
                            <td className="p-4 font-semibold text-slate-200">{customer.owner_name}</td>
                            {/* Phone and Address */}
                            <td className="p-4">
                              <div className="max-w-[200px] space-y-1">
                                {customer.phone && <p className="text-xs text-slate-300 font-bold">📞 {customer.phone}</p>}
                                {customer.address_line1 && (
                                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                                    📍 {customer.address_line1}, {customer.locality}, {customer.city}, {customer.state} - {customer.pincode}
                                  </p>
                                )}
                              </div>
                            </td>
                            {/* Verification Gates */}
                            <td className="p-4 space-y-1 text-xs">
                              <div className="flex items-center gap-1.5">
                                <span className="text-slate-400">Mobile:</span>
                                <Badge variant={customer.mobile_verified ? 'default' : 'secondary'} className={customer.mobile_verified ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-800 text-slate-400 border-transparent'}>
                                  {customer.mobile_verified ? 'Verified' : 'Unverified'}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-slate-400">Email:</span>
                                <Badge variant={customer.email_verified ? 'default' : 'secondary'} className={customer.email_verified ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-800 text-slate-400 border-transparent'}>
                                  {customer.email_verified ? 'Verified' : 'Unverified'}
                                </Badge>
                              </div>
                            </td>
                            {/* Stores settings */}
                            <td className="p-4 text-center">
                              <div className="flex flex-col items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                                <Select
                                  value={String(customer.max_stores)}
                                  onValueChange={(v) => updateMaxStores(customer.id, parseInt(v))}
                                >
                                  <SelectTrigger className="w-16 h-8 bg-slate-950 border-slate-800 text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="bg-slate-950 border-slate-800 text-slate-100">
                                    {[1, 2, 3, 5, 10, 20, 50].map(n => (
                                      <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </td>
                            {/* Plan & Expiry */}
                            <td className="p-4">
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-1">
                                  <Crown className="w-3.5 h-3.5 text-amber-400" />
                                  <Badge className="capitalize text-[10px] py-0 bg-indigo-950 text-indigo-300 border border-indigo-500/30">
                                    {customer.subscription_tier} ({customer.subscription_plan})
                                  </Badge>
                                </div>
                                <p className="text-xs font-semibold text-slate-300 mt-1">
                                  Expires: {format(new Date(customer.subscription_end), 'dd MMM yyyy')}
                                </p>
                                <p className={`text-[11px] font-bold ${isExpired ? 'text-rose-400' : isExpiring ? 'text-amber-400' : 'text-slate-400'}`}>
                                  {isExpired ? 'Expired' : `${daysLeft} days left`}
                                </p>
                              </div>
                            </td>
                            {/* Status */}
                            <td className="p-4 text-center">
                              <Badge variant={customer.approval_status === 'suspended' ? 'destructive' : customer.is_active ? 'default' : 'secondary'} className={customer.approval_status === 'suspended' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : customer.is_active ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-850 text-slate-400'}>
                                {customer.approval_status === 'suspended' ? 'Suspended' : customer.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                            </td>
                            {/* Actions */}
                            <td className="p-4 text-right">
                              <div className="flex gap-2 justify-end">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 border-slate-800 bg-slate-900/60 text-slate-300 hover:text-white"
                                  onClick={() => extendSubscription(customer.id, 30)}
                                  disabled={customer.owner_email === 'jagralasalman786@gmail.com'}
                                >
                                  +30 Days
                                </Button>
                                <Button
                                  size="sm"
                                  variant={customer.is_active ? 'destructive' : 'default'}
                                  className="h-8"
                                  onClick={() => toggleCustomerStatus(customer.id, customer.is_active)}
                                  disabled={customer.owner_email === 'jagralasalman786@gmail.com'}
                                >
                                  {customer.is_active ? 'Disable' : 'Enable'}
                                </Button>
                                {customer.approval_status === 'suspended' ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                                    onClick={() => unsuspendOwner(customer.id)}
                                    disabled={customer.owner_email === 'jagralasalman786@gmail.com'}
                                  >
                                    <ShieldOff className="w-4 h-4 mr-1" />
                                    Unsuspend
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 border-rose-500/30 text-rose-400 hover:bg-rose-500/10"
                                    onClick={() => suspendOwner(customer.id)}
                                    disabled={customer.owner_email === 'jagralasalman786@gmail.com'}
                                  >
                                    <Ban className="w-4 h-4 mr-1" />
                                    Suspend
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 border-rose-600/30 text-rose-500 hover:bg-rose-600/20"
                                  onClick={() => initiateDeleteOwner(customer)}
                                  disabled={customer.owner_email === 'jagralasalman786@gmail.com'}
                                >
                                  <Trash2 className="w-4 h-4 mr-1" />
                                  Delete
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {filteredCustomers.length === 0 && (
                    <div className="text-center py-12 text-slate-500 bg-slate-900/20">
                      No owners found matching search criteria
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 2: STORES */}
          <TabsContent value="stores" className="mt-6 space-y-6">
            <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                  placeholder="Search stores by Store Name, Owner, or Store ID..."
                  value={storeSearchQuery}
                  onChange={(e) => setStoreSearchQuery(e.target.value)}
                  className="pl-10 bg-slate-900 border-slate-800 text-slate-100 placeholder-slate-500 rounded-xl"
                />
              </div>

              {/* Add Store Dialog */}
              <Dialog open={showAddStore} onOpenChange={setShowAddStore}>
                <DialogTrigger asChild>
                  <Button className="bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl shadow-lg">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Store ID
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-xl bg-slate-900 border-slate-800 text-slate-100 rounded-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-bold bg-gradient-to-r from-white to-violet-300 bg-clip-text text-transparent">
                      Create New Store Outlet
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 max-h-[72vh] overflow-y-auto pr-2">
                    <div className="space-y-2">
                      <Label className="text-xs text-slate-300">Select Owner / Customer *</Label>
                      <Select
                        value={newStore.customer_id}
                        onValueChange={(v) => setNewStore({...newStore, customer_id: v})}
                      >
                        <SelectTrigger className="bg-slate-950 border-slate-800 rounded-xl">
                          <SelectValue placeholder="Choose Owner Account" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-950 border-slate-800 text-slate-100">
                          {customers.filter(c => c.approval_status === 'approved').map(customer => (
                            <SelectItem key={customer.id} value={customer.id}>
                              {customer.business_name} ({customer.owner_name})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs text-slate-300">Store Name *</Label>
                      <Input
                        value={newStore.name}
                        onChange={(e) => setNewStore({...newStore, name: e.target.value})}
                        placeholder="e.g. Downtown Outlet"
                        className="bg-slate-950 border-slate-800 rounded-xl"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs text-slate-300">Manager Email (Login ID) *</Label>
                        <Input
                          type="email"
                          value={newStore.email}
                          onChange={(e) => setNewStore({...newStore, email: e.target.value})}
                          placeholder="store@email.com"
                          className="bg-slate-950 border-slate-800 rounded-xl"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-slate-300">Manager Password *</Label>
                        <Input
                          type="password"
                          value={newStore.password}
                          onChange={(e) => setNewStore({...newStore, password: e.target.value})}
                          placeholder="Min 6 chars"
                          className="bg-slate-950 border-slate-800 rounded-xl"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs text-slate-300">Business Type *</Label>
                      <Select
                        value={newStore.business_type}
                        onValueChange={(v) => setNewStore({...newStore, business_type: v})}
                      >
                        <SelectTrigger className="bg-slate-950 border-slate-800 rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-950 border-slate-800 text-slate-100">
                          <SelectItem value="restaurant">Restaurant</SelectItem>
                          <SelectItem value="retail">Retail Store</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Compulsory Address Components */}
                    <div className="space-y-2 border-t border-slate-800 pt-3">
                      <Label className="text-slate-300 font-bold text-xs uppercase tracking-wider flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-violet-400" />
                        Compulsory Store Address
                      </Label>
                      <div className="space-y-2">
                        <Input
                          placeholder="Address Line 1 *"
                          value={newStore.addressLine1}
                          onChange={(e) => setNewStore({...newStore, addressLine1: e.target.value})}
                          className="bg-slate-950 border-slate-800 rounded-xl"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            placeholder="Locality *"
                            value={newStore.locality}
                            onChange={(e) => setNewStore({...newStore, locality: e.target.value})}
                            className="bg-slate-950 border-slate-800 rounded-xl"
                          />
                          <Input
                            placeholder="City *"
                            value={newStore.city}
                            onChange={(e) => setNewStore({...newStore, city: e.target.value})}
                            className="bg-slate-950 border-slate-800 rounded-xl"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            placeholder="State *"
                            value={newStore.state}
                            onChange={(e) => setNewStore({...newStore, state: e.target.value})}
                            className="bg-slate-950 border-slate-800 rounded-xl"
                          />
                          <Input
                            placeholder="Pincode *"
                            value={newStore.pincode}
                            onChange={(e) => setNewStore({...newStore, pincode: e.target.value})}
                            className="bg-slate-950 border-slate-800 rounded-xl"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Store Mobile OTP Sim */}
                    <div className="space-y-2 border-t border-slate-800 pt-3">
                      <Label className="text-slate-300 font-bold text-xs uppercase tracking-wider flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-violet-400" />
                        Mobile OTP Verification *
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Store Contact Mobile *"
                          value={newStore.phone}
                          onChange={(e) => setNewStore({...newStore, phone: e.target.value})}
                          disabled={storeOtpVerified}
                          className="bg-slate-950 border-slate-800 rounded-xl flex-1"
                        />
                        <Button
                          type="button"
                          onClick={handleSendStoreOtp}
                          disabled={storeOtpVerified || isSendingStoreOtp}
                          variant="secondary"
                          className="rounded-xl bg-slate-800 text-slate-200"
                        >
                          {isSendingStoreOtp ? 'Sending...' : storeOtpSent ? 'Resend' : 'Send OTP'}
                        </Button>
                      </div>

                      {storeOtpSent && !storeOtpVerified && (
                        <div className="flex gap-2 mt-2 p-3 bg-slate-950 border border-slate-850 rounded-xl">
                          <Input
                            placeholder="Enter Code *"
                            value={storeEnteredOtp}
                            onChange={(e) => setStoreEnteredOtp(e.target.value)}
                            className="bg-slate-900 border-slate-800 rounded-xl flex-1 text-center font-mono tracking-widest text-lg"
                          />
                          <Button
                            type="button"
                            onClick={handleVerifyStoreOtp}
                            className="bg-violet-600 hover:bg-violet-700 text-white rounded-xl"
                          >
                            Verify
                          </Button>
                        </div>
                      )}

                      {storeOtpVerified && (
                        <div className="flex items-center gap-2 text-emerald-400 bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20 text-xs font-semibold">
                          <CheckCircle className="w-4 h-4" />
                          Mobile OTP verified! Ready to save.
                        </div>
                      )}
                    </div>

                    <Button 
                      onClick={handleAddStore} 
                      className="w-full mt-4 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl h-11" 
                      disabled={isCreatingStore || !storeOtpVerified}
                    >
                      {isCreatingStore ? 'Creating Store...' : 'Create Store Outlet'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Stores List Table */}
            <Card className="bg-slate-900 border-slate-800 shadow-xl overflow-hidden rounded-2xl">
              <CardHeader>
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <Store className="w-5 h-5 text-violet-400" />
                  Outlet Stores ID List
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Detailed view of all registered stores in the system
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-950 text-slate-400 text-xs font-bold uppercase tracking-wider">
                        <th className="p-4">Store ID</th>
                        <th className="p-4">Store Code</th>
                        <th className="p-4">Store Name</th>
                        <th className="p-4">Phone & Location</th>
                        <th className="p-4">Owner ID</th>
                        <th className="p-4">Owner Name</th>
                        <th className="p-4">Created Date</th>
                        <th className="p-4 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStores.map((store) => (
                        <tr key={store.id} className="border-b border-slate-850 hover:bg-slate-900/50 transition-colors text-sm">
                          {/* STORE ID */}
                          <td className="p-4 font-mono text-xs">
                            <div className="flex items-center gap-1.5 bg-slate-950/80 p-1.5 rounded-lg border border-slate-850 max-w-[140px] justify-between text-slate-400">
                              <span className="truncate">{store.id}</span>
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                className="w-5 h-5 text-slate-500 hover:text-slate-300"
                                onClick={() => copyToClipboard(store.id, 'Store ID')}
                              >
                                <Copy className="w-3 h-3" />
                              </Button>
                            </div>
                          </td>
                          <td className="p-4 font-bold text-violet-400">{store.store_code || 'PENDING'}</td>
                          <td className="p-4 font-bold text-slate-100">{store.store_name}</td>
                          <td className="p-4">
                            <div className="space-y-0.5">
                              {store.phone && <p className="text-xs text-slate-300">📞 {store.phone}</p>}
                              {store.address && <p className="text-[11px] text-slate-400 truncate max-w-[200px]" title={store.address}>📍 {store.address}</p>}
                            </div>
                          </td>
                          {/* OWNER ID */}
                          <td className="p-4 font-mono text-xs">
                            <div className="flex items-center gap-1 bg-slate-950/40 px-1.5 py-1 rounded text-slate-400 max-w-[130px] justify-between">
                              <span className="truncate">{store.customer_id}</span>
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                className="w-4 h-4 text-slate-500 hover:text-slate-300"
                                onClick={() => copyToClipboard(store.customer_id, 'Owner ID')}
                              >
                                <Copy className="w-2.5 h-2.5" />
                              </Button>
                            </div>
                          </td>
                          <td className="p-4 text-slate-300 font-semibold">{store.owner_name}</td>
                          <td className="p-4 text-slate-400">
                            {store.created_at ? format(new Date(store.created_at), 'dd MMM yyyy') : 'N/A'}
                          </td>
                          <td className="p-4 text-center">
                            <Badge variant={store.is_active ? 'default' : 'secondary'} className={store.is_active ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-850 text-slate-400'}>
                              {store.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {filteredStores.length === 0 && (
                    <div className="text-center py-12 text-slate-500">
                      No stores found matching search queries
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 3: STAFF */}
          <TabsContent value="staff" className="mt-6 space-y-6">
            <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                  placeholder="Search staff by Name, Phone, Aadhaar, or Staff ID..."
                  value={staffSearchQuery}
                  onChange={(e) => setStaffSearchQuery(e.target.value)}
                  className="pl-10 bg-slate-900 border-slate-800 text-slate-100 placeholder-slate-500 rounded-xl"
                />
              </div>

              {/* Add Staff Dialog */}
              <Dialog open={showAddStaff} onOpenChange={setShowAddStaff}>
                <DialogTrigger asChild>
                  <Button className="bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl shadow-lg">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Staff
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-xl bg-slate-900 border-slate-800 text-slate-100 rounded-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-bold bg-gradient-to-r from-white to-violet-300 bg-clip-text text-transparent">
                      Create New Staff Account
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 max-h-[72vh] overflow-y-auto pr-2">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs text-slate-300">Select Owner *</Label>
                        <Select
                          value={newStaff.customer_id}
                          onValueChange={(v) => setNewStaff({...newStaff, customer_id: v, store_id: ''})}
                        >
                          <SelectTrigger className="bg-slate-950 border-slate-800 rounded-xl">
                            <SelectValue placeholder="Choose Owner" />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-950 border-slate-800 text-slate-100">
                            {customers.filter(c => c.approval_status === 'approved').map(customer => (
                              <SelectItem key={customer.id} value={customer.id}>
                                {customer.business_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs text-slate-300">Select Store *</Label>
                        <Select
                          value={newStaff.store_id}
                          onValueChange={(v) => setNewStaff({...newStaff, store_id: v})}
                          disabled={!newStaff.customer_id}
                        >
                          <SelectTrigger className="bg-slate-950 border-slate-800 rounded-xl">
                            <SelectValue placeholder="Choose Store" />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-950 border-slate-800 text-slate-100">
                            {stores.filter(s => s.customer_id === newStaff.customer_id).map(store => (
                              <SelectItem key={store.id} value={store.id}>
                                {store.store_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs text-slate-300">Staff Full Name *</Label>
                        <Input
                          value={newStaff.name}
                          onChange={(e) => setNewStaff({...newStaff, name: e.target.value})}
                          placeholder="e.g. John Doe"
                          className="bg-slate-950 border-slate-800 rounded-xl"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-slate-300">Email (Login ID) *</Label>
                        <Input
                          type="email"
                          value={newStaff.email}
                          onChange={(e) => setNewStaff({...newStaff, email: e.target.value})}
                          placeholder="john@store.com"
                          className="bg-slate-950 border-slate-800 rounded-xl"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs text-slate-300">Login PIN (4 digits) *</Label>
                        <Input
                          type="password"
                          maxLength={4}
                          value={newStaff.pin}
                          onChange={(e) => setNewStaff({...newStaff, pin: e.target.value.replace(/\D/g, '')})}
                          placeholder="1234"
                          className="bg-slate-950 border-slate-800 rounded-xl font-mono text-center tracking-widest text-lg"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-slate-300">Role *</Label>
                        <Select
                          value={newStaff.role}
                          onValueChange={(v) => setNewStaff({...newStaff, role: v})}
                        >
                          <SelectTrigger className="bg-slate-950 border-slate-800 rounded-xl">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-950 border-slate-800 text-slate-100">
                            <SelectItem value="staff">Staff Member</SelectItem>
                            <SelectItem value="store_manager">Store Manager</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Aadhaar Details (MANDATORY FOR STAFF) */}
                    <div className="space-y-3 border-t border-slate-800 pt-3">
                      <Label className="text-slate-300 font-bold text-xs uppercase tracking-wider flex items-center gap-1">
                        <UserCheck className="w-3.5 h-3.5 text-violet-400" />
                        Staff Aadhaar Document Gate
                      </Label>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-[11px] text-slate-400">Aadhaar 12-Digit Number *</Label>
                          <Input
                            maxLength={12}
                            value={newStaff.aadhaarNumber}
                            onChange={(e) => setNewStaff({...newStaff, aadhaarNumber: e.target.value.replace(/\D/g, '')})}
                            placeholder="123456789012"
                            className="bg-slate-950 border-slate-800 rounded-xl font-mono"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[11px] text-slate-400">Aadhaar Name *</Label>
                          <Input
                            value={newStaff.aadhaarName}
                            onChange={(e) => setNewStaff({...newStaff, aadhaarName: e.target.value})}
                            placeholder="Name exactly as on card"
                            className="bg-slate-950 border-slate-800 rounded-xl"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mt-2">
                        <div className="space-y-1">
                          <Label className="text-[11px] text-slate-400">Aadhaar Front Scan *</Label>
                          <div className="flex flex-col gap-2">
                            <Input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleAadhaarUpload(e, 'front')}
                              className="bg-slate-950 border-slate-800 rounded-xl text-xs"
                            />
                            {aadhaarFrontPreview && (
                              <img src={aadhaarFrontPreview} alt="Front Preview" className="h-16 w-full object-cover rounded-xl border border-slate-800" />
                            )}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[11px] text-slate-400">Aadhaar Back Scan *</Label>
                          <div className="flex flex-col gap-2">
                            <Input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleAadhaarUpload(e, 'back')}
                              className="bg-slate-950 border-slate-800 rounded-xl text-xs"
                            />
                            {aadhaarBackPreview && (
                              <img src={aadhaarBackPreview} alt="Back Preview" className="h-16 w-full object-cover rounded-xl border border-slate-800" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Compulsory Address Components */}
                    <div className="space-y-2 border-t border-slate-800 pt-3">
                      <Label className="text-slate-300 font-bold text-xs uppercase tracking-wider flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-violet-400" />
                        Compulsory Staff Address
                      </Label>
                      <div className="space-y-2">
                        <Input
                          placeholder="Address Line 1 *"
                          value={newStaff.addressLine1}
                          onChange={(e) => setNewStaff({...newStaff, addressLine1: e.target.value})}
                          className="bg-slate-950 border-slate-800 rounded-xl"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            placeholder="Locality *"
                            value={newStaff.locality}
                            onChange={(e) => setNewStaff({...newStaff, locality: e.target.value})}
                            className="bg-slate-950 border-slate-800 rounded-xl"
                          />
                          <Input
                            placeholder="City *"
                            value={newStaff.city}
                            onChange={(e) => setNewStaff({...newStaff, city: e.target.value})}
                            className="bg-slate-950 border-slate-800 rounded-xl"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            placeholder="State *"
                            value={newStaff.state}
                            onChange={(e) => setNewStaff({...newStaff, state: e.target.value})}
                            className="bg-slate-950 border-slate-800 rounded-xl"
                          />
                          <Input
                            placeholder="Pincode *"
                            value={newStaff.pincode}
                            onChange={(e) => setNewStaff({...newStaff, pincode: e.target.value})}
                            className="bg-slate-950 border-slate-800 rounded-xl"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Staff Mobile OTP Sim */}
                    <div className="space-y-2 border-t border-slate-800 pt-3">
                      <Label className="text-slate-300 font-bold text-xs uppercase tracking-wider flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-violet-400" />
                        Mobile OTP Verification *
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Mobile Number *"
                          value={newStaff.phone}
                          onChange={(e) => setNewStaff({...newStaff, phone: e.target.value})}
                          disabled={staffOtpVerified}
                          className="bg-slate-950 border-slate-800 rounded-xl flex-1"
                        />
                        <Button
                          type="button"
                          onClick={handleSendStaffOtp}
                          disabled={staffOtpVerified || isSendingStaffOtp}
                          variant="secondary"
                          className="rounded-xl bg-slate-800 text-slate-200"
                        >
                          {isSendingStaffOtp ? 'Sending...' : staffOtpSent ? 'Resend' : 'Send OTP'}
                        </Button>
                      </div>

                      {staffOtpSent && !staffOtpVerified && (
                        <div className="flex gap-2 mt-2 p-3 bg-slate-950 border border-slate-850 rounded-xl">
                          <Input
                            placeholder="Enter 6-digit Code *"
                            value={staffEnteredOtp}
                            onChange={(e) => setStaffEnteredOtp(e.target.value)}
                            className="bg-slate-900 border-slate-800 rounded-xl flex-1 text-center font-mono tracking-widest text-lg"
                          />
                          <Button
                            type="button"
                            onClick={handleVerifyStaffOtp}
                            className="bg-violet-600 hover:bg-violet-700 text-white rounded-xl"
                          >
                            Verify
                          </Button>
                        </div>
                      )}

                      {staffOtpVerified && (
                        <div className="flex items-center gap-2 text-emerald-400 bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20 text-xs font-semibold">
                          <CheckCircle className="w-4 h-4" />
                          Mobile OTP verified! Ready to save.
                        </div>
                      )}
                    </div>

                    <Button 
                      onClick={handleAddStaff} 
                      className="w-full mt-4 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl h-11" 
                      disabled={isCreatingStaff || !staffOtpVerified}
                    >
                      {isCreatingStaff ? 'Creating Staff...' : 'Create Staff (Sets as Inactive)'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Staff Table */}
            <Card className="bg-slate-900 border-slate-800 shadow-xl overflow-hidden rounded-2xl">
              <CardHeader>
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-violet-400" />
                  Staff Members System-wide
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Global staff directory across all customers and stores
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-950 text-slate-400 text-xs font-bold uppercase tracking-wider">
                        <th className="p-4">Staff ID</th>
                        <th className="p-4">Name & Email</th>
                        <th className="p-4">Contact & Address</th>
                        <th className="p-4 text-center">Role</th>
                        <th className="p-4">Aadhaar Status</th>
                        <th className="p-4">Assigned Store</th>
                        <th className="p-4">Owner Name</th>
                        <th className="p-4 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStaffList.map((staffMember) => (
                        <tr key={staffMember.id} className="border-b border-slate-850 hover:bg-slate-900/50 transition-colors text-sm">
                          {/* STAFF ID */}
                          <td className="p-4 font-mono text-xs text-slate-400">
                            <div className="flex items-center gap-1.5 bg-slate-950/80 p-1.5 rounded-lg border border-slate-850 max-w-[140px] justify-between">
                              <span className="truncate">{staffMember.id}</span>
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                className="w-5 h-5 text-slate-500 hover:text-slate-300"
                                onClick={() => copyToClipboard(staffMember.id, 'Staff ID')}
                              >
                                <Copy className="w-3 h-3" />
                              </Button>
                            </div>
                          </td>
                          <td className="p-4 font-bold">
                            <div>
                              <p className="text-slate-200">{staffMember.full_name}</p>
                              <p className="text-xs text-slate-400 font-medium">{staffMember.email}</p>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="space-y-0.5">
                              {staffMember.phone && <p className="text-xs text-slate-300 font-bold">📞 {staffMember.phone}</p>}
                              {staffMember.address_line1 && (
                                <p className="text-[11px] text-slate-400 truncate max-w-[180px]" title={`${staffMember.address_line1}, ${staffMember.locality}, ${staffMember.city}`}>
                                  📍 {staffMember.address_line1}, {staffMember.locality}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            <Badge className="capitalize bg-indigo-950 text-indigo-300 border border-indigo-500/20">
                              {staffMember.role?.replace('_', ' ')}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <div className="space-y-1">
                              <Badge 
                                className={`capitalize text-[10px] ${
                                  staffMember.aadhaar_verification_status === 'verified' 
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                    : staffMember.aadhaar_verification_status === 'rejected'
                                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse'
                                }`}
                              >
                                {staffMember.aadhaar_verification_status || 'Pending'}
                              </Badge>
                              {staffMember.aadhaar_number && (
                                <p className="text-[10px] font-mono text-slate-400">No: {staffMember.aadhaar_number}</p>
                              )}
                            </div>
                          </td>
                          <td className="p-4 text-slate-300 font-semibold">{staffMember.store_name}</td>
                          <td className="p-4 text-slate-400">{staffMember.owner_name}</td>
                          <td className="p-4 text-center">
                            <Badge variant={staffMember.is_active ? 'default' : 'secondary'} className={staffMember.is_active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-850 text-slate-500'}>
                              {staffMember.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {filteredStaffList.length === 0 && (
                    <div className="text-center py-12 text-slate-500">
                      No staff members found matching search queries
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 4: VERIFICATION APPROVALS QUEUE */}
          <TabsContent value="verification" className="mt-6 space-y-6">
            <div className="grid grid-cols-1 gap-6">
              
              {/* PENDING OWNER SIGNUPS */}
              <Card className="bg-slate-900 border-slate-800 shadow-xl overflow-hidden rounded-2xl">
                <CardHeader className="bg-slate-950/40 border-b border-slate-850">
                  <CardTitle className="text-lg font-bold text-amber-400 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-amber-400" />
                    New Owner Signups Approvals Queue ({pendingOwners.length})
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Review and approve/reject new owner subscription registration accounts
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {pendingOwners.map((cust) => (
                      <div key={cust.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-slate-950 rounded-xl border border-slate-850 gap-4">
                        <div className="space-y-1 flex-1">
                          <p className="font-extrabold text-white text-lg">{cust.business_name}</p>
                          <p className="text-sm text-slate-400">{cust.owner_name} • {cust.owner_email}</p>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-2 font-medium">
                            <Badge variant="outline" className="capitalize border-slate-700 bg-slate-900">{cust.subscription_tier} ({cust.subscription_plan})</Badge>
                            {cust.phone && <span className="bg-slate-900/60 px-2 py-0.5 rounded border border-slate-800">📞 {cust.phone}</span>}
                            <span>Requested: {format(new Date(cust.created_at), 'dd MMM yyyy')}</span>
                          </div>
                          {cust.address_line1 && (
                            <p className="text-xs text-slate-400 mt-2 bg-slate-900 p-2 rounded-lg border border-slate-850">
                              📍 Address: {cust.address_line1}, {cust.locality}, {cust.city}, {cust.state} - {cust.pincode}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 border-t md:border-t-0 pt-3 md:pt-0">
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="border-rose-600/30 text-rose-500 hover:bg-rose-600/10 rounded-xl px-4"
                            onClick={() => rejectCustomer(cust.id)}
                          >
                            <XCircle className="w-4 h-4 mr-1.5" />
                            Reject
                          </Button>
                          <Button 
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-4 shadow-lg hover:shadow-emerald-600/20"
                            onClick={() => approveCustomer(cust.id)}
                          >
                            <CheckCircle className="w-4 h-4 mr-1.5" />
                            Approve Owner
                          </Button>
                        </div>
                      </div>
                    ))}

                    {pendingOwners.length === 0 && (
                      <div className="text-center py-6 text-slate-500 font-semibold text-sm">
                        No pending owner registration requests
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* PENDING STAFF AADHAAR DOCUMENTS */}
              <Card className="bg-slate-900 border-slate-800 shadow-xl overflow-hidden rounded-2xl">
                <CardHeader className="bg-slate-950/40 border-b border-slate-850">
                  <CardTitle className="text-lg font-bold text-amber-400 flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-amber-400" />
                    Staff Aadhaar Document Verification Queue ({pendingStaff.length})
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Review and verify staff Aadhaar number, name and documents to activate accounts
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-4">
                    {pendingStaff.map((staffMember) => (
                      <div key={staffMember.id} className="p-4 bg-slate-950 rounded-xl border border-slate-850 space-y-4">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                          <div className="space-y-1">
                            <p className="font-extrabold text-white text-lg">{staffMember.full_name}</p>
                            <p className="text-sm text-slate-400">{staffMember.email} • {staffMember.phone}</p>
                            <div className="flex flex-wrap items-center gap-2 text-xs mt-1">
                              <Badge className="bg-indigo-950 text-indigo-300 border border-indigo-500/20 capitalize">{staffMember.role?.replace('_', ' ')}</Badge>
                              <span className="text-slate-500">Store: {staffMember.store_name} • Owner: {staffMember.owner_name}</span>
                            </div>
                            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 p-3 bg-slate-900/40 rounded-lg border border-slate-850 text-xs">
                              <div>
                                <span className="text-slate-400">Aadhaar Number:</span>{' '}
                                <strong className="text-white font-mono tracking-wider">{staffMember.aadhaar_number}</strong>
                              </div>
                              <div>
                                <span className="text-slate-400">Aadhaar Name:</span>{' '}
                                <strong className="text-white">{staffMember.aadhaar_name}</strong>
                              </div>
                              <div className="sm:col-span-2">
                                <span className="text-slate-400">Address:</span>{' '}
                                <span className="text-slate-300">{staffMember.address_line1}, {staffMember.locality}, {staffMember.city}, {staffMember.state} - {staffMember.pincode}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end md:self-start">
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="border-rose-600/30 text-rose-500 hover:bg-rose-600/10 rounded-xl px-4"
                              onClick={() => rejectStaffAadhaar(staffMember.id)}
                            >
                              <XCircle className="w-4 h-4 mr-1.5" />
                              Reject
                            </Button>
                            <Button 
                              size="sm"
                              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-4 shadow-lg hover:shadow-emerald-600/20"
                              onClick={() => approveStaffAadhaar(staffMember.id)}
                            >
                              <CheckCircle className="w-4 h-4 mr-1.5" />
                              Approve Aadhaar
                            </Button>
                          </div>
                        </div>

                        {/* Aadhaar Image Previews */}
                        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-850">
                          <div>
                            <p className="text-xs text-slate-400 font-bold mb-2">Aadhaar Card Front Scan:</p>
                            {staffMember.aadhaar_front_url ? (
                              <div 
                                className="relative group cursor-zoom-in border border-slate-800 rounded-xl overflow-hidden bg-slate-900 aspect-video flex items-center justify-center"
                                onClick={() => setPreviewImage(staffMember.aadhaar_front_url)}
                              >
                                <img src={staffMember.aadhaar_front_url} alt="Aadhaar Front" className="max-h-36 object-contain w-full transition-transform group-hover:scale-105" />
                                <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <EyeIcon className="w-6 h-6 text-white" />
                                </div>
                              </div>
                            ) : (
                              <div className="p-4 bg-slate-900 border border-dashed border-slate-800 text-xs text-slate-500 rounded-xl text-center">
                                Front image scan not uploaded
                              </div>
                            )}
                          </div>

                          <div>
                            <p className="text-xs text-slate-400 font-bold mb-2">Aadhaar Card Back Scan:</p>
                            {staffMember.aadhaar_back_url ? (
                              <div 
                                className="relative group cursor-zoom-in border border-slate-800 rounded-xl overflow-hidden bg-slate-900 aspect-video flex items-center justify-center"
                                onClick={() => setPreviewImage(staffMember.aadhaar_back_url)}
                              >
                                <img src={staffMember.aadhaar_back_url} alt="Aadhaar Back" className="max-h-36 object-contain w-full transition-transform group-hover:scale-105" />
                                <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <EyeIcon className="w-6 h-6 text-white" />
                                </div>
                              </div>
                            ) : (
                              <div className="p-4 bg-slate-900 border border-dashed border-slate-800 text-xs text-slate-500 rounded-xl text-center">
                                Back image scan not uploaded
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}

                    {pendingStaff.length === 0 && (
                      <div className="text-center py-6 text-slate-500 font-semibold text-sm">
                        No pending staff Aadhaar documents awaiting verification
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* TAB 5: SYSTEM EXPLORER */}
          <TabsContent value="explorer" className="mt-6 space-y-6">
            <Card className="bg-slate-900 border-slate-800 shadow-xl overflow-hidden rounded-2xl">
              <CardHeader className="border-b border-slate-850">
                <CardTitle className="text-xl font-bold flex items-center gap-2 text-violet-400">
                  <Building className="w-5 h-5 text-violet-400" />
                  System-Wide Account & Store Explorer
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Query and examine active orders, products, inventory, expenses, and configurations directly for any store outlet in the system
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                
                {/* Store Selectors */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-300">1. Select Owner Business *</Label>
                    <Select
                      value={explorerOwnerId}
                      onValueChange={(v) => {
                        setExplorerOwnerId(v);
                        setExplorerStoreId('');
                      }}
                    >
                      <SelectTrigger className="bg-slate-950 border-slate-800 rounded-xl text-slate-100">
                        <SelectValue placeholder="Choose Owner Account" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-950 border-slate-800 text-slate-100">
                        {customers.filter(c => c.approval_status === 'approved').map(customer => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.business_name} ({customer.owner_name})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-300">2. Select Outlet Store *</Label>
                    <Select
                      value={explorerStoreId}
                      onValueChange={(v) => setExplorerStoreId(v)}
                      disabled={!explorerOwnerId}
                    >
                      <SelectTrigger className="bg-slate-950 border-slate-800 rounded-xl text-slate-100">
                        <SelectValue placeholder={explorerOwnerId ? "Choose Store Outlet" : "Select Owner First"} />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-950 border-slate-800 text-slate-100">
                        {stores.filter(s => s.customer_id === explorerOwnerId).map(store => (
                          <SelectItem key={store.id} value={store.id}>
                            {store.store_name} ({store.store_code || 'No Code'})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Explorer Viewer Area */}
                {!explorerStoreId ? (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-500 border border-dashed border-slate-800 rounded-2xl bg-slate-950/20">
                    <Store className="w-16 h-16 mb-4 opacity-20 text-violet-400" />
                    <p className="text-sm font-semibold">Select an Owner and a Store Outlet to begin exploring database records</p>
                  </div>
                ) : isFetchingExplorer ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <div className="animate-spin w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full" />
                    <p className="text-sm text-slate-400 mt-4">Connecting to store tables...</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Explorer Tabs */}
                    <Tabs value={explorerTab} onValueChange={setExplorerTab} className="w-full">
                      <TabsList className="bg-slate-950 border border-slate-850 p-1 rounded-xl w-full flex flex-wrap h-auto gap-1">
                        <TabsTrigger value="orders" className="flex-1 rounded-lg py-2 text-xs font-semibold data-[state=active]:bg-violet-600">
                          Sales & Orders ({explorerData.orders.length})
                        </TabsTrigger>
                        <TabsTrigger value="products" className="flex-1 rounded-lg py-2 text-xs font-semibold data-[state=active]:bg-violet-600">
                          Menu Items ({explorerData.menuItems.length})
                        </TabsTrigger>
                        <TabsTrigger value="inventory" className="flex-1 rounded-lg py-2 text-xs font-semibold data-[state=active]:bg-violet-600">
                          Raw Inventory ({explorerData.inventory.length})
                        </TabsTrigger>
                        <TabsTrigger value="credits" className="flex-1 rounded-lg py-2 text-xs font-semibold data-[state=active]:bg-violet-600">
                          Credit Ledger ({explorerData.credits.length})
                        </TabsTrigger>
                        <TabsTrigger value="expenses" className="flex-1 rounded-lg py-2 text-xs font-semibold data-[state=active]:bg-violet-600">
                          Expenses ({explorerData.expenses.length})
                        </TabsTrigger>
                        <TabsTrigger value="whatsapp" className="flex-1 rounded-lg py-2 text-xs font-semibold data-[state=active]:bg-violet-600">
                          WhatsApp Configuration
                        </TabsTrigger>
                      </TabsList>

                      {/* EXPLORER TAB: ORDERS */}
                      <TabsContent value="orders" className="mt-4 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <Card className="bg-slate-950 border-slate-850 p-4">
                            <p className="text-xs text-slate-400 font-bold uppercase">Total Store Sales</p>
                            <p className="text-3xl font-black text-emerald-400 mt-1">
                              ₹{explorerData.orders.reduce((sum, o) => sum + (o.total || 0), 0).toFixed(2)}
                            </p>
                          </Card>
                          <Card className="bg-slate-950 border-slate-850 p-4">
                            <p className="text-xs text-slate-400 font-bold uppercase">Total Store Bills</p>
                            <p className="text-3xl font-black text-violet-400 mt-1">{explorerData.orders.length}</p>
                          </Card>
                        </div>

                        <div className="overflow-x-auto border border-slate-850 rounded-xl bg-slate-950">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="border-b border-slate-800 bg-slate-900/50 text-slate-400 font-bold">
                                <th className="p-3">Bill Number</th>
                                <th className="p-3">Customer</th>
                                <th className="p-3">Order Type</th>
                                <th className="p-3">Payment Method</th>
                                <th className="p-3 text-right">Subtotal</th>
                                <th className="p-3 text-right">Tax</th>
                                <th className="p-3 text-right">Total</th>
                                <th className="p-3">Created Date</th>
                                <th className="p-3 text-center">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {explorerData.orders.map((ord) => (
                                <tr key={ord.id} className="border-b border-slate-850 hover:bg-slate-900/30">
                                  <td className="p-3 font-mono font-bold text-violet-400">{ord.bill_number}</td>
                                  <td className="p-3">
                                    <p className="font-semibold text-slate-200">{ord.customer_name || 'Walk-in'}</p>
                                    {ord.customer_phone && <p className="text-[10px] text-slate-500">{ord.customer_phone}</p>}
                                  </td>
                                  <td className="p-3 capitalize">{ord.order_type}</td>
                                  <td className="p-3 uppercase font-medium">{ord.payment_method}</td>
                                  <td className="p-3 text-right">₹{ord.subtotal.toFixed(2)}</td>
                                  <td className="p-3 text-right">₹{ord.tax.toFixed(2)}</td>
                                  <td className="p-3 text-right font-black text-slate-100">₹{ord.total.toFixed(2)}</td>
                                  <td className="p-3 text-slate-400">{format(new Date(ord.created_at), 'dd MMM yyyy HH:mm')}</td>
                                  <td className="p-3 text-center">
                                    <Badge className="text-[10px] bg-slate-900 border border-slate-800 capitalize">{ord.status}</Badge>
                                  </td>
                                </tr>
                              ))}

                              {explorerData.orders.length === 0 && (
                                <tr>
                                  <td colSpan={9} className="text-center py-6 text-slate-500">No sales transactions found for this store</td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </TabsContent>

                      {/* EXPLORER TAB: PRODUCTS */}
                      <TabsContent value="products" className="mt-4">
                        <div className="overflow-x-auto border border-slate-850 rounded-xl bg-slate-950">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="border-b border-slate-800 bg-slate-900/50 text-slate-400 font-bold">
                                <th className="p-3">Product ID</th>
                                <th className="p-3">Name</th>
                                <th className="p-3">Category</th>
                                <th className="p-3 text-right">Selling Price</th>
                                <th className="p-3 text-center">In-Stock Qty</th>
                                <th className="p-3 text-center">Billing Availability</th>
                              </tr>
                            </thead>
                            <tbody>
                              {explorerData.menuItems.map((item) => (
                                <tr key={item.id} className="border-b border-slate-850 hover:bg-slate-900/30">
                                  <td className="p-3 font-mono text-[10px] text-slate-500">{item.id}</td>
                                  <td className="p-3 font-bold text-slate-200">{item.name}</td>
                                  <td className="p-3">
                                    <Badge variant="outline" className="border-slate-800 bg-slate-900 text-slate-300 capitalize">{item.category}</Badge>
                                  </td>
                                  <td className="p-3 text-right font-bold text-slate-200">₹{item.price.toFixed(2)}</td>
                                  <td className="p-3 text-center text-slate-300 font-medium">{item.stock ?? 'N/A'}</td>
                                  <td className="p-3 text-center">
                                    <Badge className={`text-[10px] ${item.is_available ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                                      {item.is_available ? 'Available' : 'Disabled'}
                                    </Badge>
                                  </td>
                                </tr>
                              ))}

                              {explorerData.menuItems.length === 0 && (
                                <tr>
                                  <td colSpan={6} className="text-center py-6 text-slate-500">No products/menu items added yet</td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </TabsContent>

                      {/* EXPLORER TAB: INVENTORY */}
                      <TabsContent value="inventory" className="mt-4">
                        <div className="overflow-x-auto border border-slate-850 rounded-xl bg-slate-950">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="border-b border-slate-800 bg-slate-900/50 text-slate-400 font-bold">
                                <th className="p-3">Inventory ID</th>
                                <th className="p-3">Material Name</th>
                                <th className="p-3">SKU</th>
                                <th className="p-3 text-right">Current Stock</th>
                                <th className="p-3 text-right">Min Stock Limit</th>
                                <th className="p-3">Unit</th>
                                <th className="p-3 text-center">Stock status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {explorerData.inventory.map((inv) => {
                                const isLow = (inv.current_stock || 0) <= (inv.min_stock || 0);
                                return (
                                  <tr key={inv.id} className="border-b border-slate-850 hover:bg-slate-900/30">
                                    <td className="p-3 font-mono text-[10px] text-slate-500">{inv.id}</td>
                                    <td className="p-3 font-bold text-slate-200">{inv.name}</td>
                                    <td className="p-3 font-mono text-slate-400">{inv.sku || 'N/A'}</td>
                                    <td className="p-3 text-right font-black text-slate-200">{inv.current_stock || 0}</td>
                                    <td className="p-3 text-right text-slate-400">{inv.min_stock || 0}</td>
                                    <td className="p-3 text-slate-300 font-medium">{inv.unit || 'units'}</td>
                                    <td className="p-3 text-center">
                                      <Badge className={`text-[10px] ${isLow ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400'}`}>
                                        {isLow ? 'Low Stock' : 'Healthy'}
                                      </Badge>
                                    </td>
                                  </tr>
                                );
                              })}

                              {explorerData.inventory.length === 0 && (
                                <tr>
                                  <td colSpan={7} className="text-center py-6 text-slate-500">No raw materials or inventory components recorded</td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </TabsContent>

                      {/* EXPLORER TAB: CREDIT LEDGER */}
                      <TabsContent value="credits" className="mt-4">
                        <div className="overflow-x-auto border border-slate-850 rounded-xl bg-slate-950">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="border-b border-slate-800 bg-slate-900/50 text-slate-400 font-bold">
                                <th className="p-3">Customer Name</th>
                                <th className="p-3">Mobile Contact</th>
                                <th className="p-3 text-right">Total Borrowed</th>
                                <th className="p-3 text-right">Total Paid</th>
                                <th className="p-3 text-right">Total Due</th>
                                <th className="p-3 text-center">Payment Status</th>
                                <th className="p-3">Latest Activity</th>
                              </tr>
                            </thead>
                            <tbody>
                              {explorerData.credits.map((cred) => (
                                <tr key={cred.id} className="border-b border-slate-850 hover:bg-slate-900/30">
                                  <td className="p-3 font-bold text-slate-200">{cred.customer_name}</td>
                                  <td className="p-3 text-slate-400">{cred.customer_phone || 'N/A'}</td>
                                  <td className="p-3 text-right text-slate-300">₹{cred.total_amount.toFixed(2)}</td>
                                  <td className="p-3 text-right text-emerald-400 font-medium">₹{cred.paid_amount.toFixed(2)}</td>
                                  <td className="p-3 text-right text-rose-400 font-bold">₹{cred.due_amount.toFixed(2)}</td>
                                  <td className="p-3 text-center">
                                    <Badge className={`text-[10px] ${cred.payment_status === 'paid' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                                      {cred.payment_status}
                                    </Badge>
                                  </td>
                                  <td className="p-3 text-slate-400">
                                    {format(new Date(cred.updated_at), 'dd MMM yyyy')}
                                  </td>
                                </tr>
                              ))}

                              {explorerData.credits.length === 0 && (
                                <tr>
                                  <td colSpan={7} className="text-center py-6 text-slate-500">No customer credit records registered</td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </TabsContent>

                      {/* EXPLORER TAB: EXPENSES */}
                      <TabsContent value="expenses" className="mt-4">
                        <div className="overflow-x-auto border border-slate-850 rounded-xl bg-slate-950">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="border-b border-slate-800 bg-slate-900/50 text-slate-400 font-bold">
                                <th className="p-3">Expense ID</th>
                                <th className="p-3">Category</th>
                                <th className="p-3">Description</th>
                                <th className="p-3 text-right">Amount</th>
                                <th className="p-3">Paid By</th>
                                <th className="p-3">Date</th>
                              </tr>
                            </thead>
                            <tbody>
                              {explorerData.expenses.map((exp) => (
                                <tr key={exp.id} className="border-b border-slate-850 hover:bg-slate-900/30">
                                  <td className="p-3 font-mono text-[10px] text-slate-500">{exp.id}</td>
                                  <td className="p-3">
                                    <Badge variant="outline" className="border-slate-800 bg-slate-900 text-slate-300 capitalize">{exp.category}</Badge>
                                  </td>
                                  <td className="p-3 text-slate-200">{exp.description || 'N/A'}</td>
                                  <td className="p-3 text-right font-bold text-rose-400">₹{exp.amount.toFixed(2)}</td>
                                  <td className="p-3 text-slate-300">{exp.paid_by || 'Unknown'}</td>
                                  <td className="p-3 text-slate-400">
                                    {format(new Date(exp.date), 'dd MMM yyyy')}
                                  </td>
                                </tr>
                              ))}

                              {explorerData.expenses.length === 0 && (
                                <tr>
                                  <td colSpan={6} className="text-center py-6 text-slate-500">No expense records found for this store</td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </TabsContent>

                      {/* EXPLORER TAB: WHATSAPP */}
                      <TabsContent value="whatsapp" className="mt-4">
                        {explorerData.whatsapp ? (
                          <Card className="bg-slate-950 border-slate-850 p-6 space-y-4 max-w-xl mx-auto rounded-2xl">
                            <div className="flex items-center justify-between">
                              <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-green-400 animate-pulse" />
                                WhatsApp Gateway Active
                              </h3>
                              <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                Verified Connection
                              </Badge>
                            </div>
                            <div className="space-y-3 pt-2 text-sm text-slate-300">
                              <div className="flex justify-between border-b border-slate-850 pb-2">
                                <span className="text-slate-400">Connected Phone Number:</span>
                                <strong className="text-slate-200">{explorerData.whatsapp.whatsapp_number}</strong>
                              </div>
                              <div className="flex justify-between border-b border-slate-850 pb-2">
                                <span className="text-slate-400">API Instance ID:</span>
                                <code className="text-xs bg-slate-900 px-2 py-0.5 rounded font-mono text-violet-300">{explorerData.whatsapp.instance_id}</code>
                              </div>
                              <div className="flex justify-between pb-1">
                                <span className="text-slate-400">API Key token:</span>
                                <code className="text-xs bg-slate-900 px-2 py-0.5 rounded font-mono text-violet-300">{explorerData.whatsapp.api_key}</code>
                              </div>
                            </div>
                          </Card>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-12 text-slate-500 border border-dashed border-slate-850 rounded-xl bg-slate-950/40">
                            <Sparkles className="w-10 h-10 mb-3 opacity-20 text-green-400" />
                            <p className="text-xs font-semibold">WhatsApp notifications configuration not registered for this outlet</p>
                          </div>
                        )}
                      </TabsContent>
                    </Tabs>
                  </div>
                )}

              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 6: SECURITY AUDIT LOGS */}
          <TabsContent value="audit_logs" className="mt-6 space-y-6">
            <Card className="bg-slate-900 border-slate-800 shadow-xl overflow-hidden rounded-2xl">
              <CardHeader className="border-b border-slate-850">
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-violet-400" />
                  Security & Hierarchy Audit Logs
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Real-time database-level logging of creations, updates, deletions, and verification queue decisions
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                
                {/* Search Log filter */}
                <div className="relative max-w-md">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input
                    placeholder="Search logs by action, table, user, or record ID..."
                    value={logSearchQuery}
                    onChange={(e) => setLogSearchQuery(e.target.value)}
                    className="pl-10 bg-slate-950 border-slate-850 text-slate-100 placeholder-slate-500 rounded-xl"
                  />
                </div>

                <div className="overflow-x-auto border border-slate-850 rounded-xl bg-slate-950">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-900/50 text-slate-400 font-bold uppercase tracking-wider">
                        <th className="p-4">Log ID</th>
                        <th className="p-4">Action Type</th>
                        <th className="p-4">Target Table</th>
                        <th className="p-4">Record Reference</th>
                        <th className="p-4">Timestamp</th>
                        <th className="p-4">Trigger User (Actor)</th>
                        <th className="p-4">Context Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLogs.map((log) => {
                        const isDelete = log.action.includes('delete');
                        const isCreate = log.action.includes('create');
                        const isVerify = log.action.includes('verification');

                        return (
                          <tr key={log.id} className="border-b border-slate-850 hover:bg-slate-900/30">
                            <td className="p-4 font-mono text-[10px] text-slate-500">{log.id}</td>
                            <td className="p-4">
                              <Badge 
                                className={`capitalize text-[10px] font-bold ${
                                  isDelete 
                                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                                    : isCreate 
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                    : isVerify
                                    ? 'bg-violet-500/10 text-violet-400 border border-violet-500/20 font-black'
                                    : 'bg-indigo-950 text-indigo-300 border border-indigo-500/10'
                                }`}
                              >
                                {log.action.replace('_', ' ')}
                              </Badge>
                            </td>
                            <td className="p-4 font-mono text-slate-400">{log.table_name || 'N/A'}</td>
                            {/* RECORD REFERENCE */}
                            <td className="p-4">
                              {log.record_id ? (
                                <div className="flex items-center gap-1 font-mono text-[10px] text-slate-400 bg-slate-900 p-1.5 rounded border border-slate-850 justify-between max-w-[130px]">
                                  <span className="truncate">{log.record_id}</span>
                                  <Button 
                                    size="icon" 
                                    variant="ghost" 
                                    className="w-4 h-4 text-slate-600 hover:text-slate-300"
                                    onClick={() => copyToClipboard(log.record_id, 'Record ID')}
                                  >
                                    <Copy className="w-2.5 h-2.5" />
                                  </Button>
                                </div>
                              ) : (
                                <span className="text-slate-600 font-mono">NULL</span>
                              )}
                            </td>
                            <td className="p-4 text-slate-400">
                              {log.created_at ? format(new Date(log.created_at), 'dd MMM yyyy HH:mm:ss') : 'N/A'}
                            </td>
                            <td className="p-4">
                              <p className="font-semibold text-slate-200">{log.user_name}</p>
                              <p className="text-[10px] text-slate-500">{log.user_email}</p>
                            </td>
                            <td className="p-4 text-slate-400 max-w-[200px] truncate leading-relaxed">
                              {log.new_data ? JSON.stringify(log.new_data) : log.old_data ? JSON.stringify(log.old_data) : 'N/A'}
                            </td>
                          </tr>
                        );
                      })}

                      {filteredLogs.length === 0 && (
                        <tr>
                          <td colSpan={7} className="text-center py-8 text-slate-500">No security audit logs found</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 7: PLANS & FEATURES */}
          <TabsContent value="plans" className="mt-6">
            <AdminPlanManagement />
          </TabsContent>

          {/* TAB 8: CUSTOMER SETTINGS */}
          <TabsContent value="settings" className="mt-6">
            <AdminCustomerManagement />
          </TabsContent>
        </Tabs>
      </main>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="max-w-md bg-slate-900 border-slate-800 text-slate-100 rounded-2xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-500 font-black">
              <ShieldAlert className="w-6 h-6 text-rose-500 animate-bounce" />
              Confirm Permanent Owner Deletion
            </DialogTitle>
          </DialogHeader>
          {deleteCustomerData && (
            <div className="space-y-4 pt-2">
              <div className="p-3.5 bg-rose-500/10 text-rose-300 rounded-xl text-sm border border-rose-500/20 leading-relaxed">
                <p className="font-extrabold mb-1 uppercase tracking-wider flex items-center gap-1 text-xs">
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                  WARNING: Cascade Delete
                </p>
                <p>
                  Deleting this owner will permanently delete all connected stores, staff, products, reports, orders, customers and credit ledger logs. This action is irreversible.
                </p>
              </div>

              {connectedCounts === null ? (
                <div className="flex items-center justify-center py-6 text-sm text-slate-400 gap-2">
                  <div className="animate-spin w-4 h-4 border-2 border-violet-500 border-t-transparent rounded-full" />
                  Calculating total connected records to be deleted...
                </div>
              ) : (
                <div className="p-3.5 bg-slate-950 rounded-xl space-y-2.5 text-xs border border-slate-850">
                  <p className="font-bold text-[10px] text-slate-400 uppercase tracking-widest">Cascade Report Summary:</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] font-mono text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Stores:</span>
                      <span className="font-bold text-white">{connectedCounts.stores}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Staff Accounts:</span>
                      <span className="font-bold text-white">{connectedCounts.staff}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Products:</span>
                      <span className="font-bold text-white">{connectedCounts.products}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Orders & Bills:</span>
                      <span className="font-bold text-white">{connectedCounts.orders}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Customers:</span>
                      <span className="font-bold text-white">{connectedCounts.customers}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Expenses:</span>
                      <span className="font-bold text-white">{connectedCounts.expenses}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Credits/Ledger:</span>
                      <span className="font-bold text-white">{connectedCounts.credits}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-800 pt-1.5 font-bold text-rose-400 col-span-2 text-xs">
                      <span>Total Cascade Records:</span>
                      <span>{connectedCounts.total}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="confirm-pass" className="text-slate-350 text-xs">Admin Password Authentication</Label>
                <Input
                  id="confirm-pass"
                  type="password"
                  placeholder="Enter admin password to confirm deletion"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="rounded-xl bg-slate-950 border-slate-800 text-slate-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-850">
                <Button variant="outline" className="rounded-xl border-slate-800 bg-slate-900/60 hover:bg-slate-800" onClick={() => setShowDeleteConfirm(false)} disabled={isDeleting || verifyingPassword}>
                  Cancel
                </Button>
                <Button 
                  className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-lg"
                  onClick={handleConfirmDelete}
                  disabled={isDeleting || verifyingPassword || connectedCounts === null}
                >
                  {verifyingPassword ? 'Verifying Admin...' : isDeleting ? 'Cascading Delete...' : 'Permanently Delete Owner'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Aadhaar Scan Fullscreen Preview Modal */}
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-3xl bg-slate-950 border-slate-900 p-2 rounded-2xl flex items-center justify-center overflow-hidden">
          {previewImage && (
            <img src={previewImage} alt="Fullscreen Preview" className="max-h-[85vh] max-w-full object-contain rounded-xl" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboardPage;
