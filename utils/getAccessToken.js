const { JWT } = require("google-auth-library");
const fs = require("fs");
const path = require("path");

let serviceAccount;

try {
  // 🔍 디버그용 로그 (Railway에서 확인 가능)
  console.log("현재 NODE_ENV:", process.env.NODE_ENV);
  console.log("현재 RAILWAY_ENVIRONMENT:", process.env.RAILWAY_ENVIRONMENT);
  console.log("현재 FIREBASE_SERVICE_ACCOUNT_BASE64 존재 여부:", !!process.env.FIREBASE_SERVICE_ACCOUNT_BASE64);

  // ✅ 우선순위 1: Base64 환경변수 (Railway)
  if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64 && process.env.FIREBASE_SERVICE_ACCOUNT_BASE64.trim() !== "") {
    console.log("✅ FIREBASE_SERVICE_ACCOUNT_BASE64 환경변수 감지됨");
    const decoded = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, "base64").toString("utf8");
    serviceAccount = JSON.parse(decoded);

  // ✅ 우선순위 2: JSON 환경변수
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT && process.env.FIREBASE_SERVICE_ACCOUNT.trim() !== "") {
    console.log("✅ FIREBASE_SERVICE_ACCOUNT JSON 환경변수 감지됨");
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

  // ✅ 우선순위 3: 로컬 JSON 파일 (개발 환경용)
  } else {
    console.log("⚠️ 환경변수 없음, 로컬 config/firebase-service-account.json 로드 시도");
    const localPath = path.join(__dirname, "../config/firebase-service-account.json");

    if (!fs.existsSync(localPath)) {
      throw new Error("firebase-service-account.json 파일이 없습니다.");
    }

    const fileData = fs.readFileSync(localPath, "utf8");
    serviceAccount = JSON.parse(fileData);
  }

  console.log("🧪 [getAccessToken] client_email:", serviceAccount.client_email);
  console.log("🧪 [getAccessToken] private_key 존재 여부:", !!serviceAccount.private_key);

  if (!serviceAccount.private_key || !serviceAccount.client_email) {
    throw new Error("❌ Firebase 키에 필요한 필드가 없습니다.");
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