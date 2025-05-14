'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { formatDistanceToNow } from 'date-fns';

interface Product {
  shopify_id: number;
  title: string;
  inventory: number;
  old_inventory: number;
  inventory_change: number;
  inventory_management: string;
  inventory_policy: string;
  price: number;
  last_synced: string;
}

interface InventoryMetrics {
  total_products: number;
  total_inventory: number;
  low_stock_count: number;
  // Add other metrics as needed
}

interface SyncStatus {
  last_sync?: string;
  timestamp?: string;
  status?: string;
}

type SyncResponse = {
  status: 'success' | 'error';
  products_updated?: number;
  products_created?: number;
  error?: string;
  timestamp: string;
};

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NEXT_PUBLIC_API_URL: string;
    }
  }
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [metrics, setMetrics] = useState<InventoryMetrics | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products/');
      console.log('API Response:', response);
      setProducts(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch products');
      console.error('Error details:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSyncStatus = async () => {
    try {
      const status = await api.get('/sync/status');
      // Adjust the timestamp for BST
      if (status.last_sync) {
        const timestamp = new Date(status.last_sync);
        status.last_sync = new Date(timestamp.getTime() + 3600000).toISOString();
      }
      if (status.timestamp) {
        const timestamp = new Date(status.timestamp);
        status.timestamp = new Date(timestamp.getTime() + 3600000).toISOString();
      }
      setSyncStatus(status);
    } catch (err) {
      console.error('Error fetching sync status:', err);
    }
  };

  const fetchLowStockProducts = async () => {
    try {
      const response = await api.get('/products?low_stock=true&threshold=10');
      // Filter products to only include those with inventory below 10
      const lowStockItems = response.filter((product: Product) => product.inventory < 10);
      setLowStockProducts(lowStockItems);
    } catch (err) {
      console.error('Error fetching low stock products:', err);
    }
  };

  const fetchInventoryMetrics = async () => {
    try {
      const response = await api.get('/metrics/inventory');
      console.log('Metrics Response:', response); // Debug log
      setMetrics(response);
    } catch (err) {
      console.error('Error fetching metrics:', err);
    }
  };

  const filteredProducts = products.filter(product => 
    product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.shopify_id.toString().includes(searchTerm)
  );

  useEffect(() => {
    const fetchAndUpdate = async () => {
      try {
        const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}sync/trigger`;
        console.log('Attempting sync with URL:', apiUrl);

        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          // Removing credentials and mode to see if they're causing the issue
        });

        console.log('Response status:', response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Error response:', errorText);
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const syncResult: SyncResponse = await response.json();
        console.log('Sync result:', syncResult);

        if (syncResult.status === 'success') {
          await fetchSyncStatus();
          await fetchProducts();
          await fetchLowStockProducts();
          await fetchInventoryMetrics();
        }
      } catch (err) {
        console.error('Auto-sync failed:', err);
      }
    };

    fetchAndUpdate();
    const intervalId = setInterval(fetchAndUpdate, 5000);
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl bg-gray-50">
      <header className="mb-8 md:mb-12 text-center px-4">
        <div className="flex flex-col items-center justify-center space-y-2">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 tracking-tight">
            Inventory Hub
          </h1>
          <p className="text-gray-500 text-base md:text-lg">
            Real-time inventory tracking & monitoring
          </p>
        </div>
      </header>

      <main className="space-y-6 md:space-y-8">
        {loading && (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 transition-all duration-300 ease-in-out"></div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg shadow-sm transition-all duration-300 ease-in-out">
            <p className="font-semibold">Error:</p>
            <p>{error}</p>
          </div>
        )}

        {metrics && (
          <div className="bg-white shadow-lg rounded-xl p-4 md:p-8 border border-gray-100">
            <h2 className="text-xl md:text-2xl font-semibold mb-4 md:mb-6 text-gray-800">Inventory Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-6 rounded-xl shadow-sm">
                <h3 className="text-sm font-medium text-indigo-600 mb-1">Total Products</h3>
                <p className="text-3xl font-bold text-indigo-700">{metrics.total_products}</p>
              </div>
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 rounded-xl shadow-sm">
                <h3 className="text-sm font-medium text-emerald-600 mb-1">Total Inventory</h3>
                <p className="text-3xl font-bold text-emerald-700">{metrics.total_inventory}</p>
              </div>
              <div className="bg-gradient-to-br from-rose-50 to-rose-100 p-6 rounded-xl shadow-sm">
                <h3 className="text-sm font-medium text-rose-600 mb-1">Low Stock Items</h3>
                <p className="text-3xl font-bold text-rose-700">{metrics.low_stock_count}</p>
              </div>
            </div>
          </div>
        )}

        {lowStockProducts.length > 0 && (
          <div className="bg-white shadow-lg rounded-xl p-4 md:p-8 border border-gray-100">
            <h2 className="text-xl md:text-2xl font-semibold mb-4 md:mb-6 text-gray-800">Low Stock Products</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {lowStockProducts.map((product) => (
                <div key={product.shopify_id} className="border border-rose-200 rounded-lg p-6 bg-rose-50 shadow-sm">
                  <h3 className="font-semibold mb-4 text-gray-800">{product.title}</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Current Stock:</span>
                      <span className="font-medium text-rose-600">
                        {product.inventory}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">ID:</span>
                      <span className="text-sm font-medium text-gray-800">{product.shopify_id}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {products.length > 0 && (
          <div className="bg-white shadow-lg rounded-xl p-4 md:p-8 border border-gray-100">
            <h2 className="text-xl md:text-2xl font-semibold mb-4 md:mb-6 text-gray-800">All Products</h2>
            <div className="mb-6">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by title or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {filteredProducts.map((product) => (
                <div key={product.shopify_id} className="border border-gray-200 rounded-lg p-4 md:p-6 hover:border-indigo-200 transition-colors duration-200 shadow-sm">
                  <h3 className="font-semibold mb-4 md:mb-6 text-gray-800 text-center text-base md:text-lg truncate">
                    {product.title}
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                      <span className="text-gray-700 font-medium">Current Stock:</span>
                      <span className={`text-lg font-bold ${
                        product.inventory <= 10 
                          ? 'text-rose-600' 
                          : 'text-emerald-600'
                      }`}>
                        {product.inventory}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Stock Change:</span>
                      <span className={`text-sm font-medium ${
                        product.inventory_change > 0 
                          ? 'text-emerald-600' 
                          : product.inventory_change < 0 
                            ? 'text-rose-600'
                            : 'text-gray-500'
                      }`}>
                        {product.inventory_change > 0 ? '+' : ''}{product.inventory_change}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">ID:</span>
                      <span className="text-sm font-medium text-gray-800">{product.shopify_id}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Price:</span>
                      <span className="text-sm font-medium text-gray-800">£{product.price}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Last Updated:</span>
                      <span className="text-sm text-gray-500">
                        {formatDistanceToNow(new Date(new Date(product.last_synced).getTime() + 3600000), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {syncStatus && (
          <>
            <div className="mt-6 md:mt-8 text-xs md:text-sm text-gray-500 bg-white rounded-lg p-3 md:p-4 transition-all duration-300 ease-in-out">
              <div className="flex items-center justify-between">
                <span className="font-medium">Sync Status:</span>
                <span>
                  Last synchronized {formatDistanceToNow(new Date(syncStatus.last_sync ?? syncStatus.timestamp ?? new Date()), { addSuffix: true })}
                  {' '} at {new Date(syncStatus.last_sync ?? syncStatus.timestamp ?? new Date()).toLocaleTimeString()}
                </span>
              </div>
            </div>
            <div className="mt-4 text-xs text-gray-400 flex items-center justify-center space-x-2">
              <span>Created by Zac Schmidt</span>
              <a 
                href="https://www.linkedin.com/in/zac-schmidt-b35b05284/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-indigo-400 hover:text-indigo-500 transition-colors duration-200"
              >
                LinkedIn
              </a>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
