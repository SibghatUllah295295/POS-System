import { useState } from "react";
import {
  Menu,
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Settings,
  ClipboardList,
  Tag,
  Coffee,
  DollarSign,
  Clock,
  X,
} from "lucide-react";

const Sidebar = ({ activePage, setActivePage }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [hoveredItem, setHoveredItem] = useState(null);

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "sales", label: "Sales", icon: ShoppingCart }, // Add this at top
    { id: "categories", label: "Categories", icon: Tag },
    { id: "products", label: "Products", icon: Package },
    { id: "employees", label: "Employees", icon: Users },
    { id: "expenses", label: "Expenses", icon: DollarSign },
    { id: "shifts", label: "Shifts", icon: Clock },
    { id: "customers", label: "Customers", icon: Users },
    { id: "reports", label: "Reports", icon: ClipboardList },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div
      className={`bg-gray-900 border-r border-gray-800 transition-all duration-300 flex flex-col ${
        isOpen ? "w-64" : "w-20"
      }`}
    >
      {/* Sidebar Header with Toggle Button */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        {isOpen && (
          <div className="flex items-center space-x-2">
            <Coffee className="h-6 w-6 text-orange-500" />
            <span className="text-white font-bold text-lg">Pizza POS</span>
          </div>
        )}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-lg hover:bg-gray-800 transition-colors text-gray-400 hover:text-white"
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 mt-6">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          const isHovered = hoveredItem === item.id;

          return (
            <div key={item.id} className="relative">
              <button
                onClick={() => setActivePage(item.id)}
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
                className={`w-full flex items-center space-x-3 px-4 py-3 transition-all duration-200 ${
                  isActive
                    ? "bg-orange-600 text-white border-r-4 border-orange-400"
                    : "text-gray-400 hover:bg-gray-800 hover:text-white"
                } ${isOpen ? "justify-start" : "justify-center"}`}
              >
                <Icon size={20} />
                {isOpen && (
                  <span className="text-sm font-medium">{item.label}</span>
                )}
              </button>

              {/* Tooltip for collapsed sidebar */}
              {!isOpen && isHovered && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-sm rounded whitespace-nowrap z-50">
                  {item.label}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-800">
        {isOpen ? (
          <div className="text-xs text-gray-500 text-center">
            <p>© 2024 Pizza POS</p>
            <p className="mt-1">Version 1.0.0</p>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center">
              <span className="text-xs text-gray-500">v1</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
