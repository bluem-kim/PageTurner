const path = require("path");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

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

const pick = (list) => list[Math.floor(Math.random() * list.length)];

const makeUsername = (seed) => `${pick(NAME_PREFIXES)}${pick(NAME_SUFFIXES)}${seed}`;

const parseArg = (name, fallback) => {
  const token = process.argv.find((arg) => arg.startsWith(`--${name}=`));
  if (!token) return fallback;
  const value = Number(token.split("=")[1]);
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : fallback;
};

const run = async () => {
  const count = parseArg("count", 10);
  const timestamp = Date.now();
  const defaultPassword = "Password123!";
  const passwordHash = await bcrypt.hash(defaultPassword, 10);

  await connectDB();

  const docs = Array.from({ length: count }).map((_, index) => {
    const n = index + 1;
    const username = makeUsername(`${timestamp}${n}`.slice(-6));
    const emailName = username.toLowerCase();
    return {
      name: username,
      email: `${emailName}.${timestamp}.${n}@pageturnerr.test`,
      passwordHash,
      phone: `0917${String(1000000 + n).slice(-7)}`,
      birthday: "",
      address: `Address ${n}`,
      avatar: "",
      isAdmin: false,
      isActive: true,
    };
  });

  const created = await User.insertMany(docs, { ordered: false });

  console.log(`Seed complete: ${created.length} users added.`);
  console.log(`Default password for seeded users: ${defaultPassword}`);
};

run()
  .catch((error) => {
    console.error("Seed users failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.connection.close();
  });
