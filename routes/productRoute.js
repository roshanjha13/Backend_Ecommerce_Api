const express = require("express");
const {
  getAllProducts,
  createProducts,
  getSingleProduct,
  updateProduct,
  updateProductImage,
  removeProduct,
  removeImageOfProduct,
  productReview,
} = require("../controllers/productController");
const { isAuth, isAdmin } = require("../middleware/authMiddlware");
const { singleUpload } = require("../middleware/multer");

const router = express.Router();

router.route("/get-all").get(getAllProducts);
router.route("/:id").get(getSingleProduct);

router.route("/create").post(isAuth, isAdmin, singleUpload, createProducts);

router.route("/update/:id").put(isAuth, isAdmin, updateProduct);

// router.route("/update-image/:id").put(isAuth, singleUpload, updateProductImage);
router
  .route("/image-update/:id")
  .put(isAuth, isAdmin, singleUpload, updateProductImage);

router.route("/delete/:id").delete(isAuth, isAdmin, removeProduct);
router.route("/delete-image/:id").delete(isAuth, isAdmin, removeImageOfProduct);

router.route("/:id/review").put(isAuth, productReview);
module.exports = router;
