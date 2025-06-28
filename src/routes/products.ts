import { Hono } from "hono";
import { authMiddleware } from "../jwt-util/middleware-jwt.js";
import { getProductCollection } from "../db/db.js";
import { parseId } from "../utils/parseMongoId.js";

export type ProductType = 'one_time' | 'recurring';
export interface Product {
    _id?: string;
    name: string;
    description?: string;
    type: ProductType;
    price: number;
    active: boolean;
  }

export const products = new Hono();
products.use('*', authMiddleware);

products.get('/', async (c) => {
  const col = await getProductCollection();
  const list = await col.find().toArray();
  return c.json(list);
});

products.get('/:id', async (c) => {
  const col = await getProductCollection();
  const id = parseId(c.req.param('id'));
  if (!id) return c.json('ID inválido', 400);

  const product = await col.findOne({ _id: id });
  if (!product) return c.json('Produto não encontrado', 404);

  return c.json(product);
});

products.post('/', async (c) => {
  const data = await c.req.json();
  const col = await getProductCollection();
  const product = await col.findOne({ name: data.name });
  if (product) return c.json('Produto ja cadastrado', 400);
  const result = await col.insertOne(data);
  return c.json({ insertedId: result.insertedId }, 201);
});

products.put('/:id', async (c) => {
  const id = parseId(c.req.param('id'));
  if (!id) return c.json('ID inválido', 400);

  const data = await c.req.json();
  const col = await getProductCollection();

  const result = await col.updateOne({ _id: id }, { $set: data });
  if (result.matchedCount === 0) return c.json('Produto não encontrado', 404);

  return c.json({ modifiedCount: result.modifiedCount });
});

products.delete('/:id', async (c) => {
    const id = parseId(c.req.param('id'));
    if (!id) return c.json({ error: 'ID inválido' }, 400);
  
    const col = await getProductCollection();
    const product = await col.findOne({ _id: id });
  
    if (!product) return c.json({ error: 'Produto não encontrado' }, 404);
    if (product.active === false) return c.json({ error: 'Produto já está desativado' }, 400);
  
    const result = await col.updateOne({ _id: id }, { $set: { active: false } });
  
    if (result.modifiedCount === 0) {
      return c.json({ error: 'Falha ao desativar produto' }, 500);
    }
    return c.json({ message: 'Produto desativado com sucesso' });
  });
  
  products.put('/reactivate/:id', async (c) => {
    const id = parseId(c.req.param('id'));
    if (!id) return c.json({ error: 'ID inválido' }, 400);
  
    const col = await getProductCollection();
    const product = await col.findOne({ _id: id });
  
    if (!product) return c.json({ error: 'Produto não encontrado' }, 404);
    if (product.active === true) return c.json({ error: 'Produto já está ativo' }, 400);
  
    const result = await col.updateOne({ _id: id }, { $set: { active: true } });
    if (result.modifiedCount === 0) {
      return c.json({ error: 'Falha ao reativar produto' }, 500);
    }
    return c.json({ message: 'Produto reativado com sucesso' });
  });