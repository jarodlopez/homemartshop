import React, { useState } from 'react';
import { useStore } from '@nanostores/react';
import { isCartOpen, cartItems, cartTotal, appliedDiscount, applyDiscountCode } from '../store/cartStore';
import { X, Plus, Minus, Tag, MessageCircle, Loader2 } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, writeBatch, doc, increment } from 'firebase/firestore';

const PHONE_NUMBER = "50584016969";
const POS_BASE_PATH = ["artifacts", "pos-pro-mobile-v2", "public", "data"];

export default function CartDrawer() {
  const $isOpen = useStore(isCartOpen);
  const $items = useStore(cartItems);
  const $total = useStore(cartTotal);
  const $discount = useStore(appliedDiscount);
  
  const [code, setCode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const finalTotal = $discount ? $total - ($total * $discount.value) : $total;

  const handleCheckout = async () => {
    if ($items.length === 0) return;
    setIsProcessing(true);

    try {
      // 1. Preparar el Batch para operaciones atómicas (todo o nada)
      const batch = writeBatch(db);
      
      // 2. Referencia a la colección de productos
      const productsCollectionRef = collection(db, ...POS_BASE_PATH, "products");
      
      // 3. Descontar Stock de cada producto
      $items.forEach(item => {
        const productRef = doc(productsCollectionRef, item.id);
        batch.update(productRef, { 
          stock: increment(-item.quantity) 
        });
      });

      // 4. Ejecutar el descuento de stock
      await batch.commit();

      // 5. Crear la orden en la colección 'orders' del POS
      const orderData = {
        items: $items.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          subtotal: item.price * item.quantity
        })),
        subtotal: $total,
        discount: $discount ? { code: $discount.code, value: $discount.value } : null,
        total: finalTotal,
        status: 'pending', // Estado inicial para que el POS lo detecte
        source: 'web_ecommerce',
        createdAt: serverTimestamp(),
        customerMessage: "Pedido desde Web"
      };

      const ordersCollectionRef = collection(db, ...POS_BASE_PATH, "orders");
      const docRef = await addDoc(ordersCollectionRef, orderData);

      // 6. Éxito: Enviar a WhatsApp y cerrar
      const whatsappMessage = buildWhatsappMessage(docRef.id);
      window.open(`https://wa.me/${PHONE_NUMBER}?text=${encodeURIComponent(whatsappMessage)}`, '_blank');
      
      isCartOpen.set(false);

    } catch (error) {
      console.error("Error procesando orden:", error);
      alert("Hubo un error al procesar tu orden. Por favor intenta de nuevo.");
    } finally {
      setIsProcessing(false);
    }
  };

  const buildWhatsappMessage = (orderId) => {
    let message = `Hola HomeMart! 👋 Nuevo pedido web (ID: ${orderId.slice(0,6)}):\n\n`;
    $items.forEach(item => {
      message += `▪️ ${item.quantity}x ${item.name} - C$${item.price * item.quantity}\n`;
    });
    message += `\nSubtotal: C$${$total.toFixed(2)}`;
    if ($discount) message += `\nDescuento (${$discount.code}): -C$${($total * $discount.value).toFixed(2)}`;
    message += `\n\n*TOTAL: C$${finalTotal.toFixed(2)}*`;
    return message;
  };

  const updateQty = (id, delta) => {
    const currentItems = cartItems.get();
    const updated = currentItems.map(item => {
      if (item.id === id) {
         return { ...item, quantity: Math.max(1, item.quantity + delta) };
      }
      return item;
    });
    cartItems.set(updated);
  };

  return (
    <>
      <div 
        className={`fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${$isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => !isProcessing && isCartOpen.set(false)}
      />
      
      <div className={`fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-2xl transform transition-transform duration-300 ${$isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="h-full flex flex-col">
          <div className="p-5 border-b flex justify-between items-center bg-gray-50">
            <h2 className="font-bold text-lg flex items-center gap-2">
              Tu Carrito
              {isProcessing && <Loader2 className="w-4 h-4 animate-spin text-orange-600"/>}
            </h2>
            <button onClick={() => !isProcessing && isCartOpen.set(false)} disabled={isProcessing}>
              <X className="w-6 h-6 text-gray-500 hover:text-gray-900" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {$items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <p>Tu carrito está vacío</p>
                <button onClick={() => isCartOpen.set(false)} className="mt-4 text-orange-600 font-medium">Ver productos</button>
              </div>
            ) : 
              $items.map(item => (
                <div key={item.id} className="flex gap-4 border-b pb-4 last:border-0">
                  <div className="w-20 h-20 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0 border">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-gray-900 line-clamp-2">{item.name}</h3>
                      <p className="text-sm text-gray-500 font-medium mt-1">C${item.price}</p>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-3 bg-gray-100 rounded-lg p-1">
                         <button onClick={() => updateQty(item.id, -1)} disabled={isProcessing} className="p-1 hover:bg-white rounded shadow-sm transition-all disabled:opacity-50"><Minus className="w-3 h-3"/></button>
                         <span className="text-sm w-6 text-center font-bold">{item.quantity}</span>
                         <button onClick={() => updateQty(item.id, 1)} disabled={isProcessing} className="p-1 hover:bg-white rounded shadow-sm transition-all disabled:opacity-50"><Plus className="w-3 h-3"/></button>
                      </div>
                      <span className="font-bold text-gray-900">C${(item.price * item.quantity).toFixed(0)}</span>
                    </div>
                  </div>
                </div>
              ))
            }
          </div>

          {$items.length > 0 && (
            <div className="p-6 bg-white border-t shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
              <div className="flex gap-2 mb-6">
                <div className="relative flex-1">
                  <input 
                    value={code} 
                    onChange={e => setCode(e.target.value)} 
                    disabled={isProcessing}
                    placeholder="CÓDIGO DE DESCUENTO" 
                    className="w-full p-3 border rounded-xl text-sm uppercase tracking-wide focus:ring-2 focus:ring-gray-900 focus:outline-none"
                  />
                  <Tag className="absolute right-3 top-3.5 w-4 h-4 text-gray-400"/>
                </div>
                <button 
                  onClick={() => applyDiscountCode(code) ? setCode('') : alert('Código inválido')} 
                  disabled={isProcessing}
                  className="bg-gray-900 text-white px-4 rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                  Aplicar
                </button>
              </div>
              
              <div className="space-y-3 mb-6 text-sm">
                <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>C${$total.toFixed(2)}</span></div>
                {$discount && (
                  <div className="flex justify-between text-green-600 bg-green-50 p-2 rounded-lg">
                    <span className="flex items-center gap-1"><Tag className="w-3 h-3"/> Descuento ({$discount.code})</span>
                    <span>-C${($total * $discount.value).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-extrabold text-xl text-gray-900 pt-4 border-t">
                  <span>Total</span>
                  <span>C${finalTotal.toFixed(2)}</span>
                </div>
              </div>

              <button 
                onClick={handleCheckout} 
                disabled={isProcessing}
                className="w-full bg-orange-600 text-white py-4 rounded-xl font-bold text-lg flex justify-center items-center gap-3 hover:bg-orange-700 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-orange-200"
              >
                {isProcessing ? (
                  <>Procesando Orden...</>
                ) : (
                  <>
                    <MessageCircle className="w-6 h-6"/> 
                    Confirmar Pedido
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
