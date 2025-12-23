import React from 'react';
import { useStore } from '@nanostores/react';
import { isCartOpen, cartItems } from '../store/cartStore';
import { ShoppingCart, Star, Menu, Search } from 'lucide-react';

export default function Navbar({ categories }) {
  const $cartItems = useStore(cartItems);
  const cartCount = $cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo */}
          <a href="/" className="flex items-center gap-2">
            <div className="bg-orange-600 p-2 rounded-lg">
              <Star className="w-5 h-5 text-white fill-current" />
            </div>
            <span className="text-xl font-bold tracking-tight text-gray-900">
              Home<span className="text-orange-600">Mart</span>
            </span>
          </a>

          {/* Buscador Desktop */}
          <div className="hidden md:flex relative">
             <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
             <input 
                type="text" 
                placeholder="Buscar..." 
                className="pl-9 pr-4 py-2 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 w-64"
             />
          </div>

          {/* Acciones */}
          <div className="flex items-center gap-4">
            <button 
              onClick={() => isCartOpen.set(true)}
              className="relative p-2 hover:bg-gray-100 rounded-full transition-colors group"
            >
              <ShoppingCart className="w-6 h-6 text-gray-600 group-hover:text-orange-600" />
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 w-5 h-5 bg-orange-600 text-white text-xs font-bold flex items-center justify-center rounded-full border-2 border-white">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
