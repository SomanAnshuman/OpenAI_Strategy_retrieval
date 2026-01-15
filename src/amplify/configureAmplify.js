import { Amplify } from 'aws-amplify';
import { getCurrentUser, signIn } from 'aws-amplify/auth';

export function configureAmplify(env) {
  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId: env.VITE_COGNITOR_USER_POOL_ID,
        userPoolClientId: env.VITE_COGNITOR_APP_CLIENT_ID,
        identityPoolId: env.VITE_COGNITOR_IDENTITY_POOL_ID,
        region: env.VITE_COGNITOR_REGION,
        mandatorySignIn: true,
      },
    },

    API: {
      REST: {
        [env.VITE_API_NAME]: {
          endpoint: env.VITE_GATEWAY_URL,
          region: env.VITE_GATEWAY_REGION,
        },
      },
    },

    Storage: {
      S3: {
        bucket: env.VITE_S3_BUCKET,
        region: env.VITE_S3_REGION,
        identityPoolId: env.VITE_COGNITOR_IDENTITY_POOL_ID,
        isObjectLockEnabled: true,
      },
    },
  });
}

export async function signInUser() {
  try {
    await signIn({
      username: process.env.TEST_USERNAME,
      password: process.env.TEST_PASSWORD,
    });

    const user = await getCurrentUser();
    console.log("Signed in as:", user.username);
  } catch (err) {
    console.error("Sign-in failed:", err);
    throw err;
  }
}