'use client';

import { useFormStatus } from 'react-dom';
import { cn } from '@/_core/utils/utils';
import { handleLogout } from '../core/auth.actions';
import { authBtn } from './constants';
import { useWalletOptional } from '@/features/users_dashboard/wizard/components/WalletProvider';
import { sweepSessionQuietly } from '@/features/users_dashboard/wizard/_core/session.wallet';

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(authBtn.ghost, 'border border-white/10', pending && 'cursor-wait opacity-60')}
    >
      {pending ? 'Logging out…' : 'Logout'}
    </button>
  );
}

export default function LogoutButton() {
  const wallet = useWalletOptional();

  const onLogoutAction = async () => {
    // new line add Return the quick-pay balance to the wallet before the session ends.
    await sweepSessionQuietly();
    await wallet?.disconnect();

    try {
      localStorage.removeItem('wizardconnect-session');
    } catch {
    }

    await handleLogout();
  };

  return (
    <form action={onLogoutAction}>
      <SubmitButton />
    </form>
  );
}