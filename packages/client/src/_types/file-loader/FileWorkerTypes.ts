declare module "*.wasm" {
  const path: string;
  export default path;
}

declare module "*.zkey" {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const value: any;
  export default value;
}
