"use client"
import React, { useState, useEffect } from 'react';
import { Bar, Line } from 'recharts';
import { Download, Filter, Calendar, RefreshCw } from 'lucide-react';

// Sample data - would be fetched from API in production
const sampleData = {
  salesData: [
    { name: 'Jan', sales: 4000, inventory: 2400 },
    { name: 'Feb', sales: 3000, inventory: 1398 },
    { name: 'Mar', sales: 5000, inventory: 3800 },
    { name: 'Apr', sales: 2780, inventory: 3908 },
    { name: 'May', sales: 1890, inventory: 4800 },
    { name: 'Jun', sales: 2390, inventory: 3800 },
  ],
  inventoryAlerts: [
    { id: 1, product: 'Wireless Keyboard', status: 'Low Stock', quantity: 5, threshold: 10 },
    { id: 2, product: 'USB-C Cable', status: 'Out of Stock', quantity: 0, threshold: 15 },
    { id: 3, product: 'Wireless Mouse', status: 'Low Stock', quantity: 3, threshold: 8 },
  ],
  topProducts: [
    { id: 1, name: 'Bluetooth Headphones', sales: 143, revenue: '$7,150' },
    { id: 2, name: 'USB-C Adapter', sales: 98, revenue: '$2,940' },
    { id: 3, name: 'Wireless Charger', sales: 76, revenue: '$3,040' },
    { id: 4, name: 'Laptop Stand', sales: 65, revenue: '$1,950' },
  ]
};

const ReportsPage = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState('month');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Simulate API loading
    setLoading(true);
    const timer = setTimeout(() => {
      setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, [dateRange, activeTab]);

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Reports & Analytics</h1>
        <div className="flex space-x-2">
          <button className="flex items-center px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
          <button className="flex items-center px-3 py-2 border border-gray-300 rounded hover:bg-gray-50">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </button>
          <div className="relative">
            <select 
              className="appearance-none pl-3 pr-8 py-2 border border-gray-300 rounded"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
            </select>
            <Calendar className="absolute right-2 top-2 h-4 w-4 text-gray-500" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-4 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`pb-4 font-medium text-sm ${
              activeTab === 'inventory'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Inventory
          </button>
          <button
            onClick={() => setActiveTab('sales')}
            className={`pb-4 font-medium text-sm ${
              activeTab === 'sales'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Sales
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`pb-4 font-medium text-sm ${
              activeTab === 'custom'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Custom Reports
          </button>
        </nav>
      </div>

      {/* Dashboard Content */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <RefreshCw className="h-8 w-8 text-blue-600 animate-spin" />
        </div>
      ) : (
        <>
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded shadow">
                  <p className="text-gray-500 text-sm">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-800">$24,780</p>
                  <p className="text-green-600 text-sm">+12% from last period</p>
                </div>
                <div className="bg-white p-4 rounded shadow">
                  <p className="text-gray-500 text-sm">Total Sales</p>
                  <p className="text-2xl font-bold text-gray-800">643</p>
                  <p className="text-green-600 text-sm">+8% from last period</p>
                </div>
                <div className="bg-white p-4 rounded shadow">
                  <p className="text-gray-500 text-sm">Avg Order Value</p>
                  <p className="text-2xl font-bold text-gray-800">$38.54</p>
                  <p className="text-red-600 text-sm">-2% from last period</p>
                </div>
                <div className="bg-white p-4 rounded shadow">
                  <p className="text-gray-500 text-sm">Inventory Value</p>
                  <p className="text-2xl font-bold text-gray-800">$89,340</p>
                  <p className="text-gray-600 text-sm">432 unique products</p>
                </div>
              </div>

              {/* Charts Section */}
              <div className="bg-white p-6 rounded shadow">
                <h2 className="text-lg font-semibold mb-4">Sales & Inventory Trends</h2>
                <div className="h-64">
                  {/* Chart would be rendered here with actual data */}
                  <div className="flex items-center justify-center h-full text-gray-500">
                    Line chart showing sales and inventory trends
                  </div>
                </div>
              </div>

              {/* Tables Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Top Products */}
                <div className="bg-white p-6 rounded shadow">
                  <h2 className="text-lg font-semibold mb-4">Top Selling Products</h2>
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left pb-2 font-semibold">Product</th>
                        <th className="text-right pb-2 font-semibold">Sales</th>
                        <th className="text-right pb-2 font-semibold">Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sampleData.topProducts.map(product => (
                        <tr key={product.id} className="border-b">
                          <td className="py-3">{product.name}</td>
                          <td className="py-3 text-right">{product.sales}</td>
                          <td className="py-3 text-right">{product.revenue}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Low Stock Alerts */}
                <div className="bg-white p-6 rounded shadow">
                  <h2 className="text-lg font-semibold mb-4">Inventory Alerts</h2>
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left pb-2 font-semibold">Product</th>
                        <th className="text-center pb-2 font-semibold">Status</th>
                        <th className="text-right pb-2 font-semibold">Quantity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sampleData.inventoryAlerts.map(alert => (
                        <tr key={alert.id} className="border-b">
                          <td className="py-3">{alert.product}</td>
                          <td className="py-3 text-center">
                            <span className={`inline-block px-2 py-1 rounded text-xs ${
                              alert.status === 'Out of Stock' 
                                ? 'bg-red-100 text-red-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {alert.status}
                            </span>
                          </td>
                          <td className="py-3 text-right">{alert.quantity} / {alert.threshold}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Placeholder for other tabs */}
          {activeTab === 'inventory' && (
            <div className="bg-white p-6 rounded shadow">
              <h2 className="text-lg font-semibold mb-4">Inventory Reports</h2>
              <p className="text-gray-600">Detailed inventory analytics and reports would be displayed here.</p>
            </div>
          )}

          {activeTab === 'sales' && (
            <div className="bg-white p-6 rounded shadow">
              <h2 className="text-lg font-semibold mb-4">Sales Reports</h2>
              <p className="text-gray-600">Detailed sales analytics and reports would be displayed here.</p>
            </div>
          )}

          {activeTab === 'custom' && (
            <div className="bg-white p-6 rounded shadow">
              <h2 className="text-lg font-semibold mb-4">Custom Reports</h2>
              <p className="text-gray-600">Build and save custom reports based on your specific needs.</p>
              <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                Create New Report
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ReportsPage;