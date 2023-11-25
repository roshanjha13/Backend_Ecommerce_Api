const productModel = require("../models/productModel");
const { getDataUri } = require("../utils/feature");
const cloudinary = require("cloudinary");

const NodeCache = require("node-cache");

const nodeCache = new NodeCache();

exports.getAllProducts = async (req, res) => {
  const { keyword, category } = req.query;
  try {
    let product;
    if (nodeCache.has("product")) {
      product = JSON.parse(nodeCache.get("product"));
    } else {
      product = await productModel
        .find({
          name: {
            $regex: keyword ? keyword : "",
            $options: "i",
          },
          category: category ? category : undefined,
        })
        .populate("category")
        .lean();
      if (product.length === 0)
        return res.status(401).json({ message: "Product are not found" });
      nodeCache.set("category", JSON.stringify(product));
    }
    res.status(200).json({ totalLength: product.length, data: product });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error in get all products api",
      error,
    });
  }
};

exports.getSingleProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await productModel.findById(id);

    if (!product) return res.status(401).json({ message: "no product found" });
    res.status(200).json({ data: product });
    console.log(product);
  } catch (error) {
    console.log(error);
    if (error.name === "CastError") {
      return res.status(500).json({
        success: false,
        message: "Invalid id",
      });
    }
    res.status(500).send({
      success: false,
      message: "Error in get single products api",
      error,
    });
  }
};

exports.createProducts = async (req, res) => {
  try {
    const { name, description, price, stock, phone, company } = req.body;
    if (!name || !description || !price || !stock || !phone || !company)
      return res
        .status(400)
        .json({ message: " please enter all fields currectly" });

    if (!req.file) {
      return res.status(500).json({
        success: false,
        message: "please provide product images",
      });
    }
    const file = getDataUri(req.file);

    const cdb = await cloudinary.v2.uploader.upload(file.content);

    const image = {
      public_id: cdb.public_id,
      url: cdb.secure_url,
    };

    const product = await productModel.create({
      name,
      description,
      price,
      stock,
      phone,
      images: [image],
      company,
      category: req.body.category,
    });

    nodeCache.del("product");
    res.status(201).json({
      success: true,
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error in create products api",
      error,
    });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await productModel.findByIdAndUpdate(id, req.body, {
      new: true,
    });
    nodeCache.del("product");
    res.status(200).json({
      message: "Product updated Successfully",
      product,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error in create products api",
      error,
    });
  }
};
exports.updateProductImage = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await productModel.findByIdAndUpdate(id);
    if (!product) {
      return res.status(404).json({ message: "product not found" });
    }
    if (!req.file) {
      return res.status(500).json({
        success: false,
        message: "product images not found",
      });
    }

    const file = getDataUri(req.file);
    const cdb = await cloudinary.v2.uploader.upload(file.content);

    const image = {
      public_id: cdb.public_id,
      url: cdb.secure_url,
    };
    console.log(image);
    product.images.push(image);
    await product.save();

    nodeCache.del("product");

    res.status(200).json({
      message: "Product Image updated Successfully",
      product,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error in create products api",
      error,
    });
  }
};

exports.removeProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await productModel.findById(id);
    if (!product)
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });

    for (let index = 0; index < product.images.length; index++) {
      await cloudinary.v2.uploader.destroy(product.images[index].public_id);
    }
    await product.deleteOne();
    nodeCache.del("product");
    res.status(200).json({ message: `product is deleted ${product.id}` });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error in remove products api",
      error,
    });
  }
};

exports.removeImageOfProduct = async (req, res) => {
  try {
    const product = await productModel.findById(req.params.id);

    if (!product)
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });

    const id = req.query.id;
    if (!id)
      return res.status(404).json({
        success: false,
        message: "Product Image not found",
      });

    let isExist = -1;

    product.images.forEach((item, index) => {
      if (item._id.toString() === id.toString()) isExist = index;
    });

    if (isExist < 0)
      return res.status(404).send({
        success: false,
        message: "Image Not Found",
      });

    await cloudinary.v2.uploader.destroy(product.images[isExist].public_id);
    product.images.splice(isExist, 1);

    await product.save();
    nodeCache.del("product");
    res.status(200).json({ message: `product's image deleted successfully` });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error in remove products image api",
      error,
    });
  }
};

exports.productReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    //find product
    const { id } = req.params;
    const product = await productModel.findById(id);
    //check previous  reviews
    const alreadyReviewed = product.reviews.find(
      (r) => r.user.toString() === req.user._id.toString()
    );
    console.log(alreadyReviewed);
    if (alreadyReviewed) {
      return res.status(401).json({
        success: false,
        message: "Product Already Reviewed",
      });
    }
    const review = {
      name: req.user.name,
      rating: Number(rating),
      comment,
      user: req.user._id,
    };

    //passing review object to review array
    product.reviews.push(review);
    product.numReviews = product.reviews.length;
    product.rating =
      product.reviews.reduce((acc, item) => item.rating + acc, 0) /
      product.reviews.length;
    await product.save();
    res.status(200).send({
      success: true,
      message: "Review Added",
    });
  } catch (error) {
    console.log(error);
    if (error.name === "CastError") {
      return res.status(500).json({
        success: false,
        message: "Invalid id",
      });
    }

    res.status(500).send({
      success: false,
      message: "Error in review comment api",
      error,
    });
  }
};
