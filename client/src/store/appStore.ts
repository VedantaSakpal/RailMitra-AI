import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AppState {
  theme: 'light' | 'dark' | 'system'
  sidebarOpen: boolean
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      theme: 'dark',
      sidebarOpen: false,

      setTheme: (theme) => {
        set({ theme })
        const root = document.documentElement
        if (theme === 'dark') root.classList.add('dark')
        else if (theme === 'light') root.classList.remove('dark')
        else {
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
          if (prefersDark) root.classList.add('dark')
          else root.classList.remove('dark')
        }
      },
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
    }),
    {
      name: 'railmitra-app',
      partialize: (state) => ({ theme: state.theme }),
    }
  )
)
