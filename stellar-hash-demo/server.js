const express = require('express');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const multer = require('multer');
const rateLimit = require('express-rate-limit');

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
const LOGIN_EMAIL = process.env.APP_LOGIN_EMAIL;
const LOGIN_PASSWORD = process.env.APP_LOGIN_PASSWORD;
const HORIZON_SERVER = new Horizon.Server(
  process.env.HORIZON_URL || 'https://horizon-testnet.stellar.org'
);
const activeSessions = new Map();
const SESSION_TTL = 2 * 60 * 60 * 1000; // 2 horas
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB máximo
});
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // limite de 100 requisições por IP
  message: 'Muitas requisições. Tente novamente mais tarde.',
});
const signContractLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'Muitas requisições. Aguarde um momento antes de tentar novamente.' },
  standardHeaders: true,
  legacyHeaders: false,
});
const allowedOrigins = process.env.ALLOWED_ORIGIN
  ? [process.env.ALLOWED_ORIGIN]
  : ['http://localhost:3000'];
// DEMO: Mapeamento em memória. Em produção, usar banco de dados.
if (!global.hashToTxMap) global.hashToTxMap = new Map();

if (!SECRET_KEY) {
  throw new Error('Defina STELLAR_SECRET no arquivo .env.');
}
if (!LOGIN_EMAIL || !LOGIN_PASSWORD) {
  throw new Error('Credenciais de administrador não configuradas no arquivo .env');
}

const KEYPAIR = Keypair.fromSecret(SECRET_KEY);

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (!origin) {
    res.setHeader('Access-Control-Allow-Origin', '*');
  } else if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (!process.env.ALLOWED_ORIGIN) {
    // Desenvolvimento: mantém aberto quando ALLOWED_ORIGIN não foi configurado.
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');

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

app.post('/login', limiter, (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');

    if (email !== LOGIN_EMAIL.toLowerCase() || password !== LOGIN_PASSWORD) {
      return res.status(401).json({ error: 'Credenciais invalidas.' });
    }

    const token = crypto.randomBytes(24).toString('hex');
    activeSessions.set(token, { email, createdAt: Date.now() });

    return res.json({ token, email });
  } catch (error) {
    console.error('Erro interno:', error); // Log interno (só aparece no terminal)
    return res.status(500).json({ error: 'Erro interno do servidor. Tente novamente mais tarde.' });
  }
});

app.post('/logout', (req, res) => {
  const token = extractBearerToken(req);
  if (token) {
    activeSessions.delete(token);
  }
  return res.json({ ok: true });
});

app.post('/sign-contract', requireAuth, signContractLimiter, upload.single('file'), async (req, res) => {
  try {
    const contractBuffer = getContractBuffer(req);
    const contractHash = createContractHash(contractBuffer);
    const hashBuffer = Buffer.from(contractHash, 'hex');
    const account = await HORIZON_SERVER.loadAccount(KEYPAIR.publicKey());

    const transaction = new TransactionBuilder(account, {
      fee: String(BASE_FEE),
      memo: Memo.hash(hashBuffer),
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
    global.hashToTxMap.set(contractHash, stellarTxHash);

    return res.json({
      contractHash,
      stellarTxHash,
      stellarExpertUrl: `https://stellar.expert/explorer/testnet/tx/${stellarTxHash}`,
      message: 'Contrato registrado na Stellar Testnet com hash completo via Memo.hash.',
    });
  } catch (error) {
    console.error('Erro interno:', error); // Log interno (só aparece no terminal)
    return res.status(500).json({ error: 'Erro interno do servidor. Tente novamente mais tarde.' });
  }
});

app.post('/verify-contract', requireAuth, upload.single('file'), async (req, res) => {
  try {
    const contractBuffer = getContractBuffer(req);
    const currentHash = createContractHash(contractBuffer);
    const currentHashMemoBase64 = Buffer.from(currentHash, 'hex').toString('base64');

    const txHash = String(req.body?.stellarTxHash || req.body?.txHash || '').trim();
    let memoFromChain = '';
    let usedTxHash = txHash;

    if (usedTxHash) {
      const tx = await HORIZON_SERVER.transactions().transaction(usedTxHash).call();
      memoFromChain = String(tx.memo || '');
    } else {
      const mappedTxHash = global.hashToTxMap.get(currentHash);
      if (!mappedTxHash) {
        return res.status(404).json({
          isValid: false,
          currentHash,
          message: 'Transacao nao encontrada para este contrato. Informe stellarTxHash.',
        });
      }
      usedTxHash = mappedTxHash;
      const tx = await HORIZON_SERVER.transactions().transaction(usedTxHash).call();
      memoFromChain = String(tx.memo || '');
    }

    const isValid = memoFromChain === currentHashMemoBase64;

    return res.json({
      isValid,
      currentHash,
      stellarTxHash: usedTxHash || null,
      message: isValid
        ? 'Contrato valido. Nenhuma alteracao detectada.'
        : 'Contrato alterado apos o registro.',
    });
  } catch (error) {
    console.error('Erro interno:', error); // Log interno (só aparece no terminal)
    return res.status(500).json({ error: 'Erro interno do servidor. Tente novamente mais tarde.' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${PORT}`);
});

function getContractBuffer(req) {
  if (req.file?.buffer?.length) {
    return req.file.buffer;
  }

  const contractBytesBase64 = String(req.body?.contractBytesBase64 || '').trim();
  if (contractBytesBase64) {
    const fileBuffer = Buffer.from(contractBytesBase64, 'base64');
    if (!fileBuffer.length) {
      throw new Error('Contrato nao pode estar vazio.');
    }
    return fileBuffer;
  }

  const contractText = String(req.body?.contract || req.body?.contrato || '');
  if (!contractText.trim()) {
    throw new Error('Contrato nao pode estar vazio.');
  }
  return Buffer.from(contractText, 'utf8');
}

function createContractHash(contractBuffer) {
  return crypto.createHash('sha256').update(contractBuffer).digest('hex');
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
  const session = activeSessions.get(token);
  // Verificar expiracao (apenas se createdAt existir)
  if (session.createdAt && (Date.now() - session.createdAt > SESSION_TTL)) {
    activeSessions.delete(token);
    return res.status(401).json({ error: 'Sessao expirada. Faca login novamente.' });
  }
  req.user = session;
  next();
}
