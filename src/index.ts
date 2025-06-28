import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { seedUsers } from '../scripts/seeder.js';
import { users } from './routes/users.js';
import { clients } from './routes/clients.js';
import { auth } from './routes/auth.js';
import { products } from './routes/products.js';
import { contracts } from './routes/contracts.js';
import { payments } from './routes/payments.js';
import { cors } from 'hono/cors';

seedUsers().then(() => console.log('✅ Seed realizado com sucesso'))

const app = new Hono()
app.use('/api/*', cors())
app.route('/auth', auth);
app.route('/users', users);
app.route('/clients', clients);
app.route('/products', products);
app.route('/contracts', contracts);
app.route('/payments',   payments);


app.get('/', (c) => {
  return c.json('Hello Hono!')
})



serve({
  fetch: app.fetch,
  port: 3000
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})


