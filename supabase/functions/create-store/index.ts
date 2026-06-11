import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    // Authenticate the caller and verify they are an admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || authHeader === 'Bearer null') {
      return new Response(
        JSON.stringify({ error: 'Authorization header is required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authUserError } = await supabaseAdmin.auth.getUser(token)

    if (authUserError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if the user has the 'admin' role
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .eq('is_active', true)
      .maybeSingle()

    if (roleError || !roleData) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: Only admins can create store IDs' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const body = await req.json()
    const {
      customer_id,
      store_name,
      email,
      password,
      phone,
      address_line1,
      locality,
      city,
      state,
      pincode,
      business_type,
      country,
      currency_code,
      tax_type,
      tax_percentage
    } = body

    // Validate mandatory fields
    if (!customer_id || !store_name || !email || !password || !phone) {
      return new Response(
        JSON.stringify({ error: 'Business, Store Name, Email, Password, and Phone are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Complete address components are mandatory
    if (!address_line1 || !locality || !city || !state || !pincode) {
      return new Response(
        JSON.stringify({ error: 'Complete address (Address Line 1, Locality, City, State, and Pincode) is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const normalizedEmail = String(email).trim().toLowerCase()
    const constructedAddress = `${address_line1.trim()}, ${locality.trim()}, ${city.trim()}, ${state.trim()} - ${pincode.trim()}`

    // Try to find existing user first
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const existingUser = existingUsers?.users?.find(
      (u) => u.email?.toLowerCase() === normalizedEmail
    )

    let userId: string

    if (existingUser) {
      userId = existingUser.id
    } else {
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: normalizedEmail,
        password,
        email_confirm: true,
        user_metadata: { full_name: store_name.trim() }
      })

      if (authError) {
        return new Response(
          JSON.stringify({ error: authError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      userId = authData.user.id
    }

    // Verify customer exists
    const { data: customer } = await supabaseAdmin
      .from('customers')
      .select('id, max_stores')
      .eq('id', customer_id)
      .maybeSingle()

    if (!customer) {
      if (!existingUser) await supabaseAdmin.auth.admin.deleteUser(userId)
      return new Response(
        JSON.stringify({ error: 'Invalid customer account' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check store limit
    const { count } = await supabaseAdmin
      .from('stores')
      .select('id', { count: 'exact', head: true })
      .eq('customer_id', customer_id)
      .eq('is_active', true)

    if ((count || 0) >= customer.max_stores) {
      if (!existingUser) await supabaseAdmin.auth.admin.deleteUser(userId)
      return new Response(
        JSON.stringify({ error: `Store limit reached (max ${customer.max_stores})` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: dbStore, error } = await supabaseAdmin
      .from('stores')
      .insert({
        customer_id,
        store_name: store_name.trim(),
        password: password || null,
        address: constructedAddress,
        phone: phone || null,
        business_type: business_type || 'restaurant',
        country: country || 'India',
        currency_code: currency_code || 'INR',
        tax_type: tax_type || 'GST',
        tax_percentage: tax_percentage ?? 0,
      })
      .select('id, store_code, store_name')
      .single()

    if (error) {
      if (!existingUser) await supabaseAdmin.auth.admin.deleteUser(userId)
      console.error('Store creation error:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to create store: ' + error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: userId,
        role: 'store_manager',
        customer_id,
        store_id: dbStore.id,
        is_active: true,
      })

    if (roleError) {
      await supabaseAdmin.from('stores').delete().eq('id', dbStore.id)
      if (!existingUser) await supabaseAdmin.auth.admin.deleteUser(userId)
      return new Response(
        JSON.stringify({ error: roleError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    await supabaseAdmin
      .from('profiles')
      .update({ 
        full_name: store_name.trim(), 
        phone: phone || null,
        address_line1: address_line1.trim(),
        locality: locality.trim(),
        city: city.trim(),
        state: state.trim(),
        pincode: pincode.trim(),
      })
      .eq('id', userId)

    // Populate Dummy Data for this Store
    try {
      const type = business_type || 'restaurant'
      
      // 1. Categories
      const categories = type === 'restaurant' 
        ? [
            { category_id: 'burgers', name: 'Burgers', icon: '🍔', color: 'orange-600' },
            { category_id: 'pizzas', name: 'Pizzas', icon: '🍕', color: 'red-600' },
            { category_id: 'beverages', name: 'Beverages', icon: '🥤', color: 'blue-600' },
            { category_id: 'desserts', name: 'Desserts', icon: '🍰', color: 'pink-600' }
          ]
        : [
            { category_id: 'groceries', name: 'Groceries', icon: '🌾', color: 'green-600' },
            { category_id: 'snacks', name: 'Snacks', icon: '🍪', color: 'orange-600' },
            { category_id: 'beverages', name: 'Beverages', icon: '🥤', color: 'blue-600' },
            { category_id: 'personal_care', name: 'Personal Care', icon: '🧴', color: 'teal-600' }
          ]

      await supabaseAdmin.from('store_categories').insert(
        categories.map(c => ({
          store_id: dbStore.id,
          category_id: c.category_id,
          name: c.name,
          icon: c.icon,
          color: c.color,
          sort_order: 0
        }))
      )

      // 2. Inventory Items
      const invBunId = crypto.randomUUID()
      const invCheeseId = crypto.randomUUID()
      const invChipsId = crypto.randomUUID()
      const invSodaId = crypto.randomUUID()

      const inventoryItems = [
        { id: invBunId, name: 'Burger Buns', quantity: 120, unit: 'pcs', min_stock: 20, cost_per_unit: 10, cost_unit: 'pcs' },
        { id: invCheeseId, name: 'Cheese Slice', quantity: 200, unit: 'pcs', min_stock: 30, cost_per_unit: 15, cost_unit: 'pcs' },
        { id: invChipsId, name: 'Potato Chips Pack', quantity: 150, unit: 'pcs', min_stock: 15, cost_per_unit: 20, cost_unit: 'pcs' },
        { id: invSodaId, name: 'Soda Cans', quantity: 180, unit: 'pcs', min_stock: 25, cost_per_unit: 18, cost_unit: 'pcs' }
      ]

      await supabaseAdmin.from('inventory_items').insert(
        inventoryItems.map(i => ({
          id: i.id,
          store_id: dbStore.id,
          name: i.name,
          quantity: i.quantity,
          unit: i.unit,
          min_stock: i.min_stock,
          cost_per_unit: i.cost_per_unit,
          cost_unit: i.cost_unit
        }))
      )

      // 3. Menu Items
      const menuItemsData = type === 'restaurant'
        ? [
            { name: 'Cheese Burger', price: 120, category: 'Burgers', description: 'Classic burger with cheese slice', is_available: true, linked_inventory_id: invBunId },
            { name: 'Double Cheese Pizza', price: 199, category: 'Pizzas', description: 'Fresh pizza base with cheese', is_available: true, linked_inventory_id: invCheeseId },
            { name: 'Cold Coffee', price: 80, category: 'Beverages', description: 'Creamy iced coffee', is_available: true, linked_inventory_id: invSodaId },
            { name: 'Choco Lava Cake', price: 90, category: 'Desserts', description: 'Warm chocolate cake with molten lava', is_available: true }
          ]
        : [
            { name: 'Basmati Rice 1kg', price: 115, category: 'Groceries', description: 'Premium basmati rice', is_available: true },
            { name: 'Classic Salted Chips', price: 30, category: 'Snacks', description: 'Crispy salted potato chips', is_available: true, linked_inventory_id: invChipsId },
            { name: 'Orange Juice Box', price: 65, category: 'Beverages', description: 'Freshly packed orange juice', is_available: true },
            { name: 'Moisturizing Cream', price: 150, category: 'Personal Care', description: 'Soft skin cream', is_available: true }
          ]

      const { data: createdMenuItems } = await supabaseAdmin.from('menu_items').insert(
        menuItemsData.map(item => ({
          store_id: dbStore.id,
          name: item.name,
          price: item.price,
          category: item.category,
          description: item.description,
          is_available: item.is_available,
          linked_inventory_id: item.linked_inventory_id || null
        }))
      ).select('id, name, price')

      // 4. POS Customers
      const dummyPosCustomers = [
        { name: 'Aarav Mehta', phone: '9876543210', email: 'aarav@example.com', address: '101 Heights, Sector 15', city: 'Mumbai', state: 'Maharashtra', pincode: '400001' },
        { name: 'Neha Sharma', phone: '9812345678', email: 'neha@example.com', address: '202 Parkview Avenue', city: 'Delhi', state: 'Delhi', pincode: '110001' }
      ]

      const { data: createdCustomers } = await supabaseAdmin.from('pos_customers').insert(
        dummyPosCustomers.map(c => ({
          store_id: dbStore.id,
          name: c.name,
          phone: c.phone,
          email: c.email,
          address: c.address,
          city: c.city,
          state: c.state,
          pincode: c.pincode
        }))
      ).select('id, name, phone')

      // 5. Orders (completed sales)
      if (createdMenuItems && createdMenuItems.length >= 2) {
        const item1 = createdMenuItems[0]
        const item2 = createdMenuItems[1]
        const cust1 = createdCustomers?.[0]
        const cust2 = createdCustomers?.[1]

        const ordersData = [
          {
            bill_number: 'BILL-0001',
            order_type: 'takeaway',
            customer_name: cust1?.name || 'Aarav Mehta',
            customer_phone: cust1?.phone || '9876543210',
            subtotal: item1.price + item2.price,
            total: item1.price + item2.price,
            payment_method: 'upi',
            status: 'completed',
            items: [
              { id: item1.id, name: item1.name, price: item1.price, quantity: 1, total: item1.price },
              { id: item2.id, name: item2.name, price: item2.price, quantity: 1, total: item2.price }
            ]
          },
          {
            bill_number: 'BILL-0002',
            order_type: 'dine-in',
            table_number: '3',
            customer_name: cust2?.name || 'Neha Sharma',
            customer_phone: cust2?.phone || '9812345678',
            subtotal: item2.price * 2,
            total: item2.price * 2,
            payment_method: 'cash',
            status: 'completed',
            items: [
              { id: item2.id, name: item2.name, price: item2.price, quantity: 2, total: item2.price * 2 }
            ]
          }
        ]

        await supabaseAdmin.from('orders').insert(
          ordersData.map(o => ({
            store_id: dbStore.id,
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
        )
      }

      // 6. Expenses
      const expRentId = crypto.randomUUID()
      const expUtilId = crypto.randomUUID()

      const expensesData = [
        { id: expRentId, category: 'Rent', amount: 12000, description: 'Monthly shop space rent', paid_by: 'Owner' },
        { id: expUtilId, category: 'Utilities', amount: 2500, description: 'Electricity and water connection charge', paid_by: 'Manager' }
      ]

      await supabaseAdmin.from('expenses').insert(
        expensesData.map(e => ({
          id: e.id,
          store_id: dbStore.id,
          category: e.category,
          amount: e.amount,
          description: e.description,
          paid_by: e.paid_by
        }))
      )

      // 7. Credit Ledger (Khata)
      const khataCustomer = createdCustomers?.[0]
      if (khataCustomer) {
        await supabaseAdmin.from('credit_ledger').insert({
          store_id: dbStore.id,
          customer_name: khataCustomer.name,
          customer_phone: khataCustomer.phone,
          bill_number: 'BILL-0003',
          total_amount: 150,
          paid_amount: 50,
          due_amount: 100,
          payment_status: 'partial',
          notes: 'Regular customer credit'
        })
      }

      // 8. Tables setting (For Restaurant Dine-in layouts)
      if (type === 'restaurant') {
        const tablesToInsert = [
          { number: '1', capacity: 2, status: 'available' },
          { number: '2', capacity: 4, status: 'available' },
          { number: '3', capacity: 4, status: 'occupied' },
          { number: '4', capacity: 6, status: 'available' },
          { number: '5', capacity: 2, status: 'reserved' }
        ]
        await supabaseAdmin.from('store_settings').insert({
          store_id: dbStore.id,
          setting_key: 'tables',
          setting_value: tablesToInsert
        })
      }

      // 9. Store WhatsApp Config
      await supabaseAdmin.from('store_whatsapp_config').insert({
        store_id: dbStore.id,
        owner_id: customer_id,
        whatsapp_number: phone || '+919876543210',
        instance_id: 'inst_mock_' + Math.random().toString(36).substring(2, 8).toUpperCase(),
        api_key: 'key_mock_' + Math.random().toString(36).substring(2, 10).toLowerCase(),
        is_verified: true
      })

    } catch (dummyErr) {
      console.error('Failed to populate dummy data:', dummyErr)
    }

    return new Response(
      JSON.stringify({ success: true, store: dbStore, email: normalizedEmail }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: unknown) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
