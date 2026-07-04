import React, { useState, useEffect } from 'react';
import { getProducts, saveProduct, deleteProduct, getCategories } from '../../data/adminStore';
import { Product } from '../../types';
import { Plus, Search, Edit2, Trash2, X, Image as ImageIcon } from 'lucide-react';
import ImageUploader, { UploadedImage } from './ImageUploader';

// ✅ Convert HTTP to HTTPS (fixes mixed content warnings)
const normalizeImageUrl = (url: string | undefined | null): string => {
  if (!url) return '';
  if (url.startsWith('http://')) {
    return url.replace('http://', 'https://');
  }
  return url;
};

// Convert stored JSON images string to UploadedImage[]
function parseImages(raw: string | undefined | null): UploadedImage[] {
  if (!raw) return [];
  try {
    const arr: string[] = JSON.parse(raw);
    return arr.map((url, i) => ({
      id: `existing-${i}-${url}`,
      url: normalizeImageUrl(url), // ✅ Normalize URL
      preview: normalizeImageUrl(url)
    }));
  } catch {
    return [];
  }
}

const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productImages, setProductImages] = useState<UploadedImage[]>([]);
  const [categories, setCategories] = useState<{ id: string, name: string }[]>([
    { id: 'fruits', name: 'Fruits' },
    { id: 'vegetables', name: 'Vegetables' },
    { id: 'dairy', name: 'Dairy' },
    { id: 'meat', name: 'Meat & Poultry' },
    { id: 'dry-foods', name: 'Dry Foods' },
    { id: 'beverages', name: 'Beverages' },
    { id: 'household', name: 'Household Items' },
    { id: 'personal-care', name: 'Personal Care' }
  ]);

  const fetchProducts = async () => {
    try {
      const data = await getProducts();
      setProducts(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchProducts();
    const fetchCats = async () => {
      try {
        const data = await getCategories();
        if (data && data.length > 0) {
          setCategories(data.map((c: any) => ({ id: c.name.toLowerCase().replace(/\s+/g, '-'), name: c.name })));
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchCats();
  }, []);

  const openModal = (product: Product | null) => {
    setEditingProduct(product);
    if (product) {
      // Load existing images; fall back to single image field
      const imgs = parseImages((product as any).images);
      if (imgs.length === 0 && product.image) {
        setProductImages([{
          id: 'legacy-0',
          url: normalizeImageUrl(product.image), // ✅ Normalize URL
          preview: normalizeImageUrl(product.image)
        }]);
      } else {
        setProductImages(imgs);
      }
    } else {
      setProductImages([]);
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const imageUrls = productImages.map((img) => img.url);
    const mainImage = imageUrls[0] || '';

    const newProduct: any = {
      id: editingProduct?.id || `new-${Date.now()}`,
      name: formData.get('name') as string,
      price: parseFloat(formData.get('price') as string),
      originalPrice: formData.get('originalPrice') ? parseFloat(formData.get('originalPrice') as string) : undefined,
      image: mainImage,
      images: JSON.stringify(imageUrls),
      category: formData.get('category') as string,
      description: formData.get('description') as string,
      inStock: formData.get('inStock') === 'true',
      unit: formData.get('unit') as string,
      rating: editingProduct?.rating || 0,
      reviews: editingProduct?.reviews || 0,
      barcode: (formData.get('barcode') as string) || null,
      sku: (formData.get('sku') as string) || null,
    };

    try {
      await saveProduct(newProduct);
      await fetchProducts();
      setIsModalOpen(false);
      setEditingProduct(null);
      setProductImages([]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteProduct(id);
        await fetchProducts();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.barcode && p.barcode.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-white">Products</h1>
        <button
          onClick={() => openModal(null)}
          className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors font-medium"
        >
          <Plus size={20} className="mr-2" />
          Add Product
        </button>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-gray-800">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-800/50 text-gray-400">
              <tr>
                <th className="px-6 py-3 font-medium">Product</th>
                <th className="px-6 py-3 font-medium">Category</th>
                <th className="px-6 py-3 font-medium">Price</th>
                <th className="px-6 py-3 font-medium">Stock Status</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filteredProducts.map((product) => {
                const extraImages = parseImages((product as any).images);
                const displayImage = extraImages[0]?.url || normalizeImageUrl(product.image); // ✅ Normalize URL
                const imageCount = extraImages.length || (product.image ? 1 : 0);
                return (
                  <tr key={product.id} className="hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="relative w-12 h-12 rounded-lg bg-gray-800 overflow-hidden flex-shrink-0 border border-gray-700">
                          {displayImage ? (
                            <img src={displayImage} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon className="w-6 h-6 text-gray-500 m-auto mt-3" />
                          )}
                          {imageCount > 1 && (
                            <span className="absolute bottom-0 right-0 bg-black/70 text-white text-[9px] font-bold px-1 py-0.5 rounded-tl">
                              +{imageCount - 1}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-white">{product.name}</p>
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-gray-400 mt-0.5">
                            <span>{product.unit}</span>
                            {product.sku && (
                              <>
                                <span className="text-gray-600">•</span>
                                <span className="bg-gray-800 text-gray-300 px-1 py-0.25 rounded text-[10px]">
                                  SKU: {product.sku}
                                </span>
                              </>
                            )}
                            {product.barcode && (
                              <>
                                <span className="text-gray-600">•</span>
                                <span className="bg-gray-800 text-gray-300 px-1 py-0.25 rounded text-[10px]">
                                  BC: {product.barcode}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-300 capitalize">{product.category.replace('-', ' ')}</td>
                    <td className="px-6 py-4 font-medium text-white">${product.price.toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${product.inStock ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                          }`}
                      >
                        {product.inStock ? 'In Stock' : 'Out of Stock'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => openModal(product)}
                        className="text-blue-400 hover:text-blue-300 p-2 transition-colors"
                        title="Edit"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="text-red-400 hover:text-red-300 p-2 transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No products found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-800 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl">
            <div className="sticky top-0 bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-xl font-bold text-white">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-6">
              {/* Image Uploader */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                  <ImageIcon size={15} />
                  Product Images
                  <span className="text-xs text-gray-500 font-normal">(first image = main display)</span>
                </label>
                <ImageUploader
                  images={productImages}
                  onChange={setProductImages}
                  maxImages={8}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Product Name</label>
                  <input
                    name="name"
                    defaultValue={editingProduct?.name}
                    required
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Category</label>
                  <select
                    name="category"
                    defaultValue={editingProduct?.category || (categories[0]?.id || 'fruits')}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    name="price"
                    defaultValue={editingProduct?.price}
                    required
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Original Price ($) - Optional</label>
                  <input
                    type="number"
                    step="0.01"
                    name="originalPrice"
                    defaultValue={editingProduct?.originalPrice}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Unit (e.g., per kg, per pack)</label>
                  <input
                    name="unit"
                    defaultValue={editingProduct?.unit}
                    required
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Stock Status</label>
                  <select
                    name="inStock"
                    defaultValue={editingProduct ? (editingProduct.inStock ? 'true' : 'false') : 'true'}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  >
                    <option value="true">In Stock</option>
                    <option value="false">Out of Stock</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">SKU (Stock Keeping Unit)</label>
                  <input
                    name="sku"
                    defaultValue={editingProduct?.sku || ''}
                    placeholder="e.g. SKU-BAN-01"
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Barcode</label>
                  <input
                    name="barcode"
                    defaultValue={editingProduct?.barcode || ''}
                    placeholder="e.g. 7441001102"
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Description</label>
                <textarea
                  name="description"
                  defaultValue={editingProduct?.description}
                  required
                  rows={3}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none resize-none"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-medium transition-colors"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsPage;
