import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: "media",
    content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	extend: {
  		colors: {
  			background: 'var(--background)',
  			foreground: 'var(--foreground)'
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		backgroundImage: {
  			"gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
  			"gradient-conic":
  				"conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
  		},
  		animation: {
  			'fade-in': 'fadeIn 0.6s ease-out',
  			'fade-in-up': 'fadeInUp 0.8s ease-out',
  			'bounce-in': 'bounceIn 0.8s ease-out',
  			'shimmer': 'shimmer 2s linear infinite',
  			'sparkle': 'sparkle 1.5s ease-in-out infinite',
  			'float': 'float 3s ease-in-out infinite',
  			'glow': 'glow 2s ease-in-out infinite alternate',
  			'ripple': 'ripple 1s ease-out infinite',
  			'wave': 'wave 2s ease-in-out infinite',
  			'flood-sparkle': 'floodSparkle 1.2s ease-in-out infinite',
  			'water-flow': 'waterFlow 3s linear infinite',
  			'crystal-shine': 'crystalShine 2.5s ease-in-out infinite',
  			'golden-glow': 'goldenGlow 2s ease-in-out infinite alternate',
  		},
  		keyframes: {
  			fadeIn: {
  				'0%': { opacity: '0' },
  				'100%': { opacity: '1' },
  			},
  			fadeInUp: {
  				'0%': { opacity: '0', transform: 'translateY(20px)' },
  				'100%': { opacity: '1', transform: 'translateY(0)' },
  			},
  			bounceIn: {
  				'0%': { opacity: '0', transform: 'scale(0.3)' },
  				'50%': { opacity: '1', transform: 'scale(1.05)' },
  				'70%': { transform: 'scale(0.9)' },
  				'100%': { opacity: '1', transform: 'scale(1)' },
  			},
  			shimmer: {
  				'0%': { transform: 'translateX(-100%)' },
  				'100%': { transform: 'translateX(100%)' },
  			},
  			sparkle: {
  				'0%, 100%': { opacity: '0.3', transform: 'scale(1)' },
  				'50%': { opacity: '1', transform: 'scale(1.2)' },
  			},
  			float: {
  				'0%, 100%': { transform: 'translateY(0px)' },
  				'50%': { transform: 'translateY(-10px)' },
  			},
  			glow: {
  				'0%': { boxShadow: '0 0 5px rgba(59, 130, 246, 0.5)' },
  				'100%': { boxShadow: '0 0 20px rgba(59, 130, 246, 0.8), 0 0 30px rgba(59, 130, 246, 0.6)' },
  			},
  			ripple: {
  				'0%': { transform: 'scale(0)', opacity: '1' },
  				'100%': { transform: 'scale(4)', opacity: '0' },
  			},
  			wave: {
  				'0%, 100%': { transform: 'translateX(0)' },
  				'50%': { transform: 'translateX(-10px)' },
  			},
  			floodSparkle: {
  				'0%, 100%': { 
  					opacity: '0.6', 
  					filter: 'blur(2px)',
  					boxShadow: '0 0 15px rgba(59, 130, 246, 0.6)'
  				},
  				'50%': { 
  					opacity: '0.9', 
  					filter: 'blur(1px)',
  					boxShadow: '0 0 25px rgba(59, 130, 246, 0.9), 0 0 35px rgba(34, 211, 238, 0.7)'
  				},
  			},
  			waterFlow: {
  				'0%': { transform: 'translateX(-100%)' },
  				'100%': { transform: 'translateX(100%)' },
  			},
  			crystalShine: {
  				'0%, 100%': { 
  					opacity: '0.7',
  					filter: 'brightness(1) saturate(1)'
  				},
  				'50%': { 
  					opacity: '1',
  					filter: 'brightness(1.3) saturate(1.2)'
  				},
  			},
  			goldenGlow: {
  				'0%': { 
  					boxShadow: '0 0 10px rgba(245, 158, 11, 0.6), 0 0 20px rgba(245, 158, 11, 0.4)',
  					filter: 'brightness(1)'
  				},
  				'100%': { 
  					boxShadow: '0 0 20px rgba(245, 158, 11, 0.8), 0 0 30px rgba(245, 158, 11, 0.6), 0 0 40px rgba(245, 158, 11, 0.4)',
  					filter: 'brightness(1.2)'
  				},
  			},
  		}
  	}
  },
  plugins: [],
} satisfies Config;

export default config;
