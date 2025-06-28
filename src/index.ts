import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception';

import { gerarToken, validarToken } from './jwt-util/jwt.js';
import { getClientCollection, getContractCollection, getPaymentCollection, getProductCollection, getUserCollection } from './db/db.js';
import bcrypt from 'bcrypt';
import { seedUsers } from '../scripts/seeder.js';
import { ObjectId } from 'mongodb';
import { authMiddleware } from './jwt-util/middleware-jwt.js';

seedUsers().then(() => console.log('✅ Seed realizado com sucesso'))

function parseId(id: string) {
  try {
    return new ObjectId(id);
  } catch {
    return null;
  }
}

const app = new Hono()
const usersCollection = await getUserCollection();

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

app.post('/login', async (c) => {
  const { email, password } = await c.req.json();
  console.log(email, password )

  const user = await usersCollection.findOne({ email });
    if(!user){
      throw new HTTPException(401, { message: 'Credenciais inválidas' });
    }

    const isValidPass = await bcrypt.compare(password, user.password);

    if(!isValidPass){
      throw new HTTPException(401, { message: 'Credenciais inválidas' });
    }

    const token = await gerarToken({ email: user.email });
    if(!token){
      throw new HTTPException(500, { message: 'Erro ao criar token' });
    }

    return c.json({
      mensagem: 'Login realizado com sucesso',
      token,
    }, 200);
});

app.get('/verifyToken', async (c) => {
  const rawToken = c.req.header('Authorization');
  const token = rawToken?.split(' ')[1];
  console.log(token)
  if(!token){
    throw new HTTPException(401, { message: 'Token not found' });
  }

  try {
    const isTokenValid = await validarToken(token);
    if(!isTokenValid){
      throw new HTTPException(401, { message: 'Token inválido/expirado' });
    }
  } catch (error) {
    throw new HTTPException(401, { message: 'Token inválido/expirado' });
  }

  return c.body(null, 200);
})


// --- ROTAS USERS ---
const users = new Hono();
users.use('*', authMiddleware);

users.get('/', async (c) => {
  const col = await getUserCollection();
  const list = await col.find({}, { projection: { password: 0 } }).toArray();
  return c.json(list);
});

users.get('/:id', async (c) => {
  const col = await getUserCollection();
  const id = parseId(c.req.param('id'));
  if (!id) return c.text('ID inválido', 400);

  const user = await col.findOne({ _id: id }, { projection: { password: 0 } });
  if (!user) return c.text('Usuário não encontrado', 404);

  return c.json(user);
});

users.post('/', async (c) => {
  const data = await c.req.json();
  if (!data.email ||!data.name || !data.password) return c.json('Dados inválidos', 400);
  if (await usersCollection.findOne({ email: data.email })) return c.json('Email ja cadastrado', 400);
  const col = await getUserCollection();
  const result = await col.insertOne(data);
  return c.json({ insertedId: result.insertedId }, 201);
});

users.put('/:id', async (c) => {
  const id = parseId(c.req.param('id'));
  if (!id) return c.text('ID inválido', 400);

  const data = await c.req.json();
  if (data.password){
    data.password = await bcrypt.hash(data.password, 10);
  }
  const col = await getUserCollection();

  const result = await col.updateOne({ _id: id }, { $set: data });
  if (result.matchedCount === 0) return c.text('Usuário não encontrado', 404);

  return c.json({ modifiedCount: result.modifiedCount });
});

// users.delete('/:id', async (c) => {
//   const id = parseId(c.req.param('id'));
//   if (!id) return c.text('ID inválido', 400);

//   const col = await getUserCollection();
//   const result = await col.deleteOne({ _id: id });
//   if (result.deletedCount === 0) return c.text('Usuário não encontrado', 404);

//   return c.text('Usuário deletado');
// });
app.route('/users', users);

// --- ROTAS CLIENTS ---
const clients = new Hono();
clients.use('*', authMiddleware);


clients.get('/', async (c) => {
  const col = await getClientCollection();
  const list = await col.find().toArray();
  return c.json(list);
});

clients.get('/:id', async (c) => {
  const col = await getClientCollection();
  const id = parseId(c.req.param('id'));
  if (!id) return c.text('ID inválido', 400);

  const client = await col.findOne({ _id: id });
  if (!client) return c.text('Cliente não encontrado', 404);

  return c.json(client);
});

clients.post('/', async (c) => {
  const data = await c.req.json();
  const col = await getClientCollection();
  const result = await col.insertOne(data);
  return c.json({ insertedId: result.insertedId }, 201);
});

clients.put('/:id', async (c) => {
  const id = parseId(c.req.param('id'));
  if (!id) return c.text('ID inválido', 400);

  const data = await c.req.json();
  const col = await getClientCollection();

  const result = await col.updateOne({ _id: id }, { $set: data });
  if (result.matchedCount === 0) return c.text('Cliente não encontrado', 404);

  return c.json({ modifiedCount: result.modifiedCount });
});

// clients.delete('/:id', async (c) => {
//   const id = parseId(c.req.param('id'));
//   if (!id) return c.text('ID inválido', 400);

//   const col = await getClientCollection();
//   const result = await col.deleteOne({ _id: id });
//   if (result.deletedCount === 0) return c.text('Cliente não encontrado', 404);

//   return c.text('Cliente deletado');
// });
app.route('/clients', clients);

// --- ROTAS PRODUCTS ---
const products = new Hono();
products.use('*', authMiddleware);


products.get('/', async (c) => {
  const col = await getProductCollection();
  const list = await col.find().toArray();
  return c.json(list);
});

products.get('/:id', async (c) => {
  const col = await getProductCollection();
  const id = parseId(c.req.param('id'));
  if (!id) return c.text('ID inválido', 400);

  const product = await col.findOne({ _id: id });
  if (!product) return c.text('Produto não encontrado', 404);

  return c.json(product);
});

products.post('/', async (c) => {
  const data = await c.req.json();
  const col = await getProductCollection();
  const result = await col.insertOne(data);
  return c.json({ insertedId: result.insertedId }, 201);
});

products.put('/:id', async (c) => {
  const id = parseId(c.req.param('id'));
  if (!id) return c.text('ID inválido', 400);

  const data = await c.req.json();
  const col = await getProductCollection();

  const result = await col.updateOne({ _id: id }, { $set: data });
  if (result.matchedCount === 0) return c.text('Produto não encontrado', 404);

  return c.json({ modifiedCount: result.modifiedCount });
});

// products.delete('/:id', async (c) => {
//   const id = parseId(c.req.param('id'));
//   if (!id) return c.text('ID inválido', 400);

//   const col = await getProductCollection();
//   const result = await col.deleteOne({ _id: id });
//   if (result.deletedCount === 0) return c.text('Produto não encontrado', 404);

//   return c.text('Produto deletado');
// });
app.route('/products', products);

// --- ROTAS CONTRACTS ---
const contracts = new Hono();
contracts.use('*', authMiddleware);


contracts.get('/', async (c) => {
  const col = await getContractCollection();
  const list = await col.find().toArray();
  return c.json(list);
});

contracts.get('/:id', async (c) => {
  const col = await getContractCollection();
  const id = parseId(c.req.param('id'));
  if (!id) return c.text('ID inválido', 400);

  const contract = await col.findOne({ _id: id });
  if (!contract) return c.text('Contrato não encontrado', 404);

  return c.json(contract);
});

contracts.post('/', async (c) => {
  const data = await c.req.json();
  if(!data.client || !data.product) return c.text('Dados inválidos', 400);
  const clinetCol = await getClientCollection();
  const client = await clinetCol.findOne({ _id: data.client });
  if (!client) return c.text('Cliente nao encontrado', 404);
  // const productCol = await getProductCollection();
  // const product = await productCol.findOne({ _id: data.product });
  // if (!product) return c.text('Produto nao encontrado', 404);
  const col = await getContractCollection();
  const result = await col.insertOne(data);
  return c.json({ insertedId: result.insertedId }, 201);
});

contracts.put('/:id', async (c) => {
  const id = parseId(c.req.param('id'));
  if (!id) return c.text('ID inválido', 400);

  const data = await c.req.json();
  const col = await getContractCollection();

  const result = await col.updateOne({ _id: id }, { $set: data });
  if (result.matchedCount === 0) return c.text('Contrato não encontrado', 404);

  return c.json({ modifiedCount: result.modifiedCount });
});

// contracts.delete('/:id', async (c) => {
//   const id = parseId(c.req.param('id'));
//   if (!id) return c.text('ID inválido', 400);

//   const col = await getContractCollection();
//   const result = await col.deleteOne({ _id: id });
//   if (result.deletedCount === 0) return c.text('Contrato não encontrado', 404);

//   return c.text('Contrato deletado');
// });
app.route('/contracts', contracts);

// --- ROTAS PAYMENTS ---
const payments = new Hono();
payments.use('*', authMiddleware);

payments.get('/', async (c) => {
  const col = await getPaymentCollection();
  const list = await col.find().toArray();
  return c.json(list);
});

payments.get('/:id', async (c) => {
  const col = await getPaymentCollection();
  const id = parseId(c.req.param('id'));
  if (!id) return c.text('ID inválido', 400);

  const payment = await col.findOne({ _id: id });
  if (!payment) return c.text('Pagamento não encontrado', 404);

  return c.json(payment);
});

payments.post('/', async (c) => {
  const data = await c.req.json();
  if(!data.clientId || !data.contractId) return c.text('Dados inválidos', 400);
  const usersCol = await getUserCollection();
  const user = await usersCol.findOne({ _id: data.clientId });
  if (!user) return c.text('Usuário nao encontrado', 404);
  const contractsCol = await getContractCollection();
  const contract = await contractsCol.findOne({ _id: data.contractId });
  if (!contract) return c.text('Contrato nao encontrado', 404);
  const col = await getPaymentCollection();
  const result = await col.insertOne(data);
  return c.json({ insertedId: result.insertedId }, 201);
});

payments.put('/:id', async (c) => {
  const id = parseId(c.req.param('id'));
  if (!id) return c.text('ID inválido', 400);

  const data = await c.req.json();
  const col = await getPaymentCollection();

  const result = await col.updateOne({ _id: id }, { $set: data });
  if (result.matchedCount === 0) return c.text('Pagamento não encontrado', 404);

  return c.json({ modifiedCount: result.modifiedCount });
});

// payments.delete('/:id', async (c) => {
//   const id = parseId(c.req.param('id'));
//   if (!id) return c.text('ID inválido', 400);

//   const col = await getPaymentCollection();
//   const result = await col.deleteOne({ _id: id });
//   if (result.deletedCount === 0) return c.text('Pagamento não encontrado', 404);

//   return c.text('Pagamento deletado');
// });
app.route('/payments', payments);


serve({
  fetch: app.fetch,
  port: 3000
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})


