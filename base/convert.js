//! $Id: convert.js 2019.10.11 Articlejs.Libs $
//
// 	Project: Articlejs v0.1.0
//  E-Mail:  zhliner@gmail.com
// 	Copyright (c) 2017 - 2019 铁皮工作室  MIT License
//
//////////////////////////////////////////////////////////////////////////////
//
//	内容单元的转换定义。
//
//
///////////////////////////////////////////////////////////////////////////////
//

const $ = window.$;


//
// 自取元素标签集。
// 取元素自身（outerHTML）作为内容使用的元素。
// 结构单元（rb/rp/track等）不能单独使用，因此不适用。
// 注：大部分为内联元素。
//
const outerTags = new Set([
    'audio',
    'video',
    'picture',
    'strong',
    'em',
    'q',
    'abbr',
    'cite',
    'small',
    'time',
    'del',
    'ins',
    'sub',
    'sup',
    'mark',
    'ruby',
    'dfn',
    'samp',
    'kbd',
    's',
    'u',
    'var',
    'bdo',
    'meter',
    'a',
    'code',
    'img',
    'i',
    'b',
    'span',  // :blank
    'hr',
]);


//
// 数据转换映射。
// 针对目标类型，提供最合适的数据集。
// { tagName: function( el, conName ) }
// name: 排除 hr,space,blank
// 返回值：
// 按目标类型结构提供一个值（单成员）或值集（多成员）。
// 值为null表示无，空串是有值（清空目标）。
//
// @param  {Element} xxx 取值元素
// @param  {String} name 目标内容名
// @return {Node|[Node]|String|[String]}
//
const dataConvs = {

    abstract( el, name ) {
        //
    },

    toc( el, name ) {
        //
    },

    article( el, name ) {
        //
    },

    s1( el, name ) {
        //
    },

    s2( el, name ) {
        //
    },

    s3( el, name ) {
        //
    },

    s4( el, name ) {
        //
    },

    s5( el, name ) {
        //
    },

    dl( el, name ) {
        //
    },

    figure( el, name ) {
        //
    },

    pre( el, name ) {
        //
    },

    li( el, name ) {
        //
    },

    table( el, name ) {
        //
    },

    thead( el, name ) {
        //
    },

    tbody( el, name ) {
        //
    },

    tfoot( el, name ) {
        //
    },

    tr( el, name ) {
        //
    },

};


// 列表元素取值。
// 不区分由普通列表衍生的内容单元。
// 它们是：seealso,references,codelist,cascade。
///////////////////////////////////////////////////////////
[
    'ul',
    'ol',
]
.forEach(function( n ) {
    dataConvs[n] = (el, name) => list(el, name);
});


// 小区块取值。
// 适用：header/footer, blockquote, aside, details。
///////////////////////////////////////////////////////////
[
    'header',
    'footer',
    'blockquote',
    'aside',
    'details',
]
.forEach(function( n ) {
    //
});


// 内容行元素取值。
// 包含不能作为内联元素的<td>,<th>和微结构单元<rb>,<rp>,<rt>。
///////////////////////////////////////////////////////////
[
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'p',
    'address',
    'caption',
    'summary',
    'figcaption',
    'dt',
    'dd',

    'th',
    'td',
    'rb',
    'rp',
    'rt',
]
.forEach(function( n ) {
    dataConvs[n] = el => $.contents(el);
});


//
// 取值辅助
///////////////////////////////////////////////////////////////////////////////


// 列表元素取值。
// 适用：ul, ol
function list( el, name ) {
    let _ss;
    switch (name) {
        case 'abstract':
            // 合并为单个段落
            return [ null, $.text(el) ];

        case 'toc':
            return [ null, $.children(el) ];

        case 'cascadeli':
            // 目标自行合并
            return [ null, el ];

        case 'seealso':
        case 'references':
        case 'ul':
        case 'ol':
        case 'cascade':
            return $.children(el);

        case 'header':  // 每<li>对应一行（p）
        case 'footer':  // 同上
        case 'address': // 同上
        case 'p':       // 接受内联单元数组
        case 'table':   // 每项为一个单元格内容
        case 'thead':   // 同上
        case 'tbody':   // 同上
        case 'tfoot':   // 同上
        case 'tr':      // 同上
            return listSubs(el);

        // 合法子类型。
        // case 'article':
        // case 's1':
        // case 's2':
        // case 's3':
        // case 's4':
        // case 's5':
            // 独立内容单元
            // 注：章节目标特殊逻辑自行处理。
            // return el;

        case 'codelist':
            // 每<li>对应一行代码。
            return $.children(el).map( li => codeLine(li) );

        case 'dl':
            _ss = listSubs(el);
            // 首行充当标题<dt>
            return [ textLine( _ss.shift() ), _ss ];

        case 'figure':
            // 分离文本为标题，图片为内容。
            return [ cleanText($.text(el)), $.find(el, 'img') ];

        case 'blockquote':
        case 'aside':
        case 'details':
            return [ null, listSubs(el) ];

        case 'codeblock':
        case 'pre':
            // 换行友好。
            return textSubs(el).join('\n');
    }
    // codeli, ...
    // 仅取文本。
    return $.text( el );
}


// 小区块取值（<header>）。
// 含可选的<h4>标题，内容平级。
function smallBlock( el, name ) {
    // ?
    let _ss;
    switch (name) {
        case 'abstract':
            // 合并为单个段落
            return [ null, $.text(el) ];

        case 'toc':
            return [ null, $.children(el) ];

        case 'cascadeli':
            // 目标自行合并
            return [ null, el ];

        case 'seealso':
        case 'references':
        case 'ul':
        case 'ol':
        case 'cascade':
            return $.children(el);

        case 'header':  // 每<li>对应一行（p）
        case 'footer':  // 同上
        case 'address': // 同上
        case 'p':       // 接受内联单元数组
        case 'table':   // 每项为一个单元格内容
        case 'thead':   // 同上
        case 'tbody':   // 同上
        case 'tfoot':   // 同上
        case 'tr':      // 同上
            return listSubs(el);

        // 合法子类型。
        // case 'article':
        // case 's1':
        // case 's2':
        // case 's3':
        // case 's4':
        // case 's5':
            // 独立内容单元
            // 注：章节目标特殊逻辑自行处理。
            // return el;

        case 'codelist':
            // 每<li>对应一行代码。
            return $.children(el).map( li => codeLine(li) );

        case 'dl':
            _ss = listSubs(el);
            // 首行充当标题<dt>
            return [ textLine( _ss.shift() ), _ss ];

        case 'figure':
            // 分离文本为标题，图片为内容。
            return [ cleanText($.text(el)), $.find(el, 'img') ];

        case 'blockquote':
        case 'aside':
        case 'details':
            return [ null, listSubs(el) ];

        case 'codeblock':
        case 'pre':
            // 换行友好。
            return textSubs(el).join('\n');
    }
    // codeli, ...
    // 仅取文本。
    return $.text( el );
}


//
// 工具函数
///////////////////////////////////////////////////////////////////////////////


/**
 * 提取纯代码内容。
 * 即剔除封装的<code>元素。
 * 注：仅限于直接封装或封装<code>的容器元素。
 * @param  {Element} el 容器元素
 * @return {String} 代码行
 */
function codeLine( el ) {
    let _n = el.nodeName.toLowerCase();

    if ( _n == 'code' ) {
        return $.text( el );
    }
    return codeLine( el.firstElementChild );
}


/**
 * 获取子元素文本集。
 * @param  {Element} box 容器元素
 * @return {[String]}
 */
function textSubs( box ) {
    return $.children(box).map( e => $.text(e) );
}


// 获取子元素内容集。
// 注：以子元素为数组单元，获取内联内容集。
function listSubs( box ) {
    return $.children( box ).map( el => inlines(el) );
}


function textLine( els ) {
    return els.map( el => el.textContent ).join('');
}


/**
 * 获取内联节点集。
 * @param  {Element} box 容器元素
 * @return {[Array, Number]}
 */
function _inlines( box ) {
    let _buf = $.contents(box),
        _deep = 0;

    for (let i = 0; i < _buf.length; i++) {
        let _nd = _buf[i];
        if ( !isOuter(_nd) ) {
            [_buf[i], _deep] = _inlines( _nd );
        }
    }
    return [_buf, _deep + 1];
}


/**
 * 获取内容内联节点集。
 * @param {Element} box 容器元素
 * @return {[Node|Element]}
 */
function inlines( box ) {
    let [buf, deep] = _inlines(box);

    if ( deep == 1 ) {
        return buf;
    }
    if ( buf.flat ) {
        return buf.flat( deep - 1 );
    }
    return buf.reduce( (b, v) => b.concat(v), [] );
}


/**
 * 是否为内联单元。
 * @param  {Node} node 目标节点
 * @return {Boolean}
 */
function isOuter( node, tag ) {
    return node.nodeType == 3 ||
        outerTags.has( tag || node.nodeName.toLowerCase() );
}


/**
 * 清理文本空白。
 * 清除首位空白，内部连续空白合并为单个空格。
 * @param  {String} txt 原始文本
 * @return {String}
 */
function cleanText( txt ) {
    return txt.trim().replace( /\s+/, ' ' );
}


//
// 导出
///////////////////////////////////////////////////////////////////////////////


/**
 * 获取转换数据。
 * @param {Element} self 取值元素
 * @param {String} name 目标内容名
 */
function getData( self, name ) {
    let _tag = self.nodeName.toLowerCase(),
        _fun = dataConvs[_tag];

    if ( !_fun ) {
        window.console.error(`<${_tag}> element can not be converted.`);
        return null;
    }
    switch (name) {
        case 'hr':
        case 'space':
        case 'blank':
            return null;
    }
    return isOuter(self, _tag) ? self : _fun(self, name);
}


export { getData };
