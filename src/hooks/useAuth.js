import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const useAuthStore = create(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,
      login: async (credentials) => {
        if (!credentials?.email) {
          throw new Error('Email is required');
        }
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));
        set({ isAuthenticated: true, user: { email: credentials.email } });
      },
      logout: () => set({ isAuthenticated: false, user: null })
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage)
    }
  )
);

export default function useAuth() {
  const { isAuthenticated, user, login, logout } = useAuthStore();
  return { isAuthenticated, user, login, logout };
}