<script setup>
import { computed } from 'vue';
import { Doughnut } from 'vue-chartjs';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const props = defineProps({
  products: {
    type: Array,
    required: true
  }
});

const chartData = computed(() => {
  // Taking top 5 products (assuming they are sorted)
  const topProducts = props.products.slice(0, 5);
  
  return {
    labels: topProducts.map(p => p.name),
    datasets: [
      {
        data: topProducts.map(p => p.sold || p.totalSold || p.quantity || 0),
        backgroundColor: [
          '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'
        ],
        borderWidth: 0,
        hoverOffset: 4
      }
    ]
  };
});

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'right',
      labels: {
        usePointStyle: true,
        boxWidth: 8,
        padding: 20,
        font: {
          family: "'Inter', sans-serif",
          size: 12
        }
      }
    },
    tooltip: {
      callbacks: {
        label: (context) => ` ${context.label}: ${context.raw} units`
      }
    }
  },
  cutout: '70%'
};
</script>

<template>
  <div class="doughnut-container">
    <Doughnut v-if="products.length > 0" :data="chartData" :options="chartOptions" />
    <div v-else class="empty-chart">
      <p>No sales data available</p>
    </div>
  </div>
</template>

<style scoped>
.doughnut-container {
  position: relative;
  height: 250px;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-chart {
  color: var(--text-muted);
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}
</style>
