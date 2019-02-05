export const targets = [
  { id: 'ApiLevel24', text: 'Android 7.0+' },
  { id: '', text: 'Android 5.0+' },
];

export function targetText (id: string): string {
  let lib = targets.find(x => x.id === id);
  if (!lib) {
    lib = this.libs[0];
  }
  return lib.text;
}
