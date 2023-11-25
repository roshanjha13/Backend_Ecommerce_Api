const express = require("express");

const {
  createOrder,
  getMyOrdersController,
  getSingleOrder,
  acceptPayment,
  getAllOrdersController,
  changeOrderStatus,
} = require("../controllers/ordersController");
const { isAuth, isAdmin } = require("../middleware/authMiddlware");

const router = express.Router();

router.route("/create").post(isAuth, createOrder);

router.route("/my-orders").get(isAuth, getMyOrdersController);

router.route("/my-orders/:id").get(isAuth, getSingleOrder);

//accept payment
router.route("/payment").post(isAuth, isAdmin, acceptPayment);

router
  .route("/admin/get-all-orders")
  .get(isAuth, isAdmin, getAllOrdersController);
module.exports = router;

router.route("/admin/order/:id").put(isAuth, isAdmin, changeOrderStatus);

module.exports = router;
