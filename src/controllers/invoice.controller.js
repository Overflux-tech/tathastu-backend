const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');
const Joi = require('joi');
const Invoice = require('../models/invoice.model');

// POST to add new category (optional, for admin use)
const createInvoice = {
    validation: {
        body: Joi.object().keys({
            estimateNo: Joi.string().required(),
            date: Joi.string().required(),
            placeOfSupply: Joi.string().required(),
            customer: Joi.object({
                name: Joi.string().required(),
                address: Joi.string().allow(""),
                mobile: Joi.string().required(),
                gstn: Joi.string().allow(""),
            }),
            items: Joi.array()
                .items(
                    Joi.object({
                        description: Joi.string().required(),
                        hsnSac: Joi.string().allow(""),
                        quantity: Joi.number().required(),
                        unit: Joi.string().required(),
                        rate: Joi.number().required(),
                        gstRate: Joi.number().required(),
                    })
                )
                .min(1)
                .required(),
        }),
    },

    handler: async (req, res) => {
        try {
            const invoice = await Invoice.create(req.body);
           
            return res.status(201).json({
                success: true,
                message: "Invoice created successfully!",
                data: invoice
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: "Failed to create live course",
                error: error.message,
            });
        }
    }
};

// ✅ UPDATE FAQ
const updateFaq = {
    validation: {
        body: Joi.object().keys({
            title: Joi.string().trim().required(),
            description: Joi.string().trim().required(),
        }),
    },

    handler: async (req, res) => {
        try {
            const { _id } = req.params;
            const updates = req.body;

            const faq = await Invoice.findByIdAndUpdate(_id, updates, { new: true });

            if (!faq) {
                throw new ApiError(httpStatus.NOT_FOUND, "FAQ not found");
            }

            // res.status(httpStatus.OK).send({
            //     status: "success",
            //     code: httpStatus.OK,
            //     data: {
            //         _id: faq._id,
            //         title: faq.title,
            //         description: faq.description,
            //         createdAt: faq.createdAt,
            //         updatedAt: faq.updatedAt,
            //     },
            // });
            res.send({
                success: true,
                message: "Invoice updated successfully!",
                faq
            });
        } catch (error) {
            if (!(error instanceof ApiError)) {
                throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Error updating FAQ");
            }
            throw error;
        }
    },
};

// GET all FAQ
const getAllInvoice = {

    handler: async (req, res) => {
        try {
            const faq = await Invoice.find();

            if (!faq || faq.length === 0) {
                throw new ApiError(httpStatus.NOT_FOUND, "No FAQ found");
            }

            res.status(httpStatus.OK).send(faq);
        } catch (error) {
            // If it's not already an ApiError, wrap it
            if (!(error instanceof ApiError)) {
                throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Error fetching FAQ");
            }
            throw error;
        }
    },
};

// ✅ GET FAQ by ID
const getFaqById = {
    handler: async (req, res) => {
        try {
            const { _id } = req.params;
            const faq = await Invoice.findById(_id);

            if (!faq) {
                throw new ApiError(httpStatus.NOT_FOUND, "FAQ not found");
            }

            res.status(httpStatus.OK).send(faq);
        } catch (error) {
            if (!(error instanceof ApiError)) {
                throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Error fetching FAQ by ID");
            }
            throw error;
        }
    },
};

// ✅ DELETE FAQ
const deleteFaq = {
    handler: async (req, res) => {
        try {
            const { _id } = req.params;
            const faq = await Invoice.findByIdAndDelete(_id);

            if (!faq) {
                throw new ApiError(httpStatus.NOT_FOUND, "FAQ not found");
            }

            // res.status(httpStatus.OK).send({ message: "FAQ deleted successfully" });
            res.status(httpStatus.OK).send({
                status: true,
                code: httpStatus.OK,
                message: "FAQ deleted successfully",
            });
        } catch (error) {
            if (!(error instanceof ApiError)) {
                throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Error deleting FAQ");
            }
            throw error;
        }
    },
};

module.exports = {
    createInvoice,
    getAllInvoice,
    getFaqById,
    updateFaq,
    deleteFaq,
};