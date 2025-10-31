const { JWT } = require('google-auth-library');

let serviceAccount;

try {
  // ✅ 1. Railway 환경변수 우선
  if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
    console.log("✅ FIREBASE_SERVICE_ACCOUNT_BASE64 환경변수 감지됨");
    const decoded = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, "base64").toString("utf8");
    serviceAccount = JSON.parse(decoded);
  }
  // ✅ 2. 로컬 개발용 .json fallback
  else {
    console.log("⚠️ Railway 환경변수 없음, 로컬 firebase-service-account.json 로드 시도");
    serviceAccount = require("../config/firebase-service-account.json");
  }
} catch (err) {
  console.error("🚨 Firebase Service Account 파싱 오류:", err.message);
  throw new Error("❌ FIREBASE_SERVICE_ACCOUNT 관련 환경변수가 존재하지 않습니다.");
}

const SCOPES = ["https://www.googleapis.com/auth/firebase.messaging"];

async function getAccessToken() {
  const formattedPrivateKey = serviceAccount.private_key.replace(/\\n/g, "\n");
  const jwtClient = new JWT({
    email: serviceAccount.client_email,
    key: formattedPrivateKey,
    scopes: SCOPES,
  });

  const tokens = await jwtClient.authorize();
  console.log("✅ access_token 발급 완료");
  return tokens.access_token;
}

module.exports = getAccessToken;