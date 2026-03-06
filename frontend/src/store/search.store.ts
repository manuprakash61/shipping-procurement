import { create } from 'zustand';
import { SearchSession, Vendor } from '@/types';

interface SearchState {
  currentSession: SearchSession | null;
  selectedVendors: Set<string>;
  searchProgress: { stage: string; message: string } | null;

  setCurrentSession: (session: SearchSession | null) => void;
  setSearchProgress: (progress: { stage: string; message: string } | null) => void;
  toggleVendorSelection: (vendorId: string) => void;
  selectAllVendors: (vendors: Vendor[]) => void;
  clearSelection: () => void;
}

export const useSearchStore = create<SearchState>()((set) => ({
  currentSession: null,
  selectedVendors: new Set(),
  searchProgress: null,

  setCurrentSession: (session) => set({ currentSession: session }),

  setSearchProgress: (progress) => set({ searchProgress: progress }),

  toggleVendorSelection: (vendorId) =>
    set((state) => {
      const next = new Set(state.selectedVendors);
      if (next.has(vendorId)) next.delete(vendorId);
      else next.add(vendorId);
      return { selectedVendors: next };
    }),

  selectAllVendors: (vendors) =>
    set({ selectedVendors: new Set(vendors.map((v) => v.id)) }),

  clearSelection: () => set({ selectedVendors: new Set() }),
}));
