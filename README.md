# BrewLite — Task 5, 6 và 8

Đây là bản source tích hợp để phát triển và kiểm thử luồng giỏ hàng → tạo đơn → mock thanh toán.

- `frontend/`: Next.js/React/TypeScript; giỏ hàng dùng Zustand/persist.
- `backend/`: NestJS, REST API, Prisma.
- `docker-compose.yaml`: PostgreSQL local ở `localhost:5433`.

**Hướng dẫn áp dụng source, cài dependencies, migration, seed database, test API và kiểm thử giao diện nằm trong [README-Task5-6-8.md](./README-Task5-6-8.md).**

Lưu ý: đây là bản tích hợp từ các snapshot source được cung cấp. Hãy chép code vào branch cá nhân, xem `git diff` và không ghi đè thư mục `.git` của repository đang làm. Backend dùng user seed cho local vì Task 7/JWT chưa nằm trong snapshot; mock payment không thu tiền thật.
