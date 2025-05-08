'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { formatDistanceToNow } from 'date-fns';

interface Product {
  shopify_id: number;
  title: string;
  inventory: number;
  inventory_management: string;
  inventory_policy: string;
  price: number;
  last_synced: string;
  // Add any other inventory-related fields from your backend
}

interface InventoryMetrics {
  total_products: number;
  total_inventory: number;
  low_stock_count: number;
  // Add other metrics as needed
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<any>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [metrics, setMetrics] = useState<InventoryMetrics | null>(null);

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

  const triggerSync = async () => {
    setIsSyncing(true);
    try {
      await api.post('/sync/trigger', {});
      await fetchSyncStatus();
      await fetchProducts(); // Refresh products after sync
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to trigger sync');
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchSyncStatus();
    fetchLowStockProducts();
    fetchInventoryMetrics();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <header className="mb-12">
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-bold text-gray-800">Inventory Dashboard</h1>
          <button
            onClick={triggerSync}
            disabled={isSyncing}
            className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-300 transition-colors duration-200 shadow-sm"
          >
            {isSyncing ? 'Syncing...' : 'Sync Products'}
          </button>
        </div>
      </header>

      <main className="space-y-8">
        {loading && (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg shadow-sm">
            <p className="font-semibold">Error:</p>
            <p>{error}</p>
          </div>
        )}

        {metrics && (
          <div className="bg-white shadow-lg rounded-xl p-8 border border-gray-100">
            <h2 className="text-2xl font-semibold mb-6 text-gray-800">Inventory Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
          <div className="bg-white shadow-lg rounded-xl p-8 border border-gray-100">
            <h2 className="text-2xl font-semibold mb-6 text-gray-800">Low Stock Products</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
          <div className="bg-white shadow-lg rounded-xl p-8 border border-gray-100">
            <h2 className="text-2xl font-semibold mb-6 text-gray-800">All Products</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <div key={product.shopify_id} className="border border-gray-200 rounded-lg p-6 hover:border-indigo-200 transition-colors duration-200 shadow-sm">
                  <h3 className="font-semibold mb-4 text-gray-800">{product.title}</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Current Stock:</span>
                      <span className={`font-medium ${
                        product.inventory <= 10 
                          ? 'text-rose-600' 
                          : 'text-emerald-600'
                      }`}>
                        {product.inventory}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">ID:</span>
                      <span className="text-sm font-medium text-gray-800">{product.shopify_id}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Price:</span>
                      <span className="text-sm font-medium text-gray-800">${product.price}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Last Updated:</span>
                      <span className="text-sm text-gray-500">
                        {formatDistanceToNow(new Date(product.last_synced), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {syncStatus && (
          <div className="mt-8 text-sm text-gray-500 bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">Sync Status:</span>
              <span>
                Last synchronized {formatDistanceToNow(new Date(syncStatus.last_sync || syncStatus.timestamp), { addSuffix: true })}
                {' '} at {new Date(syncStatus.last_sync || syncStatus.timestamp).toLocaleTimeString()}
              </span>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
