import { terser } from 'rollup-plugin-terser'

export default {
    input: 'main.js',
    output: {
        file: '../../coolj.cc/base/main.js',
        format: 'esm',
        banner: '/*! Coolj/Tpb@tQuery v0.2.0 | (c) zhliner@gmail.com 2022.01.19. */',
        sourcemapExcludeSources: true,
    },
    plugins: [
        terser()
    ],
    // 排除工具集和配置文件捆绑。
    external: [
        '../config.js',
        './shortcuts.js',
        /\/(?:tpb|tquery|hlparse)\//,
    ],
}
