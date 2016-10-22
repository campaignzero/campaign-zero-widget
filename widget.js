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
  var version = '1.0.13';

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

  /**
   * Debounce Resize
   * @param func
   * @param wait
   * @param immediate
   * @returns {Function}
   */
  function debounce(func, wait, immediate) {
    var timeout;
    return function() {
      var context = this, args = arguments;
      var later = function() {
        timeout = null;
        if (!immediate) func.apply(context, args);
      };
      var callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func.apply(context, args);
    };
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

      var resizeHandeler = debounce(function() {
        appWidget.resize();
      }, 100);

      window.addEventListener('resize', resizeHandeler);

      var isProduction = (scriptTag.src === 'https://embed.joincampaignzero.org/widget.js');

      window.CAMPAIGN_ZERO_WIDGET = {
        environment: isProduction ? 'production' : 'development',
        base: isProduction ? 'https://embed.joincampaignzero.org/app/' : './app/',
        version: version
      };

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

        // load bugsnag
        loadScript('https://d2wy8f7a9ursnm.cloudfront.net/bugsnag-3.min.js', function(){
          if (typeof Bugsnag !== 'undefined') {
            Bugsnag.notifyReleaseStages = [''];
            Bugsnag.releaseStage = window.CAMPAIGN_ZERO_WIDGET.environment;
            Bugsnag.apiKey = '9f6e3446ec521807bdb0cdf646204a85';
            Bugsnag.appVersion = version;

            // Only send errors from our own widget, not the embedded website it's on
            Bugsnag.beforeNotify = function(payload) {
              var sendError = false;
              var trackScriptFiles = [
                scriptTag.src,
                assets.replace('./', '/') + 'app.js'
              ];

              if (payload && payload.stacktrace) {
                for (var i = 0; i < trackScriptFiles.length; i++) {
                  if (payload.stacktrace.includes(trackScriptFiles[i])) {
                    sendError = true;
                    break;
                  }
                }
              }

              return !!(sendError);
            }
          }
        });

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
