import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  isEmployee: boolean;
  profile: any | null;
  refreshProfile: () => Promise<void>;
  syncUser: (role?: string, profileData?: { displayName?: string; phone?: string; address?: string }) => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAdmin: false,
  isEmployee: false,
  profile: null,
  refreshProfile: async () => { },
  syncUser: async () => null
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isEmployee, setIsEmployee] = useState(false);
  const [profile, setProfile] = useState<any | null>(null);

  const fetchProfile = useCallback(async (uid: string) => {
    try {
      const res = await fetch(`/api/employees/${uid}`);
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  }, []);

  const syncUser = useCallback(async (role?: string, profileData?: { displayName?: string; phone?: string; address?: string }): Promise<string | null> => {
    const currentUser = auth.currentUser;
    if (!currentUser) return null;

    try {
      const idToken = await currentUser.getIdToken();
      const res = await fetch('/api/users/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({
          id: currentUser.uid,
          email: currentUser.email,
          displayName: profileData?.displayName?.trim() || currentUser.displayName?.trim() || null,
          role: role,
          phone: profileData?.phone,
          address: profileData?.address
        })
      });

      if (res.ok) {
        const { user: dbUser } = await res.json();
        const isSystemAdmin = dbUser.role === 'admin';
        setIsAdmin(isSystemAdmin);
        setIsEmployee(dbUser.role === 'employee' && !isSystemAdmin);

        if (dbUser.role === 'employee' && !isSystemAdmin) {
          await fetchProfile(currentUser.uid);
        } else {
          setProfile(null);
        }
        return dbUser.role;
      }
    } catch (err) {
      console.error('Sync error:', err);
    }
    return null;
  }, [fetchProfile]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        setUser(firebaseUser);
        await syncUser();
      } else {
        setUser(null);
        setIsAdmin(false);
        setIsEmployee(false);
        setProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [syncUser]);

  const refreshProfile = useCallback(async () => {
    if (user) await fetchProfile(user.uid);
  }, [user, fetchProfile]);

  const value = useMemo(() => ({
    user,
    loading,
    isAdmin,
    isEmployee,
    profile,
    refreshProfile,
    syncUser
  }), [user, loading, isAdmin, isEmployee, profile, refreshProfile, syncUser]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
