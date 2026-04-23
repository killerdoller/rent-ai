/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: '#D87D6F',
                'text-main': '#0F172A',
                'text-muted': '#475569',
                'mint-soft': '#F2F7F4',
                'olive-match': '#8CA693',
                'terracotta-warm': '#C7D9BF',
                accent: '#C7D9BF',
                'bg-light': '#FFFFFF',
                "bg-dark": "#0f172a",
                glass: "rgba(255, 255, 255, 0.05)",
                "glass-border": "rgba(255, 255, 255, 0.1)",
            },
            borderRadius: {
                '3xl': '24px',
                '4xl': '32px',
            },
            animation: {
                'gradient': 'gradient 8s linear infinite',
                'float': 'float 6s ease-in-out infinite',
            },
            keyframes: {
                gradient: {
                    '0%, 100%': { 'background-size': '200% 200%', 'background-position': 'left center' },
                    '50%': { 'background-size': '200% 200%', 'background-position': 'right center' },
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-20px)' },
                }
            },
            backdropBlur: {
                xs: '2px',
            }
        },
    },
    plugins: [],
}
