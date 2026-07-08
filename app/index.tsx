// All routing happens in app/_layout.tsx via the three-way auth gate
// (no session / player row / agent row). This index screen just holds
// while the gate resolves — usually only visible for a single frame
// during cold start.
export default function Index() {
  return null;
}
