//! $ID: util.js 2021.06.27 Tpb.Tools $
const e=/^(\d{4})-(\d{2})-(\d{2})T(\d+):(\d+):(\d+)\.(\d+)Z$/,t=6e4*(new Date).getTimezoneOffset(),b=/\by+\b|\bM+\b|\bd+\b|\bh+\b|\bm+\b|\bs+\b|\bS\b/g;function d(d,n){let m=function(b){b-=t;let[d,n,m,r,s,y,a,c]=new Date(b).toJSON().match(e);return{yyyy:n,yy:n.slice(2),MM:m,M:+m,dd:r,d:+r,hh:s,h:+s,mm:y,m:+y,ss:a,s:+a,S:c,_:d}}((r=d).getTime?r.getTime():parseInt(r)||t);var r;return n.replace(b,(e=>m[e]||e))}export{d as format};
//# sourceMappingURL=date.js.map
