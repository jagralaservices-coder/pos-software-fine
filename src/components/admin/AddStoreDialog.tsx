import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useOTP } from '@/hooks/useOTP';

export default function AddStoreDialog({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<'form' | 'otp' | 'success'>('form');
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();
  const { signup, isSuperAdmin } = useSupabaseAuth();
  const { sendOTP, verifyOTP, isLoading, countdown, resetOTPState } = useOTP();

  const [formData, setFormData] = useState({
    storeName: '',
    ownerEmail: '',
    phone: '',
    password: '',
  });

  const [otp, setOtp] = useState('');

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.storeName || !formData.ownerEmail || !formData.phone || !formData.password) {
      toast({ title: 'Validation Error', description: 'Please fill all required fields.', variant: 'destructive' });
      return;
    }

    // Basic owner existence check before sending SMS to avoid waste
    setIsCreating(true);
    try {
      const { data: owner } = await supabase.from('customers').select('id').eq('owner_email', formData.ownerEmail).maybeSingle();
      if (!owner) {
        toast({ title: 'Owner Not Found', description: 'No merchant found with this email.', variant: 'destructive' });
        setIsCreating(false);
        return;
      }
    } catch (e) {
      // ignore
    }
    setIsCreating(false);

    const success = await sendOTP(formData.phone);
    if (success) {
      setStep('otp');
    }
  };

  const handleVerifyOTPAndCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) return;

    const isVerified = await verifyOTP(formData.phone, otp);
    if (!isVerified) return;

    setIsCreating(true);
    try {
      const { data: owner } = await supabase.from('customers').select('id').eq('owner_email', formData.ownerEmail).maybeSingle();
      if (!owner) throw new Error('Owner not found');

      const storeEmail = `store_${formData.phone.replace('+91','')}@pos.local`;
      const { error: signupError } = await signup(storeEmail, formData.password, formData.storeName);
      if (signupError) throw new Error(signupError);

      const { error: storeError } = await supabase.from('stores').insert({
        customer_id: owner.id,
        store_name: formData.storeName,
        phone: formData.phone,
        password: formData.password,
        is_active: isSuperAdmin(),
      });
      if (storeError) throw new Error(storeError.message);

      setStep('success');
      toast({ title: 'Success', description: 'Store account created successfully!' });
      
      setTimeout(() => {
        setIsOpen(false);
        setStep('form');
        setFormData({ storeName: '', ownerEmail: '', phone: '', password: '' });
        setOtp('');
        resetOTPState();
      }, 2000);

    } catch (error: any) {
      toast({ title: 'Creation Failed', description: error.message, variant: 'destructive' });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Store</DialogTitle>
          <DialogDescription>
            Create a branch store for an existing merchant. An OTP will be sent to the store's mobile.
          </DialogDescription>
        </DialogHeader>

        {step === 'form' && (
          <form onSubmit={handleSendOTP} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Store Name *</Label>
              <Input required value={formData.storeName} onChange={e => setFormData({ ...formData, storeName: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Merchant Owner Email *</Label>
              <Input type="email" required value={formData.ownerEmail} onChange={e => setFormData({ ...formData, ownerEmail: e.target.value })} placeholder="owner@business.com" />
            </div>
            <div className="space-y-2">
              <Label>Store Mobile Number (10 digits) *</Label>
              <Input type="tel" pattern="[6-9][0-9]{9}" required value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="9876543210" />
            </div>
            <div className="space-y-2">
              <Label>Temporary Password *</Label>
              <Input type="password" required minLength={6} value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
            </div>
            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={isLoading || isCreating}>
                {isLoading || isCreating ? 'Sending OTP...' : 'Send OTP to Store'}
              </Button>
            </div>
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={handleVerifyOTPAndCreate} className="space-y-4 py-4 text-center">
            <p className="text-sm text-gray-500 mb-4">
              Please ask the store manager for the OTP sent to <strong>+91{formData.phone.replace('+91', '')}</strong>
            </p>
            <div className="space-y-2">
              <Label>Enter 6-digit OTP</Label>
              <Input type="text" value={otp} onChange={e => setOtp(e.target.value)} placeholder="------" maxLength={6} required className="text-center tracking-widest text-lg" />
            </div>
            <div className="flex flex-col gap-2 pt-4 items-center">
              <Button type="submit" disabled={isLoading || isCreating} className="w-full max-w-[250px]">
                {isLoading || isCreating ? 'Verifying...' : 'Verify & Create Store'}
              </Button>
              <div className="flex items-center gap-2 mt-2">
                <Button type="button" variant="ghost" onClick={() => setStep('form')} disabled={isLoading || isCreating}>Back</Button>
                <Button type="button" variant="link" disabled={countdown > 0 || isLoading || isCreating} onClick={() => sendOTP(formData.phone)}>
                  {countdown > 0 ? `Resend OTP in ${countdown}s` : 'Resend OTP'}
                </Button>
              </div>
            </div>
          </form>
        )}

        {step === 'success' && (
          <div className="py-8 text-center text-green-600">
            <h3 className="text-xl font-bold mb-2">Store Created!</h3>
            <p className="text-sm text-gray-500">The store is now linked to {formData.ownerEmail}.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
