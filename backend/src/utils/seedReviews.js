const path = require("path");
const mongoose = require("mongoose");

require("dotenv").config({ path: path.resolve(__dirname, "../../.env"), override: true });

const connectDB = require("../config/db");
const User = require("../models/User");
const Order = require("../models/Order");
require("../models/OrderItem");
const Product = require("../models/Product");

const COMMENT_TEMPLATES = [
  "Great read. The pacing and story were enjoyable.",
  "Worth buying. Quality and content met expectations.",
  "I liked this title and would recommend it.",
  "Solid purchase. Arrived as expected and reads well.",
  "Good value for money. Satisfied with this item.",
];

const pick = (list) => list[Math.floor(Math.random() * list.length)];

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

const makeComment = (productName) => {
  const safeName = String(productName || "this item").trim();
  return `${pick(COMMENT_TEMPLATES)} (${safeName})`;
};

const run = async () => {
  await connectDB();

  const manualUsers = await User.find({
    isAdmin: false,
    email: { $not: /@pageturnerr\.test$/i },
  })
    .select("_id name email")
    .lean();

  if (!manualUsers.length) {
    console.log("No manually registered non-admin users found.");
    return;
  }

  const userIds = manualUsers.map((u) => u._id);

  const deliveryUpdate = await Order.updateMany(
    { user: { $in: userIds }, status: { $ne: "1" } },
    { $set: { status: "1" } }
  );

  const orders = await Order.find({
    user: { $in: userIds },
    status: "1",
  })
    .populate({ path: "orderItems", select: "product" })
    .select("_id user orderItems dateOrdered status")
    .lean();

  if (!orders.length) {
    console.log("No eligible non-cancelled orders found for manually registered users.");
    return;
  }

  const reviewTargets = new Map();
  // Key format: userId::productId => { userId, userName, productId, orderId, createdAt }
  for (const order of orders) {
    const userId = String(order.user);
    const user = manualUsers.find((u) => String(u._id) === userId);
    if (!user) continue;

    for (const orderItem of order.orderItems || []) {
      const productId = String(orderItem?.product || "").trim();
      if (!productId) continue;

      const key = `${userId}::${productId}`;
      if (!reviewTargets.has(key)) {
        reviewTargets.set(key, {
          userId,
          userName: user.name || "User",
          productId,
          orderId: order._id,
          createdAt: order.dateOrdered || new Date(),
        });
      }
    }
  }

  const productIds = [...new Set([...reviewTargets.values()].map((t) => t.productId))];
  const products = await Product.find({ _id: { $in: productIds } });
  const productById = new Map(products.map((p) => [String(p._id), p]));

  let createdReviews = 0;
  let skippedExisting = 0;
  let updatedProducts = 0;

  const touchedProductIds = new Set();

  for (const target of reviewTargets.values()) {
    const product = productById.get(target.productId);
    if (!product) continue;

    const alreadyReviewed = (product.reviews || []).some(
      (review) => String(review.user) === target.userId
    );

    if (alreadyReviewed) {
      skippedExisting += 1;
      continue;
    }

    product.reviews.push({
      user: target.userId,
      name: target.userName,
      rating: Math.random() < 0.65 ? 5 : 4,
      comment: makeComment(product.name),
      images: [],
      order: target.orderId,
      createdAt: target.createdAt,
    });

    createdReviews += 1;
    touchedProductIds.add(String(product._id));
  }

  for (const productId of touchedProductIds) {
    const product = productById.get(productId);
    if (!product) continue;

    const stats = recalculateRatings(product.reviews || []);
    product.rating = stats.rating;
    product.numReviews = stats.numReviews;
    await product.save();
    updatedProducts += 1;
  }

  console.log(`Manual users processed: ${manualUsers.length}`);
  console.log(`Orders forced to delivered: ${deliveryUpdate.modifiedCount || 0}`);
  console.log(`Eligible orders scanned: ${orders.length}`);
  console.log(`Reviews created: ${createdReviews}`);
  console.log(`Already had review (skipped): ${skippedExisting}`);
  console.log(`Products updated: ${updatedProducts}`);
};

run()
  .catch((error) => {
    console.error("Seed reviews failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.connection.close();
  });
