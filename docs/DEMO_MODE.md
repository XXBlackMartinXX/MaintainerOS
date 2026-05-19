# Demo Mode

Demo mode lets visitors explore every screen of MaintainerOS without connecting GitHub.

## How it works

- Triggered by the "Try demo" button on the landing page or the toggle in Settings.
- Stored in `localStorage` under `mos.demoMode`.
- A global banner is shown at the top of every app page.
- Every AI output is labeled "Demo AI output" instead of "AI draft".

## Hard guarantees

- Demo mode **never** mixes with live synced GitHub data.
- Demo mode **never** calls GitHub write functions.
- Demo mode **never** calls AI Gateway unless explicitly allowed by a future setting.
- All publish buttons are disabled with a tooltip: "Publishing is disabled in demo mode."
- All sync buttons are disabled with a tooltip: "GitHub sync requires a connected repository."

## Exiting demo mode

Use the "Exit demo" link in the banner, or untick the checkbox in Settings → Demo mode.
