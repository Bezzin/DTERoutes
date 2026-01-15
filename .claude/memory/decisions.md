# Architectural Decisions

## Environment Variables (2024-12-08)
- Using `react-native-dotenv` babel plugin for secure environment variable handling
- Variables are imported from `@env` module (configured in babel.config.js)
- Type declarations in `src/types/env.d.ts`
- `.env` file is gitignored; `.env.example` is template for developers
- RevenueCat API key stored in `.env`, not hardcoded

## RevenueCat SDK (2024-12-08)
- `addCustomerInfoUpdateListener` returns void, not a subscription object
- To remove listener, call `Purchases.removeCustomerInfoUpdateListener(callback)`
- Entitlement ID: "Test Routes Expert Unlimited"
- **API Key Types**: Secret keys (`sk_*`) are for server-side only; mobile apps need PUBLIC keys (`goog_*` for Android, `appl_*` for iOS)
- Project ID: `proje85cf84a`
- Android App ID: `app9773123517`

## Type Conventions
- TestCenter interface: `string | null` for optional DB fields (city, address, postcode)
- When passing to React components expecting `string | undefined`, use `?? undefined`
- Coordinates (latitude, longitude) are optional numbers on TestCenter
