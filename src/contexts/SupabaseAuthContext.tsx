import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export type UserRole = 'admin' | 'owner' | 'store_manager' | 'staff';

export interface UserRoleData {
  id: string;
  user_id: string;
  role: UserRole;
  customer_id: string | null;
  store_id: string | null;
  staff_code?: string | null;
  ref_code?: string | null;
  pin: string | null;
  is_active: boolean;
}

export interface CustomerData {
  id: string;
  business_name: string;
  owner_name: string;
  subscription_plan: string;
  subscription_tier: string;
  subscription_end: string;
  is_active: boolean;
  max_stores: number;
}

export interface StoreData {
  id: string;
  customer_id: string;
  store_name: string;
  address: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userRole: UserRoleData | null;
  customer: CustomerData | null;
  store: StoreData | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ error: string | null }>;
  signup: (email: string, password: string, fullName: string) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  hasRole: (roles: UserRole[]) => boolean;
  isAdmin: () => boolean;
  isOwner: () => boolean;
  isStoreManager: () => boolean;
  isStaff: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const SupabaseAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<UserRoleData | null>(null);
  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [store, setStore] = useState<StoreData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const clearRoleState = useCallback(() => {
    setUserRole(null);
    setCustomer(null);
    setStore(null);
  }, []);

  const clearLegacyLoginState = useCallback(() => {
    localStorage.removeItem('logged_in_staff');
    localStorage.removeItem('store_login');
    localStorage.removeItem('pos_store_session');
    localStorage.removeItem('pos_store_login_data');
    localStorage.removeItem('pos_active_store');
    localStorage.removeItem('pos_is_store_login');
    localStorage.removeItem('pos_store_code');
    localStorage.removeItem('pos_staff_session');
    localStorage.removeItem('pos_active_staff');
    localStorage.removeItem('pos_active_store_data');
  }, []);

  const fetchUserData = useCallback(async (userId: string, authUser?: User | null): Promise<UserRoleData | null> => {
    try {
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();

      if (roleError) {
        console.error('Error fetching user role:', {
          message: roleError.message || 'Unknown error',
          details: roleError.details || '',
          hint: roleError.hint || '',
          code: roleError.code || ''
        });
        clearRoleState();
        return null;
      }

      if (roleData) {
        const roleRecord = roleData as unknown as UserRoleData;
        setUserRole(roleRecord);

        const { data: profileData } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', userId)
          .maybeSingle();

        if (roleRecord.customer_id) {
          const { data: customerData, error: customerError } = await supabase
            .from('customers')
            .select('*')
            .eq('id', roleRecord.customer_id)
            .maybeSingle();
          
          if (!customerError && customerData) {
            setCustomer(customerData as unknown as CustomerData);
          } else {
            setCustomer(null);
          }
        } else {
          setCustomer(null);
        }

        if (roleRecord.store_id) {
          const { data: storeData, error: storeError } = await supabase
            .from('stores')
            .select('id, customer_id, store_name, address, phone, store_code, latitude, longitude, is_active, created_at, updated_at')
            .eq('id', roleRecord.store_id)
            .maybeSingle();
          
          if (!storeError && storeData) {
            setStore(storeData as unknown as StoreData);
            if (roleRecord.role === 'store_manager' || roleRecord.role === 'staff') {
              localStorage.setItem('pos_active_store_data', JSON.stringify({
                id: storeData.id,
                storeId: storeData.id,
                storeName: storeData.store_name,
                storeAddress: storeData.address,
                storePhone: storeData.phone,
                customerId: storeData.customer_id,
                storeCode: (storeData as any).store_code || null,
              }));
            }

            if (roleRecord.role === 'staff') {
              localStorage.setItem('pos_staff_session', JSON.stringify({
                id: userId,
                user_id: userId,
                name: profileData?.full_name || authUser?.user_metadata?.full_name || authUser?.email || 'Staff',
                email: profileData?.email || authUser?.email || null,
                role: roleRecord.role,
                store_id: storeData.id,
                customer_id: storeData.customer_id,
                staff_code: roleRecord.staff_code || null,
              }));
            } else {
              localStorage.removeItem('pos_staff_session');
            }
          } else {
            setStore(null);
            localStorage.removeItem('pos_active_store_data');
            localStorage.removeItem('pos_staff_session');
          }
        } else {
          setStore(null);
          localStorage.removeItem('pos_active_store_data');
          localStorage.removeItem('pos_staff_session');
        }

        return roleRecord;
      } else {
        clearRoleState();
        return null;
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error in fetchUserData:', errorMessage);
      clearRoleState();
      return null;
    }
  }, [clearRoleState]);

  useEffect(() => {
    let isMounted = true;

    const applySession = (nextSession: Session | null) => {
      if (!isMounted) return;

      setSession(nextSession);
      setUser(nextSession?.user ?? null);

      if (!nextSession?.user) {
        clearRoleState();
        setIsLoading(false);
        return;
      }

      window.setTimeout(() => {
        void fetchUserData(nextSession.user.id, nextSession.user).finally(() => {
          if (isMounted) {
            setIsLoading(false);
          }
        });
      }, 0);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        applySession(nextSession);
      }
    );

    void supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        // Do NOT force sign-out on transient refresh errors — keep user logged in.
        // Supabase client will retry token refresh automatically.
        console.warn('[Auth] getSession warning (keeping session):', error.message);
      }
      applySession(session);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [clearRoleState, fetchUserData]);

  const login = async (email: string, password: string): Promise<{ error: string | null }> => {
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const normalizedPassword = password.trim();

      clearLegacyLoginState();

      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password: normalizedPassword,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          return { error: 'Invalid email or password. Please try again.' };
        }
        return { error: error.message };
      }

      if (!authData.user) {
        return { error: 'Login failed. Please try again.' };
      }

      const roleRecord = await fetchUserData(authData.user.id, authData.user);

      if (!roleRecord) {
        const { data: customerData } = await supabase
          .from('customers')
          .select('approval_status')
          .eq('owner_email', normalizedEmail)
          .maybeSingle();

        await supabase.auth.signOut();

        if (customerData?.approval_status === 'pending') {
          return { error: 'Your account is pending admin approval.' };
        }

        return { error: 'No active account found for this email. Please contact admin.' };
      }

      if ((roleRecord.role === 'store_manager' || roleRecord.role === 'staff') && !roleRecord.store_id) {
        await supabase.auth.signOut();
        clearRoleState();
        return { error: 'This account is not linked to any store.' };
      }

      return { error: null };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred';
      return { error: message || 'An unexpected error occurred' };
    }
  };

  const signup = async (email: string, password: string, fullName: string): Promise<{ error: string | null }> => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName,
          }
        }
      });

      if (error) {
        if (error.message.includes('already registered')) {
          return { error: 'This email is already registered. Please login instead.' };
        }
        return { error: error.message };
      }

      return { error: null };
    } catch (error: any) {
      return { error: error.message || 'An unexpected error occurred' };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    clearLegacyLoginState();
    clearRoleState();
  };

  const resetPassword = async (email: string): Promise<{ error: string | null }> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        return { error: error.message };
      }

      return { error: null };
    } catch (error: any) {
      return { error: error.message || 'An unexpected error occurred' };
    }
  };

  const hasRole = (roles: UserRole[]): boolean => {
    if (!userRole) return false;
    return roles.includes(userRole.role);
  };

  const isAdmin = () => hasRole(['admin']);
  const isOwner = () => hasRole(['owner']);
  const isStoreManager = () => hasRole(['store_manager']);
  const isStaff = () => hasRole(['staff']);

  return (
    <AuthContext.Provider value={{
      user,
      session,
      userRole,
      customer,
      store,
      isLoading,
      isAuthenticated: !!user && !!session,
      login,
      signup,
      logout,
      resetPassword,
      hasRole,
      isAdmin,
      isOwner,
      isStoreManager,
      isStaff,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useSupabaseAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useSupabaseAuth must be used within a SupabaseAuthProvider');
  }
  return context;
};
