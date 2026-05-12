<script setup>
import { X, Truck, Mail, Phone, MapPin, Star, History, Package, ArrowUpRight } from 'lucide-vue-next';
import { computed } from 'vue';

const props = defineProps(['isOpen', 'supplier', 'transactions']);
const emit = defineEmits(['close']);

const supplierTransactions = computed(() => {
  if (!props.supplier || !props.transactions) return [];
  return props.transactions.filter(t => t.supplier?._id === props.supplier._id || t.supplier === props.supplier._id);
});

const totalSpent = computed(() => {
  return supplierTransactions.value.reduce((sum, t) => sum + t.total, 0);
});

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};
</script>

<template>
  <Transition name="drawer">
    <div v-if="isOpen" class="drawer-overlay" @click.self="$emit('close')">
      <div class="drawer-content card glass">
        <header class="drawer-header">
          <div class="header-left">
            <div class="avatar"><Truck :size="24" /></div>
            <div class="title-meta">
              <h2>{{ supplier?.name }}</h2>
              <span class="rating">
                <Star :size="14" class="filled" />
                {{ supplier?.rating ?? 5.0 }} Supplier Rating
              </span>
            </div>
          </div>
          <button class="close-btn" @click="$emit('close')"><X :size="24" /></button>
        </header>

        <div class="drawer-body" v-if="supplier">
          <!-- 1. CONTACT INFO -->
          <div class="info-grid">
            <div class="info-card">
              <label><Mail :size="14" /> Email</label>
              <span>{{ supplier.email || 'N/A' }}</span>
            </div>
            <div class="info-card">
              <label><Phone :size="14" /> Phone</label>
              <span>{{ supplier.phone || 'N/A' }}</span>
            </div>
            <div class="info-card wide">
              <label><MapPin :size="14" /> Business Address</label>
              <span>{{ supplier.address || 'No address provided' }}</span>
            </div>
          </div>

          <div class="divider"></div>

          <!-- 2. PROCUREMENT STATS -->
          <div class="stats-row">
            <div class="stat-box">
              <label>Total Procurement</label>
              <div class="value">${{ totalSpent.toFixed(2) }}</div>
            </div>
            <div class="stat-box">
              <label>Orders Fulfilled</label>
              <div class="value">{{ supplierTransactions.length }}</div>
            </div>
          </div>

          <!-- 3. RECENT SHIPMENTS -->
          <div class="section">
            <div class="section-title">
              <History :size="18" />
              <h3>Recent Shipments</h3>
            </div>
            <div class="transaction-list" v-if="supplierTransactions.length > 0">
              <div v-for="t in supplierTransactions.slice(0, 5)" :key="t._id" class="t-row">
                <div class="t-info">
                  <span class="t-date">{{ formatDate(t.createdAt) }}</span>
                  <span class="t-ref">#{{ t._id.slice(-6).toUpperCase() }}</span>
                </div>
                <div class="t-amount">
                  <span class="price">-${{ t.total.toFixed(2) }}</span>
                  <ArrowUpRight :size="14" />
                </div>
              </div>
            </div>
            <div v-else class="empty-mini">
              <Package :size="32" />
              <p>No procurement history found.</p>
            </div>
          </div>
        </div>

        <footer class="drawer-footer">
          <button class="btn btn-secondary flex-1" @click="$emit('close')">Close Profile</button>
          <button class="btn btn-primary flex-1">Generate Report</button>
        </footer>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.drawer-overlay { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.4); backdrop-filter: blur(4px); z-index: 1000; display: flex; justify-content: flex-end; }
.drawer-content { width: 100%; max-width: 500px; height: 100%; background: var(--bg-surface); display: flex; flex-direction: column; box-shadow: -20px 0 40px rgba(0, 0, 0, 0.2); }

.drawer-header { padding: 2rem; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color); }
.header-left { display: flex; align-items: center; gap: 1.25rem; }
.avatar { width: 50px; height: 50px; border-radius: 14px; background: var(--primary-light); color: var(--primary-color); display: flex; align-items: center; justify-content: center; }
.title-meta h2 { margin: 0; font-size: 1.35rem; font-weight: 900; }
.rating { display: flex; align-items: center; gap: 0.4rem; font-size: 0.75rem; font-weight: 700; color: #f59e0b; margin-top: 0.25rem; }
.star-icon.filled { fill: currentColor; }

.close-btn { background: none; border: none; color: var(--text-muted); cursor: pointer; }

.drawer-body { flex: 1; overflow-y: auto; padding: 2rem; display: flex; flex-direction: column; gap: 2rem; }

.info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.info-card { padding: 1.25rem; background: var(--bg-color); border-radius: 16px; border: 1px solid var(--border-color); }
.info-card.wide { grid-column: span 2; }
.info-card label { display: flex; align-items: center; gap: 0.5rem; font-size: 0.65rem; font-weight: 800; text-transform: uppercase; color: var(--text-muted); margin-bottom: 0.5rem; }
.info-card span { font-size: 0.9rem; font-weight: 700; color: var(--text-color); }

.divider { height: 1px; background: var(--border-color); }

.stats-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
.stat-box { text-align: center; padding: 1.5rem; background: rgba(var(--primary-rgb), 0.05); border-radius: 20px; border: 1.5px dashed var(--primary-color); }
.stat-box label { font-size: 0.7rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; margin-bottom: 0.5rem; display: block; }
.stat-box .value { font-size: 1.5rem; font-weight: 900; color: var(--text-color); }

.section-title { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.25rem; }
.section-title h3 { font-size: 1rem; font-weight: 800; margin: 0; }

.transaction-list { display: flex; flex-direction: column; gap: 0.75rem; }
.t-row { display: flex; justify-content: space-between; align-items: center; padding: 1rem; background: var(--bg-color); border-radius: 12px; border: 1px solid var(--border-color); cursor: pointer; transition: all 0.2s; }
.t-row:hover { border-color: var(--primary-color); transform: translateX(5px); }
.t-info { display: flex; flex-direction: column; gap: 0.2rem; }
.t-date { font-weight: 700; font-size: 0.85rem; }
.t-ref { font-size: 0.7rem; font-family: monospace; color: var(--text-muted); }
.t-amount { display: flex; align-items: center; gap: 0.5rem; font-weight: 800; color: var(--error-color); }

.empty-mini { text-align: center; padding: 2rem; color: var(--text-muted); opacity: 0.5; }

.drawer-footer { padding: 1.5rem 2rem; display: flex; gap: 1rem; border-top: 1px solid var(--border-color); }
.flex-1 { flex: 1; }

.drawer-enter-active, .drawer-leave-active { transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
.drawer-enter-from { opacity: 0; }
.drawer-enter-from .drawer-content { transform: translateX(100%); }
.drawer-leave-to { opacity: 0; }
.drawer-leave-to .drawer-content { transform: translateX(100%); }
</style>
