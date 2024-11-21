const Order = require("../model/user/orderModel");
const Product = require("../model/admin/prodectModel");
const { loginSubmit } = require("./adminController");

exports.getOrderPage = async (req, res) => {
  try {
    const searchQuery = req.query.search || "";
    const page = req.query.page || 1;
    const limit = 7;
    const skip = (page - 1) * limit;
    let searchfilter = {};
    if (searchQuery) {
      searchfilter = {
        $or: [{ oid: new RegExp(searchQuery, "i") }],
      };
    }
    const orders = await Order.find(searchfilter)
      .populate("products.product")
      .populate("user")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
    const totalOrder = await Order.countDocuments(searchfilter);
    const totalPages = Math.ceil(totalOrder / limit);
    return res.render("admin/orderListing", {
      orders,
      currentPage: page,
      totalPages,
      searchQuery,
    });
  } catch (error) {
    console.log(error);
    return res.send(error);
  }
};

exports.getOrderDetails = async (req, res) => {
  try {
    const id = req.params.id;
    const orders = await Order.findById(id)
      .populate("products.product")
      .populate("user");
    return res.render("admin/orderDetails", { orders });
  } catch (error) {
    console.log(error);
    return res.send(error);
  }
};

exports.ChangeOrder = async (req, res) => {
  try {
    // const {orderId} = req.params
    // console.log("id:  ",orderId);
    let { productId, newStatus, orderId, size } = req.body;
    const order = await Order.findById(orderId);
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }
    const product = order.products.find(
      (p) => p.product.toString() === productId && p.size === size
    );
    if (product) {
      if (
        product.ProductStatus === "Cancelled" ||
        product.ProductStatus === "Returned"
      ) {
        return res.status(400).json({
          success: false,
          message: "Cant Change status of this product!",
        });
      }
      if (
        product.ProductStatus === "Delivered" &&
        (newStatus === "Processing" || newStatus === "Shipped")
      ) {
        return res.status(400).json({
          success: false,
          message: "Cant Change status of this product",
        });
      }
      if (product.ProductStatus === "Shipped" && newStatus === "Processing") {
        return res.status(400).json({
          success: false,
          message: "Cannot change back to processing!",
        });
      }

      product.ProductStatus = newStatus;
      if (newStatus == "Delivered") {
        order.paymentStatus = "Paid";
      }
      const allCancelled = order.products.every(
        (p) => p.ProductStatus === "Cancelled"
      );
      if (allCancelled) {
        order.status = "Cancelled";
      }

      await order.save();
      return res.json({ success: true, message: "Product status updated" });
    } else {
      return res
        .status(404)
        .json({ success: false, message: "Product not found in order" });
    }
  } catch (error) {
    console.log(error);
    return res.send(error);
  }
};

exports.CancelProduct = async (req, res) => {
  try {
    const { OrderID, ProductID, ProductSize } = req.body;
    const order = await Order.findById(OrderID);
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }
    const product = order.products.find(
      (p) => p.product.toString() === ProductID && p.size === ProductSize
    );
    if (product) {
      if (
        product.ProductStatus == "Delivered" ||
        product.ProductStatus == "Returned"
      ) {
        return res.status(400).json({
          success: false,
          message: "Product is not allowed to Cancel",
        });
      }
      if (product.ProductStatus == "Cancelled") {
        return res
          .status(400)
          .json({ success: false, message: "Product already cancelled" });
      }
      if (
        product.ProductStatus == "Processing" ||
        product.ProductStatus == "Shipped"
      ) {
        product.ProductStatus = "Cancelled";
        await order.save();
      }
    }
    let total = Order.find({ "products.Productstatus": "Processing" }).count();
    res.status(200).json({ success: true, message: " Product cancelled" });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ success: false, message: error });
  }
};

exports.ChangePayStatus = async (req, res) => {
  try {
    console.log("inside pay");
    const { orderId, newPaymentStatus } = req.body;
    const order = await Order.findById(orderId);
    console.log(order);
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    if (
      order.paymentStatus === "Paid" &&
      (newPaymentStatus === "Failed" || newPaymentStatus === "Pending")
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot change the status from 'Paid' to 'Failed' or 'Pending'",
      });
    }
    if (order.paymentStatus === "Refunded") {
      return res
        .status(400)
        .json({ success: false, message: "Cannot change the status" });
    }
    order.paymentStatus = newPaymentStatus;
    await order.save();
    res
      .status(200)
      .json({ success: true, message: "Payment status updated successfully" });
  } catch (error) {
    console.log(error);
    return res
      .status(400)
      .json({ success: false, message: "Something went wrong!" });
  }
};
