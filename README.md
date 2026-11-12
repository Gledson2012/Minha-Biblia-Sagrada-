# 📖 Bíblia Sagrada API

API REST para acesso aos textos bíblicos, inspirada na [Holy Bible API](https://holy-bible-api.com). Fornece acesso estruturado aos livros, capítulos e versículos da Bíblia em português (Almeida Corrigida Fiel).

**Versão 2.0** — Com busca full-text (FTS5), cache, rate limiting, paginação, validação de input, logging estruturado, testes automatizados e muito mais.

## 🚀 Funcionalidades

- **Listar versões bíblicas** - Obtenha todas as versões disponíveis
- **Listar livros** - Navegue pelos 66 livros da Bíblia com paginação
- **Listar capítulos** - Acesse os capítulos de cada livro
- **Buscar versículos** - Encontre versículos específicos por livro, capítulo e versículo
- **Referência rápida** - Acesse versículos por nome: `/João/3/16`
- **Versículo aleatório** - Obtenha um versículo aleatório
- **Versículo do dia** - Versículo diferente a cada dia
- **Busca full-text (FTS5)** - Pesquise palavras ou frases com busca otimizada
- **Cache** - Respostas em cache para performance
- **Rate limiting** - Proteção contra abuso
- **Validação de input** - Parâmetros validados com Zod
- **Logging estruturado** - Logs com Pino
- **Documentação interativa** - Swagger UI em `/docs`
- **Testes automatizados** - Jest + Supertest

## 📋 Requisitos

- Node.js 18+
- npm ou yarn

## 🛠️ Instalação

```bash
# Clone o repositório
git clone <repository-url>
cd "Biblia Sagrada"

# Instale as dependências
npm install

# Inicie o servidor
npm start
```

O servidor iniciará em `http://localhost:3000`.

## 🐳 Docker

```bash
# Com Docker Compose
docker-compose up -d

# Ou construindo a imagem manualmente
docker build -t bible-api .
docker run -p 3000:3000 bible-api
```

## ☁️ Deploy em Produção

Guia completo de deploy em [DEPLOY.md](./DEPLOY.md). Suporta:

| Plataforma | Tipo | Custo |
|------------|------|-------|
| [Vercel](https://vercel.com) | Serverless | **Gratuito** ⭐ |
| [Render](https://render.com) | PaaS | Gratuito |
| [Railway](https://railway.app) | PaaS | Gratuito (crédito) |
| [Fly.io](https://fly.io) | Edge PaaS | Gratuito (crédito) |
| [Heroku](https://heroku.com) | PaaS | Credit card required |
| Docker / VPS | Container | Variável |

### Deploy rápido no Vercel (recomendado)

```bash
# 1. Acesse vercel.com e faça login com GitHub
# 2. Importe o repositório Minha-Biblia-Sagrada-
# 3. Clique em Deploy — pronto!
```

Ou pelo CLI:

```bash
npm i -g vercel
vercel login
vercel
```

A API estará em `https://minha-biblia-sagrada-.vercel.app`

### Deploy com Docker

```bash
docker compose up -d
# API disponível em http://localhost:3000
```

### Deploy no Fly.io

```bash
fly auth login
fly apps create biblia-sagrada-api
fly volumes create bible-data --size 1 --region gru
fly deploy
# API disponível em https://biblia-sagrada-api.fly.dev
```

## 🧪 Testes

```bash
# Executar todos os testes
npm test

# Executar em modo watch
npm run test:watch
```

## 📚 Endpoints

### Bibles (Versões)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/v1/bibles` | Lista todas as versões |
| GET | `/api/v1/bibles/:bibleId` | Detalhes de uma versão |

### Books (Livros)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/v1/books` | Lista todos os livros (com paginação) |
| GET | `/api/v1/books?testament=Novo Testamento` | Filtra por testamento |
| GET | `/api/v1/books?limit=10&offset=20` | Paginação |
| GET | `/api/v1/books/:bookId` | Detalhes de um livro |

### Chapters (Capítulos)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/v1/chapters?bookId=1` | Lista capítulos de um livro |
| GET | `/api/v1/chapters/:chapterId` | Capítulo com versículos |

### Verses (Versículos)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/v1/verses?bookId=1&chapter=1` | Versículos de um capítulo |
| GET | `/api/v1/verses?bookId=1&chapter=1&verse=1` | Versículo específico |
| GET | `/api/v1/verses?bookId=1&chapter=1&verse=1&verseEnd=5` | Intervalo de versículos |

### Reference (Referência rápida)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/v1/reference/Joao/3/16` | João 3:16 |
| GET | `/api/v1/reference/Genesis/1/1` | Gênesis 1:1 |
| GET | `/api/v1/reference/Salmos/23` | Salmo 23 (capítulo inteiro) |

### Random & Daily

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/v1/random-verse` | Versículo aleatório |
| GET | `/api/v1/random-verse?testament=Novo Testamento` | Aleatório do NT |
| GET | `/api/v1/verse-of-the-day` | Versículo do dia |

### Search (Busca full-text)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/v1/search?q=amor` | Busca por palavra |
| GET | `/api/v1/search?q=Deus&limit=10` | Busca com limite |
| GET | `/api/v1/search?q=Deus&limit=5&offset=0` | Busca com paginação |

### Health

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/v1/health` | Status do servidor + banco de dados |

## 📝 Exemplos

### Referência rápida (João 3:16)

```bash
curl "http://localhost:3000/api/v1/reference/Joao/3/16"
```

### Listar livros com paginação

```bash
curl "http://localhost:3000/api/v1/books?limit=10&offset=20"
```

### Buscar versículos sobre amor

```bash
curl "http://localhost:3000/api/v1/search?q=amor"
```

### Versículo aleatório do Novo Testamento

```bash
curl "http://localhost:3000/api/v1/random-verse?testament=Novo Testamento"
```

## 📖 Documentação

A documentação interativa Swagger está disponível em:

```
http://localhost:3000/docs
```

## 🗄️ Banco de Dados

O projeto usa SQLite com FTS5 (Full-Text Search) para armazenamento. O banco de dados é criado automaticamente na primeira execução com:

- 66 livros da Bíblia
- Todos os capítulos com número correto de versículos
- Versículos-chave com texto real (Almeida Corrigida Fiel)
- Índice FTS5 para busca otimizada

## 📁 Estrutura do Projeto

```
├── src/
│   ├── index.js              # Servidor principal
│   ├── middleware.js          # Middlewares (Pino, cache, rate limit)
│   ├── validator.js           # Validação com Zod + mapa de livros
│   ├── database/
│   │   └── init.js           # Inicialização do banco de dados
│   └── routes/
│       ├── bibles.js         # Rotas de versões
│       ├── books.js          # Rotas de livros (com paginação)
│       ├── chapters.js       # Rotas de capítulos
│       ├── verses.js         # Rotas de versículos
│       ├── reference.js      # Referência rápida por nome
│       ├── random-verse.js   # Versículo aleatório
│       ├── verse-of-the-day.js # Versículo do dia
│       └── search.js         # Busca full-text (FTS5)
├── tests/
│   └── api.test.js           # Testes automatizados
├── data/                     # Banco de dados SQLite
├── .github/workflows/
│   └── ci.yml                # CI/CD com GitHub Actions
├── api/
│   └── index.js              # Handler serverless do Vercel
├── vercel.json               # Configuração do Vercel
├── render.yaml               # Configuração do Render
├── fly.toml                  # Configuração do Fly.io
├── Procfile                  # Configuração do Heroku
├── Dockerfile                # Multi-stage build
├── docker-compose.yml        # Com healthcheck
├── .env.example              # Modelo de variáveis de ambiente
├── .env                      # Variáveis de ambiente (local)
├── .gitignore
├── .nvmrc                    # Versão do Node.js
├── DEPLOY.md                 # Guia completo de deploy
├── package.json
└── README.md
```

## 🔧 Variáveis de Ambiente

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| PORT | Porta do servidor | 3000 |
| NODE_ENV | Ambiente (development/production) | development |
| LOG_LEVEL | Nível de log (debug/info/warn/error) | info |
| CACHE_TTL | Tempo de cache em segundos | 300 |
| RATE_LIMIT_WINDOW_MS | Janela de rate limit (ms) | 900000 |
| RATE_LIMIT_MAX | Máximo de requisições por janela | 100 |
| DB_PATH | Caminho do banco de dados | data/bible.db |

## 🚀 Novidades na Versão 2.0

- ✅ Busca full-text com FTS5 do SQLite
- ✅ Cache de respostas com node-cache
- ✅ Rate limiting com express-rate-limit
- ✅ Validação de input com Zod
- ✅ Logging estruturado com Pino
- ✅ Paginação em todos os endpoints listáveis
- ✅ Endpoint de referência rápida (`/João/3/16`)
- ✅ Testes automatizados com Jest + Supertest
- ✅ Docker multi-stage build com healthcheck
- ✅ CI/CD com GitHub Actions
- ✅ Schema de erro no Swagger
- ✅ Versículos de Provérbios corrigidos
- ✅ Número correto de versículos por capítulo
- ✅ Health check com status do banco de dados

## 📄 Licença

MIT License

## 🙏 Créditos

Inspirada na [Holy Bible API](https://holy-bible-api.com) de [Emil Sharkov](https://github.com/emilsharkov/holy-bible-api).

Textos bíblicos baseados na versão Almeida Corrigida Fiel (ACF) - Domínio público.
