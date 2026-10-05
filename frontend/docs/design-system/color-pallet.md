# Hệ Thống Bảng Màu (Color Palette Specification)

> **Dự án:** TutorMatching Platform  
> **Tài liệu tham khảo:** [Photonix UI Design System](https://www.photonix.dev)  
> **Tập tin cấu hình CSS:** [`src/app/globals.css`](file:///Users/nguyenhongson/Documents/Learning/TutorMatching/frontend/src/app/globals.css)

Tài liệu này quy định toàn bộ tiêu chuẩn, bảng mã màu, token ngữ nghĩa (semantic tokens), và nguyên tắc áp dụng màu sắc cho toàn bộ giao diện dự án **TutorMatching**.

---

## 1. Triết Lý Thiết Kế Màu Sắc (Color Philosophy)

Màu sắc trong TutorMatching được xây dựng dựa trên 3 trụ cột cốt lõi:

1. **Tin cậy & Tri thức (Trust & Knowledge):** Nền tảng học tập đòi hỏi sự an tâm, tính chuyên nghiệp và minh bạch giữa người học, phụ huynh và gia sư.
2. **Phân định vai trò rõ ràng (Role-based Identity):** Hệ thống phục vụ 3 nhóm người dùng có thẩm quyền và giao diện chuyên biệt:
   - **Học viên / Phụ huynh (Learner):** Tông xanh dương (`Brand/Blue`) năng động, khám phá.
   - **Gia sư (Tutor):** Tông vàng hổ phách (`Tutor/Amber`) tri thức, ấm áp, tin cậy.
   - **Quản trị viên (Admin):** Tông đỏ thẫm (`Admin/Crimson`) quyền uy, bảo mật và kiểm soát hệ thống.
   - **Kênh kết nối & Đàm phán (Shared):** Tông tím chàm (`Shared/Indigo`) ngoại giao, cộng tác và tin nhắn.
3. **Tiêu chuẩn công thái học & Tiếp cận (Accessibility):** Mọi cặp màu chữ và nền đều phải đáp ứng chuẩn **WCAG 2.1 Level AA** (tỉ lệ tương phản tối thiểu 4.5:1 cho body text và 3.0:1 cho tiêu đề/icon).

---

## 2. Bảng Màu Hệ Thống Chi Tiết

### 2.1. Brand / Primary Palette (Xanh Dương Chủ Đạo)

Đại diện cho thương hiệu nền tảng TutorMatching, các nút kêu gọi hành động (CTA) chính và phân hệ Học viên.

| Tên Token                | Mã HEX        | RGB             | Mục đích sử dụng                                   |
| :----------------------- | :------------ | :-------------- | :------------------------------------------------- |
| `brand-50`               | `#EFF6FF`     | `239, 246, 255` | Nền thẻ active, hover nhạt, badge nền học viên     |
| `brand-100`              | `#DBEAFE`     | `219, 234, 254` | Viền badge, highlight dòng bảng dữ liệu            |
| `brand-200`              | `#BFDBFE`     | `191, 219, 254` | Đường viền focus, thanh tiến trình nhạt            |
| `brand-300`              | `#93C5FD`     | `147, 197, 253` | Minh họa, thanh cuộn trạng thái                    |
| `brand-400`              | `#60A5FA`     | `96, 165, 250`  | Điểm nhấn giao diện phụ, icon trang trí            |
| `brand-500`              | `#3B82F6`     | `59, 130, 246`  | Màu tương tác phụ, liên kết hover                  |
| **`brand-600`** _(Main)_ | **`#2563EB`** | `37, 99, 235`   | **Màu thương hiệu chính, nút CTA, thanh tab chọn** |
| `brand-700`              | `#1D4ED8`     | `29, 78, 216`   | Trạng thái hover của nút bấm chính                 |
| `brand-800`              | `#1E40AF`     | `30, 64, 175`   | Trạng thái active/press của nút bấm                |
| `brand-900`              | `#1E3A8A`     | `30, 58, 138`   | Tiêu đề tương phản cao, badge nền tối              |
| `brand-950`              | `#172554`     | `23, 37, 84`    | Màu nền header cao cấp                             |

---

### 2.2. Bảng Màu Phân Hệ Vai Trò (Role-based Palettes)

#### A. Phân Hệ Gia Sư (Tutor - Amber / Warm Gold)

Dành riêng cho không gian làm việc của gia sư, chỉnh sửa hồ sơ dạy học, lịch dạy và huy hiệu xác thực.

| Token                    | Mã HEX        | Mục đích                                       |
| :----------------------- | :------------ | :--------------------------------------------- |
| `tutor-50`               | `#FFFBEB`     | Nền workspace gia sư, nền pill role "Gia sư"   |
| `tutor-100`              | `#FEF3C7`     | Đường viền card gia sư, highlight lịch rảnh    |
| `tutor-500`              | `#F59E0B`     | Đánh giá sao (rating star), icon huy hiệu      |
| **`tutor-600`** _(Role)_ | **`#D97706`** | **Màu nhấn chính trang Gia sư, nút lưu hồ sơ** |
| `tutor-700`              | `#B45309`     | Hover nút bấm không gian gia sư                |
| `tutor-900`              | `#78350F`     | Chữ nhấn mạnh trong dashboard gia sư           |

#### B. Phân Hệ Quản Trị Viên (Admin - Crimson / Red)

Dành cho thanh điều hướng bên (Admin Sidebar), bảng kiểm duyệt hồ sơ gia sư, khóa tài khoản và nhật ký hệ thống.

| Token                    | Mã HEX        | Mục đích                                          |
| :----------------------- | :------------ | :------------------------------------------------ |
| `admin-50`               | `#FEF2F2`     | Nền cảnh báo vi phạm, thẻ tài khoản bị khóa       |
| `admin-100`              | `#FEE2E2`     | Viền cảnh báo nghiêm trọng                        |
| **`admin-600`** _(Role)_ | **`#DC2626`** | **Logo admin, nút khóa tài khoản, từ chối hồ sơ** |
| `admin-700`              | `#B91C1C`     | Hover các nút hành động quản trị tối cao          |
| `admin-900`              | `#7F1D1D`     | Tiêu đề cảnh báo bảo mật                          |

#### C. Phân Hệ Đàm Phán & Tin Nhắn (Shared / Messaging - Indigo)

Dành cho hộp thư đàm phán hợp đồng dạy học, lịch sử yêu cầu thuê và trao đổi chung.

| Token                     | Mã HEX        | Mục đích                                             |
| :------------------------ | :------------ | :--------------------------------------------------- |
| `shared-50`               | `#EEF2FF`     | Nền bong bóng tin nhắn đối phương, thanh filter      |
| `shared-100`              | `#E0E7FF`     | Viền khung chat, badge số tin chưa đọc               |
| **`shared-600`** _(Role)_ | **`#4F46E5`** | **Bong bóng tin nhắn của bạn, nút gửi yêu cầu thuê** |
| `shared-700`              | `#4338CA`     | Hover nút gửi đàm phán                               |

---

### 2.3. Bảng Màu Ngữ Nghĩa Trạng Thái (Semantic Status)

Áp dụng thống nhất cho toàn bộ trạng thái đơn thuê, duyệt hồ sơ, tài khoản và lịch dạy:

| Trạng thái  | Nền Badge (`-bg`)        | Chữ & Icon (Chính)        | Đậm (`-dark`) | Nghiệp vụ tương ứng                                                   |
| :---------- | :----------------------- | :------------------------ | :------------ | :-------------------------------------------------------------------- |
| **Success** | `#ECFDF5` (`emerald-50`) | `#059669` (`emerald-600`) | `#047857`     | `APPROVED` (Đã duyệt), `ACTIVE` (Hoạt động), `COMPLETED` (Hoàn thành) |
| **Warning** | `#FFFBEB` (`amber-50`)   | `#D97706` (`amber-600`)   | `#B45309`     | `PENDING` (Chờ duyệt), `NEGOTIATING` (Đang thương lượng), Cần chú ý   |
| **Error**   | `#FEF2F2` (`red-50`)     | `#DC2626` (`red-600`)     | `#B91C1C`     | `REJECTED` (Từ chối), `CANCELLED` (Đã hủy), `LOCKED` (Đã khóa)        |
| **Info**    | `#F0F9FF` (`sky-50`)     | `#0284C7` (`sky-600`)     | `#0369A1`     | Thông tin hướng dẫn, nhắc nhở buổi học                                |

---

### 2.4. Bề Mặt, Nền & Phông Chữ (Surfaces & Typography Tokens)

| Token Ngữ Nghĩa             | Light Mode              | Dark Mode               | Ứng Dụng                            |
| :-------------------------- | :---------------------- | :---------------------- | :---------------------------------- |
| `--color-surface-base`      | `#FFFFFF`               | `#090D16`               | Nền toàn trang chính                |
| `--color-surface-subtle`    | `#F8FAFC` (`slate-50`)  | `#0F172A` (`slate-900`) | Nền thanh bên, nền khu vực phụ      |
| `--color-surface-card`      | `#FFFFFF`               | `#131B2E`               | Thẻ card, modal dialog, popover     |
| `--color-border-subtle`     | `#F1F5F9`               | `#1E293B`               | Viền ngăn cách nhẹ giữa các phần tử |
| `--color-border-default`    | `#E2E8F0` (`slate-200`) | `#334155` (`slate-700`) | Đường viền input, card chuẩn        |
| `--color-content-primary`   | `#0F172A` (`slate-900`) | `#F8FAFC`               | Tiêu đề chính, văn bản đọc chính    |
| `--color-content-secondary` | `#475569` (`slate-600`) | `#CBD5E1`               | Mô tả phụ, nhãn hướng dẫn           |
| `--color-content-muted`     | `#94A3B8` (`slate-400`) | `#64748B`               | Placeholder, thời gian phụ          |
| `--color-content-inverse`   | `#FFFFFF`               | `#0F172A`               | Chữ trên nền tối/ngược màu          |

---

### 2.5. Grayscale Palette (Hệ Màu Gray Chuẩn - Thay Thế Neutral)

Dự án quy định sử dụng thang màu **`gray`** (thay vì `neutral`) cho toàn bộ các phần tử trung tính, nền phụ, viền và nút bấm chính (`Button variant="primary"`):

| Token Tailwind | Mã HEX        | Mục đích sử dụng                                             |
| :------------- | :------------ | :----------------------------------------------------------- |
| `gray-50`      | `#F9FAFB`     | Nền phụ nhạt nhất, hover nhẹ                                 |
| `gray-100`     | `#F3F4F6`     | Nền hover của `Button variant="secondary"`, badge xám        |
| `gray-200`     | `#E5E7EB`     | Đường viền mặc định, active nền phụ                          |
| `gray-300`     | `#D1D5DB`     | Đường viền nhấn mạnh                                         |
| `gray-400`     | `#9CA3AF`     | Placeholder cho input, icon phụ                              |
| `gray-500`     | `#6B7280`     | Nhãn phụ, thời gian                                          |
| `gray-600`     | `#4B5563`     | Văn bản mô tả phụ                                            |
| `gray-700`     | `#374151`     | Tiêu đề phụ, viền tối                                        |
| `gray-800`     | `#1F2937`     | Hover của `Button variant="primary"` (`hover:bg-gray-800`)   |
| **`gray-900`** | **`#111827`** | **Nền chính của `Button variant="primary"` (`bg-gray-900`)** |
| `gray-950`     | `#030712`     | Nền tối tuyệt đối                                            |

---

## 3. Quy Tắc Ứng Dụng Giao Diện (Usage Rules)

### 3.1. Quy Tắc Phối Màu 60 - 30 - 10

- **60% - Màu Nền Chủ Đạo (Dominant):** Sử dụng các gam màu trung tính sạch sẽ (`surface-base`, `surface-subtle`). Giữ cho trang web sáng sủa, thoáng đãng để người dùng tập trung vào nội dung hồ sơ gia sư.
- **30% - Màu Cấu Trúc Vai Trò (Structural):** Sử dụng màu đặc trưng của từng phân hệ (Sidebar, header, bảng dữ liệu, tab chọn) để người dùng luôn nhận biết mình đang ở phân hệ nào.
- **10% - Màu Điểm Nhấn (Accent / CTA):** Chỉ dành riêng cho các hành động cần nhấn mạnh: Nút đăng ký, nút thuê gia sư, badge trạng thái quan trọng.

### 3.2. Bảng Tra Cứu Utility Classes Tailwind CSS v4

Các biến màu đã được khai báo trực tiếp trong `@theme inline` của `globals.css`, bạn có thể dùng trực tiếp qua các class Tailwind:

```html
<!-- Màu Brand -->
<button class="bg-brand text-white hover:bg-brand-hover shadow-sm">
  Tìm gia sư ngay
</button>

<!-- Phân hệ Vai trò -->
<span class="bg-tutor-50 text-role-tutor border border-tutor-200"
  >Gia sư đã xác minh</span
>
<div class="border-l-4 border-role-admin bg-admin-50 text-role-admin">
  Cảnh báo vi phạm
</div>

<!-- Trạng thái -->
<span class="bg-status-success-bg text-status-success font-medium"
  >✓ Đã duyệt</span
>
<span class="bg-status-warning-bg text-status-warning font-medium"
  >⏳ Đang xử lý</span
>
<span class="bg-status-error-bg text-status-error font-medium"
  >✕ Đã từ chối</span
>

<!-- Bề mặt & Chữ -->
<div class="bg-surface-card border border-border-default text-content-primary">
  <p class="text-content-secondary text-sm">Thông tin học phí</p>
</div>
```

---

## 4. Những Điều Nên Làm & Không Nên Làm (Do's and Don'ts)

### ✅ NÊN LÀM (DO)

1. **Dùng đúng màu cho đúng vai trò:** Luôn dùng màu **Amber** cho các chi tiết liên quan đến hồ sơ gia sư, **Blue** cho học viên, và **Red** cho admin.
2. **Sử dụng Semantic Token:** Ưu tiên dùng `bg-status-success` thay vì gán cứng mã hex tùy ý, giúp giao diện đồng nhất khi bảo trì.
3. **Đảm bảo tương phản:** Khi đặt chữ lên nền màu (như button hoặc badge), luôn đảm bảo chữ dễ đọc ở mọi điều kiện ánh sáng.
4. **Huy hiệu trạng thái có nền nhạt:** Kết hợp nền nhạt (`*-50` hoặc `*-bg`) với chữ đậm màu (`*-600` hoặc `*-700`) để tạo cảm giác tinh tế, dễ chịu.

### ❌ KHÔNG NÊN LÀM (DON'T)

1. **Không lạm dụng màu đỏ (`admin` / `error`):** Chỉ dùng màu đỏ cho các cảnh báo lỗi, nút nguy hiểm (Xóa, Hủy, Khóa) hoặc nhận diện quản trị viên. Tránh dùng màu đỏ làm nút bấm thông thường.
2. **Không trộn lẫn màu vai trò:** Tuyệt đối không dùng nút màu hổ phách (Gia sư) làm nút chính trên không gian của Học viên, tránh gây nhầm lẫn ngữ cảnh.
3. **Không dùng mã màu Hex trực tiếp trong JSX:** Tránh viết `style={{ color: "#2563EB" }}`, hãy dùng token `text-brand` hoặc `text-blue-600`.
