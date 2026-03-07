const express = require("express");
const fs = require("fs/promises");

const Product = require("../models/Product");
const Category = require("../models/Category");
const Order = require("../models/Order");
const { auth, adminOnly } = require("../middleware/auth");
const upload = require("../middleware/upload");
const { uploadImage } = require("../config/cloudinary");

const router = express.Router();

const parseBoolean = (value, fallback = false) => {
  if (value === undefined) return fallback;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  const lowered = String(value).toLowerCase();
  return lowered === "true" || lowered === "1";
};

const parseNumber = (value, fallback = 0) => {
  if (value === undefined || value === null || value === "") return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const parseJsonArray = (value, fallback = []) => {
  if (!value) return fallback;
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch (error) {
    return fallback;
  }
};

const mapPayload = (body, existing = {}) => {
  const parsedSubGenres = parseJsonArray(body.subGenres, existing.subGenres ?? []);

  return {
    name: body.name ?? existing.name,
    author: body.author ?? existing.author ?? existing.brand ?? "",
    description: body.description ?? existing.description ?? "",
    richDescription: body.richDescription ?? existing.richDescription ?? "",
    // Keep brand for compatibility with screens that still read this field.
    brand: body.brand ?? body.author ?? existing.brand ?? existing.author ?? "",
    price: parseNumber(body.price, existing.price ?? 0),
    genre: body.genre ?? existing.genre ?? null,
    category:
      body.category ??
      parsedSubGenres[0] ??
      existing.category ??
      (Array.isArray(existing.subGenres) ? existing.subGenres[0] : undefined),
    subGenres: parsedSubGenres,
    countInStock: parseNumber(body.countInStock, existing.countInStock ?? 0),
    rating: parseNumber(body.rating, existing.rating ?? 0),
    numReviews: parseNumber(body.numReviews, existing.numReviews ?? 0),
    isFeatured: parseBoolean(body.isFeatured, existing.isFeatured ?? false),
    image: body.image ?? existing.image ?? "",
    images: parseJsonArray(body.existingImages, existing.images ?? []),
  };
};

const getUploadedFiles = (filesObj) => {
  if (!filesObj) return [];
  const multi = filesObj.images || [];
  const singleCompat = filesObj.image || [];
  return [...multi, ...singleCompat];
};

const uploadFilesToCloudinary = async (files = [], folder = "pageturnerr/products") => {
  const uploadedUrls = [];

  for (const file of files) {
    const source = file.path || file.buffer;
    if (!source) continue;

    try {
      const uploaded = await uploadImage(source, folder);
      uploadedUrls.push(uploaded.secure_url);
    } finally {
      if (file.path) {
        await fs.unlink(file.path).catch(() => null);
      }
    }
  }

  return uploadedUrls;
};

const recalculateRatings = (reviews = []) => {
  const numReviews = reviews.length;
  if (!numReviews) {
    return { rating: 0, numReviews: 0 };
  }

  const total = reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0);
  return {
    rating: Number((total / numReviews).toFixed(1)),
    numReviews,
  };
};

const normalizeIds = (values = []) => {
  const normalized = values
    .map((v) => String(v || "").trim())
    .filter(Boolean);
  return [...new Set(normalized)];
};

const validateGenres = async (payload) => {
  if (!payload.genre) {
    return "Main genre is required";
  }

  const genre = await Category.findById(payload.genre);
  if (!genre) {
    return "Invalid main genre";
  }

  const normalizedSubs = normalizeIds(payload.subGenres);
  if (normalizedSubs.length > 3) {
    return "Maximum of 3 sub genres only";
  }

  if (normalizedSubs.includes(String(genre._id))) {
    return "Main genre cannot also be a sub genre";
  }

  if (normalizedSubs.length) {
    const subGenreDocs = await Category.find({ _id: { $in: normalizedSubs } }).select("_id");
    if (subGenreDocs.length !== normalizedSubs.length) {
      return "One or more selected sub genres are invalid";
    }
  }

  payload.subGenres = normalizedSubs;
  payload.category = normalizedSubs[0] || payload.genre;
  return null;
};

router.get("/", async (req, res) => {
  const products = await Product.find()
    .populate("genre")
    .populate("category")
    .populate("subGenres")
    .sort({ createdAt: -1 });
  res.json(products);
});

router.get("/get/count", async (req, res) => {
  const count = await Product.countDocuments();
  res.json({ productCount: count });
});

router.get("/get/featured/:count", async (req, res) => {
  const count = Number(req.params.count) || 0;
  const products = await Product.find({ isFeatured: true })
    .limit(count)
    .populate("genre")
    .populate("category")
    .populate("subGenres");
  res.json(products);
});

router.get("/reviews/me", auth, async (req, res) => {
  const products = await Product.find({ "reviews.user": req.user.userId }).select(
    "name image reviews"
  );

  const result = products
    .map((product) => {
      const ownReview = (product.reviews || []).find(
        (review) => String(review.user) === String(req.user.userId)
      );
      if (!ownReview) return null;

      return {
        productId: product.id,
        productName: product.name,
        productImage: product.image,
        review: {
          id: ownReview.id,
          user: ownReview.user,
          rating: ownReview.rating,
          comment: ownReview.comment,
          images: ownReview.images || [],
          order: ownReview.order,
          createdAt: ownReview.createdAt,
        },
      };
    })
    .filter(Boolean);

  return res.json(result);
});

router.get("/:id", async (req, res) => {
  const product = await Product.findById(req.params.id)
    .populate("genre")
    .populate("category")
    .populate("subGenres");
  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }
  return res.json(product);
});

router.post(
  "/:id/reviews",
  auth,
  upload.fields([{ name: "images", maxCount: 5 }]),
  async (req, res) => {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const rating = Number(req.body.rating);
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be from 1 to 5" });
    }

    const orderId = String(req.body.orderId || "").trim();
    if (!orderId) {
      return res.status(400).json({ message: "orderId is required" });
    }

    const deliveredOrder = await Order.findOne({
      _id: orderId,
      user: req.user.userId,
      status: "1",
    }).populate({ path: "orderItems", populate: { path: "product", model: "Product" } });

    if (!deliveredOrder) {
      return res.status(400).json({ message: "Review is allowed only after delivery confirmation" });
    }

    const productInOrder = (deliveredOrder.orderItems || []).some((orderItem) => {
      const orderedProductId = orderItem?.product?.id || orderItem?.product?._id;
      return String(orderedProductId) === String(product._id);
    });

    if (!productInOrder) {
      return res.status(400).json({ message: "This product is not part of the delivered order" });
    }

    const existingReview = (product.reviews || []).find(
      (review) => String(review.user) === String(req.user.userId)
    );

    const reviewImageFiles = req.files?.images || [];
    const reviewImages = reviewImageFiles.length
      ? await uploadFilesToCloudinary(reviewImageFiles, "pageturnerr/reviews")
      : [];

    const existingImages = parseJsonArray(
      req.body.existingImages,
      existingReview?.images || []
    );

    if (existingReview) {
      existingReview.rating = rating;
      existingReview.comment = String(req.body.comment || "").trim();
      existingReview.images = [...existingImages, ...reviewImages];
      existingReview.order = deliveredOrder._id;
      existingReview.createdAt = new Date();
    } else {
      product.reviews.push({
        user: req.user.userId,
        name: req.user.name || "User",
        rating,
        comment: String(req.body.comment || "").trim(),
        images: reviewImages,
        order: deliveredOrder._id,
      });
    }

    const stats = recalculateRatings(product.reviews || []);
    product.rating = stats.rating;
    product.numReviews = stats.numReviews;
    await product.save();

    return res.status(201).json({
      message: existingReview ? "Review updated" : "Review added",
      rating: product.rating,
      numReviews: product.numReviews,
      reviews: product.reviews,
    });
  }
);

router.delete("/:id/reviews/me", auth, async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  const beforeCount = (product.reviews || []).length;
  product.reviews = (product.reviews || []).filter(
    (review) => String(review.user) !== String(req.user.userId)
  );

  if (product.reviews.length === beforeCount) {
    return res.status(404).json({ message: "Review not found" });
  }

  const stats = recalculateRatings(product.reviews || []);
  product.rating = stats.rating;
  product.numReviews = stats.numReviews;
  await product.save();

  return res.json({ message: "Review removed" });
});

router.post(
  "/",
  auth,
  adminOnly,
  upload.fields([
    { name: "images", maxCount: 20 },
    { name: "image", maxCount: 1 },
  ]),
  async (req, res) => {
  const payload = mapPayload(req.body);
  const validationError = await validateGenres(payload);
  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  const uploadedFiles = getUploadedFiles(req.files);
  if (uploadedFiles.length) {
    const uploadedUrls = await uploadFilesToCloudinary(uploadedFiles);
    payload.images = uploadedUrls;
    payload.image = uploadedUrls[0];
  } else if (payload.image && !payload.images.length) {
    payload.images = [payload.image];
  }

  const created = await Product.create(payload);
  const populated = await Product.findById(created.id)
    .populate("genre")
    .populate("category")
    .populate("subGenres");
  res.status(201).json(populated);
}
);

router.put(
  "/:id",
  auth,
  adminOnly,
  upload.fields([
    { name: "images", maxCount: 20 },
    { name: "image", maxCount: 1 },
  ]),
  async (req, res) => {
  const existing = await Product.findById(req.params.id);
  if (!existing) {
    return res.status(404).json({ message: "Product not found" });
  }

  const payload = mapPayload(req.body, existing);
  const validationError = await validateGenres(payload);
  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  const uploadedFiles = getUploadedFiles(req.files);
  if (uploadedFiles.length) {
    const uploadedUrls = await uploadFilesToCloudinary(uploadedFiles);
    payload.images = [...(payload.images || []), ...uploadedUrls];
    payload.image = payload.images[0] || uploadedUrls[0];
  } else if (!payload.images.length && payload.image) {
    payload.images = [payload.image];
  } else if (payload.images.length && !payload.image) {
    payload.image = payload.images[0];
  }

  const updated = await Product.findByIdAndUpdate(req.params.id, payload, {
    new: true,
  }).populate("genre").populate("category").populate("subGenres");

  if (!updated) {
    return res.status(404).json({ message: "Product not found" });
  }
  return res.json(updated);
}
);

router.post(
  "/:id",
  auth,
  adminOnly,
  upload.fields([
    { name: "images", maxCount: 20 },
    { name: "image", maxCount: 1 },
  ]),
  async (req, res) => {
  const existing = await Product.findById(req.params.id);
  if (!existing) {
    return res.status(404).json({ message: "Product not found" });
  }

  const payload = mapPayload(req.body, existing);
  const validationError = await validateGenres(payload);
  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  const uploadedFiles = getUploadedFiles(req.files);
  if (uploadedFiles.length) {
    const uploadedUrls = await uploadFilesToCloudinary(uploadedFiles);
    payload.images = [...(payload.images || []), ...uploadedUrls];
    payload.image = payload.images[0] || uploadedUrls[0];
  } else if (!payload.images.length && payload.image) {
    payload.images = [payload.image];
  } else if (payload.images.length && !payload.image) {
    payload.image = payload.images[0];
  }

  const updated = await Product.findByIdAndUpdate(req.params.id, payload, {
    new: true,
  }).populate("genre").populate("category").populate("subGenres");

  if (!updated) {
    return res.status(404).json({ message: "Product not found" });
  }
  return res.json(updated);
}
);

router.delete("/:id", auth, adminOnly, async (req, res) => {
  const deleted = await Product.findByIdAndDelete(req.params.id);
  if (!deleted) {
    return res.status(404).json({ message: "Product not found" });
  }
  return res.json({ message: "Product deleted" });
});

module.exports = router;
