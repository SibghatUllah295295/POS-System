import { useEffect, useState } from "react";
import { Package, ShoppingCart, Tag, DollarSign } from "lucide-react";

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalCategories: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
  });

  useEffect(() => {
    // Load dashboard statistics
    const loadStats = async () => {
      try {
        const categories = await window.electronAPI.getCategories();
        if (categories.success) {
          setStats((prev) => ({
            ...prev,
            totalCategories: categories.data.length,
          }));
        }
      } catch (err) {
        console.error("Error loading stats:", err);
      }
    };

    loadStats();
  }, []);

  const statCards = [
    {
      title: "Total Categories",
      value: stats.totalCategories,
      icon: Tag,
      color: "bg-blue-600",
    },
    {
      title: "Total Products",
      value: stats.totalProducts,
      icon: Package,
      color: "bg-green-600",
    },
    {
      title: "Total Orders",
      value: stats.totalOrders,
      icon: ShoppingCart,
      color: "bg-purple-600",
    },
    {
      title: "Total Revenue",
      value: `$${stats.totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      color: "bg-orange-600",
    },
  ];

  return (
    <div className="h-full overflow-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-gray-400">Welcome to your Pizza POS System</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="bg-gray-800 rounded-lg border border-gray-700 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <Icon size={24} />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-1">
                {stat.value}
              </h3>
              <p className="text-gray-400 text-sm">{stat.title}</p>
            </div>
          );
        })}
      </div>

      {/* Welcome Message */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-8 text-center">
        <h2 className="text-xl font-semibold text-white mb-2">
          Welcome to Pizza POS System!
        </h2>
        <p className="text-gray-400">
          Start by creating categories for your menu items, then add products to
          each category.
        </p>
      </div>
    </div>
  );
};

export default Dashboard;
