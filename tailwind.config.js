/** @type {import('tailwindcss').Config} */
export default {
    content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
    theme: {
        extend: {
            colors: {
                brand: '#5b6ef5',
                master: '#b98ff0',
                danger: '#ff5468',
                'rank-gold': '#e8b84b',
                live: '#2fbe8f',
                warn: '#e8a63b',
                void: '#0b0e13',
                surface: '#12161d',
                'surface-2': '#1a2029',
                'surface-3': '#232a35',
                'grid-line': 'rgba(91, 110, 245, 0.15)',
            },
            fontFamily: {
                orbitron: ['"Chakra Petch"', '"Arial Narrow"', 'sans-serif'],
                rajdhani: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
                data: ['"IBM Plex Mono"', '"Courier New"', 'monospace'],
            },
        },
    },
    plugins: [],
};
