const { JWT } = require('google-auth-library');

let serviceAccount;

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    console.log("Firebase service account loaded from ENV");
  } catch (err) {
    console.error("FIREBASE_SERVICE_ACCOUNT 파싱 오류:", err);
    throw new Error("Invalid FIREBASE_SERVICE_ACCOUNT JSON");
  }
} else {
  serviceAccount = require('../config/firebase-service-account.json');
  console.log("Firebase service account loaded from local file");
}

const SCOPES = ['https://www.googleapis.com/auth/firebase.messaging'];

async function getAccessToken() {
  console.log('[getAccessToken] client_email:', serviceAccount.client_email);
  console.log('[getAccessToken] private_key 존재 여부:', !!serviceAccount.private_key);

  if (!serviceAccount.private_key || !serviceAccount.client_email) {
    throw new Error('serviceAccount에 필요한 정보가 없습니다.');
  }


  const formattedPrivateKey = serviceAccount.private_key.replace(/\\n/g, '\n');

  const jwtClient = new JWT({
    email: serviceAccount.client_email,
    key: formattedPrivateKey,
    scopes: SCOPES,
  });

  const tokens = await jwtClient.authorize();
  console.log('access_token 발급 완료');
  return tokens.access_token;
}

module.exports = getAccessToken;