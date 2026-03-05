/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: '#A65D8C', // Morado principal
                'text-main': '#1A1C1E', // Casi negro
                'text-muted': '#79858C', // Gris azulado
                'mint-soft': '#C7D9BF', // Verde menta suave
                'olive-match': '#688C4F', // Verde oliva (acento positivo)
                'terracotta-warm': '#BF7E7E', // Rosa terracota (acento cálido)
                accent: '#BF7E7E',
                'bg-light': '#FDFDFD', // Blanco cálido
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
