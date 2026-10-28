import { MFA_ENROLLMENT_REQUIRED } from "@bravachain/api-client";
import { MFA_ENROLLMENT_PATH } from "./routes";

/**
 * Pure decision for the central MFA-enrollment interceptor: should an
 * authenticated response send the user to the activation wizard?
 *
 * True only for a 403 `MFA_ENROLLMENT_REQUIRED` and only when the user is not
 * already inside the wizard — which prevents a redirect loop when the wizard's
 * own enroll calls surface the same code.
 */
export function shouldEnrollRedirect(
  status: number,
  code: string | null | undefined,
  pathname: string,
): boolean {
  return (
    status === 403 &&
    code === MFA_ENROLLMENT_REQUIRED &&
    !pathname.startsWith(MFA_ENROLLMENT_PATH)
  );
}
