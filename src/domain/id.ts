/** Short random ids for local records (not security sensitive). */
export function newId(prefix = ''): string {
  const rand = Math.random().toString(36).slice(2, 10);
  const time = Date.now().toString(36).slice(-5);
  return `${prefix}${time}${rand}`;
}

/** "1 spot", "3 spots". */
export function plural(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`;
}
