# Limdaqui — Navigation Structure

The top navigation bar ([Header.tsx](frontend/components/Header.tsx)) is sticky,
responsive (full bar ≥ `lg`, hamburger menu below), and role-aware. Active pages
are highlighted in brand red with `aria-current="page"`; every icon control has
a `title` tooltip and `aria-label`; menus close on Escape and outside-click.

## Navigation items

| Item | Icon | Route | Visible to | Purpose |
| ---- | ---- | ----- | ---------- | ------- |
| Home | House | `/` | Everyone | Marketing landing page |
| Shop | Package | `/products` | Everyone | Product catalog with add-to-cart |
| Cart | Shopping cart + count badge | `/cart` | Everyone | Review cart, adjust quantities, checkout |
| My Profile | Person | `/profile` | Logged-in users | Account details, password, order history |
| Admin | Building | `/admin` | Admins only | Back-office dashboard |
| Manage | Globe (dropdown) | — | Admins only | Submenu: Products, Categories, Quotations |
| User block | — | — | Logged-in users | Shows full name + email |
| Logout | Exit arrow | — | Logged-in users | Ends the session (clears the stored token) |
| Login / Register | — | `/login`, `/register` | Guests | Replace the user block when logged out |

### Manage submenu (admin only)

| Entry | Route | Purpose |
| ----- | ----- | ------- |
| Products | `/admin/products` | Product CRUD (slide-over editor, stock, pricing) |
| Categories | `/admin/categories` | List + create categories |
| Quotations | `/admin/quotes` | Quotation request inbox |

## Pages and database interactions

| Page | Backend endpoints | Tables touched |
| ---- | ----------------- | -------------- |
| `/` | — (static) | — |
| `/products` | `GET /api/products` (ISR, 60s) | `products`, `categories` |
| `/cart` | `GET /api/products/:id` per line, `POST /api/orders` on checkout | `products`, `orders`, `order_items` |
| `/profile` | `GET/PATCH /api/auth/me`, `POST /api/auth/password`, `GET /api/orders` | `users`, `orders`, `order_items`, `products` |
| `/login`, `/register` | `POST /api/auth/login`, `POST /api/auth/register` (rate-limited) | `users` |
| `/quote` | `POST /api/quotes` (rate-limited) | `quotes` |
| `/admin` | `GET /api/products`, `GET /api/categories`, `GET /api/quotes` | all |
| `/admin/products` | products CRUD (admin); `POST /api/images` for uploads, served via `GET /api/images/:id` | `products`, `product_images` |
| `/admin/categories` | `GET/POST /api/categories` (POST admin) | `categories` |
| `/admin/quotes` | `GET /api/quotes` (admin, paginated) | `quotes` |

## Cart & orders workflow

1. **Add to cart** (Shop page) — cart lines are stored client-side in
   `localStorage` (`limdaqui_cart`) via [cart.tsx](frontend/lib/cart.tsx);
   the header badge shows the total unit count.
2. **Cart page** — fetches live product data per line (deleted products are
   dropped, quantities are capped at available stock, totals are computed per
   currency). Guests see "Log in to checkout"; the cart survives login since
   it lives on the device.
3. **Checkout** — `POST /api/orders` runs in a single DB transaction:
   validates products and stock, requires a single currency per order,
   snapshots unit prices into `order_items`, computes the total server-side,
   and decrements stock with a conditional update so concurrent orders cannot
   oversell. Insufficient stock → `409`.
4. **Order history** (Profile page) — `GET /api/orders` returns the user's own
   orders with line items; statuses: pending → paid → shipped → delivered /
   cancelled (status transitions are data-model-ready; no admin UI yet).

## Access control

- JWT Bearer auth; `requireAuth` / `requireAdmin` middleware on the backend —
  the UI hides links by role, but every privileged endpoint re-checks the role
  server-side.
- Client-side gates: `/profile` and checkout require a session; `/admin/*`
  requires the `admin` role (non-admins get a "No access" panel).
- Login/registration and the public quote form are rate-limited.
