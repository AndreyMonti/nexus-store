import React, { createContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import { retrySupabaseQuery, parseSupabaseError } from '../services/retryUtils';

export type UserType = 'buyer' | 'seller';

export interface User {
  id: string;
  email: string;
  name: string;
  userType: UserType;
  photoUrl?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, userType: UserType) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (name: string, photoUrl?: string) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase não está configurado. Verifique suas variáveis de ambiente.');
    }

    try {
      // Sign in with Supabase Auth
      const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError || !authData.user?.id) {
        const message = signInError?.message || 'Erro ao autenticar';
        throw new Error(message);
      }

      // Fetch user profile from public.users table
      const { data, error } = await retrySupabaseQuery(
        () => supabase
          .from('users')
          .select('*')
          .eq('id', authData.user.id)
          .single()
      );

      if (error || !data) {
        const errMsg = parseSupabaseError(error);
        throw new Error(errMsg);
      }

      const userData: User = {
        id: data.id,
        email: data.email,
        name: data.name,
        userType: data.user_type,
        photoUrl: data.photo_url,
      };

      await AsyncStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
    } catch (error) {
      const message = (error as any)?.message || 'Erro ao fazer login';
      console.error('[Login] Error:', error);
      throw new Error(message);
    }
  };

  const register = async (email: string, password: string, name: string, userType: UserType) => {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase não está configurado. Verifique suas variáveis de ambiente.');
    }

    try {
      // First, sign up user in Supabase Auth
      const { data: authData, error: signupError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signupError) {
        const msg = signupError.message || 'Erro ao criar conta de autenticação';
        throw new Error(msg);
      }

      if (!authData.user?.id) {
        throw new Error('Erro ao criar conta: ID de usuário não recebido');
      }

      // Insert user profile in public.users table
      const { data, error } = await retrySupabaseQuery(
        () => supabase
          .from('users')
          .insert([
            {
              id: authData.user.id,
              email,
              name,
              user_type: userType,
            },
          ])
          .select()
          .single()
      );

      if (error || !data) {
        const errMsg = parseSupabaseError(error);
        console.error('[Register] Profile creation failed:', error);
        throw new Error(errMsg);
      }

      const userData: User = {
        id: data.id,
        email: data.email,
        name: data.name,
        userType: data.user_type,
        photoUrl: data.photo_url,
      };

      await AsyncStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
    } catch (error) {
      const message = (error as any)?.message || 'Erro ao registrar usuário';
      console.error('[Register] Error:', error);
      throw new Error(message);
    }
  };

  const logout = async () => {
    try {
      if (isSupabaseConfigured) {
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.warn('[Logout] supabase signOut error:', err);
    }
    await AsyncStorage.removeItem('user');
    setUser(null);
  };

  const updateProfile = async (name: string, photoUrl?: string) => {
    if (!user) return;
    if (!isSupabaseConfigured) {
      throw new Error('Supabase não está configurado. Verifique suas variáveis de ambiente.');
    }

    try {
      const { error } = await retrySupabaseQuery(
        () => supabase
          .from('users')
          .update({
            name,
            photo_url: photoUrl,
          })
          .eq('id', user.id)
      );

      if (error) {
        const errorMessage = parseSupabaseError(error);
        console.error('[UpdateProfile] Error:', { error, userId: user.id });
        throw new Error(errorMessage);
      }

      const updatedUser = { ...user, name, photoUrl };
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (error) {
      const message = (error as any)?.message || 'Erro ao atualizar perfil';
      console.error('[UpdateProfile] Error:', error);
      throw new Error(message);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}
