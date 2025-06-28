import { Hono } from "hono";
import { getClientCollection, getContractCollection } from "../db/db.js";
import { parseId } from "../utils/parseMongoId.js";
import { authMiddleware } from "../jwt-util/middleware-jwt.js";

export type ProductType = 'one_time' | 'recurring';
export type ContractStatus = 'active' | 'canceled' | 'finished';
export interface Contract {
    _id?: string;
    clientId: string; // Referência ao Client
    productId: string; // Referência ao Product
    type: ProductType;
    startDate: Date;
    endDate?: Date | null; // Pode ser null para contratos abertos
    price: number;
    status: ContractStatus;
  }


export const contracts = new Hono();
contracts.use('*', authMiddleware);


contracts.get('/', async (c) => {
  const col = await getContractCollection();
  const list = await col.find().toArray();
  return c.json(list);
});

contracts.get('/:id', async (c) => {
  const col = await getContractCollection();
  const id = parseId(c.req.param('id'));
  if (!id) return c.json('ID inválido', 400);

  const contract = await col.findOne({ _id: id });
  if (!contract) return c.json('Contrato não encontrado', 404);

  return c.json(contract);
});

contracts.post('/', async (c) => {
    const data = await c.req.json();
  
    if (!data.client || !data.product) return c.json('Dados inválidos', 400);
  
    const clientId = parseId(data.client);
    if (!clientId) return c.json('ID de cliente inválido', 400);
  
    const clientCol = await getClientCollection();
    const client = await clientCol.findOne({ _id: clientId });
    if (!client || client.active === false) return c.json('Cliente não encontrado ou desativado', 404);
  
    // const productCol = await getProductCollection();
    // const productId = parseId(data.product);
    // if (!productId) return c.json('ID de produto inválido', 400);
    // const product = await productCol.findOne({ _id: productId });
    // if (!product) return c.json('Produto não encontrado', 404);
  
    const col = await getContractCollection();

    const result = await col.insertOne(data);
  
    if (!result) return c.json('Erro ao criar contrato', 500);
    
    return c.json({ insertedId: result.insertedId }, 201);
  });
  

contracts.put('/:id', async (c) => {
  const id = parseId(c.req.param('id'));
  if (!id) return c.json('ID inválido', 400);

  const data = await c.req.json();
  const col = await getContractCollection();

  const result = await col.updateOne({ _id: id }, { $set: data });
  if (result.matchedCount === 0) return c.json('Contrato não encontrado', 404);

  return c.json({ modifiedCount: result.modifiedCount });
});

contracts.delete('/:id', async (c) => {
    const id = parseId(c.req.param('id'));
    if (!id) return c.json({ error: 'ID inválido' }, 400);
  
    const col = await getContractCollection();
    const contract = await col.findOne({ _id: id });
  
    if (!contract) return c.json({ error: 'Contrato não encontrado' }, 404);
    if (contract.active === false) return c.json({ error: 'Contrato já está desativado' }, 400);
  
    const result = await col.updateOne({ _id: id }, { $set: { active: false } });
    return c.json({ message: 'Contrato desativado com sucesso' });
  });
  
  contracts.put('/reactivate/:id', async (c) => {
    const id = parseId(c.req.param('id'));
    if (!id) return c.json({ error: 'ID inválido' }, 400);
  
    const col = await getContractCollection();
    const contract = await col.findOne({ _id: id });
  
    if (!contract) return c.json({ error: 'Contrato não encontrado' }, 404);
    if (contract.active === true) return c.json({ error: 'Contrato já está ativo' }, 400);
  
    await col.updateOne({ _id: id }, { $set: { active: true } });
    return c.json({ message: 'Contrato reativado com sucesso' });
  });