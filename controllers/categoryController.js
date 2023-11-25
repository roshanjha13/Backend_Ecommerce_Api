const categoryModel = require("../models/categoryModel");
const NodeCache = require("node-cache");

const nodeCache = new NodeCache();

exports.createCategory = async (req, res) => {
  try {
    const { category } = req.body;
    if (!category) return res.status(401).json({ message: "Enter all fields" });

    const productCategory = await categoryModel.create({ category });
    nodeCache.del("category");
    res.status(201).json({
      message: "Category is created",
      productCategory,
    });
  } catch (error) {
    console.log(error);
    res.status(504).json({
      message: "Error in category api",
      error,
    });
  }
};

exports.getAllCategory = async (req, res) => {
  try {
    let category;
    if (nodeCache.has("category")) {
      category = JSON.parse(nodeCache.get("category"));
    } else {
      category = await categoryModel.find().lean();
      if (category.length === 0)
        return res.status(401).json({ message: "no category found" });

      nodeCache.set("category", JSON.stringify(category));
    }
    res.status(200).json(category);
  } catch (error) {
    console.log(error);
    res.status(504).json({
      message: "Error in get all category api",
      error,
    });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const category = await categoryModel.findByIdAndDelete(req.params.id);
    if (!category)
      return res.status(401).json({ message: "no category found" });

    nodeCache.del("category");

    res.status(200).json({ data: category._id });
  } catch (error) {
    console.log(error);
    res.status(504).json({
      message: "Error in delete category api",
      error,
    });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const category = await categoryModel.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!category)
      return res.status(401).json({ message: "no category found" });
    nodeCache.del("category");
    res
      .status(200)
      .json({ data: category, message: "Category Updated successfully" });
  } catch (error) {
    console.log(error);
    res.status(504).json({
      message: "Error in delete category api",
      error,
    });
  }
};
