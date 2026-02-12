/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                bg: '#0a0a0f',
                surface: '#12121a',
                'surface-2': '#1a1a26',
                border: '#2a2a3d',
                accent: '#00ff88',
                'accent-2': '#7b61ff',
                'accent-3': '#ff6b35',
                warn: '#ffd166',
                text: '#e8e8f0',
                muted: '#6b6b8a',
            },
            fontFamily: {
                mono: ['Space Mono', 'monospace'],
                display: ['Syne', 'sans-serif'],
                sans: ['var(--font-display, Syne)', 'sans-serif'],
            },
        },
    },
    plugins: [],
}
