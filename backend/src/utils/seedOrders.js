const path = require("path");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

require("dotenv").config({ path: path.resolve(__dirname, "../../.env"), override: true });

const connectDB = require("../config/db");
const Order = require("../models/Order");
const OrderItem = require("../models/OrderItem");
const Product = require("../models/Product");
const User = require("../models/User");

const SAMPLE_ADDRESSES = [
  { shippingAddress1: "Blk 10 Lot 2 Upper Bicutan", city: "Taguig", zip: "1630", country: "Philippines" },
  { shippingAddress1: "72 P. Tuazon Blvd", city: "Quezon City", zip: "1109", country: "Philippines" },
  { shippingAddress1: "14 Rizal Ave", city: "Makati", zip: "1200", country: "Philippines" },
  { shippingAddress1: "88 Mango Ave", city: "Cebu City", zip: "6000", country: "Philippines" },
  { shippingAddress1: "21 E. Lopez St", city: "Davao City", zip: "8000", country: "Philippines" },
];

const PAYMENT_METHODS = ["Cash on Delivery", "Bank Transfer", "Card Payment"];
const SHIPPING_REGIONS = ["luzon", "visayas", "mindanao"];
const STATUS_VALUES = ["3", "2", "1", "0"]; // Pending, Shipped, Delivered, Cancelled

const rand = (max) => Math.floor(Math.random() * max);
const pick = (arr) => arr[rand(arr.length)];

const argValue = (name) => {
  const token = process.argv.find((arg) => arg.startsWith(`--${name}=`));
  if (!token) return "";
  return String(token.split("=")[1] || "").trim();
};

const monthDate = (monthOffset) => {
  const d = new Date();
  d.setMonth(d.getMonth() - monthOffset);
  d.setDate(Math.max(1, rand(28) + 1));
  d.setHours(rand(23), rand(59), rand(59), 0);
  return d;
};

const run = async () => {
  const shouldReset = process.argv.includes("--reset");
  const topUsername = argValue("top-user").toLowerCase();

  await connectDB();

  if (topUsername) {
    const existingTopUser = await User.findOne({ name: new RegExp(`^${topUsername}$`, "i") });
    if (!existingTopUser) {
      const passwordHash = await bcrypt.hash("Password123!", 10);
      await User.create({
        name: topUsername,
        email: `${topUsername}.${Date.now()}@pageturnerr.test`,
        passwordHash,
        isActive: true,
        isAdmin: false,
        phone: "09171234567",
        birthday: "",
        address: "Top User Seed Address",
        avatar: "",
      });
      console.log(`Created top user: ${topUsername}`);
    }
  }

  const users = await User.find({ isActive: true }).select("_id name").lean();
  const topUser = topUsername
    ? users.find((u) => String(u.name || "").toLowerCase() === topUsername)
    : null;
  const products = await Product.find({ isArchived: { $ne: true } })
    .select("_id price purchasedCount")
    .lean();

  if (!users.length) {
    throw new Error("No active users found. Create at least one user before seeding orders.");
  }

  if (!products.length) {
    throw new Error("No active products found. Create at least one product before seeding orders.");
  }

  if (shouldReset) {
    await Order.deleteMany({});
    await OrderItem.deleteMany({});
    console.log("Existing orders and order items removed (--reset).");
  }

  let createdOrders = 0;
  let createdItems = 0;

  // Generate 6 months of data with increasing recency weight.
  for (let monthOffset = 5; monthOffset >= 0; monthOffset -= 1) {
    const baseOrders = 4 + (5 - monthOffset) * 2;
    const ordersThisMonth = baseOrders + rand(3);

    for (let i = 0; i < ordersThisMonth; i += 1) {
      const useTopUser = topUser && rand(100) < 50;
      const user = useTopUser ? topUser : pick(users);
      const address = pick(SAMPLE_ADDRESSES);
      const orderItemsCount = 1 + rand(3);
      const orderItems = [];
      let itemsTotal = 0;

      for (let j = 0; j < orderItemsCount; j += 1) {
        const product = pick(products);
        const quantity = useTopUser ? 2 + rand(4) : 1 + rand(3);

        const orderItem = await OrderItem.create({
          product: product._id,
          quantity,
        });

        orderItems.push(orderItem._id);
        itemsTotal += Number(product.price || 0) * quantity;
        createdItems += 1;

        await Product.findByIdAndUpdate(product._id, {
          $inc: { purchasedCount: quantity },
        });
      }

      const shippingFee = [39, 49, 69, 89][rand(4)];
      const status = pick(STATUS_VALUES);
      const dateOrdered = monthDate(monthOffset);

      await Order.create({
        orderItems,
        shippingAddress1: address.shippingAddress1,
        shippingAddress2: "",
        city: address.city,
        zip: address.zip,
        country: address.country,
        phone: "09171234567",
        paymentMethod: pick(PAYMENT_METHODS),
        shippingRegion: pick(SHIPPING_REGIONS),
        shippingFee,
        status,
        isArchived: false,
        totalPrice: itemsTotal + shippingFee,
        user: user._id,
        dateOrdered,
      });

      createdOrders += 1;
    }
  }

  // Add a strong boost to guarantee top placement for the requested username.
  if (topUser) {
    for (let b = 0; b < 8; b += 1) {
      const address = pick(SAMPLE_ADDRESSES);
      const orderItems = [];
      let itemsTotal = 0;

      for (let j = 0; j < 3; j += 1) {
        const product = pick(products);
        const quantity = 3 + rand(4);

        const orderItem = await OrderItem.create({
          product: product._id,
          quantity,
        });

        orderItems.push(orderItem._id);
        itemsTotal += Number(product.price || 0) * quantity;
        createdItems += 1;

        await Product.findByIdAndUpdate(product._id, {
          $inc: { purchasedCount: quantity },
        });
      }

      const shippingFee = [39, 49, 69, 89][rand(4)];
      await Order.create({
        orderItems,
        shippingAddress1: address.shippingAddress1,
        shippingAddress2: "",
        city: address.city,
        zip: address.zip,
        country: address.country,
        phone: "09171234567",
        paymentMethod: pick(PAYMENT_METHODS),
        shippingRegion: pick(SHIPPING_REGIONS),
        shippingFee,
        status: "1",
        isArchived: false,
        totalPrice: itemsTotal + shippingFee,
        user: topUser._id,
        dateOrdered: monthDate(rand(2)),
      });

      createdOrders += 1;
    }
  }

  console.log(`Seed complete: ${createdOrders} orders, ${createdItems} order items.`);
};

run()
  .catch((error) => {
    console.error("Seed failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.connection.close();
  });
