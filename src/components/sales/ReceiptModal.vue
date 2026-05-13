<script setup>
import { Printer, X, CheckCircle2 } from 'lucide-vue-next';
import { formatCurrency } from '../../utils/format';

defineProps(['isOpen', 'transaction', 'customer', 'items', 'currency']);
defineEmits(['close']);

const printReceipt = () => {
  window.print();
};
</script>

<template>
  <div v-if="isOpen" class="modal-overlay" @click.self="$emit('close')">
    <div class="receipt-modal card glass">
      <header class="modal-header">
        <div class="success-banner">
          <CheckCircle2 :size="32" class="success-icon" />
          <h2>Payment Successful</h2>
        </div>
        <button class="close-btn" @click="$emit('close')"><X :size="20" /></button>
      </header>

      <div class="receipt-content" id="printable-receipt">
        <div class="receipt-header">
          <h1 class="brand">STOCKFLOW</h1>
          <p class="store-info">123 Enterprise Way, Tech City<br>Tel: (555) 012-3456</p>
          <div class="receipt-meta">
            <span>Date: {{ new Date().toLocaleString() }}</span>
            <span>Order #: {{ transaction?._id?.slice(-6).toUpperCase() }}</span>
          </div>
        </div>

        <div class="divider"></div>

        <div class="customer-info" v-if="customer">
          <p class="label">Customer</p>
          <p class="value">{{ customer.name }}</p>
        </div>

        <table class="items-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Qty</th>
              <th class="text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in items" :key="item.product">
              <td>{{ item.name }}</td>
              <td>{{ item.quantity }}</td>
              <td class="text-right">{{ formatCurrency(item.price * item.quantity, currency) }}</td>
            </tr>
          </tbody>
        </table>

        <div class="divider"></div>

        <div class="totals-section">
          <div class="row">
            <span>Subtotal</span>
            <span>{{ formatCurrency(transaction?.total - (transaction?.tax || 0) + (transaction?.discount || 0), currency) }}</span>
          </div>
          <div class="row" v-if="transaction?.discount > 0">
            <span>Discount</span>
            <span>-{{ formatCurrency(transaction?.discount, currency) }}</span>
          </div>
          <div class="row">
            <span>Tax (10%)</span>
            <span>{{ formatCurrency(transaction?.tax, currency) }}</span>
          </div>
          <div class="row grand-total">
            <span>GRAND TOTAL</span>
            <span>{{ formatCurrency(transaction?.total, currency) }}</span>
          </div>
          <div class="row payment-method">
            <span>Payment Method</span>
            <span class="method">{{ transaction?.paymentMethod || 'CASH' }}</span>
          </div>
          <div v-if="transaction?.paymentDetails" class="payment-details-summary">
            <template v-if="transaction.paymentMethod === 'CARD'">
              <p v-if="transaction.paymentDetails.cardName">Name: {{ transaction.paymentDetails.cardName }}</p>
              <p v-if="transaction.paymentDetails.cardLast4">Card: **** {{ transaction.paymentDetails.cardLast4 }}</p>
            </template>
            <template v-if="transaction.paymentMethod === 'TRANSFER'">
              <p v-if="transaction.paymentDetails.transferRef">Ref: {{ transaction.paymentDetails.transferRef }}</p>
              <p v-if="transaction.paymentDetails.transferBank">Bank: {{ transaction.paymentDetails.transferBank }}</p>
            </template>
          </div>
        </div>

        <div class="receipt-footer">
          <p>Thank you for your business!</p>
          <div class="barcode">|| ||| || |||| | ||</div>
        </div>
      </div>

      <footer class="modal-footer">
        <button class="btn btn-secondary" @click="printReceipt">
          <Printer :size="18" />
          <span>Print Receipt</span>
        </button>
        <button class="btn btn-primary" @click="$emit('close')">
          Done
        </button>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.receipt-modal {
  width: 100%;
  max-width: 450px;
  max-height: 90vh;
  overflow-y: auto;
  background: var(--bg-surface);
  border-radius: 24px;
  display: flex;
  flex-direction: column;
}

.modal-header {
  padding: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  border-bottom: 1px solid var(--border-color);
}

.success-banner { display: flex; align-items: center; gap: 1rem; color: #10b981; }
.success-banner h2 { margin: 0; font-size: 1.25rem; font-weight: 800; }
.close-btn { background: none; border: none; color: var(--text-muted); cursor: pointer; }

.receipt-content { padding: 2rem; background: white; color: #1a1a1a; margin: 1.5rem; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }

.receipt-header { text-align: center; margin-bottom: 1.5rem; }
.brand { font-size: 1.5rem; font-weight: 900; letter-spacing: 0.1em; margin: 0; color: #000; }
.store-info { font-size: 0.75rem; color: #666; margin: 0.5rem 0; line-height: 1.4; }
.receipt-meta { display: flex; justify-content: space-between; font-size: 0.7rem; font-weight: 700; color: #999; margin-top: 1rem; }

.divider { border-bottom: 2px dashed #eee; margin: 1.5rem 0; }

.customer-info { margin-bottom: 1rem; }
.customer-info .label { font-size: 0.65rem; text-transform: uppercase; color: #999; font-weight: 800; margin: 0; }
.customer-info .value { font-size: 0.9rem; font-weight: 700; margin: 0.25rem 0 0; }

.items-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
.items-table th { text-align: left; padding-bottom: 0.75rem; color: #999; font-weight: 800; text-transform: uppercase; font-size: 0.7rem; }
.items-table td { padding: 0.5rem 0; font-weight: 600; }
.text-right { text-align: right; }

.totals-section { display: flex; flex-direction: column; gap: 0.5rem; }
.row { display: flex; justify-content: space-between; font-size: 0.85rem; font-weight: 600; color: #666; }
.grand-total { margin-top: 0.5rem; padding-top: 0.75rem; border-top: 1px solid #eee; font-size: 1.1rem; font-weight: 900; color: #000; }
.payment-method { margin-top: 0.25rem; font-size: 0.75rem; }
.method { text-transform: uppercase; background: #f3f4f6; padding: 2px 8px; border-radius: 4px; font-weight: 800; }
.payment-details-summary {
  margin-top: 0.5rem;
  padding: 0.5rem;
  background: #f9fafb;
  border-radius: 8px;
  font-size: 0.7rem;
  color: #666;
  font-weight: 700;
  line-height: 1.4;
}
.payment-details-summary p { margin: 0; }

.receipt-footer { text-align: center; margin-top: 2rem; }
.receipt-footer p { font-size: 0.8rem; font-weight: 700; color: #999; }
.barcode { font-family: monospace; font-size: 1.25rem; margin-top: 0.5rem; letter-spacing: 2px; }

.modal-footer { padding: 1.5rem; display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; border-top: 1px solid var(--border-color); }

@media print {
  body * { visibility: hidden; }
  #printable-receipt, #printable-receipt * { visibility: visible; }
  #printable-receipt { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 2rem; }
}
</style>
