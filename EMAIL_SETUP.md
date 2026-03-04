# Email Setup — Forms to Hillsidesplc@gmail.com

Forms must be emailed to **Hillsidesplc@gmail.com**. If emails aren't arriving, follow one of these options:

---

## Option A: Gmail (Recommended for demos)

**Fastest way to get emails delivered.**

1. Use a Gmail account you control (can be a team Gmail).
2. Enable 2-Step Verification: https://myaccount.google.com/security
3. Create an App Password: https://myaccount.google.com/apppasswords
   - Select "Mail" and your device, then generate.
   - Copy the 16-character password.
4. Add to your `.env`:
   ```
   GMAIL_USER=your@gmail.com
   GMAIL_APP_PASSWORD=abcd efgh ijkl mnop
   FORM_RECIPIENT_EMAIL=Hillsidesplc@gmail.com
   ```
5. Restart the backend. Forms will now send via Gmail.

---

## Option B: SendGrid

SendGrid requires the **from** address to be verified. The default `parahelper@effectiveai.net` often is not.

1. Go to SendGrid → Settings → Sender Authentication.
2. Verify a Single Sender (e.g. your team email).
3. Add to `.env`:
   ```
   SENDGRID_API_KEY=your_key
   SENDER_EMAIL=your_verified@email.com
   FORM_RECIPIENT_EMAIL=Hillsidesplc@gmail.com
   ```
4. Restart the backend.

---

## Test Email Delivery

After setup, send a test:

```bash
curl -X POST http://localhost:5000/api/test-email \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

Or submit any form — if email fails, the UI will show a message and you can still download the PDF.

---

## Check Spam

If using Gmail for sending, emails to Hillsidesplc@gmail.com may land in **Spam** the first time. Ask the recipient to check Spam and mark as "Not spam."
