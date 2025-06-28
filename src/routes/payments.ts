import { Hono } from "hono";
import { authMiddleware } from "../jwt-util/middleware-jwt.js";
import { getClientCollection, getContractCollection, getPaymentCollection, getUserCollection } from "../db/db.js";
import { parseId } from "../utils/parseMongoId.js";

export type PaymentMethod = 'pix' | 'boleto' | 'cartao' | 'dinheiro';
export interface Payment {
    _id?: string;
    clientId: string;
    contractId: string;
    productId?: string; // Se quiser guardar direto também
    date: Date;
    amount: number;
    method: PaymentMethod;
    notes?: string;
  }

export const payments = new Hono();
payments.use('*', authMiddleware);

payments.get('/', async (c) => {
  const col = await getPaymentCollection();
  const list = await col.find().toArray();
  return c.json(list);
});

payments.get('/:id', async (c) => {
  const col = await getPaymentCollection();
  const id = parseId(c.req.param('id'));
  if (!id) return c.json('ID inválido', 400);

  const payment = await col.findOne({ _id: id });
  if (!payment) return c.json('Pagamento não encontrado', 404);

  return c.json(payment);
});

payments.post('/', async (c) => {
    const data = await c.req.json();
  
    if (!data.clientId || !data.contractId) return c.json('Dados inválidos', 400);
  
    const clientId = parseId(data.clientId);
    if (!clientId) return c.json('ID de cliente inválido', 400);
  
    const contractId = parseId(data.contractId);
    if (!contractId) return c.json('ID de contrato inválido', 400);
  
    const clientsCol = await getClientCollection();
    const user = await clientsCol.findOne({ _id: clientId });
    if (!user) return c.json('Usuário não encontrado', 404);
  
    const contractsCol = await getContractCollection();
    const contract = await contractsCol.findOne({ _id: contractId });
    if (!contract) return c.json('Contrato não encontrado', 404);
  
    const col = await getPaymentCollection();
    const result = await col.insertOne(data);
  
    return c.json({ insertedId: result.insertedId }, 201);
  });
  

payments.put('/:id', async (c) => {
  const id = parseId(c.req.param('id'));
  if (!id) return c.json('ID inválido', 400);

  const data = await c.req.json();
  const col = await getPaymentCollection();

  const result = await col.updateOne({ _id: id }, { $set: data });
  if (result.matchedCount === 0) return c.json('Pagamento não encontrado', 404);

  return c.json({ modifiedCount: result.modifiedCount });
});

payments.delete('/:id', async (c) => {
    const id = parseId(c.req.param('id'));
    if (!id) return c.json({ error: 'ID inválido' }, 400);
  
    const col = await getPaymentCollection();
    const payment = await col.findOne({ _id: id });
  
    if (!payment) return c.json({ error: 'Pagamento não encontrado' }, 404);
    if (payment.active === false) return c.json({ error: 'Pagamento já está desativado' }, 400);
  
    const result = await col.updateOne({ _id: id }, { $set: { active: false } });
    return c.json({ message: 'Pagamento desativado com sucesso' });
  });
  
  payments.put('/reactivate/:id', async (c) => {
    const id = parseId(c.req.param('id'));
    if (!id) return c.json({ error: 'ID inválido' }, 400);
  
    const col = await getPaymentCollection();
    const payment = await col.findOne({ _id: id });
  
    if (!payment) return c.json({ error: 'Pagamento não encontrado' }, 404);
    if (payment.active === true) return c.json({ error: 'Pagamento já está ativo' }, 400);
  
    await col.updateOne({ _id: id }, { $set: { active: true } });
    return c.json({ message: 'Pagamento reativado com sucesso' });
  });
  