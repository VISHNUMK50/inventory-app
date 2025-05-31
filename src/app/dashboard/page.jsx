"use client";
import React, { useEffect, useState } from "react";
import { Package, LayoutDashboard, ArrowLeftRight, PlusCircle, Download, ShoppingCart, AlertTriangle, Archive, Layers, FileText } from "lucide-react";
import Link from "next/link";
import githubConfigImport from '@/config/githubConfig';
import { doc, getDoc } from "firebase/firestore";
import { db, auth } from "@/config/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";

const Dashboard = () => {
    const router = useRouter();
    const [darkMode, setDarkMode] = useState(false);
    useEffect(() => {
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem('darkMode');
            if (saved === '1') {
                setDarkMode(true);
                document.documentElement.classList.add('dark');
            } else {
                setDarkMode(false);
                document.documentElement.classList.remove('dark');
            }
        }
    }, []);

    useEffect(() => {
        if (typeof window === "undefined") return;
        if (darkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('darkMode', darkMode ? '1' : '0');
    }, [darkMode]);

    const [githubConfig, setGithubConfig] = useState(githubConfigImport);
    const [configLoaded, setConfigLoaded] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (!currentUser) {
                setConfigLoaded(true);
                router.push("/");
                return;
            }
            const fetchUserConfig = async () => {
                const docId = currentUser.email.replace(/\./g, "_");
                const userDoc = await getDoc(doc(db, "users", docId));
                let config = githubConfigImport;
                if (userDoc.exists()) {
                    const data = userDoc.data();
                    if (data.githubConfig) {
                        config = {
                            ...githubConfigImport,
                            ...data.githubConfig,
                            token: data.githubConfig.token || githubConfigImport.token,
                        };
                        const username = currentUser.displayName || currentUser.email.split('@')[0] || "user";
                        const uid = currentUser.uid || "nouid";
                        config.path = `${username}-${uid}/db`;
                        config.datasheets = `${username}-${uid}/db/datasheets`;
                    }
                }
                setGithubConfig(config);
                setConfigLoaded(true);
            };
            fetchUserConfig();
        });
        return () => unsubscribe();
    }, [router]);

    const [profileMenuOpen, setProfileMenuOpen] = useState(false);

    const [inventoryStats, setInventoryStats] = useState({
        totalCount: 0,
        onHand: 0,
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
        auth.signOut()
            .then(() => {
                localStorage.clear();
                router.push('/');
            })
            .catch((error) => {
                console.error("Error signing out:", error);
            });
    };

    // Add this new useEffect
    useEffect(() => {
        if (!configLoaded) return;
        const [username, uid] = githubConfig.path
            ? githubConfig.path.replace('/db', '').split('-')
            : ["user", "nouid"];

        fetch('/api/inventory/lowstock', {
            headers: {
                'x-username': username,
                'x-uid': uid
            }
        })
            .then((res) => res.json())
            .then((data) => {
                setInventoryStats(prev => ({
                    ...prev,
                    productLines: data.stats.productLines,
                    noStock: data.stats.noStock,
                    lowStock: data.stats.lowStock,
                    totalCount: data.stats.totalCount,
                    onHand: data.stats.onHand,
                    onLoan: data.stats.onLoan
                }));
                setLowStockItems(data.lowStockItems);
                setLoadingReplenishment(false);
            })
            .catch((error) => {
                console.error('Error fetching low stock data:', error);
                setLoadingReplenishment(false);
            });
    }, [configLoaded]);

    const colorMap = {
        blue: "#2563eb",
        green: "#22c55e",
        red: "#dc2626",
        yellow: "#eab308",
        purple: "#9333ea",
        indigo: "#4f46e5",
        orange: "#ea580c",
        teal: "#14b8a6",
        pink: "#db2777",
        cyan: "#06b6d4",
        violet: "#8b5cf6",
        emerald: "#10b981",
        amber: "#f59e42",
        lime: "#84cc16",
        rose: "#f43f5e",
        fuchsia: "#d946ef",
        sky: "#0ea5e9"
    };
    const [recentActivity, setRecentActivity] = useState([]);
    const [loadingActivity, setLoadingActivity] = useState(true);

    // Add this useEffect after your existing useEffect
    useEffect(() => {
        if (!configLoaded) return;
        const [username, uid] = githubConfig.path
            ? githubConfig.path.replace('/db', '').split('-')
            : ["user", "nouid"];
        fetch('/api/activity/commits', {
            headers: {
                'x-username': username,
                'x-uid': uid
            }
        })
            .then((res) => res.json())
            .then((data) => {
                if (Array.isArray(data)) {
                    setRecentActivity(data);
                } else {
                    setRecentActivity([]);
                }
                setLoadingActivity(false);
            })
            .catch((error) => {
                console.error('Error fetching commits:', error);
                setLoadingActivity(false);
            });
    }, [configLoaded]);


    const [categoryStats, setCategoryStats] = useState([]);
    const [loadingCategories, setLoadingCategories] = useState(true);

    useEffect(() => {
        if (!configLoaded) return;
        const [username, uid] = githubConfig.path
            ? githubConfig.path.replace('/db', '').split('-')
            : ["user", "nouid"];

        fetch('/api/inventory/categories', {
            headers: {
                'x-username': username,
                'x-uid': uid
            }
        })
            .then((res) => res.json())
            .then((data) => {
                if (Array.isArray(data)) {
                    setCategoryStats(data);
                } else {
                    setCategoryStats([]);
                }
                setLoadingCategories(false);
            })
            .catch((error) => {
                console.error('Error fetching category stats:', error);
                setLoadingCategories(false);
            });
    }, [configLoaded]);
    // Sample low stock items that would appear in alerts
    const inventoryAlerts = [
        { id: 1, partNumber: "ATM328", manufacturer: "Microchip", inStock: 5, reorderPoint: 10 },
        { id: 2, partNumber: "USB-C-01", manufacturer: "Amphenol", inStock: 8, reorderPoint: 15 },
        { id: 3, partNumber: "CAP-10UF", manufacturer: "Kemet", inStock: 22, reorderPoint: 50 }
    ];

    return (
        <div
            className="mx-auto shadow-xl overflow-hidden"
            style={{
                background: "var(--background)",
                color: "var(--foreground)",
                minHeight: "100vh"
            }}
        >
            <div
                className="shadow-md py-1 px-4"
                style={{
                    background: "var(--card)",
                    borderBottom: "1px solid var(--border)"
                }}
            >
                <h2
                    className="text-2xl font-bold flex items-center"
                    style={{ color: "var(--foreground)" }}
                >
                    <LayoutDashboard className="mr-2 h-5 w-5" /> Dashboard
                </h2>
            </div>
            {/* Main content */}
            <div className="container mx-auto px-4 py-4">
                {/* Quick action buttons */}
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-8">
                    <Link
                        href="/inventory/manage-inventory"
                        className="flex flex-col items-center justify-center text-center p-3 rounded-lg shadow-md hover:shadow-lg transition border-t-4"
                        style={{
                            background: "var(--card)",
                            color: "var(--card-foreground)",
                            borderTopColor: "var(--accent)"
                        }}
                    >
                        <span className="flex items-center justify-center h-12">
                            <Package className="h-10 w-10" style={{ color: "var(--accent)" }} />
                        </span>
                        <span className="font-medium min-h-[40px] flex items-center justify-center">
                            Manage Inventory
                        </span>
                    </Link>

                    <Link
                        href="/add-product"
                        className="flex flex-col items-center justify-center text-center p-3 rounded-lg shadow-md hover:shadow-lg transition border-t-4"
                        style={{
                            background: "var(--card)",
                            color: "var(--card-foreground)",
                            borderTopColor: "var(--success)"
                        }}
                    >
                        <span className="flex items-center justify-center h-12">
                            <PlusCircle className="h-10 w-10" style={{ color: "var(--success)" }} />
                        </span>
                        <span className="font-medium min-h-[40px] flex items-center justify-center">
                            Add a Product
                        </span>
                    </Link>

                    <Link
                        href="/receive-products"
                        className="flex flex-col items-center justify-center text-center p-3 rounded-lg shadow-md hover:shadow-lg transition border-t-4"
                        style={{
                            background: "var(--card)",
                            color: "var(--card-foreground)",
                            borderTopColor: "var(--purple)"
                        }}
                    >
                        <span className="flex items-center justify-center h-12">
                            <Download className="h-10 w-10" style={{ color: "var(--purple)" }} />
                        </span>
                        <span className="font-medium min-h-[40px] flex items-center justify-center">
                            Receive Products
                        </span>
                    </Link>

                    <Link
                        href="/reports"
                        className="flex flex-col items-center justify-center text-center p-3 rounded-lg shadow-md hover:shadow-lg transition border-t-4"
                        style={{
                            background: "var(--card)",
                            color: "var(--card-foreground)",
                            borderTopColor: "var(--warning)"
                        }}
                    >
                        <span className="flex items-center justify-center h-12">
                            <ArrowLeftRight className="h-10 w-10" style={{ color: "var(--warning)" }} />
                        </span>
                        <span className="font-medium min-h-[40px] flex items-center justify-center">
                            Transactions
                        </span>
                    </Link>

                    <Link
                        href="/create-order"
                        className="flex flex-col items-center justify-center text-center p-3 rounded-lg shadow-md hover:shadow-lg transition border-t-4"
                        style={{
                            background: "var(--card)",
                            color: "var(--card-foreground)",
                            borderTopColor: "var(--danger)"
                        }}
                    >
                        <span className="flex items-center justify-center h-12">
                            <ShoppingCart className="h-10 w-10" style={{ color: "var(--danger)" }} />
                        </span>
                        <span className="font-medium min-h-[40px] flex items-center justify-center">
                            Create an Order
                        </span>
                    </Link>

                    <Link
                        href="/datasheets"
                        className="flex flex-col items-center justify-center text-center p-3 rounded-lg shadow-md hover:shadow-lg transition border-t-4"
                        style={{
                            background: "var(--card)",
                            color: "var(--card-foreground)",
                            borderTopColor: "var(--indigo)"
                        }}
                    >
                        <span className="flex items-center justify-center h-12">
                            <FileText className="h-10 w-10" style={{ color: "var(--indigo)" }} />
                        </span>
                        <span className="font-medium min-h-[40px] flex items-center justify-center">
                            Datasheets
                        </span>
                    </Link>
                </div>

                {/* At A Glance Section */}
                <div className="mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Stock Availability */}
                        <div
                            className="rounded-lg shadow-md overflow-hidden"
                            style={{ background: "var(--card)" }}
                        >
                            <div
                                className="px-4 py-3"
                                style={{ background: "var(--accent)" }}
                            >
                                <h3 className="text-lg font-medium flex items-center" style={{ color: "var(--accent-foreground)" }}>
                                    <Archive className="h-5 w-5 mr-2" /> Stock Availability
                                </h3>
                            </div>
                            <div className="p-4" style={{ background: "var(--card)" }}>
                                <table className="w-full">
                                    <tbody>
                                        <tr>
                                            <td className="py-1">Total Count</td>
                                            <td className="py-1 font-bold text-right">{inventoryStats.totalCount}</td>
                                        </tr>
                                        <tr>
                                            <td className="py-1">On Hand</td>
                                            <td className="py-1 text-right">
                                                {inventoryStats.onHand} (
                                                {inventoryStats.totalCount > 0
                                                    ? ((inventoryStats.onHand / inventoryStats.totalCount) * 100).toFixed(1)
                                                    : 0
                                                }%)
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="py-1">On Loan</td>
                                            <td className="py-1 text-right">
                                                {inventoryStats.onLoan} (
                                                {inventoryStats.totalCount > 0
                                                    ? ((inventoryStats.onLoan / inventoryStats.totalCount) * 100).toFixed(1)
                                                    : 0
                                                }%)
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>

                                <div className="mt-6">
                                    <div className="flex justify-center">
                                        <div className="relative w-64 h-64">
                                            <div className="w-full h-full rounded-full" style={{ background: "var(--accent)", opacity: 0.2 }}></div>
                                            <div className="absolute inset-4 rounded-full" style={{ background: "var(--card)" }}>
                                                <div className="flex items-center justify-center flex-col h-full">
                                                    <span className="font-bold text-xl" style={{ color: "var(--foreground)" }}>On Hand</span>
                                                    <span className="font-bold text-3xl" style={{ color: "var(--foreground)" }}>{inventoryStats.onHand}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Replenishment */}
                        <div
                            className="rounded-lg shadow-md overflow-hidden"
                            style={{ background: "var(--card)" }}
                        >
                            <div
                                className="px-4 py-3"
                                style={{ background: "var(--danger)" }}
                            >
                                <h3 className="text-lg font-medium flex items-center" style={{ color: "#fff" }}>
                                    <AlertTriangle className="h-5 w-5 mr-2" /> Replenishment
                                </h3>
                            </div>
                            <div className="p-4">
                                {loadingReplenishment ? (
                                    <div className="flex justify-center items-center h-48">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: "var(--accent)" }}></div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="text-center p-4 rounded-lg" style={{ background: "var(--background)" }}>
                                                <p className="text-2xl font-bold" style={{ color: "var(--accent)" }}>{inventoryStats.productLines}</p>
                                                <p className="text-gray-600 text-sm">Product Lines</p>
                                            </div>

                                            <div className="text-center p-4 rounded-lg" style={{ background: "var(--background)" }}>
                                                <p className="text-2xl font-bold" style={{ color: "var(--danger)" }}>{inventoryStats.noStock}</p>
                                                <p className="text-gray-600 text-sm">No Stock</p>
                                            </div>

                                            <div className="text-center p-4 rounded-lg" style={{ background: "var(--background)" }}>
                                                <p className="text-2xl font-bold" style={{ color: "var(--warning)" }}>{inventoryStats.lowStock}</p>
                                                <p className="text-gray-600 text-sm">Low Stock</p>
                                            </div>
                                        </div>

                                        {lowStockItems.length > 0 && (
                                            <div className="mt-4">
                                                <h4 className="font-medium" style={{ color: "var(--foreground)" }}>Attention Required</h4>
                                                <div className="space-y-2">
                                                    {lowStockItems.slice(0, 5).map(item => (
                                                        <div
                                                            key={item.id}
                                                            className="flex justify-between items-center p-2 rounded border"
                                                            style={{
                                                                background: "#fef08a", // softer yellow
                                                                borderColor: "#fde68a",
                                                            }}
                                                        >
                                                            <div>
                                                                <p className="font-medium" style={{ color: "#b45309" }}>{item.name}</p>
                                                                <p className="text-xs" style={{ color: "#b45309" }}>{item.category}</p>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="font-medium" style={{ color: "#991b1b" }}>{item.current}/{item.minimum}</p>
                                                                <p className="text-xs" style={{ color: "#b45309" }}>Current/Min</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                                {lowStockItems.length > 5 && (
                                                    <div className="mt-2 text-center">
                                                        <Link href="/reports?tab=inventory" style={{ color: "var(--accent)" }} className="hover:underline font-medium">
                                                            View All Low Stock →
                                                        </Link>
                                                    </div>
                                                )}
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
                    <div
                        className="rounded-lg shadow-md overflow-hidden"
                        style={{ background: "var(--card)" }}
                    >
                        <div
                            className="px-4 py-3 border-b"
                            style={{
                                background: "var(--purple4)",
                                color: "#fff", // or var(--card-foreground) if you want dark text
                                borderColor: "var(--border)"
                            }}
                        >
                            <h3 className="text-lg font-medium">Recent Activity</h3>
                        </div>
                        <div className="p-4">
                            {loadingActivity ? (
                                <div className="flex justify-center items-center h-48">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: "var(--accent)" }}></div>
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
                                    style={{ color: "var(--accent)" }}
                                    className="hover:underline font-medium"
                                >
                                    View Commit History →
                                </a>
                            </div>
                        </div>
                    </div>
                    {/* Inventory by Category */}
                    <div
                        className="rounded-lg shadow-md overflow-hidden"
                        style={{ background: "var(--card)" }}
                    >
                        <div
                            className="px-4 py-3 border-b"
                            style={{
                                background: "var(--purple4)",
                                color: "#fff", // or var(--card-foreground) if you want dark text
                                borderColor: "var(--border)"
                            }}
                        >
                            <h3 className="text-lg font-medium">Inventory by Category</h3>
                        </div>

                        <div className="p-4">
                            {loadingCategories ? (
                                <div className="flex justify-center items-center h-48">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: "var(--accent)" }}></div>
                                </div>
                            ) : categoryStats.length === 0 ? (
                                <div className="text-center text-gray-500 py-8">
                                    No category data available
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {categoryStats
                                        .slice()
                                        .sort((a, b) => b.count - a.count)
                                        .slice(0, 6)
                                        .map((category, idx, arr) => {
                                            const maxCount = arr[0]?.count || 1;
                                            return (
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
                                                                width: `${(category.count / maxCount) * 100}%`,
                                                                backgroundColor: colorMap[category.color] || "var(--accent)"
                                                            }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                </div>
                            )}
                            <div className="mt-4 text-center">
                                <Link href="/inventory/reports" style={{ color: "var(--accent)" }} className="hover:underline font-medium">
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