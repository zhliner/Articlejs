//! $Id: filter.js 2019.09.17 Tpb.Core $
//
// 	Project: Tpb v0.4.0
//  E-Mail:  zhliner@gmail.com
// 	Copyright (c) 2017 - 2019 铁皮工作室  MIT License
//
//////////////////////////////////////////////////////////////////////////////
//
//  渲染过滤器（Render:Filter）
//
//  用于渲染赋值表达式中过滤源数据到目标结果。
//
//
//////////////////////////////////////////////////////////////////////////////
//

const $ = window.$;


//
// this绑定为待处理的数据，返回处理后的结果。
//
const Filter = {
    /**
     * 文本截断。
     * - 按视觉字节（单字节）计算，全角字符记为2个字节；
     * - 若有截断，尾部跟随的标志串长度计算在内（误差1）；
     * this: {String}
     * @param {Number} len 单字节长度
     * @param {String} fix 截断标志串
     */
    cut( len, fix = '...') {
        let _chs = [];

        for ( let ch of this ) {
            len -= viewByte(ch);
            if (len < 0) break;
            _chs.push(ch);
        }
        return len < 0 ? viewEndpad(_chs, fix) : _chs.join('');
    },


    /**
     * Html源码文本化。
     * - 转义文本中Html字符（< => &lt;）；
     * - 数据可为节点元素，转换整个标签（元素自身）；
     * 注：
     * - 结果应当用html方式插入；
     *
     * this {String|Element|Array|Queue}
     * @param {Boolean} br 保留换行标签
     * @param {String} sep 多组连接符
     */
    text( sep = ' ' ) {
        let _txt = this;

        if (typeof _txt == 'string') {
            return $.html(null, _txt);
        }
        return $(_txt).prop('outerHTML').map(txt => $.html(null, txt)).join(sep);
    },


    /**
     * 格式化日期和时间。
     * this {String|Number|Date} Date对象或绝对毫秒数。
     * - 如果now为true，则指当前时间（忽略来源值）；
     * - 格式：{
     *  	yy|yyyy 年
     *  	M|MM 	月
     *  	d|dd 	日
     *  	h|hh 	时
     *  	m|mm 	分
     *  	s|ss 	秒
     *  	S 	    毫秒
     * }
     * 例：
     *   yyyy-MM-dd hh:mm:ss.S => 2017-02-08 16:49:09.643
     *   yy-M-d h:m:s => 17-2-8 16:49:9
     *
     * 注记：
     * - 借用Date的JSON标准格式分解合成；
     * - 输出的是本地时间。JSON仅为借用（假借）；
     *
     * @param {String} fmt 格式串
     * @param {Boolean} now 用当前时间
     */
    date( fmt, now ) {
        let _ss = dateCells(
                now ? Date.now() : getTime(this)
            );
        return fmt.replace(__dateFormat, w => _ss[w] || w );
    },


    /**
     * 首尾空白清除。
     */
    trim() {
        return this.trim();
    },


    /**
     * 空白清理（减为单个空格）。
     */
    clean() {
        return this.trim().replace(/\s+/g, ' ');
    },


    /**
     * 节点封装（通用）。
     * - 不指定标签名时创建一个文本节点；
     * @param  {String} tag 元素标签名
     * @return {Element|TextNode}
     */
    node( tag ) {
        return tag ? $.Element( tag, this ) : $.Text( this );
    },

};


// 友好：
// 内联元素封装（也可由node创建）
[
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
    'code',
    'dfn',
    'samp',
    'kbd',
    's',
    'u',
    'var',
    'bdo',
    'b',
    'i',
].forEach(function( name ) {
    Filter[name] = function() { return $.Element( name, this ); };
});


// date过滤器辅助数据。
const
    // JSON日期格式
    // 2017-02-06T15:29:01.933Z
    __dateJSON = /^(\d{4})-(\d{2})-(\d{2})T(\d+):(\d+):(\d+)\.(\d+)Z$/,

    // 时区与UTC毫秒差
    __timeOffset = new Date().getTimezoneOffset() * 60000,

    // date格式合法词匹配
    __dateFormat = /\by+\b|\bM+\b|\bd+\b|\bh+\b|\bm+\b|\bs+\b|\bS\b/g,

    // 提取对象时间值
    getTime = obj => obj.getTime ? obj.getTime() : parseInt(obj) || __timeOffset;


/**
 * 分解提取Date各部分。
 * @param  {Number} tm 标准毫秒数
 * @return {Object} 各配置组成对象
 */
function dateCells( tm ) {
    tm -= __timeOffset;
    let [ _, yyyy, MM, dd, hh, mm, ss, S ] = new Date(tm).toJSON().match(__dateJSON);
    return {
        yyyy, yy: yyyy.slice(2),
        MM,   M:  +MM,
        dd,   d:  +dd,
        hh,   h:  +hh,
        mm,   m:  +mm,
        ss,   s:  +ss,
        S, _,
    };
}


// cut文本截断辅助。
const
    /**
     * 计算字符的视觉字节。
     * 全角字符记为2个字节。
     * @return {Number}
     */
    viewByte = ch => ch.codePointAt() < 0xff ? 1 : 2,

    /**
     * 计算字符串看起来的字节数。
     * 全角字符按2字节计算，可以正确处理4字节字符。
     * @return {Number}
     */
    viewBytes = str => [...str].reduce( (n, ch) => n + viewByte(ch), 0 );


/**
 * 末尾截断填充。
 * - 按视觉字节计算（单字节）；
 * - 最少截断原则（字符完整）；
 * @param  {Array} chs  字符序列
 * @param  {String} fix 填充字符串
 * @return {String}
 */
function viewEndpad( chs, fix ) {
    let _fix = viewBytes(fix);

    for ( let i = chs.length - 1; i >= 0; i-- ) {
        _fix -= viewByte(chs[i]);
        if (_fix < 0) break;
        chs.pop();
    }
    return chs.join('') + fix;
}


export { Filter };
