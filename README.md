# BrewLite

**BrewLite** là ứng dụng đặt cà phê không dùng tiền mặt, giúp khách hàng xem menu, tùy chọn đồ uống, tạo đơn và thanh toán qua cổng thanh toán giả lập.

## 1. Công nghệ

- **Frontend:** Next.js, React, TypeScript, Tailwind CSS.
- **Backend:** NestJS, TypeScript, REST API.
- **Database:** PostgreSQL.
- **ORM:** Prisma.
- **Authentication:** JWT.
- **Cart:** Zustand.
- **Validation:** class-validator.
- **DevOps:** Docker Compose, Git.

## 2. Cấu trúc repository

```text
brewlite/
├── frontend/
├── backend/
├── .env.example
├── .gitignore
└── README.md
```

## 3. Yêu cầu môi trường

- Node.js 24 LTS và npm.
- Git.
- Docker Desktop với WSL 2 trên Windows.

## 4. Chạy frontend

```powershell
cd frontend
npm install
npm run dev
```

Mở http://localhost:3000.

## 5. Chạy backend

Mở terminal khác:

```powershell
cd backend
npm install
npm run start:dev
```

Mở http://localhost:3001 để kiểm tra API chào.

## 6. Cấu hình môi trường

Tham khảo `.env.example` ở thư mục gốc, `backend/.env.example` và `frontend/.env.example`.

Không commit file `.env` chứa cấu hình riêng hoặc bí mật thật lên Git.

## 7. Lộ trình Scrum

- Sprint 1: Task 1–4, nền tảng và menu.
- Sprint 2: Task 5–7, giỏ hàng, đơn hàng và đăng nhập.
- Sprint 3: Task 8–10, thanh toán, bàn giao và nghiệp vụ backend nâng cao.

## 8. Trạng thái phát triển

Task 1: Khởi tạo cấu trúc dự án — đang thực hiện.

Các task chỉ được đánh dấu hoàn thành sau khi đáp ứng tiêu chí chấp nhận và Definition of Done của đồ án.
