<script setup>
import { ref } from 'vue';
import { Plus, Minus, Package, Info, CheckCircle2, ShoppingCart, AlertTriangle } from 'lucide-vue-next';

const props = defineProps(['products', 'warehouseId']);
const emit = defineEmits(['add']);

// Local qty state for each product card
const localQtys = ref({});
const feedback = ref({}); // For "Click to Add" feedback

const getStock = (product) => {
  if (!props.warehouseId) return product.quantity;
  const entry = product.warehouseStock?.find(ws => ws.warehouse === props.warehouseId);
  return entry ? entry.quantity : 0;
};

const handleAdd = (product) => {
  const qty = localQtys.value[product._id] || 1;
  const available = getStock(product);
  
  if (available < qty) return;
  
  emit('add', product, qty);
  
  // Visual Confirmation Logic (Requirement #1)
  feedback.value[product._id] = true;
  setTimeout(() => {
    feedback.value[product._id] = false;
  }, 1000);

  localQtys.value[product._id] = 1; // Reset
};

const updateLocalQty = (productId, delta, max) => {
  const current = localQtys.value[productId] || 1;
  const next = current + delta;
  if (next >= 1 && next <= max) {
    localQtys.value[productId] = next;
  }
};
</script>

<template>
  <div class="product-grid">
    <div 
      v-for="p in products" 
      :key="p._id" 
      class="pos-card card"
      :class="{ 
        'out-of-stock': getStock(p) <= 0,
        'has-feedback': feedback[p._id]
      }"
    >
      <div class="card-body">
        <div class="p-header">
          <span class="sku">{{ p.sku }}</span>
          <h4 class="name">{{ p.name }}</h4>
          <p v-if="p.description" class="desc">{{ p.description }}</p>
        </div>
        
        <div class="p-stats">
          <div class="price">${{ p.price.toFixed(2) }}</div>
          <div class="stock" :class="{ 'low': getStock(p) < (p.minStockLevel || 10) }">
            <Package :size="12" />
            <span>{{ getStock(p) }} {{ p.unit || 'pcs' }}</span>
          </div>
        </div>

        <!-- Low Stock Warning Badge -->
        <div v-if="getStock(p) > 0 && getStock(p) < (p.minStockLevel || 10)" class="low-stock-badge">
          <AlertTriangle :size="10" />
          <span>Low Stock</span>
        </div>
      </div>

      <div class="card-actions" v-if="getStock(p) > 0">
        <div class="qty-selector">
          <button @click.stop="updateLocalQty(p._id, -1, getStock(p))"><Minus :size="14" /></button>
          <span>{{ localQtys[p._id] || 1 }}</span>
          <button @click.stop="updateLocalQty(p._id, 1, getStock(p))"><Plus :size="14" /></button>
        </div>
        <button class="add-btn" @click.stop="handleAdd(p)" title="Add to Cart">
          <CheckCircle2 v-if="feedback[p._id]" :size="20" />
          <ShoppingCart v-else :size="20" />
        </button>
      </div>
      
      <div v-else class="unavailable-overlay">
        <Info :size="20" />
        <span>Unavailable</span>
      </div>

      <!-- Fly Animation Placeholder/Ghost -->
      <div v-if="feedback[p._id]" class="fly-item">
        +{{ localQtys[p._id] || 1 }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1.25rem;
  padding: 0.5rem 0.5rem 2rem 0.25rem;
}

.pos-card {
  height: 180px;
  display: flex;
  flex-direction: column;
  padding: 1.25rem;
  position: relative;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1.5px solid var(--border-color);
  background: var(--bg-surface);
  border-radius: 20px;
}

.pos-card:hover:not(.out-of-stock) {
  transform: translateY(-5px);
  border-color: var(--primary-color);
  box-shadow: 0 15px 30px -10px rgba(0,0,0,0.2);
}

.has-feedback {
  border-color: #10b981 !important;
  box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.1);
}

.out-of-stock { opacity: 0.5; filter: grayscale(0.8); cursor: not-allowed; }

.sku { font-size: 0.65rem; color: var(--text-muted); font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; }
.name { margin: 0.25rem 0 0.15rem; font-size: 1rem; line-height: 1.2; font-weight: 900; color: var(--text-color); }
.desc { font-size: 0.7rem; color: var(--text-muted); margin: 0 0 0.75rem; line-height: 1.3; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }

.p-stats { display: flex; justify-content: space-between; align-items: center; margin-top: auto; }
.price { font-size: 1.15rem; font-weight: 900; color: var(--primary-color); }
.stock { display: flex; align-items: center; gap: 0.25rem; font-size: 0.75rem; color: var(--text-muted); font-weight: 700; }
.stock.low { color: var(--error-color); }

.low-stock-badge {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: var(--error-light);
  color: var(--error-color);
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.6rem;
  font-weight: 800;
  text-transform: uppercase;
  animation: pulse-border 2s infinite;
}

@keyframes pulse-border {
  0% { box-shadow: 0 0 0 0 rgba(var(--error-rgb), 0.4); }
  70% { box-shadow: 0 0 0 6px rgba(var(--error-rgb), 0); }
  100% { box-shadow: 0 0 0 0 rgba(var(--error-rgb), 0); }
}

.card-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
}

.qty-selector {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--bg-color);
  border-radius: 12px;
  padding: 0.35rem;
  border: 1px solid var(--border-color);
}

.qty-selector button {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  background: var(--bg-surface);
  color: var(--primary-color);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.qty-selector button:hover { 
  background: var(--primary-color); 
  color: white; 
  transform: scale(1.1); 
}

.qty-selector span { font-weight: 800; font-size: 1rem; color: var(--text-color); min-width: 24px; text-align: center; }

.add-btn {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  border: none;
  background: var(--primary-color);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.add-btn:hover { transform: rotate(90deg) scale(1.1); box-shadow: 0 10px 20px rgba(var(--primary-rgb), 0.4); }

.unavailable-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.03);
  backdrop-filter: blur(4px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  font-weight: 900;
  color: var(--text-muted);
  border-radius: inherit;
}

.fly-item {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: #10b981;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 99px;
  font-weight: 900;
  z-index: 10;
  animation: flyToCart 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

@keyframes flyToCart {
  0% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
  100% { opacity: 0; transform: translate(300px, -200px) scale(0.5); }
}
</style>
