const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    orderItems: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "OrderItem",
        required: true,
      },
    ],
    shippingAddress1: { type: String, required: true },
    shippingAddress2: { type: String, default: "" },
    city: { type: String, required: true },
    zip: { type: String, required: true },
    country: { type: String, required: true },
    phone: { type: String, required: true },
    paymentMethod: {
      type: String,
      enum: ["Cash on Delivery", "Bank Transfer", "Card Payment"],
      default: "Cash on Delivery",
    },
    shippingRegion: {
      type: String,
      enum: ["luzon", "visayas", "mindanao", "overseas"],
      default: "luzon",
    },
    shippingFee: { type: Number, default: 0 },
    status: { type: String, default: "3" },
    totalPrice: { type: Number, default: 0 },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    dateOrdered: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

orderSchema.virtual("id").get(function getId() {
  return this._id.toHexString();
});

orderSchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("Order", orderSchema);
