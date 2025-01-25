const { createApp, ref, computed } = Vue

const app = createApp({
  setup() {
    // Authentication state
    const isLoggedIn = ref(false)
    const userType = ref(null)
    const currentLoginType = ref(null)

    // Existing state
    const currentView = ref('catalog')
    const showCart = ref(false)
    const cartItems = ref([])
    const selectedCategory = ref(null)

    // Products and orders data
    const products = ref([
      {
        id: 1,
        name: 'Спортивный костюм Nike',
        category: 'Костюмы',
        price: 5000,
        inventory: {
          'S': 5,
          'M': 10,
          'L': 15,
          'XL': 8
        },
        image: 'nike-suit.jpg'
      },
      {
        id: 2,
        name: 'Футболка Adidas',
        category: 'Футболки',
        price: 2500,
        inventory: {
          'S': 12,
          'M': 20,
          'L': 15,
          'XL': 10
        },
        image: 'adidas-tshirt.jpg'
      },
      {
        id: 3,
        name: 'Шорты Under Armour',
        category: 'Шорты',
        price: 3500,
        inventory: {
          'S': 8,
          'M': 15,
          'L': 12,
          'XL': 6
        },
        image: 'ua-shorts.jpg'
      }
    ])

    const allOrders = ref([
      {
        id: 'ORD-001',
        date: '2023-06-15',
        total: 15000,
        status: 'Отгружен',
        items: [
          { name: 'Спортивный костюм Nike', quantity: 3 }
        ]
      }
    ])

    const pastOrders = computed(() => {
      // In a real app, this would be filtered by logged-in user
      return allOrders.value
    })

    // Categories and filtering
    const categories = computed(() => {
      return [...new Set(products.value.map(p => p.category))]
    })

    const filteredProducts = computed(() => {
      return selectedCategory.value
        ? products.value.filter(p => p.category === selectedCategory.value)
        : products.value
    })

    // Authentication methods
    function handleClientLogin() {
      isLoggedIn.value = true
      userType.value = 'client'
    }

    function handleLogin(credentials) {
      // Updated login logic to include new credentials
      if (
        (credentials.username === 'distributor' && credentials.password === 'dist123') ||
        (credentials.username === 'Samir999' && credentials.password === 'Samir999')
      ) {
        isLoggedIn.value = true
        userType.value = 'distributor'
        currentLoginType.value = null
      } else {
        alert('Неверный логин или пароль')
      }
    }

    // Cart and order methods
    function addToCart(product) {
      // Check if quantity is valid
      if (product.selectedQuantity <= 0 || product.selectedQuantity > product.inventory[product.selectedSize]) {
        alert(`Недопустимое количество для размера ${product.selectedSize}`)
        return
      }

      const existingItem = cartItems.value.find(item => 
        item.id === product.id && item.selectedSize === product.selectedSize
      )
      
      if (existingItem) {
        // If the item already exists, increment its quantity
        existingItem.quantity = Math.min(
          existingItem.quantity + product.selectedQuantity, 
          product.inventory[product.selectedSize]
        )
      } else {
        // Add new item to cart
        cartItems.value.push({
          ...product, 
          quantity: product.selectedQuantity
        })
      }
      
      // Reduce inventory for the specific size
      products.value = products.value.map(p => {
        if (p.id === product.id) {
          return {
            ...p,
            inventory: {
              ...p.inventory,
              [product.selectedSize]: p.inventory[product.selectedSize] - product.selectedQuantity
            }
          }
        }
        return p
      })

      showCart.value = true
    }

    function createOrder() {
      const newOrder = {
        id: `ORD-${allOrders.value.length + 1}`,
        date: new Date().toISOString().split('T')[0],
        total: cartItems.value.reduce((sum, item) => sum + item.price * item.quantity, 0),
        status: 'Новый',
        items: cartItems.value.map(item => ({
          name: item.name,
          quantity: item.quantity,
          size: item.selectedSize
        }))
      }
      
      allOrders.value.push(newOrder)
      showCart.value = false
      cartItems.value = []
    }

    function removeCartItem(item) {
      // Restore inventory for the removed item
      products.value = products.value.map(p => {
        if (p.id === item.id) {
          return {
            ...p,
            inventory: {
              ...p.inventory,
              [item.selectedSize]: p.inventory[item.selectedSize] + item.quantity
            }
          }
        }
        return p
      })

      cartItems.value = cartItems.value.filter(cartItem => 
        !(cartItem.id === item.id && cartItem.selectedSize === item.selectedSize)
      )
    }

    function updateCartItemQuantity(item, newQuantity) {
      // Find the item in the cart
      const cartItem = cartItems.value.find(cartItem => 
        cartItem.id === item.id && cartItem.selectedSize === item.selectedSize
      )

      if (cartItem) {
        const product = products.value.find(p => p.id === item.id)
        const maxQuantity = product.inventory[item.selectedSize] + cartItem.quantity

        // Validate new quantity
        if (newQuantity >= 0 && newQuantity <= maxQuantity) {
          // Update inventory
          products.value = products.value.map(p => {
            if (p.id === item.id) {
              return {
                ...p,
                inventory: {
                  ...p.inventory,
                  [item.selectedSize]: maxQuantity - newQuantity
                }
              }
            }
            return p
          })

          // Update cart item quantity
          cartItem.quantity = newQuantity
        }
      }
    }

    function clearCart() {
      // Restore all inventories
      cartItems.value.forEach(item => {
        products.value = products.value.map(p => {
          if (p.id === item.id) {
            return {
              ...p,
              inventory: {
                ...p.inventory,
                [item.selectedSize]: p.inventory[item.selectedSize] + item.quantity
              }
            }
          }
          return p
        })
      })

      cartItems.value = []
    }

    // Distributor methods for product management
    function addProduct(newProduct) {
      newProduct.id = products.value.length + 1
      products.value.push(newProduct)
    }

    function updateProduct(updatedProduct) {
      const index = products.value.findIndex(p => p.id === updatedProduct.id)
      if (index !== -1) {
        products.value[index] = updatedProduct
      }
    }

    function deleteProduct(productId) {
      products.value = products.value.filter(p => p.id !== productId)
    }

    function updateOrderStatus(orderData) {
      const orderIndex = allOrders.value.findIndex(o => o.id === orderData.id)
      if (orderIndex !== -1) {
        allOrders.value[orderIndex].status = orderData.status
      }
    }

    function logout() {
      isLoggedIn.value = false
      userType.value = null
      currentLoginType.value = null
      currentView.value = 'catalog'
    }

    return {
      // State
      isLoggedIn,
      userType,
      currentView,
      showCart,
      cartItems,
      products,
      allOrders,
      pastOrders,
      categories,
      selectedCategory,
      filteredProducts,
      currentLoginType,

      // Methods
      handleClientLogin,
      handleLogin,
      addToCart,
      createOrder,
      addProduct,
      updateProduct,
      deleteProduct,
      updateOrderStatus,
      logout,
      removeCartItem,
      updateCartItemQuantity,
      clearCart,
    }
  }
})

// Login Component
app.component('login-page', {
  setup(props, { emit }) {
    const username = ref('')
    const password = ref('')

    function login() {
      emit('login', { username: username.value, password: password.value })
    }

    function cancel() {
      emit('cancel')
    }

    return { username, password, login, cancel }
  },
  template: `
    <div class="login-page">
      <h2>Вход для дистрибьютора</h2>
      <input v-model="username" placeholder="Логин" />
      <input v-model="password" type="password" placeholder="Пароль" />
      <div class="login-buttons">
        <button @click="login">Войти</button>
        <button @click="cancel">Отмена</button>
      </div>
    </div>
  `
})

app.component('catalog-view', {
  props: ['products'],
  setup(props, { emit }) {
    // Create a reactive state to track selected size and quantity for each product
    const productSelections = ref(
      props.products.reduce((acc, product) => {
        acc[product.id] = {
          selectedSize: Object.keys(product.inventory).find(size => product.inventory[size] > 0) || null,
          sizeQuantities: Object.keys(product.inventory).reduce((sizeQty, size) => {
            sizeQty[size] = 0
            return sizeQty
          }, {})
        }
        return acc
      }, {})
    )

    function handleAddToCart(product) {
      const selection = productSelections.value[product.id]
      
      // Check if a size is selected
      if (!selection.selectedSize) {
        alert('Пожалуйста, выберите размер')
        return
      }

      const stock = product.inventory[selection.selectedSize]
      const quantity = selection.sizeQuantities[selection.selectedSize]
      
      // Modified validation to allow zero, but prevent negative
      if (quantity < 0 || quantity > stock) {
        alert(`Недопустимое количество для размера ${selection.selectedSize}`)
        return
      }

      // Allow adding to cart even with zero quantity
      if (quantity === 0) {
        return
      }

      // Create a copy of the product with the specific size and quantity
      const productToAdd = { 
        ...product, 
        selectedSize: selection.selectedSize,
        selectedQuantity: quantity,
        inventory: product.inventory 
      }

      emit('add-to-cart', productToAdd)
    }

    return { 
      handleAddToCart, 
      productSelections 
    }
  },
  template: `
    <div class="catalog">
      <div v-for="product in products" :key="product.id" class="product-card">
        <img :src="product.image" :alt="product.name">
        <h3>{{ product.name }}</h3>
        <p>Цена: {{ product.price }} ₽</p>
        <div class="product-sizes">
          <p>Размеры и остатки:</p>
          <div v-for="(stock, size) in product.inventory" :key="size" class="size-selection">
            <label>
              <input 
                type="radio" 
                :name="'size-' + product.id" 
                :value="size"
                v-model="productSelections[product.id].selectedSize"
                :disabled="stock <= 0"
              />
              {{ size }}: {{ stock }}
              <input 
                type="number" 
                v-model.number="productSelections[product.id].sizeQuantities[size]"
                min="0" 
                :max="stock"
                :disabled="stock <= 0"
                style="width: 60px; margin-left: 10px;"
              />
            </label>
          </div>
        </div>
        <button 
          @click="handleAddToCart(product)"
          :disabled="!productSelections[product.id].selectedSize"
        >
          Добавить в корзину
        </button>
      </div>
    </div>
  `
})

app.component('cart-modal', {
  props: ['cartItems'],
  template: `
    <div class="cart-modal">
      <h2>Корзина</h2>
      <div v-for="item in cartItems" :key="item.id" class="cart-item">
        <span>{{ item.name }}</span>
        <span>Размер: {{ item.selectedSize }}</span>
        <span>Количество: {{ item.quantity }}</span>
        <span>Сумма: {{ item.price * item.quantity }} ₽</span>
      </div>
      <button @click="$emit('create-order')">Создать заказ</button>
      <button @click="$emit('close-cart')">Закрыть</button>
    </div>
  `
})

app.component('orders-view', {
  props: ['pastOrders'],
  template: `
    <div class="orders">
      <h2>Мои заказы</h2>
      <div v-for="order in pastOrders" :key="order.id" class="order-card">
        <p>Номер заказа: {{ order.id }}</p>
        <p>Дата: {{ order.date }}</p>
        <p>Сумма: {{ order.total }} ₽</p>
        <p>Статус: {{ order.status }}</p>
        <div class="order-items">
          <div v-for="item in order.items" :key="item.name">
            {{ item.name }} - {{ item.quantity }} шт.
          </div>
        </div>
      </div>
    </div>
  `
})

app.component('sales-stats', {
  props: ['salesData'],
  template: `
    <div class="sales-stats">
      <h2>Статистика продаж</h2>
      <p>Общая выручка: {{ salesData.totalSales }} ₽</p>
      <h3>Топ продаж:</h3>
      <ul>
        <li v-for="product in salesData.topProducts" :key="product.name">
          {{ product.name }}: {{ product.quantity }} шт.
        </li>
      </ul>
    </div>
  `
})

// New Distributor Components
app.component('manage-products', {
  props: ['products'],
  setup(props, { emit }) {
    const newProduct = ref({
      name: '',
      category: '',
      price: 0,
      inventory: {
        'S': 0,
        'M': 0,
        'L': 0,
        'XL': 0
      },
      image: ''
    })

    function addProduct() {
      // Validate product before adding
      if (!newProduct.value.name || !newProduct.value.category || newProduct.value.price <= 0) {
        alert('Пожалуйста, заполните все поля корректно')
        return
      }

      emit('add-product', { ...newProduct.value })
      
      // Reset form with default values
      newProduct.value = {
        name: '',
        category: '',
        price: 0,
        inventory: {
          'S': 0,
          'M': 0,
          'L': 0,
          'XL': 0
        },
        image: ''
      }
    }

    return { 
      newProduct, 
      addProduct,
      editProduct: (product) => emit('update-product', { ...product }),
      deleteProduct: (productId) => emit('delete-product', productId)
    }
  },
  template: `
    <div class="manage-products">
      <h2>Управление товарами</h2>
      
      <div class="add-product-form">
        <input v-model="newProduct.name" placeholder="Название товара" />
        <input v-model="newProduct.category" placeholder="Категория" />
        <input v-model.number="newProduct.price" type="number" placeholder="Цена" />
        <input v-model="newProduct.image" placeholder="URL изображения" />
        
        <div class="inventory-inputs">
          <h3>Остатки по размерам</h3>
          <div v-for="(stock, size) in newProduct.inventory" :key="size">
            <label>
              {{ size }}:
              <input 
                v-model.number="newProduct.inventory[size]" 
                type="number" 
                min="0" 
                placeholder="Количество"
              />
            </label>
          </div>
        </div>
        
        <button @click="addProduct">Добавить товар</button>
      </div>

      <div class="product-list">
        <div v-for="product in products" :key="product.id" class="product-item">
          <span>{{ product.name }}</span>
          <span>{{ product.category }}</span>
          <span>{{ product.price }} ₽</span>
          <button @click="editProduct(product)">Изменить</button>
          <button @click="deleteProduct(product.id)">Удалить</button>
        </div>
      </div>
    </div>
  `
})

app.component('manage-orders', {
  props: ['orders'],
  setup(props, { emit }) {
    function updateStatus(order, newStatus) {
      emit('update-order-status', { 
        id: order.id, 
        status: newStatus 
      })
    }

    return { updateStatus }
  },
  template: `
    <div class="manage-orders">
      <h2>Управление заказами</h2>
      <div v-for="order in orders" :key="order.id" class="order-item">
        <p>Номер заказа: {{ order.id }}</p>
        <p>Дата: {{ order.date }}</p>
        <p>Статус: {{ order.status }}</p>
        <div class="order-actions">
          <button @click="updateStatus(order, 'Подтвержден')">Подтвердить</button>
          <button @click="updateStatus(order, 'Отгружен')">Отгрузить</button>
          <button @click="updateStatus(order, 'Отменен')">Отменить</button>
        </div>
      </div>
    </div>
  `
})

app.component('cart-page', {
  props: ['cartItems'],
  setup(props, { emit }) {
    const totalPrice = computed(() => {
      return props.cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
    })

    return { 
      totalPrice,
      removeItem: (item) => emit('remove-item', item),
      updateQuantity: (item, newQuantity) => emit('update-quantity', item, newQuantity),
      createOrder: () => emit('create-order'),
      clearCart: () => emit('clear-cart')
    }
  },
  template: `
    <div class="cart-page">
      <h2>Корзина</h2>
      
      <div v-if="cartItems.length === 0" class="empty-cart">
        <p>Корзина пуста</p>
      </div>
      
      <div v-else class="cart-items">
        <div v-for="item in cartItems" :key="item.id + item.selectedSize" class="cart-item">
          <div class="cart-item-details">
            <span>{{ item.name }}</span>
            <span>Размер: {{ item.selectedSize }}</span>
            <div class="cart-item-quantity">
              <label>
                Количество:
                <input 
                  type="number" 
                  :value="item.quantity" 
                  min="0"
                  @input="updateQuantity(item, Number($event.target.value))"
                />
              </label>
            </div>
            <span>Цена за шт.: {{ item.price }} ₽</span>
            <span>Сумма: {{ item.price * item.quantity }} ₽</span>
            <button @click="removeItem(item)">Удалить</button>
          </div>
        </div>
        
        <div class="cart-summary">
          <p>Итого: {{ totalPrice }} ₽</p>
          <div class="cart-actions">
            <button @click="createOrder">Создать заказ</button>
            <button @click="clearCart">Очистить корзину</button>
          </div>
        </div>
      </div>
    </div>
  `
})

app.mount('#app')