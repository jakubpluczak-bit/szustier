import React, { useState, useEffect } from 'react';
import { Check, Star, CheckCircle2, Store, AlertTriangle, Minus, Plus, ShoppingCart, Heart, ShieldCheck, Truck } from 'lucide-react';
import { ProductImage, PriceDisplay, StarRating, getLocalStoreStock, RenovationCalculator } from './UIComponents';
import { ProductCard } from './ProductCard';

export function ProductDetailView({
  product,
  allProducts,
  selectedStore,
  reviews,
  onBack,
  onOpenProduct,
  onAddToCart,
  onOpenProjectModal,
  onAddReview
}: any) {
  const [qty, setQty] = useState(1);
  const [activeTab, setActiveTab] = useState('description');
  const [author, setAuthor] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  useEffect(() => {
    setQty(1);
    setActiveTab('description');
  }, [product?.id]);

  if (!product) return null;

  const hasPromo = product.promoPrice !== null && product.promoPrice < product.regularPrice;
  const activePrice = hasPromo ? product.promoPrice : product.regularPrice;
  const discountPct = hasPromo
    ? Math.round(((product.regularPrice - product.promoPrice) / product.regularPrice) * 100)
    : 0;
  const localStock = getLocalStoreStock(product, selectedStore.id);
  const productReviews = reviews.filter((r: any) => r.productId === product.id);
  const relatedProducts = (allProducts || [])
    .filter((p: any) => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!author.trim() || !comment.trim()) return;
    onAddReview({
      id: 'rev-' + Date.now(),
      productId: product.id,
      author: author.trim(),
      rating,
      date: new Date().toISOString().slice(0, 10),
      comment: comment.trim(),
    });
    setAuthor('');
    setComment('');
    setRating(5);
    setReviewSubmitted(true);
    setTimeout(() => setReviewSubmitted(false), 3500);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex flex-wrap items-center gap-2 text-xs text-[#56626F] mb-5">
        <button onClick={onBack} className="hover:text-[#162447] font-semibold cursor-pointer">
          Wróć do katalogu
        </button>
        <span>/</span>
        <span>{product.category}</span>
        <span>/</span>
        <span>{product.subcategory}</span>
        <span>/</span>
        <span className="font-semibold text-slate-800">{product.sku}</span>
      </div>

      <div className="bg-white rounded-3xl border shadow-[0_6px_24px_rgba(22,36,71,0.05)] border-[#E3E8F3] p-5 sm:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7">
            <div className="relative rounded-xl border border-[#E9EDF6] bg-slate-50 overflow-hidden">
              {hasPromo && (
                <span className="absolute top-4 left-4 z-10 bg-[#C23B1F] text-white text-sm font-semibold px-2.5 py-1 rounded-lg">
                  Promocja -{discountPct}%
                </span>
              )}
              <ProductImage
                src={product.imageUrl}
                alt={product.name}
                brand={product.brand}
                className="w-full h-72 sm:h-96 rounded-none"
              />
            </div>

            <RenovationCalculator
              product={product}
              onAddCalculatedToCart={(prod: any, count: number) => onAddToCart(prod, count)}
            />

            <div className="mt-8">
              <div className="flex border-b-2 border-[#E9EDF6] gap-2 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setActiveTab('description')}
                  className={`px-4 py-3 text-sm font-semibold border-b-2 -mb-[2px] transition cursor-pointer whitespace-nowrap ${
                    activeTab === 'description'
                      ? 'border-[#1E78D0] text-[#1E78D0]'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Opis produktu
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('specs')}
                  className={`px-4 py-3 text-sm font-semibold border-b-2 -mb-[2px] transition cursor-pointer whitespace-nowrap ${
                    activeTab === 'specs'
                      ? 'border-[#1E78D0] text-[#1E78D0]'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Specyfikacja techniczna
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('reviews')}
                  className={`px-4 py-3 text-sm font-semibold border-b-2 -mb-[2px] transition cursor-pointer whitespace-nowrap ${
                    activeTab === 'reviews'
                      ? 'border-[#1E78D0] text-[#1E78D0]'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Opinie klientów ({productReviews.length})
                </button>
              </div>

              {activeTab === 'description' && (
                <div className="pt-5">
                  <p className="text-slate-700 leading-relaxed text-sm sm:text-base">
                    {product.description}
                  </p>
                </div>
              )}

              {activeTab === 'specs' && (
                <div className="pt-5">
                  <div className="overflow-hidden rounded-xl border border-[#E3E8F3]">
                    <table className="w-full text-sm">
                      <tbody>
                        <tr className="bg-[#F7F8FC]">
                          <td className="py-2.5 px-4 font-semibold text-[#56626F] w-1/2">Kod produktu (SKU)</td>
                          <td className="py-2.5 px-4 font-semibold text-slate-900">{product.sku}</td>
                        </tr>
                        <tr className="bg-white">
                          <td className="py-2.5 px-4 font-semibold text-[#56626F]">Marka / Producent</td>
                          <td className="py-2.5 px-4 font-semibold text-slate-900">{product.brand}</td>
                        </tr>
                        {Object.entries(product.specs || {}).map(([key, val]: any, idx) => (
                          <tr key={key} className={idx % 2 === 0 ? 'bg-[#F7F8FC]' : 'bg-white'}>
                            <td className="py-2.5 px-4 font-semibold text-[#56626F]">{key}</td>
                            <td className="py-2.5 px-4 font-semibold text-slate-900">{val}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'reviews' && (
                <div className="pt-5 space-y-6">
                  <div className="rounded-xl bg-[#F7F8FC] border border-[#E9EDF6] p-4 flex flex-col sm:flex-row items-center gap-6">
                    <div className="text-center sm:border-r sm:border-[#E3E8F3] sm:pr-6">
                      <span className="text-4xl font-bold text-[#162447] block">{Number(product.rating).toFixed(1)}</span>
                      <StarRating rating={product.rating} size={15} />
                      <span className="text-xs text-slate-500 mt-1 block">Na podstawie {product.reviewCount} ocen</span>
                    </div>
                    <div className="flex-1 w-full space-y-1.5">
                      {[5, 4, 3, 2, 1].map((starNum) => {
                        const countForStar = productReviews.filter((r: any) => Math.round(r.rating) === starNum).length;
                        const pct = productReviews.length > 0 ? Math.round((countForStar / productReviews.length) * 100) : (starNum === 5 ? 85 : starNum === 4 ? 15 : 0);
                        return (
                          <div key={starNum} className="flex items-center gap-2 text-xs">
                            <span className="w-8 font-semibold text-slate-700">{starNum} ★</span>
                            <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                              <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="w-8 text-right text-slate-500">{pct}%</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {productReviews.length === 0 ? (
                    <p className="text-sm text-slate-500 bg-[#F7F8FC] p-4 rounded-xl">
                      Ten produkt nie ma jeszcze tekstowych recenzji. Dodaj swoją opinię poniżej.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {productReviews.map((rev: any) => (
                        <div key={rev.id} className="rounded-xl border border-[#E9EDF6] bg-white p-4">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-slate-900 text-sm">{rev.author}</span>
                            <span className="text-xs text-slate-400">{rev.date}</span>
                          </div>
                          <StarRating rating={rev.rating} size={13} />
                          <p className="mt-2 text-sm text-slate-700 leading-relaxed">{rev.comment}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  <form onSubmit={handleReviewSubmit} className="rounded-xl border border-[#E3E8F3] bg-[#F7F8FC] p-5">
                    <h4 className="font-semibold text-[#162447] text-base mb-3">Dodaj swoją opinię</h4>
                    {reviewSubmitted && (
                      <div className="mb-3 p-2.5 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                        <Check size={16} /> Dziękujemy! Opinia została zapisana w lokalnej bazie.
                      </div>
                    )}
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Twoje imię / nazwa firmy</label>
                        <input
                          type="text"
                          required
                          value={author}
                          onChange={(e) => setAuthor(e.target.value)}
                          placeholder="np. Adam Nowak"
                          className="w-full rounded-xl border border-[#E3E8F3] bg-white px-3 py-2 text-sm focus:outline-none focus:border-[#1E78D0]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Ocena produktu</label>
                        <div className="flex items-center gap-1.5">
                          {[1, 2, 3, 4, 5].map((num) => (
                            <button
                              key={num}
                              type="button"
                              onClick={() => setRating(num)}
                              className="p-1 cursor-pointer"
                            >
                              <Star
                                size={24}
                                className={num <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Treść opinii</label>
                        <textarea
                          required
                          rows={3}
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          placeholder="Jak produkt sprawdził się podczas prac remontowych?"
                          className="w-full rounded-xl border border-[#E3E8F3] bg-white px-3 py-2 text-sm focus:outline-none focus:border-[#1E78D0]"
                        />
                      </div>
                      <button
                        type="submit"
                        className="rounded-xl bg-[#1E78D0] hover:bg-[#1763B0] text-white font-semibold text-sm px-5 py-2.5 transition cursor-pointer"
                      >
                        Opublikuj opinię
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="sticky top-24 rounded-xl border border-[#E3E8F3] bg-white p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[#56626F]">
                  {product.brand}
                </span>
                <span className="text-xs text-slate-500">SKU: {product.sku}</span>
              </div>

              <h1 className="text-2xl font-semibold text-slate-900 leading-tight mb-3">
                {product.name}
              </h1>

              <div className="mb-5">
                <StarRating rating={product.rating} count={product.reviewCount} size={16} />
              </div>

              <div className="rounded-xl bg-[#F7F8FC] p-4 mb-5 border border-[#E9EDF6]">
                {hasPromo && (
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm text-slate-400 line-through">
                      {product.regularPrice.toFixed(2).replace('.', ',')} zł
                    </span>
                    <span className="bg-[#C23B1F] text-white text-xs font-semibold px-2 py-0.5 rounded-lg">
                      Oszczędzasz {(product.regularPrice - product.promoPrice).toFixed(2).replace('.', ',')} zł
                    </span>
                  </div>
                )}
                <div className="flex items-baseline justify-between">
                  <PriceDisplay
                    price={activePrice}
                    size="lg"
                    colorClass={hasPromo ? 'text-[#C23B1F]' : 'text-[#162447]'}
                  />
                  <span className="text-xs text-slate-500 font-medium">cena brutto / {product.unitLabel}</span>
                </div>
                {product.coveragePerUnit && (
                  <p className="text-xs text-[#56626F] font-semibold mt-1">
                    Przelicznik: {(activePrice / product.coveragePerUnit).toFixed(2).replace('.', ',')} zł / m²
                  </p>
                )}
              </div>

              <div className="space-y-2.5 mb-6 text-sm">
                {product.stock > 0 ? (
                  <>
                    <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800">
                      <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                      <div>
                        <p className="font-semibold">Dostępny w magazynie centralnym ({product.stock} szt.)</p>
                        <p className="text-xs">Wysyłka kurierem lub transportem HDS w 24h</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#1E78D0]/5 border border-[#1E78D0]/20 text-[#162447]">
                      <Store size={18} className="shrink-0" />
                      <div>
                        <p className="font-semibold">Odbiór w sklepie za 2 h, bezpłatnie</p>
                        <p className="text-xs">
                          {selectedStore.name}: <strong>{localStock} szt.</strong> gotowych do wydania
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-2.5 p-3 rounded-xl bg-[#C23B1F]/10 border border-[#C23B1F]/30 text-[#C23B1F]">
                    <AlertTriangle size={20} />
                    <span className="font-semibold">Produkt chwilowo wyprzedany</span>
                  </div>
                )}

                {product.stock > 0 && product.stock < 5 && (
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#C23B1F]">
                    <AlertTriangle size={15} />
                    <span>Niski stan magazynowy — pozostały tylko {product.stock} szt.</span>
                  </div>
                )}
              </div>

              {product.stock > 0 && (
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center border-2 border-[#8793A1] rounded-xl overflow-hidden bg-white">
                    <button
                      type="button"
                      onClick={() => setQty((q) => Math.max(1, q - 1))}
                      className="p-3 text-slate-700 hover:bg-slate-100 cursor-pointer"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="px-4 font-semibold text-base text-slate-900 min-w-[3rem] text-center">
                      {qty}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
                      className="p-3 text-slate-700 hover:bg-slate-100 cursor-pointer"
                    >
                      <Plus size={16} />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => onAddToCart(product, qty)}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#1E78D0] hover:bg-[#1763B0] text-white font-semibold text-base py-3.5 px-5 transition cursor-pointer"
                  >
                    <ShoppingCart size={20} />
                    Dodaj do koszyka
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={() => onOpenProjectModal(product)}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-[#1E78D0] text-[#1E78D0] hover:bg-[#1E78D0] hover:text-white font-semibold text-sm py-2.5 px-4 transition cursor-pointer"
              >
                <Heart size={17} />
                Zapisz do listy projektowej
              </button>

              <div className="mt-5 pt-4 border-t border-[#E9EDF6] grid grid-cols-2 gap-3 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={16} className="text-[#162447]" />
                  <span>100 dni na darmowy zwrot</span>
                </div>
                <div className="flex items-center gap-2">
                  <Truck size={16} className="text-[#162447]" />
                  <span>Dostawa HDS na budowę</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {relatedProducts.length > 0 && (
        <div className="mt-10">
          <h3 className="text-xl font-semibold text-[#162447] mb-4">
            Produkty powiązane z kategorii „{product.category}”
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {relatedProducts.map((rel: any) => (
              <ProductCard
                key={rel.id}
                product={rel}
                selectedStore={selectedStore}
                onOpenProduct={onOpenProduct}
                onAddToCart={onAddToCart}
                onOpenProjectModal={onOpenProjectModal}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
