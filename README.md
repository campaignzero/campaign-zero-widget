# campaign-zero-widget
Campaign Zero Widget

Usage Instructions
---

To use this script, you simply need to add the following code anywhere on your website that you want the widget to show up:

```html
<script async src="http://embed.joincampaignzero.org/widget.js" charset="utf-8"></script>
```

This will inject a widget into a newly created HTML element with the ID `campaign-zero-widget`.


Alternate Usage Instructions
---

You may not be able to add a script tag into your content, but might be able to stick javascript into the footer or something.

For this, we also have a solution.  Simply add the following HTML anywhere on your site where you want our widget to display:

```html
<div id="campaign-zero-widget">test</div>
```

Then, include the following script tag in your HTML footer"

```html
<script async src="http://embed.joincampaignzero.org/widget.js" charset="utf-8"></script>
```

If you are using something like wordpress that just asks you for the URL for the script to put in your footer, you can use the following URL:

```
http://embed.joincampaignzero.org/widget.js
```
