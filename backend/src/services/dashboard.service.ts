import { prisma } from '../config/db.js';

export class DashboardService {
  static async getSummary() {
    // 1. Total transactions & total revenue
    const [ordersCount, revenueAggregate] = await Promise.all([
      prisma.order.count(),
      prisma.order.aggregate({
        _sum: {
          totalAmount: true,
        },
      }),
    ]);

    const totalOrders = ordersCount;
    const totalRevenue = Number(revenueAggregate._sum.totalAmount || 0);

    // 2. Top 5 best selling products
    const topSellingItems = await prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: {
        quantity: true,
        subtotal: true,
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
      take: 5,
    });

    const productIds = topSellingItems.map((item) => item.productId);
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
      },
      select: {
        id: true,
        productCode: true,
        productName: true,
        price: true,
        stock: true,
      },
    });

    const productMap = new Map<string, (typeof products)[0]>();
    for (const p of products) {
      productMap.set(p.id.toString(), p);
    }

    const topProducts = topSellingItems.map((item) => {
      const prod = productMap.get(item.productId.toString());
      return {
        product_id: Number(item.productId),
        product_code: prod?.productCode || '-',
        product_name: prod?.productName || 'Produk Dihapus',
        total_quantity_sold: item._sum.quantity || 0,
        total_revenue: Number(item._sum.subtotal || 0),
      };
    });

    // 3. Products with low stock (< 5)
    const lowStockProducts = await prisma.product.findMany({
      where: {
        stock: { lt: 5 },
        deletedAt: null,
      },
      select: {
        id: true,
        productCode: true,
        productName: true,
        stock: true,
        price: true,
      },
      orderBy: {
        stock: 'asc',
      },
      take: 10,
    });

    const formattedLowStock = lowStockProducts.map((p) => ({
      id: Number(p.id),
      product_code: p.productCode,
      product_name: p.productName,
      stock: p.stock,
      price: Number(p.price),
    }));

    // 4. Bonus: Daily Sales Trend (last 14 days)
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const recentOrders = await prisma.order.findMany({
      where: {
        orderDate: { gte: fourteenDaysAgo },
      },
      select: {
        orderDate: true,
        totalAmount: true,
      },
      orderBy: {
        orderDate: 'asc',
      },
    });

    // Group by YYYY-MM-DD
    const dailySalesMap = new Map<string, { date: string; total_orders: number; total_amount: number }>();
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      dailySalesMap.set(dateStr, { date: dateStr, total_orders: 0, total_amount: 0 });
    }

    for (const order of recentOrders) {
      const dateStr = order.orderDate.toISOString().split('T')[0];
      const entry = dailySalesMap.get(dateStr);
      if (entry) {
        entry.total_orders += 1;
        entry.total_amount += Number(order.totalAmount);
      }
    }

    const dailySales = Array.from(dailySalesMap.values());

    return {
      total_transactions: totalOrders,
      total_sales_amount: totalRevenue,
      top_selling_products: topProducts,
      low_stock_products: formattedLowStock,
      daily_sales: dailySales,
    };
  }
}
