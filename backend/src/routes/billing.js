import { Router } from 'express';
import Stripe from 'stripe';
import { requireAuth } from '../middleware/auth.js';
import { prisma } from '../utils/prisma.js';
import { config } from '../config/index.js';

const router = Router();

const MIN_TOPUP_YEN = 300;
const YEN_PER_CREDIT = 2;

function getStripeClient() {
  const key = config.stripe?.secretKey;
  if (!key) return null;
  return new Stripe(key);
}

async function getCreditsConfig(db = prisma) {
  return db.creditsConfig.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      defaultCredits: 300,
      templateGenerationCost: 40,
      voiceGenerationCost: 90,
    },
  });
}

router.get('/config', requireAuth, (_req, res) => {
  res.json({
    minTopupYen: MIN_TOPUP_YEN,
    yenPerCredit: YEN_PER_CREDIT,
    publishableKey: config.stripe?.publishableKey || null,
  });
});

router.post('/create-checkout-session', requireAuth, async (req, res, next) => {
  try {
    const stripe = getStripeClient();
    if (!stripe) {
      return res.status(500).json({ error: 'Stripe is not configured' });
    }

    const amountYen = Number.parseInt(String(req.body?.amountYen ?? ''), 10);
    if (!Number.isFinite(amountYen) || amountYen < MIN_TOPUP_YEN) {
      return res.status(400).json({ error: `Minimum top-up is ${MIN_TOPUP_YEN} JPY` });
    }

    const creditsToGrant = Math.floor(amountYen / YEN_PER_CREDIT);
    if (creditsToGrant <= 0) {
      return res.status(400).json({ error: 'Top-up amount is too low for credits' });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      success_url: `${config.frontendUrl}/dashboard/billing?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${config.frontendUrl}/dashboard/billing?payment=cancel`,
      customer_email: req.user.email || undefined,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'jpy',
            unit_amount: amountYen,
            product_data: {
              name: `Credit top-up (${creditsToGrant} credits)`,
              description: `1 credit = ${YEN_PER_CREDIT} JPY`,
            },
          },
        },
      ],
      metadata: {
        userId: req.user.id,
        creditsToGrant: String(creditsToGrant),
        amountYen: String(amountYen),
      },
    });

    await prisma.payment.upsert({
      where: { stripeCheckoutId: session.id },
      update: {
        amountYen,
        creditsGranted: creditsToGrant,
        status: session.status || 'open',
      },
      create: {
        userId: req.user.id,
        stripeCheckoutId: session.id,
        amountYen,
        creditsGranted: creditsToGrant,
        status: session.status || 'open',
      },
    });

    return res.json({ checkoutUrl: session.url });
  } catch (err) {
    next(err);
  }
});

router.post('/confirm-checkout-session', requireAuth, async (req, res, next) => {
  try {
    const stripe = getStripeClient();
    if (!stripe) {
      return res.status(500).json({ error: 'Stripe is not configured' });
    }
    const sessionId = String(req.body?.sessionId || '').trim();
    if (!sessionId) return res.status(400).json({ error: 'sessionId is required' });

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const sessionUserId = String(session.metadata?.userId || '');
    if (sessionUserId !== req.user.id) {
      return res.status(403).json({ error: 'Session does not belong to current user' });
    }

    const paid = session.payment_status === 'paid';
    if (!paid) {
      await prisma.payment.upsert({
        where: { stripeCheckoutId: session.id },
        update: { status: session.payment_status || session.status || 'open' },
        create: {
          userId: req.user.id,
          stripeCheckoutId: session.id,
          amountYen: Number.parseInt(String(session.metadata?.amountYen || '0'), 10) || 0,
          creditsGranted:
            Number.parseInt(String(session.metadata?.creditsToGrant || '0'), 10) || 0,
          status: session.payment_status || session.status || 'open',
        },
      });
      return res.status(409).json({ error: 'Payment is not completed yet' });
    }

    const creditsToGrant = Number.parseInt(String(session.metadata?.creditsToGrant || '0'), 10);
    const amountYen = Number.parseInt(String(session.metadata?.amountYen || '0'), 10);
    if (!Number.isFinite(creditsToGrant) || creditsToGrant <= 0 || !Number.isFinite(amountYen)) {
      return res.status(400).json({ error: 'Invalid checkout metadata' });
    }

    const result = await prisma.$transaction(async (tx) => {
      await getCreditsConfig(tx);
      const existing = await tx.payment.findUnique({
        where: { stripeCheckoutId: session.id },
        select: { id: true, creditedAt: true, creditsGranted: true, amountYen: true, status: true },
      });

      if (existing?.creditedAt) {
        const user = await tx.user.findUnique({
          where: { id: req.user.id },
          select: { credits: true },
        });
        return {
          alreadyCredited: true,
          credits: user?.credits ?? 0,
        };
      }

      await tx.payment.upsert({
        where: { stripeCheckoutId: session.id },
        update: {
          status: 'paid',
          creditedAt: new Date(),
          amountYen,
          creditsGranted: creditsToGrant,
        },
        create: {
          userId: req.user.id,
          stripeCheckoutId: session.id,
          amountYen,
          creditsGranted: creditsToGrant,
          status: 'paid',
          creditedAt: new Date(),
        },
      });

      const updatedUser = await tx.user.update({
        where: { id: req.user.id },
        data: { credits: { increment: creditsToGrant } },
        select: { credits: true },
      });

      return {
        alreadyCredited: false,
        credits: updatedUser.credits,
      };
    });

    return res.json({
      ok: true,
      alreadyCredited: result.alreadyCredited,
      credits: result.credits,
      creditsGranted: creditsToGrant,
      amountYen,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
