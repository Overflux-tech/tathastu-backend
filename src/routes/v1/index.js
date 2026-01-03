const express = require('express');
const authRoute = require('./auth.route');
const categoryRoute = require('./category.route');
const customerRoute = require('./customer.route');
const contactusRoute = require('./contactUs.route')
const estimateRoute = require('./estimate.route')
const inventoryRoute = require('./inventory.route')
const invoiceRoute = require('./invoice.route')

const router = express.Router();

const defaultRoutes = [
  {
    path: '/auth',
    route: authRoute,
  },
  {
    path: '/category',
    route: categoryRoute,
  },
  {
    path: '/customer',
    route: customerRoute,
  },
  {
    path: '/inventory',
    route: inventoryRoute,
  },
  {
    path: '/invoice',
    route: invoiceRoute,
  },
  {
    path: '/contactus',
    route: contactusRoute
  },
  {
    path: '/estimate',
    route: estimateRoute
  }
];


defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});


module.exports = router;
