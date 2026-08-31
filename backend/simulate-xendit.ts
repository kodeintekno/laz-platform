import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
const WEBHOOK_TOKEN = process.env.XENDIT_WEBHOOK_TOKEN;
const BASE_URL = 'http://localhost:4000';

async function simulatePaymentWebhook(referenceId: string, amount: number, paymentRequestId?: string) {
  const url = `${BASE_URL}/api/webhooks/xendit/payment`;
  
  const payload = {
    event: 'payment.capture',
    business_id: 'simulated_business_id',
    data: {
      payment_id: `py-sim-${Date.now()}`,
      payment_request_id: paymentRequestId || `pr-sim-${Date.now()}`,
      reference_id: referenceId, // donationId
      id: `pr-sim-${Date.now()}`,
      request_amount: amount,
      currency: 'IDR',
      status: 'SUCCEEDED',
      payment_method: {
        type: 'VIRTUAL_ACCOUNT',
        reference_id: `va-sim-${Date.now()}`
      }
    }
  };

  console.log(`[PAYMENT] Mengirim Webhook untuk Ref/Donasi: ${referenceId}, Amount: ${amount}`);
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-callback-token': WEBHOOK_TOKEN || ''
    },
    body: JSON.stringify(payload)
  });

  const text = await response.text();
  console.log(`Response: ${response.status} - ${text}`);
}

async function simulatePayoutWebhook(referenceId: string, amount: number, status: 'SUCCEEDED' | 'FAILED' = 'SUCCEEDED') {
  const url = `${BASE_URL}/api/webhooks/xendit/payout`;
  
  const payload = {
    event: status === 'SUCCEEDED' ? 'payout.succeeded' : 'payout.failed',
    business_id: 'simulated_business_id',
    data: {
      reference_id: referenceId, // withdrawalId
      id: `disb-sim-${Date.now()}`,
      amount: amount,
      channel_code: 'BCA',
      status: status,
      ...(status === 'FAILED' ? { failure_code: 'ACCOUNT_NOT_FOUND' } : {})
    }
  };

  console.log(`[PAYOUT] Mengirim Webhook untuk Ref/Withdrawal: ${referenceId}, Amount: ${amount}, Status: ${status}`);
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-callback-token': WEBHOOK_TOKEN || ''
    },
    body: JSON.stringify(payload)
  });

  const text = await response.text();
  console.log(`Response: ${response.status} - ${text}`);
}

async function main() {
  const args = process.argv.slice(2);
  const type = args[0];
  const statusArg = args[1] as 'SUCCEEDED' | 'FAILED' | undefined;

  if (type === 'payment') {
    // Cari donasi terakhir yang masih PENDING
    const donation = await prisma.donation.findFirst({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'desc' }
    });

    if (!donation) {
      console.log("❌ Tidak ada donasi berstatus PENDING di database.");
      process.exit(1);
    }

    console.log(`💡 Ditemukan Donasi terbaru: ${donation.id} (Rp${donation.amount})`);
    const payment = await prisma.payment.findFirst({ where: { donationId: donation.id } });
    await simulatePaymentWebhook(donation.id, Number(donation.amount), payment?.xenditPaymentRequestId || undefined);

  } else if (type === 'payout') {
    // Cari withdrawal terakhir yang belum selesai
    const withdrawal = await prisma.withdrawal.findFirst({
      where: { status: { notIn: ['COMPLETED', 'REJECTED', 'REVERSED'] } },
      orderBy: { createdAt: 'desc' }
    });

    if (!withdrawal) {
      console.log("❌ Tidak ada penarikan dana (Withdrawal) yang sedang diproses.");
      process.exit(1);
    }

    console.log(`💡 Ditemukan Withdrawal terbaru: ${withdrawal.id} (Rp${withdrawal.amount})`);
    await simulatePayoutWebhook(withdrawal.id, Number(withdrawal.amount), statusArg || 'SUCCEEDED');
    
  } else {
    console.log(`
=========================================
XENDIT WEBHOOK SIMULATOR (OTOMATIS)
=========================================
Cara Penggunaan:
  npx ts-node simulate-xendit.ts payment
  npx ts-node simulate-xendit.ts payout [SUCCEEDED|FAILED]
  
Contoh:
  npx ts-node simulate-xendit.ts payment
  npx ts-node simulate-xendit.ts payout SUCCEEDED
  npx ts-node simulate-xendit.ts payout FAILED
=========================================
    `);
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
