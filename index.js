const express = require('express');
const app = express();
const PORT = 3000;

app.use(express.json()); // permite ler JSON no corpo das requisições

// ---------- Middlewares próprios ----------

// Middleware global de log (executa em toda requisição)
function logger(req, res, next) {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
}
app.use(logger);

// Middleware de autenticação (simples, com um "token" fixo pra exemplo)
function autenticar(req, res, next) {
  const token = req.headers['x-auth-token'];
  if (token !== 'segredo123') {
    return res.status(401).json({ erro: 'Token de autenticação ausente ou inválido' });
  }
  next();
}

// Middleware que valida se o corpo da requisição tem "titulo"
function validarTitulo(req, res, next) {
  if (!req.body.titulo) {
    return res.status(400).json({ erro: 'Campo "titulo" é obrigatório' });
  }
  next();
}

// Middleware que registra a ação específica de criar tarefa
function logAcaoCriarTarefa(req, res, next) {
  console.log(`Ação: criando tarefa com titulo "${req.body.titulo}"`);
  next();
}

// ---------- "Banco de dados" em memória ----------

let tarefas = [
  { id: 1, titulo: 'Estudar Express', concluida: false },
  { id: 2, titulo: 'Fazer exercício de middleware', concluida: true },
  { id: 3, titulo: 'Testar rotas no Postman', concluida: false },
];

// ---------- Rotas ----------

// 1) Rota raiz
app.get('/', (req, res) => {
  res.send('API de Tarefas no ar');
});

// 2 e 4) Lista de tarefas, com filtro opcional por ?concluida=true
app.get('/tarefas', (req, res) => {
  const { concluida } = req.query;

  if (concluida !== undefined) {
    const filtradas = tarefas.filter(
      (tarefa) => tarefa.concluida === (concluida === 'true')
    );
    return res.json(filtradas);
  }

  res.json(tarefas);
});

// 3) Buscar tarefa por id
app.get('/tarefas/:id', (req, res) => {
  const tarefa = tarefas.find((t) => t.id === Number(req.params.id));

  if (!tarefa) {
    return res.status(404).json({ erro: 'Tarefa não encontrada' });
  }

  res.json(tarefa);
});

// 5) Criar tarefa — com os três middlewares encadeados na ordem pedida:
// autenticação -> validação do corpo -> log da ação
app.post('/tarefas', [autenticar, validarTitulo, logAcaoCriarTarefa], (req, res) => {
  const novaTarefa = {
    id: tarefas.length + 1,
    titulo: req.body.titulo,
    concluida: false,
  };

  tarefas.push(novaTarefa);
  res.status(201).json(novaTarefa);
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});