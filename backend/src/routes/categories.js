const express = require("express");

const Category = require("../models/Category");
const Product = require("../models/Product");
const { auth, adminOnly } = require("../middleware/auth");

const router = express.Router();

router.get("/", async (req, res) => {
  const query = {};
  const { includeSubgenres, parent } = req.query;

  if (parent !== undefined) {
    query.parent = parent === "null" || parent === "" ? null : parent;
  } else if (includeSubgenres !== "1") {
    query.parent = null;
  }

  const categories = await Category.find(query)
    .populate("parent", "name")
    .sort({ name: 1 });
  res.json(categories);
});

router.get("/:id", async (req, res) => {
  const category = await Category.findById(req.params.id).populate("parent", "name");
  if (!category) {
    return res.status(404).json({ message: "Category not found" });
  }
  return res.json(category);
});

router.post("/", auth, adminOnly, async (req, res) => {
  const parentId = req.body.parent || null;

  if (parentId) {
    const parent = await Category.findById(parentId);
    if (!parent) {
      return res.status(400).json({ message: "Invalid main genre" });
    }
    if (parent.parent) {
      return res.status(400).json({ message: "Sub-genre cannot be used as parent" });
    }
  }

  const created = await Category.create({
    name: req.body.name,
    description: req.body.description || "",
    parent: parentId,
  });
  const populated = await Category.findById(created.id).populate("parent", "name");
  res.status(201).json(populated);
});

router.put("/:id", auth, adminOnly, async (req, res) => {
  const parentId = req.body.parent || null;

  if (parentId === req.params.id) {
    return res.status(400).json({ message: "Genre cannot be its own parent" });
  }

  if (parentId) {
    const parent = await Category.findById(parentId);
    if (!parent) {
      return res.status(400).json({ message: "Invalid main genre" });
    }
    if (parent.parent) {
      return res.status(400).json({ message: "Sub-genre cannot be used as parent" });
    }
  }

  const updated = await Category.findByIdAndUpdate(
    req.params.id,
    {
      name: req.body.name,
      description: req.body.description || "",
      parent: parentId,
    },
    { new: true }
  ).populate("parent", "name");
  if (!updated) {
    return res.status(404).json({ message: "Category not found" });
  }
  return res.json(updated);
});

router.delete("/:id", auth, adminOnly, async (req, res) => {
  const hasChildren = await Category.exists({ parent: req.params.id });
  if (hasChildren) {
    return res.status(400).json({
      message: "Delete sub-genres first before deleting this main genre",
    });
  }

  const isUsedInProducts = await Product.exists({
    $or: [{ genre: req.params.id }, { category: req.params.id }],
  });
  if (isUsedInProducts) {
    return res.status(400).json({
      message: "Genre is used by products and cannot be deleted",
    });
  }

  const deleted = await Category.findByIdAndDelete(req.params.id);
  if (!deleted) {
    return res.status(404).json({ message: "Category not found" });
  }
  return res.json({ message: "Genre deleted" });
});

module.exports = router;
