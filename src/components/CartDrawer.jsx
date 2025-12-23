import React, { useState } from 'react';
import { useStore } from '@nanostores/react';
import { isCartOpen, cartItems, removeFromCart, updateQuantity, cartTotal, appliedDiscount, applyDiscountCode } from '../store/cartStore';
import { X, Plus, Minus, Tag, MessageCircle } from 'lucide-react';

const PHONE_NUMBER = "50584016969";

export default function CartDrawer() {
  const $isOpen = useStore(isCartOpen);
  const $items = useStore(cartItems);
  const $total = useStore(cartTotal);
  const $discount = useStore(appliedDiscount);
  const [code, setCode] = useState('');

  const finalTotal = $discount ? $total - ($total * $discount.value) : $total;

  const handleWhatsapp = () => {
    if ($items.length === 0) return;
    let message = `Hola HomeMart! 👋 Nuevo pedido web:\n\n`;
    $items.forEach(item => {
      message += `▪️ ${item.quantity}x ${item.name} - C$${item.price * item.quantity}\n`;
    });
    message += `\nSubtotal: C$${$total.toFixed(2)}`;
    if ($discount) message += `\nDescuento (${$discount.code}): -C$${($total * $discount.value).toFixed(2)}`;
    message += `\n\n*TOTAL: C$${finalTotal.toFixed(2)}*`;
    window.open(`https://wa.me/${PHONE_NUMBER}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <>
      {/* Overlay */}
      <div 
        className={`fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${$isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => isCartOpen.set(false)}
      />
      
      {/* Drawer */}
      <div className={`fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-2xl transform transition-transform duration-300 ${$isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="h-full flex flex-col">
          <div className="p-5 border-b flex justify-between items-center">
            <h2 className="font-bold text-lg">Tu Carrito</h2>
            <button onClick={() => isCartOpen.set(false)}><X className="w-6 h-6" /></button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {$items.length === 0 ? <p className="text-center text-gray-500 mt-10">Carrito vacío</p> : 
              $items.map(item => (
                <div key={item.id} className="flex gap-4">
                  <img src={item.image} className="w-16 h-16 rounded bg-gray-100 object-cover" />
                  <div className="flex-1">
                    <h3 className="font-medium line-clamp-1">{item.name}</h3>
                    <p className="text-sm text-gray-500">C${item.price}</p>
                    <div className="flex items-center gap-2 mt-2">
                       <button onClick={() => updateQuantity(item.id, -1)} className="p-1 bg-gray-100 rounded"><Minus className="w-3 h-3"/></button>
                       <span className="text-sm w-4 text-center">{item.quantity}</span>
                       <button onClick={() => updateQuantity(item.id, 1)} className="p-1 bg-gray-100 rounded"><Plus className="w-3 h-3"/></button>
                    </div>
                  </div>
                </div>
              ))
            }
          </div>

          {$items.length > 0 && (
            <div className="p-5 bg-gray-50 border-t">
              <div className="flex gap-2 mb-4">
                <input 
                  value={code} 
                  onChange={e => setCode(e.target.value)} 
                  placeholder="CÓDIGO" 
                  className="flex-1 p-2 border rounded text-sm uppercase"
                />
                <button onClick={() => applyDiscountCode(code) ? setCode('') : alert('Inválido')} className="bg-gray-900 text-white p-2 rounded"><Tag className="w-4 h-4"/></button>
              </div>
              
              <div className="space-y-1 mb-4 text-sm">
                <div className="flex justify-between"><span>Subtotal</span><span>C${$total.toFixed(2)}</span></div>
                {$discount && <div className="flex justify-between text-green-600"><span>Desc. {$discount.code}</span><span>-C${($total * $discount.value).toFixed(2)}</span></div>}
                <div className="flex justify-between font-bold text-lg pt-2 border-t"><span>Total</span><span>C${finalTotal.toFixed(2)}</span></div>
              </div>

              <button onClick={handleWhatsapp} className="w-full bg-green-600 text-white py-3 rounded-lg font-bold flex justify-center items-center gap-2 hover:bg-green-700">
                <MessageCircle className="w-5 h-5"/> Completar en WhatsApp
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
