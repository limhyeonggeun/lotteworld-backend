const { JWT } = require('google-auth-library');

const SCOPES = ['https://www.googleapis.com/auth/firebase.messaging'];

let serviceAccount;

try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
    console.log("✅ FIREBASE_SERVICE_ACCOUNT_BASE64 환경변수 감지됨");
    const jsonString = Buffer.from(
      process.env.FIREBASE_SERVICE_ACCOUNT_BASE64,
      'base64'
    ).toString('utf-8');
    serviceAccount = JSON.parse(jsonString);
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    console.log("✅ FIREBASE_SERVICE_ACCOUNT 환경변수 감지됨");
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } else {
    throw new Error('❌ FIREBASE_SERVICE_ACCOUNT 관련 환경변수가 존재하지 않습니다.');
  }
} catch (err) {
  console.error("🚨 Firebase Service Account 파싱 오류:", err.message);
  throw err;
}

async function getAccessToken() {
  console.log('🧪 [getAccessToken] client_email:', serviceAccount.client_email);
  console.log('🧪 [getAccessToken] private_key 존재 여부:', !!serviceAccount.private_key);

  const formattedPrivateKey = serviceAccount.private_key.replace(/\\n/g, '\n');

  const jwtClient = new JWT({
    email: serviceAccount.client_email,
    key: formattedPrivateKey,
    scopes: SCOPES,
  });

  const tokens = await jwtClient.authorize();
  console.log('✅ access_token 발급 완료');
  return tokens.access_token;
}

module.exports = getAccessToken;