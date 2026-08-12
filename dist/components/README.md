# Generated icon components

- `react.jsx` — `<SwIcon name="shield" />` and named exports
- `vue.js` — class helper + icon name list
- `svelte.js` — module exports for names/prefix
- `jacare.js` + `SwIcon.jcr` — [Jacaré](https://github.com/jacarejs/core) component

## Jacaré usage

```jcr
import SwIcon from './components/SwIcon.jcr'

export <view>
  <SwIcon :name=${'shield'} :size=${28} :color=${'#0b7a6c'} :label=${'shield'} />
</view>
```

Also load `../iconfont.css` (or the SVG sprite `../swfont.sprite.svg`).
