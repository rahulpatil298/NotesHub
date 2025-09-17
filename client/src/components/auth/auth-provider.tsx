import { AuthProvider } from '@/hooks/use-auth';
import { ReactNode } from 'react';

interface AuthWrapperProps {
  children: ReactNode;
}

export function AuthWrapper({ children }: AuthWrapperProps) {
  return <AuthProvider>{children}</AuthProvider>;
}
