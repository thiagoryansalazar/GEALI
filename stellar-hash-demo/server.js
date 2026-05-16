const express = require('express');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const {
  Asset,
  BASE_FEE,
  Horizon,
  Keypair,
  Memo,
  Networks,
  Operation,
  TransactionBuilder,
} = require('@stellar/stellar-sdk');

const envPath = path.join(__dirname, '.env');
const envExamplePath = path.join(__dirname, '.env.example');

dotenv.config({
  path: fs.existsSync(envPath) ? envPath : envExamplePath,
});

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.STELLAR_SECRET;
const LOGIN_EMAIL = process.env.APP_LOGIN_EMAIL || 'admin@ali.local';
const LOGIN_PASSWORD = process.env.APP_LOGIN_PASSWORD || '123456';
const HORIZON_SERVER = new Horizon.Server(
  process.env.HORIZON_URL || 'https://horizon-testnet.stellar.org'
);
const activeSessions = new Map();

if (!SECRET_KEY) {
  throw new Error('Defina STELLAR_SECRET no arquivo .env.');
}

const KEYPAIR = Keypair.fromSecret(SECRET_KEY);

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  next();
});

app.use(express.json({ limit: '20mb' }));
app.use(express.static(__dirname));

app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, 'example.html'));
});

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/session', (req, res) => {
  const token = extractBearerToken(req);
  if (!token || !activeSessions.has(token)) {
    return res.status(401).json({ authenticated: false });
  }
  return res.json({
    authenticated: true,
    email: activeSessions.get(token).email,
  });
});

app.post('/login', (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');

  if (email !== LOGIN_EMAIL.toLowerCase() || password !== LOGIN_PASSWORD) {
    return res.status(401).json({ error: 'Credenciais invalidas.' });
  }

  const token = crypto.randomBytes(24).toString('hex');
  activeSessions.set(token, { email, createdAt: Date.now() });

  return res.json({ token, email });
});

app.post('/logout', (req, res) => {
  const token = extractBearerToken(req);
  if (token) {
    activeSessions.delete(token);
  }
  return res.json({ ok: true });
});

app.post('/sign-contract', requireAuth, async (req, res) => {
  try {
    const { contract, contractBytesBase64 } = req.body || {};
    const normalizedContract = normalizeContract(contract, contractBytesBase64);
    const contractHash = createContractHash(normalizedContract);
    const memoText = `contract_${contractHash.substring(0, 19)}`;
    const account = await HORIZON_SERVER.loadAccount(KEYPAIR.publicKey());

    const transaction = new TransactionBuilder(account, {
      fee: String(BASE_FEE),
      memo: Memo.text(memoText),
      networkPassphrase: Networks.TESTNET,
    })
      .addOperation(
        Operation.payment({
          destination: KEYPAIR.publicKey(),
          asset: Asset.native(),
          amount: '0.0000100',
        })
      )
      .setTimeout(30)
      .build();

    transaction.sign(KEYPAIR);

    const submission = await HORIZON_SERVER.submitTransaction(transaction);
    const stellarTxHash = submission.hash;

    return res.json({
      contractHash,
      stellarTxHash,
      stellarExpertUrl: `https://stellar.expert/explorer/testnet/tx/${stellarTxHash}`,
      message: 'Contrato registrado na Stellar Testnet.',
    });
  } catch (error) {
    const detailedError = getStellarErrorMessage(error) || 'Falha ao assinar contrato.';
    return res.status(500).json({
      error: detailedError,
      details: {
        message: error?.message || null,
        horizonDetail: error?.response?.data?.detail || null,
        resultCodes: error?.response?.data?.extras?.result_codes || null,
      },
    });
  }
});

app.post('/verify-contract', (req, res) => {
  try {
    const contract = getContract(req.body);
    const originalHash = String(req.body?.originalHash || '').trim();

    if (!originalHash) {
      return res.status(400).json({
        isValid: false,
        currentHash: createContractHash(contract),
        message: 'Informe o hash original para verificar o contrato.',
      });
    }

    const currentHash = createContractHash(contract);
    const isValid = currentHash === originalHash;

    return res.json({
      isValid,
      currentHash,
      message: isValid
        ? 'Contrato valido. Nenhuma alteracao detectada.'
        : 'Contrato alterado apos o registro.',
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message || 'Falha ao verificar contrato.',
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

function getContract(body) {
  const contract = String(body?.contract || body?.contrato || '').trim();

  if (!contract) {
    throw new Error('Contrato nao pode estar vazio.');
  }

  return contract;
}

function normalizeContract(contract, contractBytesBase64) {
  if (contractBytesBase64) {
    const fileBuffer = Buffer.from(String(contractBytesBase64), 'base64');
    const convertedText = fileBuffer.toString('utf8').trim();

    if (!convertedText) {
      throw new Error('Contrato nao pode estar vazio.');
    }

    return convertedText;
  }

  return getContract({ contract });
}

function createContractHash(contract) {
  return crypto.createHash('sha256').update(contract).digest('hex');
}

function getStellarErrorMessage(error) {
  return (
    error?.response?.data?.extras?.result_codes?.operations?.join(', ') ||
    error?.response?.data?.extras?.result_codes?.transaction ||
    error?.response?.data?.detail ||
    error.message
  );
}

function extractBearerToken(req) {
  const auth = String(req.headers?.authorization || '');
  if (!auth.startsWith('Bearer ')) {
    return '';
  }
  return auth.slice(7).trim();
}

function requireAuth(req, res, next) {
  const token = extractBearerToken(req);
  if (!token || !activeSessions.has(token)) {
    return res.status(401).json({ error: 'Nao autenticado.' });
  }
  req.user = activeSessions.get(token);
  next();
}
