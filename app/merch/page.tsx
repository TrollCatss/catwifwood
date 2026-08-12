'use client'

import Link from 'next/link'
import { useState } from 'react'

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
}

const PRODUCTS = [
  {
    id: 'cat-tail-strap',
    name: 'Cat Tail Strap',
    price: 9.99,
    description: '100% REAL CAT TAIL - Boosts Your Bag - Diamond Hands Only',
    emoji: '🐈‍⬛',
    status: 'IN STOCK',
    rarity: 'LEGENDARY'
  },
  {
    id: 'wood-hoodie',
    name: '$WOOD Hoodie',
    price: 49.99,
    description: 'Premium comfort • Peak meme energy • Unironically wearable',
    emoji: '🧥',
    status: 'PRE-ORDER',
    rarity: 'RARE'
  },
  {
    id: 'diamond-hands-gloves',
    name: 'Diamond Hands Gloves',
    price: 29.99,
    description: 'Literally diamond-textured • Never paperhand again • HODL in style',
    emoji: '💎',
    status: 'COMING SOON',
    rarity: 'EPIC'
  },
  {
    id: 'cat-hat',
    name: 'Cat Ear Beanie',
    price: 24.99,
    description: 'Functional cat ears • Flex on the plebs • Stealth homeless chic',
    emoji: '🧢',
    status: 'IN STOCK',
    rarity: 'RARE'
  },
  {
    id: 'tail-keychain',
    name: 'Tiny Tail Keychain',
    price: 4.99,
    description: 'Portable cat tail • Backpack essential • Jealous normie attractor',
    emoji: '🔑',
    status: 'IN STOCK',
    rarity: 'COMMON'
  },
  {
    id: 'wood-shirt',
    name: '$WOOD T-Shirt',
    price: 19.99,
    description: 'Unisex • All sizes • 100% pure gigachad energy',
    emoji: '👕',
    status: 'IN STOCK',
    rarity: 'UNCOMMON'
  },
]

export default function MerchPage() {
  const [cart, setCart] = useState<CartItem[]>([])
  const [showCart, setShowCart] = useState(false)

  const addToCart = (productId: string, productName: string, price: number) => {
    const existing = cart.find(item => item.id === productId)
    if (existing) {
      setCart(cart.map(item =>
        item.id === productId
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ))
    } else {
      setCart([...cart, { id: productId, name: productName, price, quantity: 1 }])
    }
  }

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.id !== productId))
  }

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  const getRarityColor = (rarity: string) => {
    switch(rarity) {
      case 'LEGENDARY': return 'from-yellow-400 to-orange-600'
      case 'EPIC': return 'from-purple-500 to-pink-600'
      case 'RARE': return 'from-blue-400 to-cyan-500'
      case 'UNCOMMON': return 'from-green-400 to-emerald-500'
      default: return 'from-gray-400 to-gray-600'
    }
  }

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-black text-green-600">$WOOD</Link>
          <div className="space-x-6 flex items-center">
            <Link href="/" className="hover:text-green-600 transition">Home</Link>
            <Link href="/merch" className="hover:text-green-600 transition font-bold text-green-600">Merch</Link>
            <button
              onClick={() => setShowCart(!showCart)}
              className="relative hover:text-green-600 transition"
            >
              🛒
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-green-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Header */}
      <section className="pt-32 pb-12 px-4 bg-gradient-to-b from-green-50 to-white dark:from-green-950 dark:to-black">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-5xl font-black mb-4">
            <span className="text-green-600">$WOOD</span> MERCH STORE
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">Flex your holdings • Support the project • Confuse your parents</p>
        </div>
      </section>

      <div className="flex gap-8 max-w-7xl mx-auto px-4 py-8">
        {/* Products Grid */}
        <div className="flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
            {PRODUCTS.map(product => (
              <div key={product.id} className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 hover:border-green-600 transition group">
                {/* Rarity Header */}
                <div className={`bg-gradient-to-r ${getRarityColor(product.rarity)} text-white p-3 font-bold text-sm text-center`}>
                  {product.rarity} • {product.status}
                </div>

                {/* Product Content */}
                <div className="p-6">
                  <div className="text-6xl mb-4 text-center group-hover:scale-110 transition">
                    {product.emoji}
                  </div>
                  <h3 className="text-xl font-bold mb-2">{product.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{product.description}</p>

                  <div className="flex items-baseline gap-2 mb-6">
                    <span className="text-3xl font-black text-green-600">${product.price}</span>
                    <span className="text-xs text-gray-500">(+ shipping)</span>
                  </div>

                  <button
                    onClick={() => addToCart(product.id, product.name, product.price)}
                    disabled={product.status === 'COMING SOON'}
                    className={`w-full py-3 rounded-lg font-bold transition ${
                      product.status === 'COMING SOON'
                        ? 'bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-400 cursor-not-allowed'
                        : 'bg-green-600 hover:bg-green-700 text-white'
                    }`}
                  >
                    {product.status === 'COMING SOON' ? 'COMING SOON' : 'ADD TO CART'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cart Sidebar */}
        {showCart && (
          <div className="w-80 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 h-fit sticky top-24 mt-4">
            <h2 className="text-2xl font-black mb-6">YOUR BAG 💰</h2>

            {cart.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-400 mb-6">Empty like your portfolio after 2022</p>
            ) : (
              <>
                <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
                  {cart.map(item => (
                    <div key={item.id} className="flex justify-between items-start bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                      <div>
                        <p className="font-semibold">{item.name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">${item.price} × {item.quantity}</p>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-red-600 hover:text-red-700 font-bold"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mb-6">
                  <div className="flex justify-between mb-4">
                    <span className="font-bold">Subtotal:</span>
                    <span className="font-bold text-green-600">${cartTotal.toFixed(2)}</span>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    📍 Shipping: TBD • 🌍 Worldwide • 🚀 Soon
                  </div>
                </div>

                <button className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition mb-3">
                  CHECKOUT 🚀
                </button>
                <button
                  onClick={() => setShowCart(false)}
                  className="w-full bg-gray-200 dark:bg-gray-700 text-black dark:text-white font-bold py-2 rounded-lg transition text-sm"
                >
                  Keep Shopping
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Info Section */}
      <section className="bg-gray-50 dark:bg-gray-900 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-black text-lg mb-3">📦 SHIPPING</h3>
              <p className="text-gray-600 dark:text-gray-400">Ships from our very real, definitely not a garage, headquarters</p>
            </div>
            <div>
              <h3 className="font-black text-lg mb-3">💎 QUALITY</h3>
              <p className="text-gray-600 dark:text-gray-400">Premium materials • Actually legitimate • Your mom will ask where you got it</p>
            </div>
            <div>
              <h3 className="font-black text-lg mb-3">🤝 COMMUNITY</h3>
              <p className="text-gray-600 dark:text-gray-400">Every purchase supports the $WOOD ecosystem and our cat overlords</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800 py-8 px-4">
        <div className="max-w-7xl mx-auto text-center text-gray-600 dark:text-gray-400">
          <p>© 2026 CATWIFWOOD • Made with 🐱 and degeneracy</p>
        </div>
      </footer>
    </div>
  )
}
