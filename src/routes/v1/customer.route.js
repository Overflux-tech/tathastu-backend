const express = require('express');
const validate = require('../../middlewares/validate');
const auth = require('../../middlewares/auth');
const catchAsync = require('../../utils/catchAsync');
const { customerController } = require('../../controllers');

const router = express.Router();

router.post('/create', validate(customerController.createCustomer.validation), catchAsync(customerController.createCustomer.handler));
// router.post('/create-question', auth(), validate(customerController.createQuestion.validation), catchAsync(customerController.createQuestion.handler));
router.get('/getall', catchAsync(customerController.getAllCustomer.handler));
router.get('/getById/:_id', catchAsync(customerController.getCustomerById.handler));
router.put('/update/:id', validate(customerController.updateCustomer.validation), catchAsync(customerController.updateCustomer.handler));

router.delete('/delete/:_id', catchAsync(customerController.deleteCustomer.handler));

module.exports = router;