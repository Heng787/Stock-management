<script setup>
import { Search, Calendar, ArrowRight, Filter, ChevronDown, XCircle } from 'lucide-vue-next';

const props = defineProps(['searchQuery', 'startDate', 'endDate', 'typeFilter']);
const emit = defineEmits(['update:searchQuery', 'update:startDate', 'update:endDate', 'update:typeFilter', 'clear']);

const updateSearch = (v) => emit('update:searchQuery', v.target.value);
const updateStart = (v) => emit('update:startDate', v.target.value);
const updateEnd = (v) => emit('update:endDate', v.target.value);
const updateType = (v) => emit('update:typeFilter', v.target.value);
</script>

<template>
  <div class="filters-card card glass">
    <div class="search-box">
      <Search :size="18" />
      <input 
        :value="searchQuery" 
        @input="updateSearch"
        placeholder="Search by ID, customer or supplier..." 
      />
    </div>
    
    <div class="filter-group">
      <div class="date-range-picker glass-inset">
        <div class="range-field" @click="$refs.startInput.showPicker()">
          <Calendar :size="14" />
          <input 
            ref="startInput" 
            type="date" 
            :value="startDate" 
            @input="updateStart"
            title="Start Date" 
          />
        </div>
        <ArrowRight :size="14" class="range-arrow" />
        <div class="range-field" @click="$refs.endInput.showPicker()">
          <input 
            ref="endInput" 
            type="date" 
            :value="endDate" 
            @input="updateEnd"
            title="End Date" 
          />
        </div>
        <button v-if="startDate || endDate" class="clear-date-btn" @click="$emit('clear')" title="Clear Dates">
          <XCircle :size="14" />
        </button>
      </div>

      <div class="filter-item">
        <Filter :size="16" />
        <select :value="typeFilter" @change="updateType" class="contrast-select">
          <option value="ALL">All Types</option>
          <option value="SALE">Sales Only</option>
          <option value="PURCHASE">Purchases Only</option>
        </select>
        <ChevronDown :size="14" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.filters-card { padding: 0.75rem 1.25rem; display: flex; justify-content: space-between; align-items: center; gap: 1.5rem; }
.search-box { flex: 1; display: flex; align-items: center; gap: 0.75rem; color: var(--text-muted); padding: 0.5rem 0; }
.search-box input { border: none; background: transparent; outline: none; color: var(--text-color); width: 100%; font-weight: 500; }

.filter-group { display: flex; gap: 1rem; }

.date-range-picker { 
  display: flex; 
  align-items: center; 
  gap: 0.25rem; 
  padding: 0.25rem 0.5rem; 
  border-radius: 10px; 
  background: var(--hover-color);
  border: 1px solid var(--border-color); 
  transition: all 0.2s ease;
}

.date-range-picker:hover { border-color: var(--primary-color); }
.glass-inset { background: rgba(0, 0, 0, 0.15); box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1); }

.range-field { 
  display: flex; 
  align-items: center; 
  gap: 0.35rem; 
  position: relative;
  cursor: pointer;
  padding: 0.15rem 0.35rem;
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

.range-field input::-webkit-calendar-picker-indicator {
  opacity: 0;
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  cursor: pointer;
}

.range-arrow { color: var(--text-muted); opacity: 0.4; }

.clear-date-btn {
  background: none;
  border: none;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0.1rem;
  border-radius: 50%;
  transition: all 0.2s;
}
.clear-date-btn:hover { color: var(--error-color); background: rgba(239, 68, 68, 0.1); }

.filter-item { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; background: var(--hover-color); border-radius: 12px; border: 1px solid var(--border-color); color: var(--text-muted); transition: all 0.2s; position: relative; }
.filter-item:hover { border-color: var(--primary-color); color: var(--primary-color); }
.contrast-select { border: none; background: transparent; color: inherit; font-family: inherit; font-weight: 700; font-size: 0.85rem; cursor: pointer; appearance: none; outline: none; padding-right: 0.5rem; }
</style>
