declare module "*.wasm" {
  const path: string;
  export default path;
}

declare module "*.zkey" {
  const value: any;
  export default value;
}
