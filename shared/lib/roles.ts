/** Role yang tidak terikat ke satu Lembaga. */
export function isPlatformRoleName(
  roleName: string | null | undefined,
): roleName is "SUPER_ADMIN" | "FINANCE_PLATFORM" {
  return roleName === "SUPER_ADMIN" || roleName === "FINANCE_PLATFORM";
}
