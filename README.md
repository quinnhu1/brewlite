# BrewLite · Craft & Grind

Next.js 16.4.2 + NestJS 12 + PostgreSQL 16 + Prisma 6.19.3. Bản cập nhật theo diagram database và PDF giao diện SWE_CFM: sửa catalog, giao diện khách hàng, admin và VNPay Sandbox. Giữ nguyên schema và cả 4 migrations có sẵn trong ZIP được gửi.

Đọc [báo cáo dữ liệu/giao diện](docs/AUDIT.md), [đối chiếu 10 task](docs/COMPARISON-AND-TASKS.md), [VNPay](docs/VNPAY.md), [kiểm chứng](docs/VALIDATION.md). Mặc định gateway là **VNPay Sandbox**. Nhóm chưa đăng ký merchant nên cần hoàn tất cấu hình trước khi thanh toán qua VNPay; ứng dụng không tự nhận thành công khi thiếu cấu hình.

## 1. Chuẩn bị trên Windows

Giải nén vào một thư mục mới, ví dụ `D:\Data\brewlite-fixed`. ZIP không chứa `.env`, `.git`, `node_modules`, `.next`, `dist` hoặc volume database. Nếu cập nhật GitHub của nhóm, tạo branch, đối chiếu thay đổi rồi chép source; giữ các commit và cấu hình riêng của nhóm.

Cần Node.js 24 và Docker Desktop. Mở PowerShell tại thư mục có `docker-compose.yaml`:

```powershell
cd D:\Data\brewlite-fixed
if (!(Test-Path .env)) { Copy-Item .env.example .env }
if (!(Test-Path backend/.env)) { Copy-Item backend/.env.example backend/.env }
if (!(Test-Path frontend/.env.local)) { Copy-Item frontend/.env.example frontend/.env.local }
docker ps --format "table {{.Names}}\t{{.Ports}}"
```

Giữ mật khẩu PostgreSQL đang dùng. `backend/.env` cần `DATABASE_URL` và `DIRECT_URL` trỏ đúng DB. Ví dụ khi DB tên `brewlite`, user `brewlite`, cổng Windows 5433:

```dotenv
DATABASE_URL=postgresql://brewlite:CONGNGHEPHANMEM12345@localhost:5433/brewlite?schema=public
DIRECT_URL=postgresql://brewlite:CONGNGHEPHANMEM12345@localhost:5433/brewlite?schema=public
JWT_SECRET=replace_with_a_long_random_secret
FRONTEND_URL=http://localhost:3000
PAYMENT_PROVIDER=vnpay
PAYMENT_MOCK_ALLOW_OVERRIDE=false
PAYMENT_ALLOW_MOCK_IN_PRODUCTION=false
VNPAY_TMN_CODE=
VNPAY_HASH_SECRET=
VNPAY_RETURN_URL=http://localhost:3001/payments/vnpay/return
```

Thay password/JWT ví dụ bằng cấu hình của bạn. Thay `POSTGRES_PASSWORD` trong `.env` không tự đổi mật khẩu một volume đã khởi tạo. Nếu tên DB thực tế là `brewlite_try`, phải đổi cả URL và `-DbName` ở lệnh reset sang tên đó. Frontend dùng `NEXT_PUBLIC_API_URL=http://localhost:3001`.

Nếu container `brewlite-postgres` cũ đang chạy, dùng container đó. Chỉ chạy `docker compose up -d db` khi chưa có DB/container. Đổi thư mục có thể đổi Compose project và tạo volume mới; không tạo container trùng tên hoặc vô tình mở DB khác.

## 2. Thay toàn bộ data cũ bằng data mới

**Thao tác này xóa tất cả tài khoản cũ, đơn, giao dịch, điểm và catalog trong DB được chọn**, rồi tạo catalog mới cùng hai tài khoản demo. Schema, `_prisma_migrations` và volume được giữ nguyên. Script sao lưu trước, kiểm tra backup đọc được, rồi mới reset trong transaction; lỗi SQL sẽ rollback.

Dừng hai terminal frontend/backend bằng `Ctrl+C`. Tại thư mục gốc chạy:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\Reset-AndSeed.ps1 -ConfirmReset RESET_ALL_BREWLITE
```

Thông số mặc định: container `brewlite-postgres`, user `brewlite`, database `brewlite`. Nếu khác:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\Reset-AndSeed.ps1 -ConfirmReset RESET_ALL_BREWLITE -Container brewlite-postgres -DbUser brewlite -DbName brewlite_try
```

Backup nằm trong `backups/<database>-before-reset-<timestamp>.dump`. Đây là custom dump, dùng `pg_restore` để phục hồi; không mở bằng `psql`. Không cần `docker compose down -v`, DROP DATABASE hay DROP TABLE.

Script dùng `backend/prisma/reset-and-seed.sql`. File SQL gửi riêng có cùng nội dung. Nó chỉ chạy trên schema BrewLite đã migrate, không phải file tự tạo database/bảng. Với database mới/rỗng, xem bước 3 và dùng seed thông thường.

Nếu muốn nhập file SQL riêng bằng tay, sao lưu trước:

```powershell
docker exec brewlite-postgres pg_dump -U brewlite -d brewlite -Fc -f /tmp/brewlite-before-reset.dump
docker exec brewlite-postgres pg_restore -l /tmp/brewlite-before-reset.dump
docker cp brewlite-postgres:/tmp/brewlite-before-reset.dump .\brewlite-before-reset.dump
```

Chỉ tiếp tục khi cả ba lệnh thành công và file backup đã có trên Windows. Sau đó:

```powershell
docker cp .\backend\prisma\reset-and-seed.sql brewlite-postgres:/tmp/brewlite-reset-and-seed.sql
docker exec brewlite-postgres psql -v ON_ERROR_STOP=1 -U brewlite -d brewlite -c "SET brewlite.confirm_reset='RESET_ALL_BREWLITE';" -f /tmp/brewlite-reset-and-seed.sql
```

Chạy trực tiếp SQL thiếu `SET ...` sẽ bị chặn trước TRUNCATE. Nếu có bảng/constraint riêng của nhóm, kiểm tra khác biệt trước; file không dùng CASCADE để xóa lan sang bảng lạ.

Sau reset: **21 món, 57 size, 13 topping, 47 liên kết topping, 2 khuyến mãi, 2 tài khoản; 0 đơn/0 payment/0 điểm**. 18 đồ uống có S/M/L với phụ thu 0/5.000/10.000đ; 3 bánh dùng `S` trong DB và hiển thị “Standard portion”, không cần topping. Tồn kho demo mỗi món 50. Hai tên trà lài và hai bản Trà sữa truyền thống được gộp; Trà sữa matcha vẫn là món riêng.

## 3. Cài và chạy ứng dụng

Terminal backend:

```powershell
cd D:\Data\brewlite-fixed\backend
npm ci
npx prisma migrate deploy
npm run db:seed
npm run start:dev
```

`db:seed` dùng `prisma/seed/catalog.sql`, không xóa đơn/user và không đặt lại tồn kho/version. Trên DB cũ nó có thể giữ món ngoài catalog; muốn thay toàn bộ phải dùng bước 2. Không chạy lại seed mỗi lần vừa sửa giá/món qua admin vì seed cập nhật các thuộc tính catalog mẫu.

Nếu `npm ci` báo `getaddrinfo ENOTFOUND binaries.prisma.sh`, đó là lỗi phân giải DNS/tải Prisma engine, chưa phải lỗi SQL. Kiểm tra `Resolve-DnsName binaries.prisma.sh`, đổi mạng/DNS hoặc xử lý VPN/proxy đang dùng, rồi chạy lại `npm ci`. `npm ci --ignore-scripts` chưa tạo Prisma Client; khi mạng hoạt động cần chạy `npx prisma generate`. Đừng bỏ bước generate rồi cho rằng backend đã sẵn sàng.

Terminal frontend:

```powershell
cd D:\Data\brewlite-fixed\frontend
npm ci
npm run dev
```

- Web: <http://localhost:3000>
- Menu: <http://localhost:3000/menu>
- Admin: <http://localhost:3000/admin>
- API/Swagger: <http://localhost:3001/swagger>

Sau khi đổi catalog, xóa giỏ cũ trong trình duyệt trước khi đặt món; localStorage không nằm trong PostgreSQL. Có thể mở DevTools → Console trên `localhost:3000` và chạy:

```javascript
localStorage.removeItem('brewlite-cart-v3'); location.reload();
```

## 4. Tài khoản sau reset/seed trên DB mới

| Vai trò | Email đăng nhập | Số điện thoại | Mật khẩu demo |
| --- | --- | --- | --- |
| Admin | admin@brewlite.local | 0900000000 | BrewLite@2026! |
| Customer | demo@brewlite.local | 0900000001 | BrewLite@2026! |

Mật khẩu trong SQL là bcrypt hash. Admin đăng nhập sẽ vào `/admin`; customer thường không được mở API admin dù gõ URL thủ công. Đổi mật khẩu ở Account trước khi công khai hệ thống.

Admin có Products (thêm/sửa, tìm/lọc, giá, kho, trạng thái bán, size, topping), Order Tracking và Order History. Ngừng bán bằng `Active`, giữ lịch sử hóa đơn. Khi kho/version vừa thay đổi bởi đơn khác, thao tác lưu trả 409 và cần tải lại để không ghi đè tồn kho.

Đơn chỉ chuyển PAID → PREPARING → READY → COMPLETED. Admin không có nút tự đánh dấu giao dịch VNPay thành công. Chi tiết và lịch sử lấy dữ liệu thực của tất cả khách.

## 5. VNPay Sandbox

Đọc [docs/VNPAY.md](docs/VNPAY.md) để đăng ký merchant, cấu hình IPN/ReturnUrl và thử thanh toán. Không đưa HashSecret vào frontend hoặc gửi secret trong chat. Khi chưa điền merchant, khách vẫn xem menu, giỏ và admin; bước xác nhận thanh toán báo chưa cấu hình.

Nếu chỉ cần trình diễn mock theo Task 8 trong lúc chờ đăng ký, chủ động đổi các biến dưới đây trong `backend/.env` (hoặc root `.env` khi chạy Compose), rồi khởi động lại backend:

```dotenv
PAYMENT_PROVIDER=mock
PAYMENT_MOCK_ALLOW_OVERRIDE=true
PAYMENT_ALLOW_MOCK_IN_PRODUCTION=true
```

Mock được ghi rõ là giả lập Ví/Thẻ, có thể chọn thành công/thất bại để demo; không phải giao dịch VNPay. Khi dùng VNPay, trả provider về `vnpay` và hai cờ về `false`.

## 6. Docker Compose ba dịch vụ

Chỉ dùng Compose project đang sở hữu đúng volume dữ liệu của nhóm. Tắt app local đang giữ cổng 3000/3001, tạo root `.env` và điền JWT/DB/VNPay như trên:

```powershell
docker compose --profile app up -d --build
docker compose --profile app exec backend npm run db:seed
docker compose --profile app ps
```

Có `--profile app` mới bật frontend/backend; `up -d db` chỉ chạy DB. Backend đợi DB healthy, migrate khi khởi động, frontend đợi backend healthy. Database giữa container dùng `db:5432`; Windows dùng 5433. Thay `NEXT_PUBLIC_API_URL` cần build lại frontend; biến secret chỉ thuộc backend. Cấu hình Compose/Dockerfile đã được rà soát, cần chạy xác nhận trên Docker Desktop của nhóm; môi trường kiểm thử lần này không có Docker daemon.

## 7. Kiểm thử và tài liệu nộp môn

```powershell
npm run check
```

Lệnh này chạy build/lint/unit backend và lint/build frontend. Integration cần DB RIÊNG tên kết thúc `_test`, tuyệt đối không trỏ vào DB đồ án đang dùng vì test sẽ TRUNCATE:

```powershell
docker exec brewlite-postgres createdb -U brewlite brewlite_test
cd backend
$env:DATABASE_URL = 'postgresql://brewlite:CONGNGHEPHANMEM12345@localhost:5433/brewlite_test?schema=public'
$env:DIRECT_URL = $env:DATABASE_URL
$env:TEST_DATABASE_URL = $env:DATABASE_URL
$env:JWT_SECRET = 'integration-test-only-long-secret'
$env:ORDER_EXPIRY_WORKER = 'false'
npx prisma migrate deploy
npm run db:seed
npm run test:e2e -- --runInBand
Remove-Item Env:DATABASE_URL,Env:DIRECT_URL,Env:TEST_DATABASE_URL,Env:JWT_SECRET,Env:ORDER_EXPIRY_WORKER
```

Thay password ví dụ bằng mật khẩu DB của bạn. Các kiểm thử callback ký bằng khóa nội bộ kiểm tra logic code, không thay thế lần thanh toán với merchant Sandbox đã đăng ký. Kết quả và giới hạn nằm ở `docs/VALIDATION.md`. Minh chứng Scrum/PR/review/DoD do nhóm điền thật theo `docs/SPRINT-HANDOVER.md`.
