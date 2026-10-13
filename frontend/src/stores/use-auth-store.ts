import { create } from "zustand";
import type { UserProfile, UserRole } from "@/types/user";
import type { AccountResponse } from "@/lib/api/auth";
import type { AuthState } from "./types";

function normalizeUserProfile(user: UserProfile | AccountResponse): UserProfile {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    status: user.status,
    avatarUrl: (user as UserProfile).avatarUrl,
    phoneNumber: (user as UserProfile).phoneNumber,
  };
}

const initialState = {
  user: null,
  role: null,
  roles: [] as UserRole[],
  isAuthenticated: false,
  accessToken: null,
};

export const useAuthStore = create<AuthState>((set) => ({
  ...initialState,

  setAuth: ({ user, accessToken }) => {
    const profile = normalizeUserProfile(user);
    set((state) => ({
      user: profile,
      role: profile.role,
      roles: profile.role ? [profile.role] : [],
      isAuthenticated: true,
      accessToken: accessToken !== undefined ? accessToken : state.accessToken,
    }));
  },

  setUser: (user) => {
    if (!user) {
      set({
        user: null,
        role: null,
        roles: [],
        isAuthenticated: false,
      });
      return;
    }
    const profile = normalizeUserProfile(user);
    set({
      user: profile,
      role: profile.role,
      roles: profile.role ? [profile.role] : [],
      isAuthenticated: true,
    });
  },

  setAccessToken: (accessToken) => {
    set((state) => ({
      accessToken,
      isAuthenticated: Boolean(accessToken || state.user),
    }));
  },

  updateProfile: (partial) => {
    set((state) => {
      if (!state.user) return state;
      const updatedUser: UserProfile = {
        ...state.user,
        ...partial,
      };
      return {
        user: updatedUser,
        role: updatedUser.role,
        roles: updatedUser.role ? [updatedUser.role] : [],
      };
    });
  },

  clearAuth: () => {
    set(initialState);
  },
}));

/**
 * Selectors tiện ích giúp tránh re-render không cần thiết
 */
export const selectCurrentUser = (state: AuthState) => state.user;
export const selectUserRole = (state: AuthState) => state.role;
export const selectIsAuthenticated = (state: AuthState) => state.isAuthenticated;
export const selectAccessToken = (state: AuthState) => state.accessToken;
