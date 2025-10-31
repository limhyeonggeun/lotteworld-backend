const { JWT } = require('google-auth-library');
const serviceAccount = require('../config/firebase-service-account.json');

const SCOPES = ['https://www.googleapis.com/auth/firebase.messaging'];

async function getAccessToken() {
  console.log('🧪 [getAccessToken] client_email:', serviceAccount.client_email);
  console.log('🧪 [getAccessToken] private_key 존재 여부:', !!serviceAccount.private_key);

  if (!serviceAccount.private_key || !serviceAccount.client_email) {
    throw new Error('❌ serviceAccount에 필요한 정보가 없습니다.');
  }

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