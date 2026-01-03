const express = require('express');
const authRoute = require('./auth.route');
const categoryRoute = require('./category.route');
const questionRoute = require('./question.route');
const contactusRoute = require('./contactUs.route')
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
    path: '/question',
    route: questionRoute,
  },
  {
    path: '/contactus',
    route: contactusRoute
  },
  {
    path: '/estimate',
    route: invoiceRoute
  }
];


defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});


module.exports = router;
