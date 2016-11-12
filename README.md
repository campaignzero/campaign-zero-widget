![Campaign Zero Logo](https://github.com/campaignzero/artwork/raw/master/logo/campaign-zero/web/306x128/campaign-zero.png "Campaign Zero Logo")

Campaign Zero Widget
===

![campaign-zero](https://cloud.githubusercontent.com/assets/508411/20238410/f639d34e-a8b8-11e6-9aeb-4a1169b6b8ce.gif)

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

If you are using Firefox or Internet Explorer, you can use the following code:

```
<iframe src="https://embed.joincampaignzero.org/plain.html" width="100%" height="400px" style="border:0"></iframe>
```

Demos
---

* [DEMO](https://embed.joincampaignzero.org/plain.html): Widget using just the script tag
* [DEMO](https://embed.joincampaignzero.org/sample.html): Widget using custom placement ( with surrounding HTML )


Developers
---

This Widget gets it's data from our [Campaign Zero API](https://github.com/campaignzero/api).  

Both this Widget and its API are open for Developer Contribution.

If you wish to contribute to Campaign Zero development, you will need to request an API Key from [Peter Schmalfeldt](https://twitter.com/mrmidi).