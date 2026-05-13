<script setup>
import { ref, computed, onMounted } from 'vue';
import { useStockStore } from '../stores/stock';
import { useUIStore } from '../stores/ui';
import { 
  Plus, Pencil, Trash2, Truck, Mail, Phone, 
  MapPin, Search, Star, LayoutGrid, List, ArrowUpDown
} from 'lucide-vue-next';
import SupplierDetailsDrawer from '../components/SupplierDetailsDrawer.vue';

const stock = useStockStore();
const ui = useUIStore();

// View State
const viewMode = ref(localStorage.getItem('supplierViewMode') || 'card');
const searchQuery = ref('');
const sortBy = ref('name'); // 'name', 'rating', 'newest'
const selectedSupplier = ref(null);
const isDrawerOpen = ref(false);

const setViewMode = (mode) => {
  viewMode.value = mode;
  localStorage.setItem('supplierViewMode', mode);
};

onMounted(() => {
  stock.fetchAll();
});

const isModalOpen = ref(false);
const editingSupplier = ref(null);
const isSubmitting = ref(false);

const supplierForm = ref({
  name: '',
  email: '',
  phone: '',
  address: '',
  rating: 5
});

const filteredSuppliers = computed(() => {
  let list = [...stock.suppliers];
  
  // 1. Search Filter
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    list = list.filter(s =>
      s.name.toLowerCase().includes(q) ||
      (s.email || '').toLowerCase().includes(q)
    );
  }

  // 2. Sorting Logic
  list.sort((a, b) => {
    if (sortBy.value === 'name') return a.name.localeCompare(b.name);
    if (sortBy.value === 'rating') return (b.rating || 0) - (a.rating || 0);
    if (sortBy.value === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
    return 0;
  });

  return list;
});

const getActivePOs = (supplierId) => {
  return stock.transactions.filter(t => 
    (t.supplier?._id === supplierId || t.supplier === supplierId) && 
    t.status === 'PENDING'
  ).length;
};

const viewProfile = (supplier) => {
  selectedSupplier.value = supplier;
  isDrawerOpen.value = true;
};

const openModal = (supplier = null) => {
  if (supplier) {
    editingSupplier.value = supplier._id;
    supplierForm.value = {
      name: supplier.name || '',
      email: supplier.email || '',
      phone: supplier.phone || '',
      address: supplier.address || '',
      rating: supplier.rating ?? 5
    };
  } else {
    editingSupplier.value = null;
    supplierForm.value = { name: '', email: '', phone: '', address: '', rating: 5 };
  }
  isModalOpen.value = true;
};

const handleSubmit = async () => {
  if (isSubmitting.value) return;
  isSubmitting.value = true;
  try {
    if (!supplierForm.value.name.trim()) {
      ui.notify('Company Name is required', 'error');
      return;
    }
    if (editingSupplier.value) {
      await stock.updateSupplier(editingSupplier.value, supplierForm.value);
      ui.notify('Supplier updated successfully', 'success');
    } else {
      await stock.addSupplier(supplierForm.value);
      ui.notify('Supplier added successfully', 'success');
    }
    isModalOpen.value = false;
  } catch (err) {
    const details = err.details ? `\nMissing/Invalid: ${Object.keys(err.details).join(', ')}` : ''
    ui.notify((err.error || 'Failed to save supplier') + details, 'error');
  } finally {
    isSubmitting.value = false;
  }
};

const handleDelete = async (id) => {
  if (!confirm('Are you sure you want to remove this supplier?')) return;
  try {
    await stock.deleteSupplier(id);
    ui.notify('Supplier removed successfully', 'success');
  } catch (err) {
    ui.notify(err?.error || 'Failed to delete supplier', 'error');
  }
};
</script>

<template>
  <div class="suppliers-page">
    <header class="header">
      <div class="title-section">
        <h1>Supplier Management</h1>
        <p class="subtitle">{{ filteredSuppliers.length }} supplier{{ filteredSuppliers.length !== 1 ? 's' : '' }} found</p>
      </div>
      <button @click="openModal()" class="btn btn-primary">
        <Plus :size="18" />
        <span>Add Supplier</span>
      </button>
    </header>

    <div class="toolbar card glass">
      <div class="search-area">
        <div class="search-wrapper">
          <Search :size="18" class="search-icon" />
          <input v-model="searchQuery" placeholder="Search by name or email..." />
        </div>
      </div>

      <div class="toolbar-right">
        <div class="filter-item">
          <ArrowUpDown :size="16" />
          <select v-model="sortBy" class="contrast-select">
            <option value="name">Sort by Name</option>
            <option value="rating">Sort by Rating</option>
            <option value="newest">Sort by Newest</option>
          </select>
        </div>

        <div class="view-toggle">
          <button @click="setViewMode('card')" :class="{ active: viewMode === 'card' }" class="toggle-btn" title="Grid View">
            <LayoutGrid :size="18" />
          </button>
          <button @click="setViewMode('table')" :class="{ active: viewMode === 'table' }" class="toggle-btn" title="Table View">
            <List :size="18" />
          </button>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="filteredSuppliers.length === 0" class="empty-state card">
      <Truck :size="48" class="empty-icon" />
      <h3>No suppliers yet</h3>
      <p>Add your first supplier to get started.</p>
      <button @click="openModal()" class="btn btn-primary">Add Supplier</button>
    </div>

    <!-- Main Content -->
    <div v-if="filteredSuppliers.length > 0">
      <!-- Grid View -->
      <div v-if="viewMode === 'card'" class="supplier-grid">
        <div v-for="supplier in filteredSuppliers" :key="supplier._id" 
          class="card supplier-card clickable-card"
          @click="viewProfile(supplier)"
        >
          <div class="card-top">
            <div class="avatar"><Truck :size="22" /></div>
            <div class="item-actions" @click.stop>
              <button @click="openModal(supplier)" class="icon-btn edit" title="Edit supplier">
                <Pencil :size="15" />
              </button>
              <button @click="handleDelete(supplier._id)" class="icon-btn delete" title="Remove supplier">
                <Trash2 :size="15" />
              </button>
            </div>
          </div>

          <h3 class="supplier-name">{{ supplier.name }}</h3>

          <div class="stats">
            <div class="stat">
              <span class="label">Active POs</span>
              <span class="value">{{ getActivePOs(supplier._id) }}</span>
            </div>
            <div class="stat">
              <span class="label">Rating</span>
              <span class="value rating">
                {{ supplier.rating ?? 5 }}/5
                <Star :size="13" class="star-icon" />
              </span>
            </div>
          </div>

          <div class="contact-info">
            <div class="info-item" v-if="supplier.email"><Mail :size="14" /> {{ supplier.email }}</div>
            <div class="info-item"><Phone :size="14" /> {{ supplier.phone || 'No phone' }}</div>
            <div class="info-item"><MapPin :size="14" /> {{ supplier.address || 'No address' }}</div>
          </div>
        </div>
      </div>

      <!-- Table View -->
      <div v-else class="card table-card overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>Supplier Name</th>
              <th>Rating</th>
              <th>Contact Details</th>
              <th>Status</th>
              <th class="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="supplier in filteredSuppliers" :key="supplier._id" class="clickable-row" @click="viewProfile(supplier)">
              <td class="font-bold">{{ supplier.name }}</td>
              <td>
                <div class="rating-cell">
                  <span>{{ (supplier.rating || 5.0).toFixed(1) }}</span>
                  <Star :size="12" class="star-icon filled" />
                </div>
              </td>
              <td>
                <div class="contact-cell">
                  <span v-if="supplier.email">{{ supplier.email }}</span>
                  <span v-else class="text-muted">{{ supplier.phone || 'N/A' }}</span>
                </div>
              </td>
              <td>
                <span class="badge" :class="getActivePOs(supplier._id) > 0 ? 'success' : 'neutral'">
                  {{ getActivePOs(supplier._id) > 0 ? 'Active Orders' : 'Idle' }}
                </span>
              </td>
              <td class="text-right" @click.stop>
                <div class="table-actions">
                  <button @click="openModal(supplier)" class="icon-btn edit"><Pencil :size="14" /></button>
                  <button @click="handleDelete(supplier._id)" class="icon-btn delete"><Trash2 :size="14" /></button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal -->
    <div v-if="isModalOpen" class="modal-overlay">
      <div class="modal card">
        <h3>{{ editingSupplier ? 'Edit Supplier' : 'New Supplier' }}</h3>
        <form @submit.prevent="handleSubmit" class="form">
          <div class="input-group">
            <label for="supplier-name">Company Name *</label>
            <input id="supplier-name" v-model="supplierForm.name" required placeholder="e.g. Global Tech Supplies" />
          </div>
          <div class="input-group">
            <label for="supplier-email">Email Address</label>
            <input id="supplier-email" v-model="supplierForm.email" type="email" placeholder="contact@company.com" />
          </div>
          <div class="input-group">
            <label for="supplier-phone">Phone Number</label>
            <input id="supplier-phone" v-model="supplierForm.phone" type="tel" placeholder="+1 234 567 8900" @input="supplierForm.phone = $event.target.value.replace(/[^0-9+()-\s]/g, '')" />
          </div>
          <div class="input-group">
            <label for="supplier-address">Address</label>
            <textarea id="supplier-address" v-model="supplierForm.address" rows="2" placeholder="123 Tech Blvd, City, Country"></textarea>
          </div>
          <div class="input-group">
            <label for="supplier-rating">Rating (0–5)</label>
            <input id="supplier-rating" v-model.number="supplierForm.rating" type="number" min="0" max="5" step="0.5" />
          </div>
          <div class="modal-actions">
            <button type="button" @click="isModalOpen = false" class="btn btn-secondary">Cancel</button>
            <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
              {{ isSubmitting ? 'Saving…' : 'Save Supplier' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Supplier Profile Drawer -->
    <SupplierDetailsDrawer 
      :is-open="isDrawerOpen"
      :supplier="selectedSupplier"
      :transactions="stock.transactions"
      @close="isDrawerOpen = false"
    />
  </div>
</template>

<style scoped>
.suppliers-page { display: flex; flex-direction: column; gap: 2rem; }

.header { display: flex; justify-content: space-between; align-items: flex-end; }
.subtitle { color: var(--text-muted); margin-top: 0.25rem; }

.toolbar { padding: 1rem; display: flex; justify-content: space-between; align-items: center; gap: 1rem; margin-bottom: 2rem; }
.search-area { display: flex; gap: 1rem; flex: 1; }
.search-wrapper { position: relative; flex: 1; }
.search-icon { position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: var(--text-muted); }
.search-wrapper input { padding-left: 3rem; border: none; background: transparent; width: 100%; outline: none; color: var(--text-color); }

.view-toggle { display: flex; background: var(--hover-color); padding: 0.25rem; border-radius: 10px; border: 1px solid var(--border-color); }
.toggle-btn { padding: 0.5rem; border-radius: 8px; color: var(--text-muted); transition: all 0.2s; background: transparent; border: none; cursor: pointer; }
.toggle-btn.active { background: var(--primary-color); color: white; box-shadow: 0 4px 10px rgba(var(--primary-rgb), 0.2); }

.toolbar-right { display: flex; gap: 1rem; align-items: center; }
.filter-item { display: flex; align-items: center; gap: 0.5rem; color: var(--text-muted); background: var(--hover-color); padding: 0.5rem 0.75rem; border-radius: 10px; border: 1.5px solid var(--border-color); }

.input-group input, .input-group textarea { width: 100%; padding: 0.75rem 1rem; border-radius: 12px; border: 1.5px solid var(--border-color); background: var(--surface-color); color: white; }

.contrast-select { border: none; background: transparent; color: var(--text-color); font-weight: 700; outline: none; appearance: none; cursor: pointer; font-size: 0.85rem; }
.contrast-select option { background: var(--surface-color); color: var(--text-color); padding: 10px; }

.clickable-card { cursor: pointer; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); border: 1.5px solid var(--border-color); }
.clickable-card:hover { transform: translateY(-5px); border-color: var(--primary-color); box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); }

.clickable-row { cursor: pointer; transition: background 0.2s; }
.clickable-row:hover td { background: var(--hover-color); }

.table-card { padding: 0; overflow: hidden; border-radius: 20px; }
.rating-cell { display: flex; align-items: center; gap: 0.4rem; font-weight: 700; color: #f59e0b; }
.star-icon.filled { fill: currentColor; }
.contact-cell { display: flex; flex-direction: column; font-size: 0.85rem; }
.table-actions { display: flex; gap: 0.5rem; justify-content: flex-end; }

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 4rem;
  text-align: center;
}
.empty-icon { color: var(--text-muted); opacity: 0.4; }

.supplier-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.supplier-card { padding: 1.5rem; }

.card-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.avatar {
  width: 46px;
  height: 46px;
  background: #f3e8ff;
  color: #9333ea;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.item-actions { display: flex; gap: 0.4rem; }

.icon-btn {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  color: var(--text-muted);
}
.icon-btn.edit:hover { border-color: var(--primary-color); color: var(--primary-color); background: var(--primary-light); }
.icon-btn.delete:hover { border-color: var(--error-color); color: var(--error-color); background: var(--error-light); }

.supplier-name { margin: 0 0 1rem 0; font-size: 1.15rem; }

.stats {
  display: flex;
  gap: 1.5rem;
  padding: 1rem;
  background: var(--hover-color);
  border-radius: 12px;
  margin-bottom: 1.25rem;
}
.stat { display: flex; flex-direction: column; gap: 0.25rem; }
.stat .label { font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
.stat .value { font-weight: 700; font-size: 1rem; display: flex; align-items: center; gap: 0.3rem; }
.rating { color: #f59e0b; }
.star-icon { fill: currentColor; }

.contact-info { display: flex; flex-direction: column; gap: 0.6rem; }
.info-item { display: flex; align-items: center; gap: 0.6rem; font-size: 0.85rem; color: var(--text-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1.5rem;
}
.modal { width: 100%; max-width: 480px; padding: 2rem; animation: modalIn 0.25s ease-out; }
@keyframes modalIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
.modal h3 { margin-bottom: 1.5rem; font-size: 1.25rem; }
.form { display: flex; flex-direction: column; gap: 1.25rem; }
.modal-actions { display: flex; justify-content: flex-end; gap: 1rem; margin-top: 0.5rem; }
</style>
