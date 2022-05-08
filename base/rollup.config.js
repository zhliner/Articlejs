import { terser } from 'rollup-plugin-terser'

export default {
    input: 'main.js',
    output: {
        file: '../../cooljed/base/main.js',
        format: 'esm',
        banner: '/*! CooljED/Tpb@tQuery v0.2.0 | (c) zhliner@gmail.com 2022.01.19. */',
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
