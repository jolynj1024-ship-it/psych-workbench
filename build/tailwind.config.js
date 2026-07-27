/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    '../public/index.html',
    '../public/js/**/*.jsx'
  ],
  theme: {
    extend: {
      colors: {
        primary: '#2D9CDB',
        primarydark: '#1E7FB8',
        cream: '#F5F0EB',
        accent: '#F5A623'
      },
      boxShadow: {
        soft: '0 2px 12px rgba(45,60,80,0.08)',
        lift: '0 6px 24px rgba(45,60,80,0.12)'
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', '"PingFang SC"', '"Hiragino Sans GB"', '"Microsoft YaHei"', 'sans-serif']
      }
    }
  },
  safelist: [
    'bg-gray-100', 'text-gray-600', 'bg-blue-100', 'text-blue-600',
    'bg-purple-100', 'text-purple-600', 'bg-orange-100', 'text-orange-600',
    'bg-green-100', 'text-green-600', 'bg-red-100', 'text-red-600',
    'bg-amber-100', 'text-amber-600', 'bg-teal-100', 'text-teal-600'
  ],
  corePlugins: { preflight: true },
  plugins: []
};
