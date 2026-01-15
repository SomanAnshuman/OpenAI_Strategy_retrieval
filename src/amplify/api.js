import { post } from "aws-amplify/api";
import { fetchAuthSession, getCurrentUser } from "aws-amplify/auth";

async function ensureAuthenticated() {
  await getCurrentUser();
  await fetchAuthSession();
}

export async function getMachiningStrategy(data, env) {
  await ensureAuthenticated();

  const res = await post({
    apiName: env.VITE_API_NAME,
    path: "/strategy",
    options: {
      body: data,
      authMode: "userPool",
    },
  }).response;

  return res.body.json();
}
