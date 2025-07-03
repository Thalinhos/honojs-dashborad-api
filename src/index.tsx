import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { users } from './routes/users.js';
import { clients } from './routes/clients.js';
import { auth } from './routes/auth.js';
import { products } from './routes/products.js';
import { contracts } from './routes/contracts.js';
import { payments } from './routes/payments.js';
import { cors } from 'hono/cors';
import { seedUsers } from './utils/scripts/seeder.js';
import { logger } from 'hono/logger';


seedUsers().then(() => console.log('✅ Seed realizado com sucesso'))

const app = new Hono()
app.use(logger())
app.use('/api/*', cors({
  origin: 'http://localhost:3001/', // Permite todas as origens
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Métodos permitidos
  allowHeaders: ['Content-Type', 'Authorization'], // Cabeçalhos permitidos
  credentials: true, // Permite cookies e cabeçalhos de autenticação
  maxAge: 3600, // Tempo em segundos que a resposta de pré-vôo pode ser armazenada em cache
}))
app.route('/auth', auth);
app.route('/users', users);
app.route('/clients', clients);
app.route('/products', products);
app.route('/contracts', contracts);
app.route('/payments',   payments);


app.get('/', (c) => {
  return c.json('Hello Hono!')
})


// app.get('/serverComponent', (c) => {
//   const pessoas = ['maria', 'joao', 'josé']
//   return c.html(Home(pessoas))
// })




serve({
  fetch: app.fetch,
  port: 3000
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})


