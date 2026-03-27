import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../services/auth';
import { useTranslation } from '../i18n/LanguageContext';

const DEFAULT_MIN_YEN = 300;
const DEFAULT_YEN_PER_CREDIT = 2;

export default function BillingPage() {
  const { t } = useTranslation();
  const { user, refreshUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [amountYen, setAmountYen] = useState(DEFAULT_MIN_YEN);
  const [minTopupYen, setMinTopupYen] = useState(DEFAULT_MIN_YEN);
  const [yenPerCredit, setYenPerCredit] = useState(DEFAULT_YEN_PER_CREDIT);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const creditsToGet = useMemo(
    () => Math.floor(Math.max(0, Number(amountYen) || 0) / Math.max(1, Number(yenPerCredit) || 1)),
    [amountYen, yenPerCredit],
  );

  useEffect(() => {
    api
      .getBillingConfig()
      .then((cfg) => {
        if (typeof cfg?.minTopupYen === 'number') setMinTopupYen(cfg.minTopupYen);
        if (typeof cfg?.yenPerCredit === 'number') setYenPerCredit(cfg.yenPerCredit);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const payment = searchParams.get('payment');
    const sessionId = searchParams.get('session_id');
    if (payment !== 'success' || !sessionId) return;
    let cancelled = false;
    setBusy(true);
    setMessage(t('billingConfirming'));
    setError('');

    api
      .confirmCheckoutSession(sessionId)
      .then(async () => {
        if (cancelled) return;
        await refreshUser().catch(() => {});
        setMessage(t('billingSuccess'));
        searchParams.delete('payment');
        searchParams.delete('session_id');
        setSearchParams(searchParams, { replace: true });
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err?.message || 'Payment confirmation failed');
      })
      .finally(() => {
        if (!cancelled) setBusy(false);
      });

    return () => {
      cancelled = true;
    };
  }, [searchParams, setSearchParams, t, refreshUser]);

  useEffect(() => {
    if (searchParams.get('payment') === 'cancel') {
      setMessage(t('billingCancelled'));
      setError('');
      searchParams.delete('payment');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams, t]);

  const handlePay = async () => {
    const parsed = Number.parseInt(String(amountYen), 10);
    if (!Number.isFinite(parsed) || parsed < minTopupYen) {
      setError(t('billingMinError'));
      return;
    }
    setBusy(true);
    setError('');
    setMessage(t('billingProcessing'));
    try {
      const res = await api.createCheckoutSession(parsed);
      if (!res?.checkoutUrl) throw new Error('Checkout URL is missing');
      window.location.href = res.checkoutUrl;
    } catch (err) {
      setError(err?.message || 'Payment init failed');
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-ink">{t('billingTitle')}</h1>
        <p className="mt-1 text-ink-muted text-sm sm:text-base">{t('billingSubtitle')}</p>
      </div>

      <section className="rounded-2xl border border-edge bg-surface p-4 sm:p-6 shadow-card">
        <div className="rounded-xl border border-primary/30 bg-primary-soft/40 px-4 py-3">
          <p className="text-sm text-ink-muted">{t('billingCurrentCredits')}</p>
          <p className="text-2xl font-bold text-primary mt-1">{user?.credits ?? 0}</p>
        </div>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-ink-muted mb-2">{t('billingAmountLabel')}</label>
            <div className="relative">
              <input
                type="number"
                min={minTopupYen}
                step={1}
                value={amountYen}
                onChange={(e) => setAmountYen(e.target.value)}
                className="w-full rounded-xl border border-edge bg-surface px-4 py-3 text-ink text-base focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder={String(minTopupYen)}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-ink-faint">JPY</span>
            </div>
            <p className="mt-2 text-xs text-ink-faint">{t('billingAmountHint')}</p>
          </div>

          <div className="rounded-xl border border-edge-subtle bg-surface-2 p-4 flex flex-col justify-center">
            <p className="text-sm text-ink-muted">{t('billingCreditsYouGet')}</p>
            <p className="mt-1 text-2xl font-bold text-ink">{creditsToGet}</p>
          </div>
        </div>

        {message ? (
          <div className="mt-4 rounded-xl border border-info/30 bg-info-soft px-4 py-3 text-sm text-ink">
            {message}
          </div>
        ) : null}
        {error ? (
          <div className="mt-4 rounded-xl border border-danger/35 bg-danger-soft px-4 py-3 text-sm text-danger">
            {error}
          </div>
        ) : null}

        <button
          type="button"
          onClick={handlePay}
          disabled={busy}
          className="mt-5 w-full sm:w-auto rounded-xl bg-primary text-on-primary px-6 py-3 text-sm sm:text-base font-semibold hover:opacity-90 disabled:opacity-60 transition shadow-card"
        >
          {t('billingPayButton')}
        </button>
      </section>
    </div>
  );
}
