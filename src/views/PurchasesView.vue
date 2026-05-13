<script setup>
import { ref, computed } from 'vue';
import { useStockStore } from '../stores/stock';
import { useUIStore } from '../stores/ui';
import { Package, Truck, Warehouse, Minus, Plus, ShoppingCart, Calendar } from 'lucide-vue-next';

const stock = useStockStore();
const ui = useUIStore();
const cart = ref([]);
const selectedSupplierId = ref('');
const selectedWarehouseId = ref('');
const expectedDate = ref(new Date().toISOString().split('T')[0]);

const toggleProduct = (product) => {
  const index = cart.value.findIndex(item => item.product === product._id);
  if (index > -1) {
    cart.value.splice(index, 1);
  } else {
    cart.value.push({
      product: product._id,
      name: product.name,
      price: product.costPrice || product.price, // Prefer cost price for restock
      quantity: 1
    });
  }
};

const updateQty = (productId, delta) => {
  const item = cart.value.find(i => i.product === productId);
  if (item) {
    item.quantity = Math.max(1, item.quantity + delta);
  }
};

const isSelected = (productId) => cart.value.some(i => i.product === productId);

const totalCost = computed(() => {
  return cart.value.reduce((sum, item) => sum + (item.price * item.quantity), 0);
});

const handlePurchase = async () => {
  if (!selectedSupplierId.value || !selectedWarehouseId.value || cart.value.length === 0) {
    ui.notify('Please select supplier, warehouse and products', 'warning');
    return;
  }
  try {
    await stock.createTransaction({
      type: 'PURCHASE',
      items: cart.value.map(i => ({ product: i.product, quantity: i.quantity, price: i.price })),
      entityId: selectedSupplierId.value,
      warehouseId: selectedWarehouseId.value,
      expectedDate: expectedDate.value,
      total: totalCost.value
    });
    cart.value = [];
    ui.notify('Stock arrival recorded successfully!', 'success');
  } catch (err) { 
    ui.notify(err.error || 'Failed to record arrival', 'error'); 
  }
};
</script>

<template>
  <div class="purchases-page">
    <header class="header">
      <div class="title-section">
        <h1>Procurement & Restocking</h1>
        <p class="subtitle">Record new stock arrivals and supplier purchases.</p>
      </div>
    </header>

    <div class="procurement-grid">
      <!-- 1. LEFT PANEL: PRODUCT PICKER -->
      <div class="products-section card glass">
        <div class="panel-header">
          <Package :size="20" />
          <h3>Available Inventory</h3>
        </div>
        
        <div class="product-picker">
          <div 
            v-for="p in stock.products" 
            :key="p._id" 
            @click="toggleProduct(p)" 
            class="product-card"
            :class="{ active: isSelected(p._id) }"
          >
            <div class="p-check">
              <div class="check-box"></div>
            </div>
            <div class="p-info">
              <span class="p-name">{{ p.name }}</span>
              <span class="p-sku">{{ p.sku }}</span>
            </div>
            <div class="p-price">${{ (p.costPrice || p.price).toFixed(2) }}</div>
          </div>
        </div>
      </div>

      <!-- 2. RIGHT PANEL: RESTOCK ORDER -->
      <div class="order-section">
        <div class="order-panel card glass">
          <div class="panel-header">
            <ShoppingCart :size="20" />
            <h3>Restock Order</h3>
          </div>

          <div class="form">
            <div class="config-row">
              <div class="input-group">
                <label><Truck :size="14" /> Supplier</label>
                <select v-model="selectedSupplierId">
                  <option value="" disabled>Select Supplier</option>
                  <option v-for="s in stock.suppliers" :key="s._id" :value="s._id">{{ s.name }}</option>
                </select>
              </div>
              <div class="input-group">
                <label><Warehouse :size="14" /> Destination</label>
                <select v-model="selectedWarehouseId">
                  <option value="" disabled>Select Warehouse</option>
                  <option v-for="w in stock.warehouses" :key="w._id" :value="w._id">{{ w.name }}</option>
                </select>
              </div>
            </div>

            <div class="input-group">
              <label><Calendar :size="14" /> Promised Arrival Date</label>
              <input type="date" v-model="expectedDate" class="date-input" />
            </div>

            <!-- SELECTED ITEMS LIST -->
            <div class="order-items">
              <div v-if="cart.length === 0" class="empty-cart">
                <p>No products selected for restocking.</p>
              </div>
              <div v-for="item in cart" :key="item.product" class="cart-item">
                <div class="item-main">
                  <span class="name">{{ item.name }}</span>
                  <span class="unit-price">${{ item.price.toFixed(2) }} / unit</span>
                </div>
                <div class="item-controls">
                  <div class="qty-btn-group">
                    <button @click.stop="updateQty(item.product, -1)"><Minus :size="12" /></button>
                    <span class="qty">{{ item.quantity }}</span>
                    <button @click.stop="updateQty(item.product, 1)"><Plus :size="12" /></button>
                  </div>
                  <span class="subtotal">${{ (item.price * item.quantity).toFixed(2) }}</span>
                </div>
              </div>
            </div>

            <!-- ORDER SUMMARY -->
            <div class="order-summary" v-if="cart.length > 0">
              <div class="summary-line">
                <span>Total Items</span>
                <span>{{ cart.length }}</span>
              </div>
              <div class="summary-line total">
                <span>Estimated Total</span>
                <span class="total-amount">${{ totalCost.toFixed(2) }}</span>
              </div>
            </div>

            <button 
              @click="handlePurchase" 
              class="btn-arrival" 
              :disabled="cart.length === 0"
            >
              Confirm Stock Arrival
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.purchases-page { animation: fadeIn 0.4s ease-out; }
.header { margin-bottom: 2rem; }
.header h1 { font-size: 2rem; font-weight: 800; letter-spacing: -0.02em; }
.subtitle { color: var(--text-muted); }

.procurement-grid { display: grid; grid-template-columns: 1fr 400px; gap: 2rem; align-items: start; }

.panel-header { display: flex; align-items: center; gap: 0.75rem; padding-bottom: 1rem; border-bottom: 1px solid var(--border-color); margin-bottom: 1rem; }
.panel-header h3 { font-size: 1.1rem; font-weight: 800; margin: 0; }

/* Product Card Picker */
.product-picker { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem; }
.product-card { 
  padding: 1rem; 
  background: var(--bg-color); 
  border: 1.5px solid var(--border-color); 
  border-radius: 16px; 
  cursor: pointer; 
  transition: all 0.2s; 
  display: flex; 
  align-items: center; 
  gap: 1rem;
}
.product-card:hover { border-color: var(--primary-color); transform: translateY(-2px); }
.product-card.active { border-color: var(--primary-color); background: rgba(var(--primary-rgb), 0.05); }

.check-box { width: 18px; height: 18px; border: 2px solid var(--border-color); border-radius: 5px; transition: all 0.2s; }
.product-card.active .check-box { background: var(--primary-color); border-color: var(--primary-color); position: relative; }
.product-card.active .check-box::after { content: '✓'; color: white; font-size: 10px; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); }

.p-info { flex: 1; display: flex; flex-direction: column; }
.p-name { font-weight: 700; font-size: 0.9rem; }
.p-sku { font-size: 0.65rem; color: var(--text-muted); }
.p-price { font-weight: 800; font-size: 0.95rem; color: var(--primary-color); }

/* Order Panel */
.form { display: flex; flex-direction: column; gap: 1.5rem; }
.config-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.input-group label { display: flex; align-items: center; gap: 0.5rem; font-size: 0.75rem; font-weight: 700; color: var(--text-muted); margin-bottom: 0.5rem; text-transform: uppercase; }
.input-group select { width: 100%; padding: 0.75rem; border-radius: 12px; background: var(--bg-color); border: 1.5px solid var(--border-color); color: var(--text-color); font-weight: 700; outline: none; }

.order-items { max-height: 300px; overflow-y: auto; padding-right: 0.5rem; }
.cart-item { 
  display: flex; 
  justify-content: space-between; 
  align-items: center; 
  padding: 0.85rem; 
  background: var(--bg-color); 
  border-radius: 12px; 
  border: 1px solid var(--border-color);
  margin-bottom: 0.5rem;
}
.item-main { display: flex; flex-direction: column; }
.item-main .name { font-weight: 800; font-size: 0.85rem; }
.item-main .unit-price { font-size: 0.65rem; color: var(--text-muted); }

.item-controls { display: flex; align-items: center; gap: 1rem; }
.qty-btn-group { display: flex; align-items: center; gap: 0.5rem; background: var(--hover-color); padding: 0.25rem; border-radius: 8px; }
.qty-btn-group button { width: 22px; height: 22px; border: none; background: white; border-radius: 4px; display: flex; align-items: center; justify-content: center; cursor: pointer; }
.qty-btn-group .qty { font-size: 0.85rem; font-weight: 800; min-width: 20px; text-align: center; }
.item-controls .subtotal { font-weight: 800; font-size: 0.9rem; min-width: 60px; text-align: right; }

.order-summary { padding: 1.25rem; background: rgba(var(--primary-rgb), 0.05); border-radius: 16px; border: 1px dashed var(--primary-color); display: flex; flex-direction: column; gap: 0.5rem; }
.summary-line { display: flex; justify-content: space-between; font-size: 0.85rem; font-weight: 700; color: var(--text-muted); }
.summary-line.total { border-top: 1.5px solid rgba(var(--primary-rgb), 0.1); padding-top: 0.75rem; margin-top: 0.25rem; color: var(--text-color); }
.total-amount { font-size: 1.25rem; font-weight: 900; color: var(--primary-color); }

.btn-arrival { 
  width: 100%; 
  padding: 1.15rem; 
  background: var(--primary-color); 
  color: white; 
  border: none; 
  border-radius: 16px; 
  font-weight: 900; 
  font-size: 1.1rem; 
  cursor: pointer; 
  transition: all 0.3s;
}
.btn-arrival:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 10px 20px rgba(var(--primary-rgb), 0.2); }
.btn-arrival:disabled { opacity: 0.4; cursor: not-allowed; }

.empty-cart { padding: 2rem; text-align: center; color: var(--text-muted); font-size: 0.85rem; }

@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
</style>
