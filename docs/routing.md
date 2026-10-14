# Routing Guide — Snapgram

> Tài liệu mô tả toàn bộ cấu trúc routing của app, cách các luồng điều hướng hoạt động, và quy tắc thêm route mới.

---

## 1. Cây thư mục `src/app/`

```
src/app/
│
├── layout.tsx                         ← Root layout — wrap toàn bộ app
│                                         Nhận slot: {modal} {children}
│                                         Inject ThemeProvider
│
├── globals.css                        ← CSS global + CSS variables dark/light mode
│
├── (home)/                            ← Route group trang chủ
│   │                                     URL vẫn là "/" (dấu ngoặc không tạo segment)
│   ├── layout.tsx                     ← Layout riêng cho (home)
│   │                                     Nhận slot: {login} {children}
│   │                                     → @login chỉ hoạt động khi đang ở trang chủ
│   │
│   ├── page.tsx                       ← URL: / — Trang chủ feed
│   │                                     Render: Sidebar + Navbar + Main + Sideright + Navbot
│   │
│   └── @login/                        ← Parallel slot "login" — scoped trong (home)
│         ├── default.tsx              ← return null — khi không intercept
│         └── (.)login/
│               └── page.tsx          ← Intercept soft nav đến /login
│                                         → Hiện Dialog modal đè lên feed
│
├── (auth)/                            ← Route group các trang xác thực
│   │                                     Không ảnh hưởng URL
│   ├── login/
│   │   └── page.tsx                  ← URL: /login — Full page (2 cột ảnh + form)
│   └── register/
│       └── page.tsx                  ← URL: /register — Full page (2 cột ảnh + form)
│
├── @modal/                            ← Parallel slot "modal" — scoped ở root
│   ├── default.tsx                   ← return null — khi không có modal
│   ├── (.p)/
│   │   └── [id]/
│   │       └── page.tsx              ← Intercept soft nav đến /p/:id → modal xem post
│   └── (.)reel/
│       └── [id]/
│           └── page.tsx              ← Intercept soft nav đến /reel/:id → modal xem reel
│
├── p/
│   └── [id]/
│       └── page.tsx                  ← URL: /p/[id] — Trang chi tiết post (full page)
│
├── reel/
│   └── [id]/
│       └── page.tsx                  ← URL: /reel/[id] — Trang chi tiết reel (full page)
│
└── reels/
    └── page.tsx                      ← URL: /reels — Danh sách reels
```

---

## 2. Bảng URL → File render

| URL | Đến từ | File render | Ghi chú |
|-----|--------|-------------|---------|
| `/` | Bất kỳ | `(home)/page.tsx` | Trang chủ feed |
| `/login` | `router.push` (soft) | `(home)/@login/(.)login/page.tsx` | Dialog modal đè lên feed |
| `/login` | `window.location.href` (hard) | `(auth)/login/page.tsx` | Full page 2 cột |
| `/register` | Bất kỳ | `(auth)/register/page.tsx` | Full page 2 cột |
| `/reels` | Bất kỳ | `reels/page.tsx` | Coming soon |
| `/p/[id]` | `router.push` (soft) | `@modal/(.p)/[id]/page.tsx` | Modal xem post nhanh |
| `/p/[id]` | `window.location.href` (hard) | `p/[id]/page.tsx` | Full page post |
| `/reel/[id]` | `router.push` (soft) | `@modal/(.)reel/[id]/page.tsx` | Modal xem reel nhanh |
| `/reel/[id]` | `window.location.href` (hard) | `reel/[id]/page.tsx` | Full page reel |

---

## 3. Bốn khái niệm đang dùng

### 3.1 Route Group — `(home)`, `(auth)`

Folder đặt tên trong dấu ngoặc `()` — **không tạo thêm segment trên URL**, chỉ dùng để tổ chức code.

```
app/
├── (home)/page.tsx      → URL: /          (không phải /(home)/)
├── (auth)/login/...     → URL: /login     (không phải /(auth)/login)
```

Lợi ích chính: mỗi group có thể có **`layout.tsx` riêng**.
- `(home)/layout.tsx` nhận `@login` slot → chỉ intercepting route khi đang ở trang chủ
- `(auth)` không có layout riêng → dùng root layout

### 3.2 Parallel Route — `@login`, `@modal`

Folder đặt tên bắt đầu bằng `@` — render như một **slot song song** bên trong layout cha.

```
(home)/layout.tsx
  nhận: { children, login }
              │         │
              │         └── @login/... render vào đây
              └── (home)/page.tsx render vào đây
```

- Mỗi slot có **trạng thái routing độc lập**
- `default.tsx` là fallback khi slot không match route nào → trả `null` = không hiện gì
- `@login` nằm trong `(home)` → chỉ active khi đang ở group `(home)`, không ảnh hưởng `(auth)`

### 3.3 Intercepting Route — `(.)login`, `(.p)`, `(.)reel`

Thay đổi cách render khi **soft navigate** đến một URL, mà không thay đổi URL thật.

| Cú pháp | Bắt route ở | Ví dụ |
|---------|------------|-------|
| `(.)segment` | Cùng cấp với folder chứa nó | `(.)login` trong `@login/` → bắt `/login` |
| `(..)segment` | Trên 1 cấp | — |
| `(...)segment` | Từ root | — |

> `@login` là slot, không tạo URL segment → Next.js coi nó ngang cấp `(home)/` → `(.)login` bên trong bắt được `/login`.

Intercepting **chỉ hoạt động với soft navigate** (`router.push`). Hard navigate (`window.location.href`) bỏ qua hoàn toàn, render file gốc.

### 3.4 Dynamic Segment — `[id]`

```
app/p/[id]/page.tsx      → /p/abc123   →  params.id = "abc123"
app/reel/[id]/page.tsx   → /reel/xyz   →  params.id = "xyz"
```

---

## 4. Tại sao `@login` nằm trong `(home)` thay vì root?

Đây là điểm mấu chốt so với thiết kế ban đầu:

```
❌ Trước — @login ở root layout
   app/
   ├── layout.tsx     ← nhận {login}  → slot active ở MỌI trang kể cả /register
   └── @login/
         └── (.)login/page.tsx  → intercept /login kể cả khi đang ở /register ❌

✅ Sau — @login scoped trong (home)
   app/
   ├── layout.tsx          ← chỉ nhận {modal} {children}, không có {login}
   └── (home)/
         ├── layout.tsx    ← nhận {login} {children}
         └── @login/
               └── (.)login/page.tsx  → chỉ intercept khi đang ở "/" ✅
```

Kết quả: Khi đang ở `/register` rồi navigate đến `/login` → **không bị intercepting** vì `@login` slot không active ở `(auth)` group → render full page đúng như kỳ vọng.

---

## 5. Luồng Auth chi tiết

### Scenario A — Chưa đăng nhập, click Heart / Comment / Bookmark

```
Đang ở trang chủ "/"
User click Heart (chưa đăng nhập)
         │
         ▼
router.push('/login')        ← soft navigate
         │
         ▼
(home)/layout.tsx đang active → @login slot active
         │
         ▼
(home)/@login/(.)login/page.tsx render   ← Dialog modal đè lên feed
         │
    Feed vẫn hiện phía sau modal
         │
    User điền form → submit → gọi API
         │
         ▼
window.location.href = '/'   ← hard navigate, reset toàn bộ JS state
         │
         ▼
Trang chủ load lại, đã đăng nhập ✅

    Hoặc: đóng modal → router.back() → về "/" không có modal ✅
```

### Scenario B — Logout

```
Click "Đăng xuất" trong MoreMenu
         │
         ▼
window.location.href = '/login'    ← hard navigate
         │
         ▼
Intercepting route KHÔNG chạy     ← chỉ chạy với soft nav
         │
         ▼
(auth)/login/page.tsx render       ← Full page 2 cột ảnh + form ✅
```

### Scenario C — Xem post nhanh

```
Đang ở trang chủ "/"
User click vào post
         │
         ▼
router.push('/p/abc123')           ← soft navigate
         │
         ▼
@modal/(.p)/[id]/page.tsx render   ← Modal xem post đè lên feed ✅
         │
    Đóng modal → router.back() → về feed ✅

    Gõ thẳng URL /p/abc123 → hard nav → p/[id]/page.tsx → full page ✅
```

---

## 6. Quy tắc navigate

| Tình huống | Dùng | Lý do |
|-----------|------|-------|
| Click link thường trong feed | `<Link>` hoặc `router.push()` | Soft nav, giữ state trang chủ |
| Chưa auth, click Heart/Comment | `router.push('/login')` | Trigger intercepting → Dialog modal |
| Logout | `window.location.href = '/login'` | Hard nav → bypass intercepting → full page |
| Login thành công | `window.location.href = '/'` | Hard nav → reset toàn bộ JS state sạch |
| Đóng modal | `router.back()` | Quay URL cũ, slot reset về `default.tsx` |

---

## 7. Cấu trúc Components

```
src/components/
│
├── auth/
│   ├── auth-layout.tsx           ← Layout 2 cột: [ảnh carousel | form]
│   ├── auth-image-carousel.tsx   ← Auto-switch auth-image-1/2.webp, 4s/slide
│   ├── login-form.tsx            ← Form: email + password (react-hook-form + zod)
│   └── register-form.tsx         ← Form: email + tên HT + username + password
│
├── ui/                           ← shadcn/ui components
│   ├── button.tsx
│   ├── input.tsx
│   ├── label.tsx
│   ├── form.tsx                  ← Wrapper react-hook-form
│   ├── dialog.tsx                ← Dùng cho login modal
│   └── dropdown-menu.tsx         ← Dùng cho MoreMenu
│
├── logo/
│   ├── SnapgramLogo.tsx          ← SVG logo text (dùng ở auth + sidebar desktop)
│   └── SnapgramThumb.tsx         ← SVG logo icon (dùng ở sidebar thu gọn)
│
├── sidebar.tsx                   ← Sidebar desktop — có MoreMenu
├── navbot.tsx                    ← Nav bottom mobile
├── navbar.tsx                    ← Navbar top mobile (search + notification)
├── more-menu.tsx                 ← Dropdown "Xem thêm" — chứa nút Đăng xuất
├── main.tsx                      ← Wrapper: Stories + Pages (feed)
├── pages.tsx                     ← Feed posts
└── sideright.tsx                 ← Panel phải: gợi ý + footer
```

---

## 8. Quy tắc thêm route mới

### Page thường
```
src/app/explore/page.tsx           → URL: /explore
src/app/[username]/page.tsx        → URL: /:username  (profile)
```

### Thêm vào nhóm auth (full page 2 cột)
```
src/app/(auth)/forgot-password/page.tsx   → URL: /forgot-password
# Import AuthLayout + tạo Form component trong src/components/auth/
```

### Thêm modal intercepting mới
```
# 1. Tạo full page
src/app/story/[id]/page.tsx

# 2. Tạo intercepting trong @modal
src/app/@modal/(.)story/[id]/page.tsx    → bắt soft nav đến /story/:id
```

### Thêm intercepting chỉ active ở trang chủ (như @login)
```
# Tạo slot mới trong (home)/
src/app/(home)/@search/default.tsx
src/app/(home)/@search/(.)search/page.tsx

# Thêm vào (home)/layout.tsx
export default function MainLayout({ children, login, search }) { ... }
```

### Convention đặt tên folder

| Mục đích | Convention | Ví dụ |
|---------|------------|-------|
| Nhóm không ảnh hưởng URL | `(tên)` | `(home)`, `(auth)` |
| Parallel slot | `@tên` | `@login`, `@modal` |
| Tham số động | `[param]` | `[id]`, `[username]` |
| Catch-all | `[...slug]` | `[...slug]` |
