import React, { useState, useEffect } from 'react';
import { Package, Star, Image as ImageIcon, Calculator } from 'lucide-react';

export function ProductImage({ src, alt, brand, className = 'w-full h-44', imgClassName = '' }: any) {
  const [hasError, setHasError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setHasError(false);
    setLoaded(false);
  }, [src]);

  if (!src || hasError) {
    return (
      <div className={`flex flex-col items-center justify-center bg-slate-100 border border-[#E9EDF6] rounded-xl p-4 text-center select-none ${className}`}>
        <Package size={24} className="text-[#8793A1] mb-1.5" />
        <span className="text-[11px] font-semibold text-[#56626F]">{brand || 'CastoMarket'}</span>
        <span className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 max-w-[180px]">{alt}</span>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden bg-slate-100 rounded-xl ${className}`}>
      {!loaded && (
        <div className="absolute inset-0 bg-slate-200 flex items-center justify-center">
          <ImageIcon size={24} className="text-slate-400" />
        </div>
      )}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={() => setHasError(true)}
        className={`w-full h-full object-cover transition-colors duration-300 ${loaded ? 'opacity-100' : 'opacity-0'} ${imgClassName}`}
      />
    </div>
  );
}

export function PriceDisplay({ price, size = 'md', colorClass = 'text-slate-900' }: any) {
  const formatted = Number(price || 0).toFixed(2);
  const [zl, gr] = formatted.split('.');
  const sizeMap: any = {
    sm: { zl: 'text-xl', gr: 'text-xs', unit: 'text-xs' },
    md: { zl: 'text-2xl sm:text-[26px]', gr: 'text-xs', unit: 'text-sm' },
    lg: { zl: 'text-4xl', gr: 'text-base', unit: 'text-lg' },
  };
  const s = sizeMap[size] || sizeMap.md;

  return (
    <span className={`inline-flex items-baseline font-semibold tracking-tight leading-none ${colorClass}`}>
      <span className={s.zl}>{Number(zl).toLocaleString('pl-PL')}</span>
      <span className={`${s.gr} font-semibold ml-0.5 self-start mt-0.5`}>,{gr}</span>
      <span className={`${s.unit} font-semibold ml-1`}>zł</span>
    </span>
  );
}

export function StarRating({ rating, count, size = 14 }: any) {
  return (
    <div className="inline-flex items-center gap-1">
      <div className="flex items-center text-amber-400">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={size}
            className={star <= Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}
          />
        ))}
      </div>
      <span className="text-xs font-semibold text-slate-700">{Number(rating).toFixed(1)}</span>
      {typeof count === 'number' && (
        <span className="text-xs text-slate-400">({count})</span>
      )}
    </div>
  );
}

export function getLocalStoreStock(product: any, storeId: string) {
  if (!product || product.stock <= 0) return 0;
  const hash = (product.id + storeId).split('').reduce((a: number, b: string) => a + b.charCodeAt(0), 0);
  if (product.stock < 4) return product.stock;
  const ratio = 0.25 + (hash % 55) / 100;
  return Math.max(1, Math.min(product.stock, Math.round(product.stock * ratio)));
}

export function RenovationCalculator({ product, onAddCalculatedToCart }: any) {
  const [area, setArea] = useState(20);
  const [coats, setCoats] = useState(2);
  const [includeWaste, setIncludeWaste] = useState(true);

  if (!product || !product.calcType) return null;

  let calculatedUnits = 1;
  const coverage = product.coveragePerUnit || 1;

  if (product.calcType === 'paint') {
    const totalAreaNeeded = area * coats;
    const rawUnits = totalAreaNeeded / coverage;
    calculatedUnits = Math.ceil(rawUnits * (includeWaste ? 1.1 : 1.0));
  } else if (['tiles', 'panels', 'plaster'].includes(product.calcType)) {
    const rawUnits = area / coverage;
    calculatedUnits = Math.ceil(rawUnits * (includeWaste ? 1.1 : 1.0));
  }

  const unitPrice = product.promoPrice ?? product.regularPrice;
  const totalPrice = calculatedUnits * unitPrice;

  return (
    <div className="mt-6 rounded-xl bg-[#F7F8FC] border border-[#E3E8F3] p-5">
      <div className="flex items-center gap-2 mb-3 text-[#162447]">
        <Calculator size={20} />
        <h3 className="font-semibold text-base">Kalkulator zużycia materiału</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        <div>
          <label className="block font-semibold text-slate-700 mb-1">Powierzchnia (m²)</label>
          <input
            type="number"
            min={1}
            value={area}
            onChange={(e) => setArea(Math.max(1, parseFloat(e.target.value) || 0))}
            className="w-full rounded-xl border border-[#E3E8F3] bg-white px-3 py-2 text-sm font-semibold"
          />
        </div>
        {product.calcType === 'paint' && (
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Liczba warstw</label>
            <select
              value={coats}
              onChange={(e) => setCoats(parseInt(e.target.value, 10))}
              className="w-full rounded-xl border border-[#E3E8F3] bg-white px-3 py-2 text-sm font-semibold"
            >
              <option value={1}>1 warstwa</option>
              <option value={2}>2 warstwy</option>
              <option value={3}>3 warstwy</option>
            </select>
          </div>
        )}
        <div className="sm:col-span-2">
          <label className="flex items-center gap-2 font-semibold text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={includeWaste}
              onChange={(e) => setIncludeWaste(e.target.checked)}
              className="w-4 h-4 rounded-lg accent-[#1E78D0]"
            />
            <span>Uwzględnij zapas na docięcie (+10%)</span>
          </label>
        </div>
      </div>
      <div className="mt-4 pt-3 border-t border-[#E9EDF6] flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="text-xs text-slate-500 block">Potrzebna ilość:</span>
          <span className="text-base font-semibold text-[#162447]">
            {calculatedUnits} {product.unitLabel} ({totalPrice.toFixed(2).replace('.', ',')} zł)
          </span>
        </div>
        <button
          type="button"
          onClick={() => onAddCalculatedToCart(product, calculatedUnits)}
          className="rounded-xl bg-[#1E78D0] hover:bg-[#1763B0] text-white font-semibold text-xs px-4 py-2.5 transition cursor-pointer"
        >
          Dodaj do koszyka
        </button>
      </div>
    </div>
  );
}
