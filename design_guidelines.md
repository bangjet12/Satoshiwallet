{
  "brand": {
    "name": "Satoshi",
    "attributes": [
      "quietly premium",
      "trustworthy",
      "minimal",
      "crypto-native",
      "PWA-mobile-first",
      "monochrome with disciplined orange accent"
    ],
    "voice": {
      "tone": "calm, precise, low-noise",
      "language": "Primarily English with occasional Indonesian helper text (e.g., 'Masukkan PIN')",
      "copy_rules": [
        "Prefer short labels: 'receive', 'send', 'transactions'.",
        "Avoid marketing phrases; keep it utilitarian.",
        "Use sentence case only in helper text; labels are lowercase/small-caps style."
      ]
    }
  },
  "design_tokens": {
    "note": "Set tokens in /app/frontend/src/index.css :root and .dark. App should default to dark theme.",
    "colors": {
      "base": {
        "bg": "#0A0A0A",
        "bg_2": "#000000",
        "surface": "#121212",
        "surface_2": "#161616",
        "border": "rgba(255,255,255,0.10)",
        "border_strong": "rgba(255,255,255,0.16)",
        "text": "#FFFFFF",
        "text_muted": "rgba(255,255,255,0.68)",
        "text_faint": "rgba(255,255,255,0.42)",
        "icon": "rgba(255,255,255,0.86)"
      },
      "accent": {
        "btc_orange": "#F7931A",
        "btc_orange_hover": "#FF9F2E",
        "btc_orange_pressed": "#E88410",
        "btc_orange_soft": "rgba(247,147,26,0.14)",
        "ring": "rgba(247,147,26,0.45)"
      },
      "state": {
        "success": "#2EE59D",
        "warning": "#F7C948",
        "danger": "#FF5C5C",
        "pending": "rgba(247,147,26,0.75)"
      },
      "semantic": {
        "background": "hsl(0 0% 4%)",
        "foreground": "hsl(0 0% 98%)",
        "card": "hsl(0 0% 7%)",
        "card_foreground": "hsl(0 0% 98%)",
        "popover": "hsl(0 0% 7%)",
        "popover_foreground": "hsl(0 0% 98%)",
        "primary": "hsl(0 0% 98%)",
        "primary_foreground": "hsl(0 0% 9%)",
        "secondary": "hsl(0 0% 12%)",
        "secondary_foreground": "hsl(0 0% 98%)",
        "muted": "hsl(0 0% 12%)",
        "muted_foreground": "hsl(0 0% 64%)",
        "accent": "hsl(0 0% 12%)",
        "accent_foreground": "hsl(0 0% 98%)",
        "destructive": "hsl(0 84% 60%)",
        "destructive_foreground": "hsl(0 0% 98%)",
        "border": "hsl(0 0% 14%)",
        "input": "hsl(0 0% 14%)",
        "ring": "hsl(35 92% 54%)"
      },
      "allowed_gradients": {
        "hero_vignette": "radial-gradient(60% 45% at 50% 22%, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 35%, rgba(0,0,0,0) 70%)",
        "accent_glow": "radial-gradient(40% 40% at 50% 50%, rgba(247,147,26,0.18) 0%, rgba(247,147,26,0.06) 45%, rgba(0,0,0,0) 70%)"
      }
    },
    "typography": {
      "font_pairing": {
        "ui_sans": "Inter (variable) or Manrope",
        "display_digits": "Cormorant Garamond (light) OR Spectral (light) for balance digits",
        "mono_optional": "Azeret Mono (for invoice strings / technical)"
      },
      "google_fonts_import": [
        "https://fonts.googleapis.com/css2?family=Inter:wght@200;300;400;500;600&display=swap",
        "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500&display=swap",
        "https://fonts.googleapis.com/css2?family=Azeret+Mono:wght@300;400;500&display=swap"
      ],
      "scale_tailwind": {
        "h1": "text-4xl sm:text-5xl lg:text-6xl",
        "h2": "text-base md:text-lg",
        "body": "text-sm sm:text-base",
        "small": "text-xs"
      },
      "component_styles": {
        "brand_mark": "font-inter font-light tracking-tight text-[15px] text-white/90",
        "label_smallcaps": "font-inter text-[11px] tracking-[0.22em] uppercase text-white/55",
        "balance_digits": "font-[\"Cormorant Garamond\"] font-light tabular-nums tracking-[-0.02em]",
        "amount_inline": "font-inter font-medium tabular-nums",
        "invoice_mono": "font-[\"Azeret Mono\"] text-[12px] leading-5 text-white/70"
      }
    },
    "spacing": {
      "container": {
        "max_width": "max-w-[440px]",
        "padding": "px-5",
        "vertical_rhythm": "space-y-6"
      },
      "tap_targets": {
        "min_height": "min-h-[44px]",
        "pill_height": "h-14",
        "keypad_key": "h-14"
      }
    },
    "radius": {
      "card": "rounded-2xl",
      "pill": "rounded-full",
      "sheet": "rounded-t-3xl",
      "input": "rounded-xl"
    },
    "shadows": {
      "soft": "0 10px 30px rgba(0,0,0,0.55)",
      "pill": "0 18px 40px rgba(0,0,0,0.65)",
      "inset": "inset 0 1px 0 rgba(255,255,255,0.06)"
    },
    "noise_texture": {
      "css_snippet": "background-image: radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px); background-size: 3px 3px; opacity: 0.18; mix-blend-mode: overlay;",
      "image_urls": [
        {
          "category": "optional-overlay",
          "description": "Subtle grain texture (use as low-opacity overlay layer, not as content background)",
          "url": "https://images.unsplash.com/photo-1629968417850-3505f5180761?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85"
        }
      ]
    }
  },
  "layout_system": {
    "app_shell": {
      "pattern": "Centered single column PWA",
      "rules": [
        "Use a full-bleed near-black body background.",
        "Center the main column with mx-auto but keep text left-aligned by default.",
        "Max width ~440px; on desktop show same column centered with generous margins.",
        "Bottom action pill floats above safe-area inset; reserve padding-bottom so lists don't hide behind it."
      ],
      "tailwind_scaffold": {
        "page_wrapper": "min-h-dvh bg-[#0A0A0A] text-white",
        "center_column": "mx-auto w-full max-w-[440px] px-5",
        "safe_bottom": "pb-[calc(96px+env(safe-area-inset-bottom))]",
        "top_padding": "pt-6"
      }
    },
    "grid": {
      "default": "Single column",
      "lists": "Use gap-3 for transaction rows",
      "forms": "Use space-y-4; labels small-caps"
    }
  },
  "components": {
    "component_path": {
      "shadcn_primary": [
        "/app/frontend/src/components/ui/button.jsx",
        "/app/frontend/src/components/ui/sheet.jsx",
        "/app/frontend/src/components/ui/dialog.jsx",
        "/app/frontend/src/components/ui/drawer.jsx",
        "/app/frontend/src/components/ui/tabs.jsx",
        "/app/frontend/src/components/ui/input.jsx",
        "/app/frontend/src/components/ui/input-otp.jsx",
        "/app/frontend/src/components/ui/card.jsx",
        "/app/frontend/src/components/ui/separator.jsx",
        "/app/frontend/src/components/ui/scroll-area.jsx",
        "/app/frontend/src/components/ui/sonner.jsx",
        "/app/frontend/src/components/ui/switch.jsx",
        "/app/frontend/src/components/ui/tooltip.jsx"
      ],
      "notes": [
        "Use Sheet/Drawer for slide-up flows (Receive/Send) to mimic native wallet feel.",
        "Use Dialog for QR scanner modal if it needs full-screen overlay.",
        "Use InputOTP for 6-digit PIN entry (Cash App style)."
      ]
    },
    "custom_components_to_build": [
      {
        "name": "TopBrandBar",
        "purpose": "Centered brand mark 'satoshi.' with subtle dot; optional right-side profile icon",
        "data_testids": ["top-brand-bar", "top-brand-bar-profile-button"],
        "tailwind": "flex items-center justify-center relative h-12"
      },
      {
        "name": "BalanceHero",
        "purpose": "Centered label + eye toggle + huge balance digits + transactions link",
        "data_testids": [
          "wallet-balance-label",
          "wallet-balance-eye-toggle",
          "wallet-balance-amount",
          "wallet-balance-secondary-amount",
          "wallet-transactions-link"
        ],
        "tailwind": "pt-10 pb-8 text-center"
      },
      {
        "name": "BottomActionPill",
        "purpose": "Floating pill with two actions Receive | Send (orange accent only here)",
        "data_testids": ["bottom-action-pill", "bottom-action-receive-button", "bottom-action-send-button"],
        "tailwind": "fixed left-1/2 -translate-x-1/2 bottom-[calc(18px+env(safe-area-inset-bottom))] w-[min(440px,calc(100vw-40px))]"
      },
      {
        "name": "NumericPad",
        "purpose": "Amount entry keypad for sats (and optional USD toggle)",
        "data_testids": ["numeric-pad", "numeric-pad-key"],
        "tailwind": "grid grid-cols-3 gap-3"
      },
      {
        "name": "InvoiceCard",
        "purpose": "Shows BOLT11 invoice string, QR, copy/share actions",
        "data_testids": [
          "invoice-card",
          "invoice-qr",
          "invoice-copy-button",
          "invoice-share-button",
          "invoice-string"
        ],
        "tailwind": "rounded-2xl border border-white/10 bg-white/[0.04] p-4"
      },
      {
        "name": "TransactionRow",
        "purpose": "Minimal row with direction, sats, status dot, timestamp",
        "data_testids": ["transaction-row", "transaction-row-amount", "transaction-row-status"],
        "tailwind": "flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3"
      },
      {
        "name": "PinEntrySheet",
        "purpose": "6-digit PIN confirmation sheet for send",
        "data_testids": ["pin-entry-sheet", "pin-entry-otp", "pin-entry-submit"],
        "tailwind": "space-y-5"
      }
    ],
    "button_system": {
      "variants": {
        "primary_orange": {
          "use": "Only for key CTAs: Receive/Send, Generate Invoice, Pay/Send Confirm",
          "tailwind": "bg-[#F7931A] text-black hover:bg-[#FF9F2E] active:bg-[#E88410] focus-visible:ring-2 focus-visible:ring-[#F7931A]/50",
          "min_size": "h-12 px-5 rounded-full"
        },
        "secondary_dark": {
          "use": "Secondary actions: Copy, Share, Scan QR",
          "tailwind": "bg-white/[0.06] text-white hover:bg-white/[0.09] active:bg-white/[0.12] border border-white/10 rounded-full",
          "min_size": "h-12 px-5"
        },
        "ghost": {
          "use": "Inline links like Transactions",
          "tailwind": "bg-transparent text-white/70 hover:text-white hover:bg-white/[0.04] rounded-full"
        }
      },
      "interaction_rules": [
        "No 'transition-all'. Use transition-colors and transition-opacity.",
        "Active press: scale-95 only on buttons (transition-transform duration-150).",
        "Focus ring: orange ring for primary CTAs; subtle white ring for others."
      ]
    }
  },
  "motion": {
    "library": {
      "recommended": "framer-motion",
      "install": "npm i framer-motion",
      "usage_notes": [
        "Use for sheet entrance, balance reveal blur, transaction row tap feedback.",
        "Respect prefers-reduced-motion: reduce durations to 0 and disable parallax."
      ]
    },
    "principles": {
      "durations_ms": {
        "tap": 120,
        "sheet": 220,
        "fade": 160,
        "list": 180
      },
      "easing": {
        "standard": "cubic-bezier(0.2, 0.8, 0.2, 1)",
        "snappy": "cubic-bezier(0.2, 1, 0.2, 1)"
      },
      "micro_interactions": [
        "Balance eye toggle: crossfade digits <-> dots + slight blur (2px) during transition.",
        "Bottom pill buttons: subtle orange glow halo on hover/focus (desktop) and on press (mobile).",
        "Transaction row: on tap, background increases from 0.03 to 0.06 opacity; no big movement.",
        "PIN failure: horizontal shake (8px) + brief red flash on dots."
      ]
    }
  },
  "accessibility": {
    "rules": [
      "Minimum tap target 44px.",
      "Orange on black must meet AA: use black text on orange buttons.",
      "Eye toggle must be a real button with aria-label and data-testid.",
      "Hide balance: replace digits with •••• and keep layout width stable (tabular-nums).",
      "Do not rely on color alone for tx status; include label text in details view."
    ]
  },
  "screen_blueprints": {
    "auth_signup_login": {
      "layout": [
        "Top: centered brand 'satoshi.'",
        "Middle: username input (single field), helper text",
        "Bottom: primary orange button 'continue'",
        "Then: PIN setup / PIN entry using InputOTP"
      ],
      "components": ["Input", "Button", "InputOTP", "Sheet"],
      "data_testids": [
        "auth-username-input",
        "auth-continue-button",
        "auth-pin-otp",
        "auth-pin-submit-button",
        "auth-login-link"
      ]
    },
    "home_dashboard": {
      "must_match_reference": [
        "Centered 'Total Wallet Balance' label with eye toggle",
        "Huge $0.00 digits (serif-ish thin)",
        "Transactions link below with double-arrow icon",
        "Bottom floating pill with Receive | Send"
      ],
      "sections": [
        "TopBrandBar",
        "BalanceHero",
        "(Optional) tiny sats + USD equivalent line",
        "BottomActionPill"
      ]
    },
    "receive_flow": {
      "pattern": "Slide-up Sheet with Tabs",
      "steps": [
        "Step 1: Amount entry (sats) with NumericPad + optional memo textarea",
        "Step 2: Generate invoice -> show InvoiceCard with QR + copy/share",
        "Tab 2: Lightning Address share (username@satoshi.app)"
      ],
      "data_testids": [
        "receive-open-sheet",
        "receive-amount-display",
        "receive-memo-input",
        "receive-generate-invoice-button",
        "receive-lightning-address-tab",
        "receive-invoice-tab"
      ]
    },
    "send_flow": {
      "pattern": "Slide-up Sheet + confirm + PIN",
      "steps": [
        "Input: paste invoice or lightning address; secondary button Scan QR",
        "Decode: show parsed amount/memo/destination",
        "Confirm: primary orange 'send'",
        "PIN: PinEntrySheet",
        "Result: success/failure state with receipt-like card"
      ],
      "data_testids": [
        "send-open-sheet",
        "send-invoice-input",
        "send-scan-qr-button",
        "send-decode-summary",
        "send-confirm-button",
        "send-result-state"
      ]
    },
    "qr_scanner": {
      "pattern": "Full-screen Dialog/Drawer",
      "ui": [
        "Black overlay, orange corner guides (thin)",
        "Close button top-left",
        "Torch toggle optional"
      ],
      "data_testids": ["qr-scanner-modal", "qr-scanner-close", "qr-scanner-torch-toggle"]
    },
    "transactions": {
      "list": [
        "Header: 'transactions' + filter (tabs: all / pending / completed)",
        "Scroll list of TransactionRow",
        "Pull-to-refresh (mobile): show subtle spinner"
      ],
      "detail": [
        "Open as Sheet: amount, status, memo, destination, timestamp, raw invoice (mono)",
        "Copy buttons"
      ],
      "data_testids": [
        "transactions-screen",
        "transactions-filter-tabs",
        "transaction-detail-sheet",
        "transaction-detail-copy-invoice"
      ]
    },
    "settings_profile": {
      "layout": [
        "Card list: username, lightning address, hide balance toggle",
        "Logout button (destructive outline)"
      ],
      "data_testids": [
        "settings-screen",
        "settings-hide-balance-toggle",
        "settings-logout-button"
      ]
    }
  },
  "image_urls": {
    "background_textures": [
      {
        "description": "Optional subtle grain overlay (very low opacity). Prefer CSS noise first.",
        "url": "https://images.unsplash.com/photo-1629968417850-3505f5180761?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85"
      }
    ],
    "notes": "This product is mostly UI-only; avoid illustrative photos."
  },
  "instructions_to_main_agent": {
    "global_css_changes": [
      "Remove CRA default App.css centering patterns; do not use .App-header layout.",
      "Set body background to near-black and apply dark tokens by default.",
      "Add font imports in index.html or index.css and set font-family tokens.",
      "Implement a subtle radial vignette behind the balance hero (max 20% viewport).",
      "Never use purple. Accent orange only for primary CTAs."
    ],
    "testing": {
      "data_testid_rule": "All interactive and key informational elements must include data-testid in kebab-case.",
      "examples": [
        "data-testid=\"bottom-action-send-button\"",
        "data-testid=\"receive-generate-invoice-button\"",
        "data-testid=\"wallet-balance-eye-toggle\""
      ]
    },
    "libraries": [
      {
        "name": "framer-motion",
        "why": "micro-interactions + sheet transitions",
        "install": "npm i framer-motion"
      },
      {
        "name": "qrcode",
        "why": "Generate QR for BOLT11 invoices",
        "install": "npm i qrcode"
      }
    ],
    "implementation_notes_js": [
      "Project uses .jsx components; keep guidelines and examples in JS/JSX (no TSX).",
      "Prefer shadcn/ui primitives from /src/components/ui for inputs, sheets, dialogs, tabs, OTP."
    ]
  }
}

---

<General UI UX Design Guidelines>  
    - You must **not** apply universal transition. Eg: `transition: all`. This results in breaking transforms. Always add transitions for specific interactive elements like button, input excluding transforms
    - You must **not** center align the app container, ie do not add `.App { text-align: center; }` in the css file. This disrupts the human natural reading flow of text
   - NEVER: use AI assistant Emoji characters like`🤖🧠💭💡🔮🎯📚🎭🎬🎪🎉🎊🎁🎀🎂🍰🎈🎨🎰💰💵💳🏦💎🪙💸🤑📊📈📉💹🔢🏆🥇 etc for icons. Always use **FontAwesome cdn** or **lucid-react** library already installed in the package.json

 **GRADIENT RESTRICTION RULE**
NEVER use dark/saturated gradient combos (e.g., purple/pink) on any UI element.  Prohibited gradients: blue-500 to purple 600, purple 500 to pink-500, green-500 to blue-500, red to pink etc
NEVER use dark gradients for logo, testimonial, footer etc
NEVER let gradients cover more than 20% of the viewport.
NEVER apply gradients to text-heavy content or reading areas.
NEVER use gradients on small UI elements (<100px width).
NEVER stack multiple gradient layers in the same viewport.

**ENFORCEMENT RULE:**
    • Id gradient area exceeds 20% of viewport OR affects readability, **THEN** use solid colors

**How and where to use:**
   • Section backgrounds (not content backgrounds)
   • Hero section header content. Eg: dark to light to dark color
   • Decorative overlays and accent elements only
   • Hero section with 2-3 mild color
   • Gradients creation can be done for any angle say horizontal, vertical or diagonal

- For AI chat, voice application, **do not use purple color. Use color like light green, ocean blue, peach orange etc**

</Font Guidelines>

- Every interaction needs micro-animations - hover states, transitions, parallax effects, and entrance animations. Static = dead. 
   
- Use 2-3x more spacing than feels comfortable. Cramped designs look cheap.

- Subtle grain textures, noise overlays, custom cursors, selection states, and loading animations: separates good from extraordinary.
   
- Before generating UI, infer the visual style from the problem statement (palette, contrast, mood, motion) and immediately instantiate it by setting global design tokens (primary, secondary/accent, background, foreground, ring, state colors), rather than relying on any library defaults. Don't make the background dark as a default step, always understand problem first and define colors accordingly
    Eg: - if it implies playful/energetic, choose a colorful scheme
           - if it implies monochrome/minimal, choose a black–white/neutral scheme

**Component Reuse:**
	- Prioritize using pre-existing components from src/components/ui when applicable
	- Create new components that match the style and conventions of existing components when needed
	- Examine existing components to understand the project's component patterns before creating new ones

**IMPORTANT**: Do not use HTML based component like dropdown, calendar, toast etc. You **MUST** always use `/app/frontend/src/components/ui/ ` only as a primary components as these are modern and stylish component

**Best Practices:**
	- Use Shadcn/UI as the primary component library for consistency and accessibility
	- Import path: ./components/[component-name]

**Export Conventions:**
	- Components MUST use named exports (export const ComponentName = ...)
	- Pages MUST use default exports (export default function PageName() {...})

**Toasts:**
  - Use `sonner` for toasts"
  - Sonner component are located in `/app/src/components/ui/sonner.tsx`

Use 2–4 color gradients, subtle textures/noise overlays, or CSS-based noise to avoid flat visuals.
</General UI UX Design Guidelines>
