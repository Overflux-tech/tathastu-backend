const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');
const Joi = require('joi');
const { Estimate } = require('../models');

// POST to add new category (optional, for admin use)
const createEstimate = {
  validation: {
    body: Joi.object().keys({
      customerName: Joi.string().trim().required(),
      estimateNumber: Joi.string().trim().required(),
      date: Joi.date().required(),
      state: Joi.string().trim().required(),
      items: Joi.array()
        .items(
          Joi.object().keys({
            item: Joi.string().trim().required(),
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
      const { estimateNumber } = req.body;

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
      customerName: Joi.string().trim().required(),
      estimateNumber: Joi.string().trim().required(),
      date: Joi.date().required(),
      state: Joi.string().trim().required(),
      items: Joi.array()
        .items(
          Joi.object().keys({
            item: Joi.string().trim().required(),
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
      const { estimateNumber, state, items } = req.body;

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
      const estimates = await Estimate.find().sort({ createdAt: -1 });

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

      const estimate = await Estimate.findById(id);
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
            const { _id } = req.params;
            const faq = await Estimate.findByIdAndDelete(_id);

            if (!faq) {
                throw new ApiError(httpStatus.NOT_FOUND, "Estimate not found");
            }

            // res.status(httpStatus.OK).send({ message: "Estimate deleted successfully" });
            res.status(httpStatus.OK).send({
                status: true,
                code: httpStatus.OK,
                message: "Estimate deleted successfully",
            });
        } catch (error) {
            if (!(error instanceof ApiError)) {
                throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Error deleting Estimate");
            }
            throw error;
        }
    },
};

module.exports = {
    createEstimate,
    getAllEstimate,
    getEstimateById,
    updateEstimate,
    deleteEstimate,
};