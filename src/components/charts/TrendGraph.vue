<script setup>
import { computed } from 'vue';
import { Line } from 'vue-chartjs';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler
);

const props = defineProps({
  data: {
    type: Array,
    required: true
  },
  labels: {
    type: Array,
    required: true
  },
  color: {
    type: String,
    default: '#3b82f6'
  }
});

const chartData = computed(() => {
  return {
    labels: props.labels,
    datasets: [
      {
        data: props.data,
        borderColor: props.color,
        backgroundColor: `${props.color}33`, // 20% opacity
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4,
        fill: true,
        tension: 0.4
      }
    ]
  };
});

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      mode: 'index',
      intersect: false,
      callbacks: {
        label: (context) => context.raw
      }
    }
  },
  scales: {
    x: { display: false },
    y: { display: false, min: 0 }
  },
  interaction: {
    mode: 'nearest',
    axis: 'x',
    intersect: false
  }
};
</script>

<template>
  <div class="trend-graph">
    <Line :data="chartData" :options="chartOptions" />
  </div>
</template>

<style scoped>
.trend-graph {
  height: 60px;
  width: 100%;
  margin-top: 10px;
}
</style>
