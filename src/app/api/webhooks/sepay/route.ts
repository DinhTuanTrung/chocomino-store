import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { extractOrderCodeFromTransferContent } from '@/lib/sepay/vietqr';
import { verifySePayWebhookSignature } from '@/lib/sepay/signature';
import { recordAuditLog } from '@/lib/audit';
import { sendTelegramPaymentSuccessNotification } from '@/lib/telegram';

/**
 * SePay Webhook Endpoint (FR-C-42)
 * Listens for incoming bank transfer webhooks from SePay (Techcombank/VietQR).
 * Automatically transitions order payment_status to 'paid' when exact or sufficient amount is received.
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const webhookSecret = process.env.SEPAY_WEBHOOK_SECRET;

    // 1. Signature & Auth verification
    if (webhookSecret) {
      const authHeader = req.headers.get('authorization') || '';
      const xApiKey = req.headers.get('x-api-key') || '';
      const sepaySignature = req.headers.get('x-sepay-signature');

      const isTokenValid =
        authHeader === `Apikey ${webhookSecret}` ||
        authHeader === `Bearer ${webhookSecret}` ||
        xApiKey === webhookSecret;

      const isSignatureValid = sepaySignature
        ? verifySePayWebhookSignature(rawBody, sepaySignature, webhookSecret)
        : false;

      if (!isTokenValid && !isSignatureValid) {
        console.warn('[SePay Webhook] Unauthorized attempt - invalid secret/signature');
        return NextResponse.json(
          { success: false, message: 'Unauthorized' },
          { status: 401 }
        );
      }
    } else {
      console.warn('[SePay Webhook] Warning: SEPAY_WEBHOOK_SECRET is not configured in env.');
    }

    // 2. Parse payload
    let body: any;
    try {
      body = JSON.parse(rawBody);
    } catch (e) {
      return NextResponse.json(
        { success: false, message: 'Invalid JSON payload' },
        { status: 400 }
      );
    }

    const {
      id,
      gateway,
      accountNumber,
      transferType,
      transferAmount,
      amount,
      content,
      description,
      referenceCode,
    } = body;

    // Only process inbound credit transfers
    if (transferType && transferType !== 'in') {
      return NextResponse.json({
        success: true,
        message: 'Ignored outbound transaction',
      });
    }

    const txId = String(id || referenceCode || `TX_${Date.now()}`);
    const actualAmount = Number(transferAmount ?? amount ?? 0);
    const transferContent = String(content || description || '');
    const accNum = String(accountNumber || 'TECHCOMBANK');

    const supabase = createAdminClient();

    // 3. Idempotency check: prevent duplicate credit
    const { data: existingTx } = await supabase
      .from('bank_transactions')
      .select('id')
      .eq('provider_tx_id', txId)
      .maybeSingle();

    if (existingTx) {
      return NextResponse.json({
        success: true,
        message: 'Transaction already processed',
      });
    }

    // 4. Extract order code (e.g. CM7K2P9Q)
    const orderCode = extractOrderCodeFromTransferContent(transferContent);

    if (!orderCode) {
      // Unmatched transaction (e.g. general transfer without order code)
      await supabase.from('bank_transactions').insert({
        provider_tx_id: txId,
        account_number: accNum,
        amount: actualAmount,
        content: transferContent,
        raw_payload: body,
        status: 'unmatched',
      });

      return NextResponse.json({
        success: true,
        message: 'No valid order code found in transfer content',
      });
    }

    // 5. Look up matching order
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .select('id, code, total, payment_status, customer_name, phone, status')
      .eq('code', orderCode)
      .maybeSingle();

    if (orderErr || !order) {
      await supabase.from('bank_transactions').insert({
        provider_tx_id: txId,
        account_number: accNum,
        amount: actualAmount,
        content: transferContent,
        raw_payload: body,
        status: 'unmatched',
      });

      return NextResponse.json({
        success: true,
        message: `Order #${orderCode} not found in database`,
      });
    }

    // 6. Validate amount
    const isAmountSufficient = actualAmount >= order.total;

    if (!isAmountSufficient) {
      await supabase.from('bank_transactions').insert({
        provider_tx_id: txId,
        account_number: accNum,
        amount: actualAmount,
        content: transferContent,
        matched_order_id: order.id,
        raw_payload: body,
        status: 'invalid_amount',
      });

      return NextResponse.json({
        success: true,
        message: `Payment amount (${actualAmount}đ) is less than order total (${order.total}đ)`,
      });
    }

    // 7. Update order to paid & record transaction
    await supabase
      .from('orders')
      .update({
        payment_status: 'paid',
        payment_method: 'bank_qr',
        updated_at: new Date().toISOString(),
      })
      .eq('id', order.id);

    await supabase.from('bank_transactions').insert({
      provider_tx_id: txId,
      account_number: accNum,
      amount: actualAmount,
      content: transferContent,
      matched_order_id: order.id,
      raw_payload: body,
      status: 'matched',
    });

    // 8. Record audit log (FR-A-62)
    recordAuditLog({
      action: 'payment_verified_vietqr',
      entity: 'order',
      entityId: order.id,
      actorName: 'SePay Webhook',
      actorEmail: 'webhook@sepay.vn',
      actorRole: 'system',
      beforeData: { payment_status: order.payment_status },
      afterData: {
        payment_status: 'paid',
        amount: actualAmount,
        provider_tx_id: txId,
      },
    }).catch((e) => console.warn('[Audit] Webhook log error:', e));

    // 9. Dispatch Telegram notification to owner (FR-A-71)
    sendTelegramPaymentSuccessNotification({
      code: order.code,
      customerName: order.customer_name,
      phone: order.phone,
      amount: actualAmount,
      providerTxId: txId,
    }).catch((e) => console.warn('[Telegram] Webhook payment notice error:', e));

    return NextResponse.json({
      success: true,
      message: `Order #${order.code} confirmed paid successfully`,
      orderId: order.id,
    });
  } catch (error: any) {
    console.error('[SePay Webhook Error]:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error processing webhook' },
      { status: 500 }
    );
  }
}
