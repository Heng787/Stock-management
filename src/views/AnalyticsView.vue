<script setup>
import { ref, onMounted, computed } from 'vue';
import { useUIStore } from '../stores/ui';
import client from '../api/client';
import { 
  TrendingUp, 
  DollarSign, 
  Package, 
  Warehouse, 
  ArrowUpRight, 
  ArrowDownRight,
  Download,
  Calendar,
  Filter
} from 'lucide-vue-next';

const ui = useUIStore();
const loading = ref(true);
const valuationData = ref([]);
const statsData = ref({
  totalSales: 0,
  orderCount: 0,
  averageOrderValue: 0,
  growth: 0
});
const topProducts = ref([]);
const salesTrends = ref([]);

const totalValuation = computed(() => {
  return valuationData.value.reduce((sum, item) => sum + item.totalValue, 0);
});

const fetchData = async () => {
  loading.value = true;
  try {
    const [valRes, statsRes, topRes, trendRes] = await Promise.all([
      client.get('/analytics/valuation'),
      client.get('/analytics/stats'),
      client.get('/analytics/top-products'),
      client.get('/analytics/trends')
    ]);

    valuationData.value = valRes.data;
    statsData.value = statsRes.data;
    topProducts.value = topRes.data;
    salesTrends.value = trendRes.data;
  } catch (err) {
    console.error('Failed to fetch analytics:', err);
    ui.notify('Failed to load analytics data', 'error');
  } finally {
    loading.value = false;
  }
};

onMounted(fetchData);

const formatCurrency = (val) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(val);
};
</script>

<template>
  <div class="analytics-page">
    <header class="header">
      <div class="title-section">
        <h1>Business Intelligence</h1>
        <p class="subtitle">Detailed performance metrics and inventory valuation.</p>
      </div>
      <div class="header-actions">
        <div class="date-picker glass">
          <Calendar :size="16" />
          <span>Last 30 Days</span>
        </div>
        <button class="btn btn-primary">
          <Download :size="18" />
          <span>Export Report</span>
        </button>
      </div>
    </header>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Analyzing system data...</p>
    </div>

    <template v-else>
      <!-- Quick Stats -->
      <div class="stats-grid">
        <div class="stat-card card glass">
          <div class="stat-icon" style="background: #ecfdf5; color: #059669;">
            <DollarSign :size="24" />
          </div>
          <div class="stat-info">
            <label>Total Sales</label>
            <h3>{{ formatCurrency(statsData.totalSales) }}</h3>
            <span class="trend" :class="statsData.growth >= 0 ? 'up' : 'down'">
              <component :is="statsData.growth >= 0 ? ArrowUpRight : ArrowDownRight" :size="14" />
              {{ Math.abs(statsData.growth) }}% vs last month
            </span>
          </div>
        </div>

        <div class="stat-card card glass">
          <div class="stat-icon" style="background: #eff6ff; color: #2563eb;">
            <Package :size="24" />
          </div>
          <div class="stat-info">
            <label>Inventory Value</label>
            <h3>{{ formatCurrency(totalValuation) }}</h3>
            <span class="trend">Across {{ valuationData.length }} warehouses</span>
          </div>
        </div>

        <div class="stat-card card glass">
          <div class="stat-icon" style="background: #fef3c7; color: #d97706;">
            <TrendingUp :size="24" />
          </div>
          <div class="stat-info">
            <label>Avg. Order Value</label>
            <h3>{{ formatCurrency(statsData.averageOrderValue) }}</h3>
            <span class="trend up">
              <ArrowUpRight :size="14" />
              12% increase
            </span>
          </div>
        </div>
      </div>

      <div class="main-grid">
        <!-- Valuation by Warehouse -->
        <div class="chart-card card glass">
          <div class="card-header">
            <h3>Valuation by Warehouse</h3>
            <Filter :size="16" />
          </div>
          <div class="valuation-list">
            <div v-for="item in valuationData" :key="item.warehouse" class="val-item">
              <div class="val-top">
                <div class="warehouse-name">
                  <Warehouse :size="16" />
                  <span>{{ item.warehouse }}</span>
                </div>
                <span class="val-amount">{{ formatCurrency(item.totalValue) }}</span>
              </div>
              <div class="progress-bar">
                <div 
                  class="progress-fill" 
                  :style="{ width: (item.totalValue / totalValuation * 100) + '%' }"
                ></div>
              </div>
              <p class="item-count">{{ item.itemCount }} unique products</p>
            </div>
          </div>
        </div>

        <!-- Top Selling Products -->
        <div class="chart-card card glass">
          <div class="card-header">
            <h3>Top Selling Products</h3>
            <TrendingUp :size="16" />
          </div>
          <div class="product-list">
            <div v-for="(prod, index) in topProducts" :key="prod._id" class="prod-item">
              <span class="rank">{{ index + 1 }}</span>
              <div class="prod-info">
                <p class="prod-name">{{ prod.name }}</p>
                <p class="prod-meta">{{ prod.category }}</p>
              </div>
              <div class="prod-stats">
                <span class="sold">{{ prod.totalSold }} sold</span>
                <span class="revenue">{{ formatCurrency(prod.revenue) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.analytics-page { display: flex; flex-direction: column; gap: 2.5rem; animation: fadeIn 0.4s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

.header { display: flex; justify-content: space-between; align-items: flex-end; }
.title-section h1 { font-size: 2.25rem; font-weight: 800; letter-spacing: -0.03em; }
.subtitle { color: var(--text-muted); margin-top: 0.5rem; font-size: 1rem; }

.header-actions { display: flex; gap: 1rem; }
.date-picker { display: flex; align-items: center; gap: 0.75rem; padding: 0 1.25rem; border-radius: 12px; font-size: 0.85rem; font-weight: 700; color: var(--text-muted); cursor: pointer; }

.stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; }
.stat-card { padding: 1.5rem; display: flex; align-items: center; gap: 1.5rem; border-radius: 20px; transition: transform 0.3s; }
.stat-card:hover { transform: translateY(-5px); }

.stat-icon { width: 56px; height: 56px; border-radius: 16px; display: flex; align-items: center; justify-content: center; }
.stat-info label { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-muted); }
.stat-info h3 { font-size: 1.5rem; font-weight: 800; margin: 0.25rem 0; }
.trend { font-size: 0.75rem; font-weight: 600; color: var(--text-muted); display: flex; align-items: center; gap: 0.25rem; }
.trend.up { color: #059669; }
.trend.down { color: #ef4444; }

.main-grid { display: grid; grid-template-columns: 1fr 1.2fr; gap: 2rem; }
.chart-card { padding: 1.75rem; border-radius: 24px; }
.card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
.card-header h3 { font-size: 1.1rem; font-weight: 800; }

.valuation-list { display: flex; flex-direction: column; gap: 1.75rem; }
.val-item { display: flex; flex-direction: column; gap: 0.75rem; }
.val-top { display: flex; justify-content: space-between; align-items: center; }
.warehouse-name { display: flex; align-items: center; gap: 0.6rem; font-weight: 700; font-size: 0.9rem; }
.val-amount { font-weight: 800; color: var(--primary-color); }

.progress-bar { height: 8px; background: var(--hover-color); border-radius: 4px; overflow: hidden; }
.progress-fill { height: 100%; background: linear-gradient(90deg, var(--primary-color), #818cf8); border-radius: 4px; }
.item-count { font-size: 0.75rem; color: var(--text-muted); font-weight: 500; }

.product-list { display: flex; flex-direction: column; gap: 1.25rem; }
.prod-item { display: flex; align-items: center; gap: 1.25rem; padding: 1rem; border-radius: 16px; transition: background 0.2s; }
.prod-item:hover { background: var(--hover-color); }
.rank { width: 28px; height: 28px; background: var(--primary-light); color: var(--primary-color); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 800; }
.prod-info { flex: 1; min-width: 0; }
.prod-name { font-weight: 700; font-size: 0.95rem; margin-bottom: 0.2rem; }
.prod-meta { font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600; }
.prod-stats { text-align: right; }
.sold { display: block; font-size: 0.75rem; font-weight: 700; color: var(--text-muted); }
.revenue { font-weight: 800; color: var(--primary-color); font-size: 1rem; }

.loading-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 10rem 0; gap: 1.5rem; color: var(--text-muted); }
.spinner { width: 48px; height: 48px; border: 4px solid var(--border-color); border-top-color: var(--primary-color); border-radius: 50%; animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 1200px) {
  .stats-grid { grid-template-columns: 1fr; }
  .main-grid { grid-template-columns: 1fr; }
}
</style>
