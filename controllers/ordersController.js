const Stripe = require("stripe");
const orderModel = require("../models/orderModel");
const productModel = require("../models/productModel");

const NodeCache = require("node-cache");

const nodeCache = new NodeCache();

//stripe configuration
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

exports.createOrder = async (req, res) => {
  try {
    const {
      shippingInfo,
      orderItems,
      paymentMethod,
      paymentInfo,
      itemPrice,
      tax,
      shippingCharges,
      totalAmount,
    } = req.body;
    if (
      !shippingInfo ||
      !orderItems ||
      !itemPrice ||
      !tax ||
      !shippingCharges ||
      !totalAmount
    )
      return res.status(401).json({ message: "Please enter all fields" });

    const order = await orderModel.create({
      user: req.user._id,
      shippingInfo,
      orderItems,
      paymentMethod,
      paymentInfo,
      itemPrice,
      tax,
      shippingCharges,
      totalAmount,
    });

    //stock update
    for (let i = 0; i < orderItems.length; i++) {
      //find Product
      const product = await productModel.findById(orderItems[i].product);
      product.stock -= orderItems[i].quantity;
      await product.save();
    }
    nodeCache.del("order");
    res.status(201).json({
      success: true,
      message: "Order Placed Successfully",
      order,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Error in create Order Api",
      error,
    });
  }
};

exports.getMyOrdersController = async (req, res) => {
  try {
    let order;
    if (nodeCache.has("order")) {
      order = JSON.parse(nodeCache.get("order"));
    } else {
      order = await orderModel.find({ user: req.user._id });
      if (!order) return res.status(401).json({ message: "no order found" });
      nodeCache.set("order", JSON.stringify(order));
    }

    res.status(200).json({
      success: true,
      message: "Your order are fetched",
      order,
      totalOrder: order.length,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Error in My orders Api",
      error,
    });
  }
};

exports.getSingleOrder = async (req, res) => {
  try {
    const order = await orderModel.findById(req.params.id);
    if (!order) return res.status(401).json({ message: "no order found" });

    res.status(200).json({
      success: true,
      message: "Your order fetched",
      order,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Error in My orders Api",
      error,
    });
  }
};

exports.acceptPayment = async (req, res) => {
  try {
    // get amount
    const { totalAmount } = req.body;
    if (!totalAmount)
      return res.status(404).json({ message: "Please enter total Amount" });
    const { client_secret } = await stripe.paymentIntents.create({
      amount: Number(totalAmount * 100),
      currency: "usd",
    });
    res.status(200).json({
      success: true,
      client_secret,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Error in Accept Payment Api",
    });
  }
};

// ====================================

exports.getAllOrdersController = async (req, res) => {
  try {
    let order;
    if (nodeCache.has("order")) {
      order = JSON.parse(nodeCache.get("order"));
    } else {
      order = await orderModel.find();
      if (order.length === 0)
        return res.status(404).json({ message: "product not found" });
    }

    res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Error in Accept Payment Api",
    });
  }
};

//change order status
exports.changeOrderStatus = async (req, res) => {
  try {
    const order = await orderModel.findById(req.params.id);

    if (!order) return res.status(404).json({ message: "Product not found" });

    if (order.orderStatus === "processing") order.orderStatus = "shipped";
    else if ((order.orderStatus = "shipped")) {
      order.orderStatus = "deliverd";
      order.delieverdAt = Date.now();
    } else {
      return res.status(500).send({
        success: false,
        message: "Order already delivered",
      });
    }

    await order.save();
    nodeCache.del(order);
    res.status(200).json({
      success: true,
      message: "order status updated",
      data: order.orderStatus,
    });
  } catch (error) {
    console.log(error);
    if (error.name === "CastError")
      return res.status(500).json({
        success: false,
        message: "Invalid Id",
      });
    res.status(500).json({
      success: false,
      message: "Error in Change Order Status Api",
    });
  }
};
