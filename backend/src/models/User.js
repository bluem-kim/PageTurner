const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },
    phone: { type: String, default: "" },
    birthday: { type: String, default: "" },
    address: { type: String, default: "" },
    avatar: { type: String, default: "" },
    isAdmin: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

userSchema.virtual("id").get(function getId() {
  return this._id.toHexString();
});

userSchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("User", userSchema);
