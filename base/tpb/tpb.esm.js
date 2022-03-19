/*! Tpb/tQuery v0.4.1 | (c) zhliner@gmail.com 2021.12.05 | MIT License */
import t,{ACCESS as e,EXTENT as n,DEBUG as a,Globals as r,PREVCELL as i,JUMPCELL as o,HEADCELL as s,ChainStore as l,TplrName as c,TplsPool as u,DataStore as d,evnidDlmt as _,TLoader as f,tplInit as h}from"./config.js";import{Util as p}from"./tools/util.js";import{Ease as m}from"./tools/ease.js";import{format as g}from"./tools/date.js";import{Spliter as y,UmpCaller as w,UmpString as b,UmpChars as v}from"./tools/spliter.js";import{Render as x}from"./tools/render.js";import{obtAttr as A,Templater as E}from"./tools/templater.js";
//! $ID: base.js 2021.10.11 Tpb.Base $
function $(e,n,a,r){return"Object"==t.type(e)?[t.assign(r[n]||{},e,$)]:t.isFunction(e)?(e.name.startsWith("bound ")||(e=e.bind(a)),[S(e,a[`__${n}`],a[`__${n}_x`])]):null}function M(e,n,a,r){return"Object"==t.type(e)?[t.assign(r[n]||{},e,M)]:t.isFunction(e)?[S(e,a[`__${n}`],a[`__${n}_x`])]:null}function S(t,a,r){return r&&(t[e]=!0),void 0!==a&&(t[n]=a),t}function j(t,e,a,r){let i=e.split("."),o=i.pop();void 0!==r&&(a[n]=r),(k(i,t)||t)[o]=a}function k(e,n){let a=n;for(const r of e||"")if(a=n[r],a){if("Object"!==t.type(a))throw new Error(`the ${r} field is not a Object.`)}else n[r]=a={},n=a;return a}function C(t,e,n,a,r){let i=k(t?t.split("."):[],r);for(const t of n){let n=e[`__${t}`];void 0===n&&(n=a),i[t]=S(e[t].bind(e),n,e[`__${t}_x`])}}
//! $ID: pbs.base.js 2019.08.19 Tpb.Base $
const O={1:"trimStart",0:"trim","-1":"trimEnd"},N=/\s+/,T=/(\s)(\s*)/g,P=[/rgba?\(\s*([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.%]+))?\s*\)/,/rgba?\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.%]+))?\s*\)/],R=/^#(?:[0-9A-F]{3}|[0-9A-F]{6}(?:[0-9A-F]{2})?)$/i,F={},q=Symbol("Range-store"),U={pass(t,...e){let n=t.data;if(e.length&&(n=e.includes(n)),!n)return Promise.reject()},__pass:1,end(t,...e){let n=t.data;if(e.length&&(n=e.includes(n)),n)return Promise.reject()},__end:1,exit:()=>Promise.reject(),__exit:null,avoid(t,e){let n=t.data;if(void 0===n||n)return t.event.preventDefault(),e},__avoid:-1,stop(t,e){let n=t.data;if(void 0===n||n)return t.event.stopPropagation(),e},__stop:-1,stopAll(t,e){let n=t.data;if(void 0===n||n)return t.event.stopImmediatePropagation(),e},__stopAll:-1,loop(t,e){a&&Y(0,"[loop] too many cycles."),t.data&&t.entry(e)},__loop:1,effect(t,e){a&&Y(1,"[effect] too many cycles."),t.data&&requestAnimationFrame((()=>t.entry(e)))},__effect:1,pop(t,e,n=1){1==n?e.tpop():e.tpops(n)},__pop_x:!0,pick(t,e,n){e.tpick(n)},__pick_x:!0,clip(t,e,n,a=1){e.tsplice(n,a)},__clip_x:!0,index(e,n,...a){let r=a[0];if(t.isArray(r))return n.tslice(r[0],r[1]);n.tindex(r,...a)},__index_x:!0,tmp(t,e,...n){e.tpush(...n)},__tmp_x:!0,nil:(t,e,n)=>void 0===t.data||t.data?e.undefined():n,__nil:-1,__nil_x:!0,push(t,e,...n){void 0!==t.data&&n.push(t.data),n.length>0&&e.push(...n)},__push:0,__push_x:!0,dup(t,e,n=1){let a=e.tops(1)[0];for(;n-- >0;)e.push(a)},__dup_x:!0,dups(t,e,n=1){n>0&&e.push(...e.tops(n))},__dups_x:!0,pack:(t,e,n=1)=>n>0?e.pops(n):[],__pack_x:!0,move(t,e,n,a=1){e.push(...e.splice(n,a))},__move_x:!0,part:(t,e,n,a)=>e.slice(n,a),__part_x:!0,spread(e,n){let a=e.data;n.push(...t.isArray(a)?a:[a])},__spread:1,__spread_x:!0,vain(t,e,n=1){1==n?e.pop():e.pops(n)},__vain_x:!0,env(t,e,n){if(void 0===n){let t=r.get(e);return void 0===t?null:t}null===n?r.delete(e):r.set(e,n)},__env:null,sess(t,e,n){if(void 0===n)return window.sessionStorage.getItem(e);z(window.sessionStorage,e,n)},__sess:null,local(t,e,n){if(void 0===n)return window.localStorage.getItem(e);z(window.localStorage,e,n)},__local:null,$if:(t,e,n)=>t.data?e:n,__$if:1,$case:(t,...e)=>e.map((e=>e===t.data)),__$case:1,$switch(t,...e){let n,a;for([n,a]of t.data.entries())if(a)return e[n];let r=e[n+1];return void 0===r?null:r},__$switch:1,or:(t,e,n)=>void 0!==n?t.data===n?e:t.data:t.data||e,__or:1,and:(t,e,n)=>void 0!==n?t.data===n?e:t.data:t.data&&e,__and:1,vtrue(t,e){for(const n of t.data)if(n&&(!e||n.length>0))return n;return null},__vtrue:1},I={unique:(e,n)=>t.isCollector(e.data)?e.data.unique(e.data,n):t.unique(e.data,n),__unique:1,sort:(e,n)=>t.isCollector(e.data)?e.data.sort(n):Array.from(e.data).sort(n),__sort:1,reverse(e){let n=e.data;return t.isArray(n)?t.isCollector(n)?n.reverse():Array.from(n).reverse():n.reverse()},__reverse:1,mix(t,e,n=0){if(n<0)throw new Error(`[${n}] must be a positive integer.`);let a=e.data(n);return a[0].map(((t,e)=>a.map((t=>t[e]))))},__mix_x:!0,sum(t,e,n=0,a=1){if(n<0)throw new Error(`[${n}] must be a positive integer.`);return e.data(n).flat(a).reduce(((t,e)=>t+e),0)},__sum_x:!0,clean:(e,n,a)=>(t.isArray(e.data)?J:B)(e.data,n,a),__clean:1,datetime:(t,e="yyyy-MM-dd hh:mm")=>g(t.data,e),__datetime:1,time:(t,e)=>(void 0===e&&(e=!!t.data.getSeconds()),g(t.data,e?"hh:mm:ss":"hh:mm")),__time:1,add:(t,e)=>L(t.data,(t=>t+e)),__add:1,sub:(t,e)=>L(t.data,(t=>t-e)),__sub:1,mul:(t,e)=>L(t.data,(t=>t*e)),__mul:1,div:(t,e)=>L(t.data,(t=>t/e)),__div:1,idiv:(t,e)=>L(t.data,(t=>parseInt(t/e))),__idiv:1,mod:(t,e)=>L(t.data,(t=>t%e)),__mod:1,pow:(t,e)=>L(t.data,(t=>t**e)),__pow:1,neg:t=>L(t.data,(t=>-t)),__neg:1,vnot:t=>L(t.data,(t=>!t)),__vnot:1,divmod:(t,e)=>L(t.data,(t=>[parseInt(t/e),t%e])),__divmod:1,abs:t=>L(t.data,(t=>Math.abs(t))),__abs:1,ceil:t=>L(t.data,(t=>Math.ceil(t))),__ceil:1,floor:t=>L(t.data,(t=>Math.floor(t))),__floor:1,round:t=>L(t.data,(t=>Math.round(t))),__round:1,trunc:t=>L(t.data,(t=>Math.trunc(t))),__trunc:1,log:t=>L(t.data,(t=>Math.log(t))),__log:1,log2:t=>L(t.data,(t=>Math.log2(t))),__log2:1,log10:t=>L(t.data,(t=>Math.log10(t))),__log10:1,sin:t=>L(t.data,(t=>Math.sin(t))),__sin:1,cos:t=>L(t.data,(t=>Math.cos(t))),__cos:1,tan:t=>L(t.data,(t=>Math.tan(t))),__tan:1,sqrt:t=>L(t.data,(t=>Math.sqrt(t))),__sqrt:1,cbrt:t=>L(t.data,(t=>Math.cbrt(t))),__cbrt:1,sinh:t=>L(t.data,(t=>Math.sinh(t))),__sinh:1,cosh:t=>L(t.data,(t=>Math.cosh(t))),__cosh:1,tanh:t=>L(t.data,(t=>Math.tanh(t))),__tanh:1,acos:t=>L(t.data,(t=>Math.acos(t))),__acos:1,acosh:t=>L(t.data,(t=>Math.acosh(t))),__acosh:1,asin:t=>L(t.data,(t=>Math.asin(t))),__asin:1,asinh:t=>L(t.data,(t=>Math.asinh(t))),__asinh:1,atan:t=>L(t.data,(t=>Math.atan(t))),__atan:1,atanh:t=>L(t.data,(t=>Math.atanh(t))),__atanh:1,random:(t,e,n=1)=>n>1?function(t,e){let n=new Array(t).fill();if(null==e)return n.map((()=>Math.random()));return n.map((()=>Math.floor(Math.random()*Math.floor(e))))}(n,e):void 0===e?Math.random():Math.floor(Math.random()*Math.floor(e)),__random:null,max:(t,...e)=>Math.max(...e.concat(t.data)),__max:1,min:(t,...e)=>Math.min(...e.concat(t.data)),__min:1,eq:(t,e)=>L(t.data,(t=>t===e)),__eq:1,neq:(t,e)=>L(t.data,(t=>t!==e)),__neq:1,lt:(t,e)=>L(t.data,(t=>t<e)),__lt:1,lte:(t,e)=>L(t.data,(t=>t<=e)),__lte:1,gt:(t,e)=>L(t.data,(t=>t>e)),__gt:1,gte:(t,e)=>L(t.data,(t=>t>=e)),__gte:1,eqarr:(t,e)=>t.data.length==e.length&&t.data.every(((t,n)=>t===e[n])),__eqarr:1,isNaN:t=>L(t.data,(t=>isNaN(t))),__isNaN:1,contains:(e,n)=>t.contains(e.data[0],e.data[1],n),__contains:2,test:(t,e)=>t.data.test(e),__test:1,within:(t,e,n)=>e<=t.data&&t.data<=n,__within:1,inside:(t,...e)=>e.includes(t.data),__inside:1,both(t,e){let[n,a]=t.data;return e?!0===n&&!0===a:!(!n||!a)},__both:2,either(t,e){let[n,a]=t.data;return e?!0===n||!0===a:!(!n&&!a)},__either:2,every:(e,n)=>t.every(e.data,n||(t=>t),null),__every:1,some:(e,n)=>t.some(e.data,n||(t=>t),null),__some:1,exist:(t,e)=>N.test(e)?e.split(N).map((e=>void 0!==t.data[e])):void 0!==t.data[e],__exist:1,trim:(t,e=0)=>L(t.data,((t,e)=>t[e]()),O[e]),__trim:1,trims:(t,e="$1")=>L(t.data,(t=>t.replace(T,e))),__trims:1,substr:(t,e,n)=>L(t.data,(t=>t.slice(e,n))),__substr:1,replace:(t,...e)=>L(t.data,(t=>t.replace(...e))),__replace:1,split:(e,n,a,r)=>L(e.data,(e=>t.split(e,n,a,r))),__split:1,repeat:(t,e)=>L(t.data,(t=>t.repeat(e))),__repeat:1,caseUpper:(t,e)=>L(t.data,(t=>{return n=t,e?n.replace(/^[a-z]/g,(t=>t.toUpperCase())):n.toUpperCase();var n})),__caseUpper:1,caseLower:t=>L(t.data,(t=>t.toLowerCase())),__caseLower:1,rgb16(t){let e=t.data;return R.test(e)?4===e.length?D(e):e:L(e,(t=>function(t){let e=null;for(const n of P)if(e=t.match(n),e)break;return e&&function(t,e,n,a=""){if(a){let t=parseFloat(a);a=255*(a.includes("%")?t/100:t)}return`#${W(+t)}${W(+e)}${W(+n)}`+(a&&W(a))}(...e.slice(1))}(t)))},__rgb16:1,rgba:(t,e)=>isNaN(e)?t.data:L(t.data,(t=>function(t,e){4===t.length?t=D(t):9===t.length&&(t=t.substring(0,7));return t+W(e)}(t,e))),__rgba:1,exec:(t,...e)=>t.data(...e),__exec:1,calc:(t,e)=>new Function("$",`return ${e};`)(t.data),__calc:1,hotKey:(t,e,...n)=>t.data.fire(e,t.event,...n),__hotKey:1,xRange(t,e=q){if(void 0===t.data)return F[e];t.data&&(F[e]=t.data)},__xRange:-1,addRange(t,e=!0){let n=window.getSelection();return e&&n.removeAllRanges(),n.addRange(t.data),t.data},__addRange:1,exeCmd:(t,e,n)=>(t.data&&t.data.focus(),document.execCommand(e,!1,n)),__exeCmd:-1,clipboard(t,e="text/plain"){if(void 0===t.data)return t.event.clipboardData.getData(e);t.event.clipboardData.setData(e,t.data)},__clipboard:-1};function L(e,n,...a){return t.isArray(e)?e.map((t=>n(t,...a))):n(e,...a)}function z(t,e,n){return null===e?t.clear():null===n?t.removeItem(e):void t.setItem(e,n)}function D(t){return"#"+t.substring(1).split("").map((t=>t+t)).join("")}function W(t){return(t=Math.floor(t))<16?`0${t.toString(16)}`:t.toString(16)}function J(e,n,a){for(const r of e)t.isArray(r)?J(r,n,a):B(r,n,a);return e}function B(t,e,n){for(const a of Object.keys(t))t[a]===e&&(t[a]=n,void 0===t[a]&&delete t[a]);return t}function K(){this._prev.next=null}["not","has","filter","map","each"].forEach((function(e){I[e]=function(n,a){return t.isCollector(n.data)?n.data[e](a):t[e](n.data,a)},I[`__${e}`]=1})),["slice","flat","concat","splice"].forEach((function(t){I[t]=function(e,...n){return e.data[t](...n)},I[`__${t}`]=1})),K[i]=!0;const X=[0,0];function V(t,e,n,a){t.data?(a>0&&e.pops(a),this.next=function(t,e){for(;e--&&t;)t=t.next;return t}(this._next,n)):this.next=this._next}function Y(t,e){if(!(X[t]++<65536))throw new Error(e)}function G(t,e,n=""){if(window.console.info(n,{ev:t.event,evo:t,next:this.next,tmp:e._tmp.slice(),buf:e._buf.slice()}),!1===n)return Promise.reject()}V[n]=1,V[e]=!0,V[o]=!0,G[e]=!0,G[n]=null;const H=t.assign({},U,$);H.delay=function(t,e=1){return new Promise((t=>{window.setTimeout(t,e)}))},H.prune=K,H.jump=V,H.entry=function(t){a&&(X[0]=0,X[1]=0),t.entry=this.call.bind(this.next,t)},H.debug=G;const Q=t.proto(t.assign({},I,$),H),Z={"@":"attr",$:"prop","%":"css","^":"toggleAttr"},tt=new y(";",new w,new b),et=new y(" ",new w),nt=new y("|",new w,new v("[","]")),at=/^[@^]?(\w[\w.:-]*)(?:\(([^]*?)\))?$/,rt=/^(^|[$\w][$\w.-]*)(?:\(([^]*)\))?$/,it=/^\(([^]*?)\)\s*([([{][^]+[)\]}])?$/,ot=/^\(([^]*?)\)$/,st=/^\[([\d:,\s]*)\]$/,lt=/\s*:\s*/,ct=/^\{([^]*)\}$/,ut=/^(\w+)(?:\(([^]*)\))?$/,dt={_:Symbol(0),_1:Symbol(1),_2:Symbol(2),_3:Symbol(3),_4:Symbol(4),_5:Symbol(5),_6:Symbol(6),_7:Symbol(7),_8:Symbol(8),_9:Symbol(9)},_t=Object.keys(dt).reduce(((t,e)=>(t[dt[e]]=+e.substring(1),t)),{}),ft={*obts(t){let e=[...tt.split(t.by)],n=[...tt.split(t.to)],a=0;if(!tt.ready())throw new Error(`{\nby: ${t.by}\nto: ${t.to}\n} has something bad.`);for(let r of tt.split(t.on))r=At(r),r&&(yield{on:r,by:At(e[a]),to:At(n[a])},a++)},on(t){let[e,n]=nt.split(t,1);return[this.evns(e),this.calls(At(n))]},by(t){return this.calls(t)},to(t){if(!t)return"";let[e,n,a]=[...nt.split(t,2)].map(At);return[new vt(e),this.updates(n),this.calls(a)]},evns(t){if(!t)throw new Error("Missing event name definition.");return this._parse(t,yt)},calls(t){return t&&this._parse(t,bt)},updates(t){return t&&this._parse(t,xt)},_parse(t,e){let n=[];for(const a of et.split(t))a&&n.push(new e(a));return n}};
//! $ID: core.js 2019.08.19 Tpb.Base $
class ht{constructor(t){this._pbson=t.on,this._pbsby=t.by,this._pbst2=t.update,this._pbst3=t.next}build(e,n){if(!n.on)throw new Error('OBT must be from "on"');for(const t of ft.obts(n)){let n=ft.on(t.on),a=ft.by(t.by),r=ft.to(t.to),i=new pt;this.binds(e,n[0],i,this.chain(i,n[1],a,r[0],r[1],r[2]))}return t.trigger(e,"obted",null,!1,!1),e}binds(t,e,n,a){for(const r of e){let e=yt.apply(new gt(n),r);e.next=a,this.bind(t,r,e)}}bind(e,n,a){if(n.store)return Mt(e,a);let r=n.once?"one":"on";t[r](e,n.name,n.selector,a,n.capture)}chain(t,e,n,a,r,i){let o=new gt(t),s=this._on(o,t,e);return s=this._by(s,t,n),s=this._query(s,t,a),s=this._update(s,t,r),this._nextStage(s,t,i),o.next}_on(t,e,n){if(n)for(const a of n)t=a.apply(new gt(e,t),this._pbson,t);return t}_by(t,e,n){if(n)for(const a of n)t=a.apply(new gt(e,t),this._pbsby,t);return t}_query(t,e,n){return n?n.apply(new gt(e,t)):t}_update(t,e,n){if(n)for(const a of n)t=a.apply(new gt(e,t),this._pbst2);return t}_nextStage(t,e,n){if(n)for(const a of n)t=a.apply(new gt(e,t),this._pbst3,t);return t}}class pt{constructor(){this._buf=[],this._tmp=[]}data(t){return 0===t?this._tmpall():this._tmp.length?this._tmpval(t):t>0?t>1?this._buf.splice(-t):this._buf.pop():void 0}push(...t){t.forEach((t=>void 0!==t&&this._buf.push(t))),window.STACKDATA&&window.console.info(...t)}undefined(){this._buf.push(void 0)}tops(t){return this._buf.slice(-t)}slice(t,e){return this._buf.slice(t,e)}splice(t,e){return this._buf.splice(t,e)}pop(){return this._buf.pop()}pops(t){return this._buf.splice(-t)}reset(){this._buf.length=0,this._tmp.length=0}tpop(){this._tmp.push(this._buf.pop())}tpops(t){t>1&&this._tmp.push(...this._buf.splice(-t))}tpick(t){let e=this._buf.splice(t,1)[0];this._tmp.push(void 0===e?null:e)}tindex(...t){this._tmp.push(...t.map((t=>this._index(t))))}tsplice(t,e){this._tmp.push(...this._buf.splice(t,e))}tslice(t,e){this._tmp.push(...this._buf.slice(t,e))}tpush(...t){this._tmp.push(...t)}_index(t){let e=this._buf[t<0?this._buf.length+t:t];return void 0===e?null:e}_tmpval(t){return t<0&&(t=-t),t>1?this._tmp.splice(0,t):this._tmp.shift()}_tmpall(){let t=this._tmp.splice(0);return t.length>1?t:t[0]}}const mt=Symbol("stack-key");class gt{constructor(t,e=null){this.next=null,this[mt]=t,this._meth=null,e&&(e.next=this)}handleEvent(t,e){return this[mt].reset(),e.event=t,e.chain=this,this.call(e,this._extra)}setInit(t){return void 0!==t&&(this._extra=t),this}setRest(t){if(!t)return this;let e=_t[t[t.length-1]];return void 0!==e&&(t.pop(),this._rest=e),this}setJUMP(t){return void 0!==t&&(this._next=t),this._next}build(t,e,n,a){return n&&(t=[this[mt]].concat(t||[])),this._meth=e,t&&(this._args=t),null!=a&&(this._want=a),this.setRest(this._args)}call(t,e){return this[mt].push(e),e=this._meth(t,...this.args(t,this._args||[],this._rest)),this.nextCall(t,e)}args(t,e,n){return 0===n?e=e.concat(this[mt].pop()):n>0&&(e=e.concat(this[mt].pops(n))),t.data=this.data(this._want),e}nextCall(t,e){return this.next?e instanceof Promise?void e.then((e=>this.next.call(t,e)),jt):this.next.call(t,e):e}data(t){if(null!=t)return this[mt].data(t)}clone(t,e){let n=Object.assign(new gt,this);return n[mt]=t,this._prev&&(n.prev=e),this._next&&(n._next=!0),e&&(e.next=n,!0===e._next&&(e._next=n)),n}}class yt{constructor(t){let e=t.match(at);if(!e)throw new Error(`[${t}] is invalid`);this.name=e[1],this.selector=null,this.capture,e[2]&&this.slrcap(e[2].trim()),this.once="^"==t[0],this.store="@"==t[0]}slrcap(t){t.endsWith("!true")?(this.capture=!0,t=t.slice(0,-5)):t.endsWith("!false")&&(this.capture=!1,t=t.slice(0,-6)),this.selector=t||null}static apply(t,e){return Reflect.defineProperty(t,s,{value:e,enumerable:!0}),t.build(null,wt)}}function wt(){}class bt{constructor(t){let e=t.match(rt);if(!e)throw new Error(`[${t}] is invalid calling.`);this._meth=e[1]||"push",this._args=Et(e[2])}apply(t,a,r){let s=$t(this._meth,a);if(!s)throw new Error(`${this._meth} is not in pbs:calls.`);return s[o]&&t.setJUMP(!0),r.setJUMP()&&r.setJUMP(t),t[i]&&(t._prev=r),t.build(this._args,s,s[e],s[n])}}class vt{constructor(t){this._slr=t,this._one=!0,this._flr=null,this._matchMore(t.match(it))}apply(t){return t.build([this._slr,this._one,this._flr],kt,!1,-1)}_matchMore(t){t&&(this._slr=t[1],this._flr=this._handle(t[2]),this._one=!1)}_handle(t){return t?ot.test(t)?this._exclude(t.match(ot)[1]):st.test(t)?this._number(t.match(st)[1]):ct.test(t)?this._filter(t.match(ct)[1]):void 0:null}_exclude(e){return n=>n.filter((n=>!t.is(n,e)))}_number(t){let e=t.split(lt);return e.length>1?this._range(e):(e=JSON.parse(`[${t}]`),t=>e.map((e=>t[e])).filter((t=>t)))}_range([t,e]){return t=Math.trunc(t)||0,e=e.trim()?Math.trunc(e):void 0,n=>n.slice(t,e)}_filter(t){let e=new Function("v","i","c",`return ${t};`);return t=>t.filter(e)}}class xt{constructor(t){let e=this.methArgs(t);this._meth=e[0],this._args=Et(e[1])}apply(t,e){let n=$t(this._meth,e);return t.build(this._args,Ct.bind(n),!1,1)}methArgs(t){let e=Z[t[0]];return e?[e,`'${t.substring(1)}'`]:t.match(ut).slice(1)}}function At(t){return(t=t&&t.trim())&&"-"!=t?t:""}function Et(t){return t?new Function(...Object.keys(dt),`return [${t}]`)(...Object.values(dt)):null}function $t(t,e){return(t=t.split(".")).length>1?p.subObj(t,e):e[t[0]]}function Mt(t,e){let n=l.get(t);n||(n=new Map,l.set(t,n)),n.set(e[s].name,e)}function St(t){let e=new pt,n=t.clone(e),a=n;for(;t=t.next;)a=t.clone(e,a);return n}function jt(t){if(t&&a)return"string"!=typeof t?window.console.dir(t):t.startsWith("warn:")?window.console.warn(t.substring(5)):t.startsWith("err:")?window.console.error(t.substring(4)):void window.console.info(t)}function kt(t,e,n,a){let r=t.data;void 0===r&&(r=t.delegate),t.updated=t.primary=function(t,e,n,a,r){switch(e){case"~":return t.target;case"=":return t.current}let i=p.find(e,n,a);return a?i:r?r(i):i}(t,e,r,n,a)}function Ct(t,...e){let n=this(t.updated,t.data,...e);void 0!==n&&(t.updated=n)}
//! $ID: pbs.get.js 2019.08.19 Tpb.Base $
const Ot={0:"chain",1:"target",2:"current",3:"delegate",4:"selector",6:"data",7:"entry",10:"primary",11:"updated"},Nt={1:/^(?:F[0-9]+)$/,2:/^(?:F[0-9]+$|^Escape)$/,3:/^(?:Home|End|PgUp|PgDn)$/,4:/^(?:Arrow(?:Up|Left|Down|Right))$/,5:/^(?:Enter|Delete|Backspace)$/,6:/^(?:b|i|u)$/i},Tt=["altKey","ctrlKey","metaKey","shiftKey"],Pt=/\s+/,Rt=Symbol("mouse-movementX"),Ft=Symbol("mouse-movementY"),qt=Symbol("scroll-horizontal"),Ut=Symbol("scroll-vertical"),It={$:(t,e,n)=>p.find(e,t.data||t.delegate,!0,n),__$:-1,$$:(e,n,a)=>"string"!=typeof n?t(n):p.find(n,e.data||e.delegate,!1,a),__$$:-1,find(e,n,a){let r=e.data;return t.isArray(r)?t(r).find(n,a):t.find(n,r,a)},__find:1,evo:(t,e,n)=>null==n?t:"data"==(n=Ot[n]||n)?e.data(0):t[n],__evo_x:!0,ev:(t,e)=>null==e?t.event:Dt(e,t.event),__ev:null,its:(t,e)=>Lt(t.data,(t=>Dt(e+"",t))),__its:1,len:t=>t.data.length,__len:1,size:t=>t.data.size,__size:1,call:(t,e,...n)=>t.data[e](...n),__call:1,calls:(t,e,...n)=>t.data.map((t=>t[e](...n))),__calls:1,valo:(e,n)=>t.controls(e.data,n).reduce(((e,n)=>(e[n.name]=t.val(n),e)),{}),__valo:1,value(e,n,a){let r=t.controls(e.data||e.delegate,n,!a).map((e=>e&&t.val(e)));return 1===r.length?r[0]:r},__value:-1,checked(e,n,a){let r=t.controls(e.data||e.delegate,n,!a).map((t=>t&&(t.indeterminate?null:t.checked)));return 1===r.length?r[0]:r},__checked:-1,style:(t,e)=>Lt(t.data,(t=>Dt(e,t.style))),__style:1,sRange(t,e){let n=window.getSelection(),a=n.rangeCount>0&&n.getRangeAt(0);if(a)switch(e){case"":return!a.collapsed&&Ht(a)&&a;case!0:return a.collapsed&&a;case!1:return!a.collapsed&&a;case null:return Ht(a)&&a}return a||null},__sRange:null,wRange(e,n){let a=window.getSelection(),r=a.rangeCount>0&&a.getRangeAt(0);return r&&void 0!==e.data?t.contains(e.data,r.commonAncestorContainer,n)&&r:r||null},__wRange:-1,nodeRange(t,e){let n=document.createRange();return n.selectNode(t.data),null!=e&&n.collapse(!!e),n},__nodeRange:1,edbox(e){let n=e.data.nodeType?e.data:e.data.commonAncestorContainer;return t.closest(n,"[contenteditable]")},__edbox:1,int:(t,e)=>Lt(t.data,(t=>parseInt(t,e))),__int:1,float:t=>Lt(t.data,(t=>parseFloat(t))),__float:1,re:(t,e)=>Lt(t.data,(t=>RegExp(t,e))),__re:1,bool:(t,e)=>Lt(t.data,e?t=>{return!!("object"==typeof(e=t)?e&&Object.keys(e).length:e);var e}:t=>!!t),__bool:1,str:(t,e="",n="")=>Lt(t.data,(t=>`${e}${t}${n}`)),__str:1,arr:e=>"string"!=typeof e.data&&e.data[Symbol.iterator]?t.isArray(e.data)?e.data:Array.from(e.data):[e.data],__arr:1,obj:(e,n)=>void 0===n?Object(e.data):Pt.test(n)?function(e,n){if(t.isArray(n))return e.reduce(((t,e,a)=>(t[e]=n[a],t)),{});return e.reduce(((t,e)=>(t[e]=n,t)),{})}(n.split(Pt),e.data):{[n]:e.data},__obj:1,objz:t=>Object.fromEntries(t.data),__objz:1,array(e,n,...a){let r=e.data;return t.isArray(r)||(r=[r]),Kt(r.concat(a),n)},__array:1,arr2j:(t,e)=>t.data.filter(((t,n)=>!!e[n])),__arr2j:1,obj2x(e,n,a){if(!a)return Object.assign(n,e.data);let r=new Set(a.split(Pt));return t.assign(n,e.data,((t,e)=>r.has(e)&&[t]))},__obj2x:1,elem(e,n,a){let r=e.data;return a>0&&(r=Kt(t.isArray(r)?r:[r],a)),t.isArray(r)?t(r).elem(n):t.elem(n,r)},__elem:-1,clone(t,...e){let n=t.data;return"function"===n.clone?n.clone(...e):zt(n,"clone",...e)},__clone:1,clones(t,e,n,a=!0,r){let i=[];for(;e-- >0;)i.push(zt(t.data,"clone",n,a,r));return i},__clones:1,item(e,n){let a=e.data,r=t.isArray(a)&&!t.isCollector(a)?a[n]:t(a).item(n);return void 0===r?null:r},__item:1,wrapAll:(e,n)=>t(e.data).wrapAll(n),__wrapAll:1,handles:(e,n)=>t.handles(e.data,n)||null,__handles:1,attrs:(e,n)=>(n=n.split(Pt),Lt(e.data,(e=>n.map((n=>t.attr(e,n)))))),__attrs:1,props(e,n,a){let r=a?Xt:t.prop;return n=n.split(Pt),Lt(e.data,(t=>n.map((e=>Vt(r(t,e))))))},__props:1,prop(e,n,a){let r=a?Xt:t.prop;return Lt(e.data,(t=>Vt(r(t,n))))},__prop:1,property:(t,e,n)=>(e=e.split(Pt),n?Lt(t.data,(t=>e.reduce(((e,n)=>(e[n]=Xt(t,n),e)),{}))):zt(t.data,"property",e)),__property:1,json:(t,e,n)=>JSON.stringify(t.data,n,e),__json:1,jsons:(t,e,n)=>t.data.map((t=>JSON.stringify(t,n,e))),__jsons:1,JSON:(t,e)=>Lt(t.data,(t=>JSON.parse(t,e))),__JSON:1,URL:(t,e)=>new URL(t.data,e),__URL:1,Date:(t,...e)=>new Date(t.data,...e),__Date:1,Map:(t,e=1)=>1==e?new Map(t.data):Array(e).fill().map((()=>new Map(t.data))),__Map:-1,Set:(t,e=1)=>1==e?new Set(t.data):Array(e).fill().map((()=>new Set(t.data))),__Set:-1,tpl:(t,e,n=c)=>(t.data||u.get(n)).get(e),__tpl:-1,tplr:(t,e=c)=>u.get(e),__tplr:null,node(t,e,n,a){let r=t.data||u.get(c);return Pt.test(e)?e.split(Pt).map((t=>r.node(t,n,a))):r.node(e,n,a)},__node:-1,keys:e=>t.isFunction(e.data.keys)?[...e.data.keys()]:Object.keys(e.data),__keys:1,values:e=>t.isFunction(e.data.values)?[...e.data.values()]:Object.values(e.data),__values:1,func:(t,...e)=>new Function(...e,t.data),__func:1,data(t,e){let n=t.data||t.delegate,r=d.get(n);return a&&!r&&window.console.warn("key:",n,"data-store is undefined."),r?function(t,e){if(!Pt.test(e))return t.get(e);return e.split(Pt).map((e=>t.get(e)))}(r,e):null},__data:-1,einfo:(t,e,n)=>Lt(t.data,(t=>function(t,e,n){let a=t.tagName.toLowerCase();e&&t.id&&(a+=`#${t.id}`);n&&t.classList.length&&(a+="."+[...t.classList].join("."));return a}(t,e,n))),__einfo:1,hasRange:(e,n,a)=>("string"==typeof n&&(n=p.find(n,e.delegate,!0)),e.data&&t.contains(n,e.data.commonAncestorContainer,a)),__hasRange:1,scam(t,e){let n=new Set(Bt(t.event));return e?Yt(e.split(Pt),n):!n.size},__scam:null,SCAM(t,...e){let n=new Set(Bt(t.event));return e.length?e.some((t=>Yt(t.split(Pt),n))):n},__SCAM:null,acmsk(t){let e=Bt(t.event),n=t.event.key;return void 0===n?null:`${e.join("+")}:${n.toLowerCase()}`},__acmsk:null,iskey(t,...e){let n=t.event.key;return e.some((t=>"number"==typeof t?Nt[t].test(n):n===t))},__key:null,chain(t,e,n){let a=l.get(t.data),r=a&&a.get(e);return r?n?St(r):r:Promise.reject("err:chain-store is undefined or chain unfound.")},__chain:1,timeOut(e,n,...a){let r=e.data;return null===n?window.clearTimeout(r):t.isFunction(r.handleEvent)?window.setTimeout(((t,e)=>r.handleEvent(t,e)),n,e.event,Jt(e)):window.setTimeout(r,n,...a)},__timeOut:1,timeTick(e,n,...a){let r=e.data;return null===n?window.clearInterval(r):t.isFunction(r.handleEvent)?window.setInterval(((t,e)=>r.handleEvent(t,e)),n,e.event,Jt(e)):window.setInterval(r,n,...a)},__timeTick:1,ease:(t,e,n)=>new m(e,t.data||"In",n||1/0),__ease:1,easing:(t,e=1,n=0)=>t.data.value()*e+n,__easing:1,animate:(t,e,n)=>Lt(t.data,(t=>t.animate(e,n))),__animate:1,remove(t,e,n){"boolean"==typeof e&&([n,e]=[e]);let a=zt(t.data,"remove",e);if(n)return a},__remove:1,normalize(t){zt(t.data,"normalize")},__normalize:1,clear(e){let n=e.data;t.isArray(n)||(n=[n]),n.forEach((e=>1===e.nodeType?t.val(e,null):e.clear()))},__clear:1,change(e){t(e.data).trigger("change")},__change:1,changes(e,n){Lt(e.data,(e=>t.changes(e,n)))},__changes:1,select(t,e){zt(t.data,"select",e)},__select:1,intoView(e,n,a){t.intoView(e.data,n,a)},__intoView:1,unbind(e,n){let a=e.data;t.isArray(a)||(a=[a]);for(const t of n.trim().split(Pt))Wt(a,t)},__unbind:1,movementX(t,e){let n=t.current;if(null!==e){let a=n[Rt];return Gt((n[Rt]=t.event.pageX)-a||0,+e)}delete n[Rt]},__movementX:null,movementY(t,e){let n=t.current;if(null!==e){let a=n[Ft];return Gt((n[Ft]=t.event.pageY)-a||0,+e)}delete n[Ft]},__movementY:null,scrolledX(t,e){let n=t.current,a=t.data||n;if(null!==e){let t=n[qt];return(n[qt]=a.scrollLeft)-t||0}delete n[qt]},__scrolledX:-1,scrolledY(t,e){let n=t.current,a=t.data||n;if(null!==e){let t=n[Ut];return(n[Ut]=a.scrollTop)-t||0}delete n[Ut]},__scrolledY:-1};function Lt(e,n){return t.isArray(e)?e.map((t=>n(t))):n(e)}function zt(e,n,...a){return t.isArray(e)?t(e)[n](...a):t[n](e,...a)}function Dt(t,e){return Pt.test(t)?t.split(Pt).map((t=>Vt(e[t]))):Vt(e[t])}function Wt(e,n){for(const a of e){let e=l.get(a),r=e&&e.get(n);if(!r){window.console.warn(`Pre-store chain is unfound with [${n}]`);continue}let i=r[s];t.off(a,n.split(_,1)[0],i.selector,r,i.capture)}}function Jt(t){return{target:t.target,current:t.current,selector:t.selector,delegate:t.delegate}}function Bt(t){return Tt.filter((e=>t[e])).map((t=>t.slice(0,-3)))}function Kt(t,e){let n=t.length,a=t[n-1];return t.length=e,n<e?t.fill(a,n):t}function Xt(e,n){return e.indeterminate?null:t.prop(e,n)}function Vt(t){return void 0===t?null:t}function Yt(t,e){return t.length===e.size&&t.every((t=>e.has(t.toLowerCase())))}function Gt(t,e){return 0===t||isNaN(e)?t:t<0?-e:e}function Ht(t){return t.startContainer===t.endContainer||t.startContainer.parentNode===t.endContainer.parentNode}["attr","attribute","xattr","css","cssGets","hasClass","parentsUntil","closest","is","wrap","wrapInner"].forEach((function(t){It[t]=function(e,n){return zt(e.data,t,n)},It[`__${t}`]=1})),["height","width","innerHeight","innerWidth","scroll","scrollTop","scrollLeft","offset","val","html","text","classAll","position","offsetParent"].forEach((function(t){It[t]=function(e){return zt(e.data,t)},It[`__${t}`]=1})),["outerWidth","outerHeight","next","nextAll","nextUntil","nextNode","nextNodes","prev","prevAll","prevUntil","prevNode","prevNodes","children","contents","siblings","siblingNodes","parent","parents","textNodes","Text","fragment"].forEach((function(t){It[t]=function(e,...n){return zt(e.data,t,...n)},It[`__${t}`]=1})),["Element","svg"].forEach((function(e){It[e]=function(n,a){return t.isArray(n.data)?t(n.data)[e](a):t[e](a,n.data)},It[`__${e}`]=1})),["slr","now"].forEach((function(e){It[e]=function(n,...a){return t[e](...a)},It[`__${e}`]=null})),["table","dataName","tags","range","isXML","controls","serialize","queryURL","isArray","isNumeric","isFunction","isCollector","type","kvsMap","pathx","siblingNth","mergeArray"].forEach((function(e){It[e]=function(n,...a){return t[e](n.data,...a)},It[`__${e}`]=1})),["first","last"].forEach((function(e){It[e]=function(n,a){return t(n.data)[e](a)},It[`__${e}`]=1})),["shift","join","includes","indexOf","lastIndexOf"].forEach((function(t){It[t]=function(e,n="",a){return e.data[t](n,a)},It[`__${t}`]=1})),["pbo","pba"].forEach((function(t){It[t]=function(e){return Lt(e.data,(e=>p[t](e)))},It[`__${t}`]=1})),["hidden","lost","disabled","folded","truncated","fulled"].forEach((function(t){It[t]=function(e){return Lt(e.data,(e=>p.pbo(e).includes(t)))},It[`__${t}`]=1})),[["hide","hidden"],["lose","lost"],["disable","disabled"],["fold","folded"],["truncate","truncated"],["full","fulled"]].forEach((function(t){It[t[0]]=function(e,n=1){Lt(e.data,(e=>function(t,e,n){p.pbo(t,[`${Qt[+e]}${n}`])}(e,n,t[1])))},It[`__${t[0]}`]=1})),["empty","unwrap"].forEach((function(t){It[t]=function(e,n){let a=zt(e.data,t,n);if(void 0!==n)return a},It[`__${t}`]=1})),["click","blur","focus","load","play","pause","reset","submit","finish","cancel"].forEach((function(e){It[e]=function(n){if(t.isArray(n.data))return n.data.forEach((n=>t[e](n)));t[e](n.data)},It[`__${e}`]=1}));const Qt=["-","","^"];const Zt=t.proto(t.assign({},It,$),Q),te=Zt,ee={render:(t,e)=>x.update(t.data,e),__render:1,script:(e,n)=>t.script(n,e.data),__script:-1,style:(e,n)=>t.style(n,e.data),__style:-1,GET(t,e,n){let a=t.data||{};return a.method="GET",fetch(n,a).then((t=>t.ok?t[e]():Promise.reject(t.statusText)))},__GET:-1,POST:(t,e,n={})=>("string"==typeof n&&(n={headers:new Headers({"Content-Type":n})}),n.method="POST",n.body=t.data,fetch(e,n).then((t=>t.ok?t:Promise.reject(t.statusText)))),__POST:1},ne=t.proto(t.assign({},ee,$),Zt),ae=/\s+/,re=Symbol("tips-timer"),ie=new Set(["before","after","prepend","append","fill","replace","wrap","wrapInner","html","text","empty","unwrap"]),oe={bind(t,e,n,a){_e("on",t,e,n,a)},once(t,e,n){_e("one",t,e,n)},on(e,n,a,r,i,o){if(t.isArray(e))return t(e).on(a,r,n,i,o);t.on(e,a,r,i,o)},one(e,n,a,r,i){if(t.isArray(e))return t(e).one(a,r,n,i);t.one(e,a,r,i)},off(e,n,a,r,i){if(t.isArray(e))return t(e).off(a,r,n,i);t.off(e,a,r,i)},trigger(e,n,a,r=!1,i=!0){if(t.isArray(e))return e.forEach((e=>t.trigger(e,a,n,r,i)));t.trigger(e,a,n,r,i)},triggers(e,n,a,r=!1,i=!0){e.forEach(((e,o)=>t.trigger(e,a,n[o],r,i)))},cloneChains(e,n,a){let r=l.get(n);if(!r)return window.console.warn(`chains of pre-store is empty on [${n}]`);!function(t,e,n){for(const a of n){let n=e.get(a);n?t.forEach((t=>Mt(t,St(n)))):window.console.warn(`pre-store chain is unfound with [${a}]`)}}(t.isArray(e)?e:[e],r,a?a.trim().split(ae):[...r.keys()])},cloneEvents(e,n,a){if(t.isArray(e))return t.isArray(n)?e.forEach(((e,r)=>t.cloneEvents(e,n[r],a))):e.forEach((e=>t.cloneEvents(e,n,a)));t.cloneEvents(e,n,a)},wrapAll:(e,n,a,r,i)=>t(e).wrapAll(n,a,r,i),scroll(e,n){n=function(e){if("Object"==t.type(e))return e;if("number"==typeof e)return{top:e};return{left:e[0],top:e[1]}}(n),t.isArray(e)?(e=t(e),requestAnimationFrame((()=>e.scroll(n)))):requestAnimationFrame((()=>t.scroll(e,n)))},nodex(e,n,a,...r){if(!ie.has(a))throw new Error(`[${a}] is not a valid method`);return t.isArray(e)?t(e)[a](n,...r):t[a](e,n,...r)},render(e,n){if(t.isArray(e))return e.forEach((t=>x.update(t,n)));x.update(e,n)},set(t,e,n){if(1===(n=n.split(ae)).length)return fe(t,n[0],e);n.forEach(((n,a)=>fe(t,n,e[a])))},add(e,n,...a){if(t.isArray(e))return e.forEach(((t,e)=>t.add(n[e],...a)));e.add(n,...a)},adds(e,n){if(t.isArray(e))return e.forEach((t=>n.forEach((e=>t.add(e)))));n.forEach((t=>e.add(t)))},apply(e,n,a,...r){if(t.isArray(e))return e.forEach((t=>t[a](n,...r)));e[a](n,...r)},applies(e,n,a){if(t.isArray(e))return e.forEach((t=>n.forEach((e=>t[a](...[].concat(e))))));n.forEach((t=>e[a](...[].concat(t))))},tips(e,n,a){if(t.isArray(e))return e.forEach((t=>he(t,n,a)));he(e,n,a)},only(e,n,a){t.isArray(e)||(e=[e]),n.forEach((n=>e.includes(n)||t.removeClass(n,a))),e.forEach((e=>t.addClass(e,a)))},data(e,n,a){if(t.isArray(e)||(e=[e]),ae.test(a))return function(t,e,n,a){t.forEach((t=>a(le(d,t),e,n)))}(e,a.split(ae),n,t.isArray(n)?ce:ue);e.forEach((t=>le(d,t).set(a,n)))}};["before","after","prepend","append","fill","replace","wrap","wrapInner"].forEach((function(e){oe[e]=function(n,a,r,i,o){return t.isArray(n)?t(n)[e](a,r,i,o):t[e](n,a,r,i,o)}})),["html","text"].forEach((function(e){oe[e]=function(n,a,r,i){if(void 0!==a)return t.isArray(n)?t(n)[e](a,r,i):t[e](n,a,r,i)}})),["empty","unwrap","remove"].forEach((function(e){oe[e]=function(n,a){return t.isArray(n)?t(n)[e](a):t[e](n,a)}})),[["beforeWith","insertBefore"],["afterWith","insertAfter"],["prependWith","prependTo"],["appendWith","appendTo"],["replaceWith","replaceAll"],["fillWith","fillTo"]].forEach((function(e){oe[e[0]]=function(n,a,r,i,o){return a=t(n)[e[1]](a,r,i,o),r?a.end(1):a}})),["attr","attribute","prop","property","css","cssSets"].forEach((function(e){oe[e]=function(n,a,r){t.isArray(n)?t(n)[e](r,a):t[e](n,r,a)}})),["val","offset","addClass","removeClass","toggleClass","removeAttr"].forEach((function(e){oe[e]=function(n,a,...r){t.isArray(n)?t(n)[e](a,...r):t[e](n,a,...r)}})),["width","height","scrollTop","scrollLeft"].forEach((function(e){oe[e]=function(n,a,r){t.isArray(n)?(n=t(n),requestAnimationFrame((()=>n[e](a,r)))):requestAnimationFrame((()=>t[e](n,a,r)))}})),["toggleAttr","toggleStyle"].forEach((function(e){oe[e]=function(n,a,r,i){if(t.isArray(n))return t(n)[e](r,a,i);t[e](n,r,a,i)}})),["pbo","pba"].forEach((function(e){oe[e]=function(n,a){if(t.isArray(n))return n.forEach((t=>p[e](t,a)));p[e](n,a)}})),[["hide","hidden"],["lose","lost"],["disable","disabled"],["fold","folded"],["truncate","truncated"],["full","fulled"]].forEach((function(e){oe[e[0]]=function(n,a){if(t.isArray(n))return t.isArray(a)?function(t,e,n){t.forEach(((t,a)=>void 0!==e[a]&&me(t,e[a],n)))}(n,a,e[1]):function(t,e,n){t.forEach((t=>me(t,e,n)))}(n,a,e[1]);me(n,a,e[1])}}));const se={target:(t,e=1)=>e>0?t.updated:t.primary,__target:null,goto(e,n){t.trigger(e.delegate,n,e.data,!1)},__goto:-1,fire(e,n,a,r=1,i=!0,o=!0){let s=ge(e,n);p.fireEvent(t(s),a,r,e.data,i,o)},__fire:-1,change(e,n=11,a){t(ge(e,n,!a)).trigger("change",e.data,!0)},__change:-1,changes(e,n=11,a){let r=ge(e,n,!a);for(const n of t(r))t.changes(n,e.data)},__changes:-1,select(e,n=11,a){t(e.data||ge(e,n,!0)).select(a)},__select:-1,normalize(e,n=11,a){t(ge(e,n,!a)).normalize()},__normalize:null,clear(e,n=11,a){t(ge(e,n,!a)).forEach((e=>1===e.nodeType?t.val(e,null):e.clear()))},__clear:null,intoView(e,n,a,r=11,i){t(ge(e,r,!i)).forEach((e=>t.intoView(e,n,a)))},__intoView:null};function le(t,e){let n=t.get(e);return n||t.set(e,n=new Map),n}function ce(t,e,n){e.forEach(((e,a)=>void 0!==n[a]&&t.set(e,n[a])))}function ue(t,e,n){e.forEach((e=>t.set(e,n)))}function de(e,n,a,r,i){let o=l.get(n);return o?function(e,n,a,r,i,o){a||(a=[...n.keys()]);for(const l of a){let a=n.get(l),c=a&&a[s];c?t[o](e,l.split(_,1)[0],c.selector,a.setInit(i),c.capture,r):window.console.warn(`have not chain by "${l}"`)}}(n,o,r&&r.split(ae),i,a,e):window.console.warn("have not storage on:",n)}function _e(e,n,a,r,i){if(t.isArray(n))return n.forEach((t=>de(e,t,a,r,i)));de(e,n,a,r,i)}function fe(e,n,a){t.isFunction(e.set)?e.set(n,a):e[n]=a}function he(e,n,a){a>0&&(clearTimeout(e[re]),e[re]=setTimeout((()=>t.empty(e)),1e3*a)),e.textContent=n}["click","blur","focus","load","play","pause","reset","submit","finish","cancel"].forEach((function(e){se[e]=function(n,a=11,r){t(n.data||ge(n,a,!r))[e]()},se[`__${e}`]=-1}));const pe=["-","","^"];function me(t,e,n){p.pbo(t,[`${pe[+e]}${n}`])}function ge(t,e,n){switch(+e){case 1:return t.target;case 2:return t.current;case 3:return t.delegate;case 10:return t.primary;case 11:return t.updated}return"string"==typeof e?p.find(e,t.delegate,n):e}const ye={Update:t.assign({},oe,$),Next:t.proto(t.assign({},se,$),Zt)};
//! $ID: app.js 2019.08.10 Tpb.Base $
class we{constructor(t,e,n){this._c=this._getter(t||{}),this._m=this._getter(e||{}),this._v=this._getter(n||{})}run(t,e,...n){let a=this._c[e](t.data,...n);return Promise.resolve(a).then((t=>this._m[e](t))).then((t=>this._v[e](t)))}control(t={}){return Object.assign(this._c,t)}model(t={}){return Object.assign(this._m,t)}view(t={}){return Object.assign(this._v,t)}call(t,e,...n){return this.run(e,t,...n)}_getter(t){return new Proxy(t,{get:(t,e)=>t[e]||(t=>t),set:(t,e,n)=>{return"function"!=typeof n&&(a=n,window.console.warn(a));var a}})}}
//! $ID: tpb.js 2019.08.19 Tpb.Base $
function be(e,n,a,r,i){if(t.isFunction(a))return j(e,n,a,r);C(n,a,r,i,e)}function ve(e,n,a,r,i){return t.isFunction(a)?j(e,n,a,r):t.isArray(r)?C(n,a,r,i,e):void function(e,n,a,r){let i=a?M:$;t.assign(k(e.split("."),r),n||{},i)}(n,a,r,e)}function xe(t,e,n,a){j(t,e,new Proxy({},{get:(t,e)=>S(n(e),a)}))}function Ae(t,e,n,a=[]){let r=t[e];if(null!=r)throw new Error(`By[${e}] is already exist.`);t[e]=r={};let i=new we(n.control,n.model,n.view);r.run=i.run.bind(i),a.forEach((t=>r[t]=i.call.bind(i,t)))}function Ee(t,e){return new ht({on:t||te,by:e||ne,update:ye.Update,next:ye.Next})}a&&(window.Update=ye.Update,window.Next=ye.Next,window.namedTpls=function(e,n){let a=new Map;t.isArray(e)||(e=[e]);e.forEach((t=>a.set(t,null))),f.clear(),Promise.all(e.map((e=>f.node(e).then((e=>t.find("[tpl-name]",e).map((e=>t.attr(e,"tpl-name"))))).then((t=>a.set(e,n?function(t){let e;return t.sort().map((t=>{let n=t===e?`[__REPEATED__]: ${t}`:t;return e=t,n}))}(t):t)))))).then((()=>function(t){let e={};for(const[n,a]of t)e[n]=a;window.console.info(JSON.stringify(e,null,"\t"))}(a)))},window.DataStore=d);const $e={init:function(t,e,n=f){return h(new E(Ee(t,e),n))},build:function(t,e,n,a,r=f){let i=Ee(n,a);return e?i.build(t,e):A(t,r).then((e=>e.forEach((e=>i.build(t,e)))||t))},templater:function(t,e){return void 0===e?u.get(t||c):null===e?u.delete(t):void u.set(t,e)}};export{ne as BaseBy,te as BaseOn,$e as Tpb,Ae as cmvApp,be as customGetter,Ee as obtBuilder,ve as processExtend,xe as processProxy};
//# sourceMappingURL=tpb.esm.js.map
