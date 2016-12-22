![Campaign Zero Logo](https://github.com/campaignzero/artwork/raw/master/logo/campaign-zero/web/306x128/campaign-zero.png "Campaign Zero Logo")

Campaign Zero Widget
===

[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg?style=flat)](https://raw.githubusercontent.com/campaignzero/campaign-zero-widget/master/LICENSE)  [![GitHub contributors](https://img.shields.io/github/contributors/campaignzero/campaign-zero-widget.svg)](https://github.com/campaignzero/campaign-zero-widget/graphs/contributors)

![Demo](app-image.gif "Demo")


Usage Instructions
---

To use this script, you simply need to add the following code anywhere on your website that you want the widget to show up:

```html
<script async src="https://embed.joincampaignzero.org/widget.js" charset="utf-8"></script>
```

This will inject a widget into a newly created HTML element with the ID `campaign-zero-widget` directly above where you placed our script.


Alternate Usage Instructions
---

If you are unable to place JavaScript where you want the widget to go, you can use the following HTML directly:

```html
<div id="campaign-zero-widget"></div>
```

Then, include the following script tag anywhere else on your page:

```html
<script async src="https://embed.joincampaignzero.org/widget.js" charset="utf-8"></script>
```

If you are using something like WordPress that just asks you for the URL for the script to put in your footer, you can use the following URL:

```
https://embed.joincampaignzero.org/widget.js
```

For browsers that let you use iFrames, you can also use:

#### XXXS - 200 x 345:

```html
<iframe src="https://embed.joincampaignzero.org" id="campaign-zero" width="200" height="345" frameborder="0"></iframe>
```

#### XXS - 220 x 345:

```html
<iframe src="https://embed.joincampaignzero.org" id="campaign-zero" width="220" height="345" frameborder="0"></iframe>
```

#### XS - 240 x 345:

```html
<iframe src="https://embed.joincampaignzero.org" id="campaign-zero" width="240" height="345" frameborder="0"></iframe>
```

#### S - 280 x 345:

```html
<iframe src="https://embed.joincampaignzero.org" id="campaign-zero" width="280" height="345" frameborder="0"></iframe>
```

#### M - 300 x 345:

```html
<iframe src="https://embed.joincampaignzero.org" id="campaign-zero" width="300" height="345" frameborder="0"></iframe>
```

#### L - 320 x 345:

```html
<iframe src="https://embed.joincampaignzero.org" id="campaign-zero" width="320" height="345" frameborder="0"></iframe>
```

#### XL - 380 x 345:

```html
<iframe src="https://embed.joincampaignzero.org" id="campaign-zero" width="400" height="380" frameborder="0"></iframe>
```

#### XXL - 400 x 345:

```html
<iframe src="https://embed.joincampaignzero.org" id="campaign-zero" width="400" height="380" frameborder="0"></iframe>
```


Demos
---

* [DEMO](https://embed.joincampaignzero.org)

Developers
---

This Widget gets it's data from our [Campaign Zero API](https://github.com/campaignzero/api).  

Both this Widget and its API are open for Developer Contribution.

If you wish to contribute to Campaign Zero development, you will need to request an API Key from [Peter Schmalfeldt](https://twitter.com/mrmidi).
