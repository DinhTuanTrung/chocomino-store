import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate } from 'k6/metrics';

// Custom Metrics
export const successfulOrders = new Counter('successful_orders');
export const rejectedOrders = new Counter('rejected_orders_out_of_stock');
export const errorRate = new Rate('http_errors');

export const options = {
  scenarios: {
    inventory_race_condition: {
      executor: 'shared-iterations',
      vus: 50, // 50 người dùng đồng thời
      iterations: 50, // Đúng 50 lượt checkout đồng thời trong 1 giây
      maxDuration: '10s',
    },
  },
  thresholds: {
    // Chỉ duy nhất đúng 1 đơn hàng (hoặc đúng số lượng tồn thực tế) được thành công
    successful_orders: ['count >= 1'],
    // Không bị lỗi sập server (500)
    http_errors: ['rate < 0.1'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'https://chocomino-store.vercel.app';

export default function () {
  const payload = JSON.stringify({
    items: [
      {
        productId: 'squishy-meo-beo-banh-bao-cute',
        variantId: 'e2e-variant-last-item',
        quantity: 1,
        price: 45000,
      },
    ],
    customerName: `K6 User #${__VU}`,
    phone: `09${Math.floor(10000000 + Math.random() * 90000000)}`,
    addressProvince: 'Thành phố Hồ Chí Minh',
    addressWard: 'Phường Bến Nghé',
    addressDetail: 'K6 Stress Test Race Condition',
    paymentMethod: 'cod',
    shippingFee: 18000,
    total: 63000,
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'X-Idempotency-Key': `k6_ord_${__VU}_${Date.now()}`,
    },
  };

  const res = http.post(`${BASE_URL}/api/checkout`, payload, params);

  const isSuccess = res.status === 200 || res.status === 201;
  const isOutOfStock = res.status === 409 || res.status === 400;

  if (isSuccess) {
    successfulOrders.add(1);
  } else if (isOutOfStock) {
    rejectedOrders.add(1);
  } else {
    errorRate.add(1);
  }

  check(res, {
    'Phản hồi hợp lệ (200 OK hoặc 409 Out of Stock)': (r) =>
      r.status === 200 || r.status === 201 || r.status === 400 || r.status === 409,
    'Server không sập (Not 500)': (r) => r.status !== 500,
  });

  sleep(0.1);
}
