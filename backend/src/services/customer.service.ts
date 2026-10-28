import { Gender, Prisma } from '@prisma/client';
import { prisma } from '../config/db.js';
import { AppError } from '../utils/response.js';
import {
  CreateCustomerInput,
  CustomerQueryInput,
  UpdateCustomerInput,
} from '../validations/customer.validation.js';

export class CustomerService {
  static async list(query: CustomerQueryInput) {
    const page = Number(query.page) || 1;
    const perPage = Number(query.per_page) || 10;
    const skip = (page - 1) * perPage;

    const where: Prisma.CustomerWhereInput = {
      deletedAt: null,
    };

    if (query.search) {
      where.customerName = { contains: query.search, mode: 'insensitive' };
    }

    const [total, customers] = await Promise.all([
      prisma.customer.count({ where }),
      prisma.customer.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: perPage,
      }),
    ]);

    const formatted = customers.map((c) => ({
      id: c.id,
      customer_name: c.customerName,
      customer_address: c.customerAddress,
      gender: c.gender,
      birth_date: c.birthDate.toISOString().split('T')[0],
      phone: c.phone,
      created_at: c.createdAt,
      updated_at: c.updatedAt,
      deleted_at: c.deletedAt,
    }));

    return {
      customers: formatted,
      meta: {
        page,
        per_page: perPage,
        total,
        total_pages: Math.ceil(total / perPage) || 1,
      },
    };
  }

  static async getById(id: string) {
    const customer = await prisma.customer.findFirst({
      where: { id, deletedAt: null },
    });

    if (!customer) {
      throw new AppError('Pelanggan tidak ditemukan atau telah dihapus', 404);
    }

    return {
      id: customer.id,
      customer_name: customer.customerName,
      customer_address: customer.customerAddress,
      gender: customer.gender,
      birth_date: customer.birthDate.toISOString().split('T')[0],
      phone: customer.phone,
      created_at: customer.createdAt,
      updated_at: customer.updatedAt,
      deleted_at: customer.deletedAt,
    };
  }

  static async create(data: CreateCustomerInput) {
    const customer = await prisma.customer.create({
      data: {
        customerName: data.customer_name,
        customerAddress: data.customer_address,
        gender: data.gender as Gender,
        birthDate: new Date(data.birth_date),
        phone: data.phone || null,
      },
    });

    return {
      id: customer.id,
      customer_name: customer.customerName,
      customer_address: customer.customerAddress,
      gender: customer.gender,
      birth_date: customer.birthDate.toISOString().split('T')[0],
      phone: customer.phone,
      created_at: customer.createdAt,
      updated_at: customer.updatedAt,
      deleted_at: customer.deletedAt,
    };
  }

  static async update(id: string, data: UpdateCustomerInput) {
    const existing = await prisma.customer.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new AppError('Pelanggan tidak ditemukan', 404);
    }

    const updated = await prisma.customer.update({
      where: { id },
      data: {
        ...(data.customer_name ? { customerName: data.customer_name } : {}),
        ...(data.customer_address ? { customerAddress: data.customer_address } : {}),
        ...(data.gender ? { gender: data.gender as Gender } : {}),
        ...(data.birth_date ? { birthDate: new Date(data.birth_date) } : {}),
        ...(data.phone !== undefined ? { phone: data.phone } : {}),
      },
    });

    return {
      id: updated.id,
      customer_name: updated.customerName,
      customer_address: updated.customerAddress,
      gender: updated.gender,
      birth_date: updated.birthDate.toISOString().split('T')[0],
      phone: updated.phone,
      created_at: updated.createdAt,
      updated_at: updated.updatedAt,
      deleted_at: updated.deletedAt,
    };
  }

  static async softDelete(id: string) {
    const existing = await prisma.customer.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new AppError('Pelanggan tidak ditemukan atau sudah dihapus', 404);
    }

    await prisma.customer.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return true;
  }
}
