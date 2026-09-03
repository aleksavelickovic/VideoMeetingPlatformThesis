<#macro emailLayout title>
<!doctype html>
<html>
<body style="margin:0;background:#f4f7fb;font-family:Arial,sans-serif;color:#172033">
<div style="max-width:620px;margin:0 auto;padding:32px 16px">
  <div style="background:#2563eb;padding:24px 28px;border-radius:16px 16px 0 0;color:white">
    <div style="font-size:12px;letter-spacing:2px;text-transform:uppercase;opacity:.8">Lilly Meetings</div>
    <h1 style="margin:12px 0 0;font-size:26px;line-height:1.2">${title}</h1>
  </div>
  <div style="background:white;padding:28px;border-radius:0 0 16px 16px;box-shadow:0 8px 24px #1e40781c">
    <#nested>
  </div>
  <p style="text-align:center;color:#94a3b8;font-size:12px;margin:18px 0">This email was sent by Lilly Meetings.</p>
</div>
</body>
</html>
</#macro>
