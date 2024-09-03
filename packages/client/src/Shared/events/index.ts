/**
 * This package contains a typed, single pub/sub pattern used in the Dark Forest game.
 * Inspired by https://www.npmjs.com/package/monomitter
 *
 * ## Installation
 *
 * You can install this package using [`npm`](https://www.npmjs.com) or
 * [`yarn`](https://classic.yarnpkg.com/lang/en/) by running:
 *
 * ```bash
 * npm install --save @df/events
 * ```
 * ```bash
 * yarn add @df/events
 * ```
 *
 * When using this in a plugin, you might want to load it with [skypack](https://www.skypack.dev)
 *
 * ```js
 * import * as events from 'http://cdn.skypack.dev/@df/events'
 * ```
 *
 * @packageDocumentation
 */

export * from "./Monomitter";
