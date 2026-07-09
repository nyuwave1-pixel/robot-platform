// Firebase Auth 에러 코드 → 사용자 친화 한국어 메시지
// 특히 Auth가 아직 콘솔에서 활성화되지 않은 경우(configuration-not-found /
// operation-not-allowed)를 방문자가 이해할 수 있는 안내로 바꾼다.

export function friendlyAuthError(err: unknown): string {
  const code =
    (err as { code?: string })?.code ??
    (err as { message?: string })?.message ??
    "";

  if (code.includes("configuration-not-found") || code.includes("operation-not-allowed")) {
    return "이메일 로그인이 아직 준비 중입니다. 곧 열릴 예정이니 잠시만 기다려 주세요.";
  }
  if (code.includes("email-already-in-use")) {
    return "이미 가입된 이메일입니다. 로그인해 주세요.";
  }
  if (code.includes("invalid-email")) {
    return "이메일 형식이 올바르지 않습니다.";
  }
  if (code.includes("weak-password")) {
    return "비밀번호는 6자 이상이어야 합니다.";
  }
  if (
    code.includes("wrong-password") ||
    code.includes("user-not-found") ||
    code.includes("invalid-credential")
  ) {
    return "이메일 또는 비밀번호가 올바르지 않습니다.";
  }
  if (code.includes("too-many-requests")) {
    return "시도가 너무 많습니다. 잠시 후 다시 시도해 주세요.";
  }
  if (code.includes("network-request-failed")) {
    return "네트워크 연결을 확인해 주세요.";
  }
  return "요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.";
}
