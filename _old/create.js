//
// 编码存留参考。
//

//
// 空元素创建。
// 仅涉及设置元素特性集操作。
// tag == NAME
/////////////////////////////////////////////////
[
    'img',
    'track',
    'source',
]
.forEach(function( tag ) {
    /**
     * @param  {Object} opts 属性配置集
     * @return {Element}
     */
    Content[ tag ] = function( opts ) {
        return create( tag, opts );
    };
});


//
// 内容单元创建。
// 内容：纯文本（text）或内联单元/集。
// 包含元素特性设置。
// tag == NAME
/////////////////////////////////////////////////
[
    'a',            // cons, {href, target}
    'strong',       // cons
    'em',           // cons
    'q',            // cons, {cite}
    'abbr',         // text, {title}
    'cite',         // cons
    'small',        // cons
    'del',          // cons, {datetime, cite}
    'ins',          // cons, {datetime, cite}
    'sub',          // cons
    'sup',          // cons
    'mark',         // cons
    'dfn',          // cons, {title}
    'samp',         // cons
    'kbd',          // text
    's',            // cons
    'u',            // cons
    'var',          // text
    'bdo',          // cons, {dir}
    'rb',           // text
    'rt',           // text
    'rp',           // text
    'p',            // cons
    'pre',          // cons
    'address',      // cons
    'h1',           // cons
    'h2',           // cons
    'h3',           // cons
    'h4',           // cons
    'h5',           // cons
    'h6',           // cons
    'summary',      // cons
    'figcaption',   // cons
    'caption',      // cons
    'li',           // cons, {value:Number} // 当前起始编号
    'dt',           // cons
    'dd',           // cons
    'th',           // cons // 暂不支持任何属性设置
    'td',           // cons // 同上
]
.forEach(function( name ) {
    /**
     * 字符串实参优化为数组。
     * @param {Node|[Node]|String} cons 内容（集）
     * @param {Object} opts 属性配置，可选
     */
    Content[ name ] = function( cons, opts ) {
        if ( typeof cons === 'string' ) {
            cons = [cons];
        }
        let _el = create( name, opts );

        return $.append( _el, cons ), _el;
    };
});


//
// 定制内容元素创建。
// 内容：纯文本或内联节点（集）。
// [ role/NAME, tag ]
/////////////////////////////////////////////////
[
    [ 'explain',    'span' ],
    [ 'orz',        'code' ],
    [ 'note',       'p' ],
    [ 'tips',       'p' ],
]
.forEach(function( names ) {
    /**
     * 字符串实参优化为数组。
     * @param {Node|[Node]|String} cons 内容（集）
     */
    Content[ names[0] ] = function( cons ) {
        if ( typeof cons === 'string' ) {
            cons = [cons];
        }
        let _el = create(
                names[1],
                null,
                names[0].toUpperCase()
            );
        $.append( _el, cons );

        return $.attr( _el, 'role', names[0] );
    };
});


//
// 定制结构元素创建。
// 内容：结构子元素（非源码）。
// [ role/NAME, tag ]
/////////////////////////////////////////////////
[
    [ 'abstract',   'header' ],     // header/h3, p...
    [ 'toc',        'nav' ],        // nav/h3, ol:cascade/li/h4, ol
    [ 'seealso',    'ol' ],         // ul/li/#text
    [ 'reference',  'ul' ],         // ol/li/#text
    [ 's1',         'section' ],    // section/h2, header?, s2 | {content}, footer?
    [ 's2',         'section' ],    // section/h2, header?, s3 | {content}, footer?
    [ 's3',         'section' ],    // section/h2, header?, s4 | {content}, footer?
    [ 's4',         'section' ],    // section/h2, header?, s5 | {content}, footer?
    [ 's5',         'section' ],    // section/h2, header?, {content}, footer?
    [ 'codelist',   'ol' ],         // ol/li/code
    [ 'ulx',        'ul' ],         // ul/li/h4, ul|ol
    [ 'olx',        'ol' ],         // ol/li/h4, ol|ul
    [ 'cascade',    'ol' ],         // ol/li/h4, ol
    [ 'codeblock',  'pre' ],        // pre/code
    [ 'blank',      'div' ],        // div
    [ 'space',      'span' ],       // span
]
.forEach(function( names ) {
    /**
     * @param  {...Element} nodes 子元素序列
     * @return {Element}
     */
    Content[ names[0] ] = function( ...nodes ) {
        let _box = create(
                names[1],
                null,
                names[0].toUpperCase()
            );
        if ( nodes.length ) {
            $.append( _box, nodes );
        }
        return $.attr( _box, 'role', names[0] );
    };
});


//
// 中间定制结构元素创建。
// 内容：结构子元素（非源码或文本）。
// [ NAME, tag ]
/////////////////////////////////////////////////
[
    [ 'codeli',      'li' ],  // li/code
    [ 'ali',         'li' ],  // li/a
    [ 'ah4li',       'li' ],  // li/h4/a
    [ 'ah4',         'h4' ],  // h4/a
    [ 'ulxh4li',     'li' ],  // li/h4, ul|ol
    [ 'olxh4li',     'li' ],  // li/h4, ol|ul
    [ 'cascadeh4li', 'li' ],  // li/h4, ol
    [ 'figimgp',     'p' ],   // p/img, span
]
.forEach(function( names ) {
    /**
     * @param  {...Element} nodes 子元素序列
     * @return {Element}
     */
    Content[ names[0] ] = function( ...nodes ) {
        let _box = create(
                names[1],
                null,
                names[0].toUpperCase()
            );
        return $.append( _box, nodes ), _box;
    };
});


//
// 结构单元创建。
// 内容：结构子元素。
// tag/NAME
/////////////////////////////////////////////////
[
    'header',       // h3, p...
    'footer',       // h3, p...
    'article',      // header?, s1 | {content}, footer?, hr?
    'ul',           // li...
    'ol',           // li...
    'dl',           // dt, dd...
    'figure',       // figcaption, p/img, span:explain
    'blockquote',   // h3, p...
    'aside',        // h3, p...
    'details',      // summary, p...
]
.forEach(function( name ) {
    /**
     * @param  {...Element} nodes 子元素序列
     * @return {Element}
     */
    Content[ name ] = function( ...nodes ) {
        let _box = create( name );
        $.append( _box, nodes );
        return _box;
    };
});
