import { useState, useEffect } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  X,
  Package,
  DollarSign,
  Eye,
  ArrowLeft,
  Tag,
  AlertCircle,
  Ruler,
} from "lucide-react";

const Products = () => {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryPriceType, setCategoryPriceType] = useState("fixed");

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    size: "",
    price: "",
    status: "active",
  });

  // Load categories
  const loadCategories = async () => {
    try {
      const result = await window.electronAPI.getCategories();
      if (result.success) {
        setCategories(result.data.filter((cat) => cat.status === "active"));
      }
    } catch (err) {
      console.error("Error loading categories:", err);
    }
  };

  // Load products for selected category
  const loadProducts = async (categoryId) => {
    setLoading(true);
    try {
      const result = await window.electronAPI.getProductsByCategory(categoryId);
      if (result.success) {
        setProducts(result.data);
      } else {
        console.error("Failed to load products:", result.error);
      }
    } catch (err) {
      console.error("Error loading products:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  // Handle category selection
  const handleCategorySelect = async (category) => {
    setSelectedCategory(category);
    setCategoryPriceType(category.price_type);
    await loadProducts(category.id);
  };

  // Handle back to categories
  const handleBackToCategories = () => {
    setSelectedCategory(null);
    setProducts([]);
    setSearchTerm("");
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Open modal for creating new product
  const openCreateModal = () => {
    setEditingProduct(null);
    setFormData({
      name: "",
      description: "",
      size: "",
      price: "",
      status: "active",
    });
    setShowModal(true);
  };

  // Open modal for editing product
  const openEditModal = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || "",
      size: product.size || "",
      price: product.price ? product.price.toString() : "",
      status: product.status,
    });
    setShowModal(true);
  };

  // Close modal
  const closeModal = () => {
    setShowModal(false);
    setEditingProduct(null);
    setFormData({
      name: "",
      description: "",
      size: "",
      price: "",
      status: "active",
    });
  };

  // Save product (create or update)
  const saveProduct = async () => {
    // Validate form
    if (!formData.name.trim()) {
      alert("Product name is required");
      return;
    }

    // Validate price for fixed price categories
    if (categoryPriceType === "fixed") {
      if (!formData.price || parseFloat(formData.price) <= 0) {
        alert("Price is required for fixed price categories");
        return;
      }
    }

    try {
      const productData = {
        categoryId: selectedCategory.id,
        name: formData.name.trim(),
        description: formData.description.trim(),
        size: formData.size.trim(),
        price: formData.price ? parseFloat(formData.price) : null,
        status: formData.status,
      };

      if (editingProduct) {
        // Update existing product
        const result = await window.electronAPI.updateProduct(
          editingProduct.id,
          productData,
        );
        if (result.success) {
          await loadProducts(selectedCategory.id);
          closeModal();
        } else {
          alert("Failed to update product: " + result.error);
        }
      } else {
        // Create new product
        const result = await window.electronAPI.createProduct(productData);
        if (result.success) {
          await loadProducts(selectedCategory.id);
          closeModal();
        } else {
          alert("Failed to create product: " + result.error);
        }
      }
    } catch (err) {
      console.error("Error saving product:", err);
      alert("An error occurred while saving the product");
    }
  };

  // Delete product
  const deleteProduct = async (id, name) => {
    if (
      window.confirm(
        `Are you sure you want to delete product "${name}"? This action cannot be undone.`,
      )
    ) {
      try {
        const result = await window.electronAPI.deleteProduct(id);
        if (result.success) {
          await loadProducts(selectedCategory.id);
        } else {
          alert("Failed to delete product: " + result.error);
        }
      } catch (err) {
        console.error("Error deleting product:", err);
        alert("An error occurred while deleting the product");
      }
    }
  };

  // Filter products based on search
  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.description &&
        product.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (product.size &&
        product.size.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  // Format currency
  const formatCurrency = (amount) => {
    if (!amount) return "Variable Price";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  // Group products by name for better display
  const groupedProducts = filteredProducts.reduce((groups, product) => {
    const key = product.name;
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(product);
    return groups;
  }, {});

  // If no category selected, show categories grid
  if (!selectedCategory) {
    return (
      <div className="h-full overflow-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-2">Products</h1>
          <p className="text-gray-400">
            Select a category to view and manage products
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((category) => (
            <div
              key={category.id}
              onClick={() => handleCategorySelect(category)}
              className="bg-gray-800 rounded-lg border border-gray-700 p-6 hover:border-orange-500 transition-all cursor-pointer group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="p-3 bg-gray-700 rounded-lg group-hover:bg-orange-600 transition-colors">
                  <Package
                    size={24}
                    className="text-orange-500 group-hover:text-white"
                  />
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    category.price_type === "fixed"
                      ? "bg-blue-900 text-blue-300"
                      : "bg-purple-900 text-purple-300"
                  }`}
                >
                  {category.price_type === "fixed"
                    ? "Fixed Prices"
                    : "Editable Prices"}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-1">
                {category.name}
              </h3>
              <p className="text-gray-400 text-sm mb-4">
                {category.description || "No description"}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  Click to view products
                </span>
                <Eye
                  size={18}
                  className="text-gray-400 group-hover:text-orange-500"
                />
              </div>
            </div>
          ))}
        </div>

        {categories.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400">
              No categories found. Please create categories first.
            </p>
          </div>
        )}
      </div>
    );
  }

  // Show products for selected category
  return (
    <div className="h-full overflow-auto">
      {/* Header with back button */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-3">
            <button
              onClick={handleBackToCategories}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-white"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">
                {selectedCategory.name}
              </h1>
              <p className="text-gray-400 text-sm mt-1">
                {selectedCategory.description ||
                  "Manage products in this category"}
              </p>
            </div>
          </div>
          <div
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              selectedCategory.price_type === "fixed"
                ? "bg-blue-900 text-blue-300"
                : "bg-purple-900 text-purple-300"
            }`}
          >
            {selectedCategory.price_type === "fixed"
              ? "Fixed Prices"
              : "Editable Prices"}
          </div>
        </div>

        {/* Price type info banner */}
        {selectedCategory.price_type === "editable" && (
          <div className="mt-3 p-3 bg-purple-900/20 border border-purple-700 rounded-lg flex items-start space-x-2">
            <AlertCircle size={18} className="text-purple-400 mt-0.5" />
            <div>
              <p className="text-sm text-purple-300">
                <span className="font-semibold">Editable Prices Mode:</span>{" "}
                Products in this category don't require a fixed price. You can
                set prices during order booking.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Actions Bar */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        {/* Search */}
        <div className="relative w-full sm:w-96">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Search products by name, size or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-500"
          />
        </div>

        {/* Create Button */}
        <button
          onClick={openCreateModal}
          className="flex items-center space-x-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors"
        >
          <Plus size={18} />
          <span>Create Product</span>
        </button>
      </div>

      {/* Products Table */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-gray-400">Loading products...</div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400">No products found in this category</p>
            <button
              onClick={openCreateModal}
              className="mt-4 text-orange-500 hover:text-orange-400"
            >
              Create your first product
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-900">
                <tr className="text-left text-sm text-gray-400">
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Size</th>
                  <th className="px-6 py-3">Description</th>
                  <th className="px-6 py-3">
                    {selectedCategory.price_type === "fixed"
                      ? "Price"
                      : "Base Price (Optional)"}
                  </th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filteredProducts.map((product) => (
                  <tr
                    key={product.id}
                    className="hover:bg-gray-750 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="font-medium text-white">
                        {product.name}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {product.size ? (
                        <div className="flex items-center space-x-1">
                          <Ruler size={14} className="text-blue-400" />
                          <span className="text-gray-300">{product.size}</span>
                        </div>
                      ) : (
                        <span className="text-gray-500 text-sm">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-300 max-w-md truncate">
                        {product.description || "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {product.price ? (
                        <div className="flex items-center space-x-1">
                          <DollarSign size={14} className="text-green-400" />
                          <span className="font-semibold text-green-400">
                            {formatCurrency(product.price)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-yellow-500 text-sm flex items-center space-x-1">
                          <Tag size={14} />
                          <span>No fixed price</span>
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                          product.status === "active"
                            ? "bg-green-900 text-green-300"
                            : "bg-red-900 text-red-300"
                        }`}
                      >
                        {product.status === "active" ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => openEditModal(product)}
                          className="p-1 text-blue-400 hover:text-blue-300 transition-colors"
                          title="Edit Product"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() =>
                            deleteProduct(product.id, product.name)
                          }
                          className="p-1 text-red-400 hover:text-red-300 transition-colors"
                          title="Delete Product"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit Product Modal with Size Field */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg w-full max-w-md">
            <div className="flex justify-between items-center p-6 border-b border-gray-700">
              <h2 className="text-xl font-bold text-white">
                {editingProduct ? "Edit Product" : "Create New Product"}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Name Field */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Product Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Margherita Pizza, Coca Cola"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-500"
                  autoFocus
                />
              </div>

              {/* Size Field - New Field */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Size (Optional)
                </label>
                <input
                  type="text"
                  name="size"
                  value={formData.size}
                  onChange={handleInputChange}
                  placeholder="e.g., Small, Medium, Large, 330ml, 500ml, Slice, Whole"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Optional: Specify product size (e.g., Small, Medium, Large,
                  500ml)
                </p>
              </div>

              {/* Description Field */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Optional: Add product description"
                  rows="3"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* Price Field - Conditional based on category price type */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {selectedCategory.price_type === "fixed"
                    ? "Price *"
                    : "Base Price (Optional)"}
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  placeholder={
                    selectedCategory.price_type === "fixed"
                      ? "0.00"
                      : "Optional base price"
                  }
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-500"
                />
                {selectedCategory.price_type === "editable" && (
                  <p className="text-xs text-gray-500 mt-1">
                    This is optional. You can set custom prices during order
                    booking.
                  </p>
                )}
                {selectedCategory.price_type === "fixed" && (
                  <p className="text-xs text-gray-500 mt-1">
                    This price will be fixed for this product size.
                  </p>
                )}
              </div>

              {/* Status Field */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-orange-500"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-3 p-6 border-t border-gray-700">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveProduct}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors"
              >
                {editingProduct ? "Update Product" : "Create Product"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
