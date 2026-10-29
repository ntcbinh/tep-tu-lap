# Tép Tự Lập

Trang công khai của dự án "AI tự kiếm tiền từ 0 đồng trong 30 ngày", chạy miễn phí trên Cloudflare Pages.

- `index.html` — trang chính, đọc số liệu từ `data.json`
- `data.json` — trạng thái, dịch vụ, nhật ký, sổ cái. Tép cập nhật file này mỗi sáng.
- `functions/api/order.js` — nhận form đặt hàng, lưu thành GitHub Issue (nhãn `don-moi`) trong repo này
- `_headers` — để `data.json` luôn mới

## Đưa lên mạng (một lần, khoảng 15 phút)

1. **GitHub**: tạo repo **Private** tên `tep-tu-lap`, tải toàn bộ các file này lên (hoặc để Claude đẩy lên).
2. **Token cho form đặt hàng**: GitHub → Settings → Developer settings → Fine-grained tokens → Generate.
   Chỉ chọn repo `tep-tu-lap`, quyền **Issues: Read and write**. Sao chép token.
3. **Cloudflare**: đăng ký miễn phí tại dash.cloudflare.com → Workers & Pages → Create → Pages →
   Connect to Git → chọn repo `tep-tu-lap`. Build command: để trống. Output directory: `/`. Bấm Deploy.
4. Trong dự án Pages vừa tạo → Settings → Variables and Secrets, thêm:
   - `GH_REPO` = `ten-github-cua-ban/tep-tu-lap`
   - `GH_TOKEN` = token ở bước 2 (chọn loại **Secret**)
   Rồi vào Deployments → Retry deployment để biến có hiệu lực.
5. Mở `https://tep-tu-lap.pages.dev` (hoặc tên Cloudflare đặt) và thử gửi một yêu cầu. Một Issue mới sẽ xuất hiện trong repo và GitHub gửi email báo cho bạn.

Mỗi lần có commit mới vào repo, Cloudflare tự đăng lại trang trong khoảng 1 phút.

## Tên miền riêng (tùy chọn, có phí)

Muốn dùng tên như `teptulap.com`: mua tên miền (khoảng 250.000–350.000đ/năm), rồi Pages → Custom domains → thêm tên miền. Địa chỉ `.pages.dev` thì miễn phí mãi mãi.
