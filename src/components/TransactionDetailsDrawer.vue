<script setup>
import { X, Calendar, User, Package, DollarSign, Tag, ShoppingCart, TrendingUp, Printer, FileText } from 'lucide-vue-next';

const props = defineProps(['isOpen', 'transaction']);
const emit = defineEmits(['close']);

const getStatusColor = (type) => {
  return type === 'SALE' ? '#10b981' : '#ef4444';
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};
</script>

<template>
  <Transition name="drawer">
    <div v-if="isOpen" class="drawer-overlay" @click.self="$emit('close')">
      <div class="drawer-content card glass">
        <header class="drawer-header">
          <div class="header-left">
            <span class="type-badge" :style="{ background: getStatusColor(transaction?.type) + '15', color: getStatusColor(transaction?.type) }">
              {{ transaction?.type }}
            </span>
            <h2>Transaction Details</h2>
          </div>
          <button class="close-btn" @click="$emit('close')"><X :size="24" /></button>
        </header>

        <div class="drawer-body" v-if="transaction">
          <!-- 1. TOP STATS -->
          <div class="meta-section">
            <div class="meta-item">
              <Calendar :size="16" />
              <div class="meta-info">
                <label>Date & Time</label>
                <span>{{ formatDate(transaction.createdAt) }}</span>
              </div>
            </div>
            <div class="meta-item">
              <FileText :size="16" />
              <div class="meta-info">
                <label>Reference ID</label>
                <span class="mono">#{{ transaction._id.toUpperCase() }}</span>
              </div>
            </div>
          </div>

          <div class="divider"></div>

          <!-- 2. ENTITY INFO -->
          <div class="section">
            <div class="section-title">
              <User :size="18" />
              <h3>{{ transaction.type === 'SALE' ? 'Customer' : 'Supplier' }} Information</h3>
            </div>
            <div class="entity-card">
              <div class="avatar">{{ (transaction.customer?.name || transaction.supplier?.name || 'W')[0] }}</div>
              <div class="entity-details">
                <p class="name">{{ transaction.customer?.name || transaction.supplier?.name || 'Walk-in Customer' }}</p>
                <p class="sub">{{ transaction.customer?.email || transaction.supplier?.contact || 'Standard Account' }}</p>
              </div>
            </div>
          </div>

          <!-- 3. ITEMS LIST -->
          <div class="section">
            <div class="section-title">
              <Package :size="18" />
              <h3>Order Items</h3>
            </div>
            <div class="items-list">
              <div v-for="item in transaction.items" :key="item.product" class="item-row">
                <div class="item-main">
                  <span class="item-name">{{ item.name }}</span>
                  <span class="item-qty">{{ item.quantity }} x ${{ item.price.toFixed(2) }}</span>
                </div>
                <span class="item-total">${{ (item.quantity * item.price).toFixed(2) }}</span>
              </div>
            </div>
          </div>

          <!-- 4. FINANCIAL SUMMARY -->
          <div class="summary-section card">
            <div class="summary-row">
              <span>Subtotal</span>
              <span>${{ (transaction.total - (transaction.tax || 0) + (transaction.discount || 0)).toFixed(2) }}</span>
            </div>
            <div class="summary-row" v-if="transaction.discount > 0">
              <span>Discount</span>
              <span class="discount">-${{ transaction.discount.toFixed(2) }}</span>
            </div>
            <div class="summary-row">
              <span>Tax (10%)</span>
              <span>${{ (transaction.tax || 0).toFixed(2) }}</span>
            </div>
            <div class="summary-row total">
              <span>Grand Total</span>
              <span :style="{ color: getStatusColor(transaction.type) }">
                {{ transaction.type === 'SALE' ? '+' : '-' }}${{ transaction.total.toFixed(2) }}
              </span>
            </div>
            <div class="summary-row payment">
              <span>Payment Method</span>
              <span class="method">{{ transaction.paymentMethod || 'CASH' }}</span>
            </div>
          </div>

          <div v-if="transaction.notes" class="notes-section">
            <label>Notes</label>
            <p>{{ transaction.notes }}</p>
          </div>
        </div>

        <footer class="drawer-footer">
          <button class="btn btn-secondary flex-1">
            <Printer :size="18" />
            <span>Print Invoice</span>
          </button>
          <button class="btn btn-primary flex-1" @click="$emit('close')">
            Close
          </button>
        </footer>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.drawer-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  z-index: 1000;
  display: flex;
  justify-content: flex-end;
}

.drawer-content {
  width: 100%;
  max-width: 500px;
  height: 100%;
  background: var(--bg-surface);
  display: flex;
  flex-direction: column;
  box-shadow: -20px 0 40px rgba(0, 0, 0, 0.2);
}

.drawer-header {
  padding: 1.5rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--border-color);
}

.header-left { display: flex; align-items: center; gap: 1rem; }
.header-left h2 { font-size: 1.25rem; font-weight: 800; margin: 0; }
.type-badge { font-size: 0.65rem; font-weight: 900; padding: 0.25rem 0.65rem; border-radius: 6px; letter-spacing: 0.05em; }

.close-btn { background: none; border: none; color: var(--text-muted); cursor: pointer; transition: color 0.2s; }
.close-btn:hover { color: var(--text-color); }

.drawer-body { flex: 1; overflow-y: auto; padding: 2rem; display: flex; flex-direction: column; gap: 2rem; }

.meta-section { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.meta-item { display: flex; align-items: flex-start; gap: 0.75rem; color: var(--text-muted); }
.meta-info label { display: block; font-size: 0.65rem; font-weight: 800; text-transform: uppercase; margin-bottom: 0.25rem; }
.meta-info span { font-size: 0.85rem; font-weight: 700; color: var(--text-color); }
.mono { font-family: 'JetBrains Mono', monospace; font-size: 0.75rem !important; }

.divider { height: 1px; background: var(--border-color); }

.section-title { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.25rem; color: var(--primary-color); }
.section-title h3 { font-size: 0.9rem; font-weight: 800; margin: 0; color: var(--text-color); }

.entity-card { display: flex; align-items: center; gap: 1rem; padding: 1.25rem; background: var(--bg-color); border-radius: 16px; border: 1px solid var(--border-color); }
.avatar { width: 40px; height: 40px; border-radius: 12px; background: var(--primary-color); color: white; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 1.1rem; }
.entity-details .name { font-weight: 800; font-size: 0.95rem; margin: 0; }
.entity-details .sub { font-size: 0.75rem; color: var(--text-muted); margin: 0.2rem 0 0; }

.items-list { display: flex; flex-direction: column; gap: 0.75rem; }
.item-row { display: flex; justify-content: space-between; align-items: center; padding: 1rem; background: var(--bg-color); border-radius: 12px; border: 1px solid var(--border-color); }
.item-main { display: flex; flex-direction: column; gap: 0.2rem; }
.item-name { font-weight: 700; font-size: 0.85rem; }
.item-qty { font-size: 0.75rem; color: var(--text-muted); font-weight: 600; }
.item-total { font-weight: 800; font-size: 0.9rem; }

.summary-section { padding: 1.5rem; background: var(--bg-color); border-radius: 20px; display: flex; flex-direction: column; gap: 0.75rem; }
.summary-row { display: flex; justify-content: space-between; font-size: 0.85rem; font-weight: 700; color: var(--text-muted); }
.summary-row .discount { color: var(--error-color); }
.summary-row.total { border-top: 2px solid var(--border-color); padding-top: 1rem; margin-top: 0.5rem; font-size: 1.25rem; font-weight: 900; color: var(--text-color); }
.summary-row.payment { margin-top: 0.5rem; font-size: 0.75rem; }
.method { background: var(--hover-color); padding: 2px 8px; border-radius: 6px; font-size: 0.65rem; letter-spacing: 0.05em; }

.notes-section label { display: block; font-size: 0.75rem; font-weight: 800; color: var(--text-muted); margin-bottom: 0.5rem; text-transform: uppercase; }
.notes-section p { font-size: 0.85rem; line-height: 1.6; color: var(--text-color); padding: 1rem; background: var(--hover-color); border-radius: 12px; }

.drawer-footer { padding: 1.5rem 2rem; display: flex; gap: 1rem; border-top: 1px solid var(--border-color); }
.flex-1 { flex: 1; }

/* Transition */
.drawer-enter-active, .drawer-leave-active { transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
.drawer-enter-active .drawer-content, .drawer-leave-active .drawer-content { transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1); }

.drawer-enter-from { opacity: 0; }
.drawer-enter-from .drawer-content { transform: translateX(100%); }
.drawer-leave-to { opacity: 0; }
.drawer-leave-to .drawer-content { transform: translateX(100%); }
</style>
