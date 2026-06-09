import { useState, useEffect } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  X,
  CheckCircle,
  XCircle,
  DollarSign,
  Edit2,
} from "lucide-react";

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price_type: "fixed",
    status: "active",
  });

  // Load categories from database
  const loadCategories = async () => {
    setLoading(true);
    try {
      const result = await window.electronAPI.getCategories();
      if (result.success) {
        setCategories(result.data);
      } else {
        console.error("Failed to load categories:", result.error);
      }
    } catch (err) {
      console.error("Error loading categories:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Open modal for creating new category
  const openCreateModal = () => {
    setEditingCategory(null);
    setFormData({
      name: "",
      description: "",
      price_type: "fixed",
      status: "active",
    });
    setShowModal(true);
  };

  // Open modal for editing category - Populate all fields including price_type
  const openEditModal = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || "",
      price_type: category.price_type || "fixed",
      status: category.status,
    });
    setShowModal(true);
  };

  // Close modal
  const closeModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    setFormData({
      name: "",
      description: "",
      price_type: "fixed",
      status: "active",
    });
  };

  // Save category (create or update)
  const saveCategory = async () => {
    // Validate form
    if (!formData.name.trim()) {
      alert("Category name is required");
      return;
    }

    try {
      if (editingCategory) {
        // Update existing category - Send all fields including price_type
        const result = await window.electronAPI.updateCategory(
          editingCategory.id,
          {
            name: formData.name.trim(),
            description: formData.description.trim(),
            price_type: formData.price_type,
            status: formData.status,
          },
        );

        if (result.success) {
          await loadCategories(); // Reload to show updated data
          closeModal();
        } else {
          alert("Failed to update category: " + result.error);
        }
      } else {
        // Create new category
        const result = await window.electronAPI.createCategory({
          name: formData.name.trim(),
          description: formData.description.trim(),
          price_type: formData.price_type,
          status: formData.status,
        });

        if (result.success) {
          await loadCategories(); // Reload to show new category
          closeModal();
        } else {
          alert("Failed to create category: " + result.error);
        }
      }
    } catch (err) {
      console.error("Error saving category:", err);
      alert("An error occurred while saving the category");
    }
  };

  // Delete category
  const deleteCategory = async (id) => {
    if (
      window.confirm(
        "Are you sure you want to delete this category? This action cannot be undone.",
      )
    ) {
      try {
        const result = await window.electronAPI.deleteCategory(id);
        if (result.success) {
          await loadCategories();
        } else {
          alert("Failed to delete category: " + result.error);
        }
      } catch (err) {
        console.error("Error deleting category:", err);
        alert("An error occurred while deleting the category");
      }
    }
  };

  // Filter categories based on search
  const filteredCategories = categories.filter(
    (category) =>
      category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (category.description &&
        category.description.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  // Get price type badge
  const getPriceTypeBadge = (priceType) => {
    if (priceType === "fixed") {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-900 text-blue-300">
          <DollarSign size={12} className="mr-1" />
          Fixed Prices
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-900 text-purple-300">
          <Edit2 size={12} className="mr-1" />
          Editable Prices
        </span>
      );
    }
  };

  // Get status badge color
  const getStatusBadge = (status) => {
    if (status === "active") {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-900 text-green-300">
          <CheckCircle size={12} className="mr-1" />
          Active
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-900 text-red-300">
          <XCircle size={12} className="mr-1" />
          Inactive
        </span>
      );
    }
  };

  return (
    <div className="h-full overflow-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">Categories</h1>
        <p className="text-gray-400">Manage your pizza categories</p>
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
            placeholder="Search categories..."
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
          <span>Create New Category</span>
        </button>
      </div>

      {/* Categories Table */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-gray-400">Loading categories...</div>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400">No categories found</p>
            <button
              onClick={openCreateModal}
              className="mt-4 text-orange-500 hover:text-orange-400"
            >
              Create your first category
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-900">
                <tr className="text-left text-sm text-gray-400">
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Description</th>
                  <th className="px-6 py-3">Price Type</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Created At</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filteredCategories.map((category) => (
                  <tr
                    key={category.id}
                    className="hover:bg-gray-750 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="font-medium text-white">
                        {category.name}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-300 max-w-md truncate">
                        {category.description || "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getPriceTypeBadge(category.price_type || "fixed")}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(category.status)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-400">
                        {new Date(category.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => openEditModal(category)}
                          className="p-1 text-blue-400 hover:text-blue-300 transition-colors"
                          title="Edit Category"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => deleteCategory(category.id)}
                          className="p-1 text-red-400 hover:text-red-300 transition-colors"
                          title="Delete Category"
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

      {/* Create/Edit Modal with Price Type Field */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg w-full max-w-md">
            <div className="flex justify-between items-center p-6 border-b border-gray-700">
              <h2 className="text-xl font-bold text-white">
                {editingCategory ? "Edit Category" : "Create New Category"}
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
                  Category Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Pizzas, Sides, Beverages"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-500"
                  autoFocus
                />
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
                  placeholder="Describe this category..."
                  rows="3"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Optional: Add a description for this category
                </p>
              </div>

              {/* Price Type Field - New Field */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Price Type *
                </label>
                <select
                  name="price_type"
                  value={formData.price_type}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-orange-500"
                >
                  <option value="fixed">
                    Fixed - Products have set prices
                  </option>
                  <option value="editable">
                    Editable - Prices can be changed at order time
                  </option>
                </select>
                <div className="mt-2 p-2 bg-gray-700/50 rounded-lg">
                  {formData.price_type === "fixed" ? (
                    <p className="text-xs text-blue-300">
                      <span className="font-semibold">Fixed Prices Mode:</span>{" "}
                      Products in this category will require a fixed price.
                      Perfect for items with stable pricing like pizzas, sides,
                      and desserts.
                    </p>
                  ) : (
                    <p className="text-xs text-purple-300">
                      <span className="font-semibold">
                        Editable Prices Mode:
                      </span>{" "}
                      Products in this category don't require a fixed price.
                      Perfect for items with fluctuating prices like beverages,
                      seasonal items, or market-price items.
                    </p>
                  )}
                </div>
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
                <p className="text-xs text-gray-500 mt-1">
                  Inactive categories won't appear in the menu
                </p>
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
                onClick={saveCategory}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors"
              >
                {editingCategory ? "Update Category" : "Create Category"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Categories;
