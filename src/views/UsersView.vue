<script setup>
import { ref, onMounted, computed } from 'vue';
import { useUIStore } from '../stores/ui';
import { Plus, Pencil, Mail, Phone, Calendar, Trash2, X, LayoutGrid, List, Search } from 'lucide-vue-next';
import client from '../api/client';

const ui = useUIStore();
const users = ref([]);
const searchQuery = ref('');

// View State
const viewMode = ref(localStorage.getItem('userViewMode') || 'card');
const setViewMode = (mode) => {
  viewMode.value = mode;
  localStorage.setItem('userViewMode', mode);
};

const isModalOpen = ref(false);
const isEditing = ref(false);
const editingId = ref(null);
const isSubmitting = ref(false);
const userForm = ref({ name: '', email: '', role: 'CLERK', dob: '', contact: '' });

const fetchUsers = async () => {
  try {
    const res = await client.get('/users');
    users.value = res.data;
  } catch {
    ui.notify('Failed to fetch users', 'error');
  }
};

const filteredUsers = computed(() => {
  const q = searchQuery.value.toLowerCase();
  return users.value.filter(u => 
    u.name.toLowerCase().includes(q) || 
    u.email.toLowerCase().includes(q) ||
    (u.contact || '').toLowerCase().includes(q)
  );
});

onMounted(fetchUsers);

const openAddModal = () => {
  isEditing.value = false;
  editingId.value = null;
  userForm.value = { name: '', email: '', role: 'CLERK', dob: '', contact: '' };
  isModalOpen.value = true;
};

const openEditModal = (user) => {
  isEditing.value = true;
  editingId.value = user._id;
  userForm.value = { 
    name: user.name, 
    email: user.email, 
    role: user.role, 
    dob: user.dob ? new Date(user.dob).toISOString().split('T')[0] : '', 
    contact: user.contact || '' 
  };
  isModalOpen.value = true;
};

const handleSubmit = async () => {
  if (isSubmitting.value) return;
  const trimmedName = userForm.value.name.trim();
  const trimmedEmail = userForm.value.email.trim();
  
  if (!trimmedName || !trimmedEmail) {
    ui.notify('Name and Email are required', 'error');
    return;
  }

  isSubmitting.value = true;
  try {
    const payload = { ...userForm.value, name: trimmedName, email: trimmedEmail };
    if (isEditing.value) {
      await client.put(`/users/${editingId.value}`, payload);
      ui.notify('User updated successfully', 'success');
    } else {
      await client.post('/users', payload);
      ui.notify('User created successfully', 'success');
    }
    isModalOpen.value = false;
    await fetchUsers();
  } catch (err) {
    ui.notify(err.error || err.message || 'Operation failed', 'error');
  } finally {
    isSubmitting.value = false;
  }
};

const handleDelete = async (id) => {
  if (!confirm('Are you sure you want to delete this staff member?')) return;
  try {
    await client.delete(`/users/${id}`);
    ui.notify('User deleted successfully', 'success');
    await fetchUsers();
  } catch (err) {
    ui.notify(err.error || 'Failed to delete user', 'error');
  }
};

const formatDate = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};
</script>

<template>
  <div class="users-page">
    <header class="header">
      <div class="title-section">
        <h1>Staff Management</h1>
        <p class="subtitle">Manage your team members and account access.</p>
      </div>
      <button @click="openAddModal" class="btn btn-primary">
        <Plus :size="18" />
        <span>Add Staff</span>
      </button>
    </header>

    <div class="toolbar card glass">
      <div class="search-area">
        <div class="search-wrapper">
          <Search :size="18" class="search-icon" />
          <input v-model="searchQuery" placeholder="Search staff by name, email or contact..." />
        </div>
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

    <!-- Main Content -->
    <div v-if="filteredUsers.length > 0">
      <!-- Grid View -->
      <div v-if="viewMode === 'card'" class="users-grid">
        <div v-for="user in filteredUsers" :key="user._id" class="user-card card glass">
          <div class="user-avatar">
            {{ user.name[0].toUpperCase() }}
          </div>
          <div class="user-info">
            <h3>{{ user.name }}</h3>
            <div class="details">
              <p class="email"><Mail :size="14" /> {{ user.email }}</p>
              <p v-if="user.dob" class="dob"><Calendar :size="14" /> {{ formatDate(user.dob) }}</p>
              <p v-if="user.contact" class="contact"><Phone :size="14" /> {{ user.contact }}</p>
            </div>
          </div>
          <div class="user-footer">
            <div class="actions">
              <button @click="openEditModal(user)" class="action-btn edit" title="Edit">
                <Pencil :size="16" />
              </button>
              <button @click="handleDelete(user._id)" class="action-btn delete" title="Delete">
                <Trash2 :size="16" />
              </button>
            </div>
            <span class="status" :class="user.status?.toLowerCase() || 'active'">
              {{ user.status || 'ACTIVE' }}
            </span>
          </div>
        </div>
      </div>

      <!-- Table View -->
      <div v-else class="card table-card overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>Staff Member</th>
              <th>Email</th>
              <th>Contact</th>
              <th>Birth Date</th>
              <th>Status</th>
              <th class="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in filteredUsers" :key="user._id">
              <td>
                <div class="staff-cell">
                  <div class="staff-avatar-sm">{{ user.name[0].toUpperCase() }}</div>
                  <span class="font-bold">{{ user.name }}</span>
                </div>
              </td>
              <td>{{ user.email }}</td>
              <td>{{ user.contact || 'N/A' }}</td>
              <td>{{ formatDate(user.dob) }}</td>
              <td>
                <span class="status-badge" :class="user.status?.toLowerCase() || 'active'">
                  {{ user.status || 'Active' }}
                </span>
              </td>
              <td class="text-right">
                <div class="table-actions">
                  <button @click="openEditModal(user)" class="action-icon edit"><Pencil :size="14" /></button>
                  <button @click="handleDelete(user._id)" class="action-icon delete"><Trash2 :size="14" /></button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="empty-state card glass">
      <h3>No staff members found</h3>
      <p>Try adjusting your search or add a new team member.</p>
      <button @click="openAddModal" class="btn btn-primary">Add Staff</button>
    </div>

    <!-- Add User Modal -->
    <div v-if="isModalOpen" class="modal-overlay">
      <div class="modal card">
        <div class="modal-header">
          <h3>{{ isEditing ? 'Edit Staff Member' : 'Add New Staff Member' }}</h3>
          <button @click="isModalOpen = false" class="close-btn">
            <X :size="20" />
          </button>
        </div>
        <form @submit.prevent="handleSubmit" class="modal-form">
          <div class="form-grid">
            <div class="input-group">
              <label>Full Name</label>
              <input v-model="userForm.name" required placeholder="John Doe" />
            </div>
            <div class="input-group">
              <label>Gmail Address</label>
              <input v-model="userForm.email" type="email" required placeholder="john@gmail.com" />
            </div>
          </div>
          <div class="form-grid">
            <div class="input-group">
              <label>Date of Birth</label>
              <input v-model="userForm.dob" type="date" />
            </div>
            <div class="input-group">
              <label>Contact Number</label>
              <input v-model="userForm.contact" placeholder="+1 234 567 890" />
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" @click="isModalOpen = false" class="btn btn-secondary" :disabled="isSubmitting">Cancel</button>
            <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
              {{ isSubmitting ? (isEditing ? 'Updating...' : 'Creating...') : (isEditing ? 'Update Info' : 'Create Account') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.toolbar { padding: 1rem; display: flex; justify-content: space-between; align-items: center; gap: 1rem; margin-bottom: 2rem; }
.search-area { display: flex; gap: 1rem; flex: 1; }
.search-wrapper { position: relative; flex: 1; }
.search-icon { position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: var(--text-muted); }
.search-wrapper input { padding-left: 3rem; border: none; background: transparent; width: 100%; outline: none; color: var(--text-color); }

.view-toggle { display: flex; background: var(--hover-color); padding: 0.25rem; border-radius: 10px; }
.toggle-btn { padding: 0.5rem; border-radius: 8px; color: var(--text-muted); transition: all 0.2s; background: transparent; border: none; cursor: pointer; }
.toggle-btn.active { background: white; color: var(--primary-color); box-shadow: 0 2px 8px rgba(0,0,0,0.05); }

.table-card { padding: 0; overflow: hidden; }
.staff-cell { display: flex; align-items: center; gap: 0.75rem; }
.staff-avatar-sm { width: 32px; height: 32px; border-radius: 8px; background: var(--primary-color); color: white; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.75rem; }
.status-badge { font-size: 0.65rem; font-weight: 800; text-transform: uppercase; padding: 0.25rem 0.65rem; border-radius: 99px; letter-spacing: 0.05em; }
.status-badge.active { color: #059669; background: #ecfdf5; border: 1px solid #d1fae5; }
.table-actions { display: flex; gap: 0.5rem; justify-content: flex-end; }
.action-icon { width: 30px; height: 30px; border-radius: 8px; border: 1px solid var(--border-color); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; color: var(--text-muted); background: white; }
.action-icon:hover { border-color: var(--primary-color); color: var(--primary-color); background: var(--hover-color); }

.input-group label { display: block; font-size: 0.85rem; font-weight: 700; color: var(--text-muted); margin-bottom: 0.75rem; }
.input-group input, .input-group select { width: 100%; padding: 0.875rem 1rem; border-radius: 12px; border: 1.5px solid var(--border-color); background: var(--surface-color); transition: all 0.2s; font-weight: 500; }
.input-group input:focus { border-color: var(--primary-color); box-shadow: 0 0 0 4px rgba(67, 97, 238, 0.1); outline: none; }

.input-with-icon { position: relative; }
.input-with-icon svg { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--text-muted); opacity: 0.5; }
.input-with-icon input { padding-left: 44px; }

.modal-footer { display: grid; grid-template-columns: 1fr 2fr; gap: 1rem; margin-top: 1rem; }
.btn { padding: 0.875rem 1.5rem; border-radius: 12px; font-weight: 700; cursor: pointer; transition: all 0.2s; border: none; display: flex; align-items: center; justify-content: center; gap: 0.5rem; }
.btn-primary { background: var(--primary-color); color: white; }
.btn-primary:hover { transform: translateY(-2px); box-shadow: 0 10px 20px -5px rgba(var(--primary-rgb), 0.4); }
.btn-secondary { background: var(--hover-color); color: var(--text-color); }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; animation: fadeIn 0.2s ease; }
.users-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 2rem;
  margin-top: 2rem;
}

.user-card {
  display: flex;
  flex-direction: column;
  padding: 2rem;
  border-radius: 24px;
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.user-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 30px 60px -12px rgba(0, 0, 0, 0.25);
  border-color: var(--primary-color);
}

.user-avatar {
  width: 56px;
  height: 56px;
  border-radius: 18px;
  background: linear-gradient(135deg, var(--primary-color) 0%, #818cf8 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: 800;
  margin-bottom: 1.5rem;
  box-shadow: 0 10px 20px -5px rgba(99, 102, 241, 0.4);
}

.user-info h3 {
  margin: 0 0 1rem 0;
  font-size: 1.25rem;
  font-weight: 800;
  letter-spacing: -0.01em;
}

.details {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.details p {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin: 0;
  font-size: 0.9rem;
  color: var(--text-muted);
}

.details svg {
  color: var(--primary-color);
  opacity: 0.7;
}

.user-footer {
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px dashed var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.actions {
  display: flex;
  gap: 0.75rem;
}

.action-btn {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border-color);
  background: transparent;
  cursor: pointer;
  transition: all 0.2s;
  color: var(--text-muted);
}

.action-btn.edit:hover { background: #eef2ff; color: var(--primary-color); border-color: var(--primary-color); }
.action-btn.delete:hover { background: #fef2f2; color: #ef4444; border-color: #ef4444; }

.status {
  font-size: 0.65rem;
  font-weight: 800;
  padding: 0.35rem 0.75rem;
  border-radius: 8px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.status::before {
  content: '';
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  box-shadow: 0 0 0 2px rgba(currentColor, 0.2);
}

.status.active { background: #ecfdf5; color: #10b981; }
.status.inactive { background: #fef2f2; color: #ef4444; }

.empty-state {
  text-align: center;
  padding: 5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
}

.empty-state h3 { font-size: 1.5rem; font-weight: 800; margin: 0; }
.empty-state p { color: var(--text-muted); max-width: 300px; margin: 0; }
</style>
