import { atom, computed } from 'nanostores';

export const isCartOpen = atom(false);
export const cartItems = atom([]);
export const discountCode = atom('');
export const appliedDiscount = atom(null);

const DISCOUNTS = {
  'BIENVENIDA': 0.10,
  'PROMO20': 0.20,
  'VIP': 0.15
};

export function addToCart(product) {
  const existing = cartItems.get().find(item => item.id === product.id);
  if (existing) {
    cartItems.set(
      cartItems.get().map(item => 
        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      )
    );
  } else {
    cartItems.set([...cartItems.get(), { ...product, quantity: 1 }]);
  }
  isCartOpen.set(true);
}

export function removeFromCart(id) {
  cartItems.set(cartItems.get().filter(item => item.id !== id));
}

export function updateQuantity(id, delta) {
  cartItems.set(cartItems.get().map(item => {
    if (item.id === id) {
      return { ...item, quantity: Math.max(1, item.quantity + delta) };
    }
    return item;
  }));
}

export function applyDiscountCode(code) {
  const cleanCode = code.toUpperCase().trim();
  if (DISCOUNTS[cleanCode]) {
    appliedDiscount.set({ code: cleanCode, value: DISCOUNTS[cleanCode] });
    return true;
  }
  return false;
}

export const cartTotal = computed(cartItems, items => {
  return items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
});
