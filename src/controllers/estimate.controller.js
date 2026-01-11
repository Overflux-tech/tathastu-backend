const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');
const Joi = require('joi');
const { Estimate, Customer, Inventory } = require('../models');

// POST to add new category (optional, for admin use)

const createEstimate = {
  validation: {
    body: Joi.object().keys({
      customerId: Joi.string().required(),
      estimateNumber: Joi.string().trim().required(),
      date: Joi.date().required(),
      state: Joi.string().trim().required(),
      items: Joi.array()
        .items(
          Joi.object().keys({
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
    try {
      const { customerId, estimateNumber } = req.body;

      const inventoryIds = req.body.items.map(i => i.item);

      const inventories = await Inventory.find({
        _id: { $in: inventoryIds },
      });

      console.log('inventories', inventories)
      if (inventories.length !== inventoryIds.length) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid inventory item');
      }

      // 🔍 Check customer exists
      const customer = await Customer.findById(customerId);
      if (!customer) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Customer not found');
      }

      // 🔍 Check duplicate estimate number
      const estimateExist = await Estimate.findOne({ estimateNumber });
      if (estimateExist) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          'Estimate number already exists'
        );
      }

      const estimate = await Estimate.create(req.body);

      return res.status(httpStatus.CREATED).json({
        success: true,
        message: 'Estimate created successfully!',
        data: estimate,
      });
    } catch (error) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Failed to create estimate',
      });
    }
  },
};

// ✅ UPDATE Estimate
const updateEstimate = {
  validation: {
    params: Joi.object().keys({
      id: Joi.string().required(), // Route param :id
    }),
    body: Joi.object().keys({
      customerId: Joi.string().required(),
      estimateNumber: Joi.string().trim().required(),
      date: Joi.date().required(),
      state: Joi.string().trim().required(),
      items: Joi.array()
        .items(
          Joi.object().keys({
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
    try {
      const { id } = req.params;
      const { customerId, estimateNumber, state, items } = req.body;

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

      // 🔍 Check estimate exists
      const estimate = await Estimate.findById(id);
      if (!estimate) {
        throw new ApiError(
          httpStatus.NOT_FOUND,
          'Estimate not found'
        );
      }

      // 🔍 Check duplicate estimateNumber (exclude current)
      const duplicate = await Estimate.findOne({
        estimateNumber,
        _id: { $ne: id },
      });
      if (duplicate) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          'Estimate number already exists'
        );
      }

      // 🔹 GST Calculation for items
      let subTotal = 0;
      let totalTax = 0;

      items.forEach((item) => {
        item.taxableAmount = item.qty * item.rate;
        const taxAmount = (item.taxableAmount * item.taxRate) / 100;

        if (state.toLowerCase() === 'gujarat') {
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

      const grandTotal = subTotal + totalTax;

      // 🔹 Update estimate
      const updatedEstimate = await Estimate.findByIdAndUpdate(
        id,
        {
          ...req.body,
          subTotal,
          totalTax,
          grandTotal,
        },
        { new: true }
      );

      return res.status(httpStatus.OK).json({
        success: true,
        message: 'Estimate updated successfully!',
        data: updatedEstimate,
      });
    } catch (error) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Failed to update estimate',
      });
    }
  },
};

// GET all Estimate
const getAllEstimate = {
  handler: async (req, res) => {
    try {
      // const estimates = await Estimate.find().sort({ createdAt: -1 });

      const estimates = await Estimate.find()
        .populate('customerId')
        .populate('items.item')
        .sort({ createdAt: -1 });


      return res.status(httpStatus.OK).json({
        success: true,
        message: 'Estimates fetched successfully!',
        data: estimates,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch estimates',
      });
    }
  },
};

// ✅ GET Estimate by ID
const getEstimateById = {
  validation: {
    params: Joi.object().keys({
      id: Joi.string().required(),
    }),
  },

  handler: async (req, res) => {
    try {
      const { id } = req.params;

      const estimate = await Estimate.findById(id)
        .populate('customerId')
        .populate('items.item');

      if (!estimate) {
        throw new ApiError(
          httpStatus.NOT_FOUND,
          'Estimate not found'
        );
      }

      return res.status(httpStatus.OK).json({
        success: true,
        message: 'Estimate fetched successfully!',
        data: estimate,
      });
    } catch (error) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Failed to fetch estimate',
      });
    }
  },
};


// ✅ DELETE Estimate
const deleteEstimate = {
  handler: async (req, res) => {
    try {
      const { id } = req.params;
      const estimate = await Estimate.findById(id);

      if (!estimate) {
        return res.status(404).send({ message: "Estimate not found" });
      }

      await Estimate.findByIdAndDelete(id);
      // res.status(httpStatus.OK).send({ message: "Estimate deleted successfully" });
      res.status(200).send({ message: "Estimate deleted successfully" });
    } catch (error) {
      console.error(error); // log real error
      res.status(500).send({ message: "Error deleting Estimate" });
    }
  },
};

const getLastEstimateNumber = async (req, res) => {
  try {
    // Find the latest estimate, sorted by createdAt descending
    const lastEstimate = await Estimate.findOne().sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      lastEstimateNumber: lastEstimate?.estimateNumber || null,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch last estimate number",
    });
  }
};

const getEstimateByNumber = {
  validation: {
    params: Joi.object().keys({
      estimateNumber: Joi.string().trim().required(),
    }),
  },

  handler: async (req, res) => {
    try {
      const { estimateNumber } = req.params;

      // Find estimate and populate customer and items
      const estimate = await Estimate.findOne({ estimateNumber })
        .populate("customerId")      // full customer details
        .populate("items.item");     // full inventory/item details

      if (!estimate) {
        return res.status(httpStatus.NOT_FOUND).json({
          success: false,
          message: "Estimate not found",
        });
      }

      return res.status(httpStatus.OK).json({
        success: true,
        message: "Estimate fetched successfully",
        data: estimate,
      });
    } catch (error) {
      console.error("Error fetching estimate by number:", error);
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Failed to fetch estimate",
      });
    }
  },
};

module.exports = {
  createEstimate,
  getAllEstimate,
  getEstimateById,
  updateEstimate,
  deleteEstimate,
  getLastEstimateNumber,
  getEstimateByNumber
};