# 🚀 BHXH Auto-Helper & Buster Integration

Giải pháp tự động hóa tra cứu thẻ BHYT thông qua hệ thống BHXH. Tích hợp với **Buster** để giải quyết CAPTCHA tự động.

---

## 🌟 Tính Năng Chính

- ✅ **Auto Queue System** - Xử lý danh sách tra cứu tự động, hàng trăm người/lần
- ✅ **Smart Auto-Retry** - Tự động retry với Year-Only khi gặp lỗi "Ngày sinh không đúng"
- ✅ **Auto-Zero Prefix** - Thêm số 0 vào đầu mã thẻ nếu cần (toggle on/off)
- ✅ **CAPTCHA Automation** - Tích hợp Buster để giải CAPTCHA, auto-click submit
- ✅ **Batch Processing** - Xử lý hàng loạt từ Excel
- ✅ **Progress Tracking** - Theo dõi tiến độ: đã tra / tổng cộng
- ✅ **Auto-Format DOB** - Tự động chuyển đổi định dạng ngày sinh (2 chữ số năm → 4 chữ số)

---

## 📋 Yêu Cầu

- 🌐 **Trình duyệt**: Chrome, Firefox, Edge (có Tampermonkey)
- 🔧 **Extension**: [Tampermonkey](https://tampermonkey.net/)
- 🤖 **Auto CAPTCHA**: [Buster](https://buster.ai/) (tùy chọn, để tăng hiệu quả)
- 📊 **Excel**: Dữ liệu theo format: `[HỌ TÊN] | [MÃ SỐ] | [NGÀY SINH]`

---

## 🔧 Cài Đặt

### 1. Cài Tampermonkey
- Truy cập [tampermonkey.net](https://tampermonkey.net/)
- Chọn trình duyệt của bạn
- Nhấn "Install" để thêm extension

### 2. Cài Script BHXH Auto-Helper
- Copy toàn bộ nội dung file `script.js`
- Mở Tampermonkey → "Create a new script"
- Dán code vào và lưu (Ctrl+S)

### 3. Cài Buster (Tùy chọn)
- Truy cập [buster.ai](https://buster.ai/)
- Cài extension Buster
- Buster sẽ tự động giải CAPTCHA

---

## 📖 Hướng Dẫn Sử Dụng

### Chuẩn Bị Dữ Liệu
Dữ liệu trong Excel **PHẢI** có đúng format:

| HỌ TÊN | MÃ SỐ | NGÀY SINH |
|--------|-------|-----------|
| Nguyễn Văn A | 0123456789 | 15/06/90 |
| Trần Thị B | 0987654321 | 20/03/85 |
| Phạm Minh C | 9876543210 | 01/12/92 |

**Lưu ý:**
- Tên người và mã số: text thường
- Ngày sinh: format `DD/MM/YY` hoặc `DD/MM/YYYY`
- Dùng **Tab** hoặc **2+ space** để phân cách các cột

### Workflow

```
[Copy Excel] → [Paste vào Bảng Queue] → [Nhấn Bắt Đầu] 
    ↓
[Buster Giải CAPTCHA] → [Script Auto-Click] → [Lấy Kết Quả] 
    ↓
[Lưu vào danh sách] → [Repeat] → [Hoàn Thành]
```

### Step-by-Step

1. **Mở trang tra cứu BHXH**: https://baohiemxahoi.gov.vn/
2. **Scroll xuống**: Bạn sẽ thấy 🚀 QUEUE SYSTEM panel bên phải
3. **Copy danh sách từ Excel**: Select cột tên, mã số, ngày sinh
4. **Paste vào ô "Dán danh sách từ Excel vào đây"**
5. **Nhấn "▶ Bắt Đầu"** để chạy
   - Script tự động fill form + call Buster giải CAPTCHA
   - Tự động click "Tra cứu"
   - Lấy mã thẻ BHYT và lưu vào danh sách
6. **Copy kết quả**: Nhấn "📋 Copy" để copy tất cả kết quả
7. **Paste vào Excel** để xử lý tiếp

---

## 🎛️ Các Nút Điều Khiển

### Thanh Công Cụ Chính
| Nút | Mô Tả |
|-----|-------|
| **Auto 0: ON/OFF** | Tự động thêm số 0 vào đầu mã thẻ |
| **⏳ Chờ Captcha...** | Hiển thị trạng thái CAPTCHA |

### Queue Panel
| Nút | Mô Tả |
|-----|-------|
| **[—] / [+]** | Ẩn/hiện queue panel |
| **▶ Bắt Đầu** | Khởi chạy queue (chuyển thành ⏸ Đang chạy...) |
| **⏭ Bỏ Qua** | Bỏ qua dòng hiện tại nếu bị lỗi |
| **📋 Copy** | Copy toàn bộ kết quả vào clipboard |
| **🗑 Xóa hết** | Xóa sạch danh sách + kết quả |

---

## 🔄 Auto-Retry Logic

**Khi nào trigger?**
- Phát hiện message: "Ngày sinh không đúng" hoặc "Ngày sinh chưa chính xác"

**Cách hoạt động:**
1. Lần 1: Submit form bình thường
2. Nếu lỗi "Ngày sinh": Auto-extract **Year Only** (ví dụ: `1990` từ `15/06/1990`)
3. Lần 2: Submit lại với năm sinh
4. Nếu vẫn lỗi: Bỏ qua, đánh dấu "❌ Lỗi Ngày sinh"

**Format DOB hỗ trợ:**
- `15/06/1990` → Year: `1990`
- `15/06/90` → Year: `1990` (auto-convert)
- `1990` → Year: `1990`

---

## 🐛 Troubleshooting

### Vấn đề: Script không chạy
- ✓ Kiểm tra Tampermonkey đã enable script chưa
- ✓ Refresh trang
- ✓ Kiểm tra console (F12 → Console) có lỗi gì không

### Vấn đề: Auto-Click không hoạt động
- ✓ Buster có enable chưa?
- ✓ CAPTCHA đã giải xong chưa? (chờ ✅)
- ✓ URL có match `*://baohiemxahoi.gov.vn/*` không

### Vấn đề: Mã thẻ không extract được
- ✓ Tra cứu có kết quả không?
- ✓ Kiểm tra response có chứa "Mã thẻ:" không
- ✓ Xem console log để debug

### Vấn đề: Queue bị stuck
- ✓ Nhấn "⏸ Đang chạy..." để pause
- ✓ Nhấn "⏭ Bỏ Qua" để skip record hiện tại
- ✓ Refresh trang và nhấn "▶ Bắt Đầu" lại

---

## 📊 Kết Quả Output

Sau khi tra cứu, danh sách kết quả sẽ có format:

```
Nguyễn Văn A - 0123456789
Trần Thị B - 0987654321
Phạm Minh C - 9876543210
```

Hoặc với DN cards:
```
Nguyễn Văn A - DN1234567890123-0123456789
```

---

## 🔐 Bảo Mật & Lưu Ý

- ⚠️ Script **KHÔNG** gửi dữ liệu đến server ngoài
- ⚠️ Tất cả dữ liệu lưu **local** (localStorage)
- ⚠️ Chỉ submit đến `baohiemxahoi.gov.vn` (domain chính thức)
- ⚠️ Dữ liệu sẽ xóa nếu bạn nhấn "🗑 Xóa hết"

---

## 💾 Lưu Trữ Dữ Liệu

Script sử dụng `localStorage` để lưu:
- `bhxh_q_list` - Danh sách chờ
- `bhxh_q_results` - Danh sách kết quả
- `bhxh_q_running` - Trạng thái chạy
- `bhxh_q_hidden` - Trạng thái ẩn panel
- `bhxh_auto_zero` - Trạng thái Auto 0

**Clear dữ liệu:**
- Mở DevTools (F12) → Application → LocalStorage → xóa items
- Hoặc nhấn "🗑 Xóa hết" trong panel

---

## 🆘 Hỗ Trợ & Báo Cáo Lỗi

Nếu gặp vấn đề:
1. Mở DevTools (F12)
2. Chuyển sang tab "Console"
3. Copy toàn bộ log (nhất là messages có 🚀, ⚠️, ❌)
4. [Tạo Issue](https://github.com/nam123depchai/C-ch-C-i-BHXH-Auto/issues) với log

---

## 📝 Version History

- **v2.6** - Auto-Retry với Year-Only + Queue System + Progress Counter
- **v2.5** - Thêm CAPTCHA Status Indicator
- **v2.0** - Queue System + Auto-Zero toggle
- **v1.0** - Script cơ bản

---

## 📄 License

Miễn phí sử dụng cho mục đích cá nhân. Vui lòng không sử dụng cho mục đích thương mại mà không phép.

---

## ✨ Tip & Tricks

- 💡 Để tăng tốc độ: Tăng từ 500ms → 300ms trong `setTimeout` (dòng với `fillForm`)
- 💡 Để chạy từ từ hơn: Tăng từ 800ms → 1000ms trong `setInterval` (cuối script)
- 💡 Debug: Mở Console và xem các log có `console.log()`
- 💡 Backup data: Copy nội dung từ "Kết quả thu được" trước khi xóa

---

**Chúc bạn sử dụng hiệu quả! 🎉**
