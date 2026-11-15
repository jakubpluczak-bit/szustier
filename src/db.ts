import { useState, useEffect, useRef, useCallback } from 'react';
import { INITIAL_PRODUCTS, INITIAL_ORDERS, INITIAL_PROJECTS, INITIAL_REVIEWS } from './constants';

const DB_NAME = 'CastoMarketDB';
const DB_VERSION = 2;
const STORE_NAMES = ['products', 'orders', 'projects', 'reviews'];
const LS_PREFIX = 'CastoMarket_LS_v2_';

function openIndexedDB() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB nie jest wspierane w tej przeglądarce.'));
      return;
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      STORE_NAMES.forEach((storeName) => {
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName, { keyPath: 'id' });
        }
      });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Błąd otwarcia IndexedDB'));
  });
}

async function idbGetAll(db: IDBDatabase, storeName: string) {
  return new Promise<any[]>((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

async function idbReplaceStore(db: IDBDatabase, storeName: string, items: any[]) {
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    store.clear();
    items.forEach((item) => store.put(item));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

function lsGetAll(storeName: string) {
  try {
    const raw = localStorage.getItem(LS_PREFIX + storeName);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function lsReplaceStore(storeName: string, items: any[]) {
  try {
    localStorage.setItem(LS_PREFIX + storeName, JSON.stringify(items));
  } catch (e) {
    console.error('Błąd zapisu do LocalStorage:', e);
  }
}

export function useLocalDatabase() {
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dbEngine, setDbEngine] = useState('Inicjalizacja...');
  const dbRef = useRef<IDBDatabase | null>(null);
  const useFallbackRef = useRef(false);

  const persistStore = useCallback(async (storeName: string, data: any[]) => {
    if (!useFallbackRef.current && dbRef.current) {
      try {
        await idbReplaceStore(dbRef.current, storeName, data);
        return;
      } catch (err) {
        console.warn('Przełączenie na LocalStorage fallback podczas zapisu:', err);
        useFallbackRef.current = true;
        setDbEngine('LocalStorage (Fallback)');
      }
    }
    lsReplaceStore(storeName, data);
  }, []);

  const seedInitialData = useCallback(async (dbInstance: IDBDatabase | null, isFallback: boolean) => {
    if (!isFallback && dbInstance) {
      await idbReplaceStore(dbInstance, 'products', INITIAL_PRODUCTS);
      await idbReplaceStore(dbInstance, 'orders', INITIAL_ORDERS);
      await idbReplaceStore(dbInstance, 'projects', INITIAL_PROJECTS);
      await idbReplaceStore(dbInstance, 'reviews', INITIAL_REVIEWS);
    } else {
      lsReplaceStore('products', INITIAL_PRODUCTS);
      lsReplaceStore('orders', INITIAL_ORDERS);
      lsReplaceStore('projects', INITIAL_PROJECTS);
      lsReplaceStore('reviews', INITIAL_REVIEWS);
    }
    setProducts(INITIAL_PRODUCTS);
    setOrders(INITIAL_ORDERS);
    setProjects(INITIAL_PROJECTS);
    setReviews(INITIAL_REVIEWS);
  }, []);

  useEffect(() => {
    let mounted = true;
    async function init() {
      try {
        const db = await openIndexedDB();
        if (!mounted) return;
        dbRef.current = db;
        useFallbackRef.current = false;
        setDbEngine('IndexedDB (CastoMarketDB v2)');

        const existingProducts = await idbGetAll(db, 'products');
        if (existingProducts.length < 30) {
          await seedInitialData(db, false);
        } else {
          const [existingOrders, existingProjects, existingReviews] = await Promise.all([
            idbGetAll(db, 'orders'),
            idbGetAll(db, 'projects'),
            idbGetAll(db, 'reviews'),
          ]);
          if (!mounted) return;
          setProducts(existingProducts);
          setOrders(existingOrders);
          setProjects(existingProjects);
          setReviews(existingReviews);
        }
      } catch (err) {
        console.warn('IndexedDB niedostępne, używam LocalStorage:', err);
        if (!mounted) return;
        useFallbackRef.current = true;
        setDbEngine('LocalStorage (Fallback v2)');
        const existingProducts = lsGetAll('products');
        if (existingProducts.length < 30) {
          await seedInitialData(null, true);
        } else {
          setProducts(existingProducts);
          setOrders(lsGetAll('orders'));
          setProjects(lsGetAll('projects'));
          setReviews(lsGetAll('reviews'));
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    init();
    return () => {
      mounted = false;
    };
  }, [seedInitialData]);

  const saveProduct = useCallback(async (productObj: any) => {
    setProducts((prev) => {
      const exists = prev.some((p) => p.id === productObj.id);
      const updated = exists
        ? prev.map((p) => (p.id === productObj.id ? productObj : p))
        : [productObj, ...prev];
      persistStore('products', updated);
      return updated;
    });
  }, [persistStore]);

  const deleteProduct = useCallback(async (productId: string) => {
    setProducts((prev) => {
      const updated = prev.filter((p) => p.id !== productId);
      persistStore('products', updated);
      return updated;
    });
  }, [persistStore]);

  const updateProductStock = useCallback(async (productId: string, deltaOrAbsolute: number, isAbsolute = false) => {
    setProducts((prev) => {
      const updated = prev.map((p) => {
        if (p.id !== productId) return p;
        const nextStock = isAbsolute ? Math.max(0, deltaOrAbsolute) : Math.max(0, p.stock + deltaOrAbsolute);
        return { ...p, stock: nextStock };
      });
      persistStore('products', updated);
      return updated;
    });
  }, [persistStore]);

  const placeOrder = useCallback(async (newOrder: any) => {
    setOrders((prev) => {
      const updated = [newOrder, ...prev];
      persistStore('orders', updated);
      return updated;
    });
    setProducts((prev) => {
      const updated = prev.map((p) => {
        const bought = newOrder.items.find((item: any) => item.productId === p.id);
        if (!bought) return p;
        return { ...p, stock: Math.max(0, p.stock - bought.quantity) };
      });
      persistStore('products', updated);
      return updated;
    });
  }, [persistStore]);

  const saveProjectList = useCallback(async (projectObj: any) => {
    setProjects((prev) => {
      const exists = prev.some((pr) => pr.id === projectObj.id);
      const updated = exists
        ? prev.map((pr) => (pr.id === projectObj.id ? projectObj : pr))
        : [projectObj, ...prev];
      persistStore('projects', updated);
      return updated;
    });
  }, [persistStore]);

  const deleteProjectList = useCallback(async (projectId: string) => {
    setProjects((prev) => {
      const updated = prev.filter((pr) => pr.id !== projectId);
      persistStore('projects', updated);
      return updated;
    });
  }, [persistStore]);

  const addReview = useCallback(async (newReview: any) => {
    setReviews((prev) => {
      const updatedReviews = [newReview, ...prev];
      persistStore('reviews', updatedReviews);

      const prodReviews = updatedReviews.filter((r) => r.productId === newReview.productId);
      const avg = prodReviews.reduce((acc, r) => acc + r.rating, 0) / prodReviews.length;

      setProducts((prevProds) => {
        const updatedProds = prevProds.map((p) =>
          p.id === newReview.productId
            ? { ...p, rating: Number(avg.toFixed(1)), reviewCount: prodReviews.length }
            : p
        );
        persistStore('products', updatedProds);
        return updatedProds;
      });

      return updatedReviews;
    });
  }, [persistStore]);

  const resetDatabase = useCallback(async () => {
    await seedInitialData(dbRef.current, useFallbackRef.current);
  }, [seedInitialData]);

  return {
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
  };
}
