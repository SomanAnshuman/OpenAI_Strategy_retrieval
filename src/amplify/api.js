import { post } from "aws-amplify/api";
import { fetchAuthSession, getCurrentUser } from "aws-amplify/auth";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({
  path: path.resolve(__dirname, "../../.env"),
});
const API_NAME = process.env.VITE_API_NAME;

async function ensureAuthenticated() {
  await getCurrentUser();
  await fetchAuthSession();
}

export async function getMachiningStrategy(data) {
  await ensureAuthenticated();

  const res = await post({
    apiName: API_NAME,
    path: '/strategy',
    options: {
      body: data,
      authMode: 'userPool',
    },
  }).response;

  return res.body.json();
}