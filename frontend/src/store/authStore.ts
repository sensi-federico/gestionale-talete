import { create } from "zustand";
import { persist } from "zustand/middleware";
import { UserProfile } from "@shared/types";

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface AuthState {
  user: UserProfile | null;
  tokens: AuthTokens | null;
  isRestoring: boolean;
  setSession: (user: UserProfile, tokens: AuthTokens) => void;
  clearSession: () => void;
  restoreSession: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      tokens: null,
      isRestoring: true,
      setSession: (user, tokens) => {
        set({ user, tokens, isRestoring: false });
      },
      clearSession: () => {
        set({ user: null, tokens: null, isRestoring: false });
      },
      restoreSession: () => {
        const { user, tokens } = get();
        set({ isRestoring: false, user: user ?? null, tokens: tokens ?? null });
      }
    }),
    {
      name: "talete-auth",
      partialize: (state) => ({ user: state.user, tokens: state.tokens })
    }
  )
);
