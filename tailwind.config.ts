import type {Config} from 'tailwindcss';

export default {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
  	container: {
  		center: true,
  		padding: '2rem',
  		screens: {
  			'2xl': '1400px'
  		}
  	},
  	extend: {
  		fontFamily: {
  			body: [
  				'Inter',
  				'sans-serif'
  			],
  			headline: [
  				'Switzer',
  				'Inter',
  				'sans-serif'
  			],
  			switzer: [
  				'Switzer',
  				'sans-serif'
  			],
  			code: [
  				'Source Code Pro',
  				'monospace'
  			]
  		},
  		colors: {
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
		destructive: {
				DEFAULT: 'hsl(var(--destructive))',
				foreground: 'hsl(var(--destructive-foreground))'
			},
			success: {
				DEFAULT: 'hsl(var(--success))',
				foreground: 'hsl(var(--success-foreground))'
			},
			warning: {
				DEFAULT: 'hsl(var(--warning))',
				foreground: 'hsl(var(--warning-foreground))'
			},
			progress: {
				DEFAULT: 'hsl(var(--progress))',
				foreground: 'hsl(var(--progress-foreground))'
			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			'vote-arrow-light': 'var(--vote-arrow-idle-light)',
  			'vote-arrow-dark': 'var(--vote-arrow-idle-dark)',
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
			brand: {
				discord: 'var(--brand-discord)',
				intercom: 'var(--brand-intercom)',
				slack: 'var(--brand-slack)',
				'slack-dark': 'var(--brand-slack-dark)',
				github: 'var(--brand-github)',
				'github-light': 'var(--brand-github-light)',
			},
			// Status colour palette — use these instead of hardcoded Tailwind
			// colour shades (green-100, red-800 etc.) so light/dark themes
			// are handled by the token layer rather than duplicate dark: classes.
			status: {
				'success-bg':     'var(--status-success-bg)',
				'success-border': 'var(--status-success-border)',
				'success-text':   'var(--status-success-text)',
				'warning-bg':     'var(--status-warning-bg)',
				'warning-border': 'var(--status-warning-border)',
				'warning-text':   'var(--status-warning-text)',
				'error-bg':       'var(--status-error-bg)',
				'error-border':   'var(--status-error-border)',
				'error-text':     'var(--status-error-text)',
				'info-bg':        'var(--status-info-bg)',
				'info-border':    'var(--status-info-border)',
				'info-text':      'var(--status-info-text)',
			},
			white: '#f9f9f9',
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		}
  	}
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config;
