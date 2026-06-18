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

export default function AddMerchantDialog({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<'form' | 'otp' | 'success'>('form');
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();
  const { signup, isSuperAdmin } = useSupabaseAuth();
  const { sendOTP, verifyOTP, isLoading, isSent, countdown, resetOTPState, verifiedToken } = useOTP();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    businessName: '',
    businessType: 'retail',
    phone: '',
    password: '',
    plan: 'basic',
  });

  const [otp, setOtp] = useState('');

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email || !formData.businessName || !formData.phone || !formData.password) {
      toast({ title: 'Validation Error', description: 'Please fill all required fields.', variant: 'destructive' });
      return;
    }

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

    // Proceed with account creation
    setIsCreating(true);
    try {
      const { error: signupError } = await signup(formData.email, formData.password, formData.fullName);
      if (signupError) throw new Error(signupError);

      await new Promise(resolve => setTimeout(resolve, 500));

      const { error: customerError } = await supabase.from('customers').insert({
        owner_email: formData.email,
        owner_name: formData.fullName,
        business_name: formData.businessName,
        phone: formData.phone,
        subscription_plan: formData.plan,
        business_type: formData.businessType,
        approval_status: isSuperAdmin() ? 'approved' : 'pending',
        is_active: true,
        phone_verified: true, // Marked as verified
      });

      if (customerError) throw new Error(customerError.message);

      setStep('success');
      toast({ title: 'Success', description: 'Merchant account created successfully!' });
      
      // Auto close after 2s
      setTimeout(() => {
        setIsOpen(false);
        setStep('form');
        setFormData({ fullName: '', email: '', businessName: '', businessType: 'retail', phone: '', password: '', plan: 'basic' });
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Merchant</DialogTitle>
          <DialogDescription>
            Create a new owner/merchant account. A real OTP will be sent to their mobile for verification.
          </DialogDescription>
        </DialogHeader>

        {step === 'form' && (
          <form onSubmit={handleSendOTP} className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Full Name *</Label>
                <Input required value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input type="email" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Business Name *</Label>
                <Input required value={formData.businessName} onChange={e => setFormData({ ...formData, businessName: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Business Type *</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={formData.businessType} onChange={e => setFormData({ ...formData, businessType: e.target.value })}>
                  <option value="retail">Retail</option>
                  <option value="restaurant">Restaurant</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Mobile Number (10 digits) *</Label>
                <Input type="tel" pattern="[6-9][0-9]{9}" required value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="9876543210" />
              </div>
              <div className="space-y-2">
                <Label>Temporary Password *</Label>
                <Input type="password" required minLength={6} value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Subscription Plan *</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={formData.plan} onChange={e => setFormData({ ...formData, plan: e.target.value })}>
                  <option value="basic">Basic (₹999/mo)</option>
                  <option value="gold">Gold (₹2499/mo)</option>
                  <option value="platinum">Platinum (₹4999/mo)</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Sending OTP...' : 'Send OTP to Merchant'}
              </Button>
            </div>
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={handleVerifyOTPAndCreate} className="space-y-4 py-4 text-center">
            <p className="text-sm text-gray-500 mb-4">
              Please ask the merchant for the OTP sent to <strong>+91{formData.phone.replace('+91', '')}</strong>
            </p>
            <div className="space-y-2 text-left max-w-[250px] mx-auto">
              <Label>Enter 6-digit OTP</Label>
              <Input type="text" value={otp} onChange={e => setOtp(e.target.value)} placeholder="------" maxLength={6} required className="text-center tracking-widest text-lg" />
            </div>
            <div className="flex flex-col gap-2 pt-4 items-center">
              <Button type="submit" disabled={isLoading || isCreating} className="w-full max-w-[250px]">
                {isLoading || isCreating ? 'Verifying...' : 'Verify & Create Account'}
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
            <h3 className="text-xl font-bold mb-2">Merchant Created!</h3>
            <p className="text-sm text-gray-500">The account has been set up with the {formData.plan} plan.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
