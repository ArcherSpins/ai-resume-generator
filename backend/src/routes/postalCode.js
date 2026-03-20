import { Router } from 'express';

const router = Router();
const ZIPCLOUD_URL = 'https://zipcloud.ibsnet.co.jp/api/search';

router.get('/', async (req, res) => {
  try {
    let zipcode = String(req.query.zipcode ?? '').replace(/\D/g, '').slice(0, 7);
    if (zipcode.length !== 7) {
      return res.status(400).json({ error: 'Invalid postal code. Use 7 digits (e.g. 3330854 or 333-0854).' });
    }

    const url = `${ZIPCLOUD_URL}?zipcode=${zipcode}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 200 || !data.results || data.results.length === 0) {
      return res.status(404).json({ error: 'Address not found for this postal code.' });
    }

    const r = data.results[0];
    const prefecture = r.address1 || '';
    const city = r.address2 || '';
    const district = r.address3 || '';
    const formatted = [prefecture, city, district].filter(Boolean).join('');
    const withPostal = `〒${zipcode.slice(0, 3)}-${zipcode.slice(3)} ${formatted}`;

    res.json({
      address: withPostal,
      prefecture,
      city,
      district,
      zipcode: `${zipcode.slice(0, 3)}-${zipcode.slice(3)}`,
    });
  } catch (err) {
    console.error('[postal-code]', err);
    res.status(500).json({ error: 'Failed to look up address.' });
  }
});

export default router;
