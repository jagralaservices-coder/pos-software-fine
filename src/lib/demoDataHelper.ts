import { supabase } from '@/integrations/supabase/client';

export const generateUUID = (): string => {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }
  let d = new Date().getTime();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (d + Math.random() * 16) % 16 | 0;
    d = Math.floor(d / 16);
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
};

export const runAutoPopulation = async (storeId: string, customOwnerId?: string): Promise<boolean> => {
  if (!storeId) return false;
  console.log('[DemoData] Starting auto-population for store:', storeId);
  try {
    // 1. Fetch store information
    const { data: storeObj, error: storeErr } = await supabase
      .from('stores')
      .select('business_type, phone, customer_id')
      .eq('id', storeId)
      .maybeSingle();

    if (storeErr) {
      console.error('[DemoData] Failed to fetch store details:', storeErr);
    }

    const bizType = storeObj?.business_type || 'restaurant';
    const storePhone = storeObj?.phone || '+919876543210';
    const custId = storeObj?.customer_id || customOwnerId || null;

    // Delete existing records to avoid conflicts/duplicates
    await supabase.from('store_categories').delete().eq('store_id', storeId);
    await supabase.from('inventory_items').delete().eq('store_id', storeId);
    await supabase.from('menu_items').delete().eq('store_id', storeId);
    await supabase.from('pos_customers').delete().eq('store_id', storeId);
    await supabase.from('orders').delete().eq('store_id', storeId);
    await supabase.from('expenses').delete().eq('store_id', storeId);
    await supabase.from('credit_ledger').delete().eq('store_id', storeId);
    await supabase.from('store_settings').delete().eq('store_id', storeId).eq('setting_key', 'tables');
    await supabase.from('store_whatsapp_config').delete().eq('store_id', storeId);

    // 2. Categories (4 items)
    const categories = [
      { category_id: 'starters', name: 'Starters', icon: '🥗', color: 'orange-600' },
      { category_id: 'burgers', name: 'Burgers', icon: '🍔', color: 'red-600' },
      { category_id: 'pizzas', name: 'Pizzas', icon: '🍕', color: 'blue-600' },
      { category_id: 'beverages', name: 'Beverages', icon: '🥤', color: 'teal-600' },
      { category_id: 'desserts', name: 'Desserts', icon: '🍰', color: 'pink-600' },
      { category_id: 'mains', name: 'Mains', icon: '🍲', color: 'green-600' }
    ];

    await supabase.from('store_categories').insert(
      categories.map(c => ({
        store_id: storeId,
        category_id: c.category_id,
        name: c.name,
        icon: c.icon,
        color: c.color,
        sort_order: 0
      }))
    );

    // 3. 10 Inventory Records
    const invPaneerId = generateUUID();
    const invBunId = generateUUID();
    const invCheeseId = generateUUID();
    const invPizzaBaseId = generateUUID();
    const invTeaId = generateUUID();
    const invCoffeeId = generateUUID();
    const invPotatoId = generateUUID();
    const invFlourId = generateUUID();
    const invSugarId = generateUUID();
    const invOilId = generateUUID();

    const inventoryItems = [
      { id: invPaneerId, name: 'Paneer', quantity: 50, unit: 'kg', min_stock: 5, cost_per_unit: 350, cost_unit: 'kg' },
      { id: invBunId, name: 'Burger Buns', quantity: 150, unit: 'pcs', min_stock: 20, cost_per_unit: 10, cost_unit: 'pcs' },
      { id: invCheeseId, name: 'Cheese Slice', quantity: 200, unit: 'pcs', min_stock: 30, cost_per_unit: 15, cost_unit: 'pcs' },
      { id: invPizzaBaseId, name: 'Pizza Base', quantity: 100, unit: 'pcs', min_stock: 15, cost_per_unit: 20, cost_unit: 'pcs' },
      { id: invTeaId, name: 'Tea Leaves', quantity: 10, unit: 'kg', min_stock: 1, cost_per_unit: 250, cost_unit: 'kg' },
      { id: invCoffeeId, name: 'Coffee Beans', quantity: 15, unit: 'kg', min_stock: 2, cost_per_unit: 600, cost_unit: 'kg' },
      { id: invPotatoId, name: 'Potatoes', quantity: 80, unit: 'kg', min_stock: 10, cost_per_unit: 25, cost_unit: 'kg' },
      { id: invFlourId, name: 'Flour', quantity: 100, unit: 'kg', min_stock: 15, cost_per_unit: 40, cost_unit: 'kg' },
      { id: invSugarId, name: 'Sugar', quantity: 30, unit: 'kg', min_stock: 5, cost_per_unit: 50, cost_unit: 'kg' },
      { id: invOilId, name: 'Cooking Oil', quantity: 40, unit: 'L', min_stock: 8, cost_per_unit: 140, cost_unit: 'L' }
    ];

    await supabase.from('inventory_items').insert(
      inventoryItems.map(i => ({
        id: i.id,
        store_id: storeId,
        name: i.name,
        quantity: i.quantity,
        unit: i.unit,
        min_stock: i.min_stock,
        cost_per_unit: i.cost_per_unit,
        cost_unit: i.cost_unit
      }))
    );

    // 4. 20 Products (Menu Items)
    const menuItemsData = [
      { name: 'Paneer Tikka', price: 15, category: 'Starters', description: 'Fresh cottage cheese skewers', is_available: true, linked_inventory_id: invPaneerId, gramage_per_unit: 0.15 },
      { name: 'Veg Spring Roll', price: 20, category: 'Starters', description: 'Crispy spring rolls', is_available: true, linked_inventory_id: invFlourId, gramage_per_unit: 0.1 },
      { name: 'Samosa', price: 5, category: 'Starters', description: 'Fried potato pastry', is_available: true, linked_inventory_id: invPotatoId, gramage_per_unit: 0.08 },
      { name: 'Masala Fries', price: 15, category: 'Starters', description: 'Spiced french fries', is_available: true, linked_inventory_id: invPotatoId, gramage_per_unit: 0.15 },
      { name: 'Veg Burger', price: 20, category: 'Burgers', description: 'Veg patty burger', is_available: true, linked_inventory_id: invBunId, gramage_per_unit: 1 },
      { name: 'Cheese Burger', price: 25, category: 'Burgers', description: 'Patty burger with cheese slice', is_available: true, linked_inventory_id: invBunId, gramage_per_unit: 1 },
      { name: 'Double Cheese Pizza', price: 30, category: 'Pizzas', description: 'Classic cheese loaded pizza', is_available: true, linked_inventory_id: invPizzaBaseId, gramage_per_unit: 1 },
      { name: 'Farmhouse Pizza', price: 35, category: 'Pizzas', description: 'Veg loaded pizza', is_available: true, linked_inventory_id: invPizzaBaseId, gramage_per_unit: 1 },
      { name: 'Garlic Bread', price: 10, category: 'Pizzas', description: 'Toasted garlic bread', is_available: true, linked_inventory_id: invFlourId, gramage_per_unit: 0.05 },
      { name: 'Cold Coffee', price: 15, category: 'Beverages', description: 'Blended cold coffee', is_available: true, linked_inventory_id: invCoffeeId, gramage_per_unit: 0.02 },
      { name: 'Masala Chai', price: 5, category: 'Beverages', description: 'Traditional spiced tea', is_available: true, linked_inventory_id: invTeaId, gramage_per_unit: 0.01 },
      { name: 'Mint Mojito', price: 20, category: 'Beverages', description: 'Refreshing mint cooler', is_available: true },
      { name: 'Soda Can', price: 10, category: 'Beverages', description: 'Carbonated cold drink', is_available: true },
      { name: 'Choco Lava Cake', price: 25, category: 'Desserts', description: 'Molten chocolate cake', is_available: true, linked_inventory_id: invFlourId, gramage_per_unit: 0.05 },
      { name: 'Vanilla Ice Cream', price: 10, category: 'Desserts', description: 'Classic vanilla cup', is_available: true },
      { name: 'Butter Naan', price: 15, category: 'Mains', description: 'Clay oven bread with butter', is_available: true, linked_inventory_id: invFlourId, gramage_per_unit: 0.1 },
      { name: 'Dal Makhani', price: 25, category: 'Mains', description: 'Slow cooked black lentils', is_available: true },
      { name: 'Shahi Paneer', price: 30, category: 'Mains', description: 'Paneer in sweet tomato gravy', is_available: true, linked_inventory_id: invPaneerId, gramage_per_unit: 0.15 },
      { name: 'Jeera Rice', price: 10, category: 'Mains', description: 'Cumin tempered rice', is_available: true },
      { name: 'Gulab Jamun', price: 10, category: 'Desserts', description: 'Sweet fried dumplings', is_available: true }
    ];

    const { data: createdMenuItems, error: itemsErr } = await supabase.from('menu_items').insert(
      menuItemsData.map(item => ({
        store_id: storeId,
        name: item.name,
        price: item.price,
        category: item.category,
        description: item.description,
        is_available: item.is_available,
        linked_inventory_id: item.linked_inventory_id || null,
        gramage_per_unit: item.gramage_per_unit || null
      }))
    ).select('id, name, price');

    if (itemsErr) {
      console.error('[DemoData] Failed to insert menu items:', itemsErr);
    }

    // 5. Recipe linking (menu_item_ingredients)
    if (createdMenuItems && createdMenuItems.length > 0) {
      const ingredientRows: any[] = [];
      
      const vegBurger = createdMenuItems.find(i => i.name === 'Veg Burger');
      if (vegBurger) {
        ingredientRows.push(
          { id: generateUUID(), menu_item_id: vegBurger.id, inventory_item_id: invBunId, quantity_required: 1, unit: 'pcs' },
          { id: generateUUID(), menu_item_id: vegBurger.id, inventory_item_id: invPotatoId, quantity_required: 0.1, unit: 'kg' }
        );
      }

      const cheeseBurger = createdMenuItems.find(i => i.name === 'Cheese Burger');
      if (cheeseBurger) {
        ingredientRows.push(
          { id: generateUUID(), menu_item_id: cheeseBurger.id, inventory_item_id: invBunId, quantity_required: 1, unit: 'pcs' },
          { id: generateUUID(), menu_item_id: cheeseBurger.id, inventory_item_id: invCheeseId, quantity_required: 1, unit: 'pcs' }
        );
      }

      const pizzaItem = createdMenuItems.find(i => i.name === 'Double Cheese Pizza');
      if (pizzaItem) {
        ingredientRows.push(
          { id: generateUUID(), menu_item_id: pizzaItem.id, inventory_item_id: invPizzaBaseId, quantity_required: 1, unit: 'pcs' },
          { id: generateUUID(), menu_item_id: pizzaItem.id, inventory_item_id: invCheeseId, quantity_required: 2, unit: 'pcs' }
        );
      }

      const chaiItem = createdMenuItems.find(i => i.name === 'Masala Chai');
      if (chaiItem) {
        ingredientRows.push(
          { id: generateUUID(), menu_item_id: chaiItem.id, inventory_item_id: invTeaId, quantity_required: 0.01, unit: 'kg' },
          { id: generateUUID(), menu_item_id: chaiItem.id, inventory_item_id: invSugarId, quantity_required: 0.01, unit: 'kg' }
        );
      }

      const coffeeItem = createdMenuItems.find(i => i.name === 'Cold Coffee');
      if (coffeeItem) {
        ingredientRows.push(
          { id: generateUUID(), menu_item_id: coffeeItem.id, inventory_item_id: invCoffeeId, quantity_required: 0.02, unit: 'kg' },
          { id: generateUUID(), menu_item_id: coffeeItem.id, inventory_item_id: invSugarId, quantity_required: 0.01, unit: 'kg' }
        );
      }

      if (ingredientRows.length > 0) {
        await supabase.from('menu_item_ingredients').insert(ingredientRows);
      }
    }

    // 6. 10 Customers
    const dummyPosCustomers = [
      { name: 'Aarav Mehta', phone: '9876543210', email: 'aarav@example.com', address: '101 Heights, Sector 15', city: 'Mumbai', state: 'Maharashtra', pincode: '400001' },
      { name: 'Neha Sharma', phone: '9812345678', email: 'neha@example.com', address: '202 Parkview Avenue', city: 'Delhi', state: 'Delhi', pincode: '110001' },
      { name: 'Amit Patel', phone: '9823456789', email: 'amit@example.com', address: '501 Shanti Nagar', city: 'Ahmedabad', state: 'Gujarat', pincode: '380001' },
      { name: 'Priya Singh', phone: '9834567890', email: 'priya@example.com', address: 'Block C, Rajouri Garden', city: 'Delhi', state: 'Delhi', pincode: '110027' },
      { name: 'Rohan Gupta', phone: '9845678901', email: 'rohan@example.com', address: '12 Malviya Nagar', city: 'Jaipur', state: 'Rajasthan', pincode: '302017' },
      { name: 'Sneha Reddy', phone: '9856789012', email: 'sneha@example.com', address: 'Jubilee Hills Rd 36', city: 'Hyderabad', state: 'Telangana', pincode: '500033' },
      { name: 'Kabir Kapoor', phone: '9867890123', email: 'kabir@example.com', address: 'Bandra West, Hill Road', city: 'Mumbai', state: 'Maharashtra', pincode: '400050' },
      { name: 'Anjali Verma', phone: '9878901234', email: 'anjali@example.com', address: 'Indiranagar 100ft Rd', city: 'Bengaluru', state: 'Karnataka', pincode: '560038' },
      { name: 'Vikram Rao', phone: '9889012345', email: 'vikram@example.com', address: 'Adyar Canal Bank Road', city: 'Chennai', state: 'Tamil Nadu', pincode: '600020' },
      { name: 'Pooja Sharma', phone: '9890123456', email: 'pooja@example.com', address: 'Salt Lake Sector 3', city: 'Kolkata', state: 'West Bengal', pincode: '700091' }
    ];

    const { data: createdCustomers, error: custErr } = await supabase.from('pos_customers').insert(
      dummyPosCustomers.map(c => ({
        store_id: storeId,
        name: c.name,
        phone: c.phone,
        email: c.email,
        address: c.address,
        city: c.city,
        state: c.state,
        pincode: c.pincode
      }))
    ).select('id, name, phone');

    if (custErr) {
      console.error('[DemoData] Failed to insert customers:', custErr);
    }

    // 7. 5 Bills / Sales Entries summing to exactly ₹100
    if (createdMenuItems && createdMenuItems.length >= 5) {
      const pChai = createdMenuItems.find(i => i.name === 'Masala Chai');
      const pGarlic = createdMenuItems.find(i => i.name === 'Garlic Bread');
      const pSamosa = createdMenuItems.find(i => i.name === 'Samosa');
      const pFries = createdMenuItems.find(i => i.name === 'Masala Fries');
      const pCoffee = createdMenuItems.find(i => i.name === 'Cold Coffee');
      const pBurger = createdMenuItems.find(i => i.name === 'Veg Burger');
      const pSoda = createdMenuItems.find(i => i.name === 'Soda Can');

      const cust1 = createdCustomers?.find(c => c.name === 'Aarav Mehta');
      const cust2 = createdCustomers?.find(c => c.name === 'Neha Sharma');
      const cust3 = createdCustomers?.find(c => c.name === 'Amit Patel');
      const cust4 = createdCustomers?.find(c => c.name === 'Priya Singh');
      const cust5 = createdCustomers?.find(c => c.name === 'Rohan Gupta');

      const ordersData = [
        {
          bill_number: 'BILL-0001',
          order_type: 'takeaway',
          customer_name: cust1?.name || 'Aarav Mehta',
          customer_phone: cust1?.phone || '9876543210',
          subtotal: 15,
          total: 15,
          payment_method: 'upi',
          status: 'completed',
          items: [
            { id: pChai?.id || 'chai-id', name: 'Masala Chai', price: 5, quantity: 1, total: 5 },
            { id: pGarlic?.id || 'garlic-id', name: 'Garlic Bread', price: 10, quantity: 1, total: 10 }
          ]
        },
        {
          bill_number: 'BILL-0002',
          order_type: 'dine-in',
          table_number: '1',
          customer_name: cust2?.name || 'Neha Sharma',
          customer_phone: cust2?.phone || '9812345678',
          subtotal: 20,
          total: 20,
          payment_method: 'cash',
          status: 'completed',
          items: [
            { id: pSamosa?.id || 'samosa-id', name: 'Samosa', price: 5, quantity: 1, total: 5 },
            { id: pFries?.id || 'fries-id', name: 'Masala Fries', price: 15, quantity: 1, total: 15 }
          ]
        },
        {
          bill_number: 'BILL-0003',
          order_type: 'dine-in',
          table_number: '2',
          customer_name: cust3?.name || 'Amit Patel',
          customer_phone: cust3?.phone || '9823456789',
          subtotal: 25,
          total: 25,
          payment_method: 'upi',
          status: 'completed',
          items: [
            { id: pCoffee?.id || 'coffee-id', name: 'Cold Coffee', price: 15, quantity: 1, total: 15 },
            { id: pGarlic?.id || 'garlic-id', name: 'Garlic Bread', price: 10, quantity: 1, total: 10 }
          ]
        },
        {
          bill_number: 'BILL-0004',
          order_type: 'takeaway',
          customer_name: cust4?.name || 'Priya Singh',
          customer_phone: cust4?.phone || '9834567890',
          subtotal: 20,
          total: 20,
          payment_method: 'cash',
          status: 'completed',
          items: [
            { id: pBurger?.id || 'burger-id', name: 'Veg Burger', price: 20, quantity: 1, total: 20 }
          ]
        },
        {
          bill_number: 'BILL-0005',
          order_type: 'takeaway',
          customer_name: cust5?.name || 'Rohan Gupta',
          customer_phone: cust5?.phone || '9845678901',
          subtotal: 20,
          total: 20,
          payment_method: 'upi',
          status: 'completed',
          items: [
            { id: pSoda?.id || 'soda-id', name: 'Soda Can', price: 10, quantity: 2, total: 20 }
          ]
        }
      ];

      await supabase.from('orders').insert(
        ordersData.map(o => ({
          store_id: storeId,
          bill_number: o.bill_number,
          order_type: o.order_type,
          table_number: o.table_number || null,
          customer_name: o.customer_name,
          customer_phone: o.customer_phone,
          subtotal: o.subtotal,
          total: o.total,
          payment_method: o.payment_method,
          status: o.status,
          items: o.items
        }))
      );
    }

    // 8. 3 Staff Members
    // Note: Staff profiles require rows in user_roles and profiles
    const dummyStaff = [
      { id: generateUUID(), name: 'Rahul Sharma', email: 'rahul@demostore.com', role: 'store_manager', code: '100001', pin: '1111', phone: '9988776655' },
      { id: generateUUID(), name: 'Vikram Singh', email: 'vikram@demostore.com', role: 'staff', code: '100002', pin: '2222', phone: '9988776644' },
      { id: generateUUID(), name: 'Priya Patel', email: 'priya@demostore.com', role: 'staff', code: '100003', pin: '3333', phone: '9988776633' }
    ];

    for (const staff of dummyStaff) {
      // Create user role linking this staff to customer and store
      const { data: roleExists } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', staff.id)
        .maybeSingle();

      if (!roleExists) {
        await supabase.from('user_roles').insert({
          user_id: staff.id,
          role: staff.role as any,
          customer_id: custId,
          store_id: storeId,
          staff_code: staff.code,
          pin: staff.pin,
          is_active: true
        });

        await supabase.from('profiles').insert({
          id: staff.id,
          full_name: staff.name,
          email: staff.email,
          phone: staff.phone,
          locality: 'Demo Area',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400001'
        });
      }
    }

    // 9. Dining tables configuration (5 tables)
    if (bizType === 'restaurant') {
      const tablesToInsert = [
        { number: '1', capacity: 2, status: 'available' },
        { number: '2', capacity: 4, status: 'available' },
        { number: '3', capacity: 4, status: 'occupied' },
        { number: '4', capacity: 6, status: 'available' },
        { number: '5', capacity: 2, status: 'reserved' }
      ];
      await supabase.from('store_settings').insert({
        store_id: storeId,
        setting_key: 'tables',
        setting_value: tablesToInsert
      });
    }

    // 10. Store WhatsApp Config
    if (custId) {
      await supabase.from('store_whatsapp_config').insert({
        store_id: storeId,
        owner_id: custId,
        whatsapp_number: storePhone || '+919876543210',
        instance_id: 'inst_mock_' + Math.random().toString(36).substring(2, 8).toUpperCase(),
        api_key: 'key_mock_' + Math.random().toString(36).substring(2, 10).toLowerCase(),
        is_verified: true
      });
    }

    // 11. 2 Suppliers (saved to purchase_orders in local storage for the stateless fallback)
    const demoPurchaseOrders = [
      {
        id: '1', poNumber: 'PO-2026-001', supplierName: 'Fresh Farms Ltd',
        status: 'delivered', orderDate: new Date().toISOString().split('T')[0], expectedDate: new Date().toISOString().split('T')[0],
        totalAmount: 5000,
        items: [
          { name: 'Tomatoes', quantity: 50, unit: 'kg', unitPrice: 40 },
          { name: 'Onions', quantity: 100, unit: 'kg', unitPrice: 30 }
        ]
      },
      {
        id: '2', poNumber: 'PO-2026-002', supplierName: 'Metro Wholesale',
        status: 'ordered', orderDate: new Date().toISOString().split('T')[0], expectedDate: new Date().toISOString().split('T')[0],
        totalAmount: 8000,
        items: [
          { name: 'Cooking Oil (5L)', quantity: 10, unit: 'pcs', unitPrice: 650 },
          { name: 'Flour (10kg)', quantity: 5, unit: 'bags', unitPrice: 300 }
        ]
      }
    ];
    localStorage.setItem('purchase_orders', JSON.stringify(demoPurchaseOrders));

    console.log('[DemoData] Auto-population successful for store:', storeId);
    return true;
  } catch (err) {
    console.error('[DemoData] Error during auto-population:', err);
    return false;
  }
};
