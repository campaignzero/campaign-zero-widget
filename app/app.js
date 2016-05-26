var appWidget = {

  geoEnabled: null,
  geoLocation: {},
  geoErrorMessage: null,
  timeout: null,
  elementName: 'campaign-zero-widget',
  storedResponse: null,

  /**
   * Track Event using Google Analytics
   * @param category
   * @param action
   * @param label
   * @param value
   */
  trackEvent: function(category, action, label, value){
    if(typeof window.ga !== 'undefined'){
      ga('campaignZeroWidget.send', 'event', category, action, label, value);
    }
  },

  /**
   * Get Geo Location
   */
  getLocation: function() {
    if(this.geoLocation && this.geoLocation.latitude && this.geoLocation.longitude){
      this.geoSuccess({
        coords: this.geoLocation
      });
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(this.geoSuccess, this.geoError);
      this.geoEnabled = true;
    } else {
      this.geoEnabled = false;
    }
  },

  /**
   * Geo Location Success
   * @param position
   */
  geoSuccess: function(position) {
    if(position){
      appWidget.geoLocation = position.coords;
      appWidget.getRepresentatives(appWidget.geoLocation);
    } else {
      appWidget.showError('Unable to Determine Location');
      appWidget.trackEvent('Error', 'Geolocation', 'Unable to Determine Location');
    }
  },

  /**
   * Geo Location Error
   * @param error
   */
  geoError: function(error) {
    if(error){
      switch(error.code) {
        case error.PERMISSION_DENIED:
          this.geoErrorMessage = 'Denied Request for Geolocation.';
          break;
        case error.POSITION_UNAVAILABLE:
          this.geoErrorMessage = 'Location Information Unavailable.';
          break;
        case error.TIMEOUT:
          this.geoErrorMessage = 'Location Request Timed Out.';
          break;
        case error.UNKNOWN_ERROR:
          this.geoErrorMessage = 'Unable to Determine Location.';
          break;
      }
      appWidget.trackEvent('Error', 'Geolocation', this.geoErrorMessage);
      appWidget.showError(this.geoErrorMessage);
    }
  },

  /**
   * Show Error Message
   * @param error
   */
  showError: function(error){
    var elm = jQuery('#' + this.elementName);
    jQuery('small.note', elm).html('<i class="fa fa-exclamation-triangle"></i>&nbsp; ' + error).addClass('error animated shake');
    jQuery('button.submit', elm).removeAttr('disabled').html('Find your rep');
    clearTimeout(this.timeout);
    this.timeout = setTimeout(function(){
      var note = (navigator.geolocation) ? 'leave empty to use your current location' : '';
      jQuery('small.note', elm).removeClass('error animated shake').html(note);
    }, 5000);
  },

  /**
   * Handle Form Submission
   * @param geoLocation
   * @param zipCode
   * @returns {boolean}
   */
  getRepresentatives: function(geoLocation, zipCode){

    var jsonpUrl = './app/legislators.php';
    if(geoLocation){
      jsonpUrl += '?latitude=' + geoLocation.latitude + '&longitude=' + geoLocation.longitude;
      appWidget.trackEvent('Fetch', 'Reps Geo', geoLocation.latitude + ',' + geoLocation.longitude);
    } else if(zipCode){
      jsonpUrl += '?zipcode=' + zipCode;
      appWidget.trackEvent('Fetch', 'Reps Zipcode', zipCode);
    } else {
      return false;
    }

    var self = this;

    jQuery.ajax({
      url: jsonpUrl,
      type: 'GET',
      dataType: 'json',
      success: function(response) {
        if(response && response.error){
          self.showError(response.error);
          appWidget.trackEvent('Error', 'Reps Error', response.error);
        } else {
          self.storedResponse = response;
          self.generateResults(response);
        }
      },
      error: function(jqXHR, textStatus, errorThrown) {
        self.showError('ERROR: ' + errorThrown);
        appWidget.trackEvent('Error', 'Reps Error', errorThrown);
      }
    });
  },

  /**
   * Generate Results
   * @param response
   */
  generateResults: function(response){
    var self = this;
    var elm = jQuery('#' + this.elementName);

    setTimeout(function(){
      elm.html('');

      var backgroundImage = 'https://maps.googleapis.com/maps/api/staticmap?center='+ response.request.latitude +','+ response.request.longitude +'&zoom=10&maptype=roadmap&size=800x600&sensor=false&style=feature:administrative|visibility:off&style=feature:landscape.natural.terrain|visibility:off&style=feature:poi|visibility:off&style=element:labels|visibility:off&style=feature:road|element:labels|visibility:off&style=feature:transit|visibility:off&style=feature:road|element:geometry|visibility:simplified|color:0x999999&style=feature:water|element:geometry|color:0xcccccc&style=feature:landscape|element:geometry.fill|color:0xaaaaaa';
      var html = '<div class="wrapper" style="min-height: 343px; background: url('+ backgroundImage +') center center no-repeat; background-size: cover;">';

      appWidget.trackEvent('API', 'Rep Count Location', response.request.latitude + ',' + response.request.longitude, response.results.length);
      appWidget.trackEvent('API', 'Rep Count Zipcode', response.request.zipcode, response.results.length);

      if(response && response.results.length === 0){

        html += '<h2 class="black">No Representatives</h2>';
        html += '<p class="no-reps">We could not find any Representatives in your location</p></div>';
        html += '<small class="powered-by back"><a href="javascript:void(0);"><i class="fa fa-angle-left"></i>&nbsp; Back</a></small>';

        elm.append(html);

        setTimeout(function(){

          jQuery('a', elm).click(function(){
            appWidget.trackEvent('Nav', 'Link Clicked', jQuery(this).text());
          });

          jQuery('small.back a', elm).click(function(){
            self.init();
            appWidget.trackEvent('Nav', 'Back Button', 'Main Page');
          });

        }, 200);

      } else if(response && response.results.length === 1){

        var rep = response.results[0];
        var chamber = response.results[0]['chamber'];
        var bills = response.bills[chamber] || [];

        self.generateDetails(rep, bills, false);

      } else if (response && response.results.length >= 1){

        html += '<h2 class="black">Pick a Representative</h2>';
        html += '<ul>';

        for (var key in response.results) {
          if (response.results.hasOwnProperty(key)) {
            html += self.templateSummary(key, response.results[key]);
          }
        }

        html += '</ul></div>';
        html += '<small class="powered-by back"><a href="javascript:void(0);"><i class="fa fa-angle-left"></i>&nbsp; Back</a></small>';

        elm.append(html);

        setTimeout(function(){

          jQuery('a', elm).click(function(){
            appWidget.trackEvent('Nav', 'Link Clicked', jQuery(this).text());
          });

          jQuery('button', elm).click(function(){
            appWidget.trackEvent('Nav', 'Button Clicked', jQuery(this).text());
          });

          jQuery('small.back a', elm).click(function(){
            self.init();
            appWidget.trackEvent('Nav', 'Back Button', 'Main Page');
          });

          jQuery('a.representative-summary', elm).click(function(){
            var id = jQuery(this).data('id');
            var rep = response.results[id];
            var chamber = response.results[id]['chamber'];
            var bills = response.bills[chamber] || [];

            appWidget.trackEvent('Nav', 'Selected Rep', rep.full_name);
            appWidget.trackEvent('Nav', 'Selected Rep State', rep.state.toUpperCase());

            self.generateDetails(rep, bills, true);
          });
        }, 200);

      } else if (response && response.results.length === 0){
        self.showError('No Representatives Found.');
        appWidget.trackEvent('Error', 'Representatives Error', 'No Representatives Found.');
      }

    }, 200);
  },

  /**
   * Generate Representative Details
   * @param rep
   * @param bills
   * @param multiple
   */
  generateDetails: function(rep, bills, multiple){
    var self = this;
    var elm = jQuery('#' + this.elementName);
        elm.html('').append(this.templateDetails(rep, bills));

    jQuery('a', elm).click(function(){
      appWidget.trackEvent('Nav', 'Link Clicked', jQuery(this).text());
    });

    jQuery('button', elm).click(function(){
      appWidget.trackEvent('Nav', 'Button Clicked', jQuery(this).text());
    });

    jQuery('small.back a', elm).click(function(){
      if(multiple){
        self.generateResults(self.storedResponse);
        appWidget.trackEvent('Nav', 'Back Button', 'Back to Rep Listing');
      } else {
        self.init();
        appWidget.trackEvent('Nav', 'Back Button', 'Main Page');
      }
    });

    jQuery('.widget-modal-close', elm).click(function(){
      self.closeModal();
      appWidget.trackEvent('Nav', 'Modal', 'Close Modal');
    });

    jQuery('.widget-modal-phone', elm).click(function(){
      self.openModal('phone');
      appWidget.trackEvent('Nav', 'Modal', 'Open Phone Modal');
    });

    jQuery('.widget-modal-twitter', elm).click(function(){
      self.openModal('twitter');
      appWidget.trackEvent('Nav', 'Modal', 'Open Twitter Modal');
    });

    jQuery('.widget-modal-facebook', elm).click(function(){
      self.openModal('facebook');
      appWidget.trackEvent('Nav', 'Modal', 'Open Facebook Modal');
    });

    jQuery('.widget-modal-email', elm).click(function(){
      self.openModal('email');
      appWidget.trackEvent('Nav', 'Modal', 'Open Email Modal');
    });
  },

  /**
   * HTML Template for Initial Form
   * @returns {string}
   */
  templateForm: function(){
    var note = (navigator.geolocation) ? 'leave empty to use your current location' : '';
    return '<div class="wrapper animated fadeIn" style="display: none">'+
      '<h2>End Police Violence</h2>' +
      '<p class="intro">Where does your rep stand?</p>' +
      '<form id="campaign-zero-form">' +
      '<input autocomplete="off" type="text" name="location" id="zip-code" placeholder="Enter your Zip Code" minlength="5" maxlength="5" onkeyup="this.value=this.value.replace(/[^0-9]/g,\'\');">' +
      '<small class="note">' + note + '</small>' +
      '<button class="submit" type="submit">Find your rep</button>' +
      '</form>' +
      '<small class="powered-by"><span>Powered by </span><a href="http://www.joincampaignzero.org/" target="_blank">Campaign Zero</a></small>' +
      '<a class="add-to-site" href="https://github.com/campaignzero/campaign-zero-widget" target="_blank">Add <span>this</span> to <span>your</span> site</a>' +
      '</div>';
  },

  /**
   * HTML Template for Representative Summary
   * @param key
   * @param rep
   * @returns {string}
   */
  templateSummary: function(key, rep){

    // Some Rep images are loading over HTTP rather than HTTPS, check that HTTPS works
    var loadSecureImage = function(imageUrl) {
      var image = new Image();
      image.onload = function(){
        jQuery('#rep-image-' + key).css('background-image', 'url(' + imageUrl + ')');
      };
      image.src = imageUrl;
    };

    // Replace all non secure images with secure images and verify they exist
    loadSecureImage(rep.photo_url.replace('http://', 'https://'));

    return '<li><a href="javascript:void(0)" class="representative-summary animated fadeIn" data-id="'+ key +'">' +
      '<div class="avatar ' + rep.party.toLowerCase() + '" id="rep-image-' + key + '"></div>' +
      '<div class="summary">'+
      '<div class="summary-name ' + rep.party.toLowerCase() + '">' + rep.full_name + '</div>' +
      '<div class="summary-details"><strong>' + rep.party + '</strong> &nbsp;&nbsp; <strong>District:</strong> ' + rep.district + ' &nbsp;&nbsp; <strong>Chamber:</strong> ' + rep.chamber + '</div>' +
      '</div>' +
      '</a></li>';
  },

  /**
   * HTML Template for Representative Details
   * @param rep
   * @param bills
   * @returns {string}
   */
  templateDetails: function(rep, bills){
    var backgroundImage = 'https://maps.googleapis.com/maps/api/staticmap?center=' + this.storedResponse.request.latitude + ',' + this.storedResponse.request.longitude + '&zoom=10&maptype=roadmap&size=800x600&sensor=false&style=feature:administrative|visibility:off&style=feature:landscape.natural.terrain|visibility:off&style=feature:poi|visibility:off&style=element:labels|visibility:off&style=feature:road|element:labels|visibility:off&style=feature:transit|visibility:off&style=feature:road|element:geometry|visibility:simplified|color:0x999999&style=feature:water|element:geometry|color:0xcccccc&style=feature:landscape|element:geometry.fill|color:0xaaaaaa';
    var status = this.templateBills(bills, rep.id);

    var phoneNumbers = '';

    for(var i = 0; i < rep.offices.length; i++){
      if(rep.offices[i].phone){
        phoneNumbers = phoneNumbers.concat('<div class="address-phone"><a href="tel:' + rep.offices[i].phone.replace(/-/g, '') + '">' + rep.offices[i].phone + '</a>&nbsp; <span>( ' + rep.offices[i].name + ' )</span></div>');
      }
    }

    // Some Rep images are loading over HTTP rather than HTTPS, check that HTTPS works
    var loadSecureImage = function(imageUrl) {
      var image = new Image();
      image.onload = function(){
        jQuery('#rep-image').css('background-image', 'url(' + imageUrl + ')');
      };
      image.src = imageUrl;
    };

    // Replace all non secure images with secure images and verify they exist
    loadSecureImage(rep.photo_url.replace('http://', 'https://'));

    return '<div class="wrapper text-center representative" style="min-height: 343px; background: url(' + backgroundImage + ') center center no-repeat; background-size: cover;">' +
      '<div class="summary-name ' + rep.party.toLowerCase() + '">' + rep.full_name + '</div>' +
      '<div class="summary-details"><strong>' + rep.party + '</strong> &nbsp;&nbsp; <strong>District:</strong> ' + rep.district + ' &nbsp;&nbsp; <strong>Chamber:</strong> ' + rep.chamber + '</div>' +
      '<div class="avatar large animated flipInY ' + rep.party.toLowerCase() + '" id="rep-image"></div>' +
      '<div class="action-buttons">' +
      '<a href="javascript:void(0)" class="action-button widget-modal-phone"><i class="fa fa-phone"></i></a>' +
      '<a href="https://twitter.com/intent/tweet?text=Learn%20where%20your%20representatives%20stand%20on%20police%20violence%20and%20demand%20action%20now!%20JoinCampaignZero.org" target="_blank" rel="noopener" class="action-button"><i class="fa fa-twitter"></i></a>' +
      '<a href="https://www.facebook.com/sharer/sharer.php?u=JoinCampaignZero.org&description=Learn%20where%20your%20representatives%20stand%20on%20police%20violence%20and%20demand%20action%20now!%20JoinCampaignZero.org" target="_blank" rel="noopener" class="action-button"><i class="fa fa-facebook-official"></i></a>' +
      '<a href="javascript:void(0)" class="action-button widget-modal-email"><i class="fa fa-envelope"></i></a>' +
      '</div><div id="widget-bill-results">'+
        status +
      '</div></div>' +
      '<div class="widget-modal">' +
      '<a href="javascript:void(0)" class="widget-modal-close"><i class="fa fa-times-circle"></i></a>' +
      '<div class="widget-modal-phone widget-modal-content">' +
        '<h1>Call <b>' + rep.full_name + '</b> and demand action to end police violence:</h1>' +
        phoneNumbers +
      '</div>' +
      '<div class="widget-modal-email widget-modal-content">' +
        '<h1>Email <b>' + rep.full_name + '</b> and demand action to end police violence:</h1>' +
        '<div class="address-email"><a href="mailto:' + rep.email + '?subject=We%20need%20urgent%20action%20to%20end%20police%20violence%20in%20our%20district.&body=Greetings,%0A%0AI\'m%20from%20your%20district%2C%20and%20police%20violence%20needs%20to%20be%20urgently%20addressed%20through%20comprehensive%20legislation%20as%20proposed%20by%20Campaign%20Zero.%20Here\'s%20why%3A%0A%0A[YOUR_REASON_HERE]">' + rep.email + '</a></div>' +
      '</div>' +
      '</div>' +
      '<small class="powered-by back"><a href="javascript:void(0);"><i class="fa fa-angle-left"></i>&nbsp; Back</a></small>';
  },

  /**
   * HTML Template for Bill Details
   * @param bills
   * @param rep_id
   * @returns {string}
   */
  templateBills: function(bills, rep_id){

    var html = '';

    if( !bills || bills.length === 0) {
      html = html.concat('<div class="support text-center">No bills on this issue.</div>');
    } else {

      bills.sort(function(a, b){
        if(a.status < b. status) return -1;
        if(a.status > b. status) return 1;
        return 0;
      });

      for(var i = 0; i < bills.length; i++){
        if(bills[i].status === 'considering'){
          html = html.concat('<div class="support"><span class="status ' + bills[i].status + '">' + bills[i].status + '</span> <a target="_blank" rel="noopener" href="' + bills[i].url + '">' + bills[i].bill + '</a> ' + bills[i].label + '</div>');
        } else {
          var billID = bills[i].bill;
          setTimeout(function(){
            jQuery('#widget-bill-results').append('<div id="loading-results" class="support text-center"><i class="fa fa-spinner fa-pulse fa-fw"></i> Checking status of ' + billID + ' ...</div>');
          }, 100);
          this.voteStatus(bills[i], rep_id, function(bill, status){
            jQuery('#loading-results').remove();
            var label = (status !== 'unknown') ? status : 'did not vote';
            jQuery('#widget-bill-results').append('<div class="support"><span class="status ' + status + '">' + label + '</span> <a target="_blank" rel="noopener" href="' + bill.url + '">' + bill.bill + '</a> ' + bill.label + '</div>');
            jQuery('#widget-bill-results a').click(function(){
              appWidget.trackEvent('Nav', 'Bill Opened (State)', bill.state);
              appWidget.trackEvent('Nav', 'Bill Opened (Status)', status);
              appWidget.trackEvent('Nav', 'Bill Opened (Bill)', bill.bill);
              appWidget.trackEvent('Nav', 'Bill Opened (Session)', bill.session);
            });
          });
        }
      }
    }

    return html;
  },

  /**
   * Check for Voting Status
   * @param bill
   * @param rep_id
   * @param callback
   */
  voteStatus: function(bill, rep_id, callback){
    var jsonpUrl = './app/bills.php?state=' + bill.state + '&session=' + bill.session + '&bill=' + bill.bill + '&rep=' + rep_id;

    $.when( jQuery.ajax(jsonpUrl) ).then(function( data ) {
      appWidget.trackEvent('Vote', 'Status', data.results.status);
      appWidget.trackEvent('Vote', 'Bill', bill.bill);
      appWidget.trackEvent('Vote', 'State', bill.state);
      appWidget.trackEvent('Vote', 'Session', bill.session);
      return callback(bill, data.results.status);
    });
  },

  /**
   * Open Modal
   * @param section
   */
  openModal: function(section){
    if(section === 'email' || section === 'phone'){
      var elm = jQuery('#' + this.elementName);
      jQuery('.widget-modal-content', elm).hide();
      jQuery('.widget-modal-' + section, elm).show();
      jQuery('.widget-modal', elm).fadeIn(250);
    }
  },

  /**
   * Close Modal
   */
  closeModal: function(){
    var elm = jQuery('#' + this.elementName);
    $('.widget-modal', elm).fadeOut(250);
  },

  /**
   * Load Initial Widget Form
   */
  init: function(){
    var self = this;
    var elm = jQuery('#' + this.elementName);
        elm.html('').append(this.templateForm());

    setTimeout(function(){

      jQuery('a', elm).click(function(){
        appWidget.trackEvent('Nav', 'Link Clicked', jQuery(this).text());
      });

      jQuery('button', elm).click(function(){
        appWidget.trackEvent('Nav', 'Button Clicked', jQuery(this).text());
      });

      jQuery('.wrapper', elm).show();
      jQuery('#campaign-zero-form').submit(function(event) {

        jQuery('button.submit', elm).attr('disabled', 'disabled').html('<i class="fa fa-circle-o-notch fa-spin fa-fw"></i> Loading');

        var zipcode = jQuery('#zip-code').val();
        var pattern = /[0-9]{5}/g;
        var allowGPS = (navigator.geolocation && window.location.protocol === 'https:');

        appWidget.trackEvent('Form', 'Submit', zipcode);

        if(zipcode !== '' && pattern.test(zipcode)){
          self.getRepresentatives(null, zipcode);
        } else if(zipcode !== '' && !pattern.test(zipcode)) {
          self.showError('Invalid Zip Code ( e.g. 90210 )');
          appWidget.trackEvent('Error', 'Submit Form', 'Invalid Zip Code');
        } else if(zipcode === '' && allowGPS) {
          self.getLocation();
        } else {
          self.showError('Enter a Zip Code ( e.g. 90210 )');
          appWidget.trackEvent('Error', 'Submit Form', 'No Zip Code Entered');
        }

        event.preventDefault();
      });
    }, 200);
  }
};
