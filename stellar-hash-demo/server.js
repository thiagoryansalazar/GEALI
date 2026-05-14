const express = require('express');
const path = require('path');
const crypto = require('crypto');
const {
  BASE_FEE,
  Horizon,
  Keypair,
  Networks,
  Operation,
  TransactionBuilder,
} = require('@stellar/stellar-sdk');

const app = express();
const port = process.env.PORT || 3000;
cconst sourceSecret = process.env.STELLAR_SECRET;  //Aqui vai a chave secreta. 
const sourceKeypair = Keypair.fromSecret(sourceSecret);
const horizonServer = new Horizon.Server('https://horizon-testnet.stellar.org');

app.use((_req, res, next) => {
  res.setHeader('Content-Language', 'pt-BR');
  next();
});

app.use(express.json());
app.use(express.static(__dirname));

app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/register', async (req, res) => {
  try {
    const relatorio = String(req.body?.relatorio || '').trim();
    if (!relatorio) {
      return res.status(400).json({ error: 'Informe o conteudo do relatorio.' });
    }

    const hash = crypto.createHash('sha256').update(relatorio, 'utf8').digest('hex');
    const sourceAccount = await horizonServer.loadAccount(sourceKeypair.publicKey());

    const transaction = new TransactionBuilder(sourceAccount, {
      fee: String(BASE_FEE),
      networkPassphrase: Networks.TESTNET,
    })
      .addOperation(
        Operation.manageData({
          name: 'reportHash',
          value: hash,
        })
      )
      .setTimeout(30)
      .build();

    transaction.sign(sourceKeypair);

    const submission = await horizonServer.submitTransaction(transaction);
    const transactionId = submission.hash;

    return res.json({
      hash,
      transactionId,
      stellarExpertUrl: `https://stellar.expert/explorer/testnet/tx/${transactionId}`,
    });
  } catch (error) {
    const message =
      error?.response?.data?.extras?.result_codes?.operations?.join(', ') ||
      error?.response?.data?.detail ||
      error.message ||
      'Falha ao registrar hash na Stellar Testnet.';

    return res.status(500).json({ error: message });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
