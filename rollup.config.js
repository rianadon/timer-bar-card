import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import babel from "@rollup/plugin-babel";
import { terser } from "rollup-plugin-terser";
import json from "@rollup/plugin-json";

const dev = process.env.ROLLUP_WATCH;

const plugins = [
  nodeResolve(),
  commonjs(),
  typescript(),
  json(),
  babel({
    babelHelpers: "bundled",
    exclude: "node_modules/**",
  }),
  terser(),
];

export default [
  {
    input: "src/timer-bar-card.ts",
    output: {
      dir: "dist",
      format: "es",
      inlineDynamicImports: true,
    },
    plugins: [...plugins],
  },
];
