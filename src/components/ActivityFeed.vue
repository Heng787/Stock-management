<script setup>
import { 
  PackagePlus, 
  PackageMinus, 
  Edit3, 
  AlertCircle,
  Truck
} from 'lucide-vue-next';

defineProps({
  activities: {
    type: Array,
    required: true
  }
});

const getIcon = (type) => {
  switch (type) {
    case 'STOCK_IN': return PackagePlus;
    case 'STOCK_OUT': return PackageMinus;
    case 'UPDATE': return Edit3;
    case 'PURCHASE': return Truck;
    default: return AlertCircle;
  }
};

const getIconColor = (type) => {
  switch (type) {
    case 'STOCK_IN': return 'text-success';
    case 'STOCK_OUT': return 'text-error';
    case 'UPDATE': return 'text-blue';
    case 'PURCHASE': return 'text-purple';
    default: return 'text-gray';
  }
};

const getIconBackground = (type) => {
  switch (type) {
    case 'STOCK_IN': return 'bg-success-light';
    case 'STOCK_OUT': return 'bg-error-light';
    case 'UPDATE': return 'bg-blue-light';
    case 'PURCHASE': return 'bg-purple-light';
    default: return 'bg-gray-light';
  }
};

const formatTime = (dateStr) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.round(diffMs / 60000);
  
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.round(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.round(diffHours / 24)}d ago`;
};
</script>

<template>
  <div class="activity-feed">
    <div v-if="activities.length === 0" class="empty-state">
      <p>No recent activity</p>
    </div>
    <ul v-else class="feed-list">
      <li v-for="(activity, index) in activities" :key="activity.id || index" class="feed-item">
        <div class="feed-icon" :class="getIconBackground(activity.type)">
          <component :is="getIcon(activity.type)" :size="16" :class="getIconColor(activity.type)" />
        </div>
        <div class="feed-content">
          <p class="feed-text">
            <span class="user-name">{{ activity.user }}</span> {{ activity.action }}
            <span class="target">{{ activity.target }}</span>
          </p>
          <span class="feed-time">{{ formatTime(activity.timestamp) }}</span>
        </div>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.activity-feed {
  padding: 0.5rem 0;
}

.empty-state {
  text-align: center;
  color: var(--text-muted);
  font-size: 0.875rem;
  padding: 2rem 0;
}

.feed-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.feed-item {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
}

.feed-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.bg-success-light { background: #dcfce7; }
.bg-error-light { background: #fee2e2; }
.bg-blue-light { background: #dbeafe; }
.bg-purple-light { background: #f3e8ff; }
.bg-gray-light { background: #f3f4f6; }

.text-success { color: #16a34a; }
.text-error { color: #dc2626; }
.text-blue { color: #2563eb; }
.text-purple { color: #9333ea; }
.text-gray { color: #6b7280; }

.feed-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.feed-text {
  margin: 0;
  font-size: 0.875rem;
  color: var(--text-color);
  line-height: 1.4;
}

.user-name {
  font-weight: 600;
  color: var(--text-color);
}

.target {
  font-weight: 600;
  color: var(--primary-color);
}

.feed-time {
  font-size: 0.75rem;
  color: var(--text-muted);
}
</style>
