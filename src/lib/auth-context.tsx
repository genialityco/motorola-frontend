'use client';

import { createContext, useContext } from 'react';
import { User } from 'firebase/auth';

interface AuthContextValue {
  user: User | null;
  userRole: string | null;
  refreshRole: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  userRole: null,
  refreshRole: async () => {},
});

export const useAuth = () => useContext(AuthContext);
