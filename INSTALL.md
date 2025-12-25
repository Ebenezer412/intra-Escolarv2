# INSTALAÇÃO DO SISTEMA IMEL INTRANET

## PRÉ-REQUISITOS

### 1. Node.js e NPM
- Node.js 16+ (https://nodejs.org/)
- NPM 8+ (vem com Node.js)

### 2. MySQL
- MySQL 8.0+ (https://dev.mysql.com/downloads/mysql/)
- Ou MariaDB 10.5+

### 3. Git (opcional)
- Para clonar o repositório

## INSTALAÇÃO PASSO A PASSO

### Passo 1: Clonar ou criar estrutura de pastas
```bash
# Criar estrutura de pastas
mkdir imel-intranet
cd imel-intranet
mkdir -p backend/src/{config,middleware,models,routes,controllers,utils}
mkdir -p backend/uploads
mkdir -p frontend/{css,js,assets}
mkdir -p database