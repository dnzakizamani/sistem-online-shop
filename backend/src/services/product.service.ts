import { Prisma } from '@prisma/client';
import { prisma } from '../config/db.js';
import { AppError } from '../utils/response.js';
import {
  CreateProductInput,
  ProductQueryInput,
  UpdateProductInput,
} from '../validations/product.validation.js';

export class ProductService {
  static async list(query: ProductQueryInput) {
    const page = Number(query.page) || 1;
    const perPage = Number(query.per_page) || 10;
    const skip = (page - 1) * perPage;

    const where: Prisma.ProductWhereInput = {
      deletedAt: null,
    };

    if (query.search) {
      where.OR = [
        { productCode: { contains: query.search, mode: 'insensitive' } },
        { productName: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: 'desc' };
    switch (query.sort) {
      case 'name_asc':
        orderBy = { productName: 'asc' };
        break;
      case 'name_desc':
        orderBy = { productName: 'desc' };
        break;
      case 'price_asc':
        orderBy = { price: 'asc' };
        break;
      case 'price_desc':
        orderBy = { price: 'desc' };
        break;
      case 'stock_asc':
        orderBy = { stock: 'asc' };
        break;
      case 'stock_desc':
        orderBy = { stock: 'desc' };
        break;
      case 'created_at_desc':
      default:
        orderBy = { createdAt: 'desc' };
        break;
    }

    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: perPage,
      }),
    ]);

    const formatted = products.map((p) => ({
      id: Number(p.id),
      product_code: p.productCode,
      product_name: p.productName,
      stock: p.stock,
      price: Number(p.price),
      created_at: p.createdAt,
      updated_at: p.updatedAt,
      deleted_at: p.deletedAt,
    }));

    return {
      products: formatted,
      meta: {
        page,
        per_page: perPage,
        total,
        total_pages: Math.ceil(total / perPage) || 1,
      },
    };
  }

  static async getById(id: number) {
    const product = await prisma.product.findFirst({
      where: { id: BigInt(id), deletedAt: null },
    });

    if (!product) {
      throw new AppError('Produk tidak ditemukan atau telah dihapus', 404);
    }

    return {
      id: Number(product.id),
      product_code: product.productCode,
      product_name: product.productName,
      stock: product.stock,
      price: Number(product.price),
      created_at: product.createdAt,
      updated_at: product.updatedAt,
      deleted_at: product.deletedAt,
    };
  }

  static async create(data: CreateProductInput) {
    const existing = await prisma.product.findUnique({
      where: { productCode: data.product_code },
    });

    if (existing) {
      throw new AppError('Kode produk sudah digunakan', 409, {
        product_code: [`Kode produk ${data.product_code} sudah digunakan`],
      });
    }

    const product = await prisma.product.create({
      data: {
        productCode: data.product_code,
        productName: data.product_name,
        stock: Number(data.stock),
        price: new Prisma.Decimal(data.price),
      },
    });

    return {
      id: Number(product.id),
      product_code: product.productCode,
      product_name: product.productName,
      stock: product.stock,
      price: Number(product.price),
      created_at: product.createdAt,
      updated_at: product.updatedAt,
      deleted_at: product.deletedAt,
    };
  }

  static async update(id: number, data: UpdateProductInput) {
    const existing = await prisma.product.findFirst({
      where: { id: BigInt(id), deletedAt: null },
    });

    if (!existing) {
      throw new AppError('Produk tidak ditemukan', 404);
    }

    if (data.product_code && data.product_code !== existing.productCode) {
      const duplicate = await prisma.product.findUnique({
        where: { productCode: data.product_code },
      });
      if (duplicate && duplicate.id !== BigInt(id)) {
        throw new AppError('Kode produk sudah digunakan', 409, {
          product_code: [`Kode produk ${data.product_code} sudah digunakan`],
        });
      }
    }

    const updated = await prisma.product.update({
      where: { id: BigInt(id) },
      data: {
        ...(data.product_code ? { productCode: data.product_code } : {}),
        ...(data.product_name ? { productName: data.product_name } : {}),
        ...(data.stock !== undefined ? { stock: Number(data.stock) } : {}),
        ...(data.price !== undefined ? { price: new Prisma.Decimal(data.price) } : {}),
      },
    });

    return {
      id: Number(updated.id),
      product_code: updated.productCode,
      product_name: updated.productName,
      stock: updated.stock,
      price: Number(updated.price),
      created_at: updated.createdAt,
      updated_at: updated.updatedAt,
      deleted_at: updated.deletedAt,
    };
  }

  static async softDelete(id: number) {
    const existing = await prisma.product.findFirst({
      where: { id: BigInt(id), deletedAt: null },
    });

    if (!existing) {
      throw new AppError('Produk tidak ditemukan atau sudah dihapus', 404);
    }

    await prisma.product.update({
      where: { id: BigInt(id) },
      data: { deletedAt: new Date() },
    });

    return true;
  }
}
