## 2026-10-21 - UI Blue Tick + thanh toan + E2E Phase 5
- `src/components/ui/verified-badge.tsx:17` — them huy hieu rosette xanh + tooltip han dung | Vi sao: hien thi tick ngay canh username theo `verified`
- `src/app/verified/page.tsx:95` — trang mua/gia han, chon MoMo/VNPAY, lich su don | Vi sao: noi luong mua Blue Tick voi payment-service
- `src/app/payment/result/page.tsx:370` — trang ket qua, poll trang thai that, refresh user | Vi sao: return URL khong doi DB nen FE phai poll
- `src/app/profile/page.tsx:214`, `src/app/u/[username]/page.tsx:147`, `src/app/explore/page.tsx:246` — gan badge canh username | Vi sao: hien thi tick o ho so va tim kiem
- `src/app/(home)/_components/pages.tsx:166`, `src/app/p/[id]/page.tsx:244`, `src/app/reels/page.tsx:190` — badge o feed/binh luan/reels | Vi sao: dong bo tick tren moi noi co username
- `src/app/(home)/_components/sideright.tsx:30`, `more-menu.tsx:46`, `src/components/ui/create-post.tsx:198` — badge + link /verified | Vi sao: tang kha nang tim thay trang mua tick
- `src/proxy.ts:11` — cho public /payment/result va giu query khi redirect login | Vi sao: provider redirect ve khi cookie het han
- `src/lib/api.ts:86` — giu query khi refresh that bai | Vi sao: khong mat orderId khi phien het han

## 2026-10-21 - Data layer mua tich xanh (Blue Tick)
- `src/types/payment.type.ts:1` — them type don hang/trang thai thanh toan | Vi sao: FE can contract API payment-service
- `src/services/payment.service.ts:9` — them create MoMo/VNPay, getOrder, listMyOrders | Vi sao: goi dung endpoint da co o BE
- `src/lib/verified.ts:6` — them catalog BLUE_TICK 199k/30 ngay | Vi sao: BE chua co endpoint catalog de FE doc gia
- `src/types/user.type.ts:7` — them verified/verifiedUntil | Vi sao: profile BE moi tra trang thai tick
- `src/types/auth.type.ts:13` — them verified/verifiedUntil | Vi sao: auth context can hien thi badge tu /auth/me
