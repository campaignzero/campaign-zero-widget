(function () {

  var scriptName = 'widget.js';
  var jqueryPath = 'https://cdnjs.cloudflare.com/ajax/libs/jquery/1.12.3/jquery.min.js';
  var jqueryVersion = '1.12.3';
  var scriptTag;
  var pathLocal = './app/';
  var pathCDN = 'https://s3.amazonaws.com/campaign-zero-widget/';
  var elementName = 'campaign-zero-widget';
  var loadedCSS = false;
  var loadedJS = false;
  var version = '1.0.1';

  /** Get reference to self (scriptTag) */
  var allScripts = document.getElementsByTagName('script');
  var targetScripts = [];

  /** Helper function to load external scripts */
  function loadScript(src, onLoad) {
    var script_tag = document.createElement('script');
        script_tag.setAttribute('type', 'text/javascript');
        script_tag.setAttribute('src', src);

    if (script_tag.readyState) {
      script_tag.onreadystatechange = function () {
        if (this.readyState == 'complete' || this.readyState == 'loaded') {
          onLoad();
        }
      };
    } else {
      script_tag.onload = onLoad;
    }

    // append loaded script to head
    (document.getElementsByTagName('head')[0] || document.documentElement).appendChild(script_tag);
  }

  /** Helper function to load external css  */
  function loadCss(href, onLoad) {
    var link_tag = document.createElement('link');
        link_tag.setAttribute('type', 'text/css');
        link_tag.setAttribute('rel', 'stylesheet');
        link_tag.setAttribute('href', href);

    if (link_tag.readyState) {
      link_tag.onreadystatechange = function () {
        if (this.readyState == 'complete' || this.readyState == 'loaded') {
          onLoad();
        }
      };
    } else {
      link_tag.onload = onLoad;
    }

    // append loaded style sheet to head
    (document.getElementsByTagName('head')[0] || document.documentElement).appendChild(link_tag);
  }

  /** Check if jQuery is already on page, otherwise load it */
  if (window.jQuery === undefined || window.jQuery.fn.jquery !== jqueryVersion) {
    loadScript(jqueryPath, init);
  } else {
    init();
  }

  /** Initialize widget */
  function init() {

    // figure out scripts on the page
    for (var i in allScripts) {
      var name = allScripts[i].src;
      if(name && name.indexOf(scriptName) > 0) {
        targetScripts.push(allScripts[i]);
      }
    }

    // reference scripts position on the page
    scriptTag = targetScripts[targetScripts.length - 1];

    // check if this is production
    var assets = (scriptTag.src && scriptTag.src === 'https://embed.joincampaignzero.org/widget.js') ? pathCDN : pathLocal;

    // load widget css before DOM ready
    loadCss(assets + 'style.css?v=' + version, function(){
      loadedCSS = true;
      if(typeof appWidget !== 'undefined' && loadedCSS && loadedJS){
        appWidget.init();
      }
    });

    // wait for DOM ready to load other script to prevent page blocking
    jQuery(document).ready(function ($) {

      // check for existing element, otherwise create it
      if(jQuery('#' + elementName).length === 0){
        jQuery('<div id="' + elementName + '"></div>').insertBefore(scriptTag);
      }

      // Load Required Libraries first then init widget
      loadScript('https://www.google-analytics.com/analytics.js', function(){
        if(typeof window.ga !== 'undefined'){
          ga('create', 'UA-77948909-1', 'auto', 'campaignZeroWidget');
          ga('campaignZeroWidget.send', 'pageview');
        }

        // load widgets main app's script file
        loadScript(assets + 'app.js?v=' + version, function(){
          loadedJS = true;
          if(typeof appWidget !== 'undefined' && loadedCSS && loadedJS){
            appWidget.init();
          }
        });
      });
    });
  }
})();
