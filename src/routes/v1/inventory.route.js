const express = require('express');
const validate = require('../../middlewares/validate');
const auth = require('../../middlewares/auth');
const catchAsync = require('../../utils/catchAsync');
const { inventoryController } = require('../../controllers');

const router = express.Router();

router.post('/create', validate(inventoryController.createInventory.validation), catchAsync(inventoryController.createInventory.handler));
router.get('/getall', catchAsync(inventoryController.getAllInventory.handler));
router.put(
  '/update/:id',
  validate(inventoryController.updateInventory.validation),
  catchAsync(inventoryController.updateInventory.handler)
);

router.delete('/delete/:_id', catchAsync(inventoryController.deleteInventory.handler));

module.exports = router;