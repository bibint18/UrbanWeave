const Admin = require("../model/admin/adminModel");
const User = require("../model/user/userModel");
const jwtService = require("../services/jwtService");
const bcrypt = require("bcrypt");
exports.getAdminLogin = (req, res) => {
  res.render("admin/admin-login", { error: null });
};
exports.loginSubmit = async (req, res) => {
  const { email, password } = req.body;
  console.log("ema", email, "pass", password);
  if (!email || email.trim() == "" || !password || password.trim() == "") {
    return res.render("admin/admin-login", {
      error: "Input cannot be empty or spaces only!",
    });
  }
  console.log(email, password);
  const admin = await Admin.findOne({ email });
  console.log(admin);
  if (admin && (await admin.comparePassword(password))) {
    const token = jwtService.signAdminToken(admin);
    res.cookie("jwt_admin", token, { httpOnly: true, secure: false });
    req.session.loggedIn = true;
    return res.redirect("/admin/dashboard");
  } else {
    res.render("admin/admin-login", { error: "invalid Username or Password" });
  }
};
exports.getDashboard = (req, res) => {
  res.render("admin/dashboard", {
    detailedOrders: [],
    topProducts: [],
    topCategory: [],
  });
};
exports.ListUsers = async (req, res) => {
  try {
    let page = req.query.page || 1;
    let limit = 4;
    let skip = (page - 1) * limit;
    let totalUsers = await User.countDocuments();
    let totalPages = Math.ceil(totalUsers / limit);
    const users = await User.find({}).skip(skip).limit(limit);
    res.render("admin/users", { users, currentPage: page, totalPages,search:null });
  } catch (err) {
    console.log(err);
  }
};

exports.blockUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findByIdAndUpdate(userId, { isBlocked: true });
    return res.send("user blocked succesfully");
  } catch (err) {
    console.log(err);
  }
};

exports.unblockUser = async (req, res) => {
  try {
    const userId = req.params.id;
    await User.findByIdAndUpdate(userId, { isBlocked: false });
    return res.send("user unbloked");
  } catch (err) {
    return res.send("error unblocking user");
  }
};

exports.searchUser = async (req, res) => {
  const searchQuery = req.query.search;
  let page = req.query.page || 1;
  let limit = 4;
  let skip = (page - 1) * limit;
  const totalUser = await User.find({
    $or: [
      { username: { $regex: searchQuery, $options: "i" } },
      { email: { $regex: searchQuery, $options: "i" } },
    ],
  }).countDocuments();
  const totalPages = Math.ceil(totalUser / limit);
  const users = await User.find({
    $or: [
      { username: { $regex: searchQuery, $options: "i" } },
      { email: { $regex: searchQuery, $options: "i" } },
    ],
  })
    .skip(skip)
    .limit(limit);
  return res.render("admin/users", { users, currentPage: page, totalPages ,search:searchQuery});
};

exports.logout = (req, res) => {
  res.cookie("jwt_admin", "", { httpOnly: true, expires: new Date(0) });
  return res.redirect("/admin/login");
};
