const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');
const Joi = require('joi');
const { Inventory } = require('../models');
const { handlePagination } = require('../utils/helper');
const XLSX = require('xlsx');

const createInventory = {
  validation: {
    body: Joi.object().keys({
      name: Joi.string().trim().required(),
      unit: Joi.string().trim().required(),
      hsn: Joi.string().trim().required(),
      purchase: Joi.string().trim().required(),
    }),
  },

  handler: async (req, res) => {
    try {
      const { name } = req.body;

      // 🔍 Check duplicate inventory name
      const inventoryExist = await Inventory.findOne({
        name: { $regex: `^${name}$`, $options: 'i' }, // case-insensitive
      });

      if (inventoryExist) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          'Inventory name already exists'
        );
      }

      const inventory = await Inventory.create(req.body);

      return res.status(httpStatus.CREATED).json({
        success: true,
        message: 'Inventory created successfully!',
        data: inventory,
      });
    } catch (error) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Failed to create inventory',
      });
    }
  },
};

const getAllInventory = {
    handler: async (req, res) => {
        const { status, search } = req.query;

        const query = {};

        if (status) query.status = status;
        if (search) query.title = { $regex: search, $options: "i" };

        await handlePagination(Inventory, req, res, query);
    }
}

const getInventoryById = {
  validation: {
    params: Joi.object().keys({ id: Joi.string().required() }),
  },

  handler: async (req, res) => {
    const inventory = await Inventory.findById(req.params.id);
    if (!inventory) throw new ApiError(404, 'Inventory not found');

    res.json({
      success: true,
      data: inventory,
    });
  },
};

const updateInventory = {
  validation: {
    params: Joi.object().keys({
      id: Joi.string().required(),
    }),
    body: Joi.object().keys({
      name: Joi.string().trim().required(),
      unit: Joi.string().trim().required(),
      hsn: Joi.string().trim().required(),
      purchase: Joi.string().trim().required(),
    }),
  },

  handler: async (req, res) => {
    try {
      const { id } = req.params;
      const { name } = req.body;

      // 🔍 Check inventory exists
      const inventory = await Inventory.findById(id);
      if (!inventory) {
        throw new ApiError(
          httpStatus.NOT_FOUND,
          'Inventory item not found'
        );
      }

      // 🔍 Duplicate name check (exclude current item)
      const nameExist = await Inventory.findOne({
        name: { $regex: `^${name}$`, $options: 'i' },
        _id: { $ne: id },
      });

      if (nameExist) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          'Inventory name already exists'
        );
      }

      // ✅ Update inventory
      const updatedInventory = await Inventory.findByIdAndUpdate(
        id,
        req.body,
        { new: true }
      );

      return res.status(httpStatus.OK).json({
        success: true,
        message: 'Inventory updated successfully!',
        data: updatedInventory,
      });
    } catch (error) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Failed to update inventory',
      });
    }
  },
};

const deleteInventory = {
    handler: async (req, res) => {
        const { _id } = req.params;

        const inventoryExist = await Inventory.findOne({ _id });
        if (!inventoryExist) {
            throw new ApiError(httpStatus.BAD_REQUEST, 'Inventory not exist');
        }

        await Inventory.findByIdAndDelete(_id);

        res.send({ message: 'Inventory deleted successfully' });
    }
}

const uploadInventoryExcel = {
  handler: async (req, res) => {
    try {
      if (!req.file) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Excel file is required');
      }

      // 📄 Read Excel
      const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(sheet);

      if (!rows.length) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Excel file is empty');
      }

      const insertData = [];
      const skippedData = [];

      for (const row of rows) {
        if (!row.name || !row.unit || !row.hsn || !row.purchase) {
          skippedData.push({ row, reason: 'Missing required fields' });
          continue;
        }

        // 🔍 Duplicate name check (case-insensitive)
        const exists = await Inventory.findOne({
          name: { $regex: `^${row.name}$`, $options: 'i' },
        });

        if (exists) {
          skippedData.push({ row, reason: 'Inventory name already exists' });
          continue;
        }

        insertData.push({
          name: row.name,
          unit: row.unit,
          hsn: row.hsn,
          purchase: row.purchase,
        });
      }

      // ✅ Bulk Insert
      const savedData = await Inventory.insertMany(insertData);

      return res.status(httpStatus.CREATED).json({
        success: true,
        message: 'Excel inventory upload completed',
        totalInserted: savedData.length,
        totalSkipped: skippedData.length,
        skippedData,
        data: savedData,
      });
    } catch (error) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Excel upload failed',
      });
    }
  },
};

module.exports = {
    createInventory,
    getAllInventory,
    getInventoryById,
    updateInventory,
    deleteInventory,
    uploadInventoryExcel
};