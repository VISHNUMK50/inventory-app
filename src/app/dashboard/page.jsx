"use client";
import React, { useEffect, useState } from "react";
import githubConfig from '@/config/githubConfig';
import { Package, LayoutDashboard, ArrowLeftRight, PlusCircle, Download, ShoppingCart, AlertTriangle, Archive, Layers, FileText } from "lucide-react";
import Link from "next/link";
import { auth } from "../../config/firebase";
import ProfileMenu from "@/components/ProfileMenu";
import { useRouter } from "next/navigation";

const Dashboard = () => {
      const title = "Inventory Management System";

    const router = useRouter();

    const [profileMenuOpen, setProfileMenuOpen] = useState(false);

    const [darkMode, setDarkMode] = useState(false);
    const toggleDarkMode = () => {
        setDarkMode(!darkMode);
        // Add logic to apply dark mode (e.g., toggling a CSS class or updating a context)
    };
    const [inventoryStats, setInventoryStats] = useState({
        totalCount: 182,
        onHand: 182,
        onLoan: 0,
        productLines: 0,
        noStock: 0,
        lowStock: 0
    });
    const [lowStockItems, setLowStockItems] = useState([]);
    const [loadingReplenishment, setLoadingReplenishment] = useState(true);
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (!user) {
                router.push("/"); // Redirect to login if not authenticated
            }
        });

        return () => unsubscribe();
    }, [router]);


    const handleLogout = () => {
        // console.log("Logout clicked");
        auth.signOut()
            .then(() => {
                // Clear all items from localStorage
                localStorage.clear();
                // Redirect to root URL
                router.push('/');
            })
            .catch((error) => {
                console.error("Error signing out:", error);
            });
    };

    // Add this new useEffect
    useEffect(() => {
        fetch('/api/inventory/lowstock')
            .then((res) => res.json())
            .then((data) => {
                setInventoryStats(prev => ({
                    ...prev,
                    productLines: data.stats.productLines,
                    noStock: data.stats.noStock,
                    lowStock: data.stats.lowStock
                }));
                setLowStockItems(data.lowStockItems);
                setLoadingReplenishment(false);
            })
            .catch((error) => {
                console.error('Error fetching low stock data:', error);
                setLoadingReplenishment(false);
            });
    }, []);


    const [recentActivity, setRecentActivity] = useState([]);
    const [loadingActivity, setLoadingActivity] = useState(true);

    // Add this useEffect after your existing useEffect
    useEffect(() => {
        fetch('/api/activity/commits')
            .then((res) => res.json())
            .then((data) => {
                setRecentActivity(data);
                setLoadingActivity(false);
            })
            .catch((error) => {
                console.error('Error fetching commits:', error);
                setLoadingActivity(false);
            });
    }, []);


    const [categoryStats, setCategoryStats] = useState([]);
    const [loadingCategories, setLoadingCategories] = useState(true);

    useEffect(() => {
        fetch('/api/inventory/categories')
            .then((res) => res.json())
            .then((data) => {
                setCategoryStats(data);
                setLoadingCategories(false);
            })
            .catch((error) => {
                console.error('Error fetching category stats:', error);
                setLoadingCategories(false);
            });
    }, []);
    // Sample low stock items that would appear in alerts
    const inventoryAlerts = [
        { id: 1, partNumber: "ATM328", manufacturer: "Microchip", inStock: 5, reorderPoint: 10 },
        { id: 2, partNumber: "USB-C-01", manufacturer: "Amphenol", inStock: 8, reorderPoint: 15 },
        { id: 3, partNumber: "CAP-10UF", manufacturer: "Kemet", inStock: 22, reorderPoint: 50 }
    ];

    return (
        <div className="mx-auto bg-white shadow-xl overflow-hidden">
            <header className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white">
                <div className="px-2 sm:px-4 py-3 flex items-center justify-between">
                    {/* Logo Section */}
                    <div className="flex items-center space-x-2">
                        <img
                            src="/INVEXIS_LOGO1020.png"
                            alt="Logo"
                            className="h-8 sm:h-10 w-auto"
                        />
                    </div>
                    {/* Title Section */}
                    <div className="absolute left-1/2 transform -translate-x-20 sm:static sm:transform-none">
                        <h1 className="text-lg sm:text-xl font-bold hidden sm:block">{title}</h1>
                    </div>

                    {/* User Info Section */}
                    <ProfileMenu
                        darkMode={darkMode}
                        toggleDarkMode={toggleDarkMode}
                        onLogout={handleLogout}
                    />
                </div>
            </header>

            {/* Navigation breadcrumb */}
            <div className="bg-gray-300 shadow-md py-1 px-4">
                <h2 className="text-2xl font-bold text-black flex items-center">
                    <LayoutDashboard className="mr-2 h-5 w-5" /> Dashboard
                </h2>
            </div>

            {/* Main content */}


            <div className="container mx-auto px-4 py-4">
                {/* Quick action buttons */}
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-8">
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
                        <ArrowLeftRight className="h-10 w-10 text-yellow-600 mb-2" />
                        <span className="font-medium">Transactions</span>
                    </Link>

                    <Link href="/create-order" className="flex flex-col items-center bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition border-t-4 border-red-600">
                        <ShoppingCart className="h-10 w-10 text-red-600 mb-2" />
                        <span className="font-medium">Create an Order</span>
                    </Link>

                    <Link href="/datasheets" className="flex flex-col items-center bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition border-t-4 border-indigo-600">
                        <FileText className="h-10 w-10 text-indigo-600 mb-2" />
                        <span className="font-medium">Datasheets</span>
                    </Link>
                </div>

                {/* At A Glance Section */}
                <div className="mb-6">

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Stock Availability */}
                        <div className="bg-white rounded-lg shadow-md overflow-hidden">
                            <div className="bg-blue-600 px-4 py-3">
                                <h3 className="text-lg font-medium text-white flex items-center">
                                    <Archive className="h-5 w-5 mr-2" /> Stock Availability
                                </h3>
                            </div>
                            <div className="p-4 bg-white">
                                <table className="w-full">
                                    <tbody>
                                        <tr>
                                            <td className="py-1">Total Count</td>
                                            <td className="py-1 font-bold text-right">{inventoryStats.totalCount}</td>
                                        </tr>
                                        <tr>
                                            <td className="py-1">On Hand</td>
                                            <td className="py-1 text-right">{inventoryStats.onHand} ({(inventoryStats.onHand / inventoryStats.totalCount * 100).toFixed(1)}%)</td>
                                        </tr>
                                        <tr>
                                            <td className="py-1">On Loan</td>
                                            <td className="py-1 text-right">{inventoryStats.onLoan} ({(inventoryStats.onLoan / inventoryStats.totalCount * 100).toFixed(1)}%)</td>
                                        </tr>
                                    </tbody>
                                </table>

                                <div className="mt-6">
                                    <div className="flex justify-center">
                                        <div className="relative w-64 h-64">
                                            <div className="w-full h-full rounded-full bg-sky-500"></div>
                                            <div className="absolute inset-4 rounded-full bg-white flex items-center justify-center flex-col">
                                                <span className="font-bold text-xl">On Hand</span>
                                                <span className="font-bold text-3xl">{inventoryStats.onHand}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Replenishment */}
                        <div className="bg-white rounded-lg shadow-md overflow-hidden">
                            <div className="bg-red-600 px-4 py-3">
                                <h3 className="text-lg font-medium text-white flex items-center">
                                    <AlertTriangle className="h-5 w-5 mr-2" /> Replenishment
                                </h3>
                            </div>
                            <div className="p-4">
                                {loadingReplenishment ? (
                                    <div className="flex justify-center items-center h-48">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                    </div>
                                ) : (
                                    <>
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
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>


                {/* Bottom section with activity and inventory breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white rounded-lg shadow-md overflow-hidden">
                        <div className="bg-gray-700 px-4 py-3">
                            <h3 className="text-lg font-medium text-white">Recent Activity</h3>
                        </div>
                        <div className="p-4">
                            {loadingActivity ? (
                                <div className="flex justify-center items-center h-48">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                </div>
                            ) : recentActivity.length === 0 ? (
                                <div className="text-center text-gray-500 py-8">
                                    No recent activity
                                </div>
                            ) : (
                                <div className="divide-y">
                                    {recentActivity.map(activity => (
                                        <div key={activity.id} className="py-3">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <p className="font-medium break-words pr-4">
                                                        {activity.action || 'Unknown action'}
                                                    </p>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        {activity.date || 'Unknown date'} by {activity.user || 'Unknown user'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <div className="mt-4 text-center">
                                <a
                                    href={`https://github.com/${githubConfig.owner}/${githubConfig.repo}/commits/master`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-800 font-medium"
                                >
                                    View Commit History →
                                </a>
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
                            {loadingCategories ? (
                                <div className="flex justify-center items-center h-48">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                </div>
                            ) : categoryStats.length === 0 ? (
                                <div className="text-center text-gray-500 py-8">
                                    No category data available
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {categoryStats.map((category) => (
                                        <div key={category.name}>
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-600">{category.name}</span>
                                                <span className="font-medium">
                                                    {category.count} units ({category.items} items)
                                                </span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                                                <div
                                                    className="h-2.5 rounded-full"
                                                    style={{
                                                        width: `${(category.count / category.totalCount) * 100}%`,
                                                        backgroundColor: `var(--color-${category.color}-600)`
                                                    }}
                                                ></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <div className="mt-4 text-center">
                                <Link href="/inventory-report" className="text-blue-600 hover:text-blue-800 font-medium">
                                    View Full Inventory Report →
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="mt-auto text-xs text-gray-500 text-right mt-4">
                Last update: 3/9/2025 5:10 PM
            </div>
        </div>
    );
};

export default Dashboard;