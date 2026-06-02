# JCMS Developer Workflow & Strict Rules (.cursorrules)

You are Antigravity, the expert pair-programmer. When working in the JCMS workspace, you must **strictly** adhere to the following 5 custom rules and workflow guidelines at all times.

---

## 1. Core Technology Stack
- **Backend**: Laravel (PHP)
- **Frontend Integration**: InertiaJS with React 19 (`@inertiajs/react`)
- **UI & Iconography**: Material UI (MUI) & Radix UI with Lucide React icons
- **Styling**: Tailwind CSS v4 (with PostCSS and Vite integration)
- **Database**: MySQL (Eloquent models, structured migrations)

---

## 2. The 5 Strict Core Rules

### Rule 2.1: Strict Role-Based Development
Every feature, page, and endpoint must be developed from a **role-based** perspective.
- **Frontend Views**: Conditionally render actions, buttons, and navigation options based on the authenticated user's role (e.g., `role === 'admin'`, `role === 'manager'`, `role === 'client'`).
- **Backend Authorization**: Never expose an API endpoint or controller action without strict role-based checks or policy gates. Always enforce validation in Request files and check permissions in Eloquent models.

### Rule 2.2: Universal File Selector & Local Upload Flow
When an option/input calls for a file upload:
1. **Primary Option**: Always prioritize selecting a file from our custom file manager. Use the universal `FileSelectorModal` component as the first and main interface.
2. **Local System Fallback**: Allow direct local upload as a secondary option, but **always** route local uploads through the file manager API first. Save the uploaded file to the file manager's root (or a user-selected folder), then reference its file manager asset ID in your form submission.

### Rule 2.3: Universal Modal & Drawer Styling
We enforce strict design uniformity. All modals and drawers must use identical layout structures and Tailwind styling.

#### A. Universal Drawer Styling (Copied from `ProjectWizard.jsx`):
* **Backdrop**: `<div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" />`
* **Container**: `<div className="fixed inset-y-0 right-0 z-50 w-full max-w-3xl bg-white dark:bg-slate-900 shadow-2xl flex flex-col">`
* **Header Bar**: A 6-px-padding border-bottom box with a linear gradient badge `#f59e0b` to `#dc2626` (amber to red) on step counters or active status markers.
* **Footer Bar**: `<div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 shrink-0">`

#### B. Universal Modal Styling (Copied from `FileSelectorModal.jsx`):
* **Backdrop**: `<div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">`
* **Container**: `<div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-4xl w-full h-[600px] shadow-2xl flex flex-col overflow-hidden animate-scale-up">`
* **Footer**: `<div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50 shrink-0">`

### Rule 2.4: Detailed Audit Trails & Track Records
Every mutating event across the system must be logged with rich telemetry.
* **Track Records Table**: Record the actor (`user_id`), targeted resource (`model_type`, `model_id`), exact operation (`action` e.g., 'created', 'updated', 'deleted_file', 'modified_status'), and descriptive payload (what was changed, old vs. new values).
* **Scope**: This applies universally to project modifications, task progression, files uploaded, folders created, and especially **file deletions** (who deleted what file, when, and from where).

### Rule 2.5: Consistent UI Elements (MUI Cards & Dividers)
To keep the dashboard consistent and visual structure clean:
* Always use **Material UI (MUI)** cards (`Card`, `CardContent`, `CardHeader`) for grid blocks, stats panels, information summary boxes, and detail widgets.
* Always use **MUI Divider** components (`Divider`) for horizontal/vertical section boundaries.
* Style MUI components with tailored Tailwind classes using the `sx` or `className` properties to integrate seamlessly with the modern glassmorphic look.

### Rule 2.6: Universal Font & Typography Styling
All typography must strictly match the `Projects` and `ProjectWizard` interfaces:
* **Primary Text/Headings**: Use `text-slate-900 dark:text-slate-100` with `font-bold` or `font-semibold`.
* **Secondary Text/Subtitles**: Use `text-slate-500` or `text-slate-400`.
* **Sizes**: Standardize on `text-sm` for normal text, `text-xs` for metadata/labels, and `text-base` to `text-2xl` for headings.
* **Buttons/Actionables**: Always use `font-medium` or `font-semibold`.

### Rule 2.7: Universal Spacing & Padding
All layouts must use the identical spacing conventions established in `Projects.jsx`:
* **Card/Modal Content Padding**: Use `p-5` or `px-6 py-4` for internal content padding.
* **Button Padding**: Standardize buttons to `px-4 py-2.5` (large) or `px-3.5 py-2` (medium).
* **Flex Gaps**: Use `gap-2`, `gap-3`, or `gap-4` exclusively for flexbox spacing (never use arbitrary pixel gaps).
* **Section Margins**: Use `mb-4` or `mb-6` to separate vertical block sections.

### Rule 2.8: Universal Button Styles (Primary & Secondary)
Always use these exact structures for buttons:
* **Primary Button**: `className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:shadow-lg hover:-translate-y-0.5"` combined with `style={{ background: 'linear-gradient(135deg, #f59e0b, #dc2626)', boxShadow: '0 4px 14px rgba(245,158,11,0.3)' }}`.
* **Secondary Button**: `className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm hover:shadow"`. Use this for cancels, back buttons, and less prominent actions.

### Rule 2.9: Universal Global Alerts (GlobalToast)
Never use native `alert()` for success or error states. Use the custom `GlobalToast` component by dispatching the window event:
```javascript
window.dispatchEvent(new CustomEvent('jcms-toast', { 
    detail: { type: 'success' | 'error' | 'warning', title: 'Action Status', message: 'Details here' } 
}));
```

### Rule 2.10: System-Wide Dark Mode Handling
We enforce a bulletproof, flash-free dark mode handling standard across the entire application:
* **Tailwind Class-Based Activation**: Always control dark mode by toggle-applying the `.dark` class to the root `document.documentElement` element.
* **Flash Prevention (Critical)**: To avoid a blinding Flash of Incorrect Theme (FOIT) on page load, a lightweight blocking script must run in the `<head>` of the main template (`app.blade.php`) *before* CSS and JS stylesheets render:
  ```html
  <script>
      if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
          document.documentElement.classList.add('dark');
      } else {
          document.documentElement.classList.remove('dark');
      }
  </script>
  ```
* **Unified Theme Storage**: Save the user's active theme state in `localStorage.theme` using three mutually exclusive values: `'light'`, `'dark'`, or `'system'`. If set to `'system'`, immediately synchronize with the OS preference and listen to changes dynamically via the `(prefers-color-scheme: dark)` media query.
* **Slate/Zinc Dark Color Palette**:
  * Page Background: `dark:bg-slate-950`
  * Panels, Cards, Drawer & Sidebar: `dark:bg-slate-900`
  * Borders, Dividers, & Lines: `dark:border-slate-800`
  * High-Contrast Text (Headings/Labels): `dark:text-slate-100` or `dark:text-slate-200`
  * Muted/Metadata Text (Subtitles/Captions): `dark:text-slate-400` or `dark:text-slate-500`
* **Tailwind & MUI Cohesion**: When custom-styling MUI components using `sx` properties, always utilize class-conditional styles or dynamic CSS variables to ensure that MUI cards, dividers, and dialog content adapt seamlessly and instantly to the slate color scheme when dark mode is enabled.

---

## 3. General Development & Polish Workflow

1. **Stop & Plan**: Write a detailed markdown implementation plan listing target files and design tokens before coding.
2. **Premium Design Language**: Apply sleek gradients, glassmorphism (`backdrop-blur-md bg-white/10`), dynamic scales on hover, and strict dark mode formatting (`dark:bg-slate-950`, `dark:placeholder-slate-500`).
3. **Preserve Code Quality**: Keep original documentation/comments inside edited files intact. Implement absolute null-safety on React components.
4. **Verification**: Always run lint checks or dev commands to ensure pages load instantly and correctly.
