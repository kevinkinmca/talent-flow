import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    // Note: We are using process.env.DB_URL here to match your .env file
    const conn = await mongoose.connect(process.env.DB_URL);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};