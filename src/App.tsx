import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Search, Menu, User, ShoppingCart, MapPin, Heart, Package, ClipboardList,
  Star, Plus, Minus, Trash2, X, ChevronRight,
  ChevronDown, ShieldCheck, Truck, Store,
  SlidersHorizontal, Tag, RefreshCw,
  CheckCircle2, Percent,
  CreditCard, Smartphone, Calendar, RotateCcw,
  LayoutGrid, List, Clock
} from 'lucide-react';
import './theme.css';
import { PHOTO_LIBRARY, STORES, CATEGORIES } from './constants';
import { useLocalDatabase } from './db';
import { ProductImage, PriceDisplay } from './components/UIComponents';
import { ProductCard } from './components/ProductCard';
import { ProductDetailView } from './components/ProductDetailView';
import { AdminWarehouseView } from './components/AdminWarehouseView';

function SidebarItem({ icon: Icon, label, active, badge, count, onClick }: any) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative w-full flex items-center gap-3 pl-6 pr-5 py-2.5 text-left text-[15px] transition-colors cursor-pointer ${
        active
          ? 'bg-[#F0F5FD] text-[#1E78D0] font-medium before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-[#1E78D0] before:rounded-r'
          : 'text-slate-500 hover:text-[#162447] hover:bg-slate-50'
      }`}
    >
      <Icon size={20} className="shrink-0" />
      <span className="flex-1 truncate">{label}</span>
      {badge ? (
        <span className="min-w-6 h-6 px-1.5 rounded-full bg-[#E3EFFC] text-[#1E78D0] text-xs font-medium inline-flex items-center justify-center">
          {badge}
        </span>
      ) : typeof count === 'number' ? (
        <span className="text-xs text-slate-400">{count}</span>
      ) : null}
    </button>
  );
}

export default function App() {
  const {
    products,
    orders,
    projects,
    reviews,
    isLoading,
    dbEngine,
    saveProduct,
    deleteProduct,
    updateProductStock,
    placeOrder,
    saveProjectList,
    deleteProjectList,
    addReview,
    resetDatabase,
  } = useLocalDatabase();

  const [activeView, setActiveView] = useState('home');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  const [selectedStoreId, setSelectedStoreId] = useState('ruda');
  const selectedStore = useMemo(
    () => STORES.find((s) => s.id === selectedStoreId) || STORES[0],
    [selectedStoreId]
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchWrapperRef = useRef<HTMLDivElement | null>(null);

  const [filterCategory, setFilterCategory] = useState('ALL');
  const [filterBrands, setFilterBrands] = useState<string[]>([]);
  const [filterPriceMin, setFilterPriceMin] = useState('');
  const [filterPriceMax, setFilterPriceMax] = useState('');
  const [filterPromoOnly, setFilterPromoOnly] = useState(false);
  const [filterInStockOnly, setFilterInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState('default');
  const [viewMode, setViewMode] = useState('grid');
  const [visibleCount, setVisibleCount] = useState(12);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const [cart, setCart] = useState<{ productId: string; quantity: number }[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [appliedPromoCode, setAppliedPromoCode] = useState<string | null>(null);
  const [promoError, setPromoError] = useState('');

  const [projectModalProduct, setProjectModalProduct] = useState<any>(null);
  const [newProjectNameInput, setNewProjectNameInput] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [checkoutDelivery, setCheckoutDelivery] = useState('courier');
  const [checkoutPayment, setCheckoutPayment] = useState('blik');
  const [blikCode, setBlikCode] = useState('');
  const [customerForm, setCustomerForm] = useState({
    name: '',
    phone: '',
    email: '',
    city: 'Ruda Śląska',
    street: '',
    postalCode: '41-700',
  });
  const [orderSuccessModal, setOrderSuccessModal] = useState<any>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [footerResetConfirm, setFooterResetConfirm] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const showToast = useCallback((text: string) => {
    setToastMessage(text);
    setTimeout(() => {
      setToastMessage((curr) => (curr === text ? null : curr));
    }, 3200);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const enrichedCart = useMemo(() => {
    return cart
      .map((item) => {
        const product = products.find((p) => p.id === item.productId);
        if (!product || product.stock <= 0) return null;
        const clampedQty = Math.min(item.quantity, product.stock);
        const unitPrice = product.promoPrice ?? product.regularPrice;
        return {
          product,
          quantity: clampedQty,
          unitPrice,
          lineTotal: clampedQty * unitPrice,
        };
      })
      .filter(Boolean) as any[];
  }, [cart, products]);

  const cartCount = useMemo(
    () => enrichedCart.reduce((acc, item) => acc + item.quantity, 0),
    [enrichedCart]
  );

  const cartSubtotal = useMemo(
    () => enrichedCart.reduce((acc, item) => acc + item.lineTotal, 0),
    [enrichedCart]
  );

  const discountAmount = useMemo(() => {
    if (!appliedPromoCode) return 0;
    return Number((cartSubtotal * 0.1).toFixed(2));
  }, [appliedPromoCode, cartSubtotal]);

  const cartTotalAfterDiscount = Math.max(0, cartSubtotal - discountAmount);

  const handleAddToCart = (product: any, quantity = 1) => {
    if (!product || product.stock <= 0) return;
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) {
        const nextQty = Math.min(product.stock, existing.quantity + quantity);
        return prev.map((i) => (i.productId === product.id ? { ...i, quantity: nextQty } : i));
      }
      return [...prev, { productId: product.id, quantity: Math.min(product.stock, quantity) }];
    });
    showToast(`Dodano do koszyka: ${product.name} (${quantity} szt.)`);
  };

  const handleUpdateCartQty = (productId: string, nextQty: number) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;
    if (nextQty <= 0) {
      setCart((prev) => prev.filter((i) => i.productId !== productId));
      return;
    }
    setCart((prev) =>
      prev.map((i) =>
        i.productId === productId ? { ...i, quantity: Math.min(prod.stock, nextQty) } : i
      )
    );
  };

  const handleApplyPromoCode = (e: React.FormEvent) => {
    e.preventDefault();
    const code = promoCodeInput.trim().toUpperCase();
    if (code === 'BUDOWA10' || code === 'REMONT10') {
      setAppliedPromoCode(code);
      setPromoError('');
      showToast(`Kod rabatowy ${code} (-10%) został aktywowany!`);
    } else {
      setPromoError('Nieprawidłowy kod. Wypróbuj: BUDOWA10');
    }
  };

  const handleAddProductToProject = (projectId: string, product: any, qty = 1) => {
    const target = projects.find((pr) => pr.id === projectId);
    if (!target) return;
    const exists = target.items.find((i: any) => i.productId === product.id);
    const updatedItems = exists
      ? target.items.map((i: any) => (i.productId === product.id ? { ...i, quantity: i.quantity + qty } : i))
      : [...target.items, { productId: product.id, quantity: qty }];
    saveProjectList({ ...target, items: updatedItems });
    setProjectModalProduct(null);
    showToast(`Zapisano "${product.name}" w projekcie "${target.name}"`);
  };

  const handleCreateNewProjectWithItems = (name: string, itemsToSave: any[]) => {
    if (!name.trim()) return;
    const newProj = {
      id: 'proj-' + Date.now(),
      name: name.trim(),
      createdAt: new Date().toISOString().slice(0, 10),
      items: itemsToSave,
    };
    saveProjectList(newProj);
    setNewProjectNameInput('');
    setProjectModalProduct(null);
    showToast(`Utworzono listę projektową "${newProj.name}"`);
  };

  const liveSearchSuggestions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return { products: [], categories: [] };
    const matchedProds = products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
      )
      .slice(0, 5);

    const matchedCats = CATEGORIES.filter((c) => c.name.toLowerCase().includes(q));
    return { products: matchedProds, categories: matchedCats };
  }, [searchQuery, products]);

  useEffect(() => {
    setVisibleCount(12);
  }, [filterCategory, filterBrands, filterPriceMin, filterPriceMax, filterPromoOnly, filterInStockOnly, searchQuery, sortBy]);

  const availableBrands = useMemo(() => {
    const set = new Set(products.map((p) => p.brand));
    return Array.from(set).sort();
  }, [products]);

  const filteredCatalogProducts = useMemo(() => {
    let list = [...products];

    if (filterCategory !== 'ALL') {
      list = list.filter((p) => p.category === filterCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
      );
    }
    if (filterBrands.length > 0) {
      list = list.filter((p) => filterBrands.includes(p.brand));
    }
    if (filterPriceMin !== '') {
      const min = parseFloat(filterPriceMin);
      if (!isNaN(min)) {
        list = list.filter((p) => (p.promoPrice ?? p.regularPrice) >= min);
      }
    }
    if (filterPriceMax !== '') {
      const max = parseFloat(filterPriceMax);
      if (!isNaN(max)) {
        list = list.filter((p) => (p.promoPrice ?? p.regularPrice) <= max);
      }
    }
    if (filterPromoOnly) {
      list = list.filter((p) => p.promoPrice !== null && p.promoPrice < p.regularPrice);
    }
    if (filterInStockOnly) {
      list = list.filter((p) => p.stock > 0);
    }

    if (sortBy === 'price-asc') {
      list.sort((a, b) => (a.promoPrice ?? a.regularPrice) - (b.promoPrice ?? b.regularPrice));
    } else if (sortBy === 'price-desc') {
      list.sort((a, b) => (b.promoPrice ?? b.regularPrice) - (a.promoPrice ?? a.regularPrice));
    } else if (sortBy === 'rating-desc') {
      list.sort((a, b) => b.rating - a.rating);
    }

    return list;
  }, [
    products,
    filterCategory,
    searchQuery,
    filterBrands,
    filterPriceMin,
    filterPriceMax,
    filterPromoOnly,
    filterInStockOnly,
    sortBy,
  ]);

  const clearAllFilters = () => {
    setFilterCategory('ALL');
    setFilterBrands([]);
    setFilterPriceMin('');
    setFilterPriceMax('');
    setFilterPromoOnly(false);
    setFilterInStockOnly(false);
    setSearchQuery('');
    setSortBy('default');
  };

  const openCategoryInCatalog = (catName: string, promoOnly = false) => {
    clearAllFilters();
    setFilterCategory(catName);
    setFilterPromoOnly(promoOnly);
    setActiveView('catalog');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openProductPage = (productId: string) => {
    setSelectedProductId(productId);
    setActiveView('product');
    setIsSearchOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const FREE_SHIPPING_THRESHOLD = 499;
  const deliveryCost = useMemo(() => {
    if (checkoutDelivery === 'pickup') return 0;
    if (checkoutDelivery === 'hds') return 149.0;
    return cartTotalAfterDiscount >= FREE_SHIPPING_THRESHOLD ? 0 : 19.99;
  }, [checkoutDelivery, cartTotalAfterDiscount]);

  const finalOrderTotal = cartTotalAfterDiscount + deliveryCost;

  const handleCompleteOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (enrichedCart.length === 0) return;

    const deliveryLabels: any = {
      courier: 'Kurier standardowy (dostawa pod drzwi)',
      pickup: 'Odbiór w markecie za 2h',
      hds: 'Transport HDS z rozładunkiem paletowym',
    };
    const paymentLabels: any = {
      blik: 'BLIK',
      card: 'Karta płatnicza online',
      installments: 'Raty 0% RRSO (10 x 0%)',
    };

    const orderNumber = 'CM-2026-' + Math.floor(1000 + Math.random() * 9000);
    const now = new Date();
    const formattedDate = `${now.toISOString().slice(0, 10)} ${now.toTimeString().slice(0, 5)}`;

    const newOrder = {
      id: orderNumber,
      date: formattedDate,
      status: checkoutDelivery === 'pickup' ? 'Gotowe do odbioru w markecie' : 'W realizacji (kompletowanie)',
      storeName: selectedStore.name,
      deliveryMethod: deliveryLabels[checkoutDelivery],
      deliveryCost,
      paymentMethod: paymentLabels[checkoutPayment],
      discountCode: appliedPromoCode,
      discountAmount,
      totalAmount: finalOrderTotal,
      customer: {
        name: customerForm.name,
        phone: customerForm.phone,
        email: customerForm.email,
        address:
          checkoutDelivery === 'pickup'
            ? `Odbiór osobisty: ${selectedStore.address}`
            : `${customerForm.street}, ${customerForm.postalCode} ${customerForm.city}`,
      },
      items: enrichedCart.map((item) => ({
        productId: item.product.id,
        name: item.product.name,
        sku: item.product.sku,
        price: item.unitPrice,
        quantity: item.quantity,
      })),
    };

    await placeOrder(newOrder);
    setCart([]);
    setAppliedPromoCode(null);
    setPromoCodeInput('');
    setOrderSuccessModal(newOrder);
    setActiveView('orders');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F0F5FD] flex flex-col items-center justify-center text-slate-700">
        <p className="text-lg font-semibold text-[#162447]">CastoMarket</p>
        <p className="text-sm text-slate-500 mt-1">Wczytuję produkty z lokalnej bazy ({dbEngine})</p>
      </div>
    );
  }

  const promoHits = products.filter((p) => p.promoPrice !== null && p.promoPrice < p.regularPrice).slice(0, 8);
  const bestsellers = [...products].sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount).slice(0, 8);
  const activeProduct = products.find((p) => p.id === selectedProductId);
  const paginatedCatalogProducts = filteredCatalogProducts.slice(0, visibleCount);

  return (
    <div className="min-h-screen bg-[#F7F8FC] text-[#162447] font-sans lg:flex">
      {mobileNavOpen && (
        <div onClick={() => setMobileNavOpen(false)} className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden" />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-[#E9EDF6] flex flex-col transition-transform duration-200 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 lg:shrink-0 ${
          mobileNavOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <button
          type="button"
          onClick={() => {
            setActiveView('home');
            setMobileNavOpen(false);
          }}
          className="flex items-center gap-3 px-6 py-6 border-b border-[#E9EDF6] text-left cursor-pointer"
        >
          <span className="flex items-end gap-1" aria-hidden="true">
            <span className="w-4 h-10 rounded-full bg-[#F7B955]" />
            <span className="w-4 h-11 rounded-full bg-[#1E78D0]" />
          </span>
          <span>
            <span className="block text-lg font-semibold leading-tight">CastoMarket</span>
            <span className="block text-xs text-slate-500">Budujesz? Remontujesz?</span>
          </span>
        </button>

        <nav className="flex-1 overflow-y-auto py-4">
          <SidebarItem icon={Store} label="Strona główna" active={activeView === 'home'}
            onClick={() => { setActiveView('home'); setMobileNavOpen(false); }} />
          <SidebarItem icon={LayoutGrid} label="Wszystkie produkty" count={products.length}
            active={activeView === 'catalog' && filterCategory === 'ALL' && !filterPromoOnly}
            onClick={() => { clearAllFilters(); setActiveView('catalog'); setMobileNavOpen(false); }} />
          <SidebarItem icon={Tag} label="Gazetka promocyjna"
            active={activeView === 'catalog' && filterPromoOnly}
            onClick={() => { openCategoryInCatalog('ALL', true); setMobileNavOpen(false); }} />

          <p className="px-6 pt-7 pb-2 text-sm font-semibold">Kategorie</p>
          {CATEGORIES.map((cat) => (
            <SidebarItem key={cat.id} icon={cat.icon} label={cat.name}
              count={products.filter((p) => p.category === cat.id).length}
              active={activeView === 'catalog' && filterCategory === cat.id && !filterPromoOnly}
              onClick={() => { openCategoryInCatalog(cat.id); setMobileNavOpen(false); }} />
          ))}

          <p className="px-6 pt-7 pb-2 text-sm font-semibold">Moje konto</p>
          <SidebarItem icon={ClipboardList} label="Zamówienia" badge={orders.length} active={activeView === 'orders'}
            onClick={() => { setActiveView('orders'); setMobileNavOpen(false); }} />
          <SidebarItem icon={Heart} label="Listy projektowe" badge={projects.length} active={activeView === 'projects'}
            onClick={() => { setActiveView('projects'); setMobileNavOpen(false); }} />
          <SidebarItem icon={Package} label="Magazyn" active={activeView === 'admin'}
            onClick={() => { setActiveView('admin'); setMobileNavOpen(false); }} />
        </nav>

        <div className="border-t border-[#E9EDF6] p-5 space-y-3">
          <label className="block">
            <span className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
              <MapPin size={14} /> Twój market
            </span>
            <select
              value={selectedStoreId}
              onChange={(e) => setSelectedStoreId(e.target.value)}
              className="w-full rounded-xl bg-[#F7F8FC] border border-[#E3E8F3] px-3 py-2.5 text-sm font-medium cursor-pointer"
            >
              {STORES.map((st) => (
                <option key={st.id} value={st.id}>{st.name}</option>
              ))}
            </select>
          </label>
          <p className="text-xs text-slate-400">Infolinia 801 800 240</p>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="relative z-30 px-4 sm:px-8 pt-6 pb-2">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-x-4 gap-y-3">
            <button
              type="button"
              aria-label="Otwórz menu"
              onClick={() => setMobileNavOpen(true)}
              className="lg:hidden w-11 h-11 rounded-2xl bg-white border border-[#E3E8F3] flex items-center justify-center cursor-pointer"
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-3 min-w-0 mr-auto">
              <span className="w-12 h-12 rounded-full bg-[#E3EFFC] text-[#1E78D0] flex items-center justify-center shrink-0">
                <User size={22} />
              </span>
              <div className="min-w-0">
                <p className="text-xl sm:text-2xl font-semibold leading-tight truncate">
                  {new Date().getHours() >= 18 ? 'Dobry wieczór' : 'Dzień dobry'}
                </p>
                <p className="text-sm text-slate-500 truncate">
                  Odbiór w {selectedStore.name.replace('CastoMarket ', '')}, otwarte {selectedStore.hours}
                </p>
              </div>
            </div>
            <div ref={searchWrapperRef} className="relative w-full sm:w-80 lg:w-96">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setIsSearchOpen(false);
                  setActiveView('catalog');
                }}
                className="relative flex items-center"
              >
                <input
                  type="text"
                  value={searchQuery}
                  onFocus={() => setIsSearchOpen(true)}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsSearchOpen(true);
                  }}
                  placeholder="Szukaj produktu, marki lub numeru SKU"
                  className="w-full rounded-2xl bg-white border border-[#E3E8F3] text-slate-900 placeholder-slate-400 pl-4 pr-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E78D0]/40"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-10 text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                )}
                <button
                  type="submit"
                  className="absolute right-2 text-slate-400 hover:text-[#1E78D0] p-1.5 transition cursor-pointer"
                >
                  <Search size={17} />
                </button>
              </form>

              {isSearchOpen && searchQuery.trim().length > 0 && (
                <div className="absolute left-0 right-0 mt-2 bg-white text-slate-900 rounded-xl shadow-lg border border-[#E3E8F3] overflow-hidden z-50">
                  {liveSearchSuggestions.categories.length > 0 && (
                    <div className="p-2.5 bg-[#F7F8FC] border-b border-[#E9EDF6]">
                      <span className="text-xs font-semibold text-[#56626F] px-2">
                        Kategorie
                      </span>
                      <div className="mt-1 flex flex-wrap gap-1.5 px-1">
                        {liveSearchSuggestions.categories.map((cat) => (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => {
                              setIsSearchOpen(false);
                              openCategoryInCatalog(cat.id);
                            }}
                            className="inline-flex items-center gap-1.5 bg-white border border-[#E3E8F3] hover:border-[#1E78D0] text-xs font-semibold text-[#162447] px-2.5 py-1 rounded-xl cursor-pointer"
                          >
                            <cat.icon size={13} /> {cat.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="p-2">
                    <span className="text-[10px] font-semibold text-[#56626F] px-2">
                      Produkty ({liveSearchSuggestions.products.length})
                    </span>
                    {liveSearchSuggestions.products.length === 0 ? (
                      <p className="text-xs text-slate-500 p-3">Brak bezpośrednich dopasowań dla „{searchQuery}”.</p>
                    ) : (
                      <div className="divide-y divide-slate-100 mt-1">
                        {liveSearchSuggestions.products.map((prod) => {
                          const price = prod.promoPrice ?? prod.regularPrice;
                          return (
                            <button
                              key={prod.id}
                              type="button"
                              onClick={() => openProductPage(prod.id)}
                              className="w-full flex items-center gap-3 p-2 hover:bg-[#F7F8FC] rounded-xl text-left transition cursor-pointer"
                            >
                              <div className="w-12 h-12 shrink-0">
                                <ProductImage src={prod.imageUrl} alt={prod.name} brand={prod.brand} className="w-12 h-12 rounded-xl" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-slate-900 truncate">{prod.name}</p>
                                <p className="text-[11px] text-slate-500">{prod.brand} • SKU: {prod.sku}</p>
                              </div>
                              <div className="text-right shrink-0">
                                <span className={`font-semibold text-sm ${prod.promoPrice ? 'text-[#C23B1F]' : 'text-[#162447]'}`}>
                                  {price.toFixed(2).replace('.', ',')} zł
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setIsSearchOpen(false);
                      setActiveView('catalog');
                    }}
                    className="w-full bg-[#1E78D0] hover:bg-[#1763B0] text-white text-xs font-semibold py-2.5 text-center transition cursor-pointer"
                  >
                    Pokaż wszystkie wyniki w katalogu
                  </button>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="flex items-center gap-2 rounded-2xl bg-[#1E78D0] hover:bg-[#1763B0] text-white font-medium px-4 h-12 transition-colors cursor-pointer"
            >
              <ShoppingCart size={20} />
              <span className="hidden sm:inline text-sm">Koszyk</span>
              <span className="bg-white text-[#1E78D0] text-xs font-semibold min-w-6 h-6 px-1.5 rounded-full inline-flex items-center justify-center">
                {cartCount}
              </span>
            </button>
          </div>
        </header>

        <main className="flex-1">
        {activeView === 'home' && (
          <div className="max-w-7xl mx-auto px-4 py-6 space-y-10">
            <section className="grid grid-cols-1 lg:grid-cols-12 border border-[#E3E8F3] rounded-3xl overflow-hidden bg-white">
              <div className="lg:col-span-7 bg-[#162447] text-white p-6 sm:p-10 flex flex-col justify-center">
                <h1 className="text-3xl sm:text-4xl font-semibold leading-tight max-w-xl">
                  Materiały i narzędzia na remont, odbiór w markecie po 2 godzinach
                </h1>
                <p className="mt-4 text-blue-100 text-base max-w-lg leading-relaxed">
                  {products.length} produktów: od kleju i gresu po elektronarzędzia Bosch, Makita i DeWalt.
                  Zamów online i odbierz w markecie {selectedStore.name}.
                </p>
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => openCategoryInCatalog('ALL', true)}
                    className="rounded-lg bg-[#1E78D0] hover:bg-[#1763B0] text-white font-semibold px-5 py-3 transition cursor-pointer"
                  >
                    Zobacz promocje
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      clearAllFilters();
                      setActiveView('catalog');
                    }}
                    className="rounded-lg border border-white/40 hover:bg-white/10 text-white font-semibold px-5 py-3 transition cursor-pointer"
                  >
                    Cały katalog
                  </button>
                </div>
              </div>

              <div className="lg:col-span-5 relative min-h-[260px] bg-slate-200">
                <img
                  src={PHOTO_LIBRARY.heroBanner}
                  alt="Remont i budowa z CastoMarket"
                  className="absolute inset-0 w-full h-full object-cover"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
                {promoHits[0] && (
                  <button
                    type="button"
                    onClick={() => openProductPage(promoHits[0].id)}
                    className="absolute left-4 right-4 bottom-4 bg-white text-left rounded-lg p-3 flex items-center gap-3 border border-[#E3E8F3] cursor-pointer hover:border-[#1E78D0]"
                  >
                    <ProductImage
                      src={promoHits[0].imageUrl}
                      alt={promoHits[0].name}
                      brand={promoHits[0].brand}
                      className="w-16 h-16 shrink-0"
                    />
                    <span className="flex-1 min-w-0">
                      <span className="block text-xs text-[#56626F]">Oferta dnia · {promoHits[0].brand}</span>
                      <span className="block text-sm font-semibold text-slate-900 leading-snug line-clamp-2">
                        {promoHits[0].name}
                      </span>
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="block text-xs text-slate-400 line-through">
                        {promoHits[0].regularPrice.toFixed(2).replace('.', ',')} zł
                      </span>
                      <PriceDisplay price={promoHits[0].promoPrice} size="sm" colorClass="text-[#C23B1F]" />
                    </span>
                  </button>
                )}
              </div>

              <div className="lg:col-span-12 border-t border-[#E3E8F3] grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 text-sm">
                <div className="flex items-center gap-3 px-5 py-3.5">
                  <Store size={18} className="text-[#162447] shrink-0" />
                  <span><strong className="font-semibold">Odbiór w markecie w 2 godziny</strong><br /><span className="text-slate-500">bezpłatnie, w 5 miastach</span></span>
                </div>
                <div className="flex items-center gap-3 px-5 py-3.5">
                  <Percent size={18} className="text-[#162447] shrink-0" />
                  <span><strong className="font-semibold">Raty 0% RRSO</strong><br /><span className="text-slate-500">przy zakupach od 300 zł</span></span>
                </div>
                <div className="flex items-center gap-3 px-5 py-3.5">
                  <Truck size={18} className="text-[#162447] shrink-0" />
                  <span><strong className="font-semibold">Transport HDS na budowę</strong><br /><span className="text-slate-500">z rozładunkiem palet</span></span>
                </div>
              </div>
            </section>

            <section>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl sm:text-2xl font-semibold text-[#162447]">
                  Kategorie
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    clearAllFilters();
                    setActiveView('catalog');
                  }}
                  className="text-sm font-semibold text-[#56626F] hover:text-[#162447] inline-flex items-center gap-1 cursor-pointer"
                >
                  Cała oferta
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 border-l border-t border-[#E3E8F3] bg-white rounded-3xl overflow-hidden">
                {CATEGORIES.map((cat) => {
                  const count = products.filter((p) => p.category === cat.id).length;
                  const IconComp = cat.icon;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => openCategoryInCatalog(cat.id)}
                      className="group border-r border-b border-[#E3E8F3] hover:bg-[#F0F5FD] p-5 text-left flex items-start gap-4 cursor-pointer"
                    >
                      <IconComp size={24} className="text-[#162447] shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-900 text-lg leading-tight">
                          {cat.name} <span className="text-sm font-normal text-slate-400">{count}</span>
                        </h3>
                        <p className="text-sm text-slate-500 mt-1 line-clamp-2">{cat.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            <section>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-5">
                <div className="flex items-center gap-2.5">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-semibold text-[#162447]">
                      Promocje z gazetki
                    </h2>
                    <p className="text-xs text-[#56626F]">Obniżone ceny materiałów remontowych i narzędzi</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => openCategoryInCatalog('ALL', true)}
                  className="text-sm font-semibold text-[#C23B1F] hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  Wszystkie promocje
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {promoHits.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    selectedStore={selectedStore}
                    onOpenProduct={openProductPage}
                    onAddToCart={handleAddToCart}
                    onOpenProjectModal={(prod: any) => setProjectModalProduct(prod)}
                  />
                ))}
              </div>
            </section>

            <section>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-5">
                <div className="flex items-center gap-2.5">
                  <span className="bg-[#1E78D0] text-white p-2 rounded-xl">
                    <Star size={20} />
                  </span>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-semibold text-[#162447]">
                      Bestsellery tygodnia
                    </h2>
                    <p className="text-xs text-[#56626F]">Najwyżej oceniane produkty przez fachowców i majsterkowiczów</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    clearAllFilters();
                    setSortBy('rating-desc');
                    setActiveView('catalog');
                  }}
                  className="text-sm font-semibold text-[#162447] hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  Zobacz najwyżej oceniane <ChevronRight size={16} />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {bestsellers.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    selectedStore={selectedStore}
                    onOpenProduct={openProductPage}
                    onAddToCart={handleAddToCart}
                    onOpenProjectModal={(prod: any) => setProjectModalProduct(prod)}
                  />
                ))}
              </div>
            </section>
          </div>
        )}

        {activeView === 'catalog' && (
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex flex-col lg:flex-row gap-6">
              <aside className="lg:w-72 shrink-0">
                <div className="lg:hidden mb-3">
                  <button
                    type="button"
                    onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
                    className="w-full flex items-center justify-between bg-[#1E78D0] text-white font-semibold px-4 py-3 rounded-xl"
                  >
                    <span className="inline-flex items-center gap-2">
                      <SlidersHorizontal size={18} /> Filtry produktów
                    </span>
                    <ChevronDown size={18} />
                  </button>
                </div>

                <div className={`${mobileFiltersOpen ? 'block' : 'hidden'} lg:block rounded-xl border border-[#8793A1] bg-white overflow-hidden`}>
                  <div className="bg-[#1E78D0] text-white px-4 py-3.5 flex items-center justify-between">
                    <span className="font-semibold text-sm">Filtruj produkty</span>
                    <button
                      type="button"
                      onClick={clearAllFilters}
                      className="text-xs underline text-blue-100 hover:text-white cursor-pointer"
                    >
                      Wyczyść
                    </button>
                  </div>

                  <div className="p-5 space-y-6 text-sm">
                    <div className="space-y-2.5">
                      <span className="text-xs font-semibold text-[#56626F] block">
                        Status specjalny
                      </span>
                      <label className="flex items-center gap-2.5 text-xs font-semibold text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filterPromoOnly}
                          onChange={(e) => setFilterPromoOnly(e.target.checked)}
                          className="w-4 h-4 rounded-lg accent-[#C23B1F]"
                        />
                        <span className="text-[#C23B1F]">Tylko promocje</span>
                      </label>
                      <label className="flex items-center gap-2.5 text-xs font-semibold text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filterInStockOnly}
                          onChange={(e) => setFilterInStockOnly(e.target.checked)}
                          className="w-4 h-4 rounded-lg accent-[#1E78D0]"
                        />
                        <span>Tylko dostępne w magazynie</span>
                      </label>
                    </div>

                    <div className="space-y-2">
                      <span className="text-xs font-semibold text-[#56626F] block">
                        Kategorie główne
                      </span>
                      <div className="space-y-1">
                        <button
                          type="button"
                          onClick={() => setFilterCategory('ALL')}
                          className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                            filterCategory === 'ALL' ? 'bg-[#1E78D0] text-white' : 'text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          Wszystkie kategorie ({products.length})
                        </button>
                        {CATEGORIES.map((c) => {
                          const cnt = products.filter((p) => p.category === c.id).length;
                          return (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => setFilterCategory(c.id)}
                              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition flex items-center justify-between cursor-pointer ${
                                filterCategory === c.id ? 'bg-[#1E78D0] text-white' : 'text-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              <span className="truncate">{c.name}</span>
                              <span className="opacity-75">({cnt})</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className="text-xs font-semibold text-[#56626F] block">
                        Zakres cenowy (zł)
                      </span>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={filterPriceMin}
                          onChange={(e) => setFilterPriceMin(e.target.value)}
                          placeholder="Od"
                          className="w-full rounded-xl border border-[#E3E8F3] px-3 py-1.5 text-xs"
                        />
                        <span className="text-slate-400">–</span>
                        <input
                          type="number"
                          value={filterPriceMax}
                          onChange={(e) => setFilterPriceMax(e.target.value)}
                          placeholder="Do"
                          className="w-full rounded-xl border border-[#E3E8F3] px-3 py-1.5 text-xs"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className="text-xs font-semibold text-[#56626F] block">
                        Marka / Producent
                      </span>
                      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                        {availableBrands.map((brandName) => {
                          const isChecked = filterBrands.includes(brandName);
                          return (
                            <label key={brandName} className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setFilterBrands([...filterBrands, brandName]);
                                  } else {
                                    setFilterBrands(filterBrands.filter((b) => b !== brandName));
                                  }
                                }}
                                className="w-3.5 h-3.5 rounded-lg accent-[#1E78D0]"
                              />
                              <span className="truncate">{brandName}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </aside>

              <div className="flex-1">
                <div className="bg-white rounded-3xl border shadow-[0_6px_24px_rgba(22,36,71,0.05)] border-[#E3E8F3] p-4 mb-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h1 className="text-lg sm:text-xl font-semibold text-[#162447]">
                        {filterCategory === 'ALL' ? 'Katalog produktów' : filterCategory}
                      </h1>
                      <p className="text-xs text-[#56626F]">
                        Wyświetlono <strong>{paginatedCatalogProducts.length}</strong> z <strong>{filteredCatalogProducts.length}</strong> produktów
                        {searchQuery && <> dla frazy „<strong>{searchQuery}</strong>”</>}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-semibold text-slate-600 hidden sm:inline">Sortuj:</label>
                        <select
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value)}
                          className="rounded-xl border border-[#E3E8F3] bg-[#F7F8FC] px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#1E78D0]"
                        >
                          <option value="default">Domyślnie</option>
                          <option value="price-asc">Cena: od najniższej</option>
                          <option value="price-desc">Cena: od najwyższej</option>
                          <option value="rating-desc">Najwyżej oceniane</option>
                        </select>
                      </div>

                      <div className="inline-flex rounded-xl border border-[#E3E8F3] bg-[#F7F8FC] p-0.5">
                        <button
                          type="button"
                          onClick={() => setViewMode('grid')}
                          title="Widok siatki"
                          className={`p-1.5 rounded-lg transition cursor-pointer ${
                            viewMode === 'grid' ? 'bg-[#1E78D0] text-white' : 'text-slate-600 hover:text-[#162447]'
                          }`}
                        >
                          <LayoutGrid size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setViewMode('list')}
                          title="Widok listy"
                          className={`p-1.5 rounded-lg transition cursor-pointer ${
                            viewMode === 'list' ? 'bg-[#1E78D0] text-white' : 'text-slate-600 hover:text-[#162447]'
                          }`}
                        >
                          <List size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {filteredCatalogProducts.length === 0 ? (
                  <div className="bg-white rounded-3xl border shadow-[0_6px_24px_rgba(22,36,71,0.05)] border-[#E9EDF6] p-12 text-center">
                    <p className="text-lg font-semibold text-slate-800 mb-2">
                      Nie znaleziono produktów spełniających wybrane kryteria
                    </p>
                    <button
                      type="button"
                      onClick={clearAllFilters}
                      className="rounded-xl bg-[#1E78D0] text-white font-semibold text-sm px-5 py-2.5 cursor-pointer"
                    >
                      Wyczyść wszystkie filtry
                    </button>
                  </div>
                ) : (
                  <>
                    <div
                      className={
                        viewMode === 'grid'
                          ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5'
                          : 'space-y-4'
                      }
                    >
                      {paginatedCatalogProducts.map((product) => (
                        <ProductCard
                          key={product.id}
                          product={product}
                          selectedStore={selectedStore}
                          onOpenProduct={openProductPage}
                          onAddToCart={handleAddToCart}
                          onOpenProjectModal={(prod: any) => setProjectModalProduct(prod)}
                          viewMode={viewMode}
                        />
                      ))}
                    </div>

                    {visibleCount < filteredCatalogProducts.length && (
                      <div className="mt-8 text-center">
                        <button
                          type="button"
                          onClick={() => setVisibleCount((prev) => prev + 12)}
                          className="inline-flex items-center gap-2 rounded-xl bg-white border-2 border-[#1E78D0] text-[#1E78D0] hover:bg-[#1E78D0] hover:text-white font-semibold text-sm px-6 py-3 transition cursor-pointer"
                        >
                          Pokaż więcej produktów (pozostało {filteredCatalogProducts.length - visibleCount})
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {activeView === 'product' && (
          <ProductDetailView
            product={activeProduct}
            allProducts={products}
            selectedStore={selectedStore}
            reviews={reviews}
            onBack={() => setActiveView('catalog')}
            onOpenProduct={openProductPage}
            onAddToCart={handleAddToCart}
            onOpenProjectModal={(prod: any) => setProjectModalProduct(prod)}
            onAddReview={addReview}
          />
        )}

        {activeView === 'projects' && (
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl sm:text-3xl font-semibold text-[#162447]">
                  Twoje Listy Projektowe i Kosztorysy
                </h1>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleCreateNewProjectWithItems(newProjectNameInput, []);
                }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  required
                  value={newProjectNameInput}
                  onChange={(e) => setNewProjectNameInput(e.target.value)}
                  placeholder="Nazwa nowego projektu..."
                  className="rounded-xl border border-[#8793A1] bg-white px-3.5 py-2 text-sm font-medium"
                />
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#1E78D0] hover:bg-[#1763B0] text-white font-semibold text-sm px-4 py-2 cursor-pointer shrink-0"
                >
                  <Plus size={16} /> Utwórz listę
                </button>
              </form>
            </div>

            {projects.length === 0 ? (
              <div className="bg-white rounded-3xl border shadow-[0_6px_24px_rgba(22,36,71,0.05)] border-[#E9EDF6] p-10 text-center">
                <Heart size={40} className="mx-auto text-[#8793A1] mb-3" />
                <h3 className="text-lg font-semibold text-slate-800">Brak zapisanych list projektowych</h3>
              </div>
            ) : (
              <div className="space-y-6">
                {projects.map((proj) => {
                  const resolvedItems = proj.items
                    .map((it: any) => {
                      const prod = products.find((p) => p.id === it.productId);
                      return prod ? { product: prod, quantity: it.quantity } : null;
                    })
                    .filter(Boolean);

                  const projectEstimate = resolvedItems.reduce(
                    (sum: number, item: any) => sum + (item.product.promoPrice ?? item.product.regularPrice) * item.quantity,
                    0
                  );

                  return (
                    <div key={proj.id} className="bg-white rounded-3xl border shadow-[0_6px_24px_rgba(22,36,71,0.05)] border-[#E3E8F3] overflow-hidden">
                      <div className="bg-[#1E78D0] text-white px-6 py-4 flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <h3 className="text-lg font-semibold">{proj.name}</h3>
                          <span className="text-xs text-blue-100">
                            Utworzono: {proj.createdAt} • Pozycji: {resolvedItems.length}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="bg-white/15 px-3 py-1.5 rounded-xl text-right">
                            <span className="text-[10px] block">Szacowany kosztorys</span>
                            <span className="font-bold text-base">{projectEstimate.toFixed(2).replace('.', ',')} zł</span>
                          </div>
                          {resolvedItems.length > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                resolvedItems.forEach((it: any) => handleAddToCart(it.product, it.quantity));
                                setIsCartOpen(true);
                              }}
                              className="inline-flex items-center gap-2 rounded-xl bg-[#1E78D0] hover:bg-[#1763B0] text-white font-semibold text-xs sm:text-sm px-4 py-2.5 cursor-pointer"
                            >
                              <ShoppingCart size={16} /> Dodaj cały projekt do koszyka
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => deleteProjectList(proj.id)}
                            className="p-2 rounded-xl bg-white/10 hover:bg-[#C23B1F] text-white transition cursor-pointer"
                          >
                            <Trash2 size={17} />
                          </button>
                        </div>
                      </div>

                      <div className="divide-y divide-slate-200">
                        {resolvedItems.map(({ product, quantity }: any) => {
                          const price = product.promoPrice ?? product.regularPrice;
                          return (
                            <div key={product.id} className="p-4 flex flex-wrap sm:flex-nowrap items-center justify-between gap-4">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-16 h-16 shrink-0">
                                  <ProductImage src={product.imageUrl} alt={product.name} brand={product.brand} className="w-16 h-16" />
                                </div>
                                <div className="min-w-0">
                                  <button
                                    type="button"
                                    onClick={() => openProductPage(product.id)}
                                    className="font-semibold text-slate-900 hover:text-[#162447] text-sm text-left truncate block cursor-pointer"
                                  >
                                    {product.name}
                                  </button>
                                  <span className="text-xs text-slate-500">
                                    {product.brand} • SKU: {product.sku}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-4 ml-auto">
                                <span className="text-xs font-semibold bg-[#F7F8FC] px-3 py-1.5 rounded-xl border border-[#E9EDF6]">
                                  Ilość: {quantity} {product.unitLabel}
                                </span>
                                <span className="font-semibold text-[#162447] text-base min-w-[90px] text-right">
                                  {(price * quantity).toFixed(2).replace('.', ',')} zł
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeView === 'orders' && (
          <div className="max-w-5xl mx-auto px-4 py-6">
            <h1 className="text-2xl sm:text-3xl font-semibold text-[#162447] mb-6">
              Historia Twoich zamówień ({orders.length})
            </h1>

            {orderSuccessModal && (
              <div className="mb-6 rounded-xl bg-emerald-50 border border-emerald-300 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 size={28} className="text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-emerald-900 text-lg">
                      Zamówienie {orderSuccessModal.id} zostało przyjęte
                    </h3>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setOrderSuccessModal(null)}
                  className="text-xs font-semibold text-emerald-800 underline cursor-pointer"
                >
                  Zamknij
                </button>
              </div>
            )}

            <div className="space-y-4">
              {orders.map((ord) => {
                const isExpanded = expandedOrderId === ord.id || orders[0]?.id === ord.id;
                return (
                  <div key={ord.id} className="bg-white rounded-3xl border shadow-[0_6px_24px_rgba(22,36,71,0.05)] border-[#E3E8F3] overflow-hidden">
                    <div
                      onClick={() => setExpandedOrderId(expandedOrderId === ord.id ? null : ord.id)}
                      className="p-5 flex flex-wrap items-center justify-between gap-4 cursor-pointer hover:bg-[#F7F8FC]/50 transition"
                    >
                      <div>
                        <div className="flex items-center gap-2.5">
                          <span className="font-bold text-[#162447] text-base">{ord.id}</span>
                          <span className="bg-emerald-100 text-emerald-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                            {ord.status}
                          </span>
                        </div>
                        <span className="text-xs text-slate-500 block mt-1">
                          Data: {ord.date} • Market: {ord.storeName}
                        </span>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <span className="text-xs text-slate-500 block">Kwota całkowita</span>
                          <PriceDisplay price={ord.totalAmount} size="sm" colorClass="text-slate-900" />
                        </div>
                        <ChevronDown size={20} className={`text-slate-400 ${isExpanded ? 'rotate-180' : ''}`} />
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="border-t border-[#E9EDF6] bg-[#F7F8FC]/60 p-5 space-y-4">
                        <div className="bg-white rounded-3xl border shadow-[0_6px_24px_rgba(22,36,71,0.05)] border-[#E9EDF6] divide-y divide-slate-100">
                          {ord.items.map((item: any, idx: number) => (
                            <div key={idx} className="p-3 flex items-center justify-between text-xs sm:text-sm">
                              <div>
                                <span className="font-semibold text-slate-900">{item.name}</span>
                                <span className="text-slate-400 block text-xs">SKU: {item.sku}</span>
                              </div>
                              <div className="text-right">
                                <span className="font-semibold text-slate-600 mr-4">{item.quantity} szt.</span>
                                <span className="font-semibold text-slate-900">
                                  {(item.price * item.quantity).toFixed(2).replace('.', ',')} zł
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>

                        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
                          {ord.deliveryMethod && (
                            <div>
                              <dt className="text-xs text-slate-500">Dostawa</dt>
                              <dd className="text-slate-900">
                                {ord.deliveryMethod}
                                {typeof ord.deliveryCost === 'number' && (
                                  <span className="text-slate-500"> · {ord.deliveryCost === 0 ? 'bezpłatnie' : `${ord.deliveryCost.toFixed(2).replace('.', ',')} zł`}</span>
                                )}
                              </dd>
                            </div>
                          )}
                          {ord.paymentMethod && (
                            <div>
                              <dt className="text-xs text-slate-500">Płatność</dt>
                              <dd className="text-slate-900">{ord.paymentMethod}</dd>
                            </div>
                          )}
                          {ord.customer?.address && (
                            <div>
                              <dt className="text-xs text-slate-500">Adres</dt>
                              <dd className="text-slate-900">{ord.customer.address}</dd>
                            </div>
                          )}
                          {ord.customer?.name && (
                            <div>
                              <dt className="text-xs text-slate-500">Odbiorca</dt>
                              <dd className="text-slate-900">
                                {ord.customer.name}
                                {ord.customer.phone && <span className="text-slate-500"> · {ord.customer.phone}</span>}
                                {ord.customer.email && <span className="block text-slate-500">{ord.customer.email}</span>}
                              </dd>
                            </div>
                          )}
                          {ord.discountCode && (
                            <div>
                              <dt className="text-xs text-slate-500">Kod rabatowy</dt>
                              <dd className="text-slate-900">
                                {ord.discountCode}
                                <span className="text-emerald-700"> · −{Number(ord.discountAmount || 0).toFixed(2).replace('.', ',')} zł</span>
                              </dd>
                            </div>
                          )}
                        </dl>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeView === 'checkout' && (
          <div className="max-w-6xl mx-auto px-4 py-6">
            <h1 className="text-2xl sm:text-3xl font-semibold text-[#162447] mb-6">
              Finalizacja zamówienia
            </h1>

            <form onSubmit={handleCompleteOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-7 space-y-6">
                <fieldset className="bg-white rounded-3xl border shadow-[0_6px_24px_rgba(22,36,71,0.05)] border-[#E3E8F3] p-6">
                  <legend className="sr-only">Sposób dostawy</legend>
                  <h2 className="text-lg font-semibold text-[#162447] mb-4">1. Sposób dostawy</h2>
                  <div className="space-y-2">
                    {[
                      { id: 'pickup', label: `Odbiór w markecie za 2 godziny`, note: selectedStore.name, cost: 0 },
                      { id: 'courier', label: 'Kurier standardowy', note: `Bezpłatnie od ${FREE_SHIPPING_THRESHOLD} zł`, cost: cartTotalAfterDiscount >= FREE_SHIPPING_THRESHOLD ? 0 : 19.99 },
                      { id: 'hds', label: 'Transport HDS z rozładunkiem paletowym', note: 'Dla dużych i ciężkich zamówień', cost: 149 },
                    ].map((opt) => (
                      <label
                        key={opt.id}
                        className={`flex items-center justify-between gap-4 p-4 rounded-xl border cursor-pointer ${
                          checkoutDelivery === opt.id ? 'border-[#1E78D0] bg-[#F0F5FD]' : 'border-[#E3E8F3] hover:border-slate-400'
                        }`}
                      >
                        <span className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="delivery"
                            checked={checkoutDelivery === opt.id}
                            onChange={() => setCheckoutDelivery(opt.id)}
                            className="accent-[#1E78D0]"
                          />
                          <span>
                            <span className="block text-sm font-semibold text-slate-900">{opt.label}</span>
                            <span className="block text-xs text-slate-500">{opt.note}</span>
                          </span>
                        </span>
                        <span className="text-sm font-semibold tabular-nums shrink-0">
                          {opt.cost === 0 ? 'Bezpłatnie' : `${opt.cost.toFixed(2).replace('.', ',')} zł`}
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>

                <div className="bg-white rounded-3xl border shadow-[0_6px_24px_rgba(22,36,71,0.05)] border-[#E3E8F3] p-6">
                  <h2 className="text-lg font-semibold text-[#162447] mb-4">2. Dane odbiorcy</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-6 gap-4">
                    <input
                      type="text"
                      required
                      autoComplete="name"
                      value={customerForm.name}
                      onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                      placeholder="Imię i nazwisko"
                      aria-label="Imię i nazwisko"
                      className="sm:col-span-6 rounded-lg border border-[#E3E8F3] px-3 py-2.5 text-sm"
                    />
                    <input
                      type="tel"
                      required
                      autoComplete="tel"
                      value={customerForm.phone}
                      onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                      placeholder="Telefon"
                      aria-label="Telefon"
                      className="sm:col-span-3 rounded-lg border border-[#E3E8F3] px-3 py-2.5 text-sm"
                    />
                    <input
                      type="email"
                      required
                      autoComplete="email"
                      value={customerForm.email}
                      onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                      placeholder="E-mail"
                      aria-label="E-mail"
                      className="sm:col-span-3 rounded-lg border border-[#E3E8F3] px-3 py-2.5 text-sm"
                    />
                    {checkoutDelivery === 'pickup' ? (
                      <p className="sm:col-span-6 text-sm text-slate-600">
                        Odbiór osobisty: {selectedStore.address}
                      </p>
                    ) : (
                      <>
                        <input
                          type="text"
                          required
                          autoComplete="street-address"
                          value={customerForm.street}
                          onChange={(e) => setCustomerForm({ ...customerForm, street: e.target.value })}
                          placeholder="Ulica i numer domu"
                          aria-label="Ulica i numer domu"
                          className="sm:col-span-6 rounded-lg border border-[#E3E8F3] px-3 py-2.5 text-sm"
                        />
                        <input
                          type="text"
                          required
                          autoComplete="postal-code"
                          inputMode="numeric"
                          pattern="[0-9]{2}-[0-9]{3}"
                          title="Kod pocztowy w formacie 00-000"
                          value={customerForm.postalCode}
                          onChange={(e) => setCustomerForm({ ...customerForm, postalCode: e.target.value })}
                          placeholder="Kod pocztowy"
                          aria-label="Kod pocztowy"
                          className="sm:col-span-2 rounded-lg border border-[#E3E8F3] px-3 py-2.5 text-sm"
                        />
                        <input
                          type="text"
                          required
                          autoComplete="address-level2"
                          value={customerForm.city}
                          onChange={(e) => setCustomerForm({ ...customerForm, city: e.target.value })}
                          placeholder="Miejscowość"
                          aria-label="Miejscowość"
                          className="sm:col-span-4 rounded-lg border border-[#E3E8F3] px-3 py-2.5 text-sm"
                        />
                      </>
                    )}
                  </div>
                </div>

                <fieldset className="bg-white rounded-3xl border shadow-[0_6px_24px_rgba(22,36,71,0.05)] border-[#E3E8F3] p-6">
                  <legend className="sr-only">Płatność</legend>
                  <h2 className="text-lg font-semibold text-[#162447] mb-4">3. Płatność</h2>
                  <div className="space-y-2">
                    {[
                      { id: 'blik', label: 'BLIK', note: 'Kod z aplikacji banku' },
                      { id: 'card', label: 'Karta płatnicza online', note: 'Visa, Mastercard' },
                      { id: 'installments', label: 'Raty 0% RRSO (10 x 0%)', note: 'Dostępne przy zamówieniach od 300 zł', disabled: cartTotalAfterDiscount < 300 },
                    ].map((opt) => (
                      <label
                        key={opt.id}
                        className={`flex items-center gap-3 p-4 rounded-xl border ${
                          opt.disabled
                            ? 'border-[#E9EDF6] text-slate-400 cursor-not-allowed'
                            : checkoutPayment === opt.id
                            ? 'border-[#1E78D0] bg-[#F0F5FD] cursor-pointer'
                            : 'border-[#E3E8F3] hover:border-slate-400 cursor-pointer'
                        }`}
                      >
                        <input
                          type="radio"
                          name="payment"
                          disabled={opt.disabled}
                          checked={checkoutPayment === opt.id}
                          onChange={() => setCheckoutPayment(opt.id)}
                          className="accent-[#1E78D0]"
                        />
                        <span>
                          <span className={`block text-sm font-semibold ${opt.disabled ? '' : 'text-slate-900'}`}>{opt.label}</span>
                          <span className="block text-xs text-slate-500">{opt.note}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                  {checkoutPayment === 'blik' && (
                    <div className="mt-4">
                      <label htmlFor="blik-code" className="block text-sm font-semibold text-slate-700 mb-1">Kod BLIK</label>
                      <input
                        id="blik-code"
                        type="text"
                        required
                        inputMode="numeric"
                        pattern="[0-9]{6}"
                        maxLength={6}
                        title="Kod BLIK składa się z 6 cyfr"
                        value={blikCode}
                        onChange={(e) => setBlikCode(e.target.value.replace(/\D/g, ''))}
                        placeholder="000000"
                        className="w-40 rounded-lg border border-[#E3E8F3] px-3 py-2.5 text-base tabular-nums tracking-widest"
                      />
                    </div>
                  )}
                </fieldset>
              </div>

              <aside className="lg:col-span-5 lg:sticky lg:top-40">
                <div className="bg-white rounded-3xl border shadow-[0_6px_24px_rgba(22,36,71,0.05)] border-[#E3E8F3] p-6">
                  <h3 className="text-lg font-semibold text-[#162447] mb-4">Twoje zamówienie</h3>
                  {enrichedCart.length === 0 ? (
                    <div>
                      <p className="text-sm text-slate-600">Koszyk jest pusty. Dodaj produkty, aby złożyć zamówienie.</p>
                      <button
                        type="button"
                        onClick={() => setActiveView('catalog')}
                        className="mt-4 rounded-lg border border-[#1E78D0] text-[#1E78D0] hover:bg-[#1E78D0] hover:text-white font-semibold text-sm px-4 py-2.5 cursor-pointer"
                      >
                        Przejdź do katalogu
                      </button>
                    </div>
                  ) : (
                    <>
                      <ul className="divide-y divide-slate-200 text-sm">
                        {enrichedCart.map(({ product, quantity, lineTotal }) => (
                          <li key={product.id} className="py-2.5 flex justify-between gap-4">
                            <span className="text-slate-800">
                              {product.name} <span className="text-slate-500">× {quantity}</span>
                            </span>
                            <span className="font-semibold tabular-nums shrink-0">{lineTotal.toFixed(2).replace('.', ',')} zł</span>
                          </li>
                        ))}
                      </ul>
                      <dl className="mt-4 pt-4 border-t border-[#E9EDF6] space-y-1.5 text-sm">
                        <div className="flex justify-between">
                          <dt className="text-slate-600">Produkty</dt>
                          <dd className="tabular-nums">{cartSubtotal.toFixed(2).replace('.', ',')} zł</dd>
                        </div>
                        {appliedPromoCode && (
                          <div className="flex justify-between text-emerald-700">
                            <dt>Rabat {appliedPromoCode}</dt>
                            <dd className="tabular-nums">−{discountAmount.toFixed(2).replace('.', ',')} zł</dd>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <dt className="text-slate-600">Dostawa</dt>
                          <dd className="tabular-nums">{deliveryCost === 0 ? 'Bezpłatnie' : `${deliveryCost.toFixed(2).replace('.', ',')} zł`}</dd>
                        </div>
                      </dl>
                      <div className="mt-4 pt-4 border-t border-[#E9EDF6] flex items-end justify-between">
                        <span className="text-sm font-semibold">Do zapłaty</span>
                        <PriceDisplay price={finalOrderTotal} size="lg" colorClass="text-[#C23B1F]" />
                      </div>
                    </>
                  )}
                  <button
                    type="submit"
                    disabled={enrichedCart.length === 0}
                    className="mt-6 w-full rounded-lg bg-[#1E78D0] hover:bg-[#1763B0] disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold text-base py-3.5 px-5 transition cursor-pointer"
                  >
                    Zamawiam i płacę
                  </button>
                </div>
              </aside>
            </form>
          </div>
        )}

        {activeView === 'admin' && (
          <AdminWarehouseView
            products={products}
            orders={orders}
            projects={projects}
            reviews={reviews}
            dbEngine={dbEngine}
            onSaveProduct={saveProduct}
            onDeleteProduct={deleteProduct}
            onUpdateStock={updateProductStock}
            onResetDatabase={async () => {
              await resetDatabase();
              setCart([]);
              showToast('Baza danych została zresetowana');
            }}
          />
        )}
      </main>

      {/* WYSUWANY KOSZYK */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div onClick={() => setIsCartOpen(false)} className="fixed inset-0 bg-slate-900/60" />
          <div className="relative z-10 w-full max-w-md bg-white h-full flex flex-col shadow-lg">
            <div className="bg-[#1E78D0] text-white px-5 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Twój koszyk ({cartCount})</h2>
              <button type="button" onClick={() => setIsCartOpen(false)} className="p-1.5 cursor-pointer">
                <X size={22} />
              </button>
            </div>

            {enrichedCart.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <p className="font-semibold text-slate-800">Koszyk jest pusty</p>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto p-4 divide-y divide-slate-200">
                  {enrichedCart.map(({ product, quantity, unitPrice, lineTotal }) => (
                    <div key={product.id} className="py-3.5 flex gap-3">
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{product.name}</p>
                        <p className="text-xs text-slate-500">{unitPrice.toFixed(2).replace('.', ',')} zł x {quantity}</p>
                        <div className="mt-2 flex items-center gap-3">
                          <div className="inline-flex items-center border border-[#E3E8F3] rounded-lg">
                            <button type="button" aria-label="Zmniejsz ilość" onClick={() => handleUpdateCartQty(product.id, quantity - 1)} className="w-8 h-8 hover:bg-slate-100 cursor-pointer">−</button>
                            <span className="w-8 text-center text-sm font-semibold tabular-nums">{quantity}</span>
                            <button type="button" aria-label="Zwiększ ilość" onClick={() => handleUpdateCartQty(product.id, quantity + 1)} className="w-8 h-8 hover:bg-slate-100 cursor-pointer">+</button>
                          </div>
                          <button type="button" onClick={() => handleUpdateCartQty(product.id, 0)} className="text-xs text-slate-500 hover:text-[#C23B1F] underline cursor-pointer">Usuń</button>
                        </div>
                      </div>
                      <span className="font-semibold text-sm text-[#162447]">{lineTotal.toFixed(2).replace('.', ',')} zł</span>
                    </div>
                  ))}
                </div>
                <div className="border-t bg-[#F7F8FC] p-4 space-y-3">
                  <form onSubmit={handleApplyPromoCode} className="flex gap-2">
                    <input
                      type="text"
                      value={promoCodeInput}
                      onChange={(e) => setPromoCodeInput(e.target.value)}
                      placeholder="Kod: BUDOWA10"
                      className="flex-1 rounded-xl border px-3 py-2 text-xs"
                    />
                    <button type="submit" className="rounded-xl bg-[#1E78D0] hover:bg-[#1763B0] text-white text-xs font-semibold px-3 py-2">Zastosuj</button>
                  </form>
                  {promoError && <p className="text-xs text-[#C23B1F]">{promoError}</p>}
                  <div className="flex justify-between items-baseline">
                    <span className="font-semibold">Razem:</span>
                    <PriceDisplay price={cartTotalAfterDiscount} size="md" colorClass="text-[#C23B1F]" />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCartOpen(false);
                      setActiveView('checkout');
                    }}
                    className="w-full rounded-xl bg-[#C23B1F] text-white font-bold text-sm py-3.5 cursor-pointer"
                  >
                    Przejdź do kasy
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* MODAL PROJEKTU */}
      {projectModalProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setProjectModalProduct(null)} className="fixed inset-0 bg-slate-900/60" />
          <div className="relative z-10 w-full max-w-md bg-white rounded-3xl p-5 shadow-lg">
            <h3 className="font-semibold text-base mb-3">Zapisz do listy projektowej</h3>
            <div className="space-y-2 mb-4">
              {projects.map((pr) => (
                <button
                  key={pr.id}
                  type="button"
                  onClick={() => handleAddProductToProject(pr.id, projectModalProduct, 1)}
                  className="w-full p-2.5 border rounded-xl text-left font-semibold text-sm hover:bg-slate-50"
                >
                  {pr.name}
                </button>
              ))}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleCreateNewProjectWithItems(newProjectNameInput, [{ productId: projectModalProduct.id, quantity: 1 }]);
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                required
                value={newProjectNameInput}
                onChange={(e) => setNewProjectNameInput(e.target.value)}
                placeholder="Nowa lista..."
                className="flex-1 border rounded-xl px-3 py-2 text-sm"
              />
              <button type="submit" className="bg-[#1E78D0] hover:bg-[#1763B0] text-white font-semibold text-xs px-4 py-2 rounded-xl">Utwórz</button>
            </form>
          </div>
        </div>
      )}

      {/* TOAST */}
      {toastMessage && (
        <div className="fixed bottom-5 left-5 right-5 sm:right-auto z-50 bg-[#1E78D0] text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 text-sm font-semibold">
          <CheckCircle2 size={18} className="text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* STOPKA */}
      <footer className="bg-white border-t border-[#E3E8F3] text-slate-500 mt-14">
        <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs">
          <span>© 2026 CastoMarket</span>
          {!footerResetConfirm ? (
            <button
              type="button"
              onClick={() => setFooterResetConfirm(true)}
              className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-xl font-semibold cursor-pointer"
            >
              <RotateCcw size={14} /> Resetuj bazę danych
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={async () => {
                  await resetDatabase();
                  setCart([]);
                  setFooterResetConfirm(false);
                }}
                className="bg-[#C23B1F] text-white px-3 py-1.5 rounded-lg font-semibold"
              >
                Potwierdź reset
              </button>
              <button type="button" onClick={() => setFooterResetConfirm(false)} className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg font-semibold">
                Anuluj
              </button>
            </div>
          )}
        </div>
      </footer>
      </div>
    </div>
  );
}
