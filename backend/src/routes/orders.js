const express = require("express");

const Order = require("../models/Order");
const OrderItem = require("../models/OrderItem");
const Product = require("../models/Product");
const { auth, adminOnly } = require("../middleware/auth");

const router = express.Router();

const STATUS = {
  DELIVERED: "1",
  SHIPPED: "2",
  PENDING: "3",
  CANCELLED: "0",
};

router.get("/", auth, async (req, res) => {
  const { includeArchived, archived } = req.query;
  let filter = {};
  if (!req.user.isAdmin) {
    filter = { user: req.user.userId };
  }

  if (archived === "1") {
    filter.isArchived = true;
  } else if (includeArchived !== "1") {
    filter.isArchived = { $ne: true };
  }

  const orders = await Order.find(filter)
    .populate("user", "name")
    .populate({
      path: "orderItems",
      populate: { path: "product", model: "Product" },
    })
    .sort({ createdAt: -1 });

  res.json(orders);
});

router.post("/", auth, async (req, res) => {
  const purchaseCounters = {};

  const orderItemsIds = await Promise.all(
    req.body.orderItems.map(async (orderItem) => {
      const product = await Product.findById(orderItem.product);
      if (!product) {
        throw new Error(`Product not found: ${orderItem.product}`);
      }

      const productId = String(orderItem.product);
      purchaseCounters[productId] = (purchaseCounters[productId] || 0) + Number(orderItem.quantity || 0);

      const createdItem = await OrderItem.create({
        quantity: orderItem.quantity,
        product: orderItem.product,
      });
      return createdItem._id;
    })
  );

  const orderItems = await OrderItem.find({ _id: { $in: orderItemsIds } }).populate(
    "product",
    "price"
  );

  const itemsTotal = orderItems.reduce((sum, item) => {
    const price = item.product?.price || 0;
    return sum + price * item.quantity;
  }, 0);

  const shippingFee = Number(req.body.shippingFee || 0);
  const totalPrice = itemsTotal + (Number.isFinite(shippingFee) ? shippingFee : 0);

  const paymentMethod =
    req.body.paymentMethod && ["Cash on Delivery", "Bank Transfer", "Card Payment"].includes(req.body.paymentMethod)
      ? req.body.paymentMethod
      : "Cash on Delivery";

  const shippingRegion =
    req.body.shippingRegion && ["luzon", "visayas", "mindanao", "overseas"].includes(String(req.body.shippingRegion).toLowerCase())
      ? String(req.body.shippingRegion).toLowerCase()
      : "luzon";

  const createdOrder = await Order.create({
    ...req.body,
    orderItems: orderItemsIds,
    user: req.body.user || req.user.userId,
    paymentMethod,
    shippingRegion,
    shippingFee: Number.isFinite(shippingFee) ? shippingFee : 0,
    totalPrice,
  });

  await Promise.all(
    Object.entries(purchaseCounters).map(([productId, quantity]) => {
      if (!Number.isFinite(quantity) || quantity <= 0) return null;
      return Product.findByIdAndUpdate(productId, {
        $inc: { purchasedCount: quantity },
      });
    })
  );

  const populated = await Order.findById(createdOrder.id).populate({
    path: "orderItems",
    populate: { path: "product", model: "Product" },
  });

  return res.status(201).json(populated);
});

router.put("/:id", auth, adminOnly, async (req, res) => {
  if (!Object.values(STATUS).includes(String(req.body.status))) {
    return res.status(400).json({ message: "Invalid status" });
  }

  if (String(req.body.status) === STATUS.DELIVERED) {
    return res.status(400).json({
      message: "Delivered status must be confirmed by the user",
    });
  }

  const updated = await Order.findByIdAndUpdate(
    req.params.id,
    { status: req.body.status },
    { new: true }
  );
  if (!updated) {
    return res.status(404).json({ message: "Order not found" });
  }
  return res.json(updated);
});

router.post("/:id/cancel", auth, async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }

  const isOwner = String(order.user) === req.user.userId;
  if (!isOwner && !req.user.isAdmin) {
    return res.status(403).json({ message: "Forbidden" });
  }

  if (String(order.status) === STATUS.SHIPPED || String(order.status) === STATUS.DELIVERED) {
    return res.status(400).json({ message: "Order already shipped and cannot be cancelled" });
  }

  if (String(order.status) === STATUS.CANCELLED) {
    return res.status(400).json({ message: "Order is already cancelled" });
  }

  order.status = STATUS.CANCELLED;
  await order.save();

  return res.json(order);
});

router.post("/:id/confirm-delivered", auth, async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }

  const isOwner = String(order.user) === req.user.userId;
  if (!isOwner) {
    return res.status(403).json({ message: "Forbidden" });
  }

  if (String(order.status) !== STATUS.SHIPPED) {
    return res.status(400).json({ message: "Only shipped orders can be confirmed as delivered" });
  }

  order.status = STATUS.DELIVERED;
  await order.save();

  return res.json(order);
});

router.delete("/:id", auth, adminOnly, async (req, res) => {
  const archived = await Order.findByIdAndUpdate(
    req.params.id,
    { isArchived: true },
    { new: true }
  );
  if (!archived) {
    return res.status(404).json({ message: "Order not found" });
  }

  return res.json({ message: "Order archived" });
});

router.put("/:id/archive", auth, adminOnly, async (req, res) => {
  const isArchived = typeof req.body?.isArchived === "boolean" ? req.body.isArchived : true;

  const updated = await Order.findByIdAndUpdate(
    req.params.id,
    { isArchived },
    { new: true }
  )
    .populate("user", "name")
    .populate({ path: "orderItems", populate: { path: "product", model: "Product" } });

  if (!updated) {
    return res.status(404).json({ message: "Order not found" });
  }

  return res.json(updated);
});

router.get("/get/totalsales", auth, adminOnly, async (req, res) => {
  const result = await Order.aggregate([
    {
      $group: {
        _id: null,
        totalsales: { $sum: "$totalPrice" },
      },
    },
  ]);

  if (!result.length) {
    return res.json({ totalsales: 0 });
  }

  return res.json({ totalsales: result[0].totalsales });
});

router.get("/get/count", auth, adminOnly, async (req, res) => {
  const count = await Order.countDocuments();
  return res.json({ orderCount: count });
});

router.get("/:id", auth, async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate("user", "name")
    .populate({
      path: "orderItems",
      populate: { path: "product", model: "Product" },
    });

  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }

  if (!req.user.isAdmin && String(order.user._id) !== req.user.userId) {
    return res.status(403).json({ message: "Forbidden" });
  }

  return res.json(order);
});

module.exports = router;
