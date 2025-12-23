import React, { useState } from 'react';
import { useStore } from '@nanostores/react';
import {
  isCartOpen,
  cartItems,
  cartTotal,
  appliedDiscount,
  applyDiscountCode
} from '../store/cartStore';
import { X, Plus, Minus, Tag, MessageCircle, Loader2 } from 'lucide-react';
import { db } from '../lib/firebase';
import {
  collection,
  addDoc,
  serverTimestamp,
  writeBatch,
  doc,
  increment
} from 'firebase/firestore';

const PHONE_NUMBER = '50584016969';
const POS_BASE_PATH = ['artifacts', 'pos-pro-mobile-v2', 'public', 'data'];

export default function CartDrawer() {
  const $isOpen = useStore(isCartOpen);
  const $items = useStore(cartItems);
  const $total = useStore(cartTotal);
  const $discount = useStore(appliedDiscount);

  const [code, setCode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const finalTotal = $discount
    ? $total - $total * $discount.value
    : $total;

  /* ===============================
     HELPERS
  =============================== */

  const buildWhatsappMessage = (orderId) => {
    let message = `Hola HomeMart! 👋 Nuevo pedido web (ID: ${orderId.slice(
      0,
      6
    )}):\n\n`;

    $items.forEach((item) => {
      message += `▪️ ${item.quantity}x ${item.name} - C$${
        item.price * item.quantity
      }\n`;
    });

    message += `\nSubtotal: C$${$total.toFixed(2)}`;

    if ($discount) {
      message += `\nDescuento (${$discount.code}): -C$${(
        $total * $discount.value
      ).toFixed(2)}`;
    }

    message += `\n\n*TOTAL: C$${finalTotal.toFixed(2)}*`;
    return message;
  };

  const updateQty = (id, delta) => {
    const currentItems = cartItems.get();

    const updated = currentItems.map((item) =>
      item.id === id
        ? { ...item, quantity: Math.max(1, item.quantity + delta) }
        : item
    );

    cartItems.set(updated);
  };

  /* ===============================
     CHECKOUT
  =============================== */

  const handleCheckout = async () => {
    if ($items.length === 0) return;

    setIsProcessing(true);

    try {
      const batch = writeBatch(db);
      const productsRef = collection(db, ...POS_BASE_PATH, 'products');

      $items.forEach((item) => {
        const productRef = doc(productsRef, item.id);
        batch.update(productRef, {
          stock: increment(-item.quantity)
        });
      });

      await batch.commit();

      const orderData = {
        items: $items.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          subtotal: item.price * item.quantity
        })),
        subtotal: $total,
        discount: $discount
          ? { code: $discount.code, value: $discount.value }
          : null,
        total: finalTotal,
        status: 'pending',
        source: 'web_ecommerce',
        createdAt: serverTimestamp(),
        customerMessage: 'Pedido desde Web'
      };

      const ordersRef = collection(db, ...POS_BASE_PATH, 'orders');
      const docRef = await addDoc(ordersRef, orderData);

      if (typeof window !== 'undefined') {
        const message = buildWhatsappMessage(docRef.id);
        window.open(
          `https://wa.me/${PHONE_NUMBER}?text=${encodeURIComponent(message)}`,
          '_blank'
        );
      }

      isCartOpen.set(false);
    } catch (error) {
      console.error('Error procesando orden:', error);
      alert('Hubo un error al procesar tu orden. Intenta nuevamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  /* ===============================
     RENDER
  =============================== */

  return (
    <>
      <div
        className={`fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity ${
          $isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => !isProcessing && isCartOpen.set(false)}
      />

      <div
        className={`fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-2xl transform transition-transform ${
          $isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col">
          {/* HEADER */}
          <div className="p-5 border-b flex justify-between items-center bg-gray-50">
            <h2 className="font-bold text-lg flex items-center gap-2">
              Tu Carrito
              {isProcessing && (
                <Loader2 className="w-4 h-4 animate-spin text-orange-600" />
              )}
            </h2>
            <button
              disabled={isProcessing}
              onClick={() => isCartOpen.set(false)}
            >
              <X className="w-6 h-6 text-gray-500 hover:text-gray-900" />
            </button>
          </div>

          {/* ITEMS */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {$items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <p>Tu carrito está vacío</p>
              </div>
            ) : (
              $items.map((item) => (
                <div key={item.id} className="flex gap-4 border-b pb-4">
                  <div className="w-20 h-20 bg-gray-100 border rounded-lg overflow-hidden">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1">
                    <h3 className="font-bold line-clamp-2">{item.name}</h3>
                    <p className="text-sm text-gray-500">C${item.price}</p>

                    <div className="flex justify-between items-center mt-2">
                      <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
                        <button
                          onClick={() => updateQty(item.id, -1)}
                          disabled={isProcessing}
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center font-bold">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQty(item.id, 1)}
                          disabled={isProcessing}
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <span className="font-bold">
                        C${(item.price * item.quantity).toFixed(0)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* FOOTER */}
          {$items.length > 0 && (
            <div className="p-6 border-t">
              <div className="flex gap-2 mb-4">
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="CÓDIGO DE DESCUENTO"
                  className="flex-1 p-3 border rounded-xl text-sm uppercase"
                  disabled={isProcessing}
                />
                <button
                  onClick={() =>
                    applyDiscountCode(code)
                      ? setCode('')
                      : alert('Código inválido')
                  }
                  disabled={isProcessing}
                  className="bg-gray-900 text-white px-4 rounded-xl"
                >
                  Aplicar
                </button>
              </div>

              <div className="flex justify-between font-bold text-xl mb-4">
                <span>Total</span>
                <span>C${finalTotal.toFixed(2)}</span>
              </div>

              <button
                onClick={handleCheckout}
                disabled={isProcessing}
                className="w-full bg-orange-600 text-white py-4 rounded-xl font-bold"
              >
                {isProcessing ? 'Procesando...' : 'Confirmar Pedido'}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
