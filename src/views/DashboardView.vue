<script setup>
import { computed, ref, onMounted } from 'vue';
import { useStockStore } from '../stores/stock';
import { formatPrice, getCurrentRateText } from '../utils/format';
import { fetchTrends, fetchTopProducts } from '../api/analyticsApi.js';
import { fetchActivity } from '../api/activityApi.js';
import TrendGraph from '../components/charts/TrendGraph.vue';
import TopSellingChart from '../components/charts/TopSellingChart.vue';
import ActivityFeed from '../components/ActivityFeed.vue';
import { 
  Package, 
  AlertTriangle, 
  TrendingUp, 
  DollarSign,
  ArrowUpRight,
  ArrowDownLeft,
  Download
} from 'lucide-vue-next';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import StockMovementModal from '../components/modals/StockMovementModal.vue';

const stock = useStockStore();

// Trend chart data — populated from API
const salesTrend = ref([0, 0, 0, 0, 0, 0, 0]);
const stockTrend = ref([0, 0, 0, 0, 0, 0, 0]);
const trendLabels = ref(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);

// Top selling products — populated from API
const topProducts = ref([]);

// Activity feed — populated from API
const recentActivities = ref([]);

const movementModal = ref({
  isOpen: false,
  type: 'IN'
});

const openMovementModal = (type) => {
  movementModal.value = {
    isOpen: true,
    type
  };
};

onMounted(async () => {
  try {
    const [trendsRes, topRes, activityRes] = await Promise.all([
      fetchTrends(),
      fetchTopProducts(),
      fetchActivity(5)
    ]);
    salesTrend.value = trendsRes.data.salesTrend;
    stockTrend.value = trendsRes.data.stockTrend;
    trendLabels.value = trendsRes.data.labels;
    topProducts.value = topRes.data;
    recentActivities.value = activityRes.data;
  } catch (err) {
    console.error('[Dashboard] Failed to load analytics data:', err);
  }
});

const stats = computed(() => [
  { 
    label: 'Total Products', 
    value: stock.products.length, 
    icon: Package, 
    color: 'blue',
    trend: null
  },
  { 
    label: 'Low Stock Items', 
    value: stock.products.filter(p => p.quantity <= p.minStockLevel).length, 
    icon: AlertTriangle, 
    color: 'orange',
    trend: null
  },
  { 
    label: 'Stock Value', 
    value: formatPrice(stock.products.reduce((acc, p) => acc + (p.price * p.quantity), 0)), 
    icon: DollarSign, 
    color: 'green',
    trend: stockTrend.value
  },
  { 
    label: 'Weekly Sales', 
    value: formatPrice(salesTrend.value.reduce((a, b) => a + b, 0)),
    icon: TrendingUp, 
    color: 'purple',
    trend: salesTrend.value
  }
]);

const lowStockItems = computed(() => 
  stock.products
    .filter(p => p.quantity <= p.minStockLevel)
    .slice(0, 5)
);

const getStatusClass = (quantity, min) => {
  if (quantity === 0) return 'badge-error';
  if (quantity <= min) return 'badge-warning';
  return 'badge-success';
};

const handleExport = () => {
  try {
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.text('StockFlow Dashboard Report', 14, 22);
    
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);
    
    // Dashboard Stats
    doc.autoTable({
      startY: 40,
      head: [['Metric', 'Value']],
      body: stats.value.map(s => [s.label, String(s.value)]),
      theme: 'striped',
      headStyles: { fillColor: [99, 102, 241] }
    });
    
    // Guard: fallback Y in case autoTable didn't attach
    const afterStatsY = doc.lastAutoTable?.finalY ?? 80;

    // Low Stock Alerts
    doc.text('Low Stock Alerts', 14, afterStatsY + 15);
    const lowStockData = lowStockItems.value.map(item => [
      item.name, 
      item.sku, 
      `${item.quantity} / ${item.minStockLevel}`
    ]);
    
    doc.autoTable({
      startY: afterStatsY + 20,
      head: [['Product Name', 'SKU', 'Stock Level']],
      body: lowStockData.length ? lowStockData : [['No low stock items', '', '']],
      theme: 'grid',
      headStyles: { fillColor: [245, 158, 11] }
    });
    
    doc.save('stockflow-report.pdf');
  } catch (err) {
    console.error('[Export] Failed to generate PDF:', err);
    alert('Failed to generate report. Please try again.');
  }
};
</script>

<template>
  <div class="dashboard">
    <header class="header">
      <div>
        <h1>Dashboard Overview</h1>
        <p class="subtitle">Welcome back! Here's what's happening today. <span class="rate-badge">{{ getCurrentRateText() }}</span></p>
      </div>
      <button class="btn btn-primary export-btn" @click="handleExport">
        <Download :size="18" />
        Download Report
      </button>
    </header>

    <div class="stats-grid">
      <div v-for="stat in stats" :key="stat.label" class="card stat-card">
        <div class="stat-top">
          <div class="stat-icon" :class="stat.color">
            <component :is="stat.icon" :size="24" />
          </div>
          <div class="stat-info">
            <p class="stat-label">{{ stat.label }}</p>
            <h2 class="stat-value">{{ stat.value }}</h2>
          </div>
        </div>
        <div v-if="stat.trend" class="stat-trend-container">
          <TrendGraph 
            :data="stat.trend" 
            :labels="['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']" 
            :color="stat.color === 'purple' ? '#a855f7' : '#22c55e'" 
          />
        </div>
      </div>
    </div>

    <div class="dashboard-grid">
      <!-- Main Column -->
      <div class="main-column">
        <div class="card main-card">
          <div class="card-header">
            <h3>Low Stock Alerts</h3>
            <router-link to="/inventory" class="view-all">View All</router-link>
          </div>
          <div v-if="lowStockItems.length === 0" class="empty-state">
            <!-- Modern SVG illustration -->
            <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" class="empty-svg">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              <path d="m9 12 2 2 4-4"/>
            </svg>
            <p>Inventory is healthy! No low stock items.</p>
            <button class="btn btn-outline" @click="$router.push('/inventory')">Browse Inventory</button>
          </div>
          <table v-else>
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Current Stock</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in lowStockItems" :key="item._id">
                <td>
                  <div class="product-cell">
                    <p class="p-name">{{ item.name }}</p>
                    <p class="p-sku">{{ item.sku }}</p>
                  </div>
                </td>
                <td>{{ item.categoryId?.name }}</td>
                <td>{{ item.quantity }} / {{ item.minStockLevel }}</td>
                <td>
                  <span class="badge" :class="getStatusClass(item.quantity, item.minStockLevel)">
                    {{ item.quantity === 0 ? 'Out of Stock' : 'Low Stock' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="charts-row">
          <div class="card top-selling-card">
            <div class="card-header">
              <h3>Top Selling Products</h3>
            </div>
            <TopSellingChart :products="topProducts" />
          </div>
        </div>
      </div>

      <!-- Side Column -->
      <div class="side-column">
        <div class="card side-card">
          <h3>Quick Actions</h3>
          <div class="actions-list">
            <button class="action-btn" @click="openMovementModal('IN')">
              <div class="btn-icon in"><ArrowDownLeft :size="20" /></div>
              <span>Stock In</span>
            </button>
            <button class="action-btn" @click="openMovementModal('OUT')">
              <div class="btn-icon out"><ArrowUpRight :size="20" /></div>
              <span>Stock Out</span>
            </button>
            <button class="action-btn" @click="$router.push('/inventory')">
              <div class="btn-icon add"><Package :size="20" /></div>
              <span>New Product</span>
            </button>
          </div>
        </div>

        <StockMovementModal 
          :is-open="movementModal.isOpen"
          :type="movementModal.type"
          @close="movementModal.isOpen = false"
          @success="movementModal.isOpen = false"
        />

        <div class="card side-card activity-card">
          <div class="card-header">
            <h3>Recent Activity</h3>
          </div>
          <ActivityFeed :activities="recentActivities" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.header { 
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem; 
}
.subtitle { color: var(--text-muted); margin-top: 0.25rem; display: flex; align-items: center; gap: 0.75rem; }
.rate-badge {
  background: var(--primary-light);
  color: var(--primary-color);
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 700;
}

.export-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  display: flex;
  flex-direction: column;
  gap: 0;
  padding: 1.25rem;
}

.stat-top {
  display: flex;
  align-items: center;
  gap: 1.25rem;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-icon.blue { background: #eff6ff; color: #3b82f6; }
.stat-icon.orange { background: #fff7ed; color: #f97316; }
.stat-icon.green { background: #f0fdf4; color: #22c55e; }
.stat-icon.purple { background: #faf5ff; color: #a855f7; }

.stat-label { color: var(--text-muted); font-size: 0.875rem; margin-bottom: 0.25rem; }
.stat-value { font-size: 1.5rem; font-weight: 700; margin: 0; }

.stat-trend-container {
  margin-top: 0.5rem;
  height: 60px;
  width: 100%;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 1.5rem;
}

.main-column {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.side-column {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.charts-row {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.card-header h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
}

.view-all { color: var(--primary-color); text-decoration: none; font-size: 0.875rem; font-weight: 600; }

.product-cell .p-name { font-weight: 600; margin: 0; }
.product-cell .p-sku { font-size: 0.75rem; color: var(--text-muted); margin: 0; }

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  text-align: center;
  color: var(--text-muted);
  gap: 1rem;
}

.empty-svg {
  color: #10b981;
  opacity: 0.8;
  margin-bottom: 0.5rem;
}

.actions-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border: 1px solid var(--border-color);
  background: transparent;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 600;
  color: var(--text-color);
}

.action-btn:hover {
  background: var(--hover-color);
  border-color: var(--primary-color);
}

.btn-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-icon.in { background: var(--success-light); color: var(--success-color); }
.btn-icon.out { background: var(--error-light); color: var(--error-color); }
.btn-icon.add { background: var(--primary-light); color: var(--primary-color); }

.activity-card {
  flex: 1;
}

@media (max-width: 1024px) {
  .dashboard-grid { grid-template-columns: 1fr; }
  .header { flex-direction: column; align-items: flex-start; gap: 1rem; }
}
</style>
