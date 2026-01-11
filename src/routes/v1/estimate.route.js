const express = require('express');
const validate = require('../../middlewares/validate');
const auth = require('../../middlewares/auth');
const catchAsync = require('../../utils/catchAsync');
const { estimateController } = require('../../controllers');

const router = express.Router();

router.post('/create', validate(estimateController.createEstimate.validation), catchAsync(estimateController.createEstimate.handler));
router.get('/getAll', catchAsync(estimateController.getAllEstimate.handler));
router.get('/getById/:id', catchAsync(estimateController.getEstimateById.handler));
router.put('/update/:id', validate(estimateController.updateEstimate.validation), catchAsync(estimateController.updateEstimate.handler));
router.delete('/delete/:id', catchAsync(estimateController.deleteEstimate.handler));
router.get('/last-estimate-number', catchAsync(estimateController.getLastEstimateNumber));
router.get(
  "/by-number/:estimateNumber",
  validate(estimateController.getEstimateByNumber.validation),
  catchAsync(estimateController.getEstimateByNumber.handler)
);

module.exports = router;