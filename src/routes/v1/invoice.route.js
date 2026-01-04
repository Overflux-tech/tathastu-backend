const express = require('express');
const validate = require('../../middlewares/validate');
const auth = require('../../middlewares/auth');
const catchAsync = require('../../utils/catchAsync');
const { invoiceController } = require('../../controllers');

const router = express.Router();

router.post('/create', validate(invoiceController.createInvoice.validation), catchAsync(invoiceController.createInvoice.handler));
router.get('/getall', catchAsync(invoiceController.getAllInvoices.handler));
router.get('/getById/:id', catchAsync(invoiceController.getInvoiceById.handler));
router.put(
  '/update/:id',
  validate(invoiceController.updateInvoice.validation),
  catchAsync(invoiceController.updateInvoice.handler)
);

router.delete('/delete/:_id', catchAsync(invoiceController.deleteInvoice.handler));

module.exports = router;

module.exports = router;