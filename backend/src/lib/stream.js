import { StreamClient } from "@stream-io/node-sdk";
import dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.STREAM_API_KEY;
const apiSecret = process.env.STREAM_API_SECRET; // Matches your .env name

if (!apiKey || !apiSecret) {
  throw new Error("Stream keys are missing in .env");
}

export const streamClient = new StreamClient(apiKey, apiSecret);

export const upsertStreamUser = async (user) => {
  await streamClient.upsertUsers([
    {
      id: user._id.toString(),
      username: user.name,
      name: user.name,
      image: user.image,
    },
  ]);
};