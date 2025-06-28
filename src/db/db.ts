import { MongoClient, Db } from 'mongodb';

const url = process.env.MONGODB_URL;
if (!url) {
  throw new Error('MongoDB URL is not defined in environment variables');
}

const dbName = 'dashboard-tw';

let client: MongoClient | null = null;
let db: Db | null = null;

async function connectToDB(): Promise<Db> {
  if (db) {
    return db;
  }

  client = new MongoClient(url!);
  await client.connect();
  db = client.db(dbName);
  console.log('✅ Connected to MongoDB');
  return db;
}

export async function getUserCollection() {
  const database = await connectToDB();
  return database.collection('users');
}

export async function getSessionCollection() {
  const database = await connectToDB();
  return database.collection('sessions');
}

export async function getClientCollection() {
  const database = await connectToDB();
  return database.collection('clients');
}

export async function getProductCollection() {
  const database = await connectToDB();
  return database.collection('products');
}

export async function getContractCollection() {
  const database = await connectToDB();
  return database.collection('contracts');
}

export async function getPaymentCollection() {
  const database = await connectToDB();
  return database.collection('payments');
}

// --------------------------------------------------------------------------------- //

export type ProductType = 'one_time' | 'recurring';
export type ContractStatus = 'active' | 'canceled' | 'finished';
export type PaymentMethod = 'pix' | 'boleto' | 'cartao' | 'dinheiro';

export interface User {
  _id?: string; // ObjectID -> MongoDB
  email: string;
  password: string;
}

export interface Client {
  _id?: string; // ObjectID -> MongoDB
  name: string;
  company?: string;
  email: string;
  phone?: string;
  address?: string;
  notes?: string;
}

export interface Product {
  _id?: string;
  name: string;
  description?: string;
  type: ProductType;
  price: number;
  active: boolean;
}

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