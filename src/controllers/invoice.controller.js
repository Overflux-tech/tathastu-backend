const Joi = require('joi');
const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');
const { Invoice } = require('../models');

const createInvoice = {
  validation: {
    body: Joi.object().keys({
      customerName: Joi.string().required(),
      invoiceNo: Joi.string().required(),
      orderNo: Joi.string().allow('', null),
      date: Joi.date().required(),
      state: Joi.string().required(),
      items: Joi.array()
        .items(
          Joi.object({
            item: Joi.string().required(),
            description: Joi.string().allow('', null),
            qty: Joi.number().positive().required(),
            rate: Joi.number().positive().required(),
            taxRate: Joi.number().default(18),
          })
        )
        .min(1)
        .required(),
    }),
  },

  handler: async (req, res) => {
    // 🔍 DUPLICATE CHECK
    const exist = await Invoice.findOne({ invoiceNo: req.body.invoiceNo });
    if (exist) {
      throw new ApiError(400, 'Invoice number already exists');
    }
console.log("req.body********",req.body);

    // ✅ CREATE
    const invoice = await Invoice.create(req.body);

    return res.status(201).json({
      success: true,
      message: 'Invoice created successfully',
      data: invoice,
    });
  },
};

const updateInvoice = {
  validation: {
    params: Joi.object().keys({ id: Joi.string().required() }),
    body: Joi.object().keys({
      customerName: Joi.string().required(),
      invoiceNo: Joi.string().required(),
      orderNo: Joi.string().allow('', null),
      date: Joi.date().required(),
      state: Joi.string().required(),
      items: Joi.array().min(1).required(),
    }),
  },

  handler: async (req, res) => {
    const { id } = req.params;

    const invoice = await Invoice.findById(id);
    if (!invoice) throw new ApiError(404, 'Invoice not found');

    const duplicate = await Invoice.findOne({
      invoiceNo: req.body.invoiceNo,
      _id: { $ne: id },
    });
    if (duplicate) {
      throw new ApiError(400, 'Invoice number already exists');
    }

    Object.assign(invoice, req.body);
    await invoice.save();

    res.json({
      success: true,
      message: 'Invoice updated successfully',
      data: invoice,
    });
  },
};

const getAllInvoices = {
  handler: async (req, res) => {
    const invoices = await Invoice.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      data: invoices,
    });
  },
};

const getInvoiceById = {
  validation: {
    params: Joi.object().keys({ id: Joi.string().required() }),
  },

  handler: async (req, res) => {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) throw new ApiError(404, 'Invoice not found');

    res.json({
      success: true,
      data: invoice,
    });
  },
};

const deleteInvoice = {
  validation: {
    params: Joi.object().keys({ id: Joi.string().required() }),
  },

  handler: async (req, res) => {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) throw new ApiError(404, 'Invoice not found');

    await invoice.deleteOne();

    res.json({
      success: true,
      message: 'Invoice deleted successfully',
    });
  },
};

module.exports = {
    createInvoice,
    updateInvoice,
    getAllInvoices,
    getInvoiceById,
    deleteInvoice
};