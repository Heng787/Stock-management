<script setup>
import { ref, onMounted, computed, watch } from 'vue';
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
  Filter,
  ArrowRight,
  XCircle
} from 'lucide-vue-next';
import { exportToCSV } from '../utils/export';
import { formatCurrency } from '../utils/format';

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
const startDate = ref('');
const endDate = ref('');

const clearDates = () => {
  startDate.value = '';
  endDate.value = '';
};

const totalValuation = computed(() => {
  return valuationData.value.reduce((sum, item) => sum + item.totalValue, 0);
});

const fetchData = async () => {
  loading.value = true;
  try {
    const params = {};
    if (startDate.value) params.startDate = startDate.value;
    if (endDate.value) params.endDate = endDate.value;

    const [valRes, statsRes, topRes, trendRes] = await Promise.all([
      client.get('/analytics/valuation'),
      client.get('/analytics/stats', { params }),
      client.get('/analytics/top-products', { params }),
      client.get('/analytics/trends', { params })
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
watch([startDate, endDate], fetchData);

const exportReport = () => {
  const data = [
    { Section: 'EXECUTIVE SUMMARY', Metric: 'Total Sales', Value: formatCurrency(statsData.value.totalSales) },
    { Section: 'EXECUTIVE SUMMARY', Metric: 'Inventory Value', Value: formatCurrency(totalValuation.value) },
    { Section: 'EXECUTIVE SUMMARY', Metric: 'Avg Order Value', Value: formatCurrency(statsData.value.averageOrderValue) },
    ...valuationData.value.map(v => ({
      Section: 'VALUATION BY WAREHOUSE',
      Metric: v.warehouse,
      Value: formatCurrency(v.totalValue),
      Items: v.itemCount
    })),
    ...topProducts.value.map(p => ({
      Section: 'TOP SELLING PRODUCTS',
      Metric: p.name,
      Value: formatCurrency(p.revenue),
      Sold: p.sold
    }))
  ];
  ui.notify('Preparing report...', 'info');
  exportToCSV(data, 'business_intelligence_report');
  ui.notify('Report downloaded successfully', 'success');
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
        <div class="date-range-picker glass">
          <div class="range-field" @click="$refs.startInput.showPicker()">
            <Calendar :size="14" />
            <input ref="startInput" type="date" v-model="startDate" title="Start Date" />
          </div>
          <ArrowRight :size="14" class="range-arrow" />
          <div class="range-field" @click="$refs.endInput.showPicker()">
            <input ref="endInput" type="date" v-model="endDate" title="End Date" />
          </div>
          <button v-if="startDate || endDate" class="clear-date-btn" @click="clearDates" title="Clear Filters">
            <XCircle :size="16" />
          </button>
        </div>
        <button class="btn btn-primary" @click="exportReport">
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

.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
.header-actions { display: flex; gap: 1rem; align-items: center; flex-wrap: wrap; justify-content: flex-end; }
.title-section h1 { font-size: 2.25rem; font-weight: 800; letter-spacing: -0.03em; margin: 0; }
.subtitle { color: var(--text-muted); margin-top: 0.25rem; font-size: 1rem; }

.date-range-picker { 
  display: flex; 
  align-items: center; 
  gap: 0.35rem; 
  padding: 0.35rem 0.6rem; 
  border-radius: 12px; 
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border-color); 
  transition: all 0.2s ease;
}

.date-range-picker:hover {
  border-color: var(--primary-color);
}

.range-field { 
  display: flex; 
  align-items: center; 
  gap: 0.35rem; 
  position: relative; 
  cursor: pointer;
  padding: 0.15rem 0.4rem;
  border-radius: 6px;
}
.range-field:hover { background: rgba(255, 255, 255, 0.05); }

.range-field input { 
  background: transparent; 
  border: none; 
  color: var(--text-color); 
  font-family: inherit; 
  font-weight: 600; 
  font-size: 0.8rem; 
  outline: none; 
  width: 110px;
  cursor: pointer;
  height: 28px;
}

.clear-date-btn {
  background: none;
  border: none;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0.15rem;
  border-radius: 50%;
  transition: all 0.2s;
}
.clear-date-btn:hover { color: var(--error-color); background: rgba(239, 68, 68, 0.1); }

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
