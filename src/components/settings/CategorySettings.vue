<!-- src/components/settings/CategorySettings.vue -->
<script setup>
import { ref } from 'vue';
import { useStockStore } from '../../stores/stock';
import { useUIStore } from '../../stores/ui';
import { Pencil, Trash2, X, Plus } from 'lucide-vue-next';

const stock = useStockStore();
const ui = useUIStore();
const newCategory = ref({ name: '', description: '' });
const editingCategory = ref(null);

const handleAddCategory = async () => {
  try {
    if (!newCategory.value.name.trim()) return;
    if (editingCategory.value) {
      await stock.updateCategory(editingCategory.value, newCategory.value);
      ui.notify('Category updated successfully', 'success');
      editingCategory.value = null;
    } else {
      await stock.addCategory(newCategory.value);
      ui.notify('Category added successfully', 'success');
    }
    newCategory.value = { name: '', description: '' };
  } catch (err) { ui.notify(err.error || 'Operation failed', 'error'); }
};

const setEditCategory = (cat) => {
  editingCategory.value = cat._id;
  newCategory.value = { name: cat.name, description: cat.description };
};

const handleDeleteCategory = async (id) => {
  if (confirm('Are you sure you want to delete this category?')) {
    try {
      await stock.deleteCategory(id);
      ui.notify('Category deleted', 'success');
    } catch (err) {
      ui.notify(err.error || 'Failed to delete category', 'error');
    }
  }
};
</script>

<template>
  <div class="content-grid">
    <div class="card add-card">
      <div class="form-header">
        <h3>{{ editingCategory ? 'Edit Category' : 'Add New Category' }}</h3>
        <button v-if="editingCategory" @click="editingCategory = null" class="btn-icon">
          <X :size="16" />
        </button>
      </div>
      <form @submit.prevent="handleAddCategory" class="form">
        <div class="input-group">
          <label>Category Name</label>
          <input v-model="newCategory.name" required placeholder="e.g. Electronics" />
        </div>
        <div class="input-group">
          <label>Description</label>
          <textarea v-model="newCategory.description" rows="3" placeholder="Optional description..."></textarea>
        </div>
        <button type="submit" class="btn btn-primary">
          <Plus v-if="!editingCategory" :size="18" />
          {{ editingCategory ? 'Save Changes' : 'Create Category' }}
        </button>
      </form>
    </div>

    <div class="card list-card">
      <h3>All Categories</h3>
      <div class="list">
        <div v-for="cat in stock.categories" :key="cat._id" class="list-item">
          <div class="item-info">
            <p class="item-name">{{ cat.name }}</p>
            <p class="item-desc">{{ cat.description }}</p>
          </div>
          <div class="item-actions">
            <button @click="setEditCategory(cat)" class="btn-icon" title="Edit">
              <Pencil :size="16" />
            </button>
            <button @click="handleDeleteCategory(cat._id)" class="btn-icon btn-danger" title="Delete">
              <Trash2 :size="16" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.content-grid { display: grid; grid-template-columns: 350px 1fr; gap: 2rem; }
.form { display: flex; flex-direction: column; gap: 1.25rem; margin-top: 1rem; }
.list { display: flex; flex-direction: column; gap: 0.75rem; margin-top: 1rem; }
.list-item { display: flex; justify-content: space-between; align-items: center; padding: 1rem; border: 1px solid var(--border-color); border-radius: 12px; background: var(--hover-color); }
.item-name { font-weight: 700; margin: 0; }
.item-desc { font-size: 0.85rem; color: var(--text-muted); margin-top: 0.25rem; }
.item-actions { display: flex; gap: 0.5rem; }
.btn-icon { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 8px; border: 1px solid var(--border-color); background: white; cursor: pointer; color: var(--text-muted); transition: all 0.2s; }
.btn-icon:hover { color: var(--primary-color); border-color: var(--primary-color); }
.btn-icon.btn-danger:hover { color: #ef4444; border-color: #ef4444; background: #fee2e2; }
.form-header { display: flex; justify-content: space-between; align-items: center; }
</style>
