import { z } from 'zod';

export const orderItemInputSchema = z.object({
  product_id: z.coerce
    .number({ required_error: 'ID produk wajib diisi' })
    .int()
    .positive('ID produk tidak valid'),
  quantity: z.coerce
    .number({ required_error: 'Jumlah produk wajib diisi' })
    .int('Jumlah harus berupa bilangan bulat')
    .min(1, 'Jumlah produk minimal 1'),
});

export const createOrderSchema = z.object({
  customer_id: z
    .string({ required_error: 'ID pelanggan wajib diisi' })
    .uuid('ID pelanggan harus berupa format UUID yang valid'),
  items: z
    .array(orderItemInputSchema)
    .min(1, 'Pesanan harus berisi minimal 1 produk'),
});

export const orderQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  per_page: z.coerce.number().int().min(1).max(100).default(10),
  from: z
    .string()
    .optional()
    .refine((val) => !val || /^\d{4}-\d{2}-\d{2}$/.test(val), {
      message: 'Format tanggal from harus YYYY-MM-DD',
    }),
  to: z
    .string()
    .optional()
    .refine((val) => !val || /^\d{4}-\d{2}-\d{2}$/.test(val), {
      message: 'Format tanggal to harus YYYY-MM-DD',
    }),
  customer_id: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val),
      { message: 'ID pelanggan tidak valid' }
    ),
});

export const orderIdParamSchema = z.object({
  id: z.coerce.number().int().positive('ID order tidak valid'),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type OrderQueryInput = z.infer<typeof orderQuerySchema>;
