export interface VietQRParams {
  bankName?: string;
  accountNumber?: string;
  amount: number;
  orderCode: string;
  accountHolder?: string;
}

export function generateVietQRUrl(params: VietQRParams): string {
  const bank = params.bankName || process.env.SEPAY_BANK_NAME || 'Techcombank';
  const acc = params.accountNumber || process.env.SEPAY_ACCOUNT_NUMBER || '';
  const amount = params.amount;
  const des = encodeURIComponent(params.orderCode);

  // SePay QR generator standard template
  return `https://qr.sepay.vn/img?acc=${acc}&bank=${bank}&amount=${amount}&des=${des}&template=compact`;
}

export function extractOrderCodeFromTransferContent(content: string): string | null {
  if (!content) return null;
  // Match 'CM' followed by 6 alphanumeric chars (e.g., CM7K2P9Q)
  const match = content.toUpperCase().match(/CM[A-Z0-9]{6}/);
  return match ? match[0] : null;
}
