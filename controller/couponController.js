const Coupon = require("../model/admin/CouponModel");

exports.getCoupons = async (req, res) => {
  try {
    const searchQuery = req.query.search || "";
    const page = parseInt(req.query.page) || 1; 
    const limit = 4; 
    const skip = (page - 1) * limit;
    const coupons = await Coupon.find({ isDeleted: false,code:{$regex:searchQuery,$options:'i'} }).skip(skip).limit(limit)
    const totalCoupons = await Coupon.countDocuments({
      isDeleted: false,
      code: { $regex: searchQuery, $options: 'i' }
    });
      const totalPages = Math.ceil(totalCoupons / limit);
    if (page < 1 || (page > totalPages && totalPages > 0)) {
      return res.status(400).send("Invalid page number");
    }
    return res.render("admin/coupons", { coupons, coupon: null,search:searchQuery,currentPage:page,totalPages });
  } catch (error) {
    console.log(error);
    return res.send(error);
  }
};

exports.AddCoupon = async (req, res) => {
  try {
    const {
      code,
      start_date,
      end_date,
      minimum,
      maximum,
      discount,
      Maxdiscount,
      status,
    } = req.body;
    const exist = await Coupon.findOne({ code: code });
    if (exist) {
      return res
        .status(400)
        .json({ success: false, message: "coupon code already exist" });
    }
    let discountt = Number(discount);
    const coupon = new Coupon({
      code: code,
      startDate: start_date,
      endDate: end_date,
      minimum: minimum,
      maximum: maximum,
      discount: discountt,
      maximumDiscount: Maxdiscount,
      status: status,
    });
    await coupon.save();
    return res.status(200).json({ success: true, message: "addded" });
  } catch (error) {
    console.log(error);
    return res
      .status(400)
      .json({ success: false, message: "something went wrong!" });
  }
};

exports.CouponDelete = async (req, res) => {
  try {
    const id = req.params.id;
    const coupon = await Coupon.findById(id);
    if (!coupon) {
      return res
        .status(400)
        .json({ success: false, message: "No coupon found" });
    }
    await Coupon.findByIdAndUpdate(id, { isDeleted: true });
    return res.status(200).json({ success: true, message: "coupon Removed!" });
  } catch (error) {
    console.error(error);
    return res
      .status(400)
      .json({ success: false, message: "Something went wrong!" });
  }
};
exports.getEditCoupon = async (req, res) => {
  try {
    const couponID = req.params.id;
    const coupon = await Coupon.findById(couponID);
    if (!coupon) {
      return res.status(404).send("Coupon not found");
    }
    return res.render("admin/EditCoupons", { coupon });
  } catch (error) {
    console.log(error);
    res.status(500).send("Server Error");
  }
};
exports.editCoupon = async (req, res) => {
  try {
    const id = req.params.id;
    const {
      code,
      startDate,
      endDate,
      minimum,
      maximum,
      discount,
      Maxdiscount,
      status,
    } = req.body;
    const existedCode = await Coupon.findById(id);
    if (code != existedCode.code) {
      const already = await Coupon.findOne({ code: code });
      if (already) {
        return res
          .status(400)
          .json({ success: false, message: "Coupon code already exists!" });
      }
    }
    const coupon = await Coupon.findByIdAndUpdate(
      id,
      {
        code: code,
        start_date: startDate,
        end_date: endDate,
        minimum: minimum,
        maximum: maximum,
        discount: discount,
        maximumDiscount: Maxdiscount,
        status: status,
      },
      { new: true }
    );
    return res
      .status(200)
      .json({ success: true, message: "Coupon Updated Succesfully!" });
  } catch (error) {
    console.log(error);
    return res
      .status(400)
      .json({ success: false, message: "Something went wrong!" });
  }
};
