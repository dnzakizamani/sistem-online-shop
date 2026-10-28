import { z } from 'zod';

export const createCustomerSchema = z.object({
  customer_name: z
    .string({ required_error: 'Nama pelanggan wajib diisi' })
    .trim()
    .min(1, 'Nama pelanggan tidak boleh kosong')
    .max(150, 'Nama pelanggan maksimal 150 karakter'),
  customer_address: z
    .string({ required_error: 'Alamat pelanggan wajib diisi' })
    .trim()
    .min(1, 'Alamat pelanggan tidak boleh kosong')
    .max(255, 'Alamat maksimal 255 karakter'),
  gender: z.enum(['Pria', 'Wanita'], {
    errorMap: () => ({ message: "Jenis kelamin harus 'Pria' atau 'Wanita'" }),
  }),
  birth_date: z
    .string({ required_error: 'Tanggal lahir wajib diisi' })
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal lahir harus YYYY-MM-DD'),
  phone: z
    .string()
    .trim()
    .max(20, 'Nomor HP maksimal 20 karakter')
    .optional()
    .nullable(),
});

export const updateCustomerSchema = createCustomerSchema.partial();

export const customerQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  per_page: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().optional(),
});

export const customerIdParamSchema = z.object({
  id: z.string().uuid('ID pelanggan harus berupa format UUID yang valid'),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
export type CustomerQueryInput = z.infer<typeof customerQuerySchema>;
