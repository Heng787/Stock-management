<script setup>
import { computed } from 'vue';
import { ArrowUpRight, ArrowDownRight, Scale } from 'lucide-vue-next';

const props = defineProps({
  transactions: {
    type: Array,
    required: true
  }
});

const stats = computed(() => {
  const sales = props.transactions
    .filter(t => t.type === 'SALE')
    .reduce((sum, t) => sum + t.total, 0);
  
  const purchases = props.transactions
    .filter(t => t.type === 'PURCHASE')
    .reduce((sum, t) => sum + t.total, 0);
    
  return {
    sales,
    purchases,
    balance: sales - purchases
  };
});

const formatCurrency = (val) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(val);
};
</script>

<template>
  <div class="summary-cards">
    <div class="summary-card card glass">
      <div class="icon-box sale">
        <ArrowUpRight :size="20" />
      </div>
      <div class="info">
        <label>Total Sales</label>
        <h3>{{ formatCurrency(stats.sales) }}</h3>
      </div>
    </div>

    <div class="summary-card card glass">
      <div class="icon-box purchase">
        <ArrowDownRight :size="20" />
      </div>
      <div class="info">
        <label>Total Purchases</label>
        <h3>{{ formatCurrency(stats.purchases) }}</h3>
      </div>
    </div>

    <div class="summary-card card glass balance">
      <div class="icon-box balance">
        <Scale :size="20" />
      </div>
      <div class="info">
        <label>Net Balance</label>
        <h3 :class="{ 'negative': stats.balance < 0 }">
          {{ formatCurrency(stats.balance) }}
        </h3>
      </div>
    </div>
  </div>
</template>

<style scoped>
.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.5rem;
  margin-bottom: 0.5rem;
}

.summary-card {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  padding: 1.5rem;
  border-radius: 20px;
}

.icon-box {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-box.sale { background: #ecfdf5; color: #059669; }
.icon-box.purchase { background: #fff1f2; color: #e11d48; }
.icon-box.balance { background: #eff6ff; color: #2563eb; }

.info label {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.info h3 {
  margin: 0.25rem 0 0;
  font-size: 1.5rem;
  font-weight: 800;
}

.info h3.negative { color: #e11d48; }
</style>
