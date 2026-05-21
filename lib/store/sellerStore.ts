import { create } from "zustand";

import {
  persist,
} from "zustand/middleware";

interface SellerStore {
  seller: any;

  lastFetched: number | null;

  setSeller: (
    seller: any
  ) => void;

  clearSeller: () => void;
}

export const useSellerStore =
  create<SellerStore>()(
    persist(
      (set) => ({
        seller: null,

        lastFetched: null,

        setSeller: (
          seller
        ) =>
          set({
            seller,

            lastFetched:
              Date.now(),
          }),

        clearSeller: () =>
          set({
            seller: null,

            lastFetched:
              null,
          }),
      }),
      {
        name:
          "seller-storage",
      }
    )
  );