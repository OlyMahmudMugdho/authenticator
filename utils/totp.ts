import * as OTPAuth from "otpauth";

export const generateTOTP = (secret: string) => {
  if (!secret) return "";

  try {
    const normalizedSecret = secret.replace(/\s+/g, "").toUpperCase();

    const totp = new OTPAuth.TOTP({
      issuer: "Authenticator",
      label: "Authenticator",
      algorithm: "SHA1",
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(normalizedSecret), // <- Use fromBase32
    });

    return totp.generate();
  } catch (err) {
    console.error("Error generating TOTP for secret:", secret, err);
    return "ERR";
  }
};
