const express = require('express');
const validate = require('../../middlewares/validate');
const auth = require('../../middlewares/auth');
const catchAsync = require('../../utils/catchAsync');
const { invoiceController } = require('../../controllers');

const router = express.Router();

router.post('/create', validate(invoiceController.createInvoice.validation), catchAsync(invoiceController.createInvoice.handler));
router.get('/getAll', catchAsync(invoiceController.getAllInvoice.handler));
router.get('/getById/:_id', catchAsync(invoiceController.getFaqById.handler));
router.put('/update/:_id', validate(invoiceController.updateFaq.validation), catchAsync(invoiceController.updateFaq.handler));
router.delete('/delete/:_id', catchAsync(invoiceController.deleteFaq.handler));

module.exports = router;