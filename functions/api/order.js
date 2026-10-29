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

  if (!res.ok) return json({ error: "Chưa lưu được yêu cầu" }, 502);
  return json({ ok: true, code });
}

export function onRequest() {
  return json({ error: "Chỉ nhận POST" }, 405);
}
