# 🚀 Deployment Guide

> **Estimated setup time : ~15 minutes**
> 
> This guide walks you through deploying your own instance of FoodSystem from scratch.

## Prerequisites

Before you start, make sure you have :
- A [GitHub](https://github.com) account (to fork the repo)
- A [Supabase](https://supabase.com) account (free tier is enough)
- A [Vercel](https://vercel.com) account (free tier is enough)

---

## Step 1 — Database Setup

FoodSystem uses Supabase as its backend. Start by creating your database.

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. Once your project is ready, open the **SQL Editor** from the left sidebar.
3. Copy the contents of **[Database Schema](./Database/Schema.sql)** and run it in the SQL editor.

This will create all the necessary tables and security policies for your inventory system.

---

## Step 2 — Configure Supabase

### 2A — Email confirmation template

FoodSystem uses email confirmation to make sure only invited users can access your workspace.

1. In your Supabase dashboard, go to **Authentication → Email Templates → Confirm Sign Up**.
2. Replace the default template with the HTML below :

```html
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Confirme ton compte</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f5f8;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f8;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" style="background-color:#f8f8fb;border-radius:16px;overflow:hidden;border:1px solid #dde0ea;box-shadow:0 2px 16px rgba(0,0,0,0.06);">
          <tr>
            <td style="background:linear-gradient(135deg, #253a9c 0%, #3345b8 60%, #4a5cc9 100%);padding:40px;text-align:center;">
              <p style="margin:0 0 12px;display:inline-block;border:1px solid rgba(255,255,255,0.3);background:rgba(255,255,255,0.1);padding:4px 14px;border-radius:999px;font-size:10px;font-weight:700;color:rgba(255,255,255,0.9);letter-spacing:0.16em;text-transform:uppercase;">
                Digital Atelier
              </p>
              <h1 style="margin:0;font-size:28px;font-weight:600;color:#ffffff;line-height:1.3;">
                Elevating the Art of<br/>Inventory.
              </h1>
              <p style="margin:12px 0 0;font-size:13px;color:rgba(255,255,255,0.75);line-height:1.6;">
                Experience a Michelin-starred approach<br/>to resource management.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 40px 32px;">
              <p style="margin:0 0 20px;font-size:11px;font-weight:700;color:#949aab;letter-spacing:0.12em;text-transform:uppercase;">
                Secure Access
              </p>
              <h2 style="margin:0 0 8px;font-size:26px;font-weight:600;color:#1f222b;">
                Confirme ton compte
              </h2>
              <p style="margin:0 0 28px;font-size:15px;color:#6d7385;line-height:1.7;">
                Bienvenue dans ton espace de gestion de stock. Clique sur le bouton ci-dessous pour confirmer ton adresse e-mail et accéder à ton workspace.
              </p>
              <table cellpadding="0" cellspacing="0" style="margin:0 0 32px;">
                <tr>
                  <td style="background-color:#3345b8;border-radius:999px;">
                    <a href="{{ .ConfirmationURL }}"
                      style="display:inline-flex;align-items:center;gap:8px;padding:16px 32px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:0.02em;">
                      Enter Workspace →
                    </a>
                  </td>
                </tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
                <tr>
                  <td width="48%" style="background-color:#eceef4;border-radius:12px;padding:16px;vertical-align:top;">
                    <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#1f222b;">Real-time</p>
                    <p style="margin:0;font-size:12px;color:#6d7385;">Instant asset valuation and tracking.</p>
                  </td>
                  <td width="4%"></td>
                  <td width="48%" style="background-color:#eceef4;border-radius:12px;padding:16px;vertical-align:top;">
                    <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#1f222b;">Smart Alerts</p>
                    <p style="margin:0;font-size:12px;color:#6d7385;">Predictive expiration intelligence.</p>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 6px;font-size:12px;color:#949aab;">
                Si le bouton ne fonctionne pas, copie ce lien :
              </p>
              <p style="margin:0;font-size:11px;color:#3345b8;word-break:break-all;">
                {{ .ConfirmationURL }}
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px;">
              <hr style="border:none;border-top:1px solid #dde0ea;margin:0;" />
            </td>
          </tr>
          <tr>
            <td style="padding:24px 40px;text-align:center;">
              <p style="margin:0 0 4px;font-size:12px;color:#949aab;">
                Si tu n'as pas créé de compte, ignore cet e-mail.
              </p>
              <p style="margin:0 0 12px;font-size:12px;color:#949aab;">
                Ce lien expire dans <strong style="color:#6d7385;">24 heures</strong>.
              </p>
              <p style="margin:0;font-size:12px;color:#b0b5c2;">
                © 2025 FoodSystem
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

### 2B — Redirect URL

After a user clicks the confirmation link in their email, Supabase needs to know where to redirect them.

1. In your Supabase dashboard, go to **Authentication → URL Configuration**.
2. Under **Redirect URLs**, add the URL of your deployed application (e.g. `https://your-app.vercel.app`).

### 2C — Lock down new sign-ups

Once all your users have created their accounts, disable public sign-ups to prevent unauthorized access.

1. Go to **Authentication → Providers** in your Supabase dashboard.
2. Under **Email**, turn off the **"Allow new users to sign up"** option.

![Disable new sign-ups in Supabase](./images/NewUserSignUp.png)

> ⚠️ Make sure all intended users have confirmed their accounts **before** disabling this option.

---

## Step 3 — Deploy the Application

### 3A — Retrieve your environment variables

You'll need two environment variables from Supabase. You can find them in your Supabase dashboard under **Settings → API**, or via the **Connect** button at the top of your project.

![Supabase Connect button](./images/ConnectButton.png)

Copy the following values :

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your-supabase-anon-key
```

> 💡 The publishable key may also be labeled **"anon key"** or `NEXT_PUBLIC_SUPABASE_ANON_KEY` in the dashboard. Use it as-is but rename the variable as shown above.

### 3B — Deploy on Vercel

1. Fork the FoodSystem repository to your GitHub account.
2. Go to [vercel.com](https://vercel.com) and click **"Add New Project"**.
3. Import your forked GitHub repository.
4. In the **Environment Variables** section, add the two variables from the previous step.
5. Click **Deploy** — Vercel will build and publish your app automatically.

Once deployed, copy your Vercel app URL (e.g. `https://your-app.vercel.app`) and add it to your Supabase redirect URLs as described in **Step 2B**.

> 🔁 Any future push to your `main` branch will trigger an automatic redeployment on Vercel.

---

## Troubleshooting

| Issue | Solution |
|---|---|
| Confirmation email not received | Check your spam folder. Verify the email template is saved in Supabase. |
| Redirect after confirmation fails | Make sure your Vercel URL is added to Supabase's redirect URLs (Step 2B). |
| Environment variables not working | Double-check variable names — they must match exactly, including the `NEXT_PUBLIC_` prefix. |
| Can't log in after disabling sign-ups | Ensure the user confirmed their email **before** sign-ups were disabled. |

---

**Having trouble ? Open an issue on the [GitHub repository](https://github.com/WilliamBSITT/FoodSystem/issues).**