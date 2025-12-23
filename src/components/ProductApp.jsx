import React, { useState, useEffect } from 'react';
import { addToCart } from '../store/cartStore';
import { Search, Plus, X, ShoppingCart, Star } from 'lucide-react';

export default function ProductApp({ initialProducts, initialCategories }) {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [filter, setFilter] = useState('Todos');
  const [products] = useState(initialProducts);

  // Manejo de URL dinámica para modales
  useEffect(() => {
    // Si la URL tiene ?product=ID al cargar
    const params = new URLSearchParams(window.location.search);
    const prodId = params.get('product');
    if (prodId) {
      const found = products.find(p => p.id === prodId);
      if (found) setSelectedProduct(found);
    }
  }, [products]);

  const openProduct = (product) => {
    setSelectedProduct(product);
    // Actualizar URL sin recargar
    const newUrl = `${window.location.pathname}?product=${product.id}`;
    window.history.pushState({ path: newUrl }, '', newUrl);
  };

  const closeProduct = () => {
    setSelectedProduct(null);
    // Limpiar URL
    window.history.pushState({ path: window.location.pathname }, '', window.location.pathname);
  };

  const filtered = products.filter(p => filter === 'Todos' || p.category === filter);

  return (
    <div>
      {/* Categorias */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-6 no-scrollbar">
        {['Todos', ...initialCategories].map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors ${
              filter === cat ? 'bg-gray-900 text-white' : 'bg-white border text-gray-600 hover:border-gray-400'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {filtered.map(product => (
          <div key={product.id} className="bg-white rounded-xl overflow-hidden border hover:shadow-lg transition-all group">
            <div onClick={() => openProduct(product)} className="aspect-square bg-gray-100 overflow-hidden cursor-pointer relative">
              <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>
            </div>
            <div className="p-4">
              <p className="text-xs text-orange-600 font-bold uppercase mb-1">{product.category}</p>
              <h3 onClick={() => openProduct(product)} className="font-bold text-gray-900 truncate cursor-pointer hover:text-orange-600">{product.name}</h3>
              <div className="flex justify-between items-center mt-3">
                <span className="font-bold text-lg">C${product.price}</span>
                <button onClick={() => addToCart(product)} className="bg-gray-900 hover:bg-orange-600 text-white p-2 rounded-lg transition-colors">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal / Detalle de Producto */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeProduct} />
          <div className="relative bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col md:flex-row shadow-2xl animate-in zoom-in-95 duration-200">
            <button onClick={closeProduct} className="absolute top-4 right-4 z-10 bg-white/80 p-2 rounded-full"><X className="w-5 h-5"/></button>
            <div className="w-full md:w-1/2 bg-gray-100 min-h-[300px]">
              <img src={selectedProduct.image} className="w-full h-full object-cover" />
            </div>
            <div className="w-full md:w-1/2 p-8">
              <span className="text-orange-600 font-bold text-sm uppercase">{selectedProduct.category}</span>
              <h2 className="text-3xl font-bold text-gray-900 mt-2 mb-4">{selectedProduct.name}</h2>
              <div className="text-3xl font-bold text-gray-900 mb-6">C${selectedProduct.price}</div>
              <p className="text-gray-600 leading-relaxed mb-8">{selectedProduct.description || "Producto de alta calidad disponible en HomeMart."}</p>
              <button 
                onClick={() => { addToCart(selectedProduct); closeProduct(); }}
                className="w-full bg-orange-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-orange-700 transition-colors flex items-center justify-center gap-2"
              >
                Agregar al Carrito <ShoppingCart className="w-5 h-5"/>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
