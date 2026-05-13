<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'

import {
  Plus,
  Search,
  Filter,
  History,
  X,
  UploadCloud,
  Upload,
  AlertTriangle,
  LayoutGrid,
  List,
  Image as ImageIcon,
  Trash2,
  PlusCircle,
  MinusCircle,
  Pencil,
  Download
} from 'lucide-vue-next'

import { useStockStore } from '../stores/stock'
import { useAuthStore } from '../stores/auth'
import { useUIStore } from '../stores/ui'

import BulkImportModal from '../components/BulkImportModal.vue'

import client from '../api/client'
import { formatCurrency } from '../utils/format'
import { exportToCSV } from '../utils/export'

const stock = useStockStore()
const auth = useAuthStore()
const ui = useUIStore()
const route = useRoute()

// View State
const viewMode = ref(localStorage.getItem('inventoryViewMode') || 'card')
const setViewMode = (mode) => {
  viewMode.value = mode
  localStorage.setItem('inventoryViewMode', mode)
}

onMounted(() => {
  stock.fetchAll();
  if (route.query.warehouse) {
    const wName = stock.warehouses.find(w => w._id === route.query.warehouse)?.name || 'selected warehouse';
    ui.notify(`Showing inventory for ${wName}`, 'info');
  }
});

const searchQuery = ref('')
const selectedCategory = ref('')
const selectedWarehouse = ref(route.query.warehouse || '')
const showAddModal = ref(false)
const showStockModal = ref(false)
const showImportModal = ref(false)
const selectedProduct = ref(null)
const editingProductId = ref(null)
const stockAction = ref('IN') // 'IN' or 'OUT'
const isSubmitting = ref(false)
const showHistoryModal = ref(false)
const historyData = ref([])
const isLoadingHistory = ref(false)

const generateSKU = () => {
  const prefix = 'STK'
  const timestamp = Date.now().toString(36).toUpperCase().slice(-4)
  const random = Math.random().toString(36).toUpperCase().slice(-4)
  return `${prefix}-${timestamp}-${random}`
}

const openAddModal = () => {
  editingProductId.value = null
  newProduct.value = {
    sku: generateSKU(),
    name: '',
    description: '',
    categoryId: '',
    supplierId: '',
    price: 0,
    minStockLevel: 5,
    quantity: 0,
  }
  showAddModal.value = true
}

const openEditModal = (product) => {
  editingProductId.value = product._id
  newProduct.value = {
    sku: product.sku,
    name: product.name,
    description: product.description || '',
    categoryId: product.categoryId?._id || product.categoryId || '',
    supplierId: product.supplierId?._id || product.supplierId || '',
    price: product.price,
    minStockLevel: product.minStockLevel,
    quantity: product.quantity, // Note: quantity usually shouldn't be edited directly here but via movements
    image: product.image || ''
  }
  showAddModal.value = true
}

const closeProductModal = () => {
  showAddModal.value = false
  editingProductId.value = null
}

// Filtered products
const filteredProducts = computed(() => {
  return stock.products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.value.toLowerCase())
    
    const matchesCategory = !selectedCategory.value || p.categoryId?._id === selectedCategory.value
    
    const matchesWarehouse = !selectedWarehouse.value || 
      p.warehouseStock?.some(ws => ws.warehouse === selectedWarehouse.value && ws.quantity > 0)

    return matchesSearch && matchesCategory && matchesWarehouse
  })
})

const openStockModal = (product, action) => {
  selectedProduct.value = product
  stockAction.value = action
  // Reset movement data for a fresh start
  movementData.value = {
    quantity: 1,
    reason: '',
    warehouseId: product.warehouseStock?.[0]?.warehouse || ''
  }
  showStockModal.value = true
}

const openHistory = async (product) => {
  selectedProduct.value = product
  showHistoryModal.value = true
  isLoadingHistory.value = true
  try {
    const res = await client.get(`/movements/${product._id}`)
    historyData.value = res.data
  } catch (err) {
    ui.notify(err.error || 'Failed to load history', 'error')
  } finally {
    isLoadingHistory.value = false
  }
}

const formatDateShort = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const exportProducts = () => {
  const data = stock.products.map(p => ({
    SKU: p.sku,
    Name: p.name,
    Category: p.categoryId?.name || 'General',
    Price: p.price,
    Quantity: p.quantity,
    'Min Stock': p.minStockLevel,
    Status: p.quantity <= 0 ? 'OUT OF STOCK' : p.quantity <= p.minStockLevel ? 'LOW STOCK' : 'IN STOCK'
  }));
  ui.notify('Generating inventory export...', 'info');
  exportToCSV(data, 'inventory_export');
  ui.notify('Inventory exported successfully', 'success');
};

// Form Refs
const newProduct = ref({
  sku: '',
  name: '',
  description: '',
  categoryId: '',
  supplierId: '',
  warehouseId: '',
  price: 0,
  image: '',
  minStockLevel: 5,
  maxStockLevel: 0,
  quantity: 0,
})

const movementData = ref({
  quantity: 1,
  reason: '',
  warehouseId: '',
})

const handleDeleteProduct = async (product) => {
  if (product.quantity > 0) {
    ui.notify('Cannot delete product with existing stock. Please zero out stock first.', 'error');
    return;
  }
  if (!confirm(`Are you sure you want to permanently delete "${product.name}"? This will also remove its transaction history.`)) return;
  try {
    await stock.deleteProduct(product._id)
    ui.notify('Product deleted successfully', 'success')
  } catch (err) {
    ui.notify(err.error || 'Failed to delete product', 'error')
  }
}

const handleFileUpload = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append('image', file);

  try {
    const res = await client.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    newProduct.value.image = res.data;
  } catch (err) {
    ui.notify('Upload failed: ' + (err.error || 'Check file size or type'), 'error');
  }
};

const handleAddProduct = async () => {
  if (isSubmitting.value) return
  if (!newProduct.value.name.trim()) {
    ui.notify('Product name is required', 'error')
    return
  }
  isSubmitting.value = true
  try {
    if (editingProductId.value) {
      await stock.updateProduct(editingProductId.value, newProduct.value)
      ui.notify('Product updated successfully!', 'success')
    } else {
      await stock.addProduct(newProduct.value)
      ui.notify('Product created successfully!', 'success')
    }
    closeProductModal()
    newProduct.value = {
      sku: '',
      name: '',
      description: '',
      categoryId: '',
      supplierId: '',
      price: 0,
      minStockLevel: 5,
      maxStockLevel: 0,
      quantity: 0,
    }
  } catch (err) {
    ui.notify(err.error || 'Failed to save product', 'error')
  } finally {
    isSubmitting.value = false
  }
}

const handleStockMovement = async () => {
  if (isSubmitting.value) return
  isSubmitting.value = true
  try {
    // VALIDATION: Check against max capacity
    if (selectedProduct.value.maxStockLevel > 0) {
      const newTotal = stockAction.value === 'IN' 
        ? selectedProduct.value.quantity + movementData.value.quantity
        : selectedProduct.value.quantity - movementData.value.quantity;
      
      if (stockAction.value === 'IN' && newTotal > selectedProduct.value.maxStockLevel) {
        ui.notify(`Cannot exceed maximum capacity of ${selectedProduct.value.maxStockLevel}`, 'error');
        return;
      }
    }

    await stock.processMovement({
      productId: selectedProduct.value._id,
      type: stockAction.value,
      quantity: movementData.value.quantity,
      reason: movementData.value.reason,
      warehouseId: movementData.value.warehouseId,
    })
    ui.notify('Stock updated successfully', 'success')
    showStockModal.value = false
    movementData.value = { quantity: 1, reason: '', warehouseId: '' }
  } catch (err) {
    ui.notify(err.error || 'Operation failed', 'error')
  } finally {
    isSubmitting.value = false
  }
}

const handleBulkImport = async (parsedData) => {
  try {
    const categoryId = stock.categories[0]?._id
    if (!categoryId) {
      ui.notify('Please create at least one category before importing.', 'warning')
      return
    }

    const payload = parsedData.map((item) => ({
      sku: item.sku || '',
      name: item.name || '',
      price: parseFloat(item.price) || 0,
      minStockLevel: parseInt(item.minStockLevel) || 5,
      categoryId: categoryId,
      supplierId: null,
    }))
    const res = await client.post('/products/bulk', payload)
    
    await stock.fetchAll()
    showImportModal.value = false
    ui.notify(`Successfully imported ${res.data.count || parsedData.length} product(s).`, 'success')
  } catch (err) {
    ui.notify(err?.error || err?.message || 'Failed to import products', 'error')
  }
}
</script>

<template>
  <div class="inventory">
    <header class="header">
      <div class="title-area">
        <h1>Inventory Management</h1>
        <p class="subtitle">{{ filteredProducts.length }} products found</p>
      </div>
      <div class="actions">
        <button
          v-if="auth.isAdmin"
          @click="showImportModal = true"
          class="btn btn-outline"
          style="margin-right: 0.5rem"
        >
          <UploadCloud :size="20" />
          <span>Import CSV</span>
        </button>
        <button @click="exportProducts" class="btn btn-outline" style="margin-right: 0.5rem">
          <Download :size="20" />
          <span>Export All</span>
        </button>
        <button v-if="auth.isAdmin" @click="openAddModal" class="btn btn-primary">
          <Plus :size="20" />
          <span>New Product</span>
        </button>
      </div>
    </header>

    <div class="toolbar card glass">
      <div class="search-area">
        <div class="search-wrapper">
          <Search class="search-icon" :size="20" />
          <input v-model="searchQuery" type="text" placeholder="Search by name or SKU..." />
        </div>
        <div class="filters">
          <div class="filter-group">
            <Filter :size="18" />
            <select v-model="selectedCategory" class="filter-select">
              <option value="">All Categories</option>
              <option v-for="cat in stock.categories" :key="cat._id" :value="cat._id">
                {{ cat.name }}
              </option>
            </select>
            
            <select v-model="selectedWarehouse" class="filter-select">
              <option value="">All Warehouses</option>
              <option v-for="w in stock.warehouses" :key="w._id" :value="w._id">
                {{ w.name }}
              </option>
            </select>
          </div>
        </div>
      </div>

      <div class="view-toggle">
        <button @click="setViewMode('card')" :class="{ active: viewMode === 'card' }" class="toggle-btn">
          <LayoutGrid :size="18" />
        </button>
        <button @click="setViewMode('table')" :class="{ active: viewMode === 'table' }" class="toggle-btn">
          <List :size="18" />
        </button>
      </div>
    </div>

    <!-- Main Content -->
    <div v-if="filteredProducts.length > 0">
      <!-- Card View -->
      <div v-if="viewMode === 'card'" class="product-grid">
        <div v-for="p in filteredProducts" :key="p._id" class="card product-card">
          <div class="product-header">
            <div class="product-img">
              <img v-if="p.image" :src="p.image" :alt="p.name" />
              <ImageIcon v-else :size="24" />
            </div>
            <div class="product-badges">
              <span class="category-badge">{{ p.categoryId?.name }}</span>
              <span v-if="p.quantity === 0" class="status-badge critical">OUT OF STOCK</span>
              <span v-else-if="p.quantity <= (p.minStockLevel * 0.2)" class="status-badge critical">CRITICAL</span>
              <span v-else-if="p.quantity <= p.minStockLevel" class="status-badge warning">LOW STOCK</span>
            </div>
          </div>
          
          <div class="product-body">
            <h3 class="name">{{ p.name }}</h3>
            <p class="sku">{{ p.sku }}</p>
            <div class="price-row">
              <span class="price">{{ formatCurrency(p.price) }}</span>
              <span class="quantity">{{ p.quantity }} {{ p.unit || 'units' }}</span>
            </div>
            
            <div class="stock-progress">
              <div class="progress-bar">
                <div 
                  class="progress-fill" 
                  :style="{ 
                    width: p.maxStockLevel > 0 
                      ? Math.min((p.quantity / p.maxStockLevel) * 100, 100) + '%'
                      : Math.min((p.quantity / (p.minStockLevel * 1.5)) * 100, 100) + '%' 
                  }"
                  :class="{ 
                    critical: p.quantity <= (p.minStockLevel * 0.2),
                    warning: p.quantity <= p.minStockLevel && p.quantity > (p.minStockLevel * 0.2),
                    overstock: p.maxStockLevel > 0 && p.quantity >= p.maxStockLevel
                  }"
                ></div>
              </div>
            </div>
          </div>

          <div class="product-actions">
            <button @click="openStockModal(p, 'IN')" class="action-btn in" title="Stock In"><PlusCircle :size="16" /></button>
            <button @click="openStockModal(p, 'OUT')" class="action-btn out" title="Stock Out"><MinusCircle :size="16" /></button>
            <button @click="openStockModal(p, 'ADJUSTMENT')" class="action-btn adjust" title="Adjust / Return"><AlertTriangle :size="16" /></button>
            <button @click="openEditModal(p)" class="action-btn edit" title="Edit Product"><Pencil :size="16" /></button>
            <button @click="openHistory(p)" class="action-btn history" title="View History"><History :size="16" /></button>
            <button @click="handleDeleteProduct(p)" class="action-btn delete" title="Delete Product"><Trash2 :size="16" /></button>
          </div>
        </div>
      </div>

      <!-- Table View -->
      <div v-else class="card table-card overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>Product Details</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock Level</th>
              <th class="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in filteredProducts" :key="p._id">
              <td>
                <div class="p-info">
                  <div class="p-img">
                    <img v-if="p.image" :src="p.image" :alt="p.name" />
                    <ImageIcon v-else :size="16" />
                  </div>
                  <div class="p-text">
                    <p class="p-name">{{ p.name }}</p>
                    <p class="p-sku">{{ p.sku }}</p>
                  </div>
                </div>
              </td>
              <td>{{ p.categoryId?.name }}</td>
              <td class="font-bold">{{ formatCurrency(p.price) }}</td>
              <td>
                <div class="stock-level">
                  <span 
                    class="stock-count" 
                    :class="{ 
                      critical: p.quantity <= (p.minStockLevel * 0.2),
                      warning: p.quantity <= p.minStockLevel && p.quantity > (p.minStockLevel * 0.2)
                    }"
                  >
                    {{ p.quantity }} {{ p.unit || 'units' }}
                  </span>
                  <div class="stock-bar">
                    <div
                      class="bar-fill"
                      :style="{
                        width: p.maxStockLevel > 0 
                          ? Math.min((p.quantity / p.maxStockLevel) * 100, 100) + '%'
                          : Math.min((p.quantity / (p.minStockLevel * 1.5)) * 100, 100) + '%'
                      }"
                      :class="{ 
                        critical: p.quantity <= (p.minStockLevel * 0.2),
                        warning: p.quantity <= p.minStockLevel && p.quantity > (p.minStockLevel * 0.2),
                        overstock: p.maxStockLevel > 0 && p.quantity >= p.maxStockLevel
                      }"
                    ></div>
                  </div>
                </div>
              </td>
              <td class="text-right">
                <div class="table-actions">
                  <button @click="openStockModal(p, 'IN')" class="action-icon in" title="Stock In"><PlusCircle :size="18" /></button>
                  <button @click="openStockModal(p, 'OUT')" class="action-icon out" title="Stock Out"><MinusCircle :size="18" /></button>
                  <button @click="openStockModal(p, 'ADJUSTMENT')" class="action-icon adjust" title="Adjust / Return"><AlertTriangle :size="18" /></button>
                  <button @click="openEditModal(p)" class="action-icon edit" title="Edit Product"><Pencil :size="18" /></button>
                  <button @click="openHistory(p)" class="action-icon info" title="View History"><History :size="18" /></button>
                  <button @click="handleDeleteProduct(p)" class="action-icon delete" title="Delete Product"><Trash2 :size="18" /></button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="empty-state card glass">
      <div class="empty-icon"><ImageIcon :size="48" /></div>
      <h3>No Products Found</h3>
      <p>Try adjusting your filters or add a new product to your inventory.</p>
      <button @click="openAddModal" class="btn btn-primary">Add New Product</button>
    </div>

    <!-- Add Product Modal -->
    <div v-if="showAddModal" class="modal-overlay">
      <div class="modal card">
        <div class="modal-header">
          <h3>{{ editingProductId ? 'Edit Product' : 'Create New Product' }}</h3>
          <button @click="closeProductModal" class="close-btn" aria-label="Close modal">
            <X :size="20" />
          </button>
        </div>
        <form @submit.prevent="handleAddProduct" class="modal-form">
          <div class="form-grid">
            <div class="input-group">
              <label>SKU</label>
              <input v-model="newProduct.sku" required placeholder="e.g. WH-101" />
            </div>
            <div class="input-group">
              <label>Name</label>
              <input v-model="newProduct.name" required placeholder="Product Name" />
            </div>
          </div>
          <div class="input-group">
            <label>Category</label>
            <select v-model="newProduct.categoryId" required>
              <option value="" disabled>Select Category</option>
              <option v-for="cat in stock.categories" :key="cat._id" :value="cat._id">
                {{ cat.name }}
              </option>
            </select>
          </div>
          <div class="form-grid">
            <div class="input-group">
              <label>Price</label>
              <input v-model.number="newProduct.price" type="number" step="0.01" required />
            </div>
            <div class="input-group">
              <label>Initial Warehouse</label>
              <select v-model="newProduct.warehouseId" required>
                <option value="" disabled>Select Warehouse</option>
                <option v-for="w in stock.warehouses" :key="w._id" :value="w._id">{{ w.name }}</option>
              </select>
            </div>
            <div class="input-group">
              <label>Alert Threshold (Min Stock)</label>
              <input v-model.number="newProduct.minStockLevel" type="number" required placeholder="e.g. 100" />
            </div>
            <div class="input-group">
              <label>Max Capacity (Optional)</label>
              <input v-model.number="newProduct.maxStockLevel" type="number" placeholder="e.g. 1000" />
            </div>
          </div>
          <div class="input-group">
            <label>Initial Stock Quantity</label>
            <input v-model.number="newProduct.quantity" type="number" min="0" required />
          </div>
          <div class="input-group">
            <label>Product Image</label>
            <div class="upload-area" :class="{ 'has-image': newProduct.image }">
              <input type="file" @change="handleFileUpload" accept="image/*" class="file-input" />
              <div v-if="!newProduct.image" class="upload-placeholder">
                <Upload :size="24" />
                <span>Click to upload from your folders</span>
              </div>
              <div v-else class="upload-preview">
                <img :src="newProduct.image" alt="Preview" />
                <button @click.prevent="newProduct.image = ''" class="remove-img">
                  <X :size="14" />
                </button>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" @click="closeProductModal" class="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" class="btn btn-primary">
              {{ editingProductId ? 'Update Product' : 'Create Product' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Stock Movement Modal -->
    <div v-if="showStockModal" class="modal-overlay">
      <div class="modal card mini">
        <div class="modal-header">
          <h3>
            {{ stockAction === 'ADJUSTMENT' ? 'Stock Adjustment' : `Stock ${stockAction === 'IN' ? 'In' : 'Out'}` }}: 
            {{ selectedProduct?.name }}
          </h3>
          <button @click="showStockModal = false" class="close-btn" aria-label="Close modal">
            <X :size="20" />
          </button>
        </div>
        <form @submit.prevent="handleStockMovement" class="modal-form">
          <div class="input-group">
            <label>Warehouse</label>
            <select v-model="movementData.warehouseId" required>
              <option value="" disabled>Select Warehouse</option>
              <option v-for="w in stock.warehouses" :key="w._id" :value="w._id">{{ w.name }}</option>
            </select>
          </div>
          <div class="input-group">
            <label>Quantity</label>
            <input v-model.number="movementData.quantity" type="number" min="1" required />
          </div>
          <div class="input-group">
            <label>Reason / Reference</label>
            <input
              v-model="movementData.reason"
              required
              placeholder="e.g. Restock from supplier"
            />
          </div>
          <div class="modal-footer">
            <button type="button" @click="showStockModal = false" class="btn btn-secondary">
              Cancel
            </button>
            <button
              type="submit"
              class="btn"
              :class="{
                'btn-primary': stockAction === 'IN',
                'btn-danger': stockAction === 'OUT',
                'btn-warning': stockAction === 'ADJUSTMENT'
              }"
            >
              Confirm {{ stockAction === 'ADJUSTMENT' ? 'Adjustment' : stockAction }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Product History Modal -->
    <div v-if="showHistoryModal" class="modal-overlay">
      <div class="modal card">
        <div class="modal-header">
          <div class="h-title">
            <History :size="20" />
            <h3>History: {{ selectedProduct?.name }}</h3>
          </div>
          <button @click="showHistoryModal = false" class="close-btn"><X :size="20" /></button>
        </div>
        
        <div class="history-content">
          <div v-if="isLoadingHistory" class="loading-state">
            <div class="spinner"></div>
            <p>Loading movement records...</p>
          </div>
          <div v-else-if="historyData.length === 0" class="empty-history">
            <History :size="48" />
            <p>No stock movements recorded for this product yet.</p>
          </div>
          <div v-else class="history-list">
            <div v-for="m in historyData" :key="m._id" class="history-item">
              <div class="m-type-icon" :class="m.type.toLowerCase()">
                <PlusCircle v-if="m.type === 'IN'" :size="14" />
                <MinusCircle v-else-if="m.type === 'OUT'" :size="14" />
                <AlertTriangle v-else :size="14" />
              </div>
              <div class="m-info">
                <div class="m-top">
                  <span class="m-type">{{ m.type }}</span>
                  <span class="m-qty" :class="m.type.toLowerCase()">
                    {{ m.type === 'OUT' ? '-' : '+' }}{{ m.quantity }}
                  </span>
                  <span class="m-date">{{ formatDateShort(m.timestamp) }}</span>
                </div>
                <div class="m-bottom">
                  <span class="m-reason">{{ m.reason }}</span>
                  <span class="m-user">by {{ m.userId?.name || 'System' }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <button @click="showHistoryModal = false" class="btn btn-secondary">Close</button>
        </div>
      </div>
    </div>

    <!-- Bulk Import Modal -->
    <BulkImportModal
      :isOpen="showImportModal"
      @close="showImportModal = false"
      @import="handleBulkImport"
    />
  </div>
</template>

<style scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
}
.subtitle {
  color: var(--text-muted);
  margin-top: 0.25rem;
}

.toolbar { padding: 1rem; display: flex; justify-content: space-between; align-items: center; gap: 1rem; margin-bottom: 2rem; }
.search-area { display: flex; gap: 1rem; flex: 1; }

.view-toggle { display: flex; background: var(--hover-color); padding: 0.25rem; border-radius: 10px; }
.toggle-btn { padding: 0.5rem; border-radius: 8px; color: var(--text-muted); transition: all 0.2s; background: transparent; border: none; cursor: pointer; }
.toggle-btn.active { background: white; color: var(--primary-color); box-shadow: 0 2px 8px rgba(0,0,0,0.05); }

.product-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem; }
.product-card { padding: 1.25rem; display: flex; flex-direction: column; gap: 1rem; transition: transform 0.2s; }
.product-card:hover { transform: translateY(-4px); }

.product-header { position: relative; }
.product-img { width: 100%; height: 160px; border-radius: 12px; background: var(--hover-color); display: flex; align-items: center; justify-content: center; color: var(--text-muted); overflow: hidden; border: 1px solid var(--border-color); }
.product-img img { width: 100%; height: 100%; object-fit: cover; }

.product-badges { position: absolute; top: 0.75rem; left: 0.75rem; display: flex; flex-direction: column; gap: 0.5rem; }
.category-badge { background: rgba(15, 23, 42, 0.8); color: white; padding: 0.25rem 0.65rem; border-radius: 8px; font-size: 0.65rem; font-weight: 700; backdrop-filter: blur(4px); }
.status-badge { padding: 0.25rem 0.65rem; border-radius: 8px; font-size: 0.65rem; font-weight: 700; color: white; }
.status-badge.critical { background: #ef4444; }
.status-badge.warning { background: #f59e0b; }

.stock-count.critical { color: #ef4444; }
.stock-count.warning { color: #f59e0b; }

.progress-fill.critical { background: #ef4444; }
.progress-fill.warning { background: #f59e0b; }
.progress-fill.overstock { background: #8b5cf6; }

.bar-fill.critical { background: #ef4444; }
.bar-fill.warning { background: #f59e0b; }
.bar-fill.overstock { background: #8b5cf6; }
.action-btn.edit:hover { background: #f3e8ff; color: #a855f7; border-color: #a855f7; }
.action-icon.edit:hover { background: #f3e8ff; color: #a855f7; border-color: #a855f7; }

/* History Modal Styles */
.h-title { display: flex; align-items: center; gap: 0.75rem; color: var(--primary-color); }
.h-title h3 { margin: 0; color: var(--text-color); font-size: 1.1rem; }

.history-content { max-height: 400px; overflow-y: auto; margin: 1rem 0; padding-right: 0.5rem; }

.history-item { 
  display: flex; gap: 1rem; padding: 1rem; border-radius: 12px; 
  background: var(--bg-color); border: 1px solid var(--border-color);
  margin-bottom: 0.75rem;
}

.m-type-icon { 
  width: 32px; height: 32px; border-radius: 50%; 
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.m-type-icon.in { background: var(--success-light); color: var(--success-color); }
.m-type-icon.out { background: var(--error-light); color: var(--error-color); }
.m-type-icon.adjustment { background: var(--warning-light); color: var(--warning-color); }

.m-info { flex: 1; display: flex; flex-direction: column; gap: 0.25rem; }
.m-top { display: flex; align-items: center; gap: 0.75rem; }
.m-type { font-size: 0.7rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; }
.m-qty { font-weight: 800; font-size: 0.9rem; }
.m-qty.in { color: var(--success-color); }
.m-qty.out { color: var(--error-color); }
.m-date { margin-left: auto; font-size: 0.75rem; color: var(--text-muted); font-weight: 600; }

.m-bottom { display: flex; justify-content: space-between; font-size: 0.8rem; }
.m-reason { color: var(--text-color); font-weight: 500; }
.m-user { color: var(--text-muted); font-style: italic; }

.loading-state, .empty-history { 
  display: flex; flex-direction: column; align-items: center; 
  justify-content: center; padding: 3rem; color: var(--text-muted); gap: 1rem;
}

.spinner { 
  width: 24px; height: 24px; border: 3px solid var(--border-color); 
  border-top-color: var(--primary-color); border-radius: 50%; 
  animation: spin 0.8s linear infinite; 
}
@keyframes spin { to { transform: rotate(360deg); } }

.search-wrapper {
  position: relative;
  flex: 1;
}

.search-icon {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted);
}

.search-wrapper input {
  padding-left: 3rem;
}

.filters {
  display: flex;
  gap: 1rem;
}
.filter-group {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: white;
  padding: 0 1rem;
  border: 1px solid var(--border-color);
  border-radius: var(--radius);
}

.filter-group select {
  border: none;
  padding: 0.75rem 0;
  width: auto;
  background: transparent;
}
.filter-group select:focus {
  box-shadow: none;
}

.table-card {
  padding: 0;
  overflow: hidden;
}

.p-info { display: flex; align-items: center; gap: 0.75rem; }
.p-img { width: 40px; height: 40px; border-radius: 10px; overflow: hidden; background: var(--hover-color); border: 1px solid var(--border-color); display: flex; align-items: center; justify-content: center; color: var(--text-muted); flex-shrink: 0; }
.p-img img { width: 100%; height: 100%; object-fit: cover; }
.p-text { display: flex; flex-direction: column; }
.p-name { font-weight: 700; color: var(--text-color); font-size: 0.95rem; margin: 0; }
.p-sku { font-size: 0.7rem; color: var(--text-muted); font-family: monospace; font-weight: 600; margin: 0; }

.stock-level {
  width: 140px;
}
.stock-count {
  font-size: 0.875rem;
  font-weight: 600;
  display: block;
  margin-bottom: 0.5rem;
}
.stock-count.low {
  color: var(--error-color);
}

.stock-bar {
  height: 6px;
  background: var(--hover-color);
  border-radius: 3px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  background: var(--primary-color);
  border-radius: 3px;
  transition: width 0.3s ease;
}

.stock-count.low + .stock-bar .bar-fill {
  background: var(--error-color);
}

.text-right {
  text-align: right;
}

.table-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}

.action-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  color: var(--text-muted);
}

.action-icon:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
}
.action-icon.in:hover {
  border-color: var(--success-color);
  color: var(--success-color);
  background: var(--success-light);
}
.action-icon.out:hover {
  border-color: var(--error-color);
  color: var(--error-color);
  background: var(--error-light);
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1.5rem;
}

.modal {
  width: 100%;
  max-width: 600px;
  padding: 2rem;
  animation: modalIn 0.3s ease-out;
}

.modal.mini {
  max-width: 440px;
}

@keyframes modalIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.close-btn {
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 8px;
}

.close-btn:hover {
  background: var(--hover-color);
  color: var(--text-color);
}

.modal-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
.modal-form input, .modal-form select, .modal-form textarea {
  color: white;
}
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.image-input-wrapper { display: flex; gap: 1rem; align-items: flex-start; }
.image-input-wrapper input { flex: 1; }
.image-preview-box { width: 44px; height: 44px; border-radius: 8px; overflow: hidden; border: 1px solid var(--border-color); flex-shrink: 0; background: var(--hover-color); }
.image-preview-box img { width: 100%; height: 100%; object-fit: cover; }

/* Upload Area Styles */
.upload-area {
  position: relative;
  height: 120px;
  border: 2px dashed var(--border-color);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
  background: var(--hover-color);
  overflow: hidden;
}

.upload-area:hover {
  border-color: var(--primary-color);
  background: var(--primary-light);
}

.file-input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
  z-index: 2;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-muted);
  font-size: 0.85rem;
  font-weight: 600;
}

.upload-preview {
  width: 100%;
  height: 100%;
  position: relative;
}

.upload-preview img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: #000;
}

.remove-img {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: rgba(239, 68, 68, 0.9);
  color: white;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 3;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1rem;
}

.btn-danger {
  background: var(--error-color);
  color: white;
}
.btn-danger:hover {
  background: #dc2626;
}
</style>
