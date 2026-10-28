import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { prisma } from '../src/config/db.js';

const app = createApp();

let authToken: string;
let testCustomerId: string;
let testProductId: number;
let outOfStockProductId: number;

beforeAll(async () => {
  // Login to get valid auth token
  const loginRes = await request(app).post('/api/auth/login').send({
    email: 'admin@azatech.id',
    password: 'admin123',
  });

  expect(loginRes.status).toBe(200);
  authToken = loginRes.body.data.token;

  // Fetch a customer for testing
  const customer = await prisma.customer.findFirst({ where: { deletedAt: null } });
  testCustomerId = customer!.id;

  // Create two distinct test products
  const productA = await prisma.product.create({
    data: {
      productCode: 'TEST-P01',
      productName: 'Produk Uji Coba A',
      stock: 10,
      price: 15000,
    },
  });
  testProductId = Number(productA.id);

  const productB = await prisma.product.create({
    data: {
      productCode: 'TEST-P02',
      productName: 'Produk Stok Tipis B',
      stock: 2,
      price: 20000,
    },
  });
  outOfStockProductId = Number(productB.id);
});

afterAll(async () => {
  // Clean up test products
  await prisma.orderItem.deleteMany({
    where: { productId: { in: [BigInt(testProductId), BigInt(outOfStockProductId)] } },
  });
  await prisma.product.deleteMany({
    where: { id: { in: [BigInt(testProductId), BigInt(outOfStockProductId)] } },
  });
  await prisma.$disconnect();
});

describe('1. Autentikasi API Tests', () => {
  it('Harus berhasil login dengan kredensial yang valid', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'admin@azatech.id',
      password: 'admin123',
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('token');
    expect(res.body.data.user.email).toBe('admin@azatech.id');
  });

  it('Harus menolak login dengan password yang salah (401)', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'admin@azatech.id',
      password: 'wrongpassword',
    });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('Wajib: Akses tanpa token harus ditolak (401)', async () => {
    const res = await request(app).get('/api/auth/me');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/Akses ditolak/i);
  });

  it('Harus berhasil mengambil profil jika menyertakan token yang valid', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe('admin@azatech.id');
  });
});

describe('2. Manajemen Produk & Validasi Input Tests', () => {
  it('Harus dapat mengambil daftar produk dengan pagination dan search', async () => {
    const res = await request(app)
      .get('/api/products?page=1&per_page=5&search=Uji')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.meta).toHaveProperty('total');
  });

  it('Wajib: Validasi input gagal saat data produk tidak lengkap/invalid (422)', async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        product_code: '',
        product_name: '',
        stock: -5,
        price: 0,
      });

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.errors).toHaveProperty('product_code');
    expect(res.body.errors).toHaveProperty('product_name');
    expect(res.body.errors).toHaveProperty('stock');
    expect(res.body.errors).toHaveProperty('price');
  });
});

describe('3. Proses Penjualan & Transaksi Order Tests (Wajib)', () => {
  it('Wajib: Buat order sukses (mengurangi stok dan generate order_number format INV-YYYYMMDD-XXXX)', async () => {
    const initialProduct = await prisma.product.findUnique({
      where: { id: BigInt(testProductId) },
    });
    const initialStock = initialProduct!.stock;

    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        customer_id: testCustomerId,
        items: [{ product_id: testProductId, quantity: 3 }],
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('order_number');
    expect(res.body.data.order_number).toMatch(/^INV-\d{8}-\d{4}$/);
    expect(res.body.data.total_amount).toBe(15000 * 3);

    // Verifikasi stok berkurang di database
    const updatedProduct = await prisma.product.findUnique({
      where: { id: BigInt(testProductId) },
    });
    expect(updatedProduct!.stock).toBe(initialStock - 3);
  });

  it('Wajib: Order gagal saat stok tidak cukup (422) & rollback atomik tanpa mengurangi stok', async () => {
    const productBefore = await prisma.product.findUnique({
      where: { id: BigInt(outOfStockProductId) },
    });
    const stockBefore = productBefore!.stock; // stock is 2

    // Request 10 items saat stok cuma 2
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        customer_id: testCustomerId,
        items: [{ product_id: outOfStockProductId, quantity: 10 }],
      });

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/Stok tidak mencukupi/i);
    expect(res.body.errors).toHaveProperty('items.0.quantity');

    // Verifikasi transaksi di-rollback: stok tidak berubah sama sekali!
    const productAfter = await prisma.product.findUnique({
      where: { id: BigInt(outOfStockProductId) },
    });
    expect(productAfter!.stock).toBe(stockBefore);
  });

  it('Wajib: Validasi input gagal saat order tanpa menyertakan items (422)', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        customer_id: testCustomerId,
        items: [],
      });

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
  });

  it('Wajib: Akses buat order tanpa token harus ditolak (401)', async () => {
    const res = await request(app).post('/api/orders').send({
      customer_id: testCustomerId,
      items: [{ product_id: testProductId, quantity: 1 }],
    });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('Harus dapat mengambil ringkasan dashboard statistik', async () => {
    const res = await request(app)
      .get('/api/dashboard/summary')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('total_transactions');
    expect(res.body.data).toHaveProperty('total_sales_amount');
    expect(res.body.data).toHaveProperty('top_selling_products');
    expect(res.body.data).toHaveProperty('low_stock_products');
    expect(res.body.data).toHaveProperty('daily_sales');
  });
});
