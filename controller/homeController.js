const { findByIdAndDelete } = require("../model/admin/adminModel");
const Product = require("../model/admin/prodectModel");
const User = require("../model/user/userModel");
const bcrypt = require("bcrypt");
const Category = require("../model/admin/categoryModel");

exports.ShopPage = async (req, res) => {
  try {
    const user = req.cookies.jwt;
    const { sort, page = 1, search, categoryQuery } = req.query;
    const limit = 8;
    const skip = (page - 1) * limit;
    let sortOptions = {};
    let filterCriteria = {isDeleted: false,isBlocked:false };
    if (categoryQuery) {
      filterCriteria.category = categoryQuery;
    }
    if (search) {
      filterCriteria.$or = [
        { ProductName: { $regex: new RegExp(search, "i") } },
        { description: { $regex: new RegExp(search, "i") } },
      ];
    }
    switch (sort) {
      case "priceLowHigh":
        sortOptions = { salePrice: 1 };
        break;
      case "priceHighLow":
        sortOptions = { salePrice: -1 };
        break;
      case "newArrivals":
        sortOptions = { createdAt: -1 };
        break;
      case "az":
        sortOptions = { ProductName: 1 };
        break;
      case "za":
        sortOptions = { ProductName: -1 };
        break;
      default:
        sortOptions = { createdAt: -1 };
    }
    const categoryIds = await Category.find({ isDeleted: false }).distinct('_id');
    const products = await Product.find({
          $and: [
        filterCriteria,
        { category: { $in: categoryIds } }
      ]
    })
      .collation({ locale: "en", strength: 2 })
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .exec();
    const categories = await Category.find({ isDeleted: false });
    const totalProducts = await Product.countDocuments(filterCriteria);
    const totalPages = Math.ceil(totalProducts / limit);
    return res.render("user/shop", {
      products,
      sort,
      user,
      currentPage: parseInt(page, 10),
      totalPages,
      search,
      categoryQuery,
      categories,
    });
  } catch (error) {
    console.log(error);
    return res.send(error);
  }
};

exports.userProfile = async (req, res) => {
  const user = await User.findById(req.user.id);
  return res.render("user/myAccount", { user });
};

exports.EditUserProfile = async (req, res) => {
  const { fullName, email, gender, mobilePh, current, newPsw, confirmPsw } =
    req.body;
  let Lowgender = gender.toLowerCase();
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({ success: false, message: "user not exist" });
  }
  if (fullName) {
    user.username = fullName;
  }
  if (mobilePh) {
    user.mobile = mobilePh;
  }
  if (gender) {
    user.gender = Lowgender;
  }

  if (current) {
    let isYes = await bcrypt.compare(current, user.password);
    if (isYes) {
      if (!newPsw.length >= 8 && !confirmPsw.length >= 8) {
        return res
          .status(400)
          .json({
            success: false,
            message: "password must be at least 8 charachters",
          });
      }
      const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[\W_]).{8,}$/;
      if (!passwordRegex.test(newPsw)) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "password must include  at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special charachter ",
          });
      }
      if (newPsw && confirmPsw && newPsw === confirmPsw) {
        bcrypt.hash(newPsw, 10);
        user.password = newPsw;
      }
    } else {
      return res
        .status(404)
        .json({ success: false, message: "current password is incorrect" });
    }
  }
  await user.save();
  return res
    .status(200)
    .json({ success: true, message: "User updated  successfully" });
};

exports.userAddress = async (req, res) => {
  try {
    const addresses = await User.findById(req.user.id);
    res.render("user/addressPage", { addresses });
  } catch (error) {
    console.log(error);
  }
};

exports.manageAddress = async (req, res) => {
  console.log(req.user.id);
  const user = req.user;
  const addresses = await User.findById(req.user.id);
  const addr = addresses.address;
  res.render("user/addressLand", { addr, user });
};

exports.addAddress = async (req, res) => {
  try {
    console.log(req.user);
    const {
      fullName,
      phone,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      country,
      addType,
    } = req.body;
    const user = await User.findById(req.user.id);
    const newAddress = {
      fullName,
      phone,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      country,
      addType,
    };
    user.address.push(newAddress);
    await user.save();
    return res.redirect("/manageAddress");
  } catch (err) {
    console.log(err);
  }
};

exports.getEditAddress = async (req, res) => {
  try {
    const id = req.query.id;
    const userAddress = await User.findOne(
      { "address._id": id },
      { "address.$": 1 }
    );
    const user = userAddress.address[0];
    res.render("user/editAddress", { address: user });
  } catch (error) {
    console.log(error);
  }
};

exports.editAddress = async (req, res) => {
  try {
    const id = req.query.id;
    const {
      fullName,
      phone,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      country,
      addType,
    } = req.body;
    const updatedAddress = await User.findOneAndUpdate(
      { "address._id": id },
      {
        $set: {
          "address.$.fullName": fullName,
          "address.$.phone": phone,
          "address.$.addressLine1": addressLine1,
          "address.$.addressLine2": addressLine2,
          "address.$.city": city,
          "address.$.state": state,
          "address.$.postalCode": postalCode,
          "address.$.country": country,
          "address.$.addType": addType,
        },
      },
      { new: true }
    );
    res.redirect("/manageAddress");
  } catch (error) {
    console.log(error);
    res.send(error);
  }
};

exports.deleteAddress = async (req, res) => {
  try {
    const id = req.query.id;
    const updated = await User.findOneAndUpdate(
      { "address._id": id },
      { $pull: { address: { _id: id } } },
      { new: true }
    );
    return res.status(200).json({ success: true, message: "Address deleted" });
  } catch (error) {
    console.log(error);
    return res
      .status(400)
      .json({ success: false, message: "Something went wrong!" });
  }
};
