# Eureka English Center - Timetabling System (Frontend SPA)

Đây là giao diện người dùng Single Page Application (SPA) của **Hệ thống Xếp lịch Thông minh Eureka English Center**. Dự án được xây dựng với giao diện hiện đại, tối ưu trải nghiệm tương tác trực quan cho cả Quản trị viên và Giáo viên.

---

## 🎨 1. Thiết Kế & Công Nghệ Sử Dụng

Giao diện được xây dựng dựa trên các tiêu chuẩn thiết kế hiện đại, responsive cao và trực quan:

*   **Framework chính:** Vue 3 (Sử dụng Composition API và Single File Components - SFC).
*   **Ngôn ngữ:** TypeScript (đảm bảo kiểm soát kiểu tĩnh và phát triển an toàn).
*   **Build Tool:** Vite (cho tốc độ hot-reload cực nhanh khi phát triển).
*   **Thư viện UI Component:** Element Plus (với thiết kế premium, cung cấp các điều khiển lịch biểu, form, bảng phân trang nâng cao).
*   **CSS Utility:** Tailwind CSS (tối ưu hóa thiết kế layout nhanh chóng, linh hoạt).
*   **Quản lý trạng thái (State Management):** Pinia.
*   **Điều hướng (Routing):** Vue Router.
*   **Đa ngôn ngữ (i18n):** Vue i18n (hỗ trợ chuyển đổi nhanh ngôn ngữ tiếng Anh và tiếng Việt).

---

## 📂 2. Cấu Trúc Các Trang Chính (Pages)

Mã nguồn được tổ chức sạch sẽ trong thư mục [`frontend/src`](file:///d:/eureka_system/frontend/src):

*   [`pages/Dashboard.vue`](file:///d:/eureka_system/frontend/src/pages/Dashboard.vue): Trang tổng quan hiển thị thống kê số lượng giáo viên hoạt động, số lớp tuyển sinh, các đơn xin nghỉ phép chưa duyệt, và biểu đồ năng lực phòng học.
*   [`pages/ClassPlanningBoard.vue`](file:///d:/eureka_system/frontend/src/pages/ClassPlanningBoard.vue): Bảng Kanban lập kế hoạch mở lớp cuốn chiếu (Rolling Class Planning) gồm các trạng thái: Draft (Nháp) -> Enrolling (Tuyển sinh) -> Rebalancing (Cân bằng sĩ số) -> Open (Mở lớp/Chờ xếp lịch).
*   [`pages/TimetableView.vue`](file:///d:/eureka_system/frontend/src/pages/TimetableView.vue): Lưới thời khóa biểu hàng tuần, cho phép chạy xếp lịch tự động thông qua Timefold Solver, điều chỉnh lịch thủ công và hiển thị gợi ý giáo viên dạy thay.
*   [`pages/DispatchCoordinator.vue`](file:///d:/eureka_system/frontend/src/pages/DispatchCoordinator.vue): Trung tâm điều phối giảng dạy hàng ngày, cho phép đổi ca, đổi phòng học, đổi giáo viên (có real-time validation chống trùng lịch) và điều phối hàng loạt (Bulk Dispatch).
*   [`pages/LeaveManagement.vue`](file:///d:/eureka_system/frontend/src/pages/LeaveManagement.vue): Cho phép giáo viên tạo đơn xin nghỉ và quản lý phê duyệt đơn nghỉ phép của Admin.
*   [`pages/SubstituteClaim.vue`](file:///d:/eureka_system/frontend/src/pages/SubstituteClaim.vue): Trang nhận dạy thay trực tuyến bảo mật thông qua mã thông báo Secure Token được gửi qua Email.

---

## ⚙️ 3. Hướng Dẫn Cài Đặt & Chạy Ứng Dụng (Local Setup)

### 3.1 Yêu cầu tiên quyết
*   **Node.js** phiên bản **18.x** trở lên.
*   **NPM** (Đi kèm Node.js).

### 3.2 Các bước khởi chạy
1.  **Chuyển vào thư mục `frontend`:**
    ```bash
    cd frontend
    ```
2.  **Cấu hình biến môi trường kết nối API:**
    *   Đảm bảo có file `.env.development` trong thư mục `frontend` với nội dung:
        ```env
        VITE_API_URL=/api
        ```
    *   *Vite sẽ tự động proxy mọi request bắt đầu bằng `/api` về địa chỉ `http://localhost:8080` của Backend theo cấu hình có sẵn trong file [vite.config.ts](file:///d:/eureka_system/frontend/vite.config.ts).*
3.  **Cài đặt các thư viện phụ thuộc (Dependencies):**
    ```bash
    npm install
    ```
4.  **Khởi chạy Frontend ở chế độ Development:**
    ```bash
    npm run dev
    ```

### 3.3 Truy cập ứng dụng
Sau khi khởi chạy thành công, ứng dụng sẽ chạy trên cổng mặc định:
*   Local URL: `http://localhost:3000`
