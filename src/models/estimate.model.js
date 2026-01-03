const mongoose = require('mongoose');
const { toJSON } = require('./plugins');

const estimateItemSchema = mongoose.Schema(
  {
    item: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    qty: {
      type: Number,
      required: true,
      min: 1,
    },
    rate: {
      type: Number,
      required: true,
      min: 0,
    },
    taxRate: {
      type: Number,
      default: 18, // 18%
    },
    taxableAmount: {
      type: Number,
      default: 0,
    },
    sgst: {
      type: Number,
      default: 0,
    },
    cgst: {
      type: Number,
      default: 0,
    },
    igst: {
      type: Number,
      default: 0,
    },
    total: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

const estimateSchema = mongoose.Schema(
  {
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    estimateNumber: {
      type: String,
      required: true,
      unique: true,
    },
    date: {
      type: Date,
      required: true,
    },
    state: {
      type: String,
      required: true,
      trim: true,
    },
    items: [estimateItemSchema],

    subTotal: {
      type: Number,
      default: 0,
    },
    totalTax: {
      type: Number,
      default: 0,
    },
    grandTotal: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

/// 🔥 Auto calculation before save
estimateSchema.pre('save', function (next) {
  let subTotal = 0;
  let totalTax = 0;

  this.items.forEach((item) => {
    // qty * rate
    item.taxableAmount = item.qty * item.rate;

    const taxAmount = (item.taxableAmount * item.taxRate) / 100;

    // Gujarat → SGST + CGST
    if (this.state.toLowerCase() === 'gujarat') {
      item.sgst = taxAmount / 2;
      item.cgst = taxAmount / 2;
      item.igst = 0;
    } else {
      // Other state → IGST
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

estimateSchema.plugin(toJSON);

/**
 * @typedef Estimate
 */
const Estimate = mongoose.model('Estimate', estimateSchema);

module.exports = Estimate;
