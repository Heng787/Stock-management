<script setup>
import { ref, computed, watch } from 'vue';
import { useStockStore } from '../../stores/stock';
import { useUIStore } from '../../stores/ui';
import { X, Search, Package, ArrowDownLeft, ArrowUpRight, Loader2 } from 'lucide-vue-next';

const props = defineProps({
  isOpen: Boolean,
  type: {
    type: String,
    default: 'IN', // 'IN' or 'OUT'
    validator: (v) => ['IN', 'OUT'].includes(v)
  }
});

const emit = defineEmits(['close', 'success']);

const stock = useStockStore();
const ui = useUIStore();

const searchQuery = ref('');
const selectedProduct = ref(null);
const quantity = ref(1);
const warehouseId = ref('');
const reference = ref('');
const isSubmitting = ref(false);

const filteredProducts = computed(() => {
  if (!searchQuery.value) return [];
  const q = searchQuery.value.toLowerCase();
  return stock.products.filter(p => 
    p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
  ).slice(0, 5);
});

const selectProduct = (product) => {
  selectedProduct.value = product;
  searchQuery.value = '';
};

const handleSubmit = async () => {
  if (isSubmitting.value || !selectedProduct.value || quantity.value <= 0) return;
  
  isSubmitting.value = true;
  try {
    await stock.processMovement({
      productId: selectedProduct.value._id,
      type: props.type,
      quantity: quantity.value,
      warehouseId: warehouseId.value || undefined,
      reference: reference.value,
      timestamp: new Date()
    });
    
    ui.notify(`Successfully recorded ${props.type === 'IN' ? 'arrival' : 'dispatch'} of ${quantity.value} units`, 'success');
    emit('success');
    resetForm();
  } catch (err) {
    ui.notify(err.response?.data?.error || 'Failed to record movement', 'error');
  } finally {
    isSubmitting.value = false;
  }
};

const resetForm = () => {
  selectedProduct.value = null;
  quantity.value = 1;
  warehouseId.value = '';
  reference.value = '';
  searchQuery.value = '';
};

watch(() => props.isOpen, (val) => {
  if (!val) resetForm();
});
</script>

<template>
  <Transition name="modal">
    <div v-if="isOpen" class="modal-overlay" @click.self="emit('close')">
      <div class="modal card glass">
        <div class="modal-header">
          <div class="header-title">
            <div class="icon-box" :class="type.toLowerCase()">
              <component :is="type === 'IN' ? ArrowDownLeft : ArrowUpRight" :size="20" />
            </div>
            <div>
              <h3>Quick Stock {{ type === 'IN' ? 'In' : 'Out' }}</h3>
              <p>Record immediate stock movement</p>
            </div>
          </div>
          <button class="close-btn" @click="emit('close')">
            <X :size="20" />
          </button>
        </div>

        <form @submit.prevent="handleSubmit" class="modal-content">
          <!-- Product Search -->
          <div class="input-group">
            <label>Search Product</label>
            <div v-if="!selectedProduct" class="search-container">
              <Search class="search-icon" :size="18" />
              <input 
                v-model="searchQuery" 
                placeholder="Search by name or SKU..." 
                autoFocus
              />
              <div v-if="filteredProducts.length > 0" class="search-results card">
                <div 
                  v-for="p in filteredProducts" 
                  :key="p._id" 
                  class="result-item"
                  @click="selectProduct(p)"
                >
                  <div class="item-info">
                    <span class="name">{{ p.name }}</span>
                    <span class="sku">{{ p.sku }}</span>
                  </div>
                  <span class="stock">Current: {{ p.quantity }}</span>
                </div>
              </div>
            </div>
            <div v-else class="selected-product card">
              <Package :size="20" />
              <div class="info">
                <p class="name">{{ selectedProduct.name }}</p>
                <p class="sku">{{ selectedProduct.sku }}</p>
              </div>
              <button type="button" class="btn-text" @click="selectedProduct = null">Change</button>
            </div>
          </div>

          <div class="row">
            <div class="input-group">
              <label>Quantity</label>
              <input 
                v-model.number="quantity" 
                type="number" 
                min="1" 
                required 
                :max="type === 'OUT' && selectedProduct ? selectedProduct.quantity : undefined"
              />
              <p v-if="type === 'OUT' && selectedProduct" class="helper-text">
                Max available: {{ selectedProduct.quantity }}
              </p>
            </div>
            <div class="input-group">
              <label>Warehouse (Optional)</label>
              <select v-model="warehouseId">
                <option value="">System Default</option>
                <option v-for="w in stock.warehouses" :key="w._id" :value="w._id">
                  {{ w.name }}
                </option>
              </select>
            </div>
          </div>

          <div class="input-group">
            <label>Reference / Note</label>
            <input v-model="reference" placeholder="e.g. PO-1234 or Delivery Note" />
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="emit('close')">Cancel</button>
            <button 
              type="submit" 
              class="btn btn-primary" 
              :disabled="isSubmitting || !selectedProduct"
            >
              <Loader2 v-if="isSubmitting" class="spinner" :size="18" />
              <span v-else>Confirm {{ type === 'IN' ? 'Arrival' : 'Dispatch' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1.5rem;
}

.modal {
  width: 100%;
  max-width: 520px;
  border-radius: 24px;
  padding: 2.5rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  animation: modalScale 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes modalScale {
  from { transform: scale(0.9) translateY(20px); opacity: 0; }
  to { transform: scale(1) translateY(0); opacity: 1; }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2.5rem;
}

.header-title {
  display: flex;
  gap: 1.25rem;
  align-items: center;
}

.icon-box {
  width: 48px;
  height: 48px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.icon-box.in { background: #ecfdf5; color: #059669; }
.icon-box.out { background: #fef2f2; color: #ef4444; }

.header-title h3 { margin: 0; font-size: 1.25rem; font-weight: 800; }
.header-title p { margin: 0.25rem 0 0; font-size: 0.875rem; color: var(--text-muted); }

.close-btn {
  background: var(--hover-color);
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--text-muted);
  transition: all 0.2s;
}
.close-btn:hover { background: #fee2e2; color: #ef4444; }

.modal-content { display: grid; gap: 1.5rem; }

.row { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; }

.input-group label {
  display: block;
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--text-muted);
  margin-bottom: 0.75rem;
}

.input-group input, .input-group select {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 1rem center;
  width: 100%;
  padding: 0.875rem 1rem;
  border-radius: 12px;
  border: 1.5px solid var(--border-color);
  background: var(--surface-color);
  transition: all 0.2s;
  font-weight: 600;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 1rem center;
}

.input-group input:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 4px rgba(var(--primary-rgb), 0.1);
  outline: none;
}

.search-container { position: relative; }
.search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted);
  opacity: 0.5;
}
.search-container input { padding-left: 44px; }

.search-results {
  position: absolute;
  top: calc(100% + 0.5rem);
  left: 0;
  width: 100%;
  background: var(--bg-surface);
  z-index: 100;
  border-radius: 16px;
  overflow-y: auto;
  max-height: 280px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.3);
  border: 1px solid var(--border-color);
  backdrop-filter: blur(20px);
}

.result-item {
  padding: 1rem 1.25rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  transition: all 0.2s;
  border-bottom: 1px solid var(--border-color);
}
.result-item:last-child { border-bottom: none; }
.result-item:hover { background: var(--hover-color); }

.item-info .name { display: block; font-weight: 700; font-size: 0.95rem; color: var(--text-color); }
.item-info .sku { font-size: 0.75rem; color: var(--text-muted); }
.result-item .stock { font-size: 0.75rem; font-weight: 700; color: var(--primary-color); }

.selected-product {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: var(--primary-light);
  border: 1px solid var(--primary-color);
}
.selected-product .info { flex: 1; }
.selected-product .name { font-weight: 700; margin: 0; }
.selected-product .sku { font-size: 0.75rem; color: var(--text-muted); margin: 0; }

.helper-text { font-size: 0.75rem; color: var(--text-muted); margin-top: 0.5rem; font-weight: 500; }

.modal-footer {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 1rem;
  margin-top: 1rem;
}

.btn {
  padding: 0.875rem 1.5rem;
  border-radius: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.btn-primary { 
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); 
  color: white; 
  font-weight: 800;
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
}
.btn-primary:hover { transform: translateY(-2px); box-shadow: 0 10px 20px -5px rgba(var(--primary-rgb), 0.4); }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; box-shadow: none; }

.btn-secondary { background: var(--hover-color); color: var(--text-color); }

.spinner { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* Vue Transitions */
.modal-enter-active, .modal-leave-active { transition: opacity 0.3s; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
</style>
