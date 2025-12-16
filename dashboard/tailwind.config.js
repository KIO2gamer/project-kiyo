/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
    theme: {
        extend: {
            fontFamily: {
                display: ['"Space Grotesk"', '"DM Sans"', "sans-serif"],
                sans: ['"Space Grotesk"', '"DM Sans"', "sans-serif"],
            },
            colors: {
                ink: {
                    50: "#f6f7fb",
                    100: "#eaeef7",
                    200: "#cfd6ec",
                    300: "#a9b5dc",
                    400: "#6e84c2",
                    500: "#2f4f9a",
                    600: "#233d7c",
                    700: "#1e3161",
                    800: "#18294f",
                    900: "#12203f",
                },
                jade: {
                    50: "#ebfef5",
                    100: "#d0f9e6",
                    200: "#a6f0d1",
                    300: "#6fe2b6",
                    400: "#3dcb97",
                    500: "#19ad7c",
                    600: "#0f8b63",
                    700: "#0d6d4f",
                    800: "#0c5943",
                    900: "#0b4a37",
                },
                ember: {
                    50: "#fff5ed",
                    100: "#ffe4d1",
                    200: "#ffcca6",
                    300: "#ffa76d",
                    400: "#ff7a2f",
                    500: "#f8581a",
                    600: "#e04712",
                    700: "#b1360f",
                    800: "#8f2d14",
                    900: "#762714",
                },
            },
            boxShadow: {
                glow: "0 10px 40px rgba(25, 173, 124, 0.25)",
            },
        },
    },
    plugins: [],
};
