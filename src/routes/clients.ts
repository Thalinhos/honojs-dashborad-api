import { Hono } from "hono";
import { parseId } from "../utils/parseMongoId.js";
import { getClientCollection } from "../db/db.js";
import { authMiddleware } from "../jwt-util/middleware-jwt.js";

export const clients = new Hono();
clients.use('*', authMiddleware);

export interface Client {
    _id?: string; // ObjectID -> MongoDB
    name: string;
    company?: string;
    email: string;
    phone?: string;
    address?: string;
    notes?: string;
  }


clients.get('/', async (c) => {
  const col = await getClientCollection();
  const list = await col.find().toArray();
  return c.json(list);
});

clients.get('/:id', async (c) => {
  const col = await getClientCollection();
  const id = parseId(c.req.param('id'));
  if (!id) return c.json('ID inválido', 400);

  const client = await col.findOne({ _id: id });
  if (!client) return c.json('Cliente não encontrado', 404);

  return c.json(client);
});

clients.post('/', async (c) => {
  const data = await c.req.json();
  const col = await getClientCollection();

  const client = await col.findOne({ email: data.email });
  if (client) return c.json('Email ja cadastrado', 400);

  const result = await col.insertOne(data);
  return c.json({ insertedId: result.insertedId }, 201);
});

clients.put('/:id', async (c) => {
    const id = parseId(c.req.param('id'));
    if (!id) return c.json('ID inválido', 400);
  
    const data = await c.req.json();
    const col = await getClientCollection();
  
    const result = await col.updateOne({ _id: id }, { $set: data });
    if (result.matchedCount === 0) return c.json('Cliente não encontrado', 404);
  
    return c.json({ modifiedCount: result.modifiedCount });
  });

clients.delete('/:id', async (c) => {
    const id = parseId(c.req.param('id'));
    if (!id) return c.json({ error: 'ID inválido' }, 400);
  
    const col = await getClientCollection();

    const client = await col.findOne({ _id: id });
  
    if (!client) return c.json({ error: 'Cliente não encontrado' }, 404);

    if (client.active === false) return c.json({ error: 'Cliente já está desativado' }, 400);
  
    const result = await col.updateOne({ _id: id }, { $set: { active: false } });
  
    if (result.modifiedCount === 0) {
      return c.json({ error: 'Falha ao desativar cliente' }, 500);
    }

    return c.json({ message: 'Cliente desativado com sucesso' });
  });
  
clients.put('/reactivate/:id', async (c) => {
    const id = parseId(c.req.param('id'));
    if (!id) return c.json({ error: 'ID inválido' }, 400);
  
    const col = await getClientCollection();

    const client = await col.findOne({ _id: id });
  
    if (!client) return c.json({ error: 'Cliente não encontrado' }, 404);

    if (client.active === true) return c.json({ error: 'Cliente já está ativo' }, 400);

    const result =await col.updateOne({ _id: id }, { $set: { active: true } });
  
    if (result.modifiedCount === 0) {
      return c.json({ error: 'Falha ao reativar cliente' }, 500);
    }
    return c.json({ message: 'Cliente reativado com sucesso' });
  });
  