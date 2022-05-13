const
    __cName = 'cooljed-v1',

    __appFiles = [
        '/articlejs/',
        '/articlejs/base/api.js',
        '/articlejs/base/base.js',
        '/articlejs/base/cmdline.js',
        '/articlejs/base/coding.js',
        '/articlejs/base/common.js',
        '/articlejs/base/create.js',
        '/articlejs/base/edit.js',
        '/articlejs/base/highlight.js',
        '/articlejs/base/hlparse/base.js',
        '/articlejs/base/hlparse/languages/cplus.js',
        '/articlejs/base/hlparse/languages/css.js',
        '/articlejs/base/hlparse/languages/golang.js',
        '/articlejs/base/hlparse/languages/html.js',
        '/articlejs/base/hlparse/languages/javascript.js',
        '/articlejs/base/hlparse/languages/mdline.js',
        '/articlejs/base/hlparse/languages/normal.js',
        '/articlejs/base/hlparse/main.js',
        '/articlejs/base/main.js',
        '/articlejs/base/plugins.js',
        '/articlejs/base/property.js',
        '/articlejs/base/scripter.js',
        '/articlejs/base/shedit.js',
        '/articlejs/base/shortcuts.js',
        '/articlejs/base/templates.js',
        '/articlejs/base/tpb/config.js',
        '/articlejs/base/tpb/default.css',
        '/articlejs/base/tpb/tools/date.js',
        '/articlejs/base/tpb/tools/ease.js',
        '/articlejs/base/tpb/tools/filter.js',
        '/articlejs/base/tpb/tools/hotkey.js',
        '/articlejs/base/tpb/tools/render.js',
        '/articlejs/base/tpb/tools/spliter.js',
        '/articlejs/base/tpb/tools/templater.js',
        '/articlejs/base/tpb/tools/tloader.js',
        '/articlejs/base/tpb/tools/util.js',
        '/articlejs/base/tpb/tpb.esm.js',
        '/articlejs/base/tpb/user.js',
        '/articlejs/base/tquery/plugins/history.min.js',
        '/articlejs/base/tquery/tquery.min.js',
        '/articlejs/base/types.js',
        '/articlejs/config.js',
        '/articlejs/docs/intro.html',
        '/articlejs/docs/manual.html',
        '/articlejs/docs/article.html',
        '/articlejs/editor.js',
        '/articlejs/favicon.ico',
        '/articlejs/icons/cooljed.png',
        '/articlejs/icons/icon-168.png',
        '/articlejs/index.html',
        '/articlejs/index.js',
        '/articlejs/plugins/coolmd/extend.js',
        '/articlejs/plugins/coolmd/files.json',
        '/articlejs/plugins/coolmd/index.html',
        '/articlejs/plugins/coolmd/logo.png',
        '/articlejs/plugins/coolmd/styles.css',
        '/articlejs/plugins/example/extend.js',
        '/articlejs/plugins/example/files.json',
        '/articlejs/plugins/example/index.html',
        '/articlejs/plugins/example/logo.png',
        '/articlejs/plugins/example/maps.json',
        '/articlejs/plugins/example/styles.css',
        '/articlejs/styles.css',
        '/articlejs/styles/example/codes.css',
        '/articlejs/styles/example/main.css',
        '/articlejs/templates/editor.html',
        '/articlejs/templates/inputs.html',
        '/articlejs/templates/main.html',
        '/articlejs/templates/maps.json',
        '/articlejs/templates/obts/alink.json',
        '/articlejs/templates/obts/codes.json',
        '/articlejs/templates/obts/create.json',
        '/articlejs/templates/obts/etext.json',
        '/articlejs/templates/obts/graph.json',
        '/articlejs/templates/obts/h2header.json',
        '/articlejs/templates/obts/indet2val.json',
        '/articlejs/templates/obts/itexts.json',
        '/articlejs/templates/obts/list1.json',
        '/articlejs/templates/obts/list2.json',
        '/articlejs/templates/obts/list2ps.json',
        '/articlejs/templates/obts/pastes.json',
        '/articlejs/templates/obts/prop1.json',
        '/articlejs/templates/obts/propcss.json',
        '/articlejs/templates/obts/state2val.json',
        '/articlejs/templates/obts/sublist.json',
        '/articlejs/templates/obts/table.json',
        '/articlejs/templates/obts/xsubmit.json',
        '/articlejs/templates/options.html',
        '/articlejs/templates/panel.html',
        '/articlejs/templates/properties.html',
        '/articlejs/templates/styles.html',
        '/articlejs/themes/Example/icons.css',
        '/articlejs/themes/Example/images/icons.png',
        '/articlejs/themes/Example/style.css',
        '/articlejs/themes/beep.ogg',
        '/articlejs/themes/normalize.css',
    ];


/**
 * 缓存就绪处理。
 * @param {String} name 缓存名
 * @param {[String]} files 待缓存文件
 */
async function cacheReady( name, files ) {
    const cache = await caches.open( name );
    await cache.addAll( files );
}


/**
 * 从缓存响应。
 * @param  {FetchEvent} ev 请求事件对象
 * @param  {String} name 缓存名
 * @return {Response}
 */
async function respondCache( ev, name ) {
    let _resp = await caches.match( ev.request );

    if ( _resp ) {
        return _resp;
    }
    console.log( `[Service Worker] Caching new resource: ${ev.request.url}` );
    // 丢弃原有请求的状态直接使用.url，
    // 否则刷新fetch可能会出错（beep.ogg）。
    _resp = await fetch( ev.request.url );

    if ( _resp.ok ) {
        let cache = await caches.open( name );
        cache.put( ev.request, _resp.clone() );
    }
    return _resp;
}



self.addEventListener(
    'install',
    ev => ev.waitUntil( cacheReady(__cName, __appFiles) )
);

self.addEventListener(
    'fetch',
    ev => ev.respondWith( respondCache(ev, __cName) )
);
