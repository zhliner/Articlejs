const
    // SW处理器路径。
    _swfile = '/articlejs/pwa-sw.js',

    // 更新通知事件名。
    _update = 'swupdate',

    // 更新消息来源
    _updateFile = '/articlejs/release.json';


/**
 * 注册ServiceWorker。
 * 如果发现SW更新，发送通知到<body>元素。
 * @param {String} url SW文件路径
 * @param {String} evn 更新通知事件名
 * @param {String} msgsrc 消息来源文件路径
 */
async function registerServiceWorker( url, evn, msgsrc ) {
    const _reg = await navigator.serviceWorker.register( url );

    if ( _reg.waiting ) {
        // eslint-disable-next-line no-undef
        return $.trigger( document.body, evn, msgsrc );
    }
    _reg.addEventListener( 'updatefound', () => updateFound(_reg, evn, msgsrc) );
}


/**
 * 找到更新并完成通知。
 * @param {ServiceWorkerRegistration} reg SW注册对象
 * @param {String} evn 通知事件名
 * @param {String} msgsrc 消息来源文件路径
 */
function updateFound( reg, evn, msgsrc ) {
    let _ins = reg.installing;
    // eslint-disable-next-line no-undef
    _ins.onstatechange = () => _ins.state === 'installed' && navigator.serviceWorker.controller && $.trigger( document.body, evn, msgsrc );
}


// PWA 支持
// 独立出来以便于发布覆盖不影响。
if ( 'serviceWorker' in navigator ) {
    // navigator.serviceWorker.getRegistrations()
    //     .then( regs => {
    //         for ( const reg of regs ) reg.unregister();
    //         // navigator.serviceWorker.register( '/articlejs/pwa-sw.js' );
    //     });
    registerServiceWorker( _swfile, _update, _updateFile );
}
