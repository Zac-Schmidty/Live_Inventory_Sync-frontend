'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface Product {
  id: number;
  title: string;
  inventory_quantity: number;
  // Add other product fields as needed
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<any>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products/');
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
      // Alternative approach using URLSearchParams
      const params = new URLSearchParams({ threshold: '10' });
      const response = await api.get(`/products/low-stock/?${params.toString()}`);
      setLowStockProducts(response);
    } catch (err) {
      console.error('Error fetching low stock products:', err);
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
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Shopify App Dashboard</h1>
          <button
            onClick={triggerSync}
            disabled={isSyncing}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-blue-300"
          >
            {isSyncing ? 'Syncing...' : 'Sync Products'}
          </button>
        </div>
      </header>

      <main className="space-y-6">
        {loading && (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            <p className="font-semibold">Error:</p>
            <p>{error}</p>
          </div>
        )}

        {syncStatus && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Sync Status</h2>
            <pre className="overflow-auto">
              {JSON.stringify(syncStatus, null, 2)}
            </pre>
          </div>
        )}

        {products.length > 0 && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Products</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((product) => (
                <div key={product.id} className="border rounded-lg p-4">
                  <h3 className="font-medium">{product.title}</h3>
                  <p className="text-sm text-gray-600">
                    Inventory: {product.inventory_quantity}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {lowStockProducts.length > 0 && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Low Stock Products</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {lowStockProducts.map((product) => (
                <div key={product.id} className="border rounded-lg p-4 bg-red-50">
                  <h3 className="font-medium">{product.title}</h3>
                  <p className="text-sm text-red-600">
                    Low Stock: {product.inventory_quantity}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
