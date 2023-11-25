const express = require("express");
const {
  register,
  login,
  getMyProfile,
  logout,
  updateProfile,
  updatePassword,
  updateProfilePic,
  resetPassword,
} = require("../controllers/userController");
const { isAuth } = require("../middleware/authMiddlware");
const { singleUpload } = require("../middleware/multer");

const { rateLimit } = require("express-rate-limit");

const router = express.Router();

//rate limiter

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
});

router.route("/register").post(limiter, register);
router.route("/login").post(limiter, login);

router.route("/profile").get(isAuth, getMyProfile);
router.route("/logout").get(isAuth, logout);

router.route("/update-profile").put(isAuth, updateProfile);
router.route("/update-password").put(isAuth, updatePassword);
router.route("/update-picture").put(isAuth, singleUpload, updateProfilePic);

router.route("/reset-password").post(resetPassword);
module.exports = router;
