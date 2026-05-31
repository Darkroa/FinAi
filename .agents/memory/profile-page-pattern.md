---
name: ProfilePage card-nav pattern
description: ProfilePage uses a card-based list (no tabs); subPage state controls which sub-section renders inline.
---

# ProfilePage pattern

**Why:** UI overhaul replaced 4-tab bar with a mobile-style card list. Each row opens content inline.

## Main view (subPage === null)
- Profile photo (20×20 circle, centered)
- Name + email centered
- Tier badge (just label, no limits text)
- Channel icons row: Mail, MessageCircle (WhatsApp), Send (Telegram), Shield (KYC) — colored when active
- Navigation list rows: Personal Information → 'personal', FinAPI → 'finapi', Referral → 'referral', Settings → navigate('/app/settings'), Security → 'security'

## Sub-pages
- Wrapped in SubPageWrapper (shows ← back button + title)
- setSubPage(null) goes back to main view
- Settings row navigates away (does not use subPage)

## SecurityTab
- Notification Channels card REMOVED (moved to Profile main view icons)
- TradeAlertToggles REMOVED (moved to SettingsPage)
- Only contains: Change Password, Transfer PIN, Delete Account

## SettingsPage
- Trade Alerts section added (trade_open_alert, trade_close_alert) — off by default
- Uses same updateNotificationPreferences API call

**How to apply:** To add a new profile section, add a row to the navigation list array and add a `if (subPage === 'newSection')` branch at the top of ProfilePage.
