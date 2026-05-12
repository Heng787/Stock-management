import { defineStore } from 'pinia';
import client from '../api/client';

export const useStockStore = defineStore('stock', {
  state: () => ({
    products: [],
    categories: [],
    suppliers: [],
    customers: [],
    warehouses: [],
    transactions: [],
    loading: false,
    error: null
  }),
  actions: {
    async fetchAll() {
      this.loading = true;
      try {
        const [prodRes, catRes, supRes, custRes, warRes, transRes] = await Promise.all([
          client.get('/products'),
          client.get('/categories'),
          client.get('/suppliers'),
          client.get('/customers'),
          client.get('/warehouses'),
          client.get('/transactions')
        ]);
        this.products = prodRes.data;
        this.categories = catRes.data;
        this.suppliers = supRes.data;
        this.customers = custRes.data;
        this.warehouses = warRes.data;
        this.transactions = transRes.data;
      } catch (err) {
        this.error = err.error || 'Failed to fetch data';
      } finally {
        this.loading = false;
      }
    },
    async addProduct(productData) {
      const res = await client.post('/products', productData);
      this.products.push(res.data);
    },
    async updateProduct(id, productData) {
      const res = await client.patch(`/products/${id}`, productData);
      const index = this.products.findIndex(p => p._id === id);
      if (index !== -1) this.products[index] = res.data;
    },
    async deleteProduct(id) {
      await client.delete(`/products/${id}`);
      this.products = this.products.filter(p => p._id !== id);
    },
    // Categories
    async addCategory(data) {
      const res = await client.post('/categories', data);
      this.categories.push(res.data);
    },
    async updateCategory(id, data) {
      const res = await client.put(`/categories/${id}`, data);
      const index = this.categories.findIndex(c => c._id === id);
      if (index !== -1) this.categories[index] = res.data;
    },
    async deleteCategory(id) {
      await client.delete(`/categories/${id}`);
      this.categories = this.categories.filter(c => c._id !== id);
    },
    // Suppliers
    async addSupplier(data) {
      const res = await client.post('/suppliers', data);
      this.suppliers.push(res.data);
    },
    async updateSupplier(id, data) {
      const res = await client.put(`/suppliers/${id}`, data);
      const index = this.suppliers.findIndex(s => s._id === id);
      if (index !== -1) this.suppliers[index] = res.data;
    },
    async deleteSupplier(id) {
      await client.delete(`/suppliers/${id}`);
      this.suppliers = this.suppliers.filter(s => s._id !== id);
    },
    // Customers
    async addCustomer(data) {
      const res = await client.post('/customers', data);
      this.customers.push(res.data);
      return res.data;
    },
    async updateCustomer(id, data) {
      const res = await client.put(`/customers/${id}`, data);
      const index = this.customers.findIndex(c => c._id === id);
      if (index !== -1) this.customers[index] = res.data;
      return res.data;
    },
    // Warehouses
    async addWarehouse(data) {
      const res = await client.post('/warehouses', data);
      this.warehouses.push(res.data);
      return res.data;
    },
    async createTransaction(transactionData) {
      const res = await client.post('/transactions', transactionData);
      this.transactions.unshift(res.data);
      // Refresh products as quantities have changed
      await this.fetchAll();
      return res.data;
    },
    async processMovement(movementData) {
      const res = await client.post('/movements', movementData);
      // Refresh products to get new quantities
      await this.fetchAll();
      return res.data;
    }
  }
});
