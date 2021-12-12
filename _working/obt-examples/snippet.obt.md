# 代码片段

## 趣味片段代码

### 省略号持续

```html
<p id="p1">Go...</p>
```

```js
let el = $.get('#p1');

$.attribute(el, {on: 'click|$ text add("...")', to: '|text'});

Tpb.Build(el);
```
