import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LogIn, UserPlus } from 'lucide-react';
import { useLocale } from '@/contexts/LocaleContext';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import MAXORAIcon from '@/assets/maxora-icon.jpg';
import maxoraLogo from '@/assets/maxora-logo.png';
import { MaxoraLogo } from '@/components/ui/MaxoraLogo';

const WelcomePage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLocale();
  const { isAuthenticated, userRole } = useSupabaseAuth();

  useEffect(() => {
    if (isAuthenticated && userRole) {
      const lastPath = localStorage.getItem('pos_last_path');
      if (userRole.role !== 'admin' && lastPath && lastPath.startsWith('/') && !lastPath.startsWith('//') && lastPath !== '/' && lastPath !== '/auth' && lastPath !== '/reset-password') {
        try {
          navigate(lastPath, { replace: true });
        } catch (e) {
          console.error('Navigation error:', e);
          navigate('/dashboard', { replace: true });
        }
      } else {
        switch (userRole.role) {
          case 'admin':
            navigate('/admin-dashboard', { replace: true });
            break;
          case 'owner':
            navigate('/dashboard', { replace: true });
            break;
          case 'store_manager':
            navigate('/pos', { replace: true });
            break;
          case 'staff':
            navigate('/staff-dashboard', { replace: true });
            break;
        }
      }
    }
  }, [isAuthenticated, userRole, navigate]);

  return (
    <div className="min-h-screen min-h-[100dvh] bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm text-center">
        {/* Logo */}
        <div className="mb-10 text-center flex flex-col items-center">
          <div className="w-24 h-24 rounded-3xl overflow-hidden mx-auto mb-6 shadow-xl ring-2 ring-primary/20">
            <img src={MAXORAIcon} alt="MAXORA Icon" className="w-full h-full object-cover" />
          </div>
          <MaxoraLogo size="xl" />
        </div>

        {/* Single Login Button */}
        <div className="space-y-3">
          <Button
            onClick={() => navigate('/auth')}
            className="w-full h-14 text-lg rounded-2xl gap-3 shadow-lg shadow-primary/20"
          >
            <LogIn className="w-5 h-5" />
            {t('auth.login')}
          </Button>

          <Button
            variant="outline"
            onClick={() => navigate('/auth?signup=true')}
            className="w-full h-12 rounded-2xl gap-2"
          >
            <UserPlus className="w-5 h-5" />
            {t('auth.createAccount')}
          </Button>
        </div>

        {/* Footer */}
        <p className="mt-10 text-xs text-muted-foreground">
          Email + Password se login karein — role auto-detect hoga
        </p>
      </div>
    </div>
  );
};

export default WelcomePage;
