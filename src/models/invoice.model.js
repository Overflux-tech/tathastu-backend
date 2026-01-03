const mongoose = require('mongoose');
const { toJSON } = require('./plugins');

const ItemSchema = new mongoose.Schema({
  description: String,
  hsnSac: String,
  quantity: Number,
  unit: String,
  rate: Number,
  gstRate: Number,
});

const InvoiceSchema = new mongoose.Schema(
  {
    estimateNo: { type: String, required: true, unique: true },
    date: String,
    placeOfSupply: String,
    customer: {
      name: String,
      address: String,
      mobile: String,
      gstn: String,
    },
    items: [ItemSchema],
  },
  { timestamps: true }
);
InvoiceSchema.plugin(toJSON);
/**
 * @typedef Invoice
 */
const Invoice = mongoose.model("Invoice", InvoiceSchema);
module.exports = Invoice;

