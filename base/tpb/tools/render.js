import{Filter as e}from"./filter.js";import{Spliter as t,UmpCaller as n,UmpString as r}from"./spliter.js";import{Util as o}from"./util.js";
//! $ID: render.js 2022.06.03 Tpb.Tools $
const s=window.$,i=new WeakMap,a=Symbol("scope-data"),l=Symbol("each-done"),u=Symbol("switch-case"),f=new t("|",new n,new r),c=new Map,p=new WeakMap,h={Method:[["tpb-each","$each"],["tpb-with","$with"],["tpb-var","$var"],["tpb-else","$else"],["tpb-if","$if"],["tpb-case","$case"],["tpb-last","$last"],["tpb-switch","$switch"],["tpb-for","$for"]],grammar(e){let t=new Map;for(const[n,r]of this.Method)e.hasAttribute(n)&&(this[r](t,e.getAttribute(n)),e.removeAttribute(n));return this.assign(t,e)},$each:(e,t)=>e.set("Each",[m.loop(t)]),$for:(e,t)=>e.set("For",[m.loop(t)]),$with:(e,t)=>e.set("With",[m.value(t)]),$var:(e,t)=>e.set("Var",[m.value(t)]),$if:(e,t)=>e.set("If",[m.value(t)]),$else:(e,t)=>e.set("Else",[t?m.value(t):null]),$switch:(e,t)=>e.set("Switch",[m.value(t)]),$case:(e,t)=>e.set("Case",[m.value(t)]),$last:(e,t)=>e.set("Last",[t?m.value(t):null]),assign(e,t){let n=[],r=[];for(let e of Array.from(t.attributes)){let o=e.name;"_"==o[0]&&(n.push(o.substring(1)),r.push(m.assign(e.value)),t.removeAttribute(o))}return n.length?e.set("Assign",[n,r]):e}},$={Each(e,t,n,r){e[l]||s.replace(e,function(e,t,n){let r=[];for(const[o,s]of t.entries()){let t=v(e);t[l]=!0,t[a]=A(s,o,n),r.push(t)}return r}(e,t(n,r),n))},For(e,t,n,r){s.append(e,function(e,t,n){let r=[];for(const[o,s]of t.entries())r.push(d(E(e),o,s,n));return r}(s.empty(e),t(n,r),n).flat())},With(e,t,n,r){let o=t(n,r);"object"!=typeof o&&(o=Object(o)),o.$=n,e[a]=o},Var(e,t,n,r){t(n,r)},If(e,t,n,r){t(n,r)?y(e):s.remove(e)},Else(e,t,n,r){t&&(t(n,r)?y(e):s.remove(e))},Switch(e,t,n,r){e[u]=t(n,r)},Case(e,t,n,r){if(e.parentElement[u]===t(n,r))return function(e){let t;for(const n of s.nextAll(e,"[_]"))t=c.get(n),(t.has("Case")||t.has("Last"))&&s.remove(n)}(e);s.remove(e)},Last(e,t,n,r){let o=e.parentElement;t&&o[u]!==t(n,r)&&s.remove(o)},Assign(e,t,n,r,o){t.forEach(((t,i)=>s.attr(e,t||"text",n[i](r,o))))}},m={value:e=>new Function("$","$$",`return ${e};`),loop:e=>e?new Function("$","$$",`return ${e};`):e=>e,assign(e){let t=[...f.split(e)],n=new Function("$","$$",`return ${t.shift()};`);if(0==t.length)return n;let r=t.map(b);return(e,t)=>r.reduce(((n,r)=>r[0](n,...r[1](e,t))),n(e,t))}};function b(t){let n=o.funcArgs(t.trim());return[e[n.name],new Function("$","$$",`return [${n.args}]`)]}function g(e,t,n,r){let o=s.find("[_]",e,!0);return s.find("[_]",t,!0).forEach(((e,t)=>r.set(e,n.get(o[t])))),t}function w(e,t=e){let n=s.find("[tpb-top]",e,!0);return s.find("[tpb-top]",t,!0).forEach(((e,t)=>p.set(e,p.get(n[t])||n[t]))),t}function v(e){return g(e,w(e,s.clone(e,!0,!0,!0)),c,c)}function d(e,t,n,r){return e.forEach((e=>1===e.nodeType&&(e[a]=A(n,t,r)))),e}function E(e){return e.map((e=>1===e.nodeType?v(e):e.cloneNode(!0)))}function A(e,t,n){return null==e?e:Object.assign(e,{INDEX:t,SIZE:n.length,$:n})}function y(e){let t;for(const n of s.nextAll(e,"[_]")){if(t=c.get(n),t.has("If"))break;t.has("Else")&&s.remove(n)}}function _(e,t,n){t=function(e,t,n){let r=c.get(e);if(r){for(const[o,s]of r)$[o](e,...s,e[a]||t,n);e.removeAttribute("_")}return e.removeAttribute("tpb-top"),e[a]||t}(e,t,n);for(let r=0;r<e.children.length;r++)_(e.children[r],t,n);return e}const j={parse:function(e){let t;for(const n of s.find("*",e,!0))t=h.grammar(n),t.size>0&&(i.set(n,t),n.setAttribute("_",""));return w(e)},render:function(e,t){let n=p.get(e);if(!n)throw new Error("[tpb-top] element not found.");let r=w(n,s.clone(n,!0,!0,!0));return _(g(n,r,i,c),t,t),c.clear(),s.trigger(s.replace(e,r),"rendered"),r},clone:function(e,t){return g(e,t,i,i)},get:function(e){return i.get(e)}};export{j as Render};
//# sourceMappingURL=render.js.map
