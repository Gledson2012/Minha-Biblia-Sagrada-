// Vercel serverless handler para Bíblia Sagrada API
// Este arquivo é o entry point do Vercel para o app Express

let app;
let isInitialized = false;

// Inicialização lazy do banco de dados no cold start
function ensureInitialized() {
  if (!isInitialized) {
    // Remove o banco antigo do /tmp se existir (para garantir dados frescos)
    const fs = require('fs');
    const dbPath = '/tmp/bible.db';
    if (fs.existsSync(dbPath)) {
      fs.unlinkSync(dbPath);
    }
    
    // Importa e inicializa
    const { initDb } = require('../src/database/init');
    initDb();
    
    app = require('../src/index');
    isInitialized = true;
  }
}

// Exporta a função serverless
module.exports = (req, res) => {
  ensureInitialized();
  return app(req, res);
};
