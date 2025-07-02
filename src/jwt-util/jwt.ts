import { sign, verify } from 'hono/jwt';

const SECRET = process.env.JWT_SECRET;
if(!SECRET) {
    throw new Error('JWT_SECRET is not defined in environment variables');
}

const SECRET_MAIL = process.env.SESSION_SECRET_MAIL;
if(!SECRET_MAIL) {
    throw new Error('JWT_SECRET_MAIL is not defined in environment variables');
}

interface Payload {
    _id?: string;
    email?: string;
    exp?: Date; // exp: Math.floor(Date.now() / 1000) + 60 * 5 
}   

export async function gerarToken(payload: Payload, exp?: number) {
  const payloadWithExp = { ...payload, exp: exp ?? Math.floor(Date.now() / 1000) + 60 * 60 }
  return await sign(payloadWithExp as any, SECRET as any);
}

export async function validarToken(tokenToVerify: string) {
    const decodedPayload = await verify(tokenToVerify, SECRET as any)
    return decodedPayload;
}

export async function gerarMailToken(payload: Payload, exp?: number) {
  const payloadWithExp = { ...payload, exp: exp ?? Math.floor(Date.now() / 1000) + 60 * 60 }
  return await sign(payloadWithExp as any, SECRET_MAIL as any);
}

export async function validarMailToken(tokenToVerify: string) {
    const decodedPayload = await verify(tokenToVerify, SECRET_MAIL as any)
    return decodedPayload;
}
