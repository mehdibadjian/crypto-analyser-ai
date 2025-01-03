export type ClassValue = string | number | boolean | null | undefined;

export function cn(...inputs: (ClassValue | ClassValue[])[]): string {
  return inputs
    .flat()
    .filter((x) => typeof x === 'string')
    .join(' ')
    .trim();
}
