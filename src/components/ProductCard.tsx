import React, { useState } from 'react';
import { Heart, Store, ShoppingCart, Check } from 'lucide-react';
import { ProductImage, PriceDisplay, StarRating, getLocalStoreStock } from './UIComponents';

export function ProductCard({ product, selectedStore, onOpenProduct, onAddToCart, onOpenProjectModal, viewMode = 'grid' }: any) {
  const [justAdded, setJustAdded] = useState(false);
  const hasPromo = product.promoPrice !== null && product.promoPrice < product.regularPrice;
  const activePrice = hasPromo ? product.promoPrice : product.regularPrice;
  const discountPct = hasPromo
    ? Math.round(((product.regularPrice - product.promoPrice) / product.regularPrice) * 100)
    : 0;
  const localStock = getLocalStoreStock(product, selectedStore.id);
  const computedUnitPrice =
    product.unitPriceLabel ||
    (product.coveragePerUnit ? `${(activePrice / product.coveragePerUnit).toFixed(2).replace('.', ',')} zł / m²` : null);

  const handleQuickAdd = () => {
    onAddToCart(product, 1);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1200);
  };

  if (viewMode === 'list') {
    return (
      <div className="group bg-white rounded-3xl border shadow-[0_6px_24px_rgba(22,36,71,0.05)] border-[#E3E8F3] hover:border-[#1E78D0] transition-colors p-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-5">
        <div
          onClick={() => onOpenProduct(product.id)}
          className="relative w-full sm:w-48 h-40 shrink-0 cursor-pointer"
        >
          <ProductImage
            src={product.imageUrl}
            alt={product.name}
            brand={product.brand}
            className="w-full h-full border border-[#E9EDF6]"
            imgClassName=""
          />
          {hasPromo && (
            <span className="absolute top-2.5 left-2.5 bg-[#C23B1F] text-white text-[11px] font-bold px-2 py-0.5 rounded-lg">
              -{discountPct}%
            </span>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenProjectModal(product);
            }}
            title="Zapisz do listy projektowej"
            className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-white/90 text-[#8793A1] hover:text-[#C23B1F] transition cursor-pointer"
          >
            <Heart size={16} />
          </button>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-[#162447] text-xs font-semibold">
              {product.brand}
            </span>
            <span className="text-xs text-slate-400 tabular-nums">SKU {product.sku}</span>
            <span className="text-xs text-[#56626F]">{product.subcategory}</span>
          </div>

          <h3
            onClick={() => onOpenProduct(product.id)}
            className="font-semibold text-slate-900 text-base sm:text-lg hover:text-[#162447] cursor-pointer transition-colors"
          >
            {product.name}
          </h3>

          <div className="mt-1.5 mb-2">
            <StarRating rating={product.rating} count={product.reviewCount} size={14} />
          </div>

          <p className="text-xs text-slate-600 line-clamp-2 mb-2.5">{product.description}</p>

          <div className="flex flex-wrap items-center gap-4 text-xs">
            {product.stock > 0 ? (
              <>
                <span className="inline-flex items-center gap-1.5 text-emerald-700 font-semibold">
                  <span className={`w-2 h-2 rounded-full ${product.stock < 5 ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                  Magazyn: {product.stock} szt.
                </span>
                <span className="inline-flex items-center gap-1 text-[#56626F]">
                  <Store size={13} className="text-[#162447]" />
                  Odbiór 2h ({selectedStore.name.replace('CastoMarket ', '')}): <strong>{localStock} szt.</strong>
                </span>
              </>
            ) : (
              <span className="text-[#C23B1F] font-semibold">Brak w magazynie</span>
            )}
          </div>
        </div>

        <div className="sm:w-52 shrink-0 border-t sm:border-t-0 sm:border-l border-[#E9EDF6] pt-3 sm:pt-0 sm:pl-5 flex flex-col justify-between">
          <div>
            {hasPromo ? (
              <>
                <span className="text-xs text-slate-400 line-through block">
                  {product.regularPrice.toFixed(2).replace('.', ',')} zł
                </span>
                <PriceDisplay price={product.promoPrice} size="md" colorClass="text-[#C23B1F]" />
              </>
            ) : (
              <PriceDisplay price={product.regularPrice} size="md" colorClass="text-slate-900" />
            )}
            {computedUnitPrice && (
              <span className="text-[11px] text-[#56626F] font-semibold block mt-1">
                Cena jedn.: <strong>{computedUnitPrice}</strong>
              </span>
            )}
          </div>

          <button
            type="button"
            disabled={product.stock <= 0}
            onClick={handleQuickAdd}
            className={`mt-3 w-full flex items-center justify-center gap-2 rounded-xl font-semibold text-sm py-2.5 px-4 transition cursor-pointer ${
              justAdded
                ? 'bg-emerald-600 text-white'
                : 'bg-[#1E78D0] hover:bg-[#1763B0] disabled:bg-slate-300 text-white'
            }`}
          >
            {justAdded ? <><Check size={16} /> Dodano</> : <><ShoppingCart size={16} /> Dodaj do koszyka</>}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="group bg-white rounded-3xl border shadow-[0_6px_24px_rgba(22,36,71,0.05)] border-[#E3E8F3] hover:border-[#1E78D0] hover:shadow-[0_12px_32px_rgba(22,36,71,0.10)] transition flex flex-col justify-between overflow-hidden">
      <div>
        <div className="relative p-3 pb-0">
          <div
            onClick={() => onOpenProduct(product.id)}
            className="relative cursor-pointer overflow-hidden rounded-xl border border-[#E9EDF6]/80"
          >
            <ProductImage
              src={product.imageUrl}
              alt={product.name}
              brand={product.brand}
              className="w-full h-44"
              imgClassName=""
            />
            <div className="absolute top-2.5 left-2.5 right-10 flex flex-wrap gap-1 pointer-events-none">
              {hasPromo && (
                <span className="inline-flex items-center gap-1 bg-[#C23B1F] text-white text-[11px] font-bold px-2.5 py-0.5 rounded-lg">
                  -{discountPct}%
                </span>
              )}
              {product.stock > 0 && product.stock < 5 && (
                <span className="inline-flex items-center gap-1 bg-amber-500 text-white text-[10px] font-semibold px-2 py-0.5 rounded-lg">
                  Ostatnie {product.stock} szt.
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => onOpenProjectModal(product)}
            title="Zapisz do listy projektowej"
            className="absolute top-5 right-5 p-2 rounded-full bg-white/95 text-[#8793A1] hover:text-[#C23B1F] border border-[#E9EDF6]/70 transition cursor-pointer"
          >
            <Heart size={16} />
          </button>
        </div>

        <div className="p-4 pt-3">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-[#162447] text-xs font-semibold">
              {product.brand}
            </span>
            <span className="text-xs text-slate-400 tabular-nums">SKU {product.sku}</span>
          </div>

          <h3
            onClick={() => onOpenProduct(product.id)}
            className="font-semibold text-slate-900 text-sm leading-snug line-clamp-2 min-h-[2.5rem] hover:text-[#162447] cursor-pointer transition-colors"
          >
            {product.name}
          </h3>

          <div className="mt-2">
            <StarRating rating={product.rating} count={product.reviewCount} size={13} />
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-1">
            {product.stock > 0 ? (
              <>
                <div className="flex items-center gap-1.5 text-xs font-semibold">
                  <span
                    className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                      product.stock < 5 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                  />
                  <span className={product.stock < 5 ? 'text-amber-700' : 'text-emerald-700'}>
                    W magazynie: {product.stock} szt.
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-[#56626F]">
                  <Store size={12} className="shrink-0 text-[#162447]" />
                  <span className="truncate">
                    Odbiór 2h ({selectedStore.name.replace('CastoMarket ', '')}): <strong>{localStock} szt.</strong>
                  </span>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-[#C23B1F] font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-[#C23B1F] shrink-0" />
                <span>Chwilowo brak w magazynie</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 pb-4 pt-1">
        <div className="mb-3 bg-[#F7F8FC]/80 rounded-xl p-2.5 border border-[#E9EDF6]/70">
          {hasPromo ? (
            <div className="flex flex-col">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 line-through font-semibold">
                  {product.regularPrice.toFixed(2).replace('.', ',')} zł
                </span>
                <span className="text-[10px] font-semibold text-[#C23B1F]">
                  Taniej o {(product.regularPrice - product.promoPrice).toFixed(2).replace('.', ',')} zł
                </span>
              </div>
              <PriceDisplay price={product.promoPrice} size="md" colorClass="text-[#C23B1F]" />
            </div>
          ) : (
            <div className="pt-2">
              <PriceDisplay price={product.regularPrice} size="md" colorClass="text-slate-900" />
            </div>
          )}
          <p className="text-[11px] text-[#56626F] font-medium mt-1 min-h-[16px]">
            {computedUnitPrice ? (
              <>Cena jedn.: <strong>{computedUnitPrice}</strong></>
            ) : (
              <>Jednostka sprzedaży: <strong>{product.unitLabel}</strong></>
            )}
          </p>
        </div>

        <button
          type="button"
          disabled={product.stock <= 0}
          onClick={handleQuickAdd}
          className={`w-full flex items-center justify-center gap-2 rounded-xl font-semibold text-sm py-2.5 px-3 transition cursor-pointer ${
            justAdded
              ? 'bg-emerald-600 text-white'
              : 'bg-[#1E78D0] hover:bg-[#1763B0] disabled:bg-slate-300 text-white'
          }`}
        >
          {justAdded ? (
            <>
              <Check size={16} /> Dodano do koszyka
            </>
          ) : (
            <>
              <ShoppingCart size={16} /> {product.stock > 0 ? 'Dodaj do koszyka' : 'Niedostępny'}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
