import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Briefcase, Edit2, Trash2, Eye, EyeOff, Tag, Clock, Package,
} from 'lucide-react';
import { portfolioApi, SupplierProduct, ProductFormData } from '@/api/portfolio.api';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { fadeInUp, staggerContainer } from '@/utils/animations';

const CATEGORIES = [
  'Freight & Logistics', 'Raw Materials', 'Industrial Equipment', 'Construction Materials',
  'Food & Agriculture', 'Chemicals', 'Electronics', 'Textiles & Apparel',
  'Automotive Parts', 'Energy & Fuel', 'Medical Supplies', 'Packaging', 'Other',
];

const CURRENCIES = ['USD', 'EUR', 'GBP', 'AED', 'NGN', 'KES', 'INR', 'CNY', 'SGD'];

function ProductForm({
  initial,
  onSave,
  onCancel,
  saving,
}: {
  initial?: Partial<ProductFormData>;
  onSave: (data: ProductFormData) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<ProductFormData>({
    name: initial?.name ?? '',
    description: initial?.description ?? '',
    category: initial?.category ?? CATEGORIES[0],
    price: initial?.price,
    currency: initial?.currency ?? 'USD',
    minOrderQty: initial?.minOrderQty,
    leadTimeDays: initial?.leadTimeDays,
    certifications: initial?.certifications ?? [],
    tags: initial?.tags ?? [],
  });
  const [certInput, setCertInput] = useState('');
  const [tagInput, setTagInput] = useState('');

  const addChip = (field: 'certifications' | 'tags', value: string) => {
    const v = value.trim();
    if (!v) return;
    setForm((f) => ({ ...f, [field]: [...f[field], v] }));
    if (field === 'certifications') setCertInput('');
    else setTagInput('');
  };

  const removeChip = (field: 'certifications' | 'tags', idx: number) => {
    setForm((f) => ({ ...f, [field]: f[field].filter((_, i) => i !== idx) }));
  };

  return (
    <div className="p-6 space-y-4">
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Product / Service Name *</label>
        <input
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-brand-300"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder="e.g. Bulk Cement Supply"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Category *</label>
        <select
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-brand-300 bg-white"
          value={form.category}
          onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
        >
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
        <textarea
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-brand-300 resize-none"
          rows={3}
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          placeholder="Describe your product or service..."
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2">
          <label className="block text-xs font-medium text-gray-600 mb-1">Price (optional)</label>
          <input
            type="number"
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-brand-300"
            value={form.price ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, price: e.target.value ? Number(e.target.value) : undefined }))}
            placeholder="0.00"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Currency</label>
          <select
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-brand-300 bg-white"
            value={form.currency}
            onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
          >
            {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Min. Order Qty</label>
          <input
            type="number"
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-brand-300"
            value={form.minOrderQty ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, minOrderQty: e.target.value ? Number(e.target.value) : undefined }))}
            placeholder="1"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Lead Time (days)</label>
          <input
            type="number"
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-brand-300"
            value={form.leadTimeDays ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, leadTimeDays: e.target.value ? Number(e.target.value) : undefined }))}
            placeholder="7"
          />
        </div>
      </div>

      {/* Certifications */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Certifications</label>
        <div className="flex gap-2 mb-2 flex-wrap">
          {form.certifications.map((c, i) => (
            <span key={i} className="flex items-center gap-1 bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-full">
              {c}
              <button type="button" onClick={() => removeChip('certifications', i)} className="ml-1 hover:text-blue-900">×</button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-brand-300"
            value={certInput}
            onChange={(e) => setCertInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addChip('certifications', certInput); } }}
            placeholder="ISO 9001, HACCP..."
          />
          <button type="button" onClick={() => addChip('certifications', certInput)} className="text-xs text-brand-600 hover:text-brand-800 px-2">Add</button>
        </div>
      </div>

      {/* Tags */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Tags</label>
        <div className="flex gap-2 mb-2 flex-wrap">
          {form.tags.map((t, i) => (
            <span key={i} className="flex items-center gap-1 bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
              {t}
              <button type="button" onClick={() => removeChip('tags', i)} className="ml-1 hover:text-gray-900">×</button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-brand-300"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addChip('tags', tagInput); } }}
            placeholder="bulk, B2B, export..."
          />
          <button type="button" onClick={() => addChip('tags', tagInput)} className="text-xs text-brand-600 hover:text-brand-800 px-2">Add</button>
        </div>
      </div>

      <div className="flex gap-3 pt-2 border-t border-gray-100">
        <Button variant="secondary" size="md" className="flex-1" onClick={onCancel}>Cancel</Button>
        <Button size="md" className="flex-1" loading={saving} onClick={() => onSave(form)}>Save Product</Button>
      </div>
    </div>
  );
}

function ProductCard({ product, onEdit, onDelete, onTogglePublish }: {
  product: SupplierProduct;
  onEdit: () => void;
  onDelete: () => void;
  onTogglePublish: () => void;
}) {
  return (
    <motion.div
      variants={fadeInUp}
      className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-semibold text-gray-900 truncate">{product.name}</h3>
            <Badge variant={product.isPublished ? 'success' : 'default'}>
              {product.isPublished ? 'Live' : 'Draft'}
            </Badge>
          </div>
          <span className="text-xs text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full">{product.category}</span>
        </div>
        <div className="flex items-center gap-1 ml-2">
          <button onClick={onTogglePublish} className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-50" title={product.isPublished ? 'Unpublish' : 'Publish'}>
            {product.isPublished ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
          <button onClick={onEdit} className="p-1.5 text-gray-400 hover:text-brand-600 rounded-lg hover:bg-gray-50">
            <Edit2 className="w-4 h-4" />
          </button>
          <button onClick={onDelete} className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-50">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {product.description && (
        <p className="text-xs text-gray-500 mb-3 line-clamp-2">{product.description}</p>
      )}

      <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-3">
        {product.price && (
          <span className="font-semibold text-green-700">{product.currency} {Number(product.price).toLocaleString()}</span>
        )}
        {product.minOrderQty && (
          <span className="flex items-center gap-1"><Package className="w-3 h-3" /> MOQ: {product.minOrderQty}</span>
        )}
        {product.leadTimeDays && (
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {product.leadTimeDays}d lead</span>
        )}
      </div>

      {product.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {product.tags.slice(0, 4).map((t) => (
            <span key={t} className="flex items-center gap-1 text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">
              <Tag className="w-2.5 h-2.5" />{t}
            </span>
          ))}
        </div>
      )}
    </motion.div>
  );
}

export default function PortfolioPage() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState<SupplierProduct | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['portfolio'],
    queryFn: () => portfolioApi.list(),
  });

  const createMutation = useMutation({
    mutationFn: portfolioApi.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['portfolio'] }); setShowModal(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ProductFormData> }) => portfolioApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['portfolio'] }); setEditProduct(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: portfolioApi.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['portfolio'] }),
  });

  const publishMutation = useMutation({
    mutationFn: portfolioApi.togglePublish,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['portfolio'] }),
  });

  const products = data?.products ?? [];

  return (
    <div className="p-8">
      <motion.div variants={fadeInUp} initial="initial" animate="animate" className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Portfolio</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your products and services visible to buyers</p>
        </div>
        <Button size="md" icon={<Plus className="w-4 h-4" />} onClick={() => setShowModal(true)}>
          Add Product
        </Button>
      </motion.div>

      {isLoading ? (
        <div className="text-center py-16 text-gray-400 text-sm">Loading...</div>
      ) : products.length === 0 ? (
        <motion.div variants={fadeInUp} initial="initial" animate="animate" className="text-center py-24">
          <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Briefcase className="w-8 h-8 text-brand-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">No products yet</h3>
          <p className="text-gray-500 text-sm max-w-xs mx-auto mb-6">
            Add your products or services so buyers can find and contact you.
          </p>
          <Button size="md" icon={<Plus className="w-4 h-4" />} onClick={() => setShowModal(true)}>
            Add your first product
          </Button>
        </motion.div>
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
        >
          <AnimatePresence>
            {products.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                onEdit={() => setEditProduct(p)}
                onDelete={() => { if (confirm('Delete this product?')) deleteMutation.mutate(p.id); }}
                onTogglePublish={() => publishMutation.mutate(p.id)}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Add modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Product / Service" size="lg">
        <ProductForm
          onSave={(data) => createMutation.mutate(data)}
          onCancel={() => setShowModal(false)}
          saving={createMutation.isPending}
        />
      </Modal>

      {/* Edit modal */}
      <Modal isOpen={!!editProduct} onClose={() => setEditProduct(null)} title="Edit Product" size="lg">
        {editProduct && (
          <ProductForm
            initial={editProduct}
            onSave={(data) => updateMutation.mutate({ id: editProduct.id, data })}
            onCancel={() => setEditProduct(null)}
            saving={updateMutation.isPending}
          />
        )}
      </Modal>
    </div>
  );
}
