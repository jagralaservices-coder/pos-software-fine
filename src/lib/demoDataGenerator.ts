import { subDays, format, addDays } from 'date-fns';

export const generateRevenueData = (days = 90) => {
  const data = [];
  let baseRevenue = 15000;
  for (let i = days; i >= 0; i--) {
    const date = subDays(new Date(), i);
    // Add some random fluctuation and a general upward trend
    const dailyRev = baseRevenue + (Math.random() * 5000 - 2000) + ((days - i) * 100);
    data.push({
      date: format(date, 'MMM dd'),
      revenue: Math.round(dailyRev),
      orders: Math.round(dailyRev / 150),
    });
    baseRevenue += (Math.random() * 200 - 50); // slight baseline shift
  }
  return data;
};

export const generateGrowthData = (months = 6) => {
  const data = [];
  const currentMonth = new Date().getMonth();
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  
  let merchants = 120;
  let stores = 150;
  
  for (let i = months; i >= 0; i--) {
    let m = currentMonth - i;
    if (m < 0) m += 12;
    data.push({
      month: monthNames[m],
      merchants: Math.round(merchants),
      stores: Math.round(stores),
    });
    merchants += Math.random() * 15 + 5;
    stores += Math.random() * 25 + 10;
  }
  return data;
};

export const generatePaymentMethodData = () => {
  return [
    { name: 'UPI', value: 45 },
    { name: 'Credit Card', value: 30 },
    { name: 'Cash', value: 15 },
    { name: 'Debit Card', value: 10 },
  ];
};

export const generateTopProducts = () => {
  return [
    { name: 'Margherita Pizza', sales: 1245, revenue: 373500 },
    { name: 'Chicken Biryani', sales: 980, revenue: 245000 },
    { name: 'Paneer Butter Masala', sales: 850, revenue: 212500 },
    { name: 'Cold Coffee', sales: 1500, revenue: 150000 },
    { name: 'Garlic Bread', sales: 1100, revenue: 110000 },
  ];
};

export const generateSubscriptionData = () => {
  return [
    { name: 'Basic', count: 450, revenue: 45000 },
    { name: 'Gold', count: 320, revenue: 96000 },
    { name: 'Platinum', count: 180, revenue: 89820 },
    { name: 'Enterprise', count: 50, revenue: 49950 },
  ];
};

export const DEMO_KPIS = {
  totalMerchants: 1245,
  activeMerchants: 1180,
  totalStores: 1560,
  activeStores: 1490,
  totalRevenue: 8540000,
  todayRevenue: 124500,
  monthlyRevenue: 3450000,
  annualRevenue: 42500000,
  totalOrders: 450890,
  todayOrders: 1240,
  totalCustomers: 89000,
  totalProducts: 45600,
  totalStaff: 8900,
  pendingRenewals: 45,
  expiringSubscriptions: 120,
  newSignups: 24
};

export const generateSystemPerformance = () => {
  const data = [];
  const now = new Date();
  for (let i = 24; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 60 * 60 * 1000);
    data.push({
      time: format(time, 'HH:mm'),
      cpu: Math.round(Math.random() * 40 + 20),
      memory: Math.round(Math.random() * 30 + 40),
      latency: Math.round(Math.random() * 50 + 20),
    });
  }
  return data;
};

export const generateInventoryAlerts = () => {
  return [
    { store: 'Maxora Bandra', product: 'Tomato Sauce', current: 5, min: 20 },
    { store: 'Maxora Juhu', product: 'Pizza Dough', current: 2, min: 10 },
    { store: 'BK Andheri', product: 'Burger Buns', current: 15, min: 50 },
    { store: 'Cafe Mocha Central', product: 'Coffee Beans', current: 1, min: 10 },
    { store: 'Pizza Hut North', product: 'Mozzarella', current: 8, min: 30 },
  ];
};

export const generateInventoryValueTrend = () => {
  const data = [];
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const currentMonth = new Date().getMonth();
  for (let i = 6; i >= 0; i--) {
    let m = currentMonth - i;
    if (m < 0) m += 12;
    data.push({
      month: monthNames[m],
      value: Math.round(150000 + Math.random() * 50000),
    });
  }
  return data;
};

export const generateStaffDistribution = () => {
  return [
    { name: 'Waiters', value: 4500 },
    { name: 'Chefs', value: 2100 },
    { name: 'Managers', value: 850 },
    { name: 'Delivery', value: 1450 },
  ];
};

export const generateTopStaff = () => {
  return [
    { id: '1', name: 'Rahul Sharma', role: 'Manager', store: 'Maxora Bandra', sales: 1250000, rating: 4.9 },
    { id: '2', name: 'Priya Patel', role: 'Waiter', store: 'Cafe Mocha Central', sales: 850000, rating: 4.8 },
    { id: '3', name: 'Amit Singh', role: 'Chef', store: 'BK Andheri', sales: 0, rating: 4.9 },
    { id: '4', name: 'Neha Gupta', role: 'Manager', store: 'Pizza Hut North', sales: 1100000, rating: 4.7 },
  ];
};
