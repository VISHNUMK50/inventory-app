"use client";

import { useState } from "react";
import { Package, PlusCircle, Download, BarChart3, ShoppingCart, AlertTriangle, Archive, Layers } from "lucide-react";
import Link from "next/link";

const Dashboard = () => {
  // Sample data - in a real app, this would come from your backend
  const inventoryStats = {
    totalCount: 182,
    onHand: 182,
    onLoan: 0,
    productLines: 12,
    noStock: 0,
    lowStock: 0
  };

  // Sample recent activity data
  const recentActivity = [
    { id: 1, action: "Added 25 units of ATmega328P", date: "Mar 5, 2025", user: "John D." },
    { id: 2, action: "Shipped 12 units of 10K Resistors", date: "Mar 4, 2025", user: "Sarah M." },
    { id: 3, action: "Created order #ORD-2025-0042", date: "Mar 3, 2025", user: "Michael K." },
    { id: 4, action: "Received 100 units of LED 5mm Red", date: "Mar 2, 2025", user: "John D." }
  ];

  // Sample low stock items
  const lowStockItems = [
    { id: 1, name: "ATmega328P", category: "IC", current: 5, minimum: 10 },
    { id: 2, name: "USB-C Connector", category: "Connector", current: 8, minimum: 15 },
    { id: 3, name: "10uF Capacitor", category: "Capacitor", current: 22, minimum: 50 }
  ];
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top navigation */}
      <header className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Package className="h-8 w-8" />
              <span className="text-2xl font-bold">InventoryPro</span>
            </div>
            <div>
              <span className="mr-4">Welcome, Admin</span>
              <button className="bg-blue-600 px-4 py-2 rounded-md hover:bg-blue-700 transition">
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>
      
      {/* Main content */}
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Inventory Dashboard</h1>
        
        {/* Quick action buttons */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <Link href="/manage-inventory" className="flex flex-col items-center bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition border-t-4 border-blue-600">
            <Package className="h-10 w-10 text-blue-600 mb-2" />
            <span className="font-medium">Manage Inventory</span>
          </Link>
          
          <Link href="/add-product" className="flex flex-col items-center bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition border-t-4 border-green-600">
            <PlusCircle className="h-10 w-10 text-green-600 mb-2" />
            <span className="font-medium">Add a Product</span>
          </Link>
          
          <Link href="/receive-products" className="flex flex-col items-center bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition border-t-4 border-purple-600">
            <Download className="h-10 w-10 text-purple-600 mb-2" />
            <span className="font-medium">Receive Products</span>
          </Link>
          
          <Link href="/reports" className="flex flex-col items-center bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition border-t-4 border-yellow-600">
            <BarChart3 className="h-10 w-10 text-yellow-600 mb-2" />
            <span className="font-medium">Run Reports</span>
          </Link>
          
          <Link href="/create-order" className="flex flex-col items-center bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition border-t-4 border-red-600">
            <ShoppingCart className="h-10 w-10 text-red-600 mb-2" />
            <span className="font-medium">Create an Order</span>
          </Link>
        </div>
        
        <h2 className="text-2xl font-bold text-gray-800 mb-4">At A Glance</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Stock Availability Card */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="bg-blue-600 px-4 py-3">
              <h3 className="text-lg font-medium text-white flex items-center">
                <Archive className="h-5 w-5 mr-2" /> Stock Availability
              </h3>
            </div>
            <div className="p-4">
              <div className="flex justify-between items-center mb-4">
                <span className="text-gray-600">Total Count</span>
                <span className="text-2xl font-bold">{inventoryStats.totalCount}</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">On Hand</span>
                  <span className="font-medium">
                    {inventoryStats.onHand} ({(inventoryStats.onHand / inventoryStats.totalCount * 100).toFixed(1)}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${(inventoryStats.onHand / inventoryStats.totalCount * 100)}%` }}></div>
                </div>
                
                <div className="flex justify-between items-center mt-2">
                  <span className="text-gray-600">On Loan</span>
                  <span className="font-medium">
                    {inventoryStats.onLoan} ({(inventoryStats.onLoan / inventoryStats.totalCount * 100).toFixed(1)}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: `${(inventoryStats.onLoan / inventoryStats.totalCount * 100)}%` }}></div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Replenishment Card */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="bg-red-600 px-4 py-3">
              <h3 className="text-lg font-medium text-white flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2" /> Replenishment
              </h3>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{inventoryStats.productLines}</p>
                  <p className="text-gray-600 text-sm">Product Lines</p>
                </div>
                
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-red-600">{inventoryStats.noStock}</p>
                  <p className="text-gray-600 text-sm">No Stock</p>
                </div>
                
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-yellow-600">{inventoryStats.lowStock}</p>
                  <p className="text-gray-600 text-sm">Low Stock</p>
                </div>
              </div>
              
              {/* Display when there are low stock items */}
              {lowStockItems.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium text-gray-700 mb-2">Attention Required</h4>
                  <div className="space-y-2">
                    {lowStockItems.map(item => (
                      <div key={item.id} className="flex justify-between items-center p-2 bg-yellow-50 rounded border border-yellow-200">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-xs text-gray-500">{item.category}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-red-600 font-medium">{item.current}/{item.minimum}</p>
                          <p className="text-xs text-gray-500">Current/Min</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Bottom section with activity and inventory breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="bg-gray-700 px-4 py-3">
              <h3 className="text-lg font-medium text-white">Recent Activity</h3>
            </div>
            <div className="p-4">
              <div className="divide-y">
                {recentActivity.map(activity => (
                  <div key={activity.id} className="py-3 flex justify-between">
                    <div>
                      <p className="font-medium">{activity.action}</p>
                      <p className="text-xs text-gray-500">{activity.date} by {activity.user}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 text-center">
                <Link href="/activity-log" className="text-blue-600 hover:text-blue-800 font-medium">
                  View Full Activity Log →
                </Link>
              </div>
            </div>
          </div>
          
          {/* Inventory by Category */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="bg-gray-700 px-4 py-3">
              <h3 className="text-lg font-medium text-white flex items-center">
                <Layers className="h-5 w-5 mr-2" /> Inventory by Category
              </h3>
            </div>
            <div className="p-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">ICs</span>
                  <span className="font-medium">43 items</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '24%' }}></div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Resistors</span>
                  <span className="font-medium">56 items</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className="bg-green-600 h-2.5 rounded-full" style={{ width: '31%' }}></div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Capacitors</span>
                  <span className="font-medium">38 items</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className="bg-purple-600 h-2.5 rounded-full" style={{ width: '21%' }}></div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Connectors</span>
                  <span className="font-medium">27 items</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className="bg-yellow-600 h-2.5 rounded-full" style={{ width: '15%' }}></div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Other</span>
                  <span className="font-medium">18 items</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className="bg-red-600 h-2.5 rounded-full" style={{ width: '9%' }}></div>
                </div>
              </div>
              
              <div className="mt-4 text-center">
                <Link href="/inventory-report" className="text-blue-600 hover:text-blue-800 font-medium">
                  View Full Inventory Report →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;