---
name: DashboardLayout architecture
description: How the post-overhaul DashboardLayout is structured — drawer, bottom nav, header.
---

# DashboardLayout

**Why:** Large UI overhaul replaced left sidebar + hamburger with right-side drawer and a fixed 5-button bottom nav.

## Header (2 rows)
- Row 1 left: AI Chat button (MessageCircle, yellow circle, navigates to /app/chat) + greeting/firstName/tier label
- Row 1 right: Bell (notification dropdown), Sun/Moon (brightness toggle), Balance chip (hidden on mobile < sm), Profile pic button (w-11 h-11, opens right drawer)
- Row 2: Crown icon + Tier label + balance — Upgrade link → /app/pricing

## Nav drawer
- Slides from RIGHT (translate-x-full → translate-x-0)
- Opened/closed by profile pic button (setNavOpen)
- navItems: Wallet, Chat Fin, News, Notifications, Settings, Support, Pricing, Admin (if admin)

## Bottom nav (fixed, z-30)
- 5 items: Home (/app/dashboard), Trade (/app/trade), Fin Bot center elevated (/app/bots), Markets (/app/markets), Profile (/app/profile)
- Fin Bot: -top-5 relative, w-14 h-14 yellow circle, Bot icon
- Active indicator: gold underline dot below label
- Main content uses pb-24 to clear the bottom nav

**How to apply:** Any change to nav items goes in `sideNavItems` array; bottom nav items are hardcoded in the return JSX.
