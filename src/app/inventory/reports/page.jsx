"use client";
import React, { useEffect, useState, useMemo } from "react";
import { AlertTriangle, Layers, ChevronDown, ChevronUp, Search } from "lucide-react";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";
import { getDoc, doc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { db, auth } from "@/config/firebase";
import githubConfigImport from "@/config/githubConfig";

const InventoryReport = () => {
    const title = "Inventory Report";
    const [lowStockItems, setLowStockItems] = useState([]);
    const [loadingLowStock, setLoadingLowStock] = useState(true);
    const [categoryStats, setCategoryStats] = useState([]);
    const [loadingCategories, setLoadingCategories] = useState(true);
    const [githubConfig, setGithubConfig] = useState(githubConfigImport);
    const [configLoaded, setConfigLoaded] = useState(false);
    const [sortField, setSortField] = useState("name");
    const [sortDirection, setSortDirection] = useState("asc");
    const [filterCategory, setFilterCategory] = useState("");
    const [filterManufacturer, setFilterManufacturer] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const router = useRouter();

    // Auth and config logic
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

    // Fetch low stock items
    useEffect(() => {
    if (!configLoaded) return;
    setLoadingCategories(true);
    fetch('/api/inventory/categories', {
        headers: getUserHeaders(githubConfig)
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
        .catch(() => setLoadingCategories(false));
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
    function getUserHeaders(githubConfig) {
        const [username, uid] = githubConfig.path
            ? githubConfig.path.replace('/db', '').split('-')
            : ["user", "nouid"];
        return {
            'x-username': username,
            'x-uid': uid
        };
    }
    // Fetch category stats
    

    // Helper to fetch all low stock items (not just top 5)
    async function fetchAllLowStockItems() {
        const res = await fetch('/api/inventory/lowstock', {
    headers: getUserHeaders(githubConfig)
});
        const data = await res.json();
        try {
            const { owner, repo, token, path } = githubConfig;
            const response = await fetch(
                `https://api.github.com/repos/${owner}/${repo}/contents/${path || "db/jsons"}?ref=master`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                }
            );
            const files = await response.json();
            let inventory = [];
            for (const file of files) {
                if (file.name.endsWith('.json')) {
                    const fileContent = await fetch(file.download_url, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const item = await fileContent.json();
                    inventory.push(item);
                }
            }
            return inventory
                .filter(item =>
                    parseInt(item.avl_quantity) > 0 &&
                    parseInt(item.avl_quantity) <= parseInt(item.reorderPoint)
                )
                .map(item => ({
                    id: item.id || Math.random().toString(36).substr(2, 9),
                    partNumber: item.partNumber,
                    name: item.partName,
                    manufacturer: item.manufacturer,
                    category: item.category,
                    current: parseInt(item.avl_quantity),
                    minimum: parseInt(item.reorderPoint)
                }));
        } catch {
            return data.lowStockItems || [];
        }
    }

    // Get unique categories and manufacturers for filter dropdowns
    const uniqueCategories = useMemo(
        () => Array.from(new Set(lowStockItems.map(item => item.category).filter(Boolean))),
        [lowStockItems]
    );
    const uniqueManufacturers = useMemo(
        () => Array.from(new Set(lowStockItems.map(item => item.manufacturer).filter(Boolean))),
        [lowStockItems]
    );

    // Sort and filter logic
    const filteredAndSortedItems = useMemo(() => {
        let items = [...lowStockItems];
        if (filterCategory) {
            items = items.filter(item => item.category === filterCategory);
        }
        if (filterManufacturer) {
            items = items.filter(item => item.manufacturer === filterManufacturer);
        }
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            items = items.filter(
                item =>
                    (item.name && item.name.toLowerCase().includes(term)) ||
                    (item.id && item.id.toLowerCase().includes(term)) ||
                    (item.manufacturer && item.manufacturer.toLowerCase().includes(term))
            );
        }
        items.sort((a, b) => {
            let aValue = a[sortField] ?? "";
            let bValue = b[sortField] ?? "";
            if (typeof aValue === "string") aValue = aValue.toLowerCase();
            if (typeof bValue === "string") bValue = bValue.toLowerCase();
            if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
            if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
            return 0;
        });
        return items;
    }, [lowStockItems, filterCategory, filterManufacturer, searchTerm, sortField, sortDirection]);

    // Sort handler
    const handleSort = (field) => {
        if (sortField === field) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc");
        } else {
            setSortField(field);
            setSortDirection("asc");
        }
    };

    return (
        <div className="mx-auto bg-white shadow-xl overflow-hidden">
            <div className="container mx-auto px-4 py-8">
                {/* Low Stock Items */}
                <section className="mb-10">
                    <div className="flex items-center mb-4">
                        <AlertTriangle className="h-6 w-6 text-yellow-600 mr-2" />
                        <h2 className="text-2xl font-bold">All Low Stock Items</h2>
                    </div>
                    {/* Filters */}
                    <div className="flex flex-wrap gap-4 mb-4 items-center">
                        <div>
                            <input
                                type="text"
                                placeholder="Search by ID, Name, Manufacturer"
                                className="border rounded px-2 py-1 text-sm"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div>
                            <select
                                className="border rounded px-2 py-1 text-sm"
                                value={filterCategory}
                                onChange={e => setFilterCategory(e.target.value)}
                            >
                                <option value="">All Categories</option>
                                {uniqueCategories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <select
                                className="border rounded px-2 py-1 text-sm"
                                value={filterManufacturer}
                                onChange={e => setFilterManufacturer(e.target.value)}
                            >
                                <option value="">All Manufacturers</option>
                                {uniqueManufacturers.map(manu => (
                                    <option key={manu} value={manu}>{manu}</option>
                                ))}
                            </select>
                        </div>
                        {(filterCategory || filterManufacturer || searchTerm) && (
                            <button
                                className="ml-2 px-2 py-1 text-xs rounded bg-gray-200 hover:bg-gray-300"
                                onClick={() => {
                                    setFilterCategory("");
                                    setFilterManufacturer("");
                                    setSearchTerm("");
                                }}
                            >
                                Reset
                            </button>
                        )}
                    </div>
                    {loadingLowStock ? (
                        <div className="flex justify-center items-center h-32">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600"></div>
                        </div>
                    ) : filteredAndSortedItems.length === 0 ? (
                        <div className="text-gray-500">No low stock items found.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                                <thead>
                                    <tr className="bg-yellow-100">
                                        <th
                                            className="py-2 px-3 border-b text-left cursor-pointer select-none"
                                            onClick={() => handleSort("id")}
                                        >
                                            ID{" "}
                                            {sortField === "id" &&
                                                (sortDirection === "asc" ? <ChevronUp className="inline w-3 h-3" /> : <ChevronDown className="inline w-3 h-3" />)}
                                        </th>
                                        <th
                                            className="py-2 px-3 border-b text-left cursor-pointer select-none"
                                            onClick={() => handleSort("name")}
                                        >
                                            Part Name{" "}
                                            {sortField === "name" &&
                                                (sortDirection === "asc" ? <ChevronUp className="inline w-3 h-3" /> : <ChevronDown className="inline w-3 h-3" />)}
                                        </th>
                                        <th
                                            className="py-2 px-3 border-b text-left cursor-pointer select-none"
                                            onClick={() => handleSort("manufacturer")}
                                        >
                                            Manufacturer{" "}
                                            {sortField === "manufacturer" &&
                                                (sortDirection === "asc" ? <ChevronUp className="inline w-3 h-3" /> : <ChevronDown className="inline w-3 h-3" />)}
                                        </th>
                                        <th
                                            className="py-2 px-3 border-b text-left cursor-pointer select-none"
                                            onClick={() => handleSort("category")}
                                        >
                                            Category{" "}
                                            {sortField === "category" &&
                                                (sortDirection === "asc" ? <ChevronUp className="inline w-3 h-3" /> : <ChevronDown className="inline w-3 h-3" />)}
                                        </th>
                                        <th
                                            className="py-2 px-3 border-b text-right cursor-pointer select-none"
                                            onClick={() => handleSort("current")}
                                        >
                                            Current{" "}
                                            {sortField === "current" &&
                                                (sortDirection === "asc" ? <ChevronUp className="inline w-3 h-3" /> : <ChevronDown className="inline w-3 h-3" />)}
                                        </th>
                                        <th
                                            className="py-2 px-3 border-b text-right cursor-pointer select-none"
                                            onClick={() => handleSort("minimum")}
                                        >
                                            Minimum{" "}
                                            {sortField === "minimum" &&
                                                (sortDirection === "asc" ? <ChevronUp className="inline w-3 h-3" /> : <ChevronDown className="inline w-3 h-3" />)}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredAndSortedItems.map(item => (
                                        <tr key={item.id} className="hover:bg-yellow-50">
                                            <td className="py-2 px-3 border-b">{item.id || "-"}</td>
                                            <td className="py-2 px-3 border-b">{item.name}</td>
                                            <td className="py-2 px-3 border-b">{item.manufacturer || "-"}</td>
                                            <td className="py-2 px-3 border-b">{item.category || "-"}</td>
                                            <td className="py-2 px-3 border-b text-right text-red-600 font-bold">{item.current}</td>
                                            <td className="py-2 px-3 border-b text-right">{item.minimum}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
                {/* Inventory by Category */}
                <section>
                    <div className="flex items-center mb-4">
                        <Layers className="h-6 w-6 text-blue-600 mr-2" />
                        <h2 className="text-2xl font-bold">Inventory by Category</h2>
                    </div>
                    {loadingCategories ? (
                        <div className="flex justify-center items-center h-32">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : categoryStats.length === 0 ? (
                        <div className="text-gray-500">No category data available.</div>
                    ) : (
                        <div className="space-y-4">
                            {categoryStats
                                .slice() // copy array
                                .sort((a, b) => b.count - a.count) // sort by count descending
                                // .slice(0, 6) // take top 5
                                .map((category, idx, arr) => {
                                    // Find the highest count among the displayed categories
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
                                                        backgroundColor: colorMap[category.color] || "#2563eb" // fallback to blue
                                                    }}
                                                ></div>
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    )}
                </section>
            </div>

            
        </div>
    );
};

export default InventoryReport;