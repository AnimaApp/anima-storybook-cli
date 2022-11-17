export const log = {
  yellow: (text: string): void => console.log(`\x1b[33m ${text} \x1b[0m`),
  red: (text: string): void => console.log(`\x1b[31m ${text} \x1b[0m`),
  green: (text: string): void => console.log(`\x1b[32m ${text} \x1b[0m`),
};
