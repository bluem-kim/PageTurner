const express = require("express");
const fs = require("fs/promises");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const { auth, adminOnly } = require("../middleware/auth");
const upload = require("../middleware/upload");
const { uploadImageBuffer, uploadImage } = require("../config/cloudinary");

const router = express.Router();

router.get("/", auth, adminOnly, async (req, res) => {
  const users = await User.find().select("-passwordHash").sort({ createdAt: -1 });
  res.json(users);
});

router.put("/:id/status", auth, adminOnly, async (req, res) => {
  const { isActive } = req.body;
  if (typeof isActive !== "boolean") {
    return res.status(400).json({ message: "isActive must be boolean" });
  }

  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  if (String(user._id) === String(req.user.userId) && !isActive) {
    return res.status(400).json({ message: "You cannot deactivate your own account" });
  }

  user.isActive = isActive;
  await user.save();

  return res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    isAdmin: user.isAdmin,
    isActive: user.isActive,
  });
});

router.put("/:id/role", auth, adminOnly, async (req, res) => {
  const { isAdmin } = req.body;
  if (typeof isAdmin !== "boolean") {
    return res.status(400).json({ message: "isAdmin must be boolean" });
  }

  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  if (String(user._id) === String(req.user.userId) && !isAdmin) {
    return res.status(400).json({ message: "You cannot demote your own admin role" });
  }

  user.isAdmin = isAdmin;
  await user.save();

  return res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    isAdmin: user.isAdmin,
    isActive: user.isActive,
  });
});

router.get("/get/count", auth, adminOnly, async (req, res) => {
  const count = await User.countDocuments();
  res.json({ userCount: count });
});

router.get("/profile", auth, async (req, res) => {
  const user = await User.findById(req.user.userId).select("-passwordHash");
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  return res.json(user);
});

router.post("/change-password", auth, async (req, res) => {
  const { oldPassword, newPassword, confirmNewPassword } = req.body;

  if (!oldPassword || !newPassword || !confirmNewPassword) {
    return res.status(400).json({ message: "All password fields are required" });
  }

  if (String(newPassword).length < 6) {
    return res.status(400).json({ message: "New password must be at least 6 characters" });
  }

  if (newPassword !== confirmNewPassword) {
    return res.status(400).json({ message: "New password confirmation does not match" });
  }

  const current = await User.findById(req.user.userId);
  if (!current) {
    return res.status(404).json({ message: "User not found" });
  }

  const oldPasswordMatch = await bcrypt.compare(oldPassword, current.passwordHash);
  if (!oldPasswordMatch) {
    return res.status(400).json({ message: "Old password is incorrect" });
  }

  current.passwordHash = await bcrypt.hash(String(newPassword), 10);
  await current.save();

  return res.json({ message: "Password changed successfully" });
});

const updateProfile = async (req, res) => {
  const current = await User.findById(req.user.userId);
  if (!current) {
    return res.status(404).json({ message: "User not found" });
  }

  const nextEmail = req.body.email ? String(req.body.email).toLowerCase() : current.email;
  if (nextEmail !== current.email) {
    const duplicate = await User.findOne({ email: nextEmail, _id: { $ne: current._id } });
    if (duplicate) {
      return res.status(400).json({ message: "Email already exists" });
    }
  }

  const updatePayload = {
    name: req.body.name ?? current.name,
    email: nextEmail,
    phone: req.body.phone ?? current.phone,
    birthday: req.body.birthday ?? current.birthday,
    address: req.body.address ?? current.address,
    avatar: req.body.avatar ?? current.avatar,
  };

  if (req.file?.buffer) {
    const uploaded = await uploadImageBuffer(req.file.buffer, "pageturnerr/users");
    updatePayload.avatar = uploaded.secure_url;
  } else if (req.file?.path) {
    try {
      const uploaded = await uploadImage(req.file.path, "pageturnerr/users");
      updatePayload.avatar = uploaded.secure_url;
    } finally {
      await fs.unlink(req.file.path).catch(() => null);
    }
  }

  const updated = await User.findByIdAndUpdate(req.user.userId, updatePayload, {
    new: true,
  }).select("-passwordHash");

  return res.json(updated);
};

router.put("/profile", auth, upload.single("avatar"), updateProfile);
router.post("/profile", auth, upload.single("avatar"), updateProfile);

router.get("/:id", auth, async (req, res) => {
  if (!req.user.isAdmin && req.user.userId !== req.params.id) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const user = await User.findById(req.params.id).select("-passwordHash");
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  return res.json(user);
});

router.post("/register", async (req, res) => {
  const { name, email, password, phone, isAdmin } = req.body;

  const exists = await User.findOne({ email: email?.toLowerCase() });
  if (exists) {
    return res.status(400).json({ message: "Email already exists" });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    email: email.toLowerCase(),
    passwordHash,
    phone,
    birthday: "",
    address: "",
    avatar: "",
    isAdmin: Boolean(isAdmin),
    isActive: true,
  });

  return res.status(201).json({
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    birthday: user.birthday,
    address: user.address,
    avatar: user.avatar,
    isAdmin: user.isAdmin,
    isActive: user.isActive,
  });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email: email?.toLowerCase() });
  if (!user) {
    return res.status(400).json({ message: "Invalid credentials" });
  }

  if (!user.isActive) {
    return res.status(403).json({ message: "Account is deactivated" });
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    return res.status(400).json({ message: "Invalid credentials" });
  }

  const token = jwt.sign(
    {
      userId: user.id,
      isAdmin: user.isAdmin,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  return res.json({
    email: user.email,
    name: user.name,
    phone: user.phone,
    birthday: user.birthday,
    address: user.address,
    avatar: user.avatar,
    userId: user.id,
    isAdmin: user.isAdmin,
    isActive: user.isActive,
    token,
  });
});

module.exports = router;
