// Tailwind mapping for panel-sim — merge into tailwind.config.(js|ts):
// colors reference tokens.css custom properties so components write
// `bg-surface text-muted`, never raw hex.
export default {
  theme: {
    extend: {
      colors: {
        bg: "var(--color-bg)",
        canvas: "var(--color-canvas)",
        surface: "var(--color-surface)",
        border: "var(--color-border)",
        "border-input": "var(--color-border-input)",
        text: "var(--color-text)",
        "text-muted": "var(--color-text-muted)",
        accent: "var(--color-accent)",
        "on-accent": "var(--color-on-accent)",
        chrome: "var(--color-chrome)",
        "on-chrome": "var(--color-on-chrome)",
        danger: "var(--color-danger)",
        success: "var(--color-success)",
        warning: "var(--color-warning)",
        live: "var(--color-live)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      borderRadius: {
        sm: "var(--radius-sm)", md: "var(--radius-md)",
        lg: "var(--radius-lg)", pill: "var(--radius-pill)",
      },
      boxShadow: { card: "var(--shadow-card)", pop: "var(--shadow-pop)" },
      transitionDuration: {
        fast: "var(--motion-fast)", base: "var(--motion-base)",
      },
    },
  },
};
