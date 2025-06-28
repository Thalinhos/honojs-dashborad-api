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


// CLIENTE ESCOLHE PRODUTO -> ESCOLHE TIPO DE CONTRATO -> ESCOLHE FORMA DE PAGAMENTO -> inicia-se a operação!