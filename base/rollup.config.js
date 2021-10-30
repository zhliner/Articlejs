import { terser } from 'rollup-plugin-terser'

export default {
    input: 'main.js',
    output: {
        file: './main.min.js',
        format: 'esm',
        banner: '/*! Coolj/Tpb@tQuery v0.2.0 | (c) zhliner@gmail.com 2021.10.27 |  */',
        sourcemapExcludeSources: true,
    },
    plugins: [
        terser()
    ],
    // 排除工具集和配置文件捆绑。
    external: [
        '../config.js',
        './shortcuts.js',
        '../index.js',
        /\/(?:tpb|tquery|highlight)\//,
    ],
}
