/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
        "./*.{js,ts,jsx,tsx}",
        "./screens/**/*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}"
    ],
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                primary: "#E0592A",
                "triex-grey": "#3D3935",
                "triex-bg": "#F9FAFB",
            },
            fontFamily: {
                sans: ["Plus Jakarta Sans", "sans-serif"],
                ubuntu: ["Ubuntu", "sans-serif"],
            },
            animation: {
                'pulse-subtle': 'pulse-subtle 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            },
            keyframes: {
                'pulse-subtle': {
                    '0%, 100%': { opacity: 1, transform: 'scale(1)' },
                    '50%': { opacity: .8, transform: 'scale(1.05)' },
                }
            }
        }
    },
    plugins: [
        require('@tailwindcss/forms'),
        require('@tailwindcss/typography'),
        require('@tailwindcss/container-queries'),
    ],
}
