# BrewLite

BrewLite là đồ án web đặt đồ uống, sử dụng Next.js/React cho giao diện, NestJS cho API, PostgreSQL làm cơ sở dữ liệu và Prisma làm ORM.

## Công nghệ và cấu trúc

- `frontend/`: Next.js, React, TypeScript, Tailwind CSS.
- `backend/`: NestJS, REST API và Prisma.
- `backend/prisma/migrations/`: migration tạo/cập nhật schema.
- `backend/prisma/seed/seed-data.sql`: dữ liệu mẫu lịch sử.
- `backend/prisma/seed/menu-demo.sql`: sản phẩm mẫu cho các danh mục menu.
- `docker-compose.yaml`: PostgreSQL chạy bằng Docker Compose (giữ nguyên tên file của branch `mintriu`).

## 1. Chuẩn bị môi trường

Cần cài Node.js (Node.js 22 LTS trở lên phù hợp với bộ công cụ hiện tại), npm, Git và Docker Desktop/WSL 2 trên Windows.

Từ thư mục gốc dự án, mở PowerShell và tạo file môi trường:

```powershell
Copy-Item .env.example .env
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env.local
```

Các file `.env` chỉ dùng trên máy cá nhân, không commit lên Git. Mật khẩu `CONGNGHEPHANMEM12345` được giữ để tương thích với cấu hình/volume Docker local hiện có; chỉ dùng cho môi trường phát triển, không dùng trên production. Nếu đổi user/password/port PostgreSQL trong root `.env`, hãy cập nhật `DATABASE_URL` và `DIRECT_URL` trong `backend/.env` cho khớp.

## 2. Khởi động PostgreSQL

Ở thư mục gốc:

```powershell
docker compose up -d db
docker compose ps
```

Mặc định PostgreSQL được publish tại `localhost:5433` trên máy host và lắng nghe cổng `5432` bên trong container.

## 3. Tạo schema và Prisma Client

```powershell
cd backend
npm ci
npx prisma generate
npx prisma migrate deploy
```

Migration đầu tiên tạo các bảng nền tảng; migration tiếp theo thêm cột `categories` mà API menu sử dụng. Không dùng `prisma db push` thay cho migration trong quy trình nhóm vì nó có thể làm schema local lệch khỏi lịch sử migration trên Git.

### Nạp dữ liệu demo

Sau khi chạy migration, quay về thư mục gốc để chạy lệnh Docker Compose:

```powershell
cd ..
```

Trên database rỗng, nạp dữ liệu lịch sử/trà mẫu trước (chỉ một lần):

```powershell
docker cp backend/prisma/seed/seed-data.sql brewlite-postgres:/tmp/seed-data.sql
docker compose exec db psql -U brewlite -d brewlite -f /tmp/seed-data.sql
```

Sau đó nạp menu demo cho các tab cà phê, đồ uống lạnh, trà và bánh. Script dùng ID cố định và `ON CONFLICT DO NOTHING`, nên có thể chạy lại an toàn:

```powershell
docker cp backend/prisma/seed/menu-demo.sql brewlite-postgres:/tmp/menu-demo.sql
docker compose exec db psql -U brewlite -d brewlite -f /tmp/menu-demo.sql
```

Nếu database đã có dữ liệu từ lần chạy trước, **không chạy lại** `seed-data.sql`; chỉ chạy migration còn thiếu và `menu-demo.sql`.

## 4. Chạy backend và frontend

Chạy backend trong terminal thứ nhất:

```powershell
cd backend
npm ci
npm run start:dev
```

API chạy tại `http://localhost:3001`; tài liệu Swagger ở `http://localhost:3001/swagger`.

Chạy frontend trong terminal thứ hai:

```powershell
cd frontend
npm ci
npm run dev
```

Mở `http://localhost:3000`. Frontend gọi backend theo `NEXT_PUBLIC_API_URL` trong `frontend/.env.local`.

## 5. Kiểm tra trước khi push

```powershell
# frontend
cd frontend
npm run lint
npm run build

# backend (mở terminal khác)
cd backend
npm run lint
npm test -- --runInBand
npm run build
```

## Lưu ý về dữ liệu demo và phạm vi

`seed-data.sql` giữ dữ liệu trà và lịch sử đơn hàng đã có; `menu-demo.sql` bổ sung món mẫu cho các tab menu và cấu hình size/topping demo. Ảnh món demo dùng ảnh local `frontend/public/images/espresso.jpg`; hãy thay bằng asset đúng khi có ảnh thật.

Phần merge này đưa danh sách menu và trang chi tiết vào cùng hợp đồng API. Giỏ hàng hiện được lưu ở `localStorage`; luồng tạo đơn hàng/thanh toán end-to-end vẫn cần tích hợp và kiểm thử riêng trước khi tuyên bố hoàn thiện toàn bộ nghiệp vụ.
## 6. Làm việc trên branch cá nhân (không sửa trực tiếp `main`)

**Cách khuyên dùng:** giữ nguyên lịch sử commit của các thành viên bằng cách merge `tlong` vào branch `mintriu`, rồi áp dụng patch chỉ chứa các chỉnh sửa tích hợp. Patch được kiểm tra trên snapshot `mintriu` `bff4023` và `tlong` `582d293`. Đặt file `BrewLite-PostMerge-Fixes.patch` ở thư mục gốc dự án.

```powershell
git switch mintriu
git status --short
git rev-parse --short HEAD
# HEAD phải là bff4023 và working tree phải sạch.

git fetch origin refs/heads/tlong:refs/remotes/origin/tlong
git rev-parse --short origin/tlong
# Với snapshot đã kiểm tra, kết quả phải là 582d293. Nếu khác, dừng và kiểm tra lại patch.

git merge --no-ff origin/tlong -m "merge: integrate tlong menu and product detail"

git apply --check --ignore-space-change --ignore-whitespace .\BrewLite-PostMerge-Fixes.patch
git apply --ignore-space-change --ignore-whitespace .\BrewLite-PostMerge-Fixes.patch

git diff --check
git diff
```

Chạy các lệnh lint/build/test ở mục trước. Nếu đạt, commit phần chỉnh sửa và push lên branch cá nhân để leader review qua PR:

```powershell
git add -A
git commit -m "fix: align menu with product API and database schema"
git push origin mintriu
```

**Phương án thay thế:** nếu không muốn merge `origin/tlong` trước, có thể áp dụng `BrewLite-Triu-Integrated.patch` trực tiếp lên commit `bff4023`. Patch đầy đủ này chứa cả thay đổi code từ `tlong` và phần chỉnh sửa tích hợp, nhưng không giữ riêng lịch sử commit của nhánh `tlong`. Chọn **một** trong hai phương án, không áp dụng cả hai.

Nếu `HEAD` không ở commit nền yêu cầu, branch remote đã đổi hoặc `git apply --check` thất bại, đừng dùng `reset --hard`, đừng force-push và đừng ép patch. Đồng bộ lại branch và kiểm tra xung đột trước khi tiếp tục.
