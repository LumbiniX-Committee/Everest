# End-to-end flows

Run on a real Android phone or an emulator with a development build, which includes x86_64 (see `app.config.ts`):

```sh
npx eas-cli build --profile development --platform android
maestro test .maestro/
```

| Flow | Checks |
| --- | --- |
| `onboarding.yaml` | First run ends on Home, with the price matching the visitor type |
| `never-stranded.yaml` | The stuck-user bugs from the navigation audit stay fixed |
| `plans.yaml` | A wrong activation code is refused clearly |
| `place-and-3d.yaml` | A cold deep link to a place, visit planning, and the free 3D model |

Flows that need GPS, the compass or the camera on site are covered by the field checklist in `docs/APP_GUIDE.md`, not here.
