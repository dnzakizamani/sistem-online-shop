import { z } from 'zod';

export const createProductSchema = z.object({
  product_code: z
    .string({ required_error: 'Kode produk wajib diisi' })
    .trim()
    .min(1, 'Kode produk tidak boleh kosong')
    .max(20, 'Kode produk maksimal 20 karakter'),
  product_name: z
    .string({ required_error: 'Nama produk wajib diisi' })
    .trim()
    .min(1, 'Nama produk tidak boleh kosong')
    .max(150, 'Nama produk maksimal 150 karakter'),
  stock: z.coerce
    .number({ required_error: 'Stok wajib diisi' })
    .int('Stok harus berupa bilangan bulat')
    .min(0, 'Stok tidak boleh negatif (minimal 0)'),
  price: z.coerce
    .number({ required_error: 'Harga wajib diisi' })
    .positive('Harga harus lebih besar dari 0'),
});

export const updateProductSchema = createProductSchema.partial();

export const productQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  per_page: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().optional(),
  sort: z
    .enum([
      'name_asc',
      'name_desc',
      'price_asc',
      'price_desc',
      'stock_asc',
      'stock_desc',
      'created_at_desc',
    ])
    .default('created_at_desc'),
});

export const productIdParamSchema = z.object({
  id: z.coerce.number().int().positive('ID produk tidak valid'),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductQueryInput = z.infer<typeof productQuerySchema>;
