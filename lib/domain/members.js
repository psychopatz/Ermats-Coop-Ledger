export function sanitizeMember(member) {
  const { _rowNumber, access_code, ...rest } = member;
  return rest;
}