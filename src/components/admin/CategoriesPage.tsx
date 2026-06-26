import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Folder, X, Search } from 'lucide-react';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../../data/adminStore';

interface Category {
  id: string;
  name: string;
  description?: string;
  _count?: { products: number };
  createdAt?: string;
}

const emptyForm = { name: '', description: '' };

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const data = await getCategories();
      setCategories(data);
    } catch {
      showToast('Failed to load categories', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const openAdd = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowModal(true);
  };

  const openEdit = (cat: Category) => {
    setForm({ name: cat.name, description: cat.description || '' });
    setEditingId(cat.id);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await updateCategory(editingId, form);
        showToast('Category updated successfully', 'success');
      } else {
        await createCategory(form);
        showToast('Category created successfully', 'success');
      }
      closeModal();
      fetchCategories();
    } catch {
      showToast('Failed to save category', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (cat: Category) => {
    if (!window.confirm(`Delete category "${cat.name}"? This cannot be undone.`)) return;
    try {
      await deleteCategory(cat.id);
      showToast('Category deleted', 'success');
      fetchCategories();
    } catch {
      showToast('Failed to delete category', 'error');
    }
  };

  const filtered = categories.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.description || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center px-5 py-3 rounded-lg shadow-xl text-sm font-medium transition-all ${
          toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Categories</h1>
          <p className="text-sm text-gray-400 mt-1">Organise your products by category</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors font-medium"
        >
          <Plus size={18} className="mr-2" />
          Add Category
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex items-center space-x-4">
          <div className="p-3 rounded-lg bg-green-500/10">
            <Folder className="text-green-500" size={22} />
          </div>
          <div>
            <p className="text-sm text-gray-400">Total Categories</p>
            <p className="text-2xl font-bold text-white">{categories.length}</p>
          </div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex items-center space-x-4">
          <div className="p-3 rounded-lg bg-blue-500/10">
            <Folder className="text-blue-500" size={22} />
          </div>
          <div>
            <p className="text-sm text-gray-400">With Products</p>
            <p className="text-2xl font-bold text-white">
              {categories.filter(c => (c._count?.products ?? 0) > 0).length}
            </p>
          </div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex items-center space-x-4">
          <div className="p-3 rounded-lg bg-yellow-500/10">
            <Folder className="text-yellow-500" size={22} />
          </div>
          <div>
            <p className="text-sm text-gray-400">Empty Categories</p>
            <p className="text-2xl font-bold text-white">
              {categories.filter(c => (c._count?.products ?? 0) === 0).length}
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
        <input
          type="text"
          placeholder="Search categories..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-gray-900 border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
        />
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-x-auto custom-scrollbar">
        {isLoading ? (
          <div className="flex justify-center p-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-500">
            <Folder size={40} className="mb-3 opacity-40" />
            <p className="font-medium">No categories found</p>
            <p className="text-sm mt-1">
              {search ? 'Try a different search term' : 'Click "Add Category" to create one'}
            </p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-800">
            <thead className="bg-gray-800/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">Products</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Created</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-gray-900 divide-y divide-gray-800">
              {filtered.map(cat => (
                <tr key={cat.id} className="hover:bg-gray-800/50 transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg bg-green-500/10">
                        <Folder size={16} className="text-green-500" />
                      </div>
                      <span className="font-medium text-white">{cat.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-400 max-w-xs">
                    {cat.description || <span className="italic text-gray-600">No description</span>}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400">
                      {cat._count?.products ?? 0} products
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                    {cat.createdAt ? new Date(cat.createdAt).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button
                      onClick={() => openEdit(cat)}
                      className="text-blue-400 hover:text-blue-300 p-2 rounded-lg hover:bg-blue-400/10 transition-colors"
                      title="Edit"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(cat)}
                      className="text-red-400 hover:text-red-300 p-2 rounded-lg hover:bg-red-400/10 transition-colors ml-1"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-800">
              <h2 className="text-xl font-bold text-white">
                {editingId ? 'Edit Category' : 'Add Category'}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-white p-1 transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Category Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Dairy & Eggs"
                  className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none placeholder-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Optional short description..."
                  className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none resize-none placeholder-gray-500"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center px-6 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-medium transition-colors disabled:opacity-60"
                >
                  {saving ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  ) : null}
                  {editingId ? 'Save Changes' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
