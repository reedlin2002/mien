// Measured on github.com at desktop widths: a profile README's text column is 846px
// wide inside 24px of padding, set at 14px. The canvas uses the same box, scaled to
// fit, so text wraps and badges sit exactly as they will on the profile.
export const PAGE_WIDTH = 846;
export const PAGE_PADDING = 24;
export const PAGE_FONT_SIZE = 14;
export const BOX_WIDTH = PAGE_WIDTH + PAGE_PADDING * 2 + 2;
