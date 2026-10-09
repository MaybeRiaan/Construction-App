This is Playdar, an Expo (SDK 57) React Native app for iOS and Android that also builds for the web (the web build powers an interactive claude.ai artifact). Read `docs/ARCHITECTURE.md` first.

## Conventions

- **Navigation is React Navigation, not Expo Router.** Routes are declared in `src/navigation/RootNavigator.tsx`; params are typed in `src/navigation/types.ts`. Don't add a `src/app/` directory.
- **Platform splits use file extensions.** `foo.tsx` is the native implementation and `foo.web.tsx` replaces it on web; both export the same API. Never import native-only modules (react-native-maps, expo-location, expo-image-picker, expo-font) from shared files.
- **Design system first.** Use `src/ui` primitives and `src/theme` tokens (`useTheme().c`, `neu(c, depth)`, `T` variants). No literal colours in screens except the hazard palette and category colours.
- **Pure logic lives in `src/domain`.** No React or platform imports there.
- **Zustand selectors must return stable values.** Select raw state and derive with `useMemo`; a selector that returns a new array or object on every call loops.
- **Kids' privacy.** Never send kids' names or exact locations off the device. Public spots are rounded (`fuzz`) and photos with people stay private.
- **Expo has changed.** Check the installed package's types in `node_modules` before using an Expo or React Native API; use `npx expo install <pkg>` (or `EXPO_OFFLINE=1` when the Expo API is unreachable) to get SDK-compatible versions.

## Checks before declaring work done

```bash
npm run typecheck
npm run check:native      # bundles iOS and Android
npm run build:artifact    # web prototype still builds
```

The Supabase edge functions are Deno code under `supabase/functions` (excluded from the app's tsconfig).
