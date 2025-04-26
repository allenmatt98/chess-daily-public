import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  loading: boolean;
  showAuthModal: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<{ confirmationSent: boolean }>;
  signOut: () => Promise<void>;
  setUser: (user: User | null) => void;
  syncGuestProgress: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  setShowAuthModal: (show: boolean) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: true,
  showAuthModal: false,
  setShowAuthModal: (show) => set({ showAuthModal: show }),
  signIn: async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      await get().syncGuestProgress();
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  },
  signUp: async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        }
      });

      if (error) throw error;
      return { confirmationSent: true };
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  },
  signOut: async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      set({ user: null });
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  },
  setUser: (user) => set({ user, loading: false }),
  resetPassword: async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
      });

      if (error) throw error;
    } catch (error) {
      console.error('Password reset error:', error);
      throw error;
    }
  },
  updatePassword: async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;
    } catch (error) {
      console.error('Password update error:', error);
      throw error;
    }
  },
  syncGuestProgress: async () => {
    const user = get().user;
    if (!user) return;

    try {
      console.log('Syncing guest progress for user:', user.id);

      // Get guest times from localStorage
      const guestTimes = JSON.parse(localStorage.getItem('guest_puzzle_times') || '[]');
      
      // For each guest time, update the user's progress
      for (const time of guestTimes) {
        await supabase.from('user_progress').upsert({
          user_id: user.id,
          puzzle_id: time.puzzleId,
          completed: true,
          time_taken: time.timeTaken,
          completed_at: time.solvedAt
        }, {
          onConflict: 'user_id,puzzle_id'
        });

        // Log progress sync
        await supabase.rpc('log_audit_event', {
          action_param: 'SYNC_GUEST_PROGRESS',
          entity_id_param: user.id,
          entity_type_param: 'USER_PROGRESS',
          new_data_param: JSON.stringify(time),
          old_data_param: null
        });
      }

      console.log('Guest progress sync completed for user:', user.id);

      // Clear guest times after successful sync
      localStorage.removeItem('guest_puzzle_times');
    } catch (error) {
      console.error('Error syncing guest progress:', error);
    }
  }
}));