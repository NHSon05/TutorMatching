<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Frontend Design System Guidelines

- **Source of Truth:** Always inspect `docs/design-system/` before creating or editing UI components.
- **Typography:** Montserrat is enforced globally in `src/app/globals.css`. Do not declare alternative fonts.
- **Color Tokens:** Never hardcode raw hex values in JSX or CSS. Always use design system semantic tokens:
  - Brand / Learner: `brand-*`, `bg-brand`, `text-brand`
  - Tutor: `tutor-*`, `bg-role-tutor`, `text-role-tutor`
  - Admin: `admin-*`, `bg-role-admin`, `text-role-admin`
  - Shared / Messaging: `shared-*`, `bg-role-shared`, `text-role-shared`
  - Status: `status-success`, `status-warning`, `status-error`, `status-info`
  - Surface & Text: `bg-surface-base`, `bg-surface-card`, `text-content-primary`, `text-content-secondary`, `border-border-default`
  - Grayscale: `gray-50` to `gray-950`
- **Component Primitives:** Use reusable primitives from `src/components/` (e.g. Button, IconButton, Checkbox, Radio, Switch, Slider, TextField, TextArea, SearchField, PromptField, SegmentedControl, Star, Dropdown, SelectCheck, DatePicker, DateRangePicker, FileUpload, Attachment, Spinner, Skeleton, Badge, Toast, Dialog, Sheet, Avatar, Image, Card, Accordion, ChipBar, WelcomeBanner, FAB, Timeline, Calendar, EventCalendar, GanttChart). Do not invent ad-hoc markup.
