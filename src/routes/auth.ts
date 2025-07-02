import { Hono } from "hono";
import { getUserCollection } from "../db/db.js";
import { HTTPException } from "hono/http-exception";
import { gerarMailToken, gerarToken, validarMailToken, validarToken } from "../jwt-util/jwt.js";
import bcrypt from 'bcrypt';
import { getCookie, setCookie } from "hono/cookie";

import { parseId } from "../utils/parseMongoId.js";
import { sendResetPasswordEmail } from "../mailService/resetPassword.js";
import { email, set } from "zod/v4";
import { ObjectId } from "mongodb";

export const auth = new Hono();

auth.post('/login', async (c) => {
  const { email, password } = await c.req.json();

  const usersCollection = await getUserCollection();
  const user = await usersCollection.findOne({ email });
    if(!user){
      throw new HTTPException(401, { message: 'Credenciais inválidas' });
    }

    const isValidPass = await bcrypt.compare(password, user.password);

    if(!isValidPass){
      throw new HTTPException(401, { message: 'Credenciais inválidas' });
    }

    const token = await gerarToken({ _id:  user._id.toString(), email: user.email });
    if(!token){
      throw new HTTPException(500, { message: 'Erro ao criar token' });
    }

    setCookie(c, 'token', token, {
      httpOnly: true,      // Impede acesso via JS no frontend (recomendado)
      secure: false,       // true em produção com HTTPS
      maxAge: 60 * 60 * 24, // 1 dia em segundos
      path: '/',           // Cookie disponível em toda a aplicação
    });

    return c.json({
        mensagem: 'Login realizado com sucesso',
    }, 200);
});

auth.get('/verifyToken', async (c) => {
    const token = getCookie(c, 'token');
  
    if (!token) {
      return c.json({ message: 'Token não fornecido' }, 401);
    }
  
    try {
      const isValid = await validarToken(token);
      if (!isValid) {
        return c.json({ message: 'Token inválido ou expirado' }, 401);
      }
    } catch {
      return c.json({ message: 'Token inválido ou expirado' }, 401);
    }
  
    return c.body(null, 200);
  });

auth.post('/logout', async (c: any) => {
  
  const token = getCookie(c, 'token');

  if (!token) {
    return c.body(null, 204);
  }

  setCookie(c, 'token', '', { 
      httpOnly: true,      
      secure: false,       
      maxAge: 0,          
  })
  
  return c.body(null, 200);
})

auth.post('/ask-reset-password', async (c) => {
  try {
    const body = await c.req.json();
    const userEmail = body.email;

    const usersCollection = await getUserCollection();
    const user = await usersCollection.findOne({ email: userEmail });
    if (!user) return c.json({ message: 'Usuário não encontrado' }, 404);

    // const emailSent = await sendResetPasswordEmail(userId.toString(), user.email);
    const emailSent = await sendResetPasswordEmail(userEmail); 

    if (!emailSent) throw new Error('Erro ao enviar email');
    console.log('Email enviado com sucesso para:', user.email);
    
    return c.json({ message: 'Email enviado com sucesso' }, 200);

  } catch (error) {
    console.error(error);
    return c.json({ message: 'Erro interno ao processar solicitação' }, 500);
  }
});

auth.get('/reset-password/:mailToken', async (c) => {
  try {
    const { mailToken } = c.req.param();
    const valid = await validarMailToken(mailToken);
    
    if (!valid) return c.json({ message: 'Token inválido ou expirado' }, 400);
    
    return c.json({ message: 'Token válido, pode redefinir a senha' }, 200);
    
  } catch (error) {
    console.error(error);
    return c.json({ message: 'Erro interno' }, 500);
  }
});

auth.post('/reset-password', async (c) => {
  try {
    const { token, newPassword } = await c.req.json();
    
    const decoded = await validarMailToken(token);
    console.log(decoded);
    if (!decoded) return c.json({ message: 'Token inválido ou expirado' }, 400);
    
    const usersCollection = await getUserCollection();
    const user = await usersCollection.findOne({ email: decoded.email });
    if (!user) return c.json({ message: 'Usuário não encontrado' }, 404);
    
    const hashedPassword = await bcrypt.hash(newPassword, 10); 
    
    await usersCollection.updateOne(
      { email: decoded.email },
      { $set: { password: hashedPassword } }
    );
    
    return c.json({ message: 'Senha redefinida com sucesso' }, 200);
    
  } catch (error) {
    console.error(error);
    return c.json({ message: 'Erro interno ao redefinir senha' }, 500);
  }
});