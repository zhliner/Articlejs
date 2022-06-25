import{Filter as e}from"./filter.js";import{Spliter as t,UmpCaller as r,UmpString as n}from"./spliter.js";import{Util as o}from"./util.js";
//! $ID: render.js 2022.06.03 Tpb.Tools $
const s=window.$,i=new WeakMap,a=Symbol("scope-data"),l=Symbol("each-done"),u=Symbol("switch-case"),f=new t("|",new r,new n),c=new Map,p=new WeakMap,h={Method:[["tpb-each","$each"],["tpb-with","$with"],["tpb-var","$var"],["tpb-else","$else"],["tpb-if","$if"],["tpb-case","$case"],["tpb-last","$last"],["tpb-switch","$switch"],["tpb-for","$for"]],grammar(e){let t=new Map;for(const[r,n]of this.Method)e.hasAttribute(r)&&(this[n](t,e.getAttribute(r)),e.removeAttribute(r));return this.assign(t,e)},$each:(e,t)=>e.set("Each",[m.loop(t)]),$for:(e,t)=>e.set("For",[m.loop(t)]),$with:(e,t)=>e.set("With",[m.value(t)]),$var:(e,t)=>e.set("Var",[m.value(t)]),$if:(e,t)=>e.set("If",[m.value(t)]),$else:(e,t)=>e.set("Else",[t?m.value(t):m.pass(),!!t]),$switch:(e,t)=>e.set("Switch",[m.value(t)]),$case:(e,t)=>e.set("Case",[m.value(t)]),$last:(e,t)=>e.set("Last",[t?m.value(t):null]),assign(e,t){let r=[],n=[];for(let e of Array.from(t.attributes)){let o=e.name;"_"==o[0]&&(r.push(o.substring(1)),n.push(m.assign(e.value)),t.removeAttribute(o))}return r.length?e.set("Assign",[r,n]):e}},$={Each(e,t,r,n){e[l]||s.replace(e,function(e,t,r){let n=[];for(const[o,s]of t.entries()){let t=v(e);t[l]=!0,t[a]=A(s,o,r),n.push(t)}return n}(e,t(r,n),r))},For(e,t,r,n){s.append(e,function(e,t,r){let n=[];for(const[o,s]of t.entries())n.push(d(E(e),o,s,r));return n}(s.empty(e),t(r,n),r).flat())},With(e,t,r,n){let o=t(r,n);"object"!=typeof o&&(o=Object(o)),o.$=r,e[a]=o},Var(e,t,r,n){t(r,n)},If(e,t,r,n){t(r,n)?y(e):s.remove(e)},Else(e,t,r,n,o){if(t(n,o))return r&&y(e);s.remove(e)},Switch(e,t,r,n){e[u]=t(r,n)},Case(e,t,r,n){if(e.parentElement[u]===t(r,n))return function(e){let t;for(const r of s.nextAll(e,"[_]")){if(t=c.get(r),t.has("Switch"))break;(t.has("Else")||t.has("Last"))&&s.remove(r)}}(e);s.remove(e)},Last(e,t,r,n){let o=e.parentElement;t&&o[u]!==t(r,n)&&s.remove(o)},Assign(e,t,r,n,o){t.forEach(((t,i)=>s.attr(e,t||"text",r[i](n,o))))}},m={value:e=>new Function("$","$$",`return ${e};`),loop:e=>e?new Function("$","$$",`return ${e};`):e=>e,pass:()=>()=>!0,assign(e){let t=[...f.split(e)],r=new Function("$","$$",`return ${t.shift()};`);if(0==t.length)return r;let n=t.map(b);return(e,t)=>n.reduce(((r,n)=>n[0](r,...n[1](e,t))),r(e,t))}};function b(t){let r=o.funcArgs(t.trim());return[e[r.name],new Function("$","$$",`return [${r.args}]`)]}function g(e,t,r,n){let o=s.find("[_]",e,!0);return s.find("[_]",t,!0).forEach(((e,t)=>n.set(e,r.get(o[t])))),t}function w(e,t=e){let r=s.find("[tpb-root]",e,!0);return s.find("[tpb-root]",t,!0).forEach(((e,t)=>p.set(e,p.get(r[t])||r[t]))),t}function v(e){return g(e,w(e,s.clone(e,!0,!0,!0)),c,c)}function d(e,t,r,n){return e.forEach((e=>1===e.nodeType&&(e[a]=A(r,t,n)))),e}function E(e){return e.map((e=>1===e.nodeType?v(e):e.cloneNode(!0)))}function A(e,t,r){return null==e?e:Object.assign(e,{INDEX:t,SIZE:r.length,$:r})}function y(e){let t;for(const r of s.nextAll(e,"[_]")){if(t=c.get(r),t.has("If"))break;t.has("Else")&&s.remove(r)}}function S(e,t,r){t=function(e,t,r){let n=c.get(e);if(n){for(const[o,s]of n)$[o](e,...s,e[a]||t,r);e.removeAttribute("_")}return e.removeAttribute("tpb-root"),e[a]||t}(e,t,r);for(let n=0;n<e.children.length;n++)S(e.children[n],t,r);return e}const _={parse:function(e){let t;for(const r of s.find("*",e,!0))t=h.grammar(r),t.size>0&&(i.set(r,t),r.setAttribute("_",""));return w(e)},render:function(e,t){let r=p.get(e);if(!r)throw new Error("Rendering is a non-[tpb-root] element.");let n=w(r,s.clone(r,!0,!0,!0));return S(g(r,n,i,c),t,t),c.clear(),r!==e?s.replace(e,n):n},clone:function(e,t){return g(e,t,i,i)},get:function(e){return i.get(e)}};export{_ as Render};
//# sourceMappingURL=render.js.map
