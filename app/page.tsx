import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-black text-green-600">$WOOD</h1>
          <div className="space-x-6">
            <Link href="/" className="hover:text-green-600 transition">Home</Link>
            <Link href="/merch" className="hover:text-green-600 transition">Merch</Link>
            <a href="#roadmap" className="hover:text-green-600 transition">Roadmap</a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              <div>
                <h2 className="text-7xl font-black mb-4">
                  <span className="text-green-600">$WOOD</span>
                  <br />
                  <span className="text-black dark:text-white">CAT TAIL</span>
                  <br />
                  <span className="text-black dark:text-white">STRAP</span>
                </h2>
                <p className="text-2xl text-gray-600 dark:text-gray-400 font-light">
                  The tail that wags the market. 📈
                </p>
              </div>

              <div className="space-y-4">
                <div className="text-xl font-bold">
                  <span className="bg-green-600 text-white px-6 py-3 rounded-lg inline-block">
                    $9.99
                  </span>
                </div>

                <div className="space-y-3 text-lg">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">🐾</span>
                    <span className="font-semibold">100% REAL CAT TAIL</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">🚀</span>
                    <span className="font-semibold">BOOSTS YOUR BAG</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">💎</span>
                    <span className="font-semibold">DIAMOND HANDS ONLY</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Link href="/merch" className="inline-block bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-8 rounded-lg text-lg transition">
                  BUY NOW 💰
                </Link>
                <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                  <span className="text-xs">✨ Limited Edition • Chain 4663</span>
                </div>
              </div>
            </div>

            {/* Right Image */}
            <div className="flex justify-center items-center">
              <div className="relative">
                <div className="absolute inset-0 bg-green-600 opacity-10 rounded-full blur-3xl"></div>
                <div className="relative bg-gradient-to-br from-green-100 to-green-50 dark:from-green-900 dark:to-green-950 rounded-3xl p-8 text-center">
                  <p className="text-gray-600 dark:text-gray-400 mb-4">🐱 THE LEGENDARY CAT</p>
                  <div className="text-6xl">🐱</div>
                  <p className="text-sm text-gray-500 dark:text-gray-500 mt-4">spread pose incoming 🔜</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-gray-50 dark:bg-gray-900 py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <h3 className="text-4xl font-black mb-12">WHY $WOOD?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="text-4xl mb-4">🎯</div>
              <h4 className="text-xl font-bold mb-3">BASED & MEME-PILLED</h4>
              <p className="text-gray-600 dark:text-gray-400">We don't take ourselves seriously. Neither should you. This is peak degenerate culture.</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="text-4xl mb-4">📈</div>
              <h4 className="text-xl font-bold mb-3">ACTUAL UTILITY</h4>
              <p className="text-gray-600 dark:text-gray-400">Real merchandise. Real cats. Real tails. This isn't just vaporware on the blockchain.</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="text-4xl mb-4">🚀</div>
              <h4 className="text-xl font-bold mb-3">CHAIN 4663 NATIVE</h4>
              <p className="text-gray-600 dark:text-gray-400">Early mover advantage on Robinhood Chain. Get in before the normies discover cat tails.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <h3 className="text-4xl font-black mb-12">WHAT THE STREETS SAY</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl">
              <p className="text-gray-700 dark:text-gray-300 mb-4">"I bought 3. My portfolio has never looked better. My cat is missing but honestly who cares." - anonymous whale</p>
              <p className="font-bold">⭐⭐⭐⭐⭐</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl">
              <p className="text-gray-700 dark:text-gray-300 mb-4">"Unironically the best purchase I've made in 2026" - still believing in 2025</p>
              <p className="font-bold">⭐⭐⭐⭐⭐</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl">
              <p className="text-gray-700 dark:text-gray-300 mb-4">"SEC can't regulate this" - definitely not financial advice</p>
              <p className="font-bold">⭐⭐⭐⭐⭐</p>
            </div>
          </div>
        </div>
      </section>

      {/* Roadmap Section */}
      <section id="roadmap" className="bg-gray-50 dark:bg-gray-900 py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <h3 className="text-4xl font-black mb-12">ROADMAP 📋</h3>
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border-l-4 border-green-600">
              <h4 className="font-bold text-xl mb-2">Q3 2026 ✅</h4>
              <p className="text-gray-600 dark:text-gray-400">Launch on Chain 4663 • Initial merch drop • Community building</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border-l-4 border-green-600">
              <h4 className="font-bold text-xl mb-2">Q4 2026 🔜</h4>
              <p className="text-gray-600 dark:text-gray-400">Cat NFTs • Staking rewards • More merch (hoodies, hats, etc)</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border-l-4 border-green-600">
              <h4 className="font-bold text-xl mb-2">2027 🌙</h4>
              <p className="text-gray-600 dark:text-gray-400">Totally serious expansion • Probably will rugpull (jk) • Moon? 🚀</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800 py-12 px-4">
        <div className="max-w-7xl mx-auto text-center text-gray-600 dark:text-gray-400">
          <p className="mb-2">© 2026 CATWIFWOOD • Not Financial Advice™</p>
          <p className="text-sm">Robinhood Chain 4663 • Meme Status: Maximum</p>
          <p className="text-xs mt-4">disclaimer: please consult with your cat before investing</p>
        </div>
      </footer>
    </div>
  )
}
