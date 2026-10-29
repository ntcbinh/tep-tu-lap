// Cloudflare Pages Function: nhận yêu cầu đặt hàng và lưu thành GitHub Issue
// trong repo riêng tư của dự án. Cần 2 biến môi trường (Settings → Variables):
//   GH_TOKEN  — fine-grained token, chỉ quyền "Issues: Read and write" cho repo này (đặt dạng Secret)
//   GH_REPO   — ví dụ "ten-ban/tep-tu-lap"

const MAX = { service: 120, name: 80, contact: 120, deadline: 40, need: 2000 };

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

export async function onRequestPost({ request, env }) {
  let o;
  try {
    o = await request.json();
  } catch {
    return json({ error: "Dữ liệu không hợp lệ" }, 400);
  }

  // Bẫy chống bot: ô ẩn "website" phải để trống
  if (o.website) return json({ ok: true, code: "TEP-OK" });

  const clean = {};
  for (const [k, max] of Object.entries(MAX)) {
    clean[k] = String(o[k] ?? "").trim().slice(0, max);
  }
  if (!clean.service || !clean.name || !clean.contact || !clean.need) {
    return json({ error: "Thiếu thông tin bắt buộc" }, 400);
  }
  if (!env.GH_TOKEN || !env.GH_REPO) {
    return json({ error: "Máy chủ chưa cấu hình" }, 503);
  }

  const code = "TEP-" + Date.now().toString(36).toUpperCase().slice(-6);
  const ip = request.headers.get("cf-connecting-ip") || "";
  const body = [
    `**Mã đơn:** ${code}`,
    `**Dịch vụ:** ${clean.service}`,
    `**Tên:** ${clean.name}`,
    `**Liên hệ:** ${clean.contact}`,
    `**Hạn:** ${clean.deadline || "—"}`,
    "",
    "**Mô tả nhu cầu:**",
    clean.need,
    "",
    `<sub>Gửi lúc ${new Date().toISOString()} · ${ip ? "IP " + ip.replace(/\.\d+$/, ".x") : ""}</sub>`,
  ].join("\n");

  const res = await fetch(`https://api.github.com/repos/${env.GH_REPO}/issues`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${env.GH_TOKEN}`,
      accept: "application/vnd.github+json",
      "user-agent": "tep-tu-lap",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      title: `[Đơn mới] ${code} · ${clean.service} · ${clean.name}`,
      body,
      labels: ["don-moi"],
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    return json({ error: "Chưa lưu được yêu cầu", github: res.status, detail: detail.slice(0, 300) }, 502);
  }
  return json({ ok: true, code });
}

// Mở /api/order trên trình duyệt để tự kiểm tra cấu hình (không lộ token)
export async function onRequestGet({ env }) {
  const out = {
    function_chay: true,
    GH_REPO: env.GH_REPO || "(chưa đặt)",
    GH_TOKEN: env.GH_TOKEN ? "đã đặt, bắt đầu bằng " + String(env.GH_TOKEN).slice(0, 11) + "…" : "(chưa đặt)",
  };
  if (env.GH_REPO && env.GH_TOKEN) {
    const r = await fetch(`https://api.github.com/repos/${env.GH_REPO}`, {
      headers: {
        authorization: `Bearer ${env.GH_TOKEN}`,
        accept: "application/vnd.github+json",
        "user-agent": "tep-tu-lap",
      },
    });
    out.github_status = r.status;
    out.ket_luan =
      r.status === 200 ? "Token đọc được repo. Nếu vẫn lỗi, kiểm tra quyền Issues: Read and write." :
      r.status === 401 ? "Token sai hoặc đã hết hạn. Tạo lại token và dán lại vào GH_TOKEN." :
      r.status === 404 ? "Sai tên repo trong GH_REPO, hoặc token chưa được cấp quyền cho repo này." :
      "GitHub trả lỗi lạ, gửi số github_status cho Claude.";
  } else {
    out.ket_luan = "Thiếu biến. Thêm GH_REPO và GH_TOKEN trong Settings → Variables and Secrets, rồi Retry deployment.";
  }
  return json(out);
}
