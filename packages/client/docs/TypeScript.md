# TypeScript

This page is about how our TypeScript is configured in our client code.

## TSConfig

Our TypeScript configuration extends the root `tsconfig.json`, which in turn extends the config `@latticexyz/common/tsconfig.base.json`

### Compiler Options:

- [`noEmit = true`](https://www.typescriptlang.org/tsconfig#noEmit); disables generating js files from ts files under compilation.
- [`skipLibCheck = true`](https://www.typescriptlang.org/tsconfig#skipLibCheck); disables checking all d.ts files.
- [`types = [...]`](https://www.typescriptlang.org/tsconfig#types); specifies the types we want to include without being referenced in a source file.
- [`module = "ESNext"`](https://www.typescriptlang.org/tsconfig#module); tells TypeScript to set the [module](https://www.typescriptlang.org/docs/handbook/modules.html) system for the program to `ESNext`.
- [`moduleResolution = "Bundler"`](https://www.typescriptlang.org/tsconfig#moduleResolution); Specifies the module resolution strategy to `bundler`.
- [`esModuleInterop = true`](https://www.typescriptlang.org/tsconfig#esModuleInterop); is enabled and ensures interop with CommonJS/AMD/UMD modules. This also enables the [`allowSyntheticDefaultImports`](https://www.typescriptlang.org/tsconfig#allowSyntheticDefaultImports) option.
- [`target = "ESNext"`](https://www.typescriptlang.org/tsconfig#target); is set to `ESNext` and its up to the tools such like [esbuild](https://github.com/evanw/esbuild) and/or [rollup](https://rollupjs.org) to transpile and generate the correct code for the given client browser(s) target platform.
- [`lib = ["ESNext", "DOM", "DOM.iterable"]`](https://www.typescriptlang.org/tsconfig#lib); tells TypeScript to include the type definitions for [`ESNext`](https://github.com/microsoft/TypeScript/blob/main/lib/lib.esnext.d.ts), [`DOM`](https://github.com/microsoft/TypeScript/blob/main/lib/lib.dom.d.ts) and [`DOM.Iterable`](https://github.com/microsoft/TypeScript/blob/main/lib/lib.dom.iterable.d.ts).
- [`strict = true`](https://www.typescriptlang.org/tsconfig#strict); is enabled and ensures a wide range of type checking behavior that results in stronger guarantees of program correctness.
- [`strictPropertyInitialization = false`](https://www.typescriptlang.org/tsconfig#strictPropertyInitialization); is disabled so that we get no error on properties that are declared but not set in constructor (will enable it in upcoming code, enabled by default by strict mode).
- [`useDefineForClassFields = false`](https://www.typescriptlang.org/tsconfig#useDefineForClassFields); is disabled so we are not actually emitting standard ECMA compliant class field (we will enable it in upcoming code)
- [`noErrorTruncation = true`](https://www.typescriptlang.org/tsconfig#noErrorTruncation); Disable truncating types in error messages.
- [`noUnusedLocals = true`](https://www.typescriptlang.org/tsconfig#noUnusedLocals); Reports on unused local variables.
- [`noUnusedParameters = true`](https://www.typescriptlang.org/tsconfig#noUnusedParameters); Reports on unused parameters in functions.
- [`resolveJsonModule = true`](https://www.typescriptlang.org/tsconfig#resolveJsonModule); Enabled importing JSON files.
- [`forceConsistentCasingInFileNames = true`](https://www.typescriptlang.org/tsconfig#forceConsistentCasingInFileNames); Ensures that casing is correct in imports.
- [`jsx = "react-jsx"`](https://www.typescriptlang.org/tsconfig#jsx); specifies that react-jsx code is generated.
- [`paths = ["@package-name": ["location"], …`](https://www.typescriptlang.org/tsconfig#jsx); Specifies a set of entries that re-map imports to additional lookup locations.

#### Strict mode

Strict mode is enabled and it therefore also enables the following options:

- [`alwaysStrict = true`](https://www.typescriptlang.org/tsconfig#alwaysStrict); is enabled and ensures that our files are parsed in the ECMAScript strict mode, and emit `"use strict"` for each source file.
- [`strictNullChecks = true`](https://www.typescriptlang.org/tsconfig#strictNullChecks); is enabled making `null` and `undefined` have their own distinct types and we will get a type error if we try to use them where a concrete value is expected.
- [`strictBindCallApply = true`](https://www.typescriptlang.org/tsconfig#strictBindCallApply); is enabled and TypeScript will check that the built-in methods of functions `call`, `bind`, and `apply` are invoked with correct argument for the underlying function:
- [`strictFunctionTypes = true`](https://www.typescriptlang.org/tsconfig#strictFunctionTypes); is enabled and ensures functions parameters to be checked more correctly.
- [`strictPropertyInitialization = true`](https://www.typescriptlang.org/tsconfig#strictPropertyInitialization); is enabled and TypeScript will raise an error when a class property was declared but not set in the constructor when it has no default initializer value.
- [`noImplicitAny = true`](https://www.typescriptlang.org/tsconfig#noImplicitAny); is enabled and TypeScript will raise an error when it cannot infer the type of a variable.
- [`noImplicitThis = true`](https://www.typescriptlang.org/tsconfig#noImplicitThis); is enabled and TypeScript will raise an error on `this` expressions with an implied `any` type.

#### Target ESNext

Target is ESNext and it therefore also enables the following options:

- [`useDefineForClassFields = true`](https://www.typescriptlang.org/tsconfig#useDefineForClassFields); is enabled and is used as part of migrating to the upcoming standard version of class fields. (Currently disabled however will be enabled in upcoming code changes)
