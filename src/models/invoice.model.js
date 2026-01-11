const mongoose = require('mongoose');
const { toJSON } = require('./plugins');

const invoiceItemSchema = mongoose.Schema(
  {
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Inventory',
      required: true,
    },
    description: { type: String, trim: true },
    qty: { type: Number, required: true, min: 1 },
    rate: { type: Number, required: true, min: 0 },
    taxRate: { type: Number, default: 18 },

    taxableAmount: { type: Number, default: 0 },
    sgst: { type: Number, default: 0 },
    cgst: { type: Number, default: 0 },
    igst: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
  },
  { _id: false }
);

const invoiceSchema = mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
    },
    invoiceNo: { type: String, required: true, unique: true },
    orderNo: { type: String, trim: true },
    date: { type: Date, required: true },
    state: { type: String, required: true, trim: true },

    items: [invoiceItemSchema],

    subTotal: { type: Number, default: 0 },
    totalTax: { type: Number, default: 0 },
    grandTotal: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// 🔥 GST Calculation (same as Estimate)
invoiceSchema.pre('save', function (next) {
  let subTotal = 0;
  let totalTax = 0;

  this.items.forEach((item) => {
    item.taxableAmount = item.qty * item.rate;
    const taxAmount = (item.taxableAmount * item.taxRate) / 100;

    if (this.state.toLowerCase() === 'gujarat') {
      item.sgst = taxAmount / 2;
      item.cgst = taxAmount / 2;
      item.igst = 0;
    } else {
      item.igst = taxAmount;
      item.sgst = 0;
      item.cgst = 0;
    }

    item.total = item.taxableAmount + taxAmount;
    subTotal += item.taxableAmount;
    totalTax += taxAmount;
  });

  this.subTotal = subTotal;
  this.totalTax = totalTax;
  this.grandTotal = subTotal + totalTax;

  next();
});

invoiceSchema.plugin(toJSON);

const Invoice = mongoose.model('Invoice', invoiceSchema);
module.exports = Invoice;
