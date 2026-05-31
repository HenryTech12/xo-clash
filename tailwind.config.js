/** @type {import('tailwindcss').Config} */
export default {
    content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
    theme: {
        extend: {
            colors: {
                'plasma-blue': '#00D4FF',
                'plasma-purple': '#BF5FFF',
                'plasma-pink': '#FF2D78',
                'plasma-gold': '#FFD700',
                'arena-dark': '#030712',
                'arena-mid': '#0A0F1E',
                'arena-surface': '#0F172A',
                'grid-line': 'rgba(0, 212, 255, 0.15)',
            },
            fontFamily: {
                orbitron: ['Orbitron', 'sans-serif'],
                rajdhani: ['Rajdhani', 'sans-serif'],
            },
        },
    },
    plugins: [],
};
