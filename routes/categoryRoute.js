const express = require("express");
const { isAuth, isAdmin } = require("../middleware/authMiddlware");
const {
  createCategory,
  getAllCategory,
  deleteCategory,
  updateCategory,
} = require("../controllers/categoryController");

const router = express.Router();

router.route("/create").post(isAuth, isAdmin, createCategory);
router.route("/get-all").get(getAllCategory);
router.route("/delete/:id").delete(isAuth, isAdmin, deleteCategory);
router.route("/update/:id").put(isAuth, isAdmin, updateCategory);

module.exports = router;
