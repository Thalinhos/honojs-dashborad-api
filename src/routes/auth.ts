import { Hono } from "hono";
import { getUserCollection } from "../db/db.js";
import { HTTPException } from "hono/http-exception";
import { gerarToken, validarToken } from "../jwt-util/jwt.js";
import bcrypt from 'bcrypt';
import { getCookie, setCookie } from "hono/cookie";

export const auth = new Hono();

auth.post('/login', async (c) => {
  const { email, password } = await c.req.json();
  console.log(email, password )

  const usersCollection = await getUserCollection();
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
    console.log(token);
  
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

// auth.get('/verifyToken', async (c) => {
//     const rawToken = c.req.header('Authorization');
//     const token = rawToken?.split(' ')[1];
//     console.log(token)
//     if(!token){
//       throw new HTTPException(401, { message: 'Token not found' });
//     }
  
//     try {
//       const isTokenValid = await validarToken(token);
//       if(!isTokenValid){
//         throw new HTTPException(401, { message: 'Token inválido/expirado' });
//       }
//     } catch (error) {
//       throw new HTTPException(401, { message: 'Token inválido/expirado' });
//     }
  
//     return c.body(null, 200);
//   })