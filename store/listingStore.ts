import { create } from 'zustand';

interface ListingStore {
  listings: any[];
  setListings: (listings: any[]) => void;
}

export const useListingStore = create<ListingStore>((set) => ({
  listings: [],
  setListings: (listings) => set({ listings }),
}));