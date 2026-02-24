// 4-letter room code generator
// Excludes I and O to avoid confusion with 1 and 0
const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';

function generateCode() {
  return Array.from({ length: 4 }, () =>
    CHARS[Math.floor(Math.random() * CHARS.length)]
  ).join('');
}

function uniqueCode(rooms) {
  let code;
  do {
    code = generateCode();
  } while (rooms.has(code));
  return code;
}

module.exports = { uniqueCode };
