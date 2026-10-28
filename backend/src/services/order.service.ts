import { Prisma } from '@prisma/client';
import { prisma } from '../config/db.js';
import { AppError } from '../utils/response.js';
import { CreateOrderInput, OrderQueryInput } from '../validations/order.validation.js';

export class OrderService {
  static async list(query: OrderQueryInput) {
    const page = Number(query.page) || 1;
    const perPage = Number(query.per_page) || 10;
    const skip = (page - 1) * perPage;

    const where: Prisma.OrderWhereInput = {};

    if (query.customer_id) {
      where.customerId = query.customer_id;
    }

    if (query.from || query.to) {
      where.orderDate = {};
      if (query.from) {
        where.orderDate.gte = new Date(`${query.from}T00:00:00.000Z`);
      }
      if (query.to) {
        where.orderDate.lte = new Date(`${query.to}T23:59:59.999Z`);
      }
    }

    const [total, orders] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        include: {
          customer: {
            select: {
              id: true,
              customerName: true,
              phone: true,
            },
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  productCode: true,
                  productName: true,
                },
              },
            },
          },
        },
        orderBy: { orderDate: 'desc' },
        skip,
        take: perPage,
      }),
    ]);

    const formatted = orders.map((o) => ({
      id: Number(o.id),
      order_number: o.orderNumber,
      customer_id: o.customerId,
      customer_name: o.customer.customerName,
      customer_phone: o.customer.phone,
      order_date: o.orderDate,
      total_amount: Number(o.totalAmount),
      items_count: o.items.reduce((acc, it) => acc + it.quantity, 0),
      created_at: o.createdAt,
      items: o.items.map((it) => ({
        id: Number(it.id),
        product_id: Number(it.productId),
        product_code: it.product.productCode,
        product_name: it.product.productName,
        quantity: it.quantity,
        unit_price: Number(it.unitPrice),
        subtotal: Number(it.subtotal),
      })),
    }));

    return {
      orders: formatted,
      meta: {
        page,
        per_page: perPage,
        total,
        total_pages: Math.ceil(total / perPage) || 1,
      },
    };
  }

  static async getById(id: number) {
    const order = await prisma.order.findUnique({
      where: { id: BigInt(id) },
      include: {
        customer: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                productCode: true,
                productName: true,
                deletedAt: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      throw new AppError('Pesanan tidak ditemukan', 404);
    }

    return {
      id: Number(order.id),
      order_number: order.orderNumber,
      order_date: order.orderDate,
      total_amount: Number(order.totalAmount),
      customer: {
        id: order.customer.id,
        customer_name: order.customer.customerName,
        customer_address: order.customer.customerAddress,
        gender: order.customer.gender,
        birth_date: order.customer.birthDate.toISOString().split('T')[0],
        phone: order.customer.phone,
      },
      created_by: {
        id: order.user.id,
        name: order.user.name,
        email: order.user.email,
      },
      items: order.items.map((it) => ({
        id: Number(it.id),
        product_id: Number(it.productId),
        product_code: it.product.productCode,
        product_name: it.product.productName,
        quantity: it.quantity,
        unit_price: Number(it.unitPrice),
        subtotal: Number(it.subtotal),
      })),
      created_at: order.createdAt,
      updated_at: order.updatedAt,
    };
  }

  static async create(data: CreateOrderInput, userId: string) {
    // 1. Validate customer
    const customer = await prisma.customer.findFirst({
      where: { id: data.customer_id, deletedAt: null },
    });

    if (!customer) {
      throw new AppError('Pelanggan tidak ditemukan atau sudah tidak aktif', 404);
    }

    // 2. Execute within an atomic database transaction
    return await prisma.$transaction(async (tx) => {
      // Collect product IDs and quantities
      const productIds = data.items.map((item) => BigInt(item.product_id));

      // Fetch current products with active status
      const products = await tx.product.findMany({
        where: {
          id: { in: productIds },
          deletedAt: null,
        },
      });

      const productMap = new Map<string, (typeof products)[0]>();
      for (const p of products) {
        productMap.set(p.id.toString(), p);
      }

      const errors: Record<string, string[]> = {};
      const calculatedItems: {
        productId: bigint;
        quantity: number;
        unitPrice: Prisma.Decimal;
        subtotal: Prisma.Decimal;
      }[] = [];

      let totalAmountDecimal = new Prisma.Decimal(0);

      // Validate existence and stock for each item
      for (let index = 0; index < data.items.length; index++) {
        const item = data.items[index];
        const product = productMap.get(item.product_id.toString());

        if (!product) {
          errors[`items.${index}.product_id`] = [
            `Produk dengan ID ${item.product_id} tidak ditemukan atau sudah dihapus`,
          ];
          continue;
        }

        if (product.stock < item.quantity) {
          errors[`items.${index}.quantity`] = [
            `Stok ${product.productName} tersisa ${product.stock}, diminta ${item.quantity}`,
          ];
          continue;
        }

        const unitPrice = product.price;
        const subtotal = unitPrice.mul(new Prisma.Decimal(item.quantity));
        totalAmountDecimal = totalAmountDecimal.add(subtotal);

        calculatedItems.push({
          productId: product.id,
          quantity: item.quantity,
          unitPrice,
          subtotal,
        });
      }

      // If any validation/stock errors occurred, abort transaction
      if (Object.keys(errors).length > 0) {
        throw new AppError('Stok tidak mencukupi', 422, errors);
      }

      // 3. Deduct stock for all items
      for (const item of calculatedItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });
      }

      // 4. Generate unique order number (Format: INV-YYYYMMDD-XXXX)
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const datePrefix = `INV-${year}${month}${day}-`;

      // Get count of orders with this prefix today
      const todayCount = await tx.order.count({
        where: {
          orderNumber: {
            startsWith: datePrefix,
          },
        },
      });

      const sequence = String(todayCount + 1).padStart(4, '0');
      const orderNumber = `${datePrefix}${sequence}`;

      // 5. Create Order and OrderItems
      const createdOrder = await tx.order.create({
        data: {
          orderNumber,
          customerId: data.customer_id,
          createdBy: userId,
          orderDate: now,
          totalAmount: totalAmountDecimal,
          items: {
            create: calculatedItems.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              subtotal: item.subtotal,
            })),
          },
        },
        include: {
          customer: true,
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  productCode: true,
                  productName: true,
                },
              },
            },
          },
        },
      });

      return {
        id: Number(createdOrder.id),
        order_number: createdOrder.orderNumber,
        order_date: createdOrder.orderDate,
        customer_id: createdOrder.customerId,
        customer_name: createdOrder.customer.customerName,
        total_amount: Number(createdOrder.totalAmount),
        created_at: createdOrder.createdAt,
        items: createdOrder.items.map((it) => ({
          id: Number(it.id),
          product_id: Number(it.productId),
          product_code: it.product.productCode,
          product_name: it.product.productName,
          quantity: it.quantity,
          unit_price: Number(it.unitPrice),
          subtotal: Number(it.subtotal),
        })),
      };
    });
  }
}
