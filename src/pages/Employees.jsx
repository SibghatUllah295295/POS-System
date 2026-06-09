import { useState, useEffect } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  X,
  Phone,
  Mail,
  MapPin,
  User,
  CheckCircle,
  XCircle,
} from "lucide-react";

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    status: "active",
  });

  // Load employees from database
  const loadEmployees = async () => {
    setLoading(true);
    try {
      const result = await window.electronAPI.getEmployees();
      if (result.success) {
        setEmployees(result.data);
      } else {
        console.error("Failed to load employees:", result.error);
      }
    } catch (err) {
      console.error("Error loading employees:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Open modal for creating new employee
  const openCreateModal = () => {
    setEditingEmployee(null);
    setFormData({
      name: "",
      phone: "",
      email: "",
      address: "",
      status: "active",
    });
    setShowModal(true);
  };

  // Open modal for editing employee
  const openEditModal = (employee) => {
    setEditingEmployee(employee);
    setFormData({
      name: employee.name,
      phone: employee.phone || "",
      email: employee.email,
      address: employee.address || "",
      status: employee.status,
    });
    setShowModal(true);
  };

  // Close modal
  const closeModal = () => {
    setShowModal(false);
    setEditingEmployee(null);
    setFormData({
      name: "",
      phone: "",
      email: "",
      address: "",
      status: "active",
    });
  };

  // Validate email format
  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  // Validate phone format (basic)
  const validatePhone = (phone) => {
    if (!phone) return true; // Phone is optional
    const re =
      /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,5}[-\s\.]?[0-9]{1,5}$/;
    return re.test(phone);
  };

  // Save employee (create or update)
  const saveEmployee = async () => {
    // Validate form
    if (!formData.name.trim()) {
      alert("Employee name is required");
      return;
    }

    if (!formData.email.trim()) {
      alert("Email address is required");
      return;
    }

    if (!validateEmail(formData.email)) {
      alert("Please enter a valid email address");
      return;
    }

    if (formData.phone && !validatePhone(formData.phone)) {
      alert("Please enter a valid phone number");
      return;
    }

    try {
      if (editingEmployee) {
        // Update existing employee
        const result = await window.electronAPI.updateEmployee(
          editingEmployee.id,
          {
            name: formData.name.trim(),
            phone: formData.phone.trim(),
            email: formData.email.trim().toLowerCase(),
            address: formData.address.trim(),
            status: formData.status,
          },
        );

        if (result.success) {
          await loadEmployees();
          closeModal();
        } else {
          alert("Failed to update employee: " + result.error);
        }
      } else {
        // Create new employee
        const result = await window.electronAPI.createEmployee({
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          email: formData.email.trim().toLowerCase(),
          address: formData.address.trim(),
          status: formData.status,
        });

        if (result.success) {
          await loadEmployees();
          closeModal();
        } else {
          alert("Failed to create employee: " + result.error);
        }
      }
    } catch (err) {
      console.error("Error saving employee:", err);
      alert("An error occurred while saving the employee");
    }
  };

  // Delete employee
  const deleteEmployee = async (id, name) => {
    if (
      window.confirm(
        `Are you sure you want to delete employee "${name}"? This action cannot be undone.`,
      )
    ) {
      try {
        const result = await window.electronAPI.deleteEmployee(id);
        if (result.success) {
          await loadEmployees();
        } else {
          alert("Failed to delete employee: " + result.error);
        }
      } catch (err) {
        console.error("Error deleting employee:", err);
        alert("An error occurred while deleting the employee");
      }
    }
  };

  // Filter employees based on search
  const filteredEmployees = employees.filter(
    (employee) =>
      employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (employee.phone && employee.phone.includes(searchTerm)) ||
      (employee.address &&
        employee.address.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  // Get status badge
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
        <h1 className="text-2xl font-bold text-white mb-2">Employees</h1>
        <p className="text-gray-400">Manage your restaurant staff</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Employees</p>
              <p className="text-2xl font-bold text-white">
                {employees.length}
              </p>
            </div>
            <div className="p-3 bg-blue-600 rounded-lg">
              <User size={20} />
            </div>
          </div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Active Employees</p>
              <p className="text-2xl font-bold text-green-400">
                {employees.filter((e) => e.status === "active").length}
              </p>
            </div>
            <div className="p-3 bg-green-600 rounded-lg">
              <CheckCircle size={20} />
            </div>
          </div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Inactive Employees</p>
              <p className="text-2xl font-bold text-red-400">
                {employees.filter((e) => e.status === "inactive").length}
              </p>
            </div>
            <div className="p-3 bg-red-600 rounded-lg">
              <XCircle size={20} />
            </div>
          </div>
        </div>
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
            placeholder="Search employees by name, email, phone or address..."
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
          <span>Add New Employee</span>
        </button>
      </div>

      {/* Employees Table */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-gray-400">Loading employees...</div>
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400">No employees found</p>
            <button
              onClick={openCreateModal}
              className="mt-4 text-orange-500 hover:text-orange-400"
            >
              Add your first employee
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-900">
                <tr className="text-left text-sm text-gray-400">
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Phone</th>
                  <th className="px-6 py-3">Email</th>
                  <th className="px-6 py-3">Address</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filteredEmployees.map((employee) => (
                  <tr
                    key={employee.id}
                    className="hover:bg-gray-750 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="font-medium text-white">
                        {employee.name}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {employee.phone ? (
                        <div className="flex items-center space-x-1 text-gray-300">
                          <Phone size={14} />
                          <span>{employee.phone}</span>
                        </div>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-1 text-gray-300">
                        <Mail size={14} />
                        <span className="truncate max-w-[200px]">
                          {employee.email}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {employee.address ? (
                        <div className="flex items-center space-x-1 text-gray-300">
                          <MapPin size={14} />
                          <span className="truncate max-w-[200px]">
                            {employee.address}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(employee.status)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => openEditModal(employee)}
                          className="p-1 text-blue-400 hover:text-blue-300 transition-colors"
                          title="Edit Employee"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() =>
                            deleteEmployee(employee.id, employee.name)
                          }
                          className="p-1 text-red-400 hover:text-red-300 transition-colors"
                          title="Delete Employee"
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

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gray-800 flex justify-between items-center p-6 border-b border-gray-700">
              <h2 className="text-xl font-bold text-white">
                {editingEmployee ? "Edit Employee" : "Add New Employee"}
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
                  Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter employee's full name"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-500"
                  autoFocus
                />
              </div>

              {/* Phone Field */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="+1 234-567-8900"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Optional: Enter contact number
                </p>
              </div>

              {/* Email Field */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="employee@example.com"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Must be a unique email address
                </p>
              </div>

              {/* Address Field */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Address
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Enter employee's address"
                  rows="3"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Optional: Enter full address
                </p>
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
                  Inactive employees won't be able to access the system
                </p>
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-800 flex justify-end space-x-3 p-6 border-t border-gray-700">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveEmployee}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors"
              >
                {editingEmployee ? "Update Employee" : "Create Employee"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;
