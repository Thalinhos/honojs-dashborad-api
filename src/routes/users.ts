//users.ts
import { Hono } from "hono";
import { authMiddleware } from "../jwt-util/middleware-jwt.js";
import { getUserCollection } from "../db/db.js";
import { parseId } from "../utils/parseMongoId.js";
import bcrypt from 'bcrypt';


export const users = new Hono();
users.use('*', authMiddleware);

users.get('/', async (c) => {
  const col = await getUserCollection();
  const list = await col.find({}, { projection: { password: 0 } }).toArray();
  return c.json(list);
});

users.get('/:id', async (c) => {
  const col = await getUserCollection();
  const id = parseId(c.req.param('id'));
  if (!id) return c.json('ID inválido', 400);

  const user = await col.findOne({ _id: id }, { projection: { password: 0 } });
  if (!user) return c.json('Usuário não encontrado', 404);

  return c.json(user);
});

users.post('/', async (c) => {
  const data = await c.req.json();

  if (!data.email || !data.name || !data.password) {
    return c.json('Dados inválidos', 400);
  }
  const col = await getUserCollection();

  if (await col.findOne({ email: data.email })) {
    return c.json('Email já cadastrado', 400);
  }

  data.password = await bcrypt.hash(data.password, 10);

  const result = await col.insertOne({ ...data, active: true });

  return c.json({ insertedId: result.insertedId }, 201);
});


users.put('/:id', async (c) => {
  const id = parseId(c.req.param('id'));
  if (!id) return c.json('ID inválido', 400);

  const col = await getUserCollection();

  const userToFind = await col.findOne({ _id: id });
  if (!userToFind) return c.json('Usuário nao encontrado', 404);

  const data = await c.req.json();
  if (data.password){
    data.password = await bcrypt.hash(data.password, 10);
  }

  const result = await col.updateOne({ _id: id }, { $set: data });
  if (result.matchedCount === 0) return c.json('Erro ao atualizar usuário', 400);

  return c.json({ modifiedCount: result.modifiedCount });
});

users.delete('/:id', async (c) => {
  const id = parseId(c.req.param('id'));
  if (!id) return c.json({ error: 'ID inválido' }, 400);

  const col = await getUserCollection();

  const user = await col.findOne({ _id: id });

  if (!user) {
    return c.json({ error: 'Usuário não encontrado' }, 404);
  }

  if (user.active === false) {
    return c.json({ error: 'Usuário já está desativado' }, 400);
  }

  if(!user.active){
    return c.json({ error: 'Erro ao desativar usuário' }, 404);
  }

  const result = await col.updateOne({ _id: id }, { $set: { active: false } });
  if (result.modifiedCount === 0) {
    return c.json({ error: 'Falha ao desativar usuário' }, 500);
  }

  return c.json({ message: 'Usuário desativado com sucesso' });
});

users.put('/reactivate/:id', async (c) => {
  const id = parseId(c.req.param('id'));
  if (!id) return c.json({ error: 'ID inválido' }, 400);

  const col = await getUserCollection();

  const user = await col.findOne({ _id: id });

  if (!user) {
    return c.json({ error: 'Usuário não encontrado' }, 404);
  }

  if (user.active === true) {
    return c.json({ error: 'Usuário já está ativo' }, 400);
  }

  const result = await col.updateOne({ _id: id }, { $set: { active: true } });
  
  if (result.modifiedCount === 0) {
    return c.json({ error: 'Falha ao reativar usuário' }, 500);
  }

  return c.json({ message: 'Usuário reativado com sucesso' });
});
