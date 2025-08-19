import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User, Collection, Grade } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
}

interface CollectionState {
  collections: Collection[];
  activeCollection: Collection | null;
  setCollections: (collections: Collection[]) => void;
  setActiveCollection: (collection: Collection | null) => void;
  addCollection: (collection: Collection) => void;
  updateCollection: (id: string, updates: Partial<Collection>) => void;
  deleteCollection: (id: string) => void;
}

interface GradeState {
  grades: Grade[];
  activeGrade: Grade | null;
  setGrades: (grades: Grade[]) => void;
  setActiveGrade: (grade: Grade | null) => void;
  addGrade: (grade: Grade) => void;
  updateGrade: (id: string, updates: Partial<Grade>) => void;
  deleteGrade: (id: string) => void;
}

interface UIState {
  isLoading: boolean;
  error: string | null;
  theme: 'light' | 'dark' | 'system';
  backgroundImage: string | null;
  backgroundType: 'upload' | 'card' | null;
  backgroundPosition: { x: number; y: number };
  backgroundScale: number;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setBackgroundImage: (image: string | null, type: 'upload' | 'card' | null) => void;
  setBackgroundPosition: (position: { x: number; y: number }) => void;
  setBackgroundScale: (scale: number) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: (user, token) => set({ user, token, isAuthenticated: true }),
      logout: () => set({ user: null, token: null, isAuthenticated: false }),
      updateUser: (updates) => set((state) => ({
        user: state.user ? { ...state.user, ...updates } : null
      }))
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage)
    }
  )
);

export const useCollectionStore = create<CollectionState>((set) => ({
  collections: [],
  activeCollection: null,
  setCollections: (collections) => set({ collections }),
  setActiveCollection: (activeCollection) => set({ activeCollection }),
  addCollection: (collection) => set((state) => ({
    collections: [...state.collections, collection]
  })),
  updateCollection: (id, updates) => set((state) => ({
    collections: state.collections.map((c) =>
      c.id === id ? { ...c, ...updates } : c
    ),
    activeCollection: state.activeCollection?.id === id
      ? { ...state.activeCollection, ...updates }
      : state.activeCollection
  })),
  deleteCollection: (id) => set((state) => ({
    collections: state.collections.filter((c) => c.id !== id),
    activeCollection: state.activeCollection?.id === id ? null : state.activeCollection
  }))
}));

export const useGradeStore = create<GradeState>((set) => ({
  grades: [],
  activeGrade: null,
  setGrades: (grades) => set({ grades }),
  setActiveGrade: (activeGrade) => set({ activeGrade }),
  addGrade: (grade) => set((state) => ({
    grades: [...state.grades, grade]
  })),
  updateGrade: (id, updates) => set((state) => ({
    grades: state.grades.map((g) =>
      g.id === id ? { ...g, ...updates } : g
    ),
    activeGrade: state.activeGrade?.id === id
      ? { ...state.activeGrade, ...updates }
      : state.activeGrade
  })),
  deleteGrade: (id) => set((state) => ({
    grades: state.grades.filter((g) => g.id !== id),
    activeGrade: state.activeGrade?.id === id ? null : state.activeGrade
  }))
}));

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      isLoading: false,
      error: null,
      theme: 'system',
      backgroundImage: null,
      backgroundType: null,
      backgroundPosition: { x: 50, y: 50 },
      backgroundScale: 1,
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      setTheme: (theme) => set({ theme }),
      setBackgroundImage: (backgroundImage, backgroundType) => set({ backgroundImage, backgroundType }),
      setBackgroundPosition: (backgroundPosition) => set({ backgroundPosition }),
      setBackgroundScale: (backgroundScale) => set({ backgroundScale })
    }),
    {
      name: 'ui-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ 
        theme: state.theme,
        backgroundImage: state.backgroundImage,
        backgroundType: state.backgroundType,
        backgroundPosition: state.backgroundPosition,
        backgroundScale: state.backgroundScale
      })
    }
  )
);