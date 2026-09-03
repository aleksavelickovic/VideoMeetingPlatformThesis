<#import "template.ftl" as layout>
<@layout.emailLayout title="Reset your password">
  <h1 style="margin:0 0 12px;font-size:24px;color:#172033">Reset your password</h1>
  <p style="margin:0 0 20px;font-size:16px;line-height:1.6">Hello ${(user.firstName)!"there"}, we received a request to reset the password for your Lilly Meetings account.</p>
  <div style="text-align:center;margin:28px 0">
    <a href="${link}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;font-weight:bold;padding:13px 26px;border-radius:9px">Choose a new password</a>
  </div>
  <p style="font-size:12px;color:#64748b;line-height:1.6;word-break:break-all">If the button does not work, copy this link into your browser:<br><br>${link}</p>
  <p style="margin:24px 0 0;color:#64748b;font-size:13px;line-height:1.6">If you did not request a password reset, you can safely ignore this email.</p>
</@layout.emailLayout>
