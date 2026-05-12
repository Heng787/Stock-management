<script setup>
import { ref } from 'vue';
import Papa from 'papaparse';
import { UploadCloud, X, FileText, CheckCircle, AlertCircle } from 'lucide-vue-next';

defineProps({
  isOpen: Boolean
});

const emit = defineEmits(['close', 'import']);

const isDragging = ref(false);
const file = ref(null);
const parsedData = ref([]);
const isParsing = ref(false);
const error = ref(null);

const handleDragOver = (e) => {
  e.preventDefault();
  isDragging.value = true;
};

const handleDragLeave = (e) => {
  e.preventDefault();
  isDragging.value = false;
};

const handleDrop = (e) => {
  e.preventDefault();
  isDragging.value = false;
  const droppedFiles = e.dataTransfer.files;
  if (droppedFiles.length > 0) {
    processFile(droppedFiles[0]);
  }
};

const handleFileSelect = (e) => {
  const selectedFile = e.target.files[0];
  if (selectedFile) {
    processFile(selectedFile);
  }
};

const processFile = (selectedFile) => {
  if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
    error.value = 'Please upload a valid CSV file.';
    return;
  }
  
  if (selectedFile.size > 5 * 1024 * 1024) {
    error.value = 'File is too large. Maximum size is 5MB.';
    return;
  }
  
  error.value = null;
  file.value = selectedFile;
  isParsing.value = true;

  Papa.parse(selectedFile, {
    header: true,
    skipEmptyLines: true,
    complete: (results) => {
      parsedData.value = results.data;
      isParsing.value = false;
    },
    error: (err) => {
      error.value = 'Error parsing CSV: ' + err.message;
      isParsing.value = false;
    }
  });
};

const removeFile = () => {
  file.value = null;
  parsedData.value = [];
  error.value = null;
};

const handleImport = () => {
  if (parsedData.value.length === 0) return;
  emit('import', parsedData.value);
  close();
};

const close = () => {
  removeFile();
  emit('close');
};
</script>

<template>
  <div v-if="isOpen" class="modal-overlay" @click.self="close">
    <div class="modal-content glass">
      <div class="modal-header">
        <h2>Bulk Import Products</h2>
        <button class="close-btn" @click="close" aria-label="Close modal">
          <X :size="20" />
        </button>
      </div>

      <div class="modal-body">
        <p class="description">Upload a CSV file containing product data. Required columns: name, sku, price, minStockLevel, quantity.</p>

        <div 
          class="drop-zone"
          :class="{ 'is-dragging': isDragging, 'has-file': file }"
          @dragover="handleDragOver"
          @dragleave="handleDragLeave"
          @drop="handleDrop"
        >
          <div v-if="!file" class="upload-prompt">
            <UploadCloud :size="48" class="upload-icon" />
            <h3>Drag & Drop your CSV file here</h3>
            <p>or</p>
            <label class="btn btn-outline browse-btn">
              Browse Files
              <input type="file" accept=".csv" class="hidden-input" @change="handleFileSelect" />
            </label>
          </div>

          <div v-else class="file-info">
            <div class="file-details">
              <FileText :size="32" class="file-icon" />
              <div>
                <p class="file-name">{{ file.name }}</p>
                <p class="file-size">{{ (file.size / 1024).toFixed(2) }} KB</p>
              </div>
            </div>
            <button class="remove-btn" @click="removeFile" aria-label="Remove file">
              <X :size="18" />
            </button>
          </div>
        </div>

        <div v-if="error" class="alert alert-error">
          <AlertCircle :size="18" />
          <span>{{ error }}</span>
        </div>

        <div v-if="parsedData.length > 0" class="parsed-preview">
          <div class="alert alert-success">
            <CheckCircle :size="18" />
            <span>Successfully parsed {{ parsedData.length }} products.</span>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn btn-outline" @click="close">Cancel</button>
        <button 
          class="btn btn-primary" 
          :disabled="!file || parsedData.length === 0 || isParsing"
          @click="handleImport"
        >
          {{ isParsing ? 'Parsing...' : 'Import Products' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal-content {
  width: 90%;
  max-width: 600px;
  background: var(--surface-color);
  border-radius: 16px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid var(--border-color);
}

.modal-header h2 {
  margin: 0;
  font-size: 1.25rem;
}

.close-btn {
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
  display: flex;
  transition: all 0.2s;
}

.close-btn:hover {
  background: var(--hover-color);
  color: var(--text-color);
}

.modal-body {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.description {
  margin: 0;
  color: var(--text-muted);
  font-size: 0.9rem;
}

.drop-zone {
  border: 2px dashed var(--border-color);
  border-radius: 12px;
  padding: 3rem 2rem;
  text-align: center;
  transition: all 0.3s;
  background: var(--bg-color);
}

.drop-zone.is-dragging {
  border-color: var(--primary-color);
  background: var(--primary-light);
}

.drop-zone.has-file {
  padding: 1.5rem;
  border-style: solid;
  border-color: var(--success-color);
  background: var(--success-light);
}

.upload-prompt {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.upload-icon {
  color: var(--primary-color);
  margin-bottom: 0.5rem;
}

.upload-prompt h3 {
  margin: 0;
  font-size: 1.1rem;
}

.upload-prompt p {
  margin: 0;
  color: var(--text-muted);
  font-size: 0.9rem;
}

.hidden-input {
  display: none;
}

.browse-btn {
  margin-top: 1rem;
}

.file-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.file-details {
  display: flex;
  align-items: center;
  gap: 1rem;
  text-align: left;
}

.file-icon {
  color: var(--success-color);
}

.file-name {
  margin: 0;
  font-weight: 600;
  color: var(--text-color);
}

.file-size {
  margin: 0;
  font-size: 0.8rem;
  color: var(--text-muted);
}

.remove-btn {
  background: transparent;
  border: none;
  color: var(--error-color);
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
  display: flex;
  transition: background 0.2s;
}

.remove-btn:hover {
  background: var(--error-light);
}

.alert {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  border-radius: 8px;
  font-size: 0.9rem;
}

.alert-error {
  background: var(--error-light);
  color: var(--error-color);
  border: 1px solid #fca5a5;
}

.alert-success {
  background: var(--success-light);
  color: var(--success-color);
  border: 1px solid #86efac;
}

.modal-footer {
  padding: 1.5rem;
  border-top: 1px solid var(--border-color);
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}
</style>
