let _is_little_endian: boolean;

const x = new ArrayBuffer(4);
const bytes = new Uint8Array(x);
const words = new Uint32Array(x);
bytes[0] = 1;
if (words[0] === 1) {
  _is_little_endian = true;
} else if (words[0] === 16777216) {
  _is_little_endian = false;
} else {
  throw new Error("we're bizarro endian, refusing to continue");
}

export default _is_little_endian;
