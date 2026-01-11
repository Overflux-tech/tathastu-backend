const Joi = require('joi');
const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');
const { Invoice, Customer, Inventory } = require('../models');

const createInvoice = {
  validation: {
    body: Joi.object().keys({
      customerId: Joi.string().required(),
      invoiceNo: Joi.string().required(),
      orderNo: Joi.string().allow('', null),
      date: Joi.date().required(),
      state: Joi.string().required(),
      items: Joi.array()
        .items(
          Joi.object({
            item: Joi.string().required(), // inventoryId
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

    const { customerId, invoiceNo } = req.body;

    const inventoryIds = req.body.items.map(i => i.item);

    const inventories = await Inventory.find({
      _id: { $in: inventoryIds },
    });

    if (inventories.length !== inventoryIds.length) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid inventory item');
    }

    // 🔍 Check customer exists
    const customer = await Customer.findById(customerId);
    if (!customer) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Customer not found');
    }

    const invoiceExist = await Invoice.findOne({ invoiceNo });
    if (invoiceExist) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'Invoice number already exists'
      );
    }

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
      customerId: Joi.string().required(),
      invoiceNo: Joi.string().required(),
      orderNo: Joi.string().allow('', null),
      date: Joi.date().required(),
      state: Joi.string().required(),
      items: Joi.array().min(1).required(),
    }),
  },

  handler: async (req, res) => {
    const { id } = req.params;

    const { customerId, state, items } = req.body;
    const invoice = await Invoice.findById(id);
    if (!invoice) throw new ApiError(404, 'Invoice not found');

    const duplicate = await Invoice.findOne({
      invoiceNo: req.body.invoiceNo,
      _id: { $ne: id },
    });
    if (duplicate) {
      throw new ApiError(400, 'Invoice number already exists');
    }

    // 🔍 Check customer exists
    const customer = await Customer.findById(customerId);
    if (!customer) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Customer not found');
    }

    const inventoryIds = req.body.items.map(i => i.item);

    const inventories = await Inventory.find({
      _id: { $in: inventoryIds },
    });

    if (inventories.length !== inventoryIds.length) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid inventory item');
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
    const invoices = await Invoice.find()
      .populate('customerId')
      .populate('items.item')
      .sort({ createdAt: -1 });

    return res.status(httpStatus.OK).json({
      success: true,
      message: 'Invoices fetched successfully!',
      data: invoices,
    });
  },
};

const getInvoiceById = {
  validation: {
    params: Joi.object().keys({ id: Joi.string().required() }),
  },

  handler: async (req, res) => {
    const invoice = await Invoice.findById(req.params.id)
      .populate('customerId')
      .populate('items.item');

    if (!invoice) throw new ApiError(404, 'Invoice not found');

    return res.status(httpStatus.OK).json({
      success: true,
      message: 'Invoice fetched successfully!',
      data: invoice,
    });
  },
};

const deleteInvoice = {
  validation: {
    params: Joi.object().keys({ id: Joi.string().required() }),
  },

  handler: async (req, res) => {
    try {
      const { _id } = req.params;
      const faq = await Invoice.findByIdAndDelete(_id);

      if (!faq) {
        throw new ApiError(httpStatus.NOT_FOUND, "Invoice not found");
      }

      res.status(httpStatus.OK).send({
        status: true,
        code: httpStatus.OK,
        message: "Invoice deleted successfully",
      });
    } catch (error) {
      if (!(error instanceof ApiError)) {
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Error deleting Invoice");
      }
      throw error;
    }
  },
};

const getLastInvoiceNumber = async (req, res) => {
  try {
    // Find the latest invoice, sorted by createdAt descending
    const lastInvoice = await Invoice.findOne().sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      lastInvoiceNumber: lastInvoice?.invoiceNo || null,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch last invoice number",
    });
  }
};

module.exports = {
  createInvoice,
  updateInvoice,
  getAllInvoices,
  getInvoiceById,
  deleteInvoice,
  getLastInvoiceNumber
};