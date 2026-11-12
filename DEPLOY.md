# Deploy rápido — Bíblia Sagrada API

Escolha uma das opções abaixo para colocar a API em produção.

---

## Opção 1 — Render (gratuito)

Render é a opção mais simples: deploy automático a partir do GitHub com persistência de dados.

1. Crie uma conta em [render.com](https://render.com)
2. Conecte seu repositório GitHub
3. Clique em **New +** → **Web Service**
4. Selecione o repositório `Biblia Sagrada`
5. Preencha:
   - **Name**: `biblia-sagrada-api`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Region**: escolha a mais próxima (ex: Oregon / Frankfurt)
   - **Plan**: Free
6. Adicione as variáveis de ambiente:

   | Variável | Valor |
   |---|---|
   | `NODE_ENV` | `production` |
   | `PORT` | `10000` |
   | `LOG_LEVEL` | `info` |
   | `CACHE_TTL` | `300` |
   | `RATE_LIMIT_MAX` | `100` |

7. Ative **Persistent Disk** com mount path `/app/data` (para o banco SQLite)
8. Clique em **Create Web Service**

A API estará disponível em `https://biblia-sagrada-api.onrender.com`

> **Nota**: O plano free "adormece" após 15 min de inatividade. A primeira requisição pode levar ~30s.

---

## Opção 2 — Railway

Railway oferece deploy fácil com banco de dados persistente.

1. Crie uma conta em [railway.app](https://railway.app)
2. Clique em **New Project** → **Deploy from GitHub**
3. Selecione o repositório
4. Railway detecta automaticamente o Node.js
5. Adicione as variáveis de ambiente no painel:

   ```
   NODE_ENV=production
   LOG_LEVEL=info
   CACHE_TTL=300
   RATE_LIMIT_MAX=100
   ```

6. Adicione um **Volume** montado em `/app/data` para persistir o SQLite
7. Deploy automático a cada push

---

## Opção 3 — Docker (qualquer servidor VPS)

Para um servidor próprio (DigitalOcean, AWS EC2, Hetzner, etc.):

```bash
# Clone o repositório
git clone https://github.com/<seu-usuario>/Biblia-Sagrada.git
cd "Biblia Sagrada"

# Crie o .env de produção
cp .env.example .env

# Suba com Docker Compose
docker compose up -d

# Veja os logs
docker compose logs -f

# Pare quando precisar
docker compose down
```

### Com Docker puro

```bash
docker build -t biblia-sagrada-api .
docker run -d \
  --name biblia-api \
  -p 3000:3000 \
  -v bible-data:/app/data \
  -e NODE_ENV=production \
  -e PORT=3000 \
  biblia-sagrada-api
```

---

## Opção 4 — Fly.io

Deploy global com edge regions.

1. Instale o [Fly CLI](https://fly.io/docs/getting-started/installing-flyctl/)
2. Faça login: `fly auth login`
3. Crie o app:

   ```bash
   fly apps create biblia-sagrada-api
   fly volumes create bible-data --size 1 --region gra
   ```

4. Deploy:

   ```bash
   fly deploy
   ```

5. A API estará em `https://biblia-sagrada-api.fly.dev`

---

## Opção 5 — Heroku

1. Instale o [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli)
2. Faça login: `heroku login`
3. Crie o app:

   ```bash
   heroku create biblia-sagrada-api
   heroku config:set NODE_ENV=production
   heroku config:set LOG_LEVEL=info
   heroku config:set CACHE_TTL=300
   heroku config:set RATE_LIMIT_MAX=100
   ```

4. Deploy:

   ```bash
   git push heroku main
   ```

> **Nota**: Heroku tem filesystem efêmero. O banco SQLite será recriado a cada deploy. Para persistência, use um addon de volume ou migre para PostgreSQL.

---

## Variáveis de ambiente

| Variável | Padrão | Descrição |
|---|---|---|
| `PORT` | `3000` | Porta do servidor |
| `NODE_ENV` | `development` | `production` para ambiente real |
| `LOG_LEVEL` | `info` | Nível de log (debug, info, warn, error) |
| `CACHE_TTL` | `300` | TTL do cache em segundos (5 min) |
| `RATE_LIMIT_WINDOW_MS` | `900000` | Janela de rate limit (15 min) |
| `RATE_LIMIT_MAX` | `100` | Máximo de requisições por janela |
| `DB_PATH` | `data/bible.db` | Caminho customizado para o SQLite |

---

## Monitoramento

Após o deploy, verifique:

- **Health check**: `GET /api/v1/health`
- **Documentação Swagger**: `GET /docs`
- **Logs**: `docker compose logs -f` ou painel da plataforma

---

## Escalabilidade

Para tráfego elevado:

1. **Cache Redis**: Substitua `node-cache` por Redis compartilhado
2. **Banco PostgreSQL**: Migre de SQLite para PostgreSQL com `pg` driver
3. **CDN**: Coloque uma CDN (Cloudflare) na frente para cache de respostas GET
4. **Load balancer**: Use múltiplas instâncias atrás de um load balancer
