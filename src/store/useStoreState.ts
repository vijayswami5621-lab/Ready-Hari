import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  productId: string;
  title: string;
  price: number;
  quantity: number;
  image: string;
}

interface StoreState {
  cart: CartItem[];
  wishlist: string[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  toggleWishlist: (productId: string) => void;
  setCart: (cart: CartItem[]) => void;
  setWishlist: (wishlist: string[]) => void;
}

export const useStoreState = create<StoreState>()(
  persist(
    (set) => ({
      cart: [],
      wishlist: [],
      setCart: (cart) => set({ cart }),
      setWishlist: (wishlist) => set({ wishlist }),
      addToCart: (item) => set((state) => {
        const existing = state.cart.find(c => c.productId === item.productId);
        if (existing) {
          return {
            cart: state.cart.map(c => 
              c.productId === item.productId 
                ? { ...c, quantity: c.quantity + item.quantity } 
                : c
            )
          };
        }
        return { cart: [...state.cart, item] };
      }),
      removeFromCart: (productId) => set((state) => ({
        cart: state.cart.filter(c => c.productId !== productId)
      })),
      updateQuantity: (productId, quantity) => set((state) => ({
        cart: state.cart.map(c => 
          c.productId === productId ? { ...c, quantity } : c
        )
      })),
      clearCart: () => set({ cart: [] }),
      toggleWishlist: (productId) => set((state) => ({
        wishlist: state.wishlist.includes(productId)
          ? state.wishlist.filter(id => id !== productId)
          : [...state.wishlist, productId]
      }))
    }),
    {
      name: 'hari-pathshala-store'
    }
  )
);
