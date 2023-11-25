const jwt = require("jsonwebtoken");
const userModel = require("../models/userModel");

//user auth
exports.isAuth = async (req, res, next) => {
  const { token } = req.cookies;

  //validation
  if (!token) {
    return res.status(401).json({
      success: false,
      message: "UnAuthorised User",
    });
  }

  const decodeData = jwt.verify(token, process.env.JWT_SECRET_KEY);
  req.user = await userModel.findById(decodeData._id);
  next();
};

//admin auth

exports.isAdmin = async (req, res, next) => {
  if (req.user.role !== "admin")
    return res.status(404).json({ success: false, message: "admin only" });

  next();
};
