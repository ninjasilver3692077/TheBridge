export interface PasswordResetEmail {
  to: string;
  token: string;
}

export function passwordResetLink(token: string): string {
  const appUrl = new URL(process.env.APP_URL ?? "");
  const localHttp = appUrl.protocol === "http:" && ["localhost", "127.0.0.1"].includes(appUrl.hostname);
  if ((appUrl.protocol !== "https:" && !localHttp) || appUrl.username || appUrl.password || appUrl.search || appUrl.hash) {
    throw new Error("Invalid password reset application URL.");
  }
  appUrl.pathname = appUrl.pathname.replace(/\/$/, "") + "/reset-password";
  appUrl.hash = new URLSearchParams({ token }).toString();
  return appUrl.toString();
}

export const resetMail = {
  async send({ to, token }: PasswordResetEmail): Promise<void> {
    const apiKey = process.env.RESEND_API_KEY?.trim();
    const from = process.env.MAIL_FROM?.trim();
    if (!apiKey || !from) throw new Error("Password reset email is not configured.");
    const link = passwordResetLink(token);
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: "Bearer " + apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [to],
        subject: "Reset your TheBridge password",
        text: [
          "Open the link below to choose a new password for TheBridge.",
          link,
          "This link expires in one hour and can be used once. Requesting another link replaces it. If you did not request this email, you can ignore it.",
        ].join("\n\n"),
      }),
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw new Error("Password reset email could not be sent.");
  },
};
