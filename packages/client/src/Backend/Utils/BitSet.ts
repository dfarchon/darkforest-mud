export class BitSet {
  // 8 booleans per byte
  private data = new Uint8Array(1);

  set(index: number, value: boolean) {
    const byteIndex = index >> 3; // divide by 8
    const bitIndex = index & 7; // mod 8
    if (value) {
      this.data[byteIndex] |= 1 << bitIndex;
    } else {
      this.data[byteIndex] &= ~(1 << bitIndex);
    }
  }

  get(index: number): boolean {
    const byteIndex = index >> 3; // divide by 8
    const bitIndex = index & 7; // mod 8
    return (this.data[byteIndex] & (1 << bitIndex)) !== 0;
  }
}
