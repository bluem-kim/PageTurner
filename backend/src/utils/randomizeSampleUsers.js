const path = require("path");
const mongoose = require("mongoose");

require("dotenv").config({ path: path.resolve(__dirname, "../../.env"), override: true });

const connectDB = require("../config/db");
const User = require("../models/User");

const NAME_PREFIXES = [
  "Swift",
  "Bright",
  "Nova",
  "Echo",
  "Pixel",
  "Lunar",
  "Crimson",
  "Jade",
  "Silver",
  "Blaze",
  "River",
  "Zen",
];

const NAME_SUFFIXES = [
  "Reader",
  "Writer",
  "Voyager",
  "Scholar",
  "Ninja",
  "Falcon",
  "Fox",
  "Panda",
  "Rider",
  "Storm",
  "Comet",
  "Beacon",
];

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

const createCandidate = () => `${pick(NAME_PREFIXES)}${pick(NAME_SUFFIXES)}${Math.floor(100000 + Math.random() * 900000)}`;

const run = async () => {
  await connectDB();

  const existingUsers = await User.find({}).select("_id name email").lean();
  const usedNames = new Set(existingUsers.map((u) => String(u.name || "").toLowerCase()));

  const targets = existingUsers.filter((u) => /^sample\s+user\s+\d+$/i.test(String(u.name || "").trim()));

  if (!targets.length) {
    console.log("No legacy sample users found.");
    return;
  }

  let updated = 0;

  for (let i = 0; i < targets.length; i += 1) {
    const target = targets[i];

    let username = "";
    do {
      username = createCandidate();
    } while (usedNames.has(username.toLowerCase()));

    usedNames.add(username.toLowerCase());

    const email = `${username.toLowerCase()}.${Date.now()}.${i + 1}@pageturnerr.test`;

    await User.findByIdAndUpdate(target._id, {
      name: username,
      email,
    });

    updated += 1;
  }

  console.log(`Randomized ${updated} sample users.`);
};

run()
  .catch((error) => {
    console.error("Randomize users failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.connection.close();
  });
