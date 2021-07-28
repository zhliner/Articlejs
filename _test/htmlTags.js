/*! $Id: htmlTags.js 2016.03.08 tQuery $
*******************************************************************************
            Copyright (c) 铁皮工作室 2017 MIT License

                @Project: tQuery v0.3.x
                @Author:  风林子 zhliner@gmail.com
*******************************************************************************
*/

(function() {

let tags = [
    // 主结构（单独测试）
    // 'html',
    // 'head',
    // 'body',

    // 明显不会触发事件的元素
    // 'meta',
    // 'base',
    // 'title',
    // 'link',
    // 'style',
    // 'script',
    // 'embed',
    // 'noscript',
    // 'br
    // 'hr',
    // 'wbr',
    // 'datalist',
    // 'dialog',
    // 'slot',
    // 'template',

    // 包含内容的普通元素
    'a',
    'abbr',
    'address',
    'area',
    'article',
    'aside',
    'audio',
    'b',
    'bdi',
    'bdo',
    'blockquote',
    'button',
    'canvas',
    'caption',
    'cite',
    'code',
    'col',
    'colgroup',
    'data',
    'dd',
    'del',
    'details',
    'dfn',
    'div',
    'dl',
    'dt',
    'em',
    'fieldset',
    'figcaption',
    'figure',
    'footer',
    'form',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'header',
    'hgroup',
    'i',
    'iframe',
    'img',
    'input',
    'ins',
    'kbd',
    'label',
    'legend',
    'li',
    'main',
    'map',
    'mark',
    'menu',
    'meter',
    'nav',
    'object',
    'ol',
    'optgroup',
    'option',
    'output',
    'p',
    'param',
    'picture',
    'pre',
    'progress',
    'q',
    'rp',
    'rt',
    'rtc',
    'ruby',
    's',
    'samp',
    'section',
    'select',
    'small',
    'source',
    'span',
    'strong',
    'sub',
    'summary',
    'sup',
    'table',
    'tbody',
    'td',
    'textarea',
    'tfoot',
    'th',
    'thead',
    'time',
    'tr',
    'track',
    'u',
    'ul',
    'var',
    'video',

    // 过时和废弃的元素，不再测试。
    // 'acronym',
    // 'applet',
    // 'basefont',
    // 'bgsound',
    // 'big',
    // 'blink',
    // 'center',
    // 'command',
    // 'content',
    // 'dir',
    // 'element',
    // 'font',
    // 'frame',
    // 'frameset',
    // 'image',
    // 'isindex',
    // 'keygen',
    // 'listing',
    // 'marquee',
    // 'menuitem',
    // 'multicol',
    // 'nextid',
    // 'nobr',
    // 'noembed',
    // 'noframes',
    // 'plaintext',
    // 'shadow',
    // 'spacer',
    // 'strike',
    // 'tt',
    // 'xmp',
];

/**
 * 获取目标元素对象上定义的可用事件名。
 * 注：即获取属性名中前置 on 的属性。
 * @param {Element} el 测试元素
 */
function namesOnEvent( el ) {
    let _buf = [];
    for (let n in el) {
        n = String(n);
        if (n.startsWith('on')) {
            _buf.push(n);
        }
    }
    return _buf;
}


/**
 * 获取元素对象上定义的可调用事件名。
 * 注：作为事件触发调用，如 submit(), click()
 * @param {[String]} names 元素上的可用事件名集
 */
function namesCaller( el ) {
    let _ens = namesOnEvent(el),
        _buf = [];

    for (let n of _ens) {
        let _f = el[n.substring(2)];
        if (_f && $.isFunction(_f)) {
            _buf.push(_f.name);
        }
    }
    return _buf;
}


/**
 * 元素上事件调用会触发事件的记载。
 * 注：作为元素上事件触发后的用户处理器使用。
 * 例：
 * el.click() 会触发 click 事件。
 * frm.submit() 不会触发 submit 事件。
 *
 * @param {[Object]} buf 记录区
 * @param {Event} ev 事件对象
 */
function eventsRaised( buf, ev ) {
    buf.push({
        'name': ev.type,
        'target': ev.target.tagName,
        'currentTarget': ev.currentTarget.tagName,
    });
    ev.preventDefault();
    ev.stopPropagation();
}


/**
 * 在目标元素上调用事件名函数。
 * @param {Element} el 目标元素
 * @param {[String]} evns 事件名称集
 */
function callEvents( el, evns ) {
    evns.forEach( n => el[n]() );
}


function calls() {
    this.forEach( el => callEvents(el, namesCaller(el)) );
}

window.console.info('loaded htmlTags.js');

})();