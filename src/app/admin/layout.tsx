'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { AuthContext } from '@/lib/auth-context';
import { LoginScreen } from './_components/LoginScreen';
import { AdminShell } from './_components/AdminShell';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loadingInitial, setLoadingInitial] = useState(true);

  const readUserRole = async (currentUser: User) => {
    const result = await currentUser.getIdTokenResult(true);
    setUserRole((result.claims.role as string) ?? null);
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        readUserRole(currentUser).finally(() => setLoadingInitial(false));
      } else {
        setUserRole(null);
        setLoadingInitial(false);
      }
    });
    return () => unsub();
  }, []);

  if (loadingInitial) return null;
  if (!user) return <LoginScreen />;

  return (
    <AuthContext.Provider value={{ user, userRole, refreshRole: () => readUserRole(user) }}>
      <AdminShell
        user={user}
        userRole={userRole}
        onRoleRefresh={() => readUserRole(user)}
      >
        {children}
      </AdminShell>
    </AuthContext.Provider>
  );
}
