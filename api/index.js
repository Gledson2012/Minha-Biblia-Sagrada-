// Vercel serverless handler para Bíblia Sagrada API
// Este arquivo é o entry point do Vercel para o app Express

const app = require('../src/index');

// Exporta o app como uma função serverless
// O Vercel chama esta função para cada requisição
module.exports = (req, res) => {
  return app(req, res);
};
