const Order = require("../model/user/orderModel");
const moment = require("moment");

exports.fetchReport = async (req, res) => {
  try {
    const { type, startDate, endDate } = req.query;
    console.log("from params: ", type, startDate, endDate);
    let filter = {};
    let start = new Date();
    let end = new Date();
    if (type == "daily") {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else if (type == "weekly") {
      start.setDate(start.getDate() - 7);
    } else if (type == "monthly") {
      start.setMonth(start.getMonth() - 1);
    } else if (type == "yearly") {
      start.setFullYear(start.getFullYear() - 1);
    } else if (type == "custom") {
      if (!startDate || !endDate) {
        return res
          .status(400)
          .json({
            success: false,
            message: "Start Date and End dates are required",
          });
      }
      start = new Date(startDate);
      end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
    }
    filter.createdAt = { $gte: start, $lte: end };
    console.log(filter);
    const orders = await Order.find(filter)
      .populate("user")
      .populate("products.product");
    console.log("ord: ", orders);
    let totalRevenue = 0;
    let totalDiscounts = 0;
    let totalCouponDeductions = 0;
    let totalOrders = orders.length;
    console.log(totalOrders);
    const salesData = {
      labels: [],
      sales: [],
      couponDeductions: [],
      offerAmounts: [],
    };
    orders.forEach((order) => {
      totalRevenue += order.AmountPaid;
      totalDiscounts += order.CategoryOffer;
      totalCouponDeductions += order.CouponDiscount;

      const period = moment(order.createdAt).format("YYYY-MM-DD");
      if (!salesData.labels.includes(period)) {
        salesData.labels.push(period);
        salesData.sales.push(order.AmountPaid);
        salesData.couponDeductions.push(order.CouponDiscount || 0); // Add coupon deduction
        salesData.offerAmounts.push(order.CategoryOffer || 0); // Add offer amount
      } else {
        const index = salesData.labels.indexOf(period);
        salesData.sales[index] += order.AmountPaid;
        salesData.couponDeductions[index] += order.CouponDiscount || 0;
        salesData.offerAmounts[index] += order.CategoryOffer || 0;
      }
    });
    return res.status(200).json({
      success: true,
      report: {
        totalRevenue,
        totalDiscounts,
        totalCouponDeductions,
        totalOrders,
        salesData,
      },
    });
  } catch (error) {
    console.log(error);
    return res
      .status(400)
      .json({ success: false, message: "something went wrong!" });
  }
};
