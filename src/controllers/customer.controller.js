const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');
const Joi = require('joi');
const { Customer } = require('../models');
const { handlePagination } = require('../utils/helper');

const createCustomer = {
  validation: {
    body: Joi.object().keys({
      name: Joi.string().trim().required(),
      mobile: Joi.string().trim().required(),
      email: Joi.string().email().required(),
      gst_number: Joi.string().allow('', null),
      address: Joi.string().trim().required(),
      city: Joi.string().trim().required(),
      state: Joi.string().trim().required(),
      country: Joi.string().trim().required(),
      pincode: Joi.string().trim().required(),
    }),
  },

  handler: async (req, res) => {
    try {
      const { mobile, gst_number } = req.body;

      // 🔍 Check mobile already exists
      const mobileExist = await Customer.findOne({ mobile });
      if (mobileExist) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          'Mobile number already exists'
        );
      }

      // 🔍 Check GST number already exists (if provided)
      if (gst_number) {
        const gstExist = await Customer.findOne({ gst_number });
        if (gstExist) {
          throw new ApiError(
            httpStatus.BAD_REQUEST,
            'GST number already exists'
          );
        }
      }

      const customer = await Customer.create(req.body);

      return res.status(httpStatus.CREATED).json({
        success: true,
        message: 'Customer created successfully!',
        data: customer,
      });
    } catch (error) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Failed to create customer',
      });
    }
  },
};

const getAllCustomer = {
  handler: async (req, res) => {
    const { status, search } = req.query;

    const query = {};

    if (status) query.status = status;
    if (search) query.title = { $regex: search, $options: "i" };

    await handlePagination(Customer, req, res, query);
  }
}

const getCustomerById = {

  handler: async (req, res) => {
    try {
      const { _id } = req.params;

      // 🔍 Find blog by MongoDB ID
      const pre_recorded = await Customer.findById(_id);

      if (!pre_recorded) {
        return res.status(404).json({ message: "Customer not found" });
      }

      res.status(200).json(pre_recorded);
    } catch (error) {
      console.error("Error fetching blog by ID:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  }
};

const updateCustomer = {
  validation: {
    params: Joi.object().keys({
      id: Joi.string().required(),
    }),
    body: Joi.object().keys({
      name: Joi.string().trim().required(),
      mobile: Joi.string().trim().required(),
      email: Joi.string().email().required(),
      gst_number: Joi.string().allow('', null),
      address: Joi.string().trim().required(),
      city: Joi.string().trim().required(),
      state: Joi.string().trim().required(),
      country: Joi.string().trim().required(),
      pincode: Joi.string().trim().required(),
    }),
  },

  handler: async (req, res) => {
    try {
      const { id } = req.params;
      const { mobile, gst_number } = req.body;

      // 🔍 Check customer exists
      const customer = await Customer.findById(id);
      if (!customer) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Customer not found');
      }

      // 🔍 Mobile duplicate check (exclude current customer)
      const mobileExist = await Customer.findOne({
        mobile,
        _id: { $ne: id },
      });
      if (mobileExist) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          'Mobile number already exists'
        );
      }

      // 🔍 GST duplicate check (exclude current customer)
      if (gst_number) {
        const gstExist = await Customer.findOne({
          gst_number,
          _id: { $ne: id },
        });
        if (gstExist) {
          throw new ApiError(
            httpStatus.BAD_REQUEST,
            'GST number already exists'
          );
        }
      }

      // ✅ Update customer
      const updatedCustomer = await Customer.findByIdAndUpdate(
        id,
        req.body,
        { new: true }
      );

      return res.status(httpStatus.OK).json({
        success: true,
        message: 'Customer updated successfully!',
        data: updatedCustomer,
      });
    } catch (error) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Failed to update customer',
      });
    }
  },
};

const deleteCustomer = {
  handler: async (req, res) => {
    const { _id } = req.params;

    const questionExist = await Customer.findOne({ _id });

    if (!questionExist) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Customer not exist');
    }

    await Customer.findByIdAndDelete(_id);

    res.send({ message: 'Customer deleted successfully' });
  }
}

module.exports = {
  createCustomer,
  getAllCustomer,
  getCustomerById,
  updateCustomer,
  deleteCustomer
};