<script setup>
import { ref, computed } from 'vue';
import { ShoppingCart, Trash2, Tag, ReceiptText, ChevronRight, User, Warehouse, Minus, Plus, Banknote, CreditCard, Landmark } from 'lucide-vue-next';
import { useStockStore } from '../../stores/stock';
import { useUIStore } from '../../stores/ui';
import { formatCurrency, getCurrencySymbol, convertFromUSD } from '../../utils/format';
import ReceiptModal from './ReceiptModal.vue';

const props = defineProps(['cart', 'warehouseId', 'customerId', 'warehouses', 'customers', 'currency']);
const emit = defineEmits(['update:cart', 'update:warehouseId', 'update:customerId', 'update:currency', 'clear']);

const stock = useStockStore();
const ui = useUIStore();

const discount = ref(0);
const discountType = ref('fixed'); // 'fixed' or 'percent'
const paymentMethod = ref('CASH');
const paymentData = ref({
  cardName: '',
  cardLast4: '',
  transferRef: '',
  transferBank: ''
});
const isProcessing = ref(false);
const showReceipt = ref(false);
const lastTransaction = ref(null);
const lastItems = ref([]);
const lastCustomer = ref(null);

const subtotal = computed(() => {
  if (!props.cart) return 0;
  return props.cart.reduce((sum, item) => {
    const price = Number(item.price) || 0;
    const qty = Number(item.quantity) || 0;
    return sum + (price * qty);
  }, 0);
});

const discountAmount = computed(() => {
  const s = subtotal.value || 0;
  const d = Math.max(0, Number(discount.value) || 0);
  const amount = discountType.value === 'percent' ? (s * d) / 100 : d;
  // BUG-006: Clamp discount to subtotal
  return Math.min(s, amount);
});

const taxRate = 0.10; 
const taxAmount = computed(() => {
  const s = subtotal.value || 0;
  const d = discountAmount.value || 0;
  return (s - d) * taxRate;
});

const grandTotal = computed(() => {
  const s = subtotal.value || 0;
  const d = discountAmount.value || 0;
  const t = taxAmount.value || 0;
  return s - d + t;
});

const updateItemQty = (productId, delta) => {
  const newCart = [...props.cart];
  const item = newCart.find(i => i.product === productId);
  if (item) {
    const product = stock.products.find(p => p._id === productId);
    const entry = product?.warehouseStock?.find(ws => ws.warehouse === props.warehouseId);
    const available = entry ? entry.quantity : 999999;

    const nextQty = item.quantity + delta;
    if (nextQty > available) {
      ui.notify(`Only ${available} available in stock`, 'warning');
      return;
    }

    item.quantity = nextQty;
    if (item.quantity <= 0) {
      emit('update:cart', newCart.filter(i => i.product !== productId));
    } else {
      emit('update:cart', newCart);
    }
  }
};

const onCartQtyInput = (productId, val) => {
  const newCart = [...props.cart];
  const item = newCart.find(i => i.product === productId);
  if (item) {
    let num = parseInt(val);
    if (isNaN(num) || num < 1) num = 1;

    const product = stock.products.find(p => p._id === productId);
    const entry = product?.warehouseStock?.find(ws => ws.warehouse === props.warehouseId);
    const available = entry ? entry.quantity : 999999;

    if (num > available) {
      ui.notify(`Only ${available} available in stock`, 'warning');
      num = available;
    }

    item.quantity = num;
    emit('update:cart', newCart);
  }
};

const removeItem = (productId) => {
  emit('update:cart', props.cart.filter(i => i.product !== productId));
};

const handleCheckout = async () => {
  if (!props.customerId || !props.warehouseId || props.cart.length === 0) {
    ui.notify('Please select customer, warehouse and add items', 'warning');
    return;
  }

  isProcessing.value = true;
  try {
    // BUG-007: Final Inventory Check before API call
    for (const item of props.cart) {
      const product = stock.products.find(p => p._id === item.product);
      const entry = product?.warehouseStock?.find(ws => ws.warehouse === props.warehouseId);
      const available = entry ? entry.quantity : 0;
      if (available < item.quantity) {
        throw new Error(`Insufficient stock for ${item.name}. Available: ${available}`);
      }
    }

    const rate = convertFromUSD(1, props.currency);

    const res = await stock.createTransaction({
      type: 'SALE',
      entityId: props.customerId,
      warehouseId: props.warehouseId,
      items: props.cart.map(i => ({ 
        product: i.product, 
        quantity: i.quantity, 
        price: convertFromUSD(i.price, props.currency), 
        name: i.name 
      })),
      discount: discountAmount.value * rate,
      tax: taxAmount.value * rate,
      total: grandTotal.value * rate,
      currency: props.currency,
      exchangeRate: rate,
      paymentMethod: paymentMethod.value,
      paymentDetails: paymentMethod.value !== 'CASH' ? paymentData.value : null
    });
    
    // Store data for receipt before clearing
    lastTransaction.value = res;
    lastItems.value = [...props.cart];
    lastCustomer.value = props.customers.find(c => c._id === props.customerId);
    showReceipt.value = true;

    emit('clear');
    discount.value = 0;
    ui.notify('Sale completed successfully!', 'success');
  } catch (err) {
    ui.notify(err.error || 'Checkout failed', 'error');
  } finally {
    isProcessing.value = false;
  }
};
</script>

<template>
  <aside class="cart-sidebar card glass">
    <!-- 1. FIXED HEADER AREA -->
    <div class="fixed-top-section">
      <header class="cart-header">
        <div class="title">
          <ShoppingCart :size="24" />
          <h3>Checkout Order</h3>
        </div>
        <button v-if="cart.length > 0" class="btn-clear" @click="$emit('clear')">Clear</button>
      </header>

      <div class="cart-config">
        <div class="input-row">
          <User :size="18" />
          <select :value="customerId" @input="$emit('update:customerId', $event.target.value)">
            <option value="" disabled>Select Customer</option>
            <option v-for="c in customers" :key="c._id" :value="c._id">{{ c.name }}</option>
          </select>
        </div>
        <div class="input-row">
          <Warehouse :size="18" />
          <select :value="warehouseId" @input="$emit('update:warehouseId', $event.target.value)">
            <option value="" disabled>Origin Warehouse</option>
            <option v-for="w in warehouses" :key="w._id" :value="w._id">{{ w.name }}</option>
          </select>
        </div>
        <div class="input-row currency-row">
          <Landmark :size="18" />
          <select :value="currency" @input="$emit('update:currency', $event.target.value)">
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
            <option value="KHR">KHR (៛)</option>
            <option value="GBP">GBP (£)</option>
            <option value="CNY">CNY (¥)</option>
          </select>
        </div>
      </div>
    </div>

    <!-- 2. SCROLLABLE PRODUCT LIST -->
    <div class="items-list-container">
      <div v-if="cart.length === 0" class="empty-state">
        <div class="icon-pulse">
          <ReceiptText :size="64" />
        </div>
        <p>No items added yet</p>
      </div>

      <TransitionGroup v-else name="list" tag="div" class="items-list">
        <div v-for="(item, index) in cart" :key="item.product" 
          class="cart-item"
          :class="{ 'last-item': index === cart.length - 1 }"
        >
          <div class="item-info">
            <p class="name">{{ item.name }}</p>
            <p class="sku">{{ item.sku }}</p>
          </div>
          <div class="item-price-block">
            <p class="price">{{ formatCurrency(item.price * item.quantity, currency) }}</p>
            <div class="item-actions">
              <div class="qty-control">
                <button @click="updateItemQty(item.product, -1)"><Minus :size="12" /></button>
                <input 
                  type="number" 
                  :value="item.quantity" 
                  @input="e => onCartQtyInput(item.product, e.target.value)"
                  min="1"
                />
                <button @click="updateItemQty(item.product, 1)"><Plus :size="12" /></button>
              </div>
              <button class="remove-btn" @click="removeItem(item.product)">
                <Trash2 :size="16" />
              </button>
            </div>
          </div>
        </div>
      </TransitionGroup>
    </div>

    <!-- 3. FIXED PAYMENT FOOTER -->
    <div class="cart-summary footer">
      <div class="totals-box">
        <div class="line grand-total">
          <span class="label">Total</span>
          <span class="big-amount">{{ formatCurrency(grandTotal, currency) }}</span>
        </div>
        <div class="summary-details">
          <div class="line">
            <span>Subtotal</span>
            <span>{{ formatCurrency(subtotal, currency) }}</span>
          </div>
          <div class="line">
            <span>Tax (10%)</span>
            <span>{{ formatCurrency(taxAmount, currency) }}</span>
          </div>
          <div class="line discount" v-if="discountAmount > 0">
            <span>Discount</span>
            <span>-{{ formatCurrency(discountAmount, currency) }}</span>
          </div>
        </div>
      </div>

      <div class="discount-row">
        <div class="discount-input">
          <Tag :size="16" />
          <input 
            v-model.number="discount" 
            type="number" 
            min="0" 
            placeholder="Discount" 
          />
        </div>
        <div class="type-toggle">
          <button 
            :class="{ active: discountType === 'fixed' }" 
            @click="discountType = 'fixed'"
          >
            {{ getCurrencySymbol(currency) }}
          </button>
          <button 
            :class="{ active: discountType === 'percent' }" 
            @click="discountType = 'percent'"
          >
            %
          </button>
        </div>
      </div>

      <!-- Payment Method Selector -->
      <div class="payment-selector">
        <label>Payment Method</label>
        <div class="method-grid">
          <button 
            class="method-btn" 
            :class="{ active: paymentMethod === 'CASH' }"
            @click="paymentMethod = 'CASH'"
          >
            <Banknote :size="20" />
            <span>Cash</span>
          </button>
          <button 
            class="method-btn" 
            :class="{ active: paymentMethod === 'CARD' }"
            @click="paymentMethod = 'CARD'"
          >
            <CreditCard :size="20" />
            <span>Card</span>
          </button>
          <button 
            class="method-btn" 
            :class="{ active: paymentMethod === 'TRANSFER' }"
            @click="paymentMethod = 'TRANSFER'"
          >
            <Landmark :size="20" />
            <span>Transfer</span>
          </button>
        </div>
      </div>

      <!-- Payment Details (Dynamic) -->
      <Transition name="list">
        <div v-if="paymentMethod === 'CARD'" class="method-details-box">
          <div class="detail-input">
            <label>Cardholder Name</label>
            <input v-model="paymentData.cardName" placeholder="Optional" />
          </div>
          <div class="detail-input">
            <label>Last 4 Digits</label>
            <input v-model="paymentData.cardLast4" maxlength="4" placeholder="e.g. 4242" />
          </div>
        </div>
        <div v-else-if="paymentMethod === 'TRANSFER'" class="method-details-box">
          <div class="detail-input">
            <label>Reference #</label>
            <input v-model="paymentData.transferRef" placeholder="Transaction ID" />
          </div>
          <div class="detail-input">
            <label>Bank Name</label>
            <input v-model="paymentData.transferBank" placeholder="e.g. ABA Bank" />
          </div>
        </div>
      </Transition>

      <button 
        class="checkout-btn" 
        :disabled="cart.length === 0 || isProcessing"
        @click="handleCheckout"
      >
        <span v-if="!isProcessing">Process Payment</span>
        <span v-else>Processing...</span>
        <ChevronRight :size="20" />
      </button>
    </div>
  </aside>

  <!-- Receipt Modal -->
  <ReceiptModal 
    :isOpen="showReceipt"
    :transaction="lastTransaction"
    :items="lastItems"
    :customer="lastCustomer"
    :currency="currency"
    @close="showReceipt = false"
  />
</template>

<style scoped>
.cart-sidebar { 
  min-height: 100%;
  display: flex; 
  flex-direction: column; 
  padding: 0.75rem; 
  border-radius: 20px; 
  background: var(--bg-surface); 
  /* Allow the whole sidebar to scroll if it gets too tall for the screen */
  overflow-y: auto;
  gap: 1rem;
}

.cart-header { display: flex; justify-content: space-between; align-items: center; }
.cart-header h3 { font-size: 1rem; font-weight: 900; margin: 0; }
.btn-clear { background: none; border: none; color: var(--text-muted); font-weight: 700; cursor: pointer; font-size: 0.75rem; }

.cart-config { display: flex; flex-direction: column; gap: 0.35rem; }
.input-row { display: flex; align-items: center; gap: 0.5rem; background: var(--bg-color); padding: 0.5rem 0.75rem; border-radius: 10px; border: 1px solid var(--border-color); }
.input-row select { flex: 1; background: transparent; border: none; color: var(--text-color); font-weight: 800; outline: none; font-size: 0.75rem; }
.input-row select option { color: #000; background: #fff; }

/* Product List - No longer forced to fill space */
.items-list-container { 
  display: flex;
  flex-direction: column;
}
.items-list { display: flex; flex-direction: column; gap: 0.5rem; }
.cart-item { display: flex; justify-content: space-between; align-items: flex-start; padding: 0.65rem; background: var(--bg-color); border-radius: 12px; border: 1px solid var(--border-color); }

.item-info .name { font-weight: 800; font-size: 0.8rem; margin: 0; }
.item-info .sku { font-size: 0.55rem; color: var(--text-muted); margin: 0; }
.item-price-block .price { font-size: 0.85rem; font-weight: 800; text-align: right; margin-bottom: 0.35rem; }
.item-actions { display: flex; gap: 0.35rem; align-items: center; }
.qty-control { display: flex; align-items: center; gap: 0.35rem; background: var(--hover-color); padding: 0.15rem; border-radius: 6px; }
.qty-control button { width: 18px; height: 18px; border: none; background: white; border-radius: 3px; display: flex; align-items: center; justify-content: center; cursor: pointer; }
.qty-control input { 
  width: 36px;
  background: transparent;
  border: none;
  font-size: 0.85rem; 
  font-weight: 800; 
  text-align: center;
  outline: none;
  appearance: textfield;
  color: white !important;
  box-shadow: none !important;
}
.qty-control input::-webkit-inner-spin-button,
.qty-control input::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.remove-btn { background: var(--error-light); border: none; color: var(--error-color); padding: 0.2rem; border-radius: 4px; cursor: pointer; }

/* Adaptive Footer - Sits right under items */
.cart-summary.footer { 
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px dashed var(--border-color);
}

.totals-box { 
  background: rgba(var(--primary-rgb), 0.05); 
  padding: 0.75rem; 
  border-radius: 14px; 
  border: 1.5px solid rgba(var(--primary-rgb), 0.1);
}
.line { display: flex; justify-content: space-between; align-items: center; font-weight: 800; font-size: 0.75rem; color: var(--text-muted); }
.line.grand-total { border-bottom: 1px solid rgba(var(--primary-rgb), 0.1); padding-bottom: 0.35rem; margin-bottom: 0.5rem; }
.line.grand-total .label { font-size: 0.9rem; color: var(--text-color); }
.big-amount { font-size: 1.5rem; font-weight: 900; color: var(--primary-color); }
.summary-details { display: flex; flex-direction: column; gap: 0.25rem; }
.line.discount { color: var(--error-color); }

.discount-row { display: flex; gap: 0.35rem; align-items: stretch; }
.discount-input { 
  flex: 1; 
  display: flex; 
  align-items: center; 
  gap: 0.35rem; 
  background: var(--bg-color); 
  padding: 0.35rem 0.5rem; 
  border-radius: 10px; 
  border: 1px solid var(--border-color);
  height: 34px; 
}
.discount-input input { background: transparent; border: none; color: var(--text-color); font-weight: 800; outline: none; font-size: 0.8rem; width: 100%; }
.type-toggle { display: flex; background: var(--bg-color); padding: 2px; border-radius: 8px; border: 1px solid var(--border-color); height: 34px; }
.type-toggle button { width: 28px; border: none; background: transparent; color: var(--text-muted); font-weight: 900; cursor: pointer; border-radius: 6px; transition: all 0.2s; font-size: 0.75rem; }
.type-toggle button.active { background: var(--primary-color); color: white; }

.payment-selector { margin: 0.5rem 0; }
.payment-selector label { font-size: 0.75rem; font-weight: 800; color: var(--text-muted); margin-bottom: 0.5rem; display: block; text-transform: uppercase; }
.method-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; }
.method-btn { 
  display: flex; 
  flex-direction: column; 
  align-items: center; 
  gap: 0.35rem; 
  padding: 0.65rem 0.25rem; 
  background: var(--bg-color); 
  border: 1px solid var(--border-color); 
  border-radius: 10px; 
  color: var(--text-muted); 
  cursor: pointer; 
  transition: all 0.2s;
}
.method-btn span { font-size: 0.65rem; font-weight: 800; }
.method-btn.active { background: var(--primary-light); border-color: var(--primary-color); color: var(--primary-color); }

.method-details-box {
  background: var(--hover-color);
  border-radius: 12px;
  padding: 0.75rem;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
  margin-top: -0.25rem;
  border: 1px solid var(--border-color);
}

.detail-input label {
  display: block;
  font-size: 0.65rem;
  font-weight: 800;
  color: var(--text-muted);
  margin-bottom: 0.25rem;
  text-transform: uppercase;
}

.detail-input input {
  width: 100%;
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 0.4rem 0.6rem;
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--text-color);
}

.checkout-btn { 
  width: 100%; 
  padding: 0.75rem; 
  border-radius: 12px; 
  border: none; 
  background: var(--primary-color); 
  color: white; 
  font-size: 0.95rem; 
  font-weight: 900; 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  gap: 0.5rem; 
  cursor: pointer; 
  transition: all 0.3s;
  margin-bottom: 0.5rem;
}
.checkout-btn:hover:not(:disabled) { background: var(--primary-hover); transform: translateY(-1px); box-shadow: 0 5px 15px rgba(var(--primary-rgb), 0.2); }
.checkout-btn:disabled { opacity: 0.4; cursor: not-allowed; }

.empty-state { padding: 2rem 1rem; text-align: center; color: var(--text-muted); }
.icon-pulse { animation: pulse 2s infinite ease-in-out; margin-bottom: 0.75rem; opacity: 0.3; }

@keyframes pulse { 0%, 100% { transform: scale(1); opacity: 0.3; } 50% { transform: scale(1.1); opacity: 0.5; } }
.list-enter-active, .list-leave-active { transition: all 0.3s ease; }
.list-enter-from, .list-leave-to { opacity: 0; transform: scale(0.95); }
</style>
