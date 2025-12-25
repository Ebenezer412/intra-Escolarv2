import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';

// Carregar variáveis de ambiente
dotenv.config();

// Importar middlewares
import { requestLogger, sanitizeInput, rateLimiter } from './middleware/auth';

// Importar rotas
import authRoutes from './routes/auth.routes';
import alunoRoutes from './routes/aluno.routes';
import professorRoutes from './routes/professor.routes';
import adminRoutes from './routes/admin.routes';
import bibliotecaRoutes from './routes/biblioteca.routes';

// Importar configuração da base de dados
import database from './config/database';

const app = express();
const PORT = process.env.PORT || 3000;

// ========== CONFIGURAÇÃO DE MIDDLEWARE ==========

// Segurança básica
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"]
    }
  }
}));

// CORS configurado para o frontend
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://seu-dominio.com'] 
    : ['http://localhost:5500', 'http://127.0.0.1:5500'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // limite de 100 requisições por IP
  message: 'Muitas requisições deste IP, tente novamente mais tarde'
});
app.use('/api/', limiter);

// Parsers de corpo
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compressão
app.use(compression());

// Logging e sanitização
app.use(requestLogger);
app.use(sanitizeInput);

// Servir arquivos estáticos
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ========== ROTAS DA API ==========

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: '1.0.0'
  });
});

// Rotas principais
app.use('/api/auth', authRoutes);
app.use('/api/aluno', alunoRoutes);
app.use('/api/professor', professorRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/biblioteca', bibliotecaRoutes);

// Rota para servir o frontend em produção
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../frontend')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend/index.html'));
  });
}

// ========== MANUSEIO DE ERROS ==========

// Rota não encontrada
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Rota não encontrada'
  });
});

// Error handler global
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Erro não tratado:', err);

  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Erro interno do servidor' 
    : err.message;

  res.status(statusCode).json({
    success: false,
    message,
    error: process.env.NODE_ENV === 'development' ? err : undefined,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// ========== INICIALIZAÇÃO DO SERVIDOR ==========

async function startServer() {
  try {
    // Testar conexão com a base de dados
    await database.query('SELECT 1');
    console.log('✅ Base de dados conectada');

    // Iniciar servidor
    app.listen(PORT, () => {
      console.log(`🚀 Servidor rodando na porta ${PORT}`);
      console.log(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📚 API disponível em: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('❌ Falha ao iniciar servidor:', error);
    process.exit(1);
  }
}

// Handlers para desligamento gracioso
process.on('SIGINT', async () => {
  console.log('🛑 Servidor sendo desligado...');
  await database.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🛑 Servidor sendo desligado...');
  await database.close();
  process.exit(0);
});

// Iniciar servidor
startServer();

export default app;