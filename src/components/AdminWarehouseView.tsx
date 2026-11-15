import React, { useState } from 'react';
import { Database, Plus, RotateCcw, X, Save, Search, Percent, Edit3, Trash2 } from 'lucide-react';
import { PHOTO_LIBRARY, PHOTO_PRESETS, CATEGORIES } from '../constants';

export function AdminWarehouseView({
  products,
  orders,
  projects,
  reviews,
  dbEngine,
  onSaveProduct,
  onDeleteProduct,
  onUpdateStock,
  onResetDatabase
}: any) {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const emptyForm = {
    id: '',
    name: '',
    sku: 'CM-' + Math.floor(700000 + Math.random() * 299999),
    category: 'Materiały budowlane',
    subcategory: 'Ogólnobudowlane',
    brand: '',
    regularPrice: '',
    promoPrice: '',
    stock: '20',
    rating: 5.0,
    reviewCount: 0,
    imageUrl: PHOTO_LIBRARY.cement,
    description: '',
    specsText: 'Waga: 25 kg\nZastosowanie: Wewnątrz i na zewnątrz',
    calcType: '',
    coveragePerUnit: '',
    unitLabel: 'szt.'
  };

  const [formData, setFormData] = useState(emptyForm);

  const openCreateForm = () => {
    setFormData({
      ...emptyForm,
      id: 'prod-' + Date.now(),
      sku: 'CM-' + Math.floor(700000 + Math.random() * 299999),
    });
    setEditingProduct(null);
    setIsCreating(true);
  };

  const openEditForm = (product: any) => {
    const specsLines = Object.entries(product.specs || {})
      .map(([k, v]) => `${k}: ${v}`)
      .join('\n');
    setFormData({
      id: product.id,
      name: product.name,
      sku: product.sku,
      category: product.category,
      subcategory: product.subcategory || '',
      brand: product.brand,
      regularPrice: String(product.regularPrice),
      promoPrice: product.promoPrice ? String(product.promoPrice) : '',
      stock: String(product.stock),
      rating: product.rating,
      reviewCount: product.reviewCount,
      imageUrl: product.imageUrl || PHOTO_LIBRARY.cement,
      description: product.description || '',
      specsText: specsLines,
      calcType: product.calcType || '',
      coveragePerUnit: product.coveragePerUnit ? String(product.coveragePerUnit) : '',
      unitLabel: product.unitLabel || 'szt.'
    });
    setEditingProduct(product.id);
    setIsCreating(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const specsObj: any = {};
    formData.specsText.split('\n').forEach((line) => {
      const idx = line.indexOf(':');
      if (idx > 0) {
        const k = line.slice(0, idx).trim();
        const v = line.slice(idx + 1).trim();
        if (k && v) specsObj[k] = v;
      }
    });

    const regPrice = Math.max(0.01, parseFloat(formData.regularPrice) || 0);
    const prPrice = formData.promoPrice ? parseFloat(formData.promoPrice) : null;

    const payload = {
      id: formData.id,
      name: formData.name.trim(),
      sku: formData.sku.trim(),
      category: formData.category,
      subcategory: formData.subcategory.trim() || 'Inne',
      brand: formData.brand.trim(),
      regularPrice: regPrice,
      promoPrice: prPrice && prPrice < regPrice ? prPrice : null,
      stock: Math.max(0, parseInt(formData.stock, 10) || 0),
      rating: formData.rating,
      reviewCount: formData.reviewCount,
      imageUrl: formData.imageUrl.trim() || PHOTO_LIBRARY.cement,
      description: formData.description.trim(),
      specs: specsObj,
      calcType: formData.calcType || null,
      coveragePerUnit: formData.calcType && formData.coveragePerUnit ? parseFloat(formData.coveragePerUnit) : null,
      unitLabel: formData.unitLabel.trim() || 'szt.',
      unitPriceLabel: null
    };

    onSaveProduct(payload);
    setIsCreating(false);
    setEditingProduct(null);
  };

  const toggleQuickPromo = (product: any) => {
    if (product.promoPrice) {
      onSaveProduct({ ...product, promoPrice: null });
    } else {
      const discounted = Number((product.regularPrice * 0.8).toFixed(2));
      onSaveProduct({ ...product, promoPrice: discounted });
    }
  };

  const filtered = products.filter(
    (p: any) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.brand.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="rounded-xl bg-[#1E78D0] text-white p-6 mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 bg-white/15 px-3 py-1 rounded-full text-xs font-semibold mb-2">
            <Database size={14} /> Silnik bazy: {dbEngine}
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold">Magazyn: zarządzanie produktami</h1>
          <p className="text-blue-100 text-sm mt-1">
            Rekordy w lokalnej bazie: <strong>{products.length}</strong> produktów • <strong>{orders.length}</strong> zamówień • <strong>{projects.length}</strong> projektów • <strong>{reviews.length}</strong> opinii
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={openCreateForm}
            className="inline-flex items-center gap-2 rounded-xl bg-[#1E78D0] hover:bg-[#1763B0] text-white font-semibold text-sm px-4 py-3 cursor-pointer"
          >
            <Plus size={18} /> Dodaj nowy produkt
          </button>

          {!confirmReset ? (
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-white/15 hover:bg-white/25 text-white font-semibold text-sm px-4 py-3 transition cursor-pointer"
            >
              <RotateCcw size={16} /> Resetuj bazę danych
            </button>
          ) : (
            <div className="flex items-center gap-2 bg-white text-slate-900 px-3 py-2 rounded-xl">
              <span className="text-xs font-semibold text-[#C23B1F]">Przywrócić stan fabryczny?</span>
              <button
                type="button"
                onClick={() => {
                  onResetDatabase();
                  setConfirmReset(false);
                }}
                className="bg-[#C23B1F] text-white text-xs font-semibold px-2.5 py-1 rounded-lg cursor-pointer"
              >
                Tak, resetuj
              </button>
              <button
                type="button"
                onClick={() => setConfirmReset(false)}
                className="bg-slate-200 text-slate-700 text-xs font-semibold px-2.5 py-1 rounded-lg cursor-pointer"
              >
                Anuluj
              </button>
            </div>
          )}
        </div>
      </div>

      {isCreating && (
        <form onSubmit={handleFormSubmit} className="bg-white rounded-3xl border shadow-[0_6px_24px_rgba(22,36,71,0.05)] border-[#E3E8F3] p-6 mb-6">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#E9EDF6]">
            <h2 className="text-lg font-semibold text-[#162447]">
              {editingProduct ? 'Edytuj produkt w bazie' : 'Dodaj nowy produkt do asortymentu'}
            </h2>
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="p-1.5 rounded-xl text-slate-500 hover:bg-slate-100 cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nazwa produktu *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="np. Wkrętarka udarowa Makita DHP485"
                className="w-full rounded-xl border border-[#E3E8F3] px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Marka *</label>
              <input
                type="text"
                required
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                placeholder="np. Makita"
                className="w-full rounded-xl border border-[#E3E8F3] px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Kategoria</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full rounded-xl border border-[#E3E8F3] px-3 py-2 text-sm"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Cena regularna (zł) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.regularPrice}
                onChange={(e) => setFormData({ ...formData, regularPrice: e.target.value })}
                className="w-full rounded-xl border border-[#E3E8F3] px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Stan magazynowy (szt.) *</label>
              <input
                type="number"
                required
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                className="w-full rounded-xl border border-[#E3E8F3] px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Zdjęcie produktu</label>
              <div className="space-y-1.5">
                <select
                  value={PHOTO_PRESETS.some((pr) => pr.url === formData.imageUrl) ? formData.imageUrl : ''}
                  onChange={(e) => e.target.value && setFormData({ ...formData, imageUrl: e.target.value })}
                  className="w-full rounded-xl border border-[#E3E8F3] px-3 py-1.5 text-xs bg-[#F7F8FC]"
                >
                  <option value="">-- Wybierz gotowe zdjęcie --</option>
                  {PHOTO_PRESETS.map((pr) => (
                    <option key={pr.label} value={pr.url}>{pr.label}</option>
                  ))}
                </select>
                <input
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full rounded-xl border border-[#E3E8F3] px-3 py-1.5 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Kalkulator zużycia</label>
              <select
                value={formData.calcType}
                onChange={(e) => setFormData({ ...formData, calcType: e.target.value })}
                className="w-full rounded-xl border border-[#E3E8F3] px-3 py-2 text-sm"
              >
                <option value="">Brak kalkulatora</option>
                <option value="paint">Farba (m² + warstwy)</option>
                <option value="tiles">Płytki / Klej (m²)</option>
                <option value="panels">Panele / Płyty / Wełna (m²)</option>
                <option value="plaster">Gładź szpachlowa (m²)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Wydajność (m²) / Jednostka</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.01"
                  disabled={!formData.calcType}
                  value={formData.coveragePerUnit}
                  onChange={(e) => setFormData({ ...formData, coveragePerUnit: e.target.value })}
                  placeholder="np. 2.22"
                  className="w-1/2 rounded-xl border border-[#E3E8F3] px-3 py-2 text-sm disabled:bg-slate-100"
                />
                <input
                  type="text"
                  value={formData.unitLabel}
                  onChange={(e) => setFormData({ ...formData, unitLabel: e.target.value })}
                  placeholder="szt. / op."
                  className="w-1/2 rounded-xl border border-[#E3E8F3] px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Opis produktu</label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full rounded-xl border border-[#E3E8F3] px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Parametry (Klucz: Wartość w nowej linii)</label>
              <textarea
                rows={3}
                value={formData.specsText}
                onChange={(e) => setFormData({ ...formData, specsText: e.target.value })}
                className="w-full rounded-xl border border-[#E3E8F3] px-3 py-2 text-xs tabular-nums"
              />
            </div>
          </div>

          <div className="mt-5 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="rounded-xl border border-[#E3E8F3] px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Anuluj
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl bg-[#1E78D0] hover:bg-[#1763B0] text-white font-semibold text-sm px-5 py-2 cursor-pointer"
            >
              <Save size={16} /> Zapisz w lokalnej bazie
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-3xl border shadow-[0_6px_24px_rgba(22,36,71,0.05)] border-[#E3E8F3] overflow-hidden">
        <div className="p-4 border-b border-[#E9EDF6] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Szukaj po nazwie, SKU lub marce..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-[#E3E8F3] text-sm focus:outline-none focus:border-[#1E78D0]"
            />
          </div>
          <span className="text-xs font-semibold text-[#56626F]">
            Wyświetlono {filtered.length} z {products.length} pozycji magazynowych
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-100 text-slate-600 text-xs text-left border-b border-[#E3E8F3]">
                <th className="py-3 px-4">SKU / Produkt</th>
                <th className="py-3 px-4">Kategoria</th>
                <th className="py-3 px-4">Cena reg.</th>
                <th className="py-3 px-4">Promocja</th>
                <th className="py-3 px-4">Stan magazynowy</th>
                <th className="py-3 px-4 text-right">Akcje</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filtered.map((p: any) => (
                <tr key={p.id} className="hover:bg-[#F7F8FC]/70 transition">
                  <td className="py-3 px-4">
                    <span className="text-[11px] tabular-nums font-semibold text-[#56626F] block">{p.sku}</span>
                    <span className="font-semibold text-slate-900">{p.name}</span>
                    <span className="text-xs text-slate-500 block">{p.brand}</span>
                  </td>
                  <td className="py-3 px-4 text-xs font-semibold text-slate-700">{p.category}</td>
                  <td className="py-3 px-4 font-semibold text-slate-800">
                    {p.regularPrice.toFixed(2).replace('.', ',')} zł
                  </td>
                  <td className="py-3 px-4">
                    <button
                      type="button"
                      onClick={() => toggleQuickPromo(p)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                        p.promoPrice
                          ? 'bg-red-50 text-[#C23B1F] border border-red-200'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <Percent size={12} />
                      {p.promoPrice ? `${p.promoPrice.toFixed(2).replace('.', ',')} zł (Aktywna)` : 'Ustaw -20%'}
                    </button>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-semibold px-2 py-0.5 rounded-lg text-xs whitespace-nowrap ${
                          p.stock === 0
                            ? 'bg-red-100 text-[#C23B1F]'
                            : p.stock < 5
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {p.stock} szt.
                      </span>
                      <button
                        type="button"
                        onClick={() => onUpdateStock(p.id, 10, false)}
                        title="Przyjmij dostawę +10 szt."
                        className="px-2 py-0.5 rounded-lg bg-[#1E78D0] hover:bg-[#1763B0] text-white text-xs font-semibold cursor-pointer"
                      >
                        +10
                      </button>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => openEditForm(p)}
                        title="Edytuj produkt"
                        className="p-2 rounded-xl text-[#162447] hover:bg-[#1E78D0]/10 transition cursor-pointer"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteProduct(p.id)}
                        title="Usuń z bazy"
                        className="p-2 rounded-xl text-[#C23B1F] hover:bg-[#C23B1F]/10 transition cursor-pointer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
