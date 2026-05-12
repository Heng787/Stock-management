<script setup>
import { ref, computed, onMounted, watch, onUnmounted } from 'vue';
import { useStockStore } from '../stores/stock';
import { useUIStore } from '../stores/ui';
import { useRoute } from 'vue-router';
import { PackageSearch } from 'lucide-vue-next';

// Sub-components
import CategoryTabs from '../components/sales/CategoryTabs.vue';
import ProductGrid from '../components/sales/ProductGrid.vue';
import CartSidebar from '../components/sales/CartSidebar.vue';

const stock = useStockStore();
const ui = useUIStore();
const route = useRoute();

const cart = ref([]);
const selectedWarehouseId = ref('');
const selectedCustomerId = ref(route.query.customerId || '');
const selectedCategoryId = ref('all');
const searchQuery = ref('');
const searchInput = ref(null);

// Scanner Support: Global keydown listener to autofocus search
const handleGlobalKeydown = (e) => {
  // 1. Don't steal focus if user is already typing in an input/select
  const isInput = ['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName);
  if (isInput) return;

  // 2. Only focus on alphanumeric keys (scanners usually dump SKU)
  if (e.key.length === 1 && /[a-zA-Z0-9]/.test(e.key)) {
    searchInput.value?.focus();
  }
};

onMounted(async () => {
  await stock.fetchAll();
  window.addEventListener('keydown', handleGlobalKeydown);
  // Initial autofocus for scanners
  searchInput.value?.focus();
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalKeydown);
});

const filteredProducts = computed(() => {
  let products = stock.products;

  // 1. Category Filter
  if (selectedCategoryId.value !== 'all') {
    products = products.filter(p => p.categoryId?._id === selectedCategoryId.value || p.categoryId === selectedCategoryId.value);
  }

  // 2. Search Filter
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    // BUG-010: Ensure null/undefined safety on name/sku
    products = products.filter(p => (p.name || '').toLowerCase().includes(q) || (p.sku || '').toLowerCase().includes(q));
  }

  return products;
});

// Cart Actions
const addToCart = (product, qty = 1) => {
  // BUG-008: Check stock before adding to cart
  const entry = product.warehouseStock?.find(ws => ws.warehouse === selectedWarehouseId.value);
  const available = entry ? entry.quantity : 0;
  
  const existing = cart.value.find(item => item.product === product._id);
  const currentQty = existing ? existing.quantity : 0;
  
  if (currentQty + qty > available) {
    ui.notify(`Cannot add: Only ${available} in stock`, 'error');
    return;
  }

  if (existing) {
    existing.quantity += qty;
  } else {
    cart.value.push({
      product: product._id,
      name: product.name,
      price: product.price,
      quantity: qty,
      sku: product.sku
    });
  }
  ui.notify(`${product.name} added to cart`, 'success');
};

const clearCart = () => cart.value = [];

// BUG-009: Watch warehouse change to clear invalid cart items
watch(selectedWarehouseId, () => {
  cart.value = [];
});
</script>

<template>
  <div class="sales-page">
    <div class="pos-layout">
      <!-- Catalog Section -->
      <section class="catalog-section">
        <header class="pos-header">
          <div class="header-main">
            <div class="title-area">
              <h1>Select Products</h1>
              <p class="subtitle">Quick-select or scan items for checkout</p>
            </div>
            <div class="search-bar glass">
              <input 
                ref="searchInput"
                v-model="searchQuery" 
                placeholder="Scan barcode or type SKU..." 
                autofocus
              />
            </div>
          </div>
          
          <CategoryTabs 
            :categories="stock.categories" 
            v-model="selectedCategoryId" 
          />
        </header>

        <ProductGrid 
          v-if="filteredProducts.length > 0"
          :products="filteredProducts"
          :warehouseId="selectedWarehouseId"
          @add="addToCart"
        />
        <div v-else class="empty-category-state card glass">
          <div class="empty-icon-wrapper">
            <PackageSearch :size="64" />
          </div>
          <h3>No Products Found</h3>
          <p>We couldn't find any items in this category. Try a different search or filter.</p>
          <button @click="selectedCategoryId = 'all'; searchQuery = ''" class="btn btn-secondary">Clear All Filters</button>
        </div>
      </section>

      <!-- Cart Section -->
      <CartSidebar 
        v-model:cart="cart"
        v-model:warehouseId="selectedWarehouseId"
        v-model:customerId="selectedCustomerId"
        :warehouses="stock.warehouses"
        :customers="stock.customers"
        @clear="clearCart"
      />
    </div>
  </div>
</template>

<style scoped>
.sales-page {
  height: calc(100vh - 120px);
  padding: 1rem 1.5rem;
  overflow: hidden;
}

.pos-layout {
  display: grid;
  grid-template-columns: 1fr 420px;
  gap: 2rem;
  height: 100%;
  overflow: hidden; /* Constrain main grid */
}

.catalog-section { 
  display: flex; 
  flex-direction: column; 
  gap: 1.5rem; 
  height: 100%;
  overflow-y: auto; /* Enable scroll on the whole section */
  padding-right: 1rem;
}

/* Custom Scrollbar for the catalog */
.catalog-section::-webkit-scrollbar { width: 6px; }
.catalog-section::-webkit-scrollbar-track { background: transparent; }
.catalog-section::-webkit-scrollbar-thumb { background: var(--border-color); border-radius: 10px; }
.catalog-section::-webkit-scrollbar-thumb:hover { background: var(--primary-color); }

.pos-header {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.header-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title-area h1 { margin: 0; font-size: 1.75rem; font-weight: 800; letter-spacing: -0.02em; }
.subtitle { margin: 0.25rem 0 0; color: var(--text-muted); font-size: 0.9rem; }

.search-bar {
  width: 380px;
  padding: 0.875rem 1.5rem;
  border-radius: 16px;
}

.search-bar input {
  width: 100%;
  background: transparent;
  border: none;
  outline: none;
  color: var(--text-color);
  font-weight: 600;
  font-size: 0.95rem;
}

.empty-category-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 6rem 2rem;
  text-align: center;
  gap: 1.5rem;
  border: 1.5px dashed var(--border-color);
}

.empty-icon-wrapper {
  color: var(--text-muted);
  opacity: 0.3;
  animation: bounce 2s infinite ease-in-out;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.empty-category-state h3 { font-size: 1.5rem; font-weight: 800; margin: 0; }
.empty-category-state p { max-width: 400px; color: var(--text-muted); line-height: 1.6; margin: 0; }

@media (max-width: 1200px) {
  .pos-layout { grid-template-columns: 1fr; overflow-y: auto; }
  .sales-page { height: auto; overflow: visible; }
}
</style>
