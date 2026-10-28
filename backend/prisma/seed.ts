import { PrismaClient, Gender, Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing existing data...');
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user.deleteMany();

  console.log('Seeding Admin User...');
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.create({
    data: {
      name: 'Admin AZA',
      email: 'admin@azatech.id',
      password: hashedPassword,
    },
  });

  console.log('Seeding 22 Products...');
  const productsData = [
    { code: 'P0001', name: 'Hydrococo 150ml', stock: 25, price: 12000 },
    { code: 'P0002', name: 'Indomie Goreng Spesial', stock: 120, price: 3500 },
    { code: 'P0003', name: 'Aqua Botol 600ml', stock: 80, price: 4000 },
    { code: 'P0004', name: 'Teh Botol Sosro Kotak 250ml', stock: 50, price: 5000 },
    { code: 'P0005', name: 'Ultra Milk Cokelat 200ml', stock: 45, price: 6500 },
    { code: 'P0006', name: 'Pocari Sweat 500ml', stock: 30, price: 8500 },
    { code: 'P0007', name: 'Chitato Sapi Panggang 68g', stock: 40, price: 11000 },
    { code: 'P0008', name: 'Oreo Original 133g', stock: 35, price: 9500 },
    { code: 'P0009', name: 'Bango Kecap Manis 550ml', stock: 20, price: 24000 },
    { code: 'P0010', name: 'Bimoli Minyak Goreng 2L', stock: 15, price: 38000 },
    { code: 'P0011', name: 'Gulaku Tebu Kuning 1kg', stock: 25, price: 17500 },
    { code: 'P0012', name: 'Kapal Api Special Mix 10x24g', stock: 60, price: 14000 },
    { code: 'P0013', name: 'Silverqueen Cashew 58g', stock: 18, price: 16000 },
    { code: 'P0014', name: 'Bear Brand Susu Steril 189ml', stock: 3, price: 10500 }, // low stock
    { code: 'P0015', name: 'Lifebuoy Sabun Cair 450ml', stock: 2, price: 26000 },   // low stock
    { code: 'P0016', name: 'Pepsodent Pencegah Gigi Berlubang 190g', stock: 4, price: 15000 }, // low stock
    { code: 'P0017', name: 'Sunsilk Black Shine Shampoo 160ml', stock: 1, price: 22500 }, // low stock
    { code: 'P0018', name: 'Kopi Kenangan Mantan 220ml', stock: 40, price: 9500 },
    { code: 'P0019', name: 'Tango Wafer Cokelat 130g', stock: 55, price: 8000 },
    { code: 'P0020', name: 'Good Day Cappuccino 10x25g', stock: 50, price: 19000 },
    { code: 'P0021', name: 'Roma Kelapa Biskuit 300g', stock: 35, price: 12500 },
    { code: 'P0022', name: 'Nutrisari Jeruk Manis 10x14g', stock: 70, price: 13000 },
  ];

  const createdProducts = [];
  for (const p of productsData) {
    const prod = await prisma.product.create({
      data: {
        productCode: p.code,
        productName: p.name,
        stock: p.stock,
        price: new Prisma.Decimal(p.price),
      },
    });
    createdProducts.push(prod);
  }

  console.log('Seeding 16 Customers...');
  const customersData = [
    { name: 'Budi Santoso', address: 'Jl. Sudirman No. 45, Jakarta Selatan', gender: Gender.Pria, birth: '1990-05-14', phone: '081234567890' },
    { name: 'Siti Rahmawati', address: 'Jl. Malioboro No. 12, Yogyakarta', gender: Gender.Wanita, birth: '1995-02-20', phone: '081398765432' },
    { name: 'Ahmad Fauzi', address: 'Jl. Diponegoro No. 88, Surabaya', gender: Gender.Pria, birth: '1988-11-03', phone: '085712348765' },
    { name: 'Dewi Lestari', address: 'Jl. Dago No. 102, Bandung', gender: Gender.Wanita, birth: '1993-07-25', phone: '082156781234' },
    { name: 'Rian Pratama', address: 'Jl. Gatot Subroto No. 33, Medan', gender: Gender.Pria, birth: '1997-09-18', phone: '081923456781' },
    { name: 'Anisa Melani', address: 'Jl. Pemuda No. 70, Semarang', gender: Gender.Wanita, birth: '1996-03-30', phone: '087812349087' },
    { name: 'Fajar Nugraha', address: 'Jl. Ahmad Yani No. 55, Surakarta', gender: Gender.Pria, birth: '1991-12-12', phone: '081367894321' },
    { name: 'Putri Handayani', address: 'Jl. Gajah Mada No. 21, Denpasar', gender: Gender.Wanita, birth: '1994-08-05', phone: '085234567891' },
    { name: 'Eko Prasetyo', address: 'Jl. Pahlawan No. 99, Malang', gender: Gender.Pria, birth: '1989-04-17', phone: '089678123456' },
    { name: 'Nurul Hidayah', address: 'Jl. Veteran No. 15, Palembang', gender: Gender.Wanita, birth: '1998-01-22', phone: '081278901234' },
    { name: 'Bambang Irawan', address: 'Jl. Teuku Umar No. 64, Makassar', gender: Gender.Pria, birth: '1987-06-10', phone: '082234567812' },
    { name: 'Maya Anggraini', address: 'Jl. Basuki Rahmat No. 7, Samarinda', gender: Gender.Wanita, birth: '1995-10-08', phone: '081123456789' },
    { name: 'Rizky Firmansyah', address: 'Jl. Juanda No. 18, Bekasi', gender: Gender.Pria, birth: '1999-04-02', phone: '087798123456' },
    { name: 'Dian Permata', address: 'Jl. Margonda Raya No. 120, Depok', gender: Gender.Wanita, birth: '1992-09-15', phone: '085698765432' },
    { name: 'Hendra Gunawan', address: 'Jl. Raya Serpong No. 89, Tangerang', gender: Gender.Pria, birth: '1993-03-11', phone: '081234567822' },
    { name: 'Sri Wahyuni', address: 'Jl. Pajajaran No. 40, Bogor', gender: Gender.Wanita, birth: '1991-08-19', phone: '081345678901' },
  ];

  const createdCustomers = [];
  for (const c of customersData) {
    const cust = await prisma.customer.create({
      data: {
        customerName: c.name,
        customerAddress: c.address,
        gender: c.gender,
        birthDate: new Date(c.birth),
        phone: c.phone,
      },
    });
    createdCustomers.push(cust);
  }

  console.log('Seeding 35 Orders across the last 30 days...');
  const now = new Date();

  for (let i = 1; i <= 35; i++) {
    // Spread days from 29 days ago up to today
    const daysAgo = Math.floor((35 - i) * (29 / 35));
    const orderDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

    const year = orderDate.getFullYear();
    const month = String(orderDate.getMonth() + 1).padStart(2, '0');
    const day = String(orderDate.getDate()).padStart(2, '0');
    const seq = String(i).padStart(4, '0');
    const orderNumber = `INV-${year}${month}${day}-${seq}`;

    const customer = createdCustomers[i % createdCustomers.length];

    // Pick 1 to 3 random items
    const itemCount = (i % 3) + 1;
    let totalAmount = new Prisma.Decimal(0);
    const orderItemsData: { productId: bigint; quantity: number; unitPrice: Prisma.Decimal; subtotal: Prisma.Decimal }[] = [];

    for (let j = 0; j < itemCount; j++) {
      const prod = createdProducts[(i * 3 + j) % createdProducts.length];
      const qty = (j % 3) + 1;
      const unitPrice = prod.price;
      const subtotal = unitPrice.mul(new Prisma.Decimal(qty));
      totalAmount = totalAmount.add(subtotal);

      orderItemsData.push({
        productId: prod.id,
        quantity: qty,
        unitPrice,
        subtotal,
      });
    }

    await prisma.order.create({
      data: {
        orderNumber,
        customerId: customer.id,
        createdBy: admin.id,
        orderDate,
        totalAmount,
        items: {
          create: orderItemsData,
        },
      },
    });
  }

  console.log('Database seeded successfully!');
  console.log('Admin login: admin@azatech.id / admin123');
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
