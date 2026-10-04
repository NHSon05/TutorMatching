# TutorMatching

TutorMatching gồm frontend Next.js, backend ASP.NET Core và PostgreSQL. Môi trường local dùng Docker
Compose để mỗi thành viên có thể tạo lại PostgreSQL và SMTP sandbox theo cùng một cấu hình.

## Yêu cầu local

- .NET SDK 10
- Node.js và npm
- Docker Desktop hoặc Docker Engine có Docker Compose v2

Không cần cài PostgreSQL trực tiếp trên máy. Mailpit được dùng làm SMTP sandbox: email phát triển
không được gửi ra Internet và có thể xem tại `http://localhost:8025`.

## Khởi động PostgreSQL và Mailpit

1. Tạo cấu hình backend local từ file mẫu:

   ```bash
   cp backend/.env.example backend/.env
   ```

2. Đổi `POSTGRES_PASSWORD` và phần `Password=...` trong
   `ConnectionStrings__DefaultConnection` sang cùng một mật khẩu local.
3. Khởi động dịch vụ và kiểm tra trạng thái:

   ```bash
   docker compose --env-file backend/.env -f backend/compose.yaml up -d --wait
   docker compose --env-file backend/.env -f backend/compose.yaml ps
   ```

4. Dừng container mà vẫn giữ dữ liệu:

   ```bash
   docker compose --env-file backend/.env -f backend/compose.yaml down
   ```

Named volume `tutormatching_postgres-data` giữ dữ liệu qua các lần tạo lại container. Lệnh
`docker compose --env-file backend/.env -f backend/compose.yaml down --volumes` sẽ xóa volume và
toàn bộ dữ liệu local, vì vậy chỉ dùng khi chủ ý reset database.

Backend đọc cấu hình phân cấp từ biến môi trường với dấu `__`. ASP.NET Core không tự đọc file
`.env`, vì vậy trên macOS/Linux cần nạp `backend/.env` vào terminal hiện tại trước khi chạy:

```bash
set -a
source backend/.env
set +a
dotnet run --project backend/src/TutorMatching.Api
```

Khởi động frontend ở terminal khác:

```bash
cp frontend/.env.example frontend/.env.local
npm --prefix frontend run dev
```

Backend và frontend có env riêng: `backend/.env` chứa database, cookie và SMTP; còn
`frontend/.env.local` chỉ chứa cấu hình public cần cho Next.js. Các file env thật bị Git bỏ qua.
Không commit mật khẩu, connection string thật hoặc khóa dịch vụ. `appsettings.Development.json` chỉ
chứa giá trị mẫu để mô tả cấu trúc cấu hình.

## Dùng trên máy tính khác

### Khuyến nghị: mỗi máy có database local riêng

Trên máy mới, clone repository, copy `backend/.env.example` thành `backend/.env`, đặt mật khẩu local
rồi chạy `docker compose --env-file backend/.env -f backend/compose.yaml up -d --wait`. Schema phải
được tái tạo bằng EF Core migrations và dữ liệu demo bằng seed (được bổ sung ở T009), thay vì sao
chép thư mục volume Docker. Đây là luồng dễ tái lập và ít lỗi khác hệ điều hành nhất.

Nếu cần chuyển một snapshot dữ liệu phát triển, xuất file backup trên máy nguồn:

```bash
docker compose --env-file backend/.env -f backend/compose.yaml exec -T postgres pg_dump \
  -U tutormatching -d tutormatching -Fc > tutormatching-dev.dump
```

Chép file `.dump` qua kênh an toàn, khởi động database trên máy đích, rồi khôi phục. Lệnh sau thay
thế dữ liệu hiện có trong database đích:

```bash
docker compose --env-file backend/.env -f backend/compose.yaml exec -T postgres pg_restore \
  -U tutormatching -d tutormatching --clean --if-exists < tutormatching-dev.dump
```

File backup có thể chứa dữ liệu riêng tư và đã được `.gitignore` loại trừ; không commit file này.

### Nhiều máy kết nối vào một container

Mặc định PostgreSQL chỉ bind vào `127.0.0.1`, nên máy khác không truy cập được. Nếu thực sự cần dùng
chung trong một mạng tin cậy hoặc VPN:

1. Trên máy host, đặt `POSTGRES_BIND_ADDRESS` trong `backend/.env` thành địa chỉ IP riêng của host,
   ví dụ `192.168.1.20`, rồi chạy lại
   `docker compose --env-file backend/.env -f backend/compose.yaml up -d`.
2. Chỉ cho phép TCP 5432 từ IP của máy cộng tác trong firewall.
3. Máy cộng tác dùng `Host=192.168.1.20;Port=5432;...` và mật khẩu được chuyển qua kênh bảo mật.

Không bind database vào `0.0.0.0` rồi mở port 5432 ra Internet. Compose local này không cấu hình
TLS, HA hay backup tự động. Nếu cần database dùng chung lâu dài, hãy dùng VPN hoặc dịch vụ PostgreSQL
được quản lý.

## Có thể dùng Supabase không?

Có. Supabase cung cấp PostgreSQL đầy đủ nên backend có thể tiếp tục dùng Npgsql và EF Core. Trong
kiến trúc hiện tại, chỉ dùng Supabase làm nơi lưu PostgreSQL; không trộn Supabase Auth với ASP.NET
Core Identity của Sprint 1.

Đặt connection string lấy từ nút **Connect** của Supabase vào secret store hoặc biến môi trường:

```text
ConnectionStrings__DefaultConnection=Host=<host>;Port=5432;Database=postgres;Username=<user>;Password=<secret>;SSL Mode=Require
```

- Backend chạy lâu dài và có IPv6: ưu tiên direct connection.
- Backend chỉ có IPv4: dùng shared pooler ở session mode.
- EF migrations, `pg_dump` và restore: dùng direct connection.
- Không đặt database password hoặc connection string trong biến `NEXT_PUBLIC_*` hay mã frontend.

## Khuyến nghị môi trường

Luồng phù hợp nhất cho dự án này là:

- **Phát triển cá nhân và integration test:** PostgreSQL qua Docker Compose trên từng máy.
- **Database dùng chung cho nhóm/staging:** một project Supabase riêng cho môi trường development hoặc
  staging.
- **Production:** project/database tách biệt, secrets do nền tảng triển khai quản lý, có backup và
  chính sách truy cập phù hợp.
- **Nguồn sự thật của schema:** EF Core migrations trong Git; seed chỉ chứa dữ liệu giả, không chứa
  dữ liệu người dùng thật.

Cách kết hợp này giữ local nhanh và tái lập được, đồng thời tránh biến laptop của một thành viên
thành database server chung của cả nhóm.

## Kiểm tra dự án

```bash
dotnet build backend/TutorMatching.slnx
dotnet test backend/TutorMatching.slnx
npm --prefix frontend run lint
npm --prefix frontend run build
npm --prefix frontend run test
npm --prefix frontend run test:e2e
```
