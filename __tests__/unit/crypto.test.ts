import { encryptToken, decryptToken } from "@/lib/crypto";

describe("crypto", () => {
  it("encrypts and decrypts a token round-trip", () => {
    const plain = "super-secret-access-token-abc123";
    const encrypted = encryptToken(plain);
    expect(encrypted).not.toBe(plain);
    expect(encrypted.split(":")).toHaveLength(3);
    const decrypted = decryptToken(encrypted);
    expect(decrypted).toBe(plain);
  });

  it("produces different ciphertext for same plaintext (random IV)", () => {
    const plain = "test-token";
    expect(encryptToken(plain)).not.toBe(encryptToken(plain));
  });
});
