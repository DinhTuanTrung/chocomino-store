import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter } from 'k6/metrics';

export const processedCount = new Counter('webhook_processed_count');
export const idempotentAcceptedCount = new Counter('webhook_idempotent_accepted_count');

export const options = {
  scenarios: {
    replay_attack: {
      executor: 'per-vu-iterations',
      vus: 20, // 20 request phát lại đồng thời
      iterations: 1,
      maxDuration: '5s',
    },
  },
};

const BASE_URL = __ENV.BASE_URL || 'https://chocomino-store.vercel.app';
const WEBHOOK_SECRET = __ENV.SEPAY_WEBHOOK_SECRET || 'test_webhook_secret_key';

// Cùng 1 ID giao dịch duy nhất từ SePay
const FIXED_TRANSACTION_ID = 99887766;

export default function () {
  const payload = JSON.stringify({
    id: FIXED_TRANSACTION_ID,
    gateway: 'Techcombank',
    transactionDate: new Date().toISOString(),
    accountNumber: '19030000000000',
    subAccount: null,
    code: null,
    content: 'THANH TOAN DON HANG CMND9F7W',
    transferType: 'in',
    description: 'Napas 247 incoming',
    transferAmount: 108000,
    referenceCode: 'FT261023998877',
    accumulated: 108000,
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Apikey ${WEBHOOK_SECRET}`,
      'x-sepay-signature': 'valid_mock_signature_for_testing',
    },
  };

  const res = http.post(`${BASE_URL}/api/webhooks/sepay`, payload, params);

  check(res, {
    'Trạng thái phản hồi là 200 OK (Chống treo webhook của ngân hàng)': (r) => r.status === 200,
  });

  sleep(0.05);
}
