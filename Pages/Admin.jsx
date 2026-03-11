import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  BarChart3,
  ChevronDown,
  Download,
  Eye,
  MoreHorizontal,
  Package,
  Pencil,
  Plus,
  Search,
  Settings,
  Share2,
  ShoppingCart,
  Upload,
  Users,
  X,
} from 'lucide-react';
import '../src/admin-crm.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const AUTH_KEY = 'mototom_crm_auth';
const ORDER_DRAFT_KEY = 'mototom_crm_order_draft_v2';
const LOOK_FORM_INITIAL = {
  name: '',
  slug: '',
  look_categories: ['Город'],
  description: '',
  cover_image_url: '',
  cover_image_name: '',
  is_active: true,
  product_ids: [],
};
const LOOK_CATEGORY_OPTIONS = ['Город', 'Спорт', 'Классика', 'Туризм', 'Новинки'];

const TABS = [
  { key: 'products', label: 'Товары', Icon: Package },
  { key: 'orders', label: 'Заказы', Icon: ShoppingCart },
  { key: 'customers', label: 'Клиенты', Icon: Users },
  { key: 'categories', label: 'Категории', Icon: BarChart3 },
  { key: 'looks', label: 'Образы', Icon: Share2 },
  { key: 'brands', label: 'Бренды', Icon: Upload },
  { key: 'settings', label: 'Настройки', Icon: Settings },
  { key: 'messages', label: 'Сообщения', Icon: Share2 },
  { key: 'blockedIps', label: 'IP-блок', Icon: Download },
];

const ORDER_STATUSES = [
  { value: 'new', label: 'Новый' },
  { value: 'confirmed', label: 'Подтвержден' },
  { value: 'packed', label: 'Сборка' },
  { value: 'shipped', label: 'Отправлен' },
  { value: 'delivered', label: 'Доставлен' },
  { value: 'cancelled', label: 'Отменен' },
  { value: 'returned', label: 'Возврат' },
];

async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  if (!res.ok) {
    let message = `Ошибка ${res.status}`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      // noop
    }
    throw new Error(message);
  }
  return res.status === 204 ? null : res.json();
}

function normalizePhone(value) {
  return String(value || '').replace(/\D/g, '');
}

function resolveImageUrl(path) {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const base = API_URL.replace(/\/$/, '');
  return `${base}${path.startsWith('/') ? '' : '/'}${path}`;
}

function getOrderTotal(order) {
  return Number(order?.total ?? order?.total_amount ?? 0) || 0;
}

async function copyText(value, label = 'Текст') {
  try {
    await navigator.clipboard.writeText(String(value || ''));
    toast.success(`${label} скопирован`);
  } catch {
    toast.error('Не удалось скопировать');
  }
}

function Card({ title, subtitle, action, children }) {
  return (
    <section className="overflow-hidden rounded-[10px] border border-[#1E1E22] bg-[#0D0D0F]">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#1E1E22] px-8 py-4">
        <div className="min-w-0">
          <h2 className="text-[20px] font-bold text-[#FAFAF9]">{title}</h2>
          {subtitle ? <p className="mt-1 text-[13px] text-[#6B6B70]">{subtitle}</p> : null}
        </div>
        {action}
      </div>
      <div className="px-8 py-5">{children}</div>
    </section>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-xl border border-[#27272d] bg-[#17171b] p-4">
      <p className="text-xs text-[#8a8a91]">{label}</p>
      <p className="mt-2 text-2xl font-bold text-white">{value}</p>
    </div>
  );
}

function ProductModal({ open, onClose, onSubmit, categories, brands, initial, onCreateBrand }) {
  const [form, setForm] = useState({});
  const [images, setImages] = useState([]);
  const [mainImageIndex, setMainImageIndex] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [model, setModel] = useState('');
  const [templateLoading, setTemplateLoading] = useState(false);
  const [templateCandidates, setTemplateCandidates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [brandSearch, setBrandSearch] = useState('');
  const [brandDropdownOpen, setBrandDropdownOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const nextForm = initial || {
      name: '',
      description: '',
      brand: '',
      price: '',
      original_price: '',
      stock_qty: '',
      category_id: '',
      subcategory_id: '',
      subsubcategory_id: '',
      category_id_2: '',
      featured: false,
      popular: false,
      on_sale: false,
      condition: 'new',
      rating: '',
    };
    const normalizedStock = nextForm.stock_qty === '' || nextForm.stock_qty == null ? '' : Math.max(0, Number(nextForm.stock_qty ?? 0) || 0);
    const isUsed = String(nextForm.condition || 'new').toLowerCase() === 'used';
    setForm({
      ...nextForm,
      stock_qty: isUsed ? 1 : normalizedStock,
    });
    const modelFromName =
      nextForm.brand && String(nextForm.name || '').toLowerCase().startsWith(String(nextForm.brand).toLowerCase())
        ? String(nextForm.name).slice(String(nextForm.brand).length).trim()
        : '';
    setModel(modelFromName);
    setTemplateCandidates([]);
    setSelectedTemplate(null);
    setBrandSearch(nextForm.brand || '');
    setBrandDropdownOpen(false);
    const nextImages = [];
    if (nextForm.image_url) nextImages.push(nextForm.image_url);
    if (Array.isArray(nextForm.images)) {
      nextForm.images.forEach((img) => {
        if (img && !nextImages.includes(img)) nextImages.push(img);
      });
    }
    setImages(nextImages);
    setMainImageIndex(0);
  }, [initial, open]);

  useEffect(() => {
    if (!open) return undefined;
    const brand = String(form.brand || '').trim();
    const modelQuery = String(model || '').trim();
    if (!brand || !modelQuery) {
      setTemplateCandidates([]);
      setSelectedTemplate(null);
      return undefined;
    }
    const timer = setTimeout(async () => {
      try {
        setTemplateLoading(true);
        const params = new URLSearchParams({ brand, model: modelQuery, limit: '8' });
        const result = await request(`/api/products/templates?${params.toString()}`);
        setTemplateCandidates(Array.isArray(result) ? result : []);
      } catch {
        setTemplateCandidates([]);
        setSelectedTemplate(null);
      } finally {
        setTemplateLoading(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [form.brand, model, open]);

  const filteredBrands = useMemo(() => {
    const q = String(brandSearch || '').trim().toLowerCase();
    const list = (brands || []).filter(Boolean);
    if (!q) return list;
    return list.filter((b) => String(b.name || '').toLowerCase().includes(q));
  }, [brands, brandSearch]);

  if (!open) return null;

  const roots = categories.filter((x) => x.parent_id == null);
  const children = categories.filter((x) => String(x.parent_id) === String(form.category_id || ''));
  const grandChildren = form.subcategory_id
    ? categories.filter((x) => String(x.parent_id) === String(form.subcategory_id))
    : categories.filter((x) => children.some((child) => String(child.id) === String(x.parent_id || '')));

  const applyTemplate = (tpl) => {
    const inferredModel = String(tpl?.model || '').trim() || (
      tpl?.brand && String(tpl.name || '').toLowerCase().startsWith(String(tpl.brand).toLowerCase())
        ? String(tpl.name).slice(String(tpl.brand).length).trim()
        : String(model || '')
    );
    if (inferredModel) setModel(inferredModel);
    setForm((prev) => ({
      ...prev,
      name: String(tpl.name || '').trim() || prev.name || '',
      description: tpl.description || prev.description || '',
      price: tpl.price ?? prev.price ?? '',
      original_price: tpl.original_price ?? prev.original_price ?? '',
      category_id: tpl.category_id || prev.category_id || '',
      subcategory_id: tpl.subcategory_id || prev.subcategory_id || '',
      subsubcategory_id: tpl.subsubcategory_id || prev.subsubcategory_id || '',
      category_id_2: tpl.category_id_2 || prev.category_id_2 || '',
      condition: tpl.condition || prev.condition || 'new',
      featured: typeof tpl.featured === 'boolean' ? tpl.featured : prev.featured,
      popular: typeof tpl.popular === 'boolean' ? tpl.popular : prev.popular,
      on_sale: typeof tpl.on_sale === 'boolean' ? tpl.on_sale : prev.on_sale,
      rating: tpl.rating ?? prev.rating ?? '',
      stock_qty: String(tpl.condition || prev.condition || 'new').toLowerCase() === 'used'
        ? 1
        : Math.max(0, Number(tpl.stock_qty ?? prev.stock_qty ?? 0) || 0),
    }));
    const nextImages = [];
    if (tpl.image_url) nextImages.push(tpl.image_url);
    if (Array.isArray(tpl.images)) {
      tpl.images.forEach((img) => {
        if (img && !nextImages.includes(img)) nextImages.push(img);
      });
    }
    setImages(nextImages);
    setMainImageIndex(0);
    setSelectedTemplate(tpl);
    toast.success('Шаблон применен');
  };

  const uploadFiles = async (fileList) => {
    const files = Array.from(fileList || []);
    if (files.length === 0) return;
    try {
      setUploading(true);
      const data = new FormData();
      files.forEach((file) => data.append('images', file));
      const response = await fetch(`${API_URL}/api/upload/images`, {
        method: 'POST',
        body: data,
      });
      if (!response.ok) throw new Error('Не удалось загрузить изображения');
      const payload = await response.json();
      const uploaded = (payload.filePaths || []).filter(Boolean);
      setImages((prev) => [...prev, ...uploaded.filter((x) => !prev.includes(x))]);
      toast.success('Изображения загружены');
    } catch (error) {
      toast.error(error.message || 'Ошибка загрузки изображений');
    } finally {
      setUploading(false);
    }
  };

  const save = () => {
    const brand = String(form.brand || '').trim();
    const modelValue = String(model || '').trim();
    const autoName = String(form.name || '').trim() || `${brand} ${modelValue}`.trim();
    const isUsed = String(form.condition || 'new').toLowerCase() === 'used';
    const stockQty = isUsed ? 1 : Math.max(0, Number(form.stock_qty || 0) || 0);
    onSubmit({
      ...form,
      name: autoName,
      brand,
      model: modelValue,
      image_url: images[mainImageIndex] || null,
      images,
      stock_qty: stockQty,
      in_stock: stockQty > 0,
    });
  };

  return (
    <div className="fixed inset-0 z-[120] bg-black/60 p-6" onClick={onClose}>
      <div className="mx-auto max-h-[92vh] w-full max-w-4xl overflow-auto rounded-2xl border border-[#2b2b31] bg-[#131317] p-5" onClick={(e) => e.stopPropagation()}>
        <h3 className="mb-4 text-lg font-bold text-white">{initial?.id ? 'Редактирование товара' : 'Добавление товара'}</h3>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="relative w-full">
                <input
                  className="crm-input"
                  placeholder="Бренд (поиск по списку)"
                  value={brandSearch}
                  onFocus={() => setBrandDropdownOpen(true)}
                  onBlur={() => setTimeout(() => setBrandDropdownOpen(false), 120)}
                  onChange={(e) => {
                    const value = e.target.value;
                    setBrandSearch(value);
                    setForm((p) => ({ ...p, brand: value }));
                    setSelectedTemplate(null);
                    setBrandDropdownOpen(true);
                  }}
                />
                {brandDropdownOpen && filteredBrands.length > 0 ? (
                  <div className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-[#2d2d32] bg-[#16161a] p-1 shadow-lg">
                    {filteredBrands.slice(0, 15).map((b) => (
                      <button
                        key={b.id || b.name}
                        type="button"
                        className="block w-full rounded-md px-3 py-2 text-left text-sm text-[#d2d2d8] hover:bg-[#1f1f24] hover:text-white"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          setBrandSearch(b.name);
                          setForm((p) => ({ ...p, brand: b.name }));
                          setSelectedTemplate(null);
                          setBrandDropdownOpen(false);
                        }}
                      >
                        {b.name}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#2d2d32] text-base text-[#d2d2d8]"
                title="Создать бренд"
                onClick={async () => {
                  const name = window.prompt('Введите название нового бренда');
                  if (!name || !name.trim()) return;
                  const created = await onCreateBrand(name.trim());
                  if (created?.name) {
                    setBrandSearch(created.name);
                    setForm((p) => ({ ...p, brand: created.name }));
                    setBrandDropdownOpen(false);
                  }
                }}
              >
                +
              </button>
            </div>
          </div>
          <input className="crm-input" placeholder="Модель (вручную)" value={model} onChange={(e) => { setModel(e.target.value); setSelectedTemplate(null); }} />
          <input className="crm-input md:col-span-2" placeholder="Название товара (если пусто, соберется из бренда + модели)" value={form.name || ''} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
          <div className="rounded-lg border border-[#2a2a2e] bg-[#16161a] p-3 md:col-span-2">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm text-[#fafaf9]">Найденные шаблоны</p>
              <span className="text-xs text-[#8f8f95]">{templateLoading ? 'Поиск...' : `${templateCandidates.length} шт`}</span>
            </div>
            {!form.brand || !model ? (
              <p className="text-xs text-[#8f8f95]">Введите бренд и модель, чтобы искать шаблон</p>
            ) : templateCandidates.length === 0 ? (
              <p className="text-xs text-[#8f8f95]">Шаблон не найден, при сохранении создастся новый</p>
            ) : (
              <div className="space-y-2">
                {templateCandidates.map((tpl) => (
                  <button key={tpl.id} type="button" className="flex w-full items-center justify-between rounded-md border border-[#2d2d32] px-3 py-2 text-left hover:border-[#54A0C5]" onClick={() => applyTemplate(tpl)}>
                    <span className="text-sm text-white">{tpl.name}</span>
                    <span className="text-xs text-[#a7a7ad]">{Number(tpl.price || 0).toLocaleString('ru-RU')} ₽</span>
                  </button>
                ))}
              </div>
            )}
            {selectedTemplate ? (
              <p className="mt-2 text-xs text-[#F87171]">
                Этот товар уже создан в системе{(Number(selectedTemplate.stock_qty ?? (selectedTemplate.in_stock ? 1 : 0)) > 0) ? ' и активен (в наличии)' : ''}.
              </p>
            ) : null}
          </div>
          <input className="crm-input" placeholder="Цена" type="text" inputMode="decimal" value={form.price || ''} onChange={(e) => setForm((p) => ({ ...p, price: e.target.value.replace(',', '.') }))} />
          <input className="crm-input" placeholder="Старая цена (необязательно)" type="text" inputMode="decimal" value={form.original_price || ''} onChange={(e) => setForm((p) => ({ ...p, original_price: e.target.value.replace(',', '.') }))} />
          <select className="crm-input crm-select" value={form.category_id || ''} onChange={(e) => setForm((p) => ({ ...p, category_id: e.target.value, subcategory_id: '', subsubcategory_id: '' }))}>
            <option value="">Категория</option>
            {roots.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select className="crm-input crm-select" value={form.subcategory_id || ''} onChange={(e) => setForm((p) => ({ ...p, subcategory_id: e.target.value, subsubcategory_id: '' }))}>
            <option value="">Подкатегория (необязательно)</option>
            {children.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select
            className="crm-input crm-select"
            value={form.subsubcategory_id || ''}
            onChange={(e) => {
              const selectedId = e.target.value;
              const selectedNode = grandChildren.find((c) => String(c.id) === String(selectedId));
              setForm((p) => ({
                ...p,
                subsubcategory_id: selectedId,
                subcategory_id: selectedNode?.parent_id ? String(selectedNode.parent_id) : p.subcategory_id,
              }));
            }}
            disabled={!form.category_id}
          >
            <option value="">ПодПодКатегория (необязательно)</option>
            {grandChildren.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select className="crm-input crm-select" value={form.category_id_2 || ''} onChange={(e) => setForm((p) => ({ ...p, category_id_2: e.target.value }))}>
            <option value="">2-я категория (необязательно)</option>
            {roots.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <div className="rounded-lg border border-[#2a2a2e] bg-[#16161a] p-3 md:col-span-2">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm text-[#fafaf9]">Фото товара</p>
              <label className="cursor-pointer rounded-md border border-[#2d2d32] px-3 py-1.5 text-xs text-[#d2d2d8]">
                {uploading ? 'Загрузка...' : 'Добавить файлы'}
                <input type="file" accept="image/*" multiple className="hidden" disabled={uploading} onChange={(e) => uploadFiles(e.target.files)} />
              </label>
            </div>
            {images.length === 0 ? <p className="text-xs text-[#8f8f95]">Фотографии пока не добавлены</p> : null}
            <div className="grid grid-cols-3 gap-2 md:grid-cols-5">
              {images.map((img, idx) => (
                <div key={`${img}-${idx}`} className={`relative overflow-hidden rounded-md border ${idx === mainImageIndex ? 'border-[#54a0c5]' : 'border-[#2a2a2e]'}`}>
                  <img src={resolveImageUrl(img)} alt="" className="h-20 w-full object-cover" />
                  <div className="absolute inset-x-0 bottom-0 flex justify-between bg-black/55 p-1">
                    <button type="button" className="text-[10px] text-white" onClick={() => setMainImageIndex(idx)}>{idx === mainImageIndex ? 'Главное' : 'Сделать главным'}</button>
                    <button
                      type="button"
                      className="text-[10px] text-[#ff9a9a]"
                      onClick={() => {
                        setImages((prev) => prev.filter((_, i) => i !== idx));
                        setMainImageIndex((prev) => (idx === prev ? 0 : prev > idx ? prev - 1 : prev));
                      }}
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <textarea className="crm-input min-h-[96px] !pt-3 md:col-span-2" placeholder="Описание" value={form.description || ''} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
          <div className="flex items-center gap-2 rounded-lg border border-[#2a2a2e] bg-[#16161a] p-1">
            <button
              type="button"
              className={`rounded-md px-3 py-2 text-sm ${String(form.condition || 'new') === 'new' ? 'bg-[#54A0C5] text-white' : 'text-[#A0A0A5]'}`}
              onClick={() => setForm((prev) => ({ ...prev, condition: 'new', stock_qty: prev.stock_qty === 1 ? '' : prev.stock_qty }))}
            >
              Новое
            </button>
            <button
              type="button"
              className={`rounded-md px-3 py-2 text-sm ${String(form.condition || 'new') === 'used' ? 'bg-[#54A0C5] text-white' : 'text-[#A0A0A5]'}`}
              onClick={() => setForm((prev) => ({ ...prev, condition: 'used', stock_qty: 1 }))}
            >
              Б/У
            </button>
          </div>
          <input
            className="crm-input"
            placeholder="Количество"
            type="number"
            min={0}
            value={String(form.condition || 'new').toLowerCase() === 'used' ? 1 : (form.stock_qty ?? '')}
            disabled={String(form.condition || 'new').toLowerCase() === 'used'}
            onChange={(e) => setForm((p) => ({ ...p, stock_qty: e.target.value === '' ? '' : Math.max(0, Number(e.target.value || 0) || 0) }))}
          />
          <input className="crm-input" placeholder="Рейтинг (необязательно)" type="number" step="0.1" min={0} max={5} value={form.rating ?? ''} onChange={(e) => setForm((p) => ({ ...p, rating: e.target.value }))} />
          <div className="flex items-center gap-4 rounded-lg border border-[#2a2a2e] bg-[#16161a] px-3 py-2">
            <label className="text-sm text-[#d2d2d8]"><input type="checkbox" checked={!!form.featured} onChange={(e) => setForm((p) => ({ ...p, featured: e.target.checked }))} /> Хит</label>
            <label className="text-sm text-[#d2d2d8]"><input type="checkbox" checked={!!form.popular} onChange={(e) => setForm((p) => ({ ...p, popular: e.target.checked }))} /> Популярное</label>
            <label className="text-sm text-[#d2d2d8]"><input type="checkbox" checked={!!form.on_sale} onChange={(e) => setForm((p) => ({ ...p, on_sale: e.target.checked }))} /> Акция</label>
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button className="crm-outline-btn rounded-lg border px-4 py-2 text-sm" onClick={onClose}>Отмена</button>
          <button className="crm-primary-btn rounded-lg px-4 py-2 text-sm font-medium" onClick={save}>Сохранить</button>
        </div>
      </div>
    </div>
  );
}

export default function Admin() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState('products');
  const [isAuth, setIsAuth] = useState(localStorage.getItem(AUTH_KEY) === '1');
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [search, setSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('');
  const [productSubcategoryFilter, setProductSubcategoryFilter] = useState('');
  const [productSubsubcategoryFilter, setProductSubsubcategoryFilter] = useState('');
  const [productStockFilter, setProductStockFilter] = useState('');
  const [productAvitoFilter, setProductAvitoFilter] = useState('');
  const [productBrandFilter, setProductBrandFilter] = useState('');
  const [productPriceSort, setProductPriceSort] = useState('default');
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [ordersSearch, setOrdersSearch] = useState('');
  const [ordersSort, setOrdersSort] = useState('newest');
  const [customersSearch, setCustomersSearch] = useState('');
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [orderBuilderOpen, setOrderBuilderOpen] = useState(false);
  const [orderClientSearch, setOrderClientSearch] = useState('');
  const [orderDiscountType, setOrderDiscountType] = useState('none');
  const [orderDiscountValue, setOrderDiscountValue] = useState('');
  const [orderProductSearch, setOrderProductSearch] = useState('');
  const [quickProductModalOpen, setQuickProductModalOpen] = useState(false);
  const [quickProductForm, setQuickProductForm] = useState({ brand: '', model: '', category_id: '', condition: 'new' });
  const [quickSelectedTemplate, setQuickSelectedTemplate] = useState(null);
  const [quickProductTemplates, setQuickProductTemplates] = useState([]);
  const [quickTemplateLoading, setQuickTemplateLoading] = useState(false);
  const [quickProductBrandSearch, setQuickProductBrandSearch] = useState('');
  const [quickProductBrandOpen, setQuickProductBrandOpen] = useState(false);
  const [quickProductSaving, setQuickProductSaving] = useState(false);
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [categoryEditModalOpen, setCategoryEditModalOpen] = useState(false);
  const [brandModalOpen, setBrandModalOpen] = useState(false);
  const [lookModalOpen, setLookModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [isCustomerProfileEdit, setIsCustomerProfileEdit] = useState(false);
  const [customerProfileForm, setCustomerProfileForm] = useState({ full_name: '', phone: '', email: '', note: '' });
  const [showFullCategoryTree, setShowFullCategoryTree] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingBrand, setEditingBrand] = useState(null);
  const [editingLook, setEditingLook] = useState(null);
  const [newCategory, setNewCategory] = useState({ name: '', parent_id: '', product_name_prefix: '' });
  const [categoryEditForm, setCategoryEditForm] = useState({ name: '', parent_id: '', product_name_prefix: '' });
  const [newBrand, setNewBrand] = useState({ name: '', sort_order: 0, popular: false });
  const [newCustomer, setNewCustomer] = useState({ full_name: '', phone: '', email: '', note: '' });
  const [lookForm, setLookForm] = useState(LOOK_FORM_INITIAL);
  const [lookProductSearch, setLookProductSearch] = useState('');
  const [orderForm, setOrderForm] = useState({
    customer_name: '',
    customer_email: '',
    phone: '',
    payment_method: 'cash',
    delivery_type: 'pickup',
    courier_region: 'moscow',
    courier_address: '',
    tk_city: '',
    tk_index: '',
    tk_address: '',
    tk_recipient_name: '',
    tk_recipient_phone: '',
    items: [],
  });
  const [newIp, setNewIp] = useState({ ip_address: '', reason: '' });

  const productsQ = useQuery({ queryKey: ['crm-products'], queryFn: () => request('/api/products'), enabled: isAuth });
  const ordersQ = useQuery({ queryKey: ['crm-orders'], queryFn: () => request('/api/orders?archived=false'), enabled: isAuth });
  const customersQ = useQuery({ queryKey: ['crm-customers'], queryFn: () => request('/api/customers'), enabled: isAuth });
  const categoriesQ = useQuery({ queryKey: ['crm-categories'], queryFn: () => request('/api/categories?all=true'), enabled: isAuth });
  const looksQ = useQuery({ queryKey: ['crm-looks'], queryFn: () => request('/api/looks'), enabled: isAuth });
  const brandsQ = useQuery({ queryKey: ['crm-brands'], queryFn: () => request('/api/brands'), enabled: isAuth });
  const productBrandsQ = useQuery({ queryKey: ['crm-product-brands'], queryFn: () => request('/api/products/brands'), enabled: isAuth });
  const settingsQ = useQuery({ queryKey: ['crm-settings'], queryFn: () => request('/api/settings'), enabled: isAuth });
  const messagesQ = useQuery({ queryKey: ['crm-messages'], queryFn: () => request('/api/messages'), enabled: isAuth });
  const blockedQ = useQuery({ queryKey: ['crm-blocked'], queryFn: () => request('/api/blocked-ips'), enabled: isAuth });

  const categories = categoriesQ.data || [];
  const products = productsQ.data || [];
  const byParent = useMemo(() => {
    const map = {};
    categories.forEach((c) => {
      const key = c.parent_id == null ? 'root' : String(c.parent_id);
      if (!map[key]) map[key] = [];
      map[key].push(c);
    });
    return map;
  }, [categories]);
  const rootCategories = byParent.root || [];
  const productSubcategoryOptions = productCategoryFilter ? (byParent[String(productCategoryFilter)] || []) : [];
  const productSubsubcategoryOptions = productSubcategoryFilter ? (byParent[String(productSubcategoryFilter)] || []) : [];
  const mergedBrandOptions = useMemo(() => {
    const fromBrands = (brandsQ.data || []).map((b) => String(b.name || '').trim()).filter(Boolean);
    const fromProducts = (productBrandsQ.data || []).map((b) => String(b || '').trim()).filter(Boolean);
    return Array.from(new Set([...fromBrands, ...fromProducts])).sort((a, b) => a.localeCompare(b, 'ru'));
  }, [brandsQ.data, productBrandsQ.data]);

  const filteredProducts = useMemo(() => {
    let list = products;
    if (productCategoryFilter) list = list.filter((p) => String(p.category_id || '') === String(productCategoryFilter));
    if (productSubcategoryFilter) list = list.filter((p) => String(p.subcategory_id || '') === String(productSubcategoryFilter));
    if (productSubsubcategoryFilter) list = list.filter((p) => String(p.subsubcategory_id || '') === String(productSubsubcategoryFilter));
    if (productStockFilter === 'in_stock') list = list.filter((p) => !!p.in_stock);
    if (productStockFilter === 'out_of_stock') list = list.filter((p) => !p.in_stock);
    if (productAvitoFilter === 'on') list = list.filter((p) => !!(p.avito_sync || p.on_avito));
    if (productAvitoFilter === 'off') list = list.filter((p) => !(p.avito_sync || p.on_avito));
    if (productBrandFilter) list = list.filter((p) => String(p.brand || '') === String(productBrandFilter));
    const q = search.trim().toLowerCase();
    if (q) list = list.filter((p) => `${p.name || ''} ${p.brand || ''} ${p.sku || ''}`.toLowerCase().includes(q));
    if (productPriceSort === 'price_asc') list = [...list].sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
    if (productPriceSort === 'price_desc') list = [...list].sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
    return list;
  }, [products, productCategoryFilter, productSubcategoryFilter, productSubsubcategoryFilter, productStockFilter, productAvitoFilter, productBrandFilter, productPriceSort, search]);

  const filteredOrders = useMemo(() => {
    const q = ordersSearch.trim().toLowerCase();
    let list = [...(ordersQ.data || [])];
    if (q) {
      list = list.filter((o) => {
        const phone = normalizePhone(o?.shipping_address?.phone || '');
        return `${o.order_number || ''} ${o.customer_name || ''} ${phone}`.toLowerCase().includes(q);
      });
    }
    if (ordersSort === 'oldest') list.sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));
    if (ordersSort === 'total_desc') list.sort((a, b) => Number(b.total || 0) - Number(a.total || 0));
    if (ordersSort === 'total_asc') list.sort((a, b) => Number(a.total || 0) - Number(b.total || 0));
    if (ordersSort === 'newest') list.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    return list;
  }, [ordersQ.data, ordersSearch, ordersSort]);

  const selectedCustomerOrders = useMemo(() => {
    if (!selectedCustomer) return [];
    const customerPhone = normalizePhone(selectedCustomer.phone || '');
    const customerEmail = String(selectedCustomer.email || '').trim().toLowerCase();
    const customerName = String(selectedCustomer.full_name || '').trim().toLowerCase();
    return (ordersQ.data || [])
      .filter((o) => {
        const orderPhone = normalizePhone(o?.shipping_address?.phone || '');
        const orderEmail = String(o.customer_email || '').trim().toLowerCase();
        const orderName = String(o.customer_name || '').trim().toLowerCase();
        return (
          (customerPhone && orderPhone && customerPhone === orderPhone) ||
          (customerEmail && orderEmail && customerEmail === orderEmail) ||
          (customerName && orderName && customerName === orderName)
        );
      })
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  }, [selectedCustomer, ordersQ.data]);

  const selectedOrderItems = useMemo(() => {
    const list = Array.isArray(selectedOrder?.items) ? selectedOrder.items : [];
    return list.map((line) => {
      const productId = String(line?.product_id || '');
      const product = products.find((p) => String(p.id) === productId) || null;
      const qty = Math.max(1, Number(line?.qty ?? line?.quantity ?? 1) || 1);
      const price = Number(line?.price ?? product?.price ?? 0) || 0;
      return {
        ...line,
        productId,
        productName: line?.name || line?.product_name || product?.name || `Товар ${productId}`,
        qty,
        price,
        lineTotal: qty * price,
      };
    });
  }, [selectedOrder, products]);

  const filteredCustomers = useMemo(() => {
    const list = customersQ.data || [];
    const q = customersSearch.trim().toLowerCase();
    if (!q) return list;
    const digits = normalizePhone(q);
    return list.filter((c) => {
      const phone = normalizePhone(c.phone || '');
      const last4 = phone.slice(-4);
      return `${c.full_name || ''} ${c.phone || ''}`.toLowerCase().includes(q) || (!!digits && last4 === digits.slice(-4));
    });
  }, [customersQ.data, customersSearch]);

  const matchedCustomersForOrder = useMemo(() => {
    const q = orderClientSearch.trim().toLowerCase();
    if (!q) return [];
    const digits = normalizePhone(q);
    return (customersQ.data || [])
      .filter((c) => {
        const phone = normalizePhone(c.phone || '');
        const last4 = phone.slice(-4);
        return `${c.full_name || ''} ${c.phone || ''}`.toLowerCase().includes(q) || (!!digits && last4 === digits.slice(-4));
      })
      .slice(0, 10);
  }, [customersQ.data, orderClientSearch]);
  const orderProductOptions = useMemo(() => {
    const q = orderProductSearch.trim().toLowerCase();
    let list = products;
    if (q) {
      list = products.filter((p) =>
        `${p.name || ''} ${p.brand || ''} ${p.sku || ''}`.toLowerCase().includes(q)
      );
    }
    return list.slice(0, 30);
  }, [products, orderProductSearch]);
  const quickFilteredBrands = useMemo(() => {
    const q = String(quickProductBrandSearch || '').trim().toLowerCase();
    if (!q) return mergedBrandOptions;
    return mergedBrandOptions.filter((b) => String(b || '').toLowerCase().includes(q));
  }, [mergedBrandOptions, quickProductBrandSearch]);

  const orderItemsDetailed = useMemo(() => {
    return (orderForm.items || [])
      .map((line) => {
        const product = products.find((p) => String(p.id) === String(line.product_id || ''));
        if (!product) return null;
        const qty = Math.max(1, Number(line.qty || 1));
        const price = Number(line.price ?? product.price ?? 0) || 0;
        return { ...line, product, qty, price, lineTotal: qty * price };
      })
      .filter(Boolean);
  }, [orderForm.items, products]);

  const orderSubtotal = useMemo(
    () => orderItemsDetailed.reduce((acc, item) => acc + item.lineTotal, 0),
    [orderItemsDetailed]
  );
  const orderDiscountAmount = useMemo(() => {
    const v = Number(orderDiscountValue || 0) || 0;
    if (orderDiscountType === 'percent') return Math.max(0, Math.min(100, v)) * orderSubtotal / 100;
    if (orderDiscountType === 'amount') return Math.max(0, Math.min(orderSubtotal, v));
    return 0;
  }, [orderDiscountType, orderDiscountValue, orderSubtotal]);
  const orderTotal = Math.max(0, orderSubtotal - orderDiscountAmount);

  useEffect(() => {
    if (!isAuth) return;
    try {
      const raw = localStorage.getItem(ORDER_DRAFT_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw);
      if (draft?.orderForm) setOrderForm(draft.orderForm);
      if (draft?.orderDiscountType) setOrderDiscountType(draft.orderDiscountType);
      if (draft?.orderDiscountValue !== undefined) setOrderDiscountValue(String(draft.orderDiscountValue ?? ''));
      setOrderBuilderOpen(Boolean(draft?.orderBuilderOpen));
    } catch {
      // noop
    }
  }, [isAuth]);

  useEffect(() => {
    if (!isAuth) return;
    const payload = {
      orderForm,
      orderDiscountType,
      orderDiscountValue,
      orderBuilderOpen,
    };
    localStorage.setItem(ORDER_DRAFT_KEY, JSON.stringify(payload));
  }, [isAuth, orderForm, orderDiscountType, orderDiscountValue, orderBuilderOpen]);

  useEffect(() => {
    if (!quickProductModalOpen) return undefined;
    const brand = String(quickProductForm.brand || '').trim();
    const model = String(quickProductForm.model || '').trim();
    if (!brand || !model) {
      setQuickProductTemplates([]);
      setQuickTemplateLoading(false);
      return undefined;
    }
    const timer = setTimeout(async () => {
      try {
        setQuickTemplateLoading(true);
        const params = new URLSearchParams({ brand, model, limit: '8' });
        const result = await request(`/api/products/templates?${params.toString()}`);
        setQuickProductTemplates(Array.isArray(result) ? result : []);
      } catch {
        setQuickProductTemplates([]);
      } finally {
        setQuickTemplateLoading(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [quickProductModalOpen, quickProductForm.brand, quickProductForm.model]);

  const lookProductOptions = useMemo(() => {
    const q = lookProductSearch.trim().toLowerCase();
    if (!q) return products.slice(0, 200);
    return products
      .filter((p) => `${p.name || ''} ${p.brand || ''}`.toLowerCase().includes(q))
      .slice(0, 200);
  }, [products, lookProductSearch]);

  const saveProduct = useMutation({
    mutationFn: (payload) => {
      const normalizedCondition = String(payload.condition || 'new').toLowerCase();
      const normalizedStockQty = normalizedCondition === 'used'
        ? 1
        : Math.max(0, Number(payload.stock_qty ?? 0) || 0);
      const body = {
        ...payload,
        name: String(payload.name || '').trim(),
        brand: String(payload.brand || '').trim(),
        model: String(payload.model || '').trim(),
        description: String(payload.description || '').trim(),
        price: payload.price === '' ? null : Number(payload.price),
        original_price: payload.original_price === '' ? null : Number(payload.original_price),
        image_url: payload.image_url || null,
        images: Array.isArray(payload.images) ? payload.images : [],
        category_id: payload.category_id || null,
        subcategory_id: payload.subcategory_id || null,
        subsubcategory_id: payload.subsubcategory_id || null,
        category_id_2: payload.category_id_2 || null,
        condition: normalizedCondition,
        stock_qty: normalizedStockQty,
        in_stock: normalizedStockQty > 0,
        featured: !!payload.featured,
        popular: !!payload.popular,
        on_sale: !!payload.on_sale,
        rating: payload.rating === '' ? null : Number(payload.rating),
      };
      return editingProduct?.id
        ? request(`/api/products/${editingProduct.id}`, { method: 'PUT', body: JSON.stringify(body) })
        : request('/api/products', { method: 'POST', body: JSON.stringify(body) });
    },
    onSuccess: () => {
      toast.success('Товар сохранен');
      setProductModalOpen(false);
      setEditingProduct(null);
      queryClient.invalidateQueries({ queryKey: ['crm-products'] });
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteProduct = useMutation({
    mutationFn: (id) => request(`/api/products/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      toast.success('Товар удален');
      queryClient.invalidateQueries({ queryKey: ['crm-products'] });
    },
    onError: (e) => toast.error(e.message),
  });

  const updateOrderStatus = useMutation({
    mutationFn: ({ orderNumber, status }) => request(`/api/orders/${orderNumber}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['crm-orders'] }),
    onError: (e) => toast.error(e.message),
  });

  const archiveOrder = useMutation({
    mutationFn: ({ orderNumber, archived }) => request(`/api/orders/${orderNumber}/archive`, { method: 'PATCH', body: JSON.stringify({ archived }) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['crm-orders'] }),
    onError: (e) => toast.error(e.message),
  });

  const createOrder = useMutation({
    mutationFn: () => {
      if (!String(orderForm.phone || '').trim()) throw new Error('Телефон обязателен');
      if (!String(orderForm.customer_name || '').trim()) throw new Error('Укажите ФИО клиента');
      if (orderItemsDetailed.length === 0) throw new Error('Добавьте хотя бы один товар');
      if (orderForm.delivery_type === 'courier' && !String(orderForm.courier_address || '').trim()) {
        throw new Error('Для курьера укажите адрес');
      }
      if (orderForm.delivery_type === 'tk') {
        if (!String(orderForm.tk_city || '').trim()) throw new Error('Для ТК укажите город');
        if (!String(orderForm.tk_index || '').trim()) throw new Error('Для ТК укажите индекс');
        if (!String(orderForm.tk_address || '').trim()) throw new Error('Для ТК укажите адрес');
        if (!String(orderForm.tk_recipient_name || '').trim()) throw new Error('Для ТК укажите ФИО получателя');
        if (!String(orderForm.tk_recipient_phone || '').trim()) throw new Error('Для ТК укажите телефон получателя');
      }
      const selectedItems = orderItemsDetailed.map((item) => ({
        product_id: String(item.product.id),
        qty: item.qty,
        price: item.price,
        name: item.product.name,
      }));
      const orderNumber = `CRM-${Date.now()}`;
      return request('/api/orders', {
        method: 'POST',
        body: JSON.stringify({
          order_number: orderNumber,
          items: selectedItems,
          total: orderTotal,
          customer_name: orderForm.customer_name || null,
          customer_email: orderForm.customer_email || null,
          shipping_address: {
            phone: orderForm.phone || null,
            delivery_type: orderForm.delivery_type,
            pickup_addresses: orderForm.delivery_type === 'pickup' ? ['Москва, ул. Примерная, 10', 'Химки, ул. Ленина, 8'] : undefined,
            courier_region: orderForm.delivery_type === 'courier' ? orderForm.courier_region : undefined,
            address: orderForm.delivery_type === 'courier' ? (orderForm.courier_address || null) : undefined,
            tk_city: orderForm.delivery_type === 'tk' ? orderForm.tk_city : undefined,
            tk_index: orderForm.delivery_type === 'tk' ? orderForm.tk_index : undefined,
            tk_address: orderForm.delivery_type === 'tk' ? orderForm.tk_address : undefined,
            tk_recipient_name: orderForm.delivery_type === 'tk' ? orderForm.tk_recipient_name : undefined,
            tk_recipient_phone: orderForm.delivery_type === 'tk' ? orderForm.tk_recipient_phone : undefined,
            discount_type: orderDiscountType,
            discount_value: Number(orderDiscountValue || 0) || 0,
            subtotal: orderSubtotal,
            discount_amount: orderDiscountAmount,
          },
          payment_method: orderForm.payment_method || 'cash',
        }),
      });
    },
    onSuccess: () => {
      toast.success('Заказ создан');
      setOrderBuilderOpen(false);
      setOrderForm({
        customer_name: '',
        customer_email: '',
        phone: '',
        payment_method: 'cash',
        delivery_type: 'pickup',
        courier_region: 'moscow',
        courier_address: '',
        tk_city: '',
        tk_index: '',
        tk_address: '',
        tk_recipient_name: '',
        tk_recipient_phone: '',
        items: [],
      });
      setOrderDiscountType('none');
      setOrderDiscountValue('');
      setOrderProductSearch('');
      setOrderClientSearch('');
      localStorage.removeItem(ORDER_DRAFT_KEY);
      queryClient.invalidateQueries({ queryKey: ['crm-orders'] });
    },
    onError: (e) => toast.error(e.message),
  });

  const createCustomer = useMutation({
    mutationFn: () => {
      if (!String(newCustomer.phone || '').trim()) throw new Error('Телефон обязателен');
      return request('/api/customers', { method: 'POST', body: JSON.stringify({ ...newCustomer, email: newCustomer.email || null }) });
    },
    onSuccess: () => {
      toast.success('Клиент создан');
      setCustomerModalOpen(false);
      setNewCustomer({ full_name: '', phone: '', email: '', note: '' });
      queryClient.invalidateQueries({ queryKey: ['crm-customers'] });
    },
    onError: (e) => toast.error(e.message),
  });

  const updateCustomer = useMutation({
    mutationFn: ({ id, payload }) => request(`/api/customers/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
    onSuccess: (data) => {
      toast.success('Клиент обновлен');
      setSelectedCustomer(data);
      setCustomerProfileForm({
        full_name: data?.full_name || '',
        phone: data?.phone || '',
        email: data?.email || '',
        note: data?.note || '',
      });
      setIsCustomerProfileEdit(false);
      queryClient.invalidateQueries({ queryKey: ['crm-customers'] });
      queryClient.invalidateQueries({ queryKey: ['crm-orders'] });
    },
    onError: (e) => toast.error(e.message),
  });

  const createCategory = useMutation({
    mutationFn: (payload = newCategory) =>
      request('/api/categories', {
        method: 'POST',
        body: JSON.stringify({
          name: payload.name,
          parent_id: payload.parent_id || null,
          product_name_prefix: payload.product_name_prefix || null,
        }),
      }),
    onSuccess: () => {
      toast.success('Категория создана');
      setCategoryModalOpen(false);
      setNewCategory({ name: '', parent_id: '', product_name_prefix: '' });
      queryClient.invalidateQueries({ queryKey: ['crm-categories'] });
    },
    onError: (e) => toast.error(e.message),
  });

  const updateCategory = useMutation({
    mutationFn: ({ id, payload }) => request(`/api/categories/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
    onSuccess: () => {
      toast.success('Категория обновлена');
      setCategoryEditModalOpen(false);
      setEditingCategory(null);
      queryClient.invalidateQueries({ queryKey: ['crm-categories'] });
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteCategory = useMutation({
    mutationFn: (id) => request(`/api/categories/${id}?with_children=true`, { method: 'DELETE' }),
    onSuccess: () => {
      toast.success('Категория удалена');
      queryClient.invalidateQueries({ queryKey: ['crm-categories'] });
    },
    onError: (e) => toast.error(e.message),
  });

  const createBrand = useMutation({
    mutationFn: () => request('/api/brands', { method: 'POST', body: JSON.stringify(newBrand) }),
    onSuccess: () => {
      toast.success('Бренд создан');
      setBrandModalOpen(false);
      setNewBrand({ name: '', sort_order: 0, popular: false });
      setEditingBrand(null);
      queryClient.invalidateQueries({ queryKey: ['crm-brands'] });
    },
    onError: (e) => toast.error(e.message),
  });

  const updateBrand = useMutation({
    mutationFn: ({ id, payload }) => request(`/api/brands/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
    onSuccess: () => {
      toast.success('Бренд обновлен');
      setBrandModalOpen(false);
      setNewBrand({ name: '', sort_order: 0, popular: false });
      setEditingBrand(null);
      queryClient.invalidateQueries({ queryKey: ['crm-brands'] });
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteBrand = useMutation({
    mutationFn: (id) => request(`/api/brands/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      toast.success('Бренд удален');
      queryClient.invalidateQueries({ queryKey: ['crm-brands'] });
    },
    onError: (e) => toast.error(e.message),
  });

  const saveLook = useMutation({
    mutationFn: () => {
      const categories = Array.isArray(lookForm.look_categories)
        ? Array.from(new Set(lookForm.look_categories.map((x) => String(x || '').trim()).filter(Boolean)))
        : [];
      const payload = {
        name: String(lookForm.name || '').trim(),
        slug: String(lookForm.slug || '').trim() || undefined,
        look_categories: categories.length > 0 ? categories : ['Город'],
        description: String(lookForm.description || '').trim(),
        cover_image_url: String(lookForm.cover_image_url || '').trim(),
        is_active: Boolean(lookForm.is_active),
        product_ids: Array.isArray(lookForm.product_ids) ? lookForm.product_ids : [],
      };
      return editingLook?.id
        ? request(`/api/looks/${editingLook.id}`, { method: 'PUT', body: JSON.stringify(payload) })
        : request('/api/looks', { method: 'POST', body: JSON.stringify(payload) });
    },
    onSuccess: () => {
      toast.success('Образ сохранен');
      setLookModalOpen(false);
      setEditingLook(null);
      setLookForm(LOOK_FORM_INITIAL);
      queryClient.invalidateQueries({ queryKey: ['crm-looks'] });
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteLook = useMutation({
    mutationFn: (id) => request(`/api/looks/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      toast.success('Образ удален');
      queryClient.invalidateQueries({ queryKey: ['crm-looks'] });
    },
    onError: (e) => toast.error(e.message),
  });

  const saveSetting = useMutation({
    mutationFn: ({ key, value }) => request(`/api/settings/${key}`, { method: 'PUT', body: JSON.stringify({ value }) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['crm-settings'] }),
    onError: (e) => toast.error(e.message),
  });

  const updateMessage = useMutation({
    mutationFn: ({ id, status }) => request(`/api/messages/${id}`, { method: 'PUT', body: JSON.stringify({ status }) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['crm-messages'] }),
    onError: (e) => toast.error(e.message),
  });

  const removeMessage = useMutation({
    mutationFn: (id) => request(`/api/messages/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['crm-messages'] }),
    onError: (e) => toast.error(e.message),
  });

  const blockIp = useMutation({
    mutationFn: () => request('/api/blocked-ips', { method: 'POST', body: JSON.stringify({ ...newIp, blocked_by: 'admin' }) }),
    onSuccess: () => {
      toast.success('IP добавлен в блок');
      setNewIp({ ip_address: '', reason: '' });
      queryClient.invalidateQueries({ queryKey: ['crm-blocked'] });
    },
    onError: (e) => toast.error(e.message),
  });

  const unblockIp = useMutation({
    mutationFn: (id) => request(`/api/blocked-ips/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['crm-blocked'] }),
    onError: (e) => toast.error(e.message),
  });

  const exportProductsToXls = () => {
    const ids = filteredProducts.map((p) => p.id).join(',');
    const url = `${API_URL}/api/products/export.xls${ids ? `?ids=${encodeURIComponent(ids)}` : ''}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const openCategoryEdit = (category) => {
    setEditingCategory(category);
    setCategoryEditForm({
      name: category?.name || '',
      parent_id: category?.parent_id ? String(category.parent_id) : '',
      product_name_prefix: category?.product_name_prefix || '',
    });
    setCategoryEditModalOpen(true);
  };

  const openBrandModal = (brand = null) => {
    setEditingBrand(brand);
    setNewBrand({
      name: brand?.name || '',
      sort_order: Number(brand?.sort_order || 0),
      popular: Boolean(brand?.popular),
    });
    setBrandModalOpen(true);
  };

  const createBrandQuick = async (name) => {
    const created = await request('/api/brands', {
      method: 'POST',
      body: JSON.stringify({ name, sort_order: 0, popular: false }),
    });
    queryClient.invalidateQueries({ queryKey: ['crm-brands'] });
    toast.success('Бренд создан');
    return created;
  };

  const openQuickProductModal = () => {
    setQuickProductForm({ brand: '', model: '', category_id: '', condition: 'new' });
    setQuickSelectedTemplate(null);
    setQuickProductTemplates([]);
    setQuickProductBrandSearch('');
    setQuickProductBrandOpen(false);
    setQuickProductModalOpen(true);
  };

  const saveQuickProduct = async () => {
    const brand = String(quickProductForm.brand || '').trim();
    const model = String(quickProductForm.model || '').trim();
    if (!brand) {
      toast.error('Выберите бренд');
      return;
    }
    if (!model) {
      toast.error('Введите модель');
      return;
    }
    if (!quickSelectedTemplate && !String(quickProductForm.category_id || '').trim()) {
      toast.error('Если шаблон не найден, выберите глобальную категорию');
      return;
    }
    const condition = String(quickProductForm.condition || 'new').toLowerCase() === 'used' ? 'used' : 'new';
    const payload = {
      name: quickSelectedTemplate?.name || `${brand} ${model}`.trim(),
      brand,
      model,
      category_id: quickSelectedTemplate?.category_id || quickProductForm.category_id || null,
      subcategory_id: quickSelectedTemplate?.subcategory_id || null,
      subsubcategory_id: quickSelectedTemplate?.subsubcategory_id || null,
      category_id_2: quickSelectedTemplate?.category_id_2 || null,
      condition,
      description: quickSelectedTemplate?.description || '',
      image_url: quickSelectedTemplate?.image_url || null,
      images: Array.isArray(quickSelectedTemplate?.images) ? quickSelectedTemplate.images : [],
      price: quickSelectedTemplate?.price ?? null,
      original_price: quickSelectedTemplate?.original_price ?? null,
      featured: false,
      popular: false,
      on_sale: false,
      stock_qty: condition === 'used' ? 1 : 0,
      in_stock: condition === 'used',
    };
    try {
      setQuickProductSaving(true);
      const created = await request('/api/products', { method: 'POST', body: JSON.stringify(payload) });
      toast.success('Товар быстро создан');
      queryClient.invalidateQueries({ queryKey: ['crm-products'] });
      setQuickProductModalOpen(false);
      if (created?.id) addProductToOrder(created);
    } catch (error) {
      toast.error(error.message || 'Не удалось создать товар');
    } finally {
      setQuickProductSaving(false);
    }
  };

  const addProductToOrder = (product) => {
    if (!product) return;
    const id = String(product.id);
    const condition = String(product.condition || 'new').toLowerCase();
    const stockLimit = condition === 'used' ? 1 : Math.max(0, Number(product.stock_qty ?? 0) || 0);
    setOrderForm((prev) => {
      const idx = (prev.items || []).findIndex((x) => String(x.product_id || '') === id);
      if (idx >= 0) {
        const next = [...prev.items];
        const nextQty = Math.max(1, Number(next[idx].qty || 1) + 1);
        next[idx] = { ...next[idx], qty: stockLimit > 0 ? Math.min(nextQty, stockLimit) : nextQty };
        return { ...prev, items: next };
      }
      return {
        ...prev,
        items: [...(prev.items || []), { product_id: id, qty: stockLimit > 0 ? Math.min(1, stockLimit) : 1, price: Number(product.price || 0) }],
      };
    });
    setOrderProductSearch('');
  };

  const selectCustomerForOrder = (customer) => {
    if (!customer) return;
    setOrderForm((prev) => ({
      ...prev,
      customer_name: customer.full_name || prev.customer_name,
      customer_email: customer.email || prev.customer_email,
      phone: customer.phone || prev.phone,
    }));
    setOrderClientSearch(customer.phone || customer.full_name || '');
  };

  const createCustomerFromOrder = async () => {
    const payload = {
      full_name: String(orderForm.customer_name || '').trim(),
      phone: String(orderForm.phone || '').trim(),
      email: String(orderForm.customer_email || '').trim() || null,
      note: 'Создано из заказа CRM',
    };
    if (!payload.full_name || !payload.phone) {
      toast.error('Укажите ФИО и телефон клиента');
      return;
    }
    try {
      await request('/api/customers', { method: 'POST', body: JSON.stringify(payload) });
      toast.success('Клиент создан');
      queryClient.invalidateQueries({ queryKey: ['crm-customers'] });
    } catch (error) {
      toast.error(error.message || 'Не удалось создать клиента');
    }
  };

  const openLookModal = (look = null) => {
    setEditingLook(look);
    setLookForm(
      look
        ? {
            name: look.name || '',
            slug: look.slug || '',
            look_categories: Array.isArray(look.look_categories) && look.look_categories.length > 0
              ? look.look_categories
              : [look.look_category || 'Город'],
            description: look.description || '',
            cover_image_url: look.cover_image_url || '',
            cover_image_name: '',
            is_active: look.is_active !== false,
            product_ids: Array.isArray(look.product_ids) ? look.product_ids.map((x) => String(x)) : [],
          }
        : LOOK_FORM_INITIAL
    );
    setLookProductSearch('');
    setLookModalOpen(true);
  };

  const uploadLookCover = async (file) => {
    if (!file) return;
    try {
      const data = new FormData();
      data.append('image', file);
      const response = await fetch(`${API_URL}/api/upload/image`, {
        method: 'POST',
        body: data,
      });
      if (!response.ok) throw new Error('Не удалось загрузить изображение');
      const payload = await response.json();
      setLookForm((prev) => ({
        ...prev,
        cover_image_url: payload.filePath || '',
        cover_image_name: file.name || '',
      }));
      toast.success('Обложка загружена');
    } catch (error) {
      toast.error(error?.message || 'Ошибка загрузки');
    }
  };

  const openOrderDetails = async (order) => {
    if (!order) return;
    setSelectedOrder(order);
    try {
      const details = await request(`/api/shop/orders/${order.order_number}`);
      setSelectedOrder((prev) => ({
        ...(prev || {}),
        ...details,
        total: details?.total ?? getOrderTotal(prev || order),
      }));
    } catch {
      // keep fallback order data from list
    }
  };

  const openCustomerDetails = (customer) => {
    if (!customer) return;
    setSelectedCustomer(customer);
    setCustomerProfileForm({
      full_name: customer.full_name || '',
      phone: customer.phone || '',
      email: customer.email || '',
      note: customer.note || '',
    });
    setIsCustomerProfileEdit(false);
  };

  const closeCustomerDetails = () => {
    setSelectedCustomer(null);
    setIsCustomerProfileEdit(false);
    setCustomerProfileForm({ full_name: '', phone: '', email: '', note: '' });
  };

  if (!isAuth) {
    return (
      <div className="crm-shell min-h-screen p-6">
        <div className="mx-auto mt-24 max-w-[420px]">
          <div className="crm-login-card">
            <h1 className="text-2xl font-bold text-white">MOTOTOM CRM</h1>
            <p className="mt-1 text-sm text-[#A0A0A5]">Вход в административную панель</p>
            <div className="mt-4 space-y-3">
              <input className="crm-input" placeholder="Логин" value={login} onChange={(e) => setLogin(e.target.value)} />
              <input className="crm-input" placeholder="Пароль" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
              <button
                className="crm-primary-btn h-11 w-full rounded-lg text-sm font-medium"
                onClick={() => {
                  const expectedLogin = import.meta.env.VITE_ADMIN_LOGIN || 'admin';
                  const expectedPass = import.meta.env.VITE_ADMIN_PASSWORD || 'admin123';
                  if (login === expectedLogin && password === expectedPass) {
                    localStorage.setItem(AUTH_KEY, '1');
                    setIsAuth(true);
                    toast.success('Вход выполнен');
                  } else {
                    toast.error('Неверный логин или пароль');
                  }
                }}
              >
                Войти
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const section = () => {
    if (tab === 'products') {
      const totalProducts = products.length;
      const publishedCount = products.filter((p) => !!p.in_stock).length;
      const avitoCount = products.filter((p) => !!(p.avito_sync || p.on_avito)).length;
      const outCount = products.filter((p) => !p.in_stock).length;
      return (
        <section className="overflow-hidden rounded-[10px] border border-[#1E1E22] bg-[#0D0D0F]">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1E1E22] px-8 py-4">
            <div>
              <h2 className="text-[20px] font-bold text-[#FAFAF9]">Управление товарами</h2>
              <p className="text-[13px] text-[#6B6B70]">{totalProducts} товаров в каталоге</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button className="inline-flex items-center gap-2 rounded-lg border border-[#2A2A2E] px-5 py-2.5 text-[13px] font-medium text-[#A0A0A5]" onClick={exportProductsToXls}>
                <Download size={16} /> Скачать таблицу
              </button>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[#2A2A2E] px-5 py-2.5 text-[13px] font-medium text-[#A0A0A5]">
                <Upload size={16} /> Загрузить таблицу
                <input type="file" className="hidden" onChange={() => toast.info('Импорт таблицы подключу следующим шагом')} />
              </label>
              <button className="inline-flex items-center gap-2 rounded-lg border border-[#00AAFF50] bg-[#00AAFF20] px-5 py-2.5 text-[13px] font-semibold text-[#00AAFF]">
                <Share2 size={16} /> Выгрузить в Авито
              </button>
              <button className="inline-flex items-center gap-2 rounded-lg bg-[#54A0C5] px-5 py-2.5 text-[13px] font-semibold text-[#FAFAF9]" onClick={() => { setEditingProduct(null); setProductModalOpen(true); }}>
                <Plus size={16} /> Добавить товар
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 px-8 py-5 md:grid-cols-4">
            <div className="rounded-[10px] border border-[#1E1E22] bg-[#16161A] p-4">
              <p className="text-xs text-[#6B6B70]">Всего товаров</p>
              <p className="mt-1 text-2xl font-bold text-[#FAFAF9]">{totalProducts}</p>
            </div>
            <div className="rounded-[10px] border border-[#1E1E22] bg-[#16161A] p-4">
              <p className="text-xs text-[#6B6B70]">Опубликовано</p>
              <p className="mt-1 text-2xl font-bold text-[#4ADE80]">{publishedCount}</p>
            </div>
            <div className="rounded-[10px] border border-[#1E1E22] bg-[#16161A] p-4">
              <p className="text-xs text-[#6B6B70]">На Авито</p>
              <p className="mt-1 text-2xl font-bold text-[#00AAFF]">{avitoCount}</p>
            </div>
            <div className="rounded-[10px] border border-[#1E1E22] bg-[#16161A] p-4">
              <p className="text-xs text-[#6B6B70]">Нет в наличии</p>
              <p className="mt-1 text-2xl font-bold text-[#F87171]">{outCount}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 px-8 pb-4">
            <div className="flex h-[38px] w-[280px] items-center gap-2 rounded-lg border border-[#2A2A2E] bg-[#16161A] px-[14px]">
              <Search size={15} color="#4A4A50" />
              <input className="w-full bg-transparent text-[13px] text-[#A0A0A5] outline-none placeholder:text-[#4A4A50]" placeholder="Поиск по названию или SKU..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div className="relative">
              <select
                className="crm-input crm-select !h-[38px] !w-auto min-w-[150px] border-[#2A2A2E] bg-[#16161A] text-[13px] text-[#A0A0A5]"
                value={productCategoryFilter}
                onChange={(e) => {
                  setProductCategoryFilter(e.target.value);
                  setProductSubcategoryFilter('');
                  setProductSubsubcategoryFilter('');
                }}
              >
                <option value="">Категория</option>
                {rootCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#6B6B70]" />
            </div>
            <div className="relative">
              <select className="crm-input crm-select !h-[38px] !w-auto min-w-[150px] border-[#2A2A2E] bg-[#16161A] text-[13px] text-[#A0A0A5]" value={productBrandFilter} onChange={(e) => setProductBrandFilter(e.target.value)}>
                <option value="">Бренд</option>
                {mergedBrandOptions.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
              <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#6B6B70]" />
            </div>
            <div className="relative">
              <select className="crm-input crm-select !h-[38px] !w-auto min-w-[150px] border-[#2A2A2E] bg-[#16161A] text-[13px] text-[#A0A0A5]" value={productPriceSort} onChange={(e) => setProductPriceSort(e.target.value)}>
                <option value="default">Сортировка цены</option>
                <option value="price_asc">Цена: по возрастанию</option>
                <option value="price_desc">Цена: по убыванию</option>
              </select>
              <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#6B6B70]" />
            </div>
            <div className="relative">
              <select className="crm-input crm-select !h-[38px] !w-auto min-w-[130px] border-[#2A2A2E] bg-[#16161A] text-[13px] text-[#A0A0A5]" value={productStockFilter} onChange={(e) => setProductStockFilter(e.target.value)}>
                <option value="">Статус</option>
                <option value="in_stock">В наличии</option>
                <option value="out_of_stock">Нет в наличии</option>
              </select>
              <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#6B6B70]" />
            </div>
            <div className="relative">
              <select className="crm-input crm-select !h-[38px] !w-auto min-w-[120px] border-[#2A2A2E] bg-[#16161A] text-[13px] text-[#A0A0A5]" value={productAvitoFilter} onChange={(e) => setProductAvitoFilter(e.target.value)}>
                <option value="">Авито</option>
                <option value="on">На Авито</option>
                <option value="off">Не на Авито</option>
              </select>
              <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#6B6B70]" />
            </div>
          </div>
          <div className="px-4 pb-6 md:px-8 md:pb-8">
            <div className="overflow-x-auto rounded-[10px] border border-[#1E1E22]">
              <div className="grid min-w-[980px] grid-cols-[34px_2fr_1fr_1fr_1fr_0.8fr_1fr_1fr_70px] items-center border-b border-[#1E1E22] bg-[#111114] px-4 py-3 text-xs font-semibold text-[#6B6B70]">
                <input
                  type="checkbox"
                  checked={filteredProducts.length > 0 && selectedProductIds.length === filteredProducts.length}
                  onChange={(e) => setSelectedProductIds(e.target.checked ? filteredProducts.map((p) => String(p.id)) : [])}
                />
                <button
                  type="button"
                  className="text-left text-[#6B6B70] hover:text-white"
                  onClick={() =>
                    setSelectedProductIds(
                      selectedProductIds.length === filteredProducts.length
                        ? []
                        : filteredProducts.map((p) => String(p.id))
                    )
                  }
                >
                  Название
                </button>
                <span>SKU</span>
                <span>Категория</span>
                <span>Цена</span>
                <span>Остаток</span>
                <span>Статус</span>
                <span>Авито</span>
                <span className="text-right">Действия</span>
              </div>
              <div className="max-h-none overflow-y-visible md:max-h-[420px] md:overflow-y-auto">
                {filteredProducts.map((p) => {
                  const stockQty = Math.max(0, Number(p.stock_qty ?? (p.in_stock ? 1 : 0)) || 0);
                  const statusLabel = !p.in_stock ? 'Неактивный' : (String(p.condition || '').toLowerCase() === 'used' ? 'Б/У' : 'Активный');
                  const statusClass = !p.in_stock ? 'bg-[#F8717120] text-[#F87171]' : (String(p.condition || '').toLowerCase() === 'used' ? 'bg-[#FCD34D20] text-[#FCD34D]' : 'bg-[#4ADE8020] text-[#4ADE80]');
                  const onAvito = !!(p.avito_sync || p.on_avito);
                  return (
                    <div key={p.id} className="grid min-w-[980px] grid-cols-[34px_2fr_1fr_1fr_1fr_0.8fr_1fr_1fr_70px] items-center border-b border-[#1E1E22] px-4 py-3 text-[13px]">
                      <input
                        type="checkbox"
                        checked={selectedProductIds.includes(String(p.id))}
                        onChange={(e) =>
                          setSelectedProductIds((prev) =>
                            e.target.checked ? [...new Set([...prev, String(p.id)])] : prev.filter((id) => id !== String(p.id))
                          )
                        }
                      />
                      <span className="truncate font-medium text-[#FAFAF9]">{p.name}</span>
                      <span className="text-[#6B6B70]">{p.sku || '-'}</span>
                      <span className="text-[#A0A0A5]">{p.category_name || '-'}</span>
                      <span className="font-medium text-[#FAFAF9]">{Number(p.price || 0).toLocaleString('ru-RU')} ₽</span>
                      <span className={stockQty > 5 ? 'text-[#4ADE80]' : stockQty > 0 ? 'text-[#FCD34D]' : 'text-[#F87171]'}>{stockQty}</span>
                      <span className={`inline-flex w-fit rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusClass}`}>{statusLabel}</span>
                      <span className={`inline-flex w-fit rounded-full px-2.5 py-1 text-[11px] font-semibold ${onAvito ? 'bg-[#00AAFF20] text-[#00AAFF]' : 'bg-[#4A4A5030] text-[#6B6B70]'}`}>
                        {onAvito ? 'На Авито' : 'Не на Авито'}
                      </span>
                      <div className="flex justify-end gap-2 text-[#6B6B70]">
                        <button onClick={() => { setEditingProduct(p); setProductModalOpen(true); }}><Pencil size={16} /></button>
                        <button><MoreHorizontal size={16} /></button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      );
    }

    if (tab === 'orders') {
      return (
        <Card
          title="Заказы"
          subtitle="Управление статусами и создание заказов"
          action={
            <button
              className="crm-primary-btn rounded-lg px-4 py-2 text-sm font-medium"
              onClick={() => setOrderBuilderOpen((prev) => !prev)}
            >
              {orderBuilderOpen ? 'Скрыть оформление заказа' : 'Создать заказ'}
            </button>
          }
        >
          {orderBuilderOpen ? (
            <div className="mb-5 rounded-xl border border-[#26262d] bg-[#151519] p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h4 className="text-sm font-semibold text-white">Новый заказ</h4>
                <button
                  className="crm-outline-btn rounded border px-3 py-1.5 text-xs"
                  onClick={() => {
                    setOrderForm({
                      customer_name: '',
                      customer_email: '',
                      phone: '',
                      payment_method: 'cash',
                      delivery_type: 'pickup',
                      courier_region: 'moscow',
                      courier_address: '',
                      tk_city: '',
                      tk_index: '',
                      tk_address: '',
                      tk_recipient_name: '',
                      tk_recipient_phone: '',
                      items: [],
                    });
                    setOrderDiscountType('none');
                    setOrderDiscountValue('');
                    setOrderClientSearch('');
                    setOrderProductSearch('');
                    localStorage.removeItem(ORDER_DRAFT_KEY);
                  }}
                >
                  Очистить
                </button>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="md:col-span-2">
                  <input
                    className="crm-input"
                    placeholder="Поиск клиента: последние 4 цифры или ФИО"
                    value={orderClientSearch}
                    onChange={(e) => setOrderClientSearch(e.target.value)}
                  />
                  {orderClientSearch.trim() ? (
                    <div className="mt-2 rounded-lg border border-[#26262d] bg-[#121216] p-2">
                      {matchedCustomersForOrder.length > 0 ? (
                        <div className="space-y-1">
                          {matchedCustomersForOrder.map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left hover:bg-[#1b1b20]"
                              onClick={() => selectCustomerForOrder(c)}
                            >
                              <span className="text-sm text-[#d2d2d8]">{c.full_name || 'Без имени'} • {c.phone || '-'}</span>
                              <span className="text-xs text-[#8f8f95]">{c.email || 'без email'}</span>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-xs text-[#8f8f95]">Клиент не найден</p>
                          <button className="crm-outline-btn rounded border px-3 py-1.5 text-xs" onClick={createCustomerFromOrder}>
                            Создать клиента
                          </button>
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
                <input
                  className="crm-input"
                  placeholder="ФИО клиента"
                  value={orderForm.customer_name}
                  onChange={(e) => setOrderForm((p) => ({ ...p, customer_name: e.target.value }))}
                />
                <input
                  className="crm-input"
                  placeholder="Телефон*"
                  value={orderForm.phone}
                  onChange={(e) => setOrderForm((p) => ({ ...p, phone: e.target.value }))}
                />
                <input
                  className="crm-input"
                  placeholder="Email (необязательно)"
                  value={orderForm.customer_email}
                  onChange={(e) => setOrderForm((p) => ({ ...p, customer_email: e.target.value }))}
                />
                <select className="crm-input crm-select" value={orderForm.payment_method} onChange={(e) => setOrderForm((p) => ({ ...p, payment_method: e.target.value }))}>
                  <option value="cash">Наличные</option>
                  <option value="card">Карта</option>
                  <option value="transfer">Перевод</option>
                </select>
                <div className="md:col-span-2 rounded-lg border border-[#2a2a2e] bg-[#121216] p-3">
                  <p className="mb-2 text-xs text-[#8f8f95]">Способ доставки</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className={`rounded-md px-3 py-1.5 text-sm ${orderForm.delivery_type === 'pickup' ? 'bg-[#54A0C5] text-white' : 'bg-[#1b1b20] text-[#A0A0A5]'}`}
                      onClick={() => setOrderForm((p) => ({ ...p, delivery_type: 'pickup' }))}
                    >
                      Самовывоз
                    </button>
                    <button
                      type="button"
                      className={`rounded-md px-3 py-1.5 text-sm ${orderForm.delivery_type === 'courier' ? 'bg-[#54A0C5] text-white' : 'bg-[#1b1b20] text-[#A0A0A5]'}`}
                      onClick={() => setOrderForm((p) => ({ ...p, delivery_type: 'courier' }))}
                    >
                      Курьер Москва/МО
                    </button>
                    <button
                      type="button"
                      className={`rounded-md px-3 py-1.5 text-sm ${orderForm.delivery_type === 'tk' ? 'bg-[#54A0C5] text-white' : 'bg-[#1b1b20] text-[#A0A0A5]'}`}
                      onClick={() => setOrderForm((p) => ({ ...p, delivery_type: 'tk' }))}
                    >
                      ТК по России
                    </button>
                  </div>
                  {orderForm.delivery_type === 'pickup' ? (
                    <div className="mt-3 rounded-md border border-[#2a2a2e] bg-[#17171b] p-2 text-xs text-[#b2b2b8]">
                      <p>Адреса самовывоза:</p>
                      <p>1. Москва, ул. Примерная, 10</p>
                      <p>2. Химки, ул. Ленина, 8</p>
                    </div>
                  ) : null}
                  {orderForm.delivery_type === 'courier' ? (
                    <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-[180px_1fr]">
                      <select className="crm-input crm-select" value={orderForm.courier_region} onChange={(e) => setOrderForm((p) => ({ ...p, courier_region: e.target.value }))}>
                        <option value="moscow">Москва</option>
                        <option value="moscow_region">Московская область</option>
                      </select>
                      <input className="crm-input" placeholder="Адрес клиента" value={orderForm.courier_address} onChange={(e) => setOrderForm((p) => ({ ...p, courier_address: e.target.value }))} />
                    </div>
                  ) : null}
                  {orderForm.delivery_type === 'tk' ? (
                    <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
                      <input className="crm-input" placeholder="Город" value={orderForm.tk_city} onChange={(e) => setOrderForm((p) => ({ ...p, tk_city: e.target.value }))} />
                      <input className="crm-input" placeholder="Индекс" value={orderForm.tk_index} onChange={(e) => setOrderForm((p) => ({ ...p, tk_index: e.target.value }))} />
                      <input className="crm-input md:col-span-2" placeholder="Адрес" value={orderForm.tk_address} onChange={(e) => setOrderForm((p) => ({ ...p, tk_address: e.target.value }))} />
                      <input className="crm-input" placeholder="ФИО получателя" value={orderForm.tk_recipient_name} onChange={(e) => setOrderForm((p) => ({ ...p, tk_recipient_name: e.target.value }))} />
                      <input className="crm-input" placeholder="Телефон получателя" value={orderForm.tk_recipient_phone} onChange={(e) => setOrderForm((p) => ({ ...p, tk_recipient_phone: e.target.value }))} />
                    </div>
                  ) : null}
                </div>
                <div className="md:col-span-2 rounded-lg border border-[#2a2a2e] bg-[#121216] p-3">
                  <div className="mb-3">
                    <button
                      className="crm-create-order-btn crm-create-order-btn--strong"
                      onClick={() => {
                        const input = document.getElementById('crm-order-product-search');
                        if (input && typeof input.focus === 'function') input.focus();
                      }}
                    >
                      + Добавить в заказ
                    </button>
                  </div>
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm text-white">Товары в заказе</p>
                    <button className="crm-primary-btn rounded-lg px-[14px] py-[7px] text-[12px] font-medium" onClick={openQuickProductModal}>
                      Быстрое создание товара
                    </button>
                  </div>
                  <input
                    id="crm-order-product-search"
                    className="crm-input !mb-3 !h-9 w-full"
                    placeholder="Поиск товара по названию, бренду, SKU"
                    value={orderProductSearch}
                    onChange={(e) => setOrderProductSearch(e.target.value)}
                  />
                  {orderProductSearch.trim() ? (
                    <div className="mb-3 max-h-44 space-y-1 overflow-auto rounded-md border border-[#2a2a2e] bg-[#17171b] p-2">
                      {orderProductOptions.map((p) => (
                        <div key={p.id} className="flex items-center justify-between gap-2 rounded px-2 py-1.5">
                          <span className="truncate text-xs text-[#d2d2d8]">{p.name}</span>
                          <button className="crm-outline-btn rounded border px-2 py-1 text-xs" onClick={() => addProductToOrder(p)}>
                            Добавить
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : null}
                  <div className="space-y-2">
                    {orderItemsDetailed.map((line) => {
                      const stockLimit = String(line.product.condition || 'new').toLowerCase() === 'used'
                        ? 1
                        : Math.max(0, Number(line.product.stock_qty ?? 0) || 0);
                      return (
                        <div key={line.product_id} className="grid grid-cols-1 items-center gap-2 md:grid-cols-[1fr_110px_120px_auto]">
                          <p className="truncate text-sm text-[#d2d2d8]">{line.product.name}</p>
                          <input
                            className="crm-input !h-9"
                            type="number"
                            min={1}
                            max={stockLimit > 0 ? stockLimit : undefined}
                            value={line.qty}
                            onChange={(e) =>
                              setOrderForm((prev) => ({
                                ...prev,
                                items: (prev.items || []).map((it) =>
                                  String(it.product_id) === String(line.product_id)
                                    ? {
                                        ...it,
                                        qty: stockLimit > 0
                                          ? Math.max(1, Math.min(stockLimit, Number(e.target.value || 1)))
                                          : Math.max(1, Number(e.target.value || 1)),
                                      }
                                    : it
                                ),
                              }))
                            }
                          />
                          <p className="text-sm text-[#fafaf9]">{Number(line.lineTotal || 0).toLocaleString('ru-RU')} ₽</p>
                          <button
                            className="crm-outline-btn rounded border px-3 py-1.5 text-xs"
                            onClick={() =>
                              setOrderForm((prev) => ({
                                ...prev,
                                items: (prev.items || []).filter((it) => String(it.product_id) !== String(line.product_id)),
                              }))
                            }
                          >
                            Удалить
                          </button>
                        </div>
                      );
                    })}
                    {orderItemsDetailed.length === 0 ? <p className="text-xs text-[#8f8f95]">Товары пока не добавлены</p> : null}
                  </div>
                </div>
                <div className="md:col-span-2 rounded-lg border border-[#2a2a2e] bg-[#121216] p-3">
                  <p className="mb-2 text-sm text-white">Скидка на заказ</p>
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-[200px_1fr]">
                    <select className="crm-input crm-select" value={orderDiscountType} onChange={(e) => setOrderDiscountType(e.target.value)}>
                      <option value="none">Без скидки</option>
                      <option value="percent">Проценты</option>
                      <option value="amount">Сумма</option>
                    </select>
                    <input
                      className="crm-input"
                      placeholder={orderDiscountType === 'percent' ? 'Скидка %' : 'Скидка ₽'}
                      value={orderDiscountValue}
                      onChange={(e) => setOrderDiscountValue(e.target.value)}
                      disabled={orderDiscountType === 'none'}
                    />
                  </div>
                  <div className="mt-3 grid grid-cols-1 gap-2 text-sm md:grid-cols-3">
                    <p className="text-[#b2b2b8]">Подытог: <span className="text-white">{orderSubtotal.toLocaleString('ru-RU')} ₽</span></p>
                    <p className="text-[#b2b2b8]">Скидка: <span className="text-white">{orderDiscountAmount.toLocaleString('ru-RU')} ₽</span></p>
                    <p className="text-[#b2b2b8]">Итого: <span className="text-white">{orderTotal.toLocaleString('ru-RU')} ₽</span></p>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button className="crm-outline-btn rounded-lg border px-4 py-2 text-sm" onClick={() => setOrderBuilderOpen(false)}>Свернуть</button>
                <button className="crm-primary-btn rounded-lg px-4 py-2 text-sm font-medium" onClick={() => createOrder.mutate()}>Оформить заказ</button>
              </div>
            </div>
          ) : null}
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <input
              className="crm-input max-w-[360px]"
              placeholder="Поиск: номер клиента или номер заказа"
              value={ordersSearch}
              onChange={(e) => setOrdersSearch(e.target.value)}
            />
            <select className="crm-input crm-select !w-auto min-w-[170px]" value={ordersSort} onChange={(e) => setOrdersSort(e.target.value)}>
              <option value="newest">Сначала новые</option>
              <option value="oldest">Сначала старые</option>
              <option value="total_desc">Сумма: больше</option>
              <option value="total_asc">Сумма: меньше</option>
            </select>
          </div>
          <div className="space-y-2">
            {filteredOrders.map((o) => (
              <div key={o.id || o.order_number} className="rounded-lg border border-[#26262d] bg-[#17171b] p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-white">{o.order_number}</p>
                    <p className="text-xs text-[#8f8f95]">{o.customer_name || 'Без имени'} • {normalizePhone(o?.shipping_address?.phone || '') || '-'} • {getOrderTotal(o).toLocaleString('ru-RU')} ₽</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded border border-[#2A2A2E] px-2 py-1 text-xs text-[#A0A0A5]">
                      {ORDER_STATUSES.find((s) => s.value === (o.status || 'new'))?.label || (o.status || 'new')}
                    </span>
                    <button className="crm-outline-btn inline-flex items-center gap-1 rounded border px-3 py-1 text-xs" onClick={() => openOrderDetails(o)}>
                      <Eye size={14} />
                      Открыть заказ
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      );
    }

    if (tab === 'customers') {
      return (
        <Card
          title="Клиенты"
          subtitle="Список клиентов из CRM"
          action={<button className="crm-primary-btn rounded-lg px-4 py-2 text-sm font-medium" onClick={() => setCustomerModalOpen(true)}>Создать клиента</button>}
        >
          <div className="mb-4">
            <input
              className="crm-input max-w-[420px]"
              placeholder="Поиск клиента: ФИО или последние 4 цифры номера"
              value={customersSearch}
              onChange={(e) => setCustomersSearch(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            {filteredCustomers.map((c) => (
              <div key={c.id} className="rounded-lg border border-[#26262d] bg-[#17171b] p-3 text-sm text-[#d2d2d8]">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="truncate">{c.full_name || 'Без имени'} • {c.phone || '-'} • {c.email || '-'}</p>
                  <button className="crm-outline-btn inline-flex items-center gap-1 rounded border px-3 py-1 text-xs" onClick={() => openCustomerDetails(c)}>
                    <Eye size={14} />
                    Открыть профиль
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      );
    }

    if (tab === 'categories') {
      const renderBranch = (node, depth = 0) => {
        const children = byParent[String(node.id)] || [];
        return (
          <div key={node.id} className={`${depth > 0 ? 'ml-5 border-l border-[#2a2a2e] pl-3' : ''} space-y-2`}>
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#26262d] bg-[#17171b] p-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">{node.name}</p>
                <p className="truncate text-xs text-[#8f8f95]">ID: {node.id} • уровень {Number(node.level || 0)}</p>
              </div>
              <div className="flex items-center gap-2">
                <button className="crm-outline-btn rounded border px-3 py-1 text-xs" onClick={() => openCategoryEdit(node)}>Изменить</button>
                <button className="crm-danger-btn rounded px-3 py-1 text-xs" onClick={() => window.confirm('Удалить категорию?') && deleteCategory.mutate(node.id)}>Удалить</button>
              </div>
            </div>
            {showFullCategoryTree && children.length > 0 ? children.map((child) => renderBranch(child, depth + 1)) : null}
          </div>
        );
      };

      return (
        <Card
          title="Категории"
          subtitle="Привязка категорий, подкатегорий и подподкатегорий"
          action={
            <div className="flex items-center gap-2">
              <button className="crm-outline-btn rounded-lg border px-4 py-2 text-sm" onClick={() => setShowFullCategoryTree((p) => !p)}>
                {showFullCategoryTree ? 'Кратко' : 'Развернуть полностью'}
              </button>
              <button className="crm-primary-btn rounded-lg px-4 py-2 text-sm font-medium" onClick={() => setCategoryModalOpen(true)}>Создать категорию</button>
            </div>
          }
        >
          <div className="space-y-3">
            {rootCategories.map((root) => {
              const children = byParent[String(root.id)] || [];
              const expanded = !!expandedCategories[root.id];
              return (
                <div key={root.id} className="rounded-xl border border-[#26262d] bg-[#151519] p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-white">{root.name}</p>
                      <p className="text-xs text-[#8f8f95]">
                        Подкатегорий: {children.length}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="crm-outline-btn rounded border px-3 py-1 text-xs" onClick={() => setExpandedCategories((prev) => ({ ...prev, [root.id]: !prev[root.id] }))}>
                        {expanded ? 'Скрыть' : 'Развернуть'}
                      </button>
                      <button className="crm-outline-btn rounded border px-3 py-1 text-xs" onClick={() => openCategoryEdit(root)}>Изменить</button>
                      <button className="crm-danger-btn rounded px-3 py-1 text-xs" onClick={() => window.confirm('Удалить категорию?') && deleteCategory.mutate(root.id)}>Удалить</button>
                    </div>
                  </div>
                  {expanded ? <div className="mt-3 space-y-2">{children.map((child) => renderBranch(child, 1))}</div> : null}
                </div>
              );
            })}
          </div>
        </Card>
      );
    }

    if (tab === 'brands') {
      const knownMap = new Map((brandsQ.data || []).map((b) => [String(b.name || '').trim().toLowerCase(), b]));
      const fullList = mergedBrandOptions.map((name) => {
        const key = String(name || '').trim().toLowerCase();
        const known = knownMap.get(key);
        return { name, known };
      });
      return (
        <Card
          title="Бренды"
          subtitle="Справочник брендов"
          action={<button className="crm-primary-btn rounded-lg px-4 py-2 text-sm font-medium" onClick={() => openBrandModal()}>Создать бренд</button>}
        >
          <div className="space-y-2">
            {fullList.map((b) => (
              <div key={`${b.name}-${b.known?.id || 'missing'}`} className="flex items-center justify-between rounded-lg border border-[#26262d] bg-[#17171b] p-3">
                <span className="text-sm text-white">
                  {b.name}
                  {!b.known ? <span className="ml-2 text-xs text-[#FCD34D]">(есть в товарах, нет в справочнике)</span> : null}
                </span>
                <div className="flex items-center gap-2">
                  {b.known ? (
                    <>
                      <button className="crm-outline-btn rounded border px-3 py-1 text-xs" onClick={() => openBrandModal(b.known)}>Изменить</button>
                      <button className="crm-danger-btn rounded px-3 py-1 text-xs" onClick={() => deleteBrand.mutate(b.known.id)}>Удалить</button>
                    </>
                  ) : (
                    <button
                      className="crm-outline-btn rounded border px-3 py-1 text-xs"
                      onClick={async () => {
                        await createBrandQuick(b.name);
                        queryClient.invalidateQueries({ queryKey: ['crm-product-brands'] });
                      }}
                    >
                      Добавить в справочник
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>          
        </Card>
      );
    }

    if (tab === 'looks') {
      return (
        <Card
          title="Образы"
          subtitle="Управление готовыми образами"
          action={<button className="crm-primary-btn rounded-lg px-4 py-2 text-sm font-medium" onClick={() => openLookModal()}>Создать образ</button>}
        >
          <div className="space-y-2">
            {(looksQ.data || []).map((look) => (
              <div key={look.id} className="rounded-lg border border-[#26262d] bg-[#17171b] p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">{look.name}</p>
                    <p className="truncate text-xs text-[#8f8f95]">slug: {look.slug || '-'}</p>
                    <p className="mt-1 text-xs text-[#54A0C5]">
                      Категории: {Array.isArray(look.look_categories) && look.look_categories.length > 0 ? look.look_categories.join(', ') : (look.look_category || 'Город')}
                    </p>
                    <p className="mt-1 text-xs text-[#b2b2b8]">Товаров в образе: {Array.isArray(look.product_ids) ? look.product_ids.length : 0}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="crm-outline-btn rounded border px-3 py-1 text-xs" onClick={() => openLookModal(look)}>Изменить</button>
                    <button className="crm-danger-btn rounded px-3 py-1 text-xs" onClick={() => window.confirm('Удалить образ?') && deleteLook.mutate(look.id)}>Удалить</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      );
    }

    if (tab === 'settings') {
      return (
        <Card title="Настройки" subtitle="Параметры магазина">
          <div className="space-y-2">
            {Object.entries(settingsQ.data || {}).map(([key, value]) => (
              <div key={key} className="grid grid-cols-1 items-center gap-2 md:grid-cols-[240px_1fr_auto]">
                <label className="text-sm text-[#b2b2b8]">{key}</label>
                <input className="crm-input" defaultValue={value || ''} onBlur={(e) => saveSetting.mutate({ key, value: e.target.value })} />
                <button className="crm-outline-btn rounded border px-3 py-2 text-xs">Сохранить</button>
              </div>
            ))}
          </div>
        </Card>
      );
    }

    if (tab === 'messages') {
      return (
        <Card title="Сообщения" subtitle="Заявки и обратная связь">
          <div className="space-y-2">
            {(messagesQ.data || []).map((m) => (
              <div key={m.id} className="rounded-lg border border-[#26262d] bg-[#17171b] p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-white">{m.name || 'Без имени'} {m.phone ? `• ${m.phone}` : ''}</p>
                    <p className="mt-1 line-clamp-2 text-sm text-[#b2b2b8]">{m.message}</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="crm-outline-btn inline-flex items-center gap-1 rounded border px-3 py-1 text-xs" onClick={() => setSelectedMessage(m)}>
                      <Eye size={14} />
                      Открыть
                    </button>
                    <select className="crm-input !h-8 !py-0 text-xs" value={m.status || 'new'} onChange={(e) => updateMessage.mutate({ id: m.id, status: e.target.value })}>
                      <option value="new">Новый</option>
                      <option value="read">Прочитан</option>
                      <option value="replied">Отвечен</option>
                      <option value="archived">Архив</option>
                    </select>
                    <button className="crm-danger-btn rounded px-3 py-1 text-xs" onClick={() => removeMessage.mutate(m.id)}>Удалить</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      );
    }

    return (
      <Card title="IP-блок" subtitle="Ручная блокировка IP-адресов">
        <div className="mb-4 grid grid-cols-1 gap-2 md:grid-cols-[1fr_1fr_auto]">
          <input className="crm-input" placeholder="IP адрес" value={newIp.ip_address} onChange={(e) => setNewIp((p) => ({ ...p, ip_address: e.target.value }))} />
          <input className="crm-input" placeholder="Причина" value={newIp.reason} onChange={(e) => setNewIp((p) => ({ ...p, reason: e.target.value }))} />
          <button className="crm-primary-btn rounded-lg px-4" onClick={() => blockIp.mutate()}>Заблокировать</button>
        </div>
        <div className="space-y-2">
          {(blockedQ.data || []).map((i) => (
            <div key={i.id} className="flex items-center justify-between rounded-lg border border-[#26262d] bg-[#17171b] p-3">
              <span className="text-sm text-white">{i.ip_address} <span className="text-[#8f8f95]">• {i.reason || 'без причины'}</span></span>
              <button className="crm-outline-btn rounded border px-3 py-1 text-xs" onClick={() => unblockIp.mutate(i.id)}>Разблокировать</button>
            </div>
          ))}
        </div>
      </Card>
    );
  };

  return (
    <div className="crm-shell min-h-screen p-3 md:p-5">
      <div className="h-auto min-h-[calc(100vh-24px)] w-full overflow-visible rounded-xl border border-[#1E1E22] bg-[#0D0D0F] md:h-[calc(100vh-40px)] md:min-h-[760px] md:overflow-hidden">
        <div className="grid h-auto min-h-[calc(100vh-24px)] grid-cols-1 md:h-full md:min-h-0 md:grid-cols-[260px_1fr]">
          <aside className="hidden h-full border-r border-[#1E1E22] bg-[#111114] md:flex md:flex-col">
            <div className="flex items-center gap-2 border-b border-[#1E1E22] px-6 py-5">
              <span className="text-[15px] font-bold tracking-[2px] text-white">MOTOTOM</span>
              <span className="rounded bg-[#54A0C520] px-2 py-0.5 text-[10px] font-bold tracking-[1px] text-[#54A0C5]">CRM</span>
            </div>
            <div className="space-y-1 px-3 py-4">
              {TABS.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  className={`crm-tab-btn flex w-full items-center gap-2 ${tab === item.key ? 'is-active' : ''}`}
                  onClick={() => setTab(item.key)}
                >
                  <item.Icon size={16} color={tab === item.key ? '#54A0C5' : '#6B6B70'} />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
            <div className="mt-auto border-t border-[#1E1E22] p-3">
              <button className="crm-outline-btn mt-2 w-full rounded-lg border px-3 py-2 text-xs" onClick={() => { localStorage.removeItem(AUTH_KEY); setIsAuth(false); }}>
                Выйти
              </button>
            </div>
          </aside>
          <main className="flex h-auto min-h-0 flex-col overflow-y-auto p-4 md:h-full md:p-6">
            {tab !== 'products' ? (
              <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
                <Stat label="Товары" value={(productsQ.data || []).length} />
                <Stat label="Заказы" value={(ordersQ.data || []).length} />
                <Stat label="Сообщения" value={(messagesQ.data || []).length} />
                <Stat label="IP в блоке" value={(blockedQ.data || []).length} />
              </div>
            ) : null}
            {section()}
          </main>
        </div>
      </div>
      <ProductModal
        open={productModalOpen}
        onClose={() => { setProductModalOpen(false); setEditingProduct(null); }}
        onSubmit={(payload) => saveProduct.mutate(payload)}
        categories={categoriesQ.data || []}
        brands={mergedBrandOptions.map((name) => ({ id: name, name }))}
        onCreateBrand={createBrandQuick}
        initial={editingProduct}
      />
      {selectedMessage ? (
        <div className="fixed inset-0 z-[141] bg-black/70 p-4 md:p-6" onClick={() => setSelectedMessage(null)}>
          <div className="mx-auto w-full max-w-2xl rounded-2xl border border-[#2b2b31] bg-[#131317] p-5" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Сообщение</h3>
              <button className="rounded-md border border-[#2A2A2E] p-1.5 text-[#A0A0A5]" onClick={() => setSelectedMessage(null)}><X size={16} /></button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="rounded-lg border border-[#26262d] bg-[#17171b] p-3">
                <p className="text-xs text-[#8f8f95]">Имя</p>
                <p className="mt-1 text-white">{selectedMessage.name || 'Без имени'}</p>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="rounded-lg border border-[#26262d] bg-[#17171b] p-3">
                  <p className="text-xs text-[#8f8f95]">Телефон</p>
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <p className="text-white">{selectedMessage.phone || '-'}</p>
                    {selectedMessage.phone ? <button className="crm-outline-btn rounded border px-2 py-1 text-xs" onClick={() => copyText(selectedMessage.phone, 'Телефон')}>Копировать</button> : null}
                  </div>
                </div>
                <div className="rounded-lg border border-[#26262d] bg-[#17171b] p-3">
                  <p className="text-xs text-[#8f8f95]">Email</p>
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <p className="truncate text-white">{selectedMessage.email || '-'}</p>
                    {selectedMessage.email ? <button className="crm-outline-btn rounded border px-2 py-1 text-xs" onClick={() => copyText(selectedMessage.email, 'Email')}>Копировать</button> : null}
                  </div>
                </div>
              </div>
              <div className="rounded-lg border border-[#26262d] bg-[#17171b] p-3">
                <p className="text-xs text-[#8f8f95]">Сообщение</p>
                <p className="mt-2 whitespace-pre-wrap leading-6 text-[#e8e8ec]">{selectedMessage.message || '-'}</p>
              </div>
              <div className="flex items-center justify-end gap-2">
                <select className="crm-input !h-9 !py-0 text-xs" value={selectedMessage.status || 'new'} onChange={(e) => {
                  const status = e.target.value;
                  updateMessage.mutate({ id: selectedMessage.id, status }, { onSuccess: (data) => setSelectedMessage(data) });
                }}>
                  <option value="new">Новый</option>
                  <option value="read">Прочитан</option>
                  <option value="replied">Отвечен</option>
                  <option value="archived">Архив</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      ) : null}
      {selectedCustomer ? (
        <div className="fixed inset-0 z-[142] bg-black/70 p-4 md:p-6" onClick={closeCustomerDetails}>
          <div className="mx-auto w-full max-w-4xl rounded-2xl border border-[#2b2b31] bg-[#131317] p-5" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Профиль клиента</h3>
              <div className="flex items-center gap-2">
                <button
                  className="rounded-md border border-[#2A2A2E] p-1.5 text-[#A0A0A5]"
                  title="Редактировать клиента"
                  onClick={() => setIsCustomerProfileEdit((p) => !p)}
                >
                  <Pencil size={16} />
                </button>
                <button className="rounded-md border border-[#2A2A2E] p-1.5 text-[#A0A0A5]" onClick={closeCustomerDetails}><X size={16} /></button>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="rounded-lg border border-[#26262d] bg-[#17171b] p-3">
                <p className="text-xs text-[#8f8f95]">ФИО</p>
                {isCustomerProfileEdit ? (
                  <input className="crm-input mt-1 !h-9 !py-0" value={customerProfileForm.full_name || ''} onChange={(e) => setCustomerProfileForm((p) => ({ ...p, full_name: e.target.value }))} />
                ) : (
                  <p className="mt-1 text-white">{selectedCustomer.full_name || '-'}</p>
                )}
              </div>
              <div className="rounded-lg border border-[#26262d] bg-[#17171b] p-3">
                <p className="text-xs text-[#8f8f95]">Телефон</p>
                <div className="mt-1 flex items-center justify-between gap-2">
                  {isCustomerProfileEdit ? (
                    <input className="crm-input !h-9 !py-0" value={customerProfileForm.phone || ''} onChange={(e) => setCustomerProfileForm((p) => ({ ...p, phone: e.target.value }))} />
                  ) : (
                    <>
                      <p className="text-white">{selectedCustomer.phone || '-'}</p>
                      {selectedCustomer.phone ? <button className="crm-outline-btn rounded border px-2 py-1 text-xs" onClick={() => copyText(selectedCustomer.phone, 'Телефон')}>Копировать</button> : null}
                    </>
                  )}
                </div>
              </div>
              <div className="rounded-lg border border-[#26262d] bg-[#17171b] p-3">
                <p className="text-xs text-[#8f8f95]">Email</p>
                {isCustomerProfileEdit ? (
                  <input className="crm-input mt-1 !h-9 !py-0" value={customerProfileForm.email || ''} onChange={(e) => setCustomerProfileForm((p) => ({ ...p, email: e.target.value }))} />
                ) : (
                  <p className="mt-1 text-white">{selectedCustomer.email || '-'}</p>
                )}
              </div>
              <div className="rounded-lg border border-[#26262d] bg-[#17171b] p-3 md:col-span-3">
                <p className="text-xs text-[#8f8f95]">Комментарий</p>
                {isCustomerProfileEdit ? (
                  <textarea className="crm-input mt-1 min-h-[84px] !pt-2" value={customerProfileForm.note || ''} onChange={(e) => setCustomerProfileForm((p) => ({ ...p, note: e.target.value }))} />
                ) : (
                  <p className="mt-1 whitespace-pre-wrap text-white">{selectedCustomer.note || '-'}</p>
                )}
              </div>
            </div>
            {isCustomerProfileEdit ? (
              <div className="mt-3 flex items-center justify-end gap-2">
                <button className="crm-outline-btn rounded border px-3 py-2 text-xs" onClick={() => {
                  setIsCustomerProfileEdit(false);
                  setCustomerProfileForm({
                    full_name: selectedCustomer.full_name || '',
                    phone: selectedCustomer.phone || '',
                    email: selectedCustomer.email || '',
                    note: selectedCustomer.note || '',
                  });
                }}>
                  Отмена
                </button>
                <button
                  className="crm-primary-btn rounded px-3 py-2 text-xs font-medium"
                  onClick={() => updateCustomer.mutate({
                    id: selectedCustomer.id,
                    payload: {
                      full_name: String(customerProfileForm.full_name || '').trim(),
                      phone: String(customerProfileForm.phone || '').trim(),
                      email: String(customerProfileForm.email || '').trim() || null,
                      note: String(customerProfileForm.note || '').trim() || null,
                    },
                  })}
                >
                  Сохранить
                </button>
              </div>
            ) : null}
            <div className="mt-4 rounded-xl border border-[#2a2a2e] bg-[#16161a] p-3">
              <p className="mb-3 text-sm font-medium text-white">Заказы клиента ({selectedCustomerOrders.length})</p>
              <div className="max-h-72 space-y-2 overflow-auto">
                {selectedCustomerOrders.map((o) => (
                  <div key={o.id || o.order_number} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#26262d] bg-[#17171b] p-3">
                    <div>
                      <p className="text-sm text-white">{o.order_number}</p>
                      <p className="text-xs text-[#8f8f95]">{getOrderTotal(o).toLocaleString('ru-RU')} ₽ • {ORDER_STATUSES.find((s) => s.value === (o.status || 'new'))?.label || o.status}</p>
                    </div>
                    <button className="crm-outline-btn inline-flex items-center gap-1 rounded border px-3 py-1 text-xs" onClick={() => openOrderDetails(o)}>
                      <Eye size={14} />
                      Открыть заказ
                    </button>
                  </div>
                ))}
                {selectedCustomerOrders.length === 0 ? <p className="text-xs text-[#8f8f95]">У клиента пока нет заказов</p> : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}
      {selectedOrder ? (
        <div className="fixed inset-0 z-[143] bg-black/70 p-4 md:p-6" onClick={() => setSelectedOrder(null)}>
          <div className="mx-auto w-full max-w-4xl rounded-2xl border border-[#2b2b31] bg-[#131317] p-5" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Заказ {selectedOrder.order_number}</h3>
              <button className="rounded-md border border-[#2A2A2E] p-1.5 text-[#A0A0A5]" onClick={() => setSelectedOrder(null)}><X size={16} /></button>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="rounded-lg border border-[#26262d] bg-[#17171b] p-3">
                <p className="text-xs text-[#8f8f95]">Клиент</p>
                <p className="mt-1 text-white">{selectedOrder.customer_name || 'Без имени'}</p>
              </div>
              <div className="rounded-lg border border-[#26262d] bg-[#17171b] p-3">
                <p className="text-xs text-[#8f8f95]">Телефон</p>
                <div className="mt-1 flex items-center justify-between gap-2">
                  <p className="text-white">{selectedOrder?.shipping_address?.phone || '-'}</p>
                  {selectedOrder?.shipping_address?.phone ? <button className="crm-outline-btn rounded border px-2 py-1 text-xs" onClick={() => copyText(selectedOrder.shipping_address.phone, 'Телефон')}>Копировать</button> : null}
                </div>
              </div>
              <div className="rounded-lg border border-[#26262d] bg-[#17171b] p-3">
                <p className="text-xs text-[#8f8f95]">Сумма</p>
                <p className="mt-1 text-white">{Number(selectedOrder.total || 0).toLocaleString('ru-RU')} ₽</p>
              </div>
            </div>
            <div className="mt-4 rounded-xl border border-[#2a2a2e] bg-[#16161a] p-3">
              <p className="mb-3 text-sm font-medium text-white">Товары в заказе</p>
              <div className="max-h-64 space-y-2 overflow-auto">
                {selectedOrderItems.map((line, idx) => (
                  <div key={`${line.productId}-${idx}`} className="grid grid-cols-1 gap-2 rounded-lg border border-[#26262d] bg-[#17171b] p-3 md:grid-cols-[1fr_90px_120px]">
                    <p className="text-sm text-white">{line.productName}</p>
                    <p className="text-sm text-[#A0A0A5]">x{line.qty}</p>
                    <p className="text-sm text-[#A0A0A5]">{Number(line.lineTotal || 0).toLocaleString('ru-RU')} ₽</p>
                  </div>
                ))}
                {selectedOrderItems.length === 0 ? <p className="text-xs text-[#8f8f95]">Товары не найдены</p> : null}
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
              <button
                className="rounded border border-[#7d2525] bg-[#3a1414] px-3 py-2 text-xs font-medium text-[#ff9b9b] hover:bg-[#4a1717]"
                onClick={() => archiveOrder.mutate({ orderNumber: selectedOrder.order_number, archived: true })}
              >
                В архив
              </button>
              <label className="flex items-center gap-2 text-sm text-[#d8d8dd]">
                <span>
                  Статус: {ORDER_STATUSES.find((s) => s.value === (selectedOrder.status || 'new'))?.label || 'Новый'}
                </span>
                <select
                  className="crm-input !h-9 !py-0 text-xs"
                  value={selectedOrder.status || 'new'}
                  onChange={(e) => {
                    const status = e.target.value;
                    updateOrderStatus.mutate(
                      { orderNumber: selectedOrder.order_number, status },
                      {
                        onSuccess: (data) => {
                          setSelectedOrder(data);
                          queryClient.invalidateQueries({ queryKey: ['crm-orders'] });
                        },
                      }
                    );
                  }}
                >
                  {ORDER_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </label>
            </div>
          </div>
        </div>
      ) : null}
      {quickProductModalOpen ? (
        <div className="fixed inset-0 z-[140] bg-black/60 p-4 md:p-6" onClick={() => setQuickProductModalOpen(false)}>
          <div className="mx-auto w-full max-w-2xl rounded-2xl border border-[#2b2b31] bg-[#131317] p-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-white">Быстрое создание товара</h3>
            <p className="mt-1 text-xs text-[#8f8f95]">Бренд + модель. Если шаблон не найден, обязательны только категория и состояние.</p>
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="relative">
                <input
                  className="crm-input"
                  placeholder="Бренд (поиск)"
                  value={quickProductBrandSearch}
                  onFocus={() => setQuickProductBrandOpen(true)}
                  onBlur={() => setTimeout(() => setQuickProductBrandOpen(false), 120)}
                  onChange={(e) => {
                    const value = e.target.value;
                    setQuickProductBrandSearch(value);
                    setQuickProductForm((p) => ({ ...p, brand: value }));
                    setQuickSelectedTemplate(null);
                    setQuickProductBrandOpen(true);
                  }}
                />
                {quickProductBrandOpen && quickFilteredBrands.length > 0 ? (
                  <div className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-[#2d2d32] bg-[#16161a] p-1 shadow-lg">
                    {quickFilteredBrands.slice(0, 15).map((b) => (
                      <button
                        key={b}
                        type="button"
                        className="block w-full rounded-md px-3 py-2 text-left text-sm text-[#d2d2d8] hover:bg-[#1f1f24] hover:text-white"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          setQuickProductBrandSearch(b);
                          setQuickProductForm((p) => ({ ...p, brand: b }));
                          setQuickSelectedTemplate(null);
                          setQuickProductBrandOpen(false);
                        }}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
              <input
                className="crm-input"
                placeholder="Модель"
                value={quickProductForm.model}
                onChange={(e) => {
                  setQuickSelectedTemplate(null);
                  setQuickProductForm((p) => ({ ...p, model: e.target.value }));
                }}
              />
              <select
                className="crm-input crm-select"
                value={quickProductForm.category_id}
                onChange={(e) => setQuickProductForm((p) => ({ ...p, category_id: e.target.value }))}
              >
                <option value="">Глобальная категория</option>
                {rootCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <div className="flex items-center gap-2 rounded-lg border border-[#2a2a2e] bg-[#16161a] p-1">
                <button
                  type="button"
                  className={`rounded-md px-3 py-2 text-sm ${String(quickProductForm.condition || 'new') === 'new' ? 'bg-[#54A0C5] text-white' : 'text-[#A0A0A5]'}`}
                  onClick={() => setQuickProductForm((p) => ({ ...p, condition: 'new' }))}
                >
                  Новое
                </button>
                <button
                  type="button"
                  className={`rounded-md px-3 py-2 text-sm ${String(quickProductForm.condition || 'new') === 'used' ? 'bg-[#54A0C5] text-white' : 'text-[#A0A0A5]'}`}
                  onClick={() => setQuickProductForm((p) => ({ ...p, condition: 'used' }))}
                >
                  Б/У
                </button>
              </div>
            </div>
            <div className="mt-4 rounded-lg border border-[#2a2a2e] bg-[#16161a] p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm text-[#fafaf9]">Шаблоны по бренду и модели</p>
                <span className="text-xs text-[#8f8f95]">{quickTemplateLoading ? 'Поиск...' : `${quickProductTemplates.length} шт`}</span>
              </div>
              {!quickProductForm.brand || !quickProductForm.model ? (
                <p className="text-xs text-[#8f8f95]">Введите бренд и модель для поиска шаблонов.</p>
              ) : quickProductTemplates.length === 0 ? (
                <p className="text-xs text-[#8f8f95]">Шаблон не найден. Будет создан новый товар с минимальными полями.</p>
              ) : (
                <div className="max-h-44 space-y-2 overflow-auto">
                  {quickProductTemplates.map((tpl) => (
                    <button
                      key={tpl.id}
                      type="button"
                      className={`flex w-full items-center justify-between rounded-md border px-3 py-2 text-left ${quickSelectedTemplate?.id === tpl.id ? 'border-[#54A0C5]' : 'border-[#2d2d32] hover:border-[#54A0C5]'}`}
                      onClick={() => {
                        setQuickSelectedTemplate(tpl);
                        const inferredModel = String(tpl.model || '').trim() || (
                          tpl.brand && String(tpl.name || '').toLowerCase().startsWith(String(tpl.brand).toLowerCase())
                            ? String(tpl.name).slice(String(tpl.brand).length).trim()
                            : String(quickProductForm.model || '')
                        );
                        setQuickProductForm((p) => ({
                          ...p,
                          model: inferredModel || p.model,
                          category_id: String(tpl.category_id || p.category_id || ''),
                          condition: String(tpl.condition || p.condition || 'new').toLowerCase() === 'used' ? 'used' : 'new',
                        }));
                      }}
                    >
                      <span className="text-sm text-white">{tpl.name}</span>
                      <span className="text-xs text-[#a7a7ad]">{Number(tpl.price || 0).toLocaleString('ru-RU')} ₽</span>
                    </button>
                  ))}
                </div>
              )}
              {quickSelectedTemplate ? (
                <p className="mt-2 text-xs text-[#F87171]">
                  Этот товар уже создан в системе{(Number(quickSelectedTemplate.stock_qty ?? (quickSelectedTemplate.in_stock ? 1 : 0)) > 0) ? ' и активен (в наличии)' : ''}.
                </p>
              ) : null}
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button className="crm-outline-btn rounded-lg border px-4 py-2 text-sm" onClick={() => setQuickProductModalOpen(false)}>Отмена</button>
              <button className="crm-primary-btn rounded-lg px-4 py-2 text-sm font-medium" disabled={quickProductSaving} onClick={saveQuickProduct}>
                {quickProductSaving ? 'Сохранение...' : 'Создать товар'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {customerModalOpen ? (
        <div className="fixed inset-0 z-[131] bg-black/60 p-4 md:p-6" onClick={() => setCustomerModalOpen(false)}>
          <div className="mx-auto w-full max-w-xl rounded-2xl border border-[#2b2b31] bg-[#131317] p-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-white">Создать клиента</h3>
            <div className="mt-4 space-y-3">
              <input className="crm-input" placeholder="ФИО" value={newCustomer.full_name} onChange={(e) => setNewCustomer((p) => ({ ...p, full_name: e.target.value }))} />
              <input className="crm-input" placeholder="Телефон" value={newCustomer.phone} onChange={(e) => setNewCustomer((p) => ({ ...p, phone: e.target.value }))} />
              <input className="crm-input" placeholder="Email" value={newCustomer.email} onChange={(e) => setNewCustomer((p) => ({ ...p, email: e.target.value }))} />
              <textarea className="crm-input min-h-[90px] !pt-3" placeholder="Комментарий" value={newCustomer.note} onChange={(e) => setNewCustomer((p) => ({ ...p, note: e.target.value }))} />
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button className="crm-outline-btn rounded-lg border px-4 py-2 text-sm" onClick={() => setCustomerModalOpen(false)}>Отмена</button>
              <button className="crm-primary-btn rounded-lg px-4 py-2 text-sm font-medium" onClick={() => createCustomer.mutate()}>Создать клиента</button>
            </div>
          </div>
        </div>
      ) : null}
      {categoryModalOpen ? (
        <div className="fixed inset-0 z-[132] bg-black/60 p-4 md:p-6" onClick={() => setCategoryModalOpen(false)}>
          <div className="mx-auto w-full max-w-xl rounded-2xl border border-[#2b2b31] bg-[#131317] p-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-white">Создать категорию</h3>
            <div className="mt-4 space-y-3">
              <input className="crm-input" placeholder="Название категории" value={newCategory.name} onChange={(e) => setNewCategory((p) => ({ ...p, name: e.target.value }))} />
              <select className="crm-input" value={newCategory.parent_id} onChange={(e) => setNewCategory((p) => ({ ...p, parent_id: e.target.value }))}>
                <option value="">Корневая категория</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{`${' '.repeat(Number(c.level || 0))}${c.name}`}</option>)}
              </select>
              <input className="crm-input" placeholder="Префикс названия товара (необязательно)" value={newCategory.product_name_prefix} onChange={(e) => setNewCategory((p) => ({ ...p, product_name_prefix: e.target.value }))} />
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button className="crm-outline-btn rounded-lg border px-4 py-2 text-sm" onClick={() => setCategoryModalOpen(false)}>Отмена</button>
              <button className="crm-primary-btn rounded-lg px-4 py-2 text-sm font-medium" onClick={() => createCategory.mutate()}>Создать категорию</button>
            </div>
          </div>
        </div>
      ) : null}
      {categoryEditModalOpen && editingCategory ? (
        <div className="fixed inset-0 z-[133] bg-black/60 p-4 md:p-6" onClick={() => setCategoryEditModalOpen(false)}>
          <div className="mx-auto w-full max-w-xl rounded-2xl border border-[#2b2b31] bg-[#131317] p-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-white">Изменить категорию</h3>
            <div className="mt-4 space-y-3">
              <input className="crm-input" placeholder="Название категории" value={categoryEditForm.name} onChange={(e) => setCategoryEditForm((p) => ({ ...p, name: e.target.value }))} />
              <select className="crm-input" value={categoryEditForm.parent_id} onChange={(e) => setCategoryEditForm((p) => ({ ...p, parent_id: e.target.value }))}>
                <option value="">Корневая категория</option>
                {categories.filter((c) => String(c.id) !== String(editingCategory.id)).map((c) => <option key={c.id} value={c.id}>{`${' '.repeat(Number(c.level || 0))}${c.name}`}</option>)}
              </select>
              <input className="crm-input" placeholder="Префикс названия товара (необязательно)" value={categoryEditForm.product_name_prefix} onChange={(e) => setCategoryEditForm((p) => ({ ...p, product_name_prefix: e.target.value }))} />
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button className="crm-outline-btn rounded-lg border px-4 py-2 text-sm" onClick={() => setCategoryEditModalOpen(false)}>Отмена</button>
              <button className="crm-primary-btn rounded-lg px-4 py-2 text-sm font-medium" onClick={() => updateCategory.mutate({ id: editingCategory.id, payload: { ...categoryEditForm, parent_id: categoryEditForm.parent_id || null } })}>Сохранить</button>
            </div>
          </div>
        </div>
      ) : null}
      {brandModalOpen ? (
        <div className="fixed inset-0 z-[134] bg-black/60 p-4 md:p-6" onClick={() => setBrandModalOpen(false)}>
          <div className="mx-auto w-full max-w-md rounded-2xl border border-[#2b2b31] bg-[#131317] p-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-white">{editingBrand ? 'Изменить бренд' : 'Создать бренд'}</h3>
            <div className="mt-4 space-y-3">
              <input className="crm-input" placeholder="Название бренда" value={newBrand.name} onChange={(e) => setNewBrand((p) => ({ ...p, name: e.target.value }))} />
              <input className="crm-input" type="number" placeholder="Сортировка" value={newBrand.sort_order} onChange={(e) => setNewBrand((p) => ({ ...p, sort_order: Number(e.target.value || 0) }))} />
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button className="crm-outline-btn rounded-lg border px-4 py-2 text-sm" onClick={() => setBrandModalOpen(false)}>Отмена</button>
              <button
                className="crm-primary-btn rounded-lg px-4 py-2 text-sm font-medium"
                onClick={() => {
                  if (editingBrand?.id) {
                    updateBrand.mutate({ id: editingBrand.id, payload: newBrand });
                  } else {
                    createBrand.mutate();
                  }
                }}
              >
                {editingBrand ? 'Сохранить' : 'Создать бренд'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {lookModalOpen ? (
        <div className="fixed inset-0 z-[135] bg-black/60 p-4 md:p-6" onClick={() => setLookModalOpen(false)}>
          <div className="mx-auto w-full max-w-2xl rounded-2xl border border-[#2b2b31] bg-[#131317] p-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-white">{editingLook ? 'Изменить образ' : 'Создать образ'}</h3>
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
              <input className="crm-input" placeholder="Название" value={lookForm.name} onChange={(e) => setLookForm((p) => ({ ...p, name: e.target.value }))} />
              <input className="crm-input" placeholder="Slug (необязательно)" value={lookForm.slug} onChange={(e) => setLookForm((p) => ({ ...p, slug: e.target.value }))} />
              <div className="rounded-lg border border-[#2a2a2e] bg-[#16161a] p-3 md:col-span-2">
                <p className="mb-2 text-sm text-[#fafaf9]">Категории образа (можно выбрать несколько)</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {LOOK_CATEGORY_OPTIONS.map((category) => {
                    const checked = Array.isArray(lookForm.look_categories) && lookForm.look_categories.includes(category);
                    return (
                      <label key={category} className="flex cursor-pointer items-center gap-2 rounded-md border border-[#2d2d32] px-2 py-1.5 text-sm text-[#d8d8dd]">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            setLookForm((prev) => {
                              const current = Array.isArray(prev.look_categories) ? prev.look_categories : [];
                              const next = e.target.checked
                                ? Array.from(new Set([...current, category]))
                                : current.filter((item) => item !== category);
                              return {
                                ...prev,
                                look_categories: next.length > 0 ? next : ['Город'],
                              };
                            });
                          }}
                        />
                        <span>{category}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
              <label className="crm-input flex cursor-pointer items-center justify-between text-[#b2b2b8] md:col-span-2">
                <span>{lookForm.cover_image_name || 'Загрузить фото обложки'}</span>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => uploadLookCover(e.target.files?.[0])} />
              </label>
              {lookForm.cover_image_url ? <img src={resolveImageUrl(lookForm.cover_image_url)} alt="" className="h-28 w-full rounded-lg border border-[#26262d] object-cover md:col-span-2" /> : null}
              <textarea className="crm-input min-h-[90px] !pt-3 md:col-span-2" placeholder="Описание" value={lookForm.description} onChange={(e) => setLookForm((p) => ({ ...p, description: e.target.value }))} />
              <div className="md:col-span-2 rounded-xl border border-[#2a2a2e] bg-[#16161a] p-3">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium text-white">Товары в образе ({(lookForm.product_ids || []).length})</p>
                  <input className="crm-input !h-9 w-full max-w-[320px]" placeholder="Поиск товара..." value={lookProductSearch} onChange={(e) => setLookProductSearch(e.target.value)} />
                </div>
                <div className="max-h-56 space-y-2 overflow-auto rounded-lg border border-[#26262d] bg-[#131317] p-2">
                  {lookProductOptions.map((product) => {
                    const checked = (lookForm.product_ids || []).includes(String(product.id));
                    return (
                      <label key={product.id} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-[#1c1c21]">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            const id = String(product.id);
                            setLookForm((prev) => ({
                              ...prev,
                              product_ids: e.target.checked
                                ? Array.from(new Set([...(prev.product_ids || []), id]))
                                : (prev.product_ids || []).filter((x) => x !== id),
                            }));
                          }}
                        />
                        <span className="text-sm text-[#d8d8dd]">{product.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button className="crm-outline-btn rounded-lg border px-4 py-2 text-sm" onClick={() => setLookModalOpen(false)}>Отмена</button>
              <button className="crm-primary-btn rounded-lg px-4 py-2 text-sm font-medium" onClick={() => saveLook.mutate()}>Сохранить</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

