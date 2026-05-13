<script setup>
import { ref, computed, onMounted } from 'vue';
import { useStockStore } from '../stores/stock';
import { useUIStore } from '../stores/ui';
import { 
  Plus, Pencil, Mail, Phone, Search, 
  LayoutGrid, List, MessageSquare, PlusCircle, 
  PhoneCall, UserPlus
} from 'lucide-vue-next';

import { useRoute } from 'vue-router';

const stock = useStockStore();
const ui = useUIStore();
const route = useRoute();

// View & Filter State
const viewMode = ref(localStorage.getItem('customerViewMode') || 'card');
const searchQuery = ref(route.query.search || '');
const locationFilter = ref('All');
const isSubmitting = ref(false);

const setViewMode = (mode) => {
  viewMode.value = mode;
  localStorage.setItem('customerViewMode', mode);
};

onMounted(() => {
  stock.fetchAll();
});

const isModalOpen = ref(false);
const editingCustomer = ref(null);

const customerForm = ref({
  name: '',
  email: '',
  phone: '',
  address: ''
});

// Enriched Customer Data with Metrics
const enrichedCustomers = computed(() => {
  return stock.customers.map(customer => {
    const total = customer.totalSpent || 0;
    const count = customer.orderCount || 0;
    const aov = count > 0 ? total / count : 0;
    
    let tier = 'New';
    if (total > 1000 || count > 10) tier = 'VIP';
    else if (total > 200 || count > 3) tier = 'Regular';

    return {
      ...customer,
      aov,
      tier
    };
  });
});

const filteredCustomers = computed(() => {
  return enrichedCustomers.value.filter(c => {
    const matchesSearch = 
      c.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      c.phone.includes(searchQuery.value);
    
    const matchesLocation = locationFilter.value === 'All' || c.address?.includes(locationFilter.value);
    
    return matchesSearch && matchesLocation;
  });
});

const uniqueLocations = computed(() => {
  const locs = new Set(stock.customers.map(c => {
    if (!c.address) return null;
    // Simple city extraction: take the last part of address if comma exists
    return c.address.includes(',') ? c.address.split(',').pop().trim() : c.address.trim();
  }).filter(Boolean));
  return ['All', ...Array.from(locs)];
});

const openModal = (customer = null) => {
  if (customer) {
    editingCustomer.value = customer._id;
    customerForm.value = { ...customer };
  } else {
    editingCustomer.value = null;
    customerForm.value = { name: '', email: '', phone: '', address: '' };
  }
  isModalOpen.value = true;
};

const handleSubmit = async () => {
  if (isSubmitting.value) return;
  isSubmitting.value = true;
  try {
    if (editingCustomer.value) {
      await stock.updateCustomer(editingCustomer.value, customerForm.value);
      ui.notify('Customer updated', 'success');
    } else {
      await stock.addCustomer(customerForm.value);
      ui.notify('Customer added', 'success');
    }
    isModalOpen.value = false;
  } catch (err) {
    ui.notify(err.error || 'Failed to save customer', 'error');
  }
};

const formatDate = (date) => {
  if (!date) return 'Never';
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const getTierColor = (tier) => {
  switch (tier) {
    case 'VIP': return '#8b5cf6';
    case 'Regular': return '#3b82f6';
    default: return '#6b7280';
  }
};
</script>

<template>
  <div class="customers-page">
    <header class="header">
      <div class="title-section">
        <h1>Customer Directory</h1>
        <p class="subtitle">Analyze spending patterns and manage client communication.</p>
      </div>
      <button @click="openModal()" class="btn btn-primary">
        <Plus :size="18" />
        <span>Add Customer</span>
      </button>
    </header>

    <!-- Toolbar -->
    <div class="toolbar card glass">
      <div class="search-area">
        <div class="search-input">
          <Search :size="18" />
          <input v-model="searchQuery" placeholder="Search by name, email or phone..." />
        </div>
        <div class="filter-select">
          <Filter :size="16" />
          <select v-model="locationFilter">
            <option v-for="loc in uniqueLocations" :key="loc" :value="loc">{{ loc }}</option>
          </select>
        </div>
      </div>
      
      <div class="view-toggle">
        <button 
          @click="setViewMode('card')" 
          :class="{ active: viewMode === 'card' }"
          class="toggle-btn"
        >
          <LayoutGrid :size="18" />
        </button>
        <button 
          @click="setViewMode('table')" 
          :class="{ active: viewMode === 'table' }"
          class="toggle-btn"
        >
          <List :size="18" />
        </button>
      </div>
    </div>

    <!-- Main Content -->
    <div v-if="filteredCustomers.length > 0">
      <!-- Card View -->
      <div v-if="viewMode === 'card'" class="customer-grid">
        <div v-for="customer in filteredCustomers" :key="customer._id" class="card customer-card">
          <div class="card-header">
            <div class="avatar-group">
              <div class="avatar">{{ customer.name[0] }}</div>
              <div class="tier-badge" :style="{ backgroundColor: getTierColor(customer.tier) + '20', color: getTierColor(customer.tier) }">
                {{ customer.tier }}
              </div>
            </div>
            <div class="quick-actions">
              <button @click="openModal(customer)" class="action-btn" title="Edit Profile"><Pencil :size="14" /></button>
              <router-link :to="{ name: 'sales', query: { customerId: customer._id } }" class="action-btn primary" title="Quick Sale">
                <PlusCircle :size="14" />
              </router-link>
            </div>
          </div>

          <div class="main-info">
            <h3 class="customer-name">{{ customer.name }}</h3>
            <p class="last-order">Last order: {{ formatDate(customer.lastOrderDate) }}</p>
          </div>

          <div class="metrics-row">
            <div class="metric">
              <span class="label">Total Spent</span>
              <span class="value">${{ customer.totalSpent?.toLocaleString() || '0' }}</span>
            </div>
            <div class="metric">
              <span class="label">AOV</span>
              <span class="value">${{ customer.aov?.toFixed(0) }}</span>
            </div>
            <div class="metric">
              <span class="label">Orders</span>
              <span class="value">{{ customer.orderCount }}</span>
            </div>
          </div>

          <div class="contact-links">
            <a :href="'mailto:' + customer.email" class="contact-btn">
              <Mail :size="14" />
              <span>Email</span>
            </a>
            <a :href="'tel:' + customer.phone" class="contact-btn">
              <PhoneCall :size="14" />
              <span>Call</span>
            </a>
            <a v-if="customer.phone" 
               :href="'https://wa.me/' + (customer.phone.replace(/[^0-9]/g, '').startsWith('0') ? '855' + customer.phone.replace(/[^0-9]/g, '').substring(1) : customer.phone.replace(/[^0-9]/g, ''))" 
               target="_blank" class="contact-btn wa">
              <MessageSquare :size="14" />
              <span>WA</span>
            </a>
          </div>
        </div>
      </div>

      <!-- Table View -->
      <div v-else class="card table-card overflow-x-auto">
        <table class="data-table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Tier</th>
              <th>Total Spent</th>
              <th>AOV</th>
              <th>Orders</th>
              <th>Last Order</th>
              <th>Contact</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="customer in filteredCustomers" :key="customer._id">
              <td>
                <div class="name-cell">
                  <div class="small-avatar">{{ customer.name[0] }}</div>
                  <span>{{ customer.name }}</span>
                </div>
              </td>
              <td>
                <span class="tier-pill" :style="{ backgroundColor: getTierColor(customer.tier) + '20', color: getTierColor(customer.tier) }">
                  {{ customer.tier }}
                </span>
              </td>
              <td class="font-bold">${{ customer.totalSpent?.toLocaleString() }}</td>
              <td>${{ customer.aov?.toFixed(0) }}</td>
              <td>{{ customer.orderCount }}</td>
              <td>{{ formatDate(customer.lastOrderDate) }}</td>
              <td>
                <div class="table-actions">
                  <a :href="'tel:' + customer.phone" class="icon-link"><Phone :size="14" /></a>
                  <a v-if="customer.phone" 
                     :href="'https://wa.me/' + (customer.phone.replace(/[^0-9]/g, '').startsWith('0') ? '855' + customer.phone.replace(/[^0-9]/g, '').substring(1) : customer.phone.replace(/[^0-9]/g, ''))" 
                     class="icon-link wa"><MessageSquare :size="14" /></a>
                </div>
              </td>
              <td>
                <div class="table-actions">
                  <button @click="openModal(customer)" class="btn-text">Edit</button>
                  <router-link :to="{ name: 'sales', query: { customerId: customer._id } }" class="btn-text primary">Sale</router-link>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="empty-state card glass">
      <div class="empty-icon"><UserPlus :size="48" /></div>
      <h3>No Customers Found</h3>
      <p>Try adjusting your search or add a new customer to your directory.</p>
      <button @click="openModal()" class="btn btn-primary">Add Your First Customer</button>
    </div>

    <!-- Modal Overlay -->
    <div v-if="isModalOpen" class="modal-overlay">
      <div class="modal card">
        <div class="modal-header">
          <h3>{{ editingCustomer ? 'Edit Profile' : 'New Customer' }}</h3>
          <button @click="isModalOpen = false" class="btn-icon"><X :size="20" /></button>
        </div>
        <form @submit.prevent="handleSubmit" class="form">
          <div class="input-row">
            <div class="input-group">
              <label>Full Name</label>
              <input v-model="customerForm.name" required placeholder="Heng Sreyroth" />
            </div>
            <div class="input-group">
              <label>Gmail Address</label>
              <input v-model="customerForm.email" type="email" required placeholder="heng@gmail.com" />
            </div>
          </div>
          <div class="input-group">
            <label>Phone Number</label>
            <input v-model="customerForm.phone" type="tel" placeholder="+855 12 345 678" />
          </div>
          <div class="input-group">
            <label>Address / Location</label>
            <textarea v-model="customerForm.address" rows="3" placeholder="Street 123, Battambang"></textarea>
          </div>
          <div class="modal-footer">
            <button type="button" @click="isModalOpen = false" class="btn btn-secondary">Cancel</button>
            <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
              {{ editingCustomer ? 'Update Profile' : 'Create Customer' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.customers-page { display: flex; flex-direction: column; gap: 1.5rem; animation: fadeIn 0.3s ease-out; }

.header { display: flex; justify-content: space-between; align-items: flex-end; }
.title-section h1 { font-size: 2rem; font-weight: 800; letter-spacing: -0.02em; }
.subtitle { color: var(--text-muted); margin-top: 0.5rem; }

.toolbar { padding: 1rem; display: flex; justify-content: space-between; align-items: center; gap: 1rem; }
.search-area { display: flex; gap: 1rem; flex: 1; }
.search-input { flex: 1; display: flex; align-items: center; gap: 0.75rem; background: var(--hover-color); padding: 0.5rem 1rem; border-radius: 12px; }
.search-input input { border: none; background: transparent; width: 100%; outline: none; }
.filter-select { display: flex; align-items: center; gap: 0.5rem; background: var(--hover-color); padding: 0.5rem 1rem; border-radius: 12px; }
.filter-select select { border: none; background: transparent; outline: none; font-size: 0.85rem; font-weight: 600; }

.view-toggle { display: flex; background: var(--hover-color); padding: 0.25rem; border-radius: 10px; }
.toggle-btn { padding: 0.5rem; border-radius: 8px; color: var(--text-muted); transition: all 0.2s; }
.toggle-btn.active { background: white; color: var(--primary-color); box-shadow: 0 2px 8px rgba(0,0,0,0.05); }

/* Card View */
.customer-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.5rem; }
.customer-card { padding: 1.5rem; display: flex; flex-direction: column; gap: 1.25rem; }
.card-header { display: flex; justify-content: space-between; align-items: flex-start; }
.avatar-group { display: flex; align-items: center; gap: 1rem; }
.avatar { width: 56px; height: 56px; background: var(--primary-color); color: white; border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; font-weight: 800; }
.tier-badge { font-size: 0.65rem; font-weight: 800; padding: 0.25rem 0.65rem; border-radius: 99px; text-transform: uppercase; }

.quick-actions { display: flex; gap: 0.5rem; }
.action-btn { width: 32px; height: 32px; border-radius: 10px; border: 1px solid var(--border-color); display: flex; align-items: center; justify-content: center; color: var(--text-muted); transition: all 0.2s; }
.action-btn:hover { background: var(--hover-color); color: var(--primary-color); border-color: var(--primary-color); }
.action-btn.primary { color: var(--primary-color); border-color: var(--primary-color); }
.action-btn.primary:hover { background: var(--primary-color); color: white; }

.main-info h3 { font-size: 1.25rem; font-weight: 700; margin: 0; }
.last-order { font-size: 0.8rem; color: var(--text-muted); margin-top: 0.25rem; }

.metrics-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; padding: 1rem; background: var(--hover-color); border-radius: 16px; }
.metric { display: flex; flex-direction: column; gap: 0.25rem; text-align: center; }
.metric .label { font-size: 0.6rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; }
.metric .value { font-size: 0.95rem; font-weight: 800; }

.contact-links { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.5rem; }
.contact-btn { display: flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.65rem; border-radius: 12px; background: var(--hover-color); color: var(--text-color); font-size: 0.8rem; font-weight: 700; text-decoration: none; transition: all 0.2s; }
.contact-btn:hover { background: #f1f5f9; transform: translateY(-2px); }
.contact-btn.wa { color: #16a34a; background: #f0fdf4; }
.contact-btn.wa:hover { background: #dcfce7; }

/* Table View */
.table-card { padding: 0; }
.data-table { width: 100%; border-collapse: collapse; text-align: left; }
.data-table th { padding: 1rem 1.5rem; font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; background: var(--hover-color); }
.data-table td { padding: 1rem 1.5rem; border-bottom: 1px solid var(--border-color); font-size: 0.9rem; }
.name-cell { display: flex; align-items: center; gap: 1rem; font-weight: 600; }
.small-avatar { width: 32px; height: 32px; border-radius: 8px; background: var(--primary-color); color: white; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; font-weight: 700; }
.tier-pill { font-size: 0.7rem; font-weight: 700; padding: 0.25rem 0.5rem; border-radius: 6px; }
.table-actions { display: flex; gap: 1rem; }
.icon-link { color: var(--text-muted); transition: color 0.2s; }
.icon-link:hover { color: var(--primary-color); }
.icon-link.wa:hover { color: #16a34a; }
.btn-text { background: none; border: none; font-size: 0.85rem; font-weight: 700; color: var(--text-muted); cursor: pointer; }
.btn-text.primary { color: var(--primary-color); }

/* Empty State */
.empty-state { padding: 4rem; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 1.5rem; }
.empty-icon { color: var(--primary-color); opacity: 0.5; }

/* Modal */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal { width: 100%; max-width: 500px; padding: 2.5rem; border-radius: 24px; }
.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
.form { display: flex; flex-direction: column; gap: 1.5rem; }
.input-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.input-group label { display: block; font-size: 0.85rem; font-weight: 700; color: var(--text-muted); margin-bottom: 0.5rem; }
.input-group input, .input-group textarea { width: 100%; padding: 0.75rem 1rem; border-radius: 12px; border: 1.5px solid var(--border-color); background: var(--surface-color); color: white; }
.modal-footer { display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1rem; }

@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
</style>
