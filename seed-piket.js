import { config } from "dotenv";
import { MongoClient } from "mongodb";
import bcrypt from "bcrypt";
import * as path from "path";

config({ path: path.resolve(process.cwd(), ".env.local") });

async function seed() {
  const adminCollection = require("./src/app/lib/db").adminCollection;
  const existing = await adminCollection.findOne({
    email: "piket@smkn31jkt.id",
  });
  if (!existing) {
    const hashedPassword = await bcrypt.hash("Adminpiket#1234", 10);
    await adminCollection.insertOne({
      id: crypto.randomUUID(),
      nama: "Guru Piket",
      email: "piket@smkn31jkt.id",
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log("Piket account created successfully.");
  } else {
    console.log("Piket account already exists.");
  }
}

seed()
  .catch(console.error)
  .then(() => process.exit(0));
