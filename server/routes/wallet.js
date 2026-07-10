const express = require('express');
const router = express.Router();
const WalletTransaction = require('../models/WalletTransaction');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');

// Vapid public key for push - in production, use a real generated key pair
// Generate with: npx web-push generate-vapid-keys

router.get('/transactions', authenticateToken, async (req, res) => {
  try {
    const txns = await WalletTransaction.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(100).lean();
    res.json(txns);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/deposit', authenticateToken, async (req, res) => {
  try {
    const { method, amount, reference } = req.body;
    if (!['bkash', 'nagad', 'rocket'].includes(method)) {
      return res.status(400).json({ error: 'Invalid payment method. Use bkash, nagad, or rocket.' });
    }
    if (!amount || amount < 10) return res.status(400).json({ error: 'Minimum deposit 10 taka' });
    if (amount > 50000) return res.status(400).json({ error: 'Maximum deposit 50,000 taka' });

    const txn = new WalletTransaction({
      id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`,
      userId: req.user.id, type: 'deposit', method, amount,
      currency: 'taka', status: 'pending', reference: reference || ''
    });
    await txn.save();

    // In production: trigger webhook to payment gateway
    // For demo: auto-complete after 2s
    setTimeout(async () => {
      const txnToComplete = await WalletTransaction.findOne({ id: txn.id });
      if (txnToComplete && txnToComplete.status === 'pending') {
        txnToComplete.status = 'completed';
        await txnToComplete.save();
        await User.findOneAndUpdate(
          { id: req.user.id },
          { $inc: { balance_taka: amount } }
        );
        if (global.__socketEmitter) {
          global.__socketEmitter.emitToUser(req.user.id, 'wallet:updated', { balance_taka: amount, txnId: txn.id });
        }
      }
    }, 3000);

    res.json({ success: true, txn, message: `Payment request sent via ${method}. Complete the payment from your ${method} app using reference: ${txn.id}` });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/convert', authenticateToken, async (req, res) => {
  try {
    const { fromCurrency, toCurrency, amount } = req.body;
    const user = await User.findOne({ id: req.user.id });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const rates = {
      'taka_to_goldenCoins': 10,
      'goldenCoins_to_taka': 5,
      'ap_to_taka': 100,
      'taka_to_ap': 1
    };

    const rateKey = `${fromCurrency}_to_${toCurrency}`;
    const rate = rates[rateKey];
    if (!rate) return res.status(400).json({ error: 'Invalid conversion pair' });
    if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount' });

    if (fromCurrency === 'taka' && (user.balance_taka || 0) < amount) {
      return res.status(400).json({ error: 'Insufficient taka balance' });
    }
    if (fromCurrency === 'goldenCoins' && (user.goldenCoins || 0) < amount) {
      return res.status(400).json({ error: 'Insufficient golden coins' });
    }
    if (fromCurrency === 'ap' && (user.ap || 0) < amount) {
      return res.status(400).json({ error: 'Insufficient AP' });
    }

    const deductField = fromCurrency === 'taka' ? 'balance_taka' : fromCurrency === 'goldenCoins' ? 'goldenCoins' : 'ap';
    const addField = toCurrency === 'taka' ? 'balance_taka' : toCurrency === 'goldenCoins' ? 'goldenCoins' : 'ap';
    const converted = Math.floor(amount / rate);

    await User.findOneAndUpdate({ id: req.user.id }, {
      $inc: { [deductField]: -amount, [addField]: converted }
    });

    await WalletTransaction.create({
      id: `convert_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      userId: req.user.id, type: 'purchase', method: 'system',
      amount, currency: fromCurrency, status: 'completed',
      note: `Converted ${amount} ${fromCurrency} to ${converted} ${toCurrency}`
    });

    res.json({ success: true, message: `Converted ${amount} ${fromCurrency} to ${converted} ${toCurrency}` });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
