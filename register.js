// PWA 支持
// 独立出来以便于发布覆盖不影响。
if ( 'serviceWorker' in navigator ) {
    navigator.serviceWorker.getRegistrations()
        .then( regs => {
            for ( const reg of regs ) reg.unregister();
            // navigator.serviceWorker.register( '/articlejs/pwa-sw.js' );
        });
}
