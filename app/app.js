var appWidget = {

  geoEnabled: null,
  geoLocation: {},
  geoErrorMessage: null,
  timeout: null,
  elementName: 'campaign-zero-widget',
  storedRepresentatives: null,

  /** Get Geo Location */
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

  /** Geo Location Success */
  geoSuccess: function(position) {
    if(position){
      appWidget.geoLocation = position.coords;
      appWidget.getRepresentatives(appWidget.geoLocation);
    } else {
      appWidget.showError('Unable to Dtermine Location');
    }
  },

  /** Geo Location Error */
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

      appWidget.showError(this.geoErrorMessage);
    }
  },

  /** Show Error Message */
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

  /** Handle Form Submission */
  getRepresentatives: function(geoLocation, zipCode){

    var jsonpUrl = './app/index.php';
    if(geoLocation){
      jsonpUrl += '?latitude=' + geoLocation.latitude + '&longitude=' + geoLocation.longitude
    } else if(zipCode){
      jsonpUrl += '?zipcode=' + zipCode
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
        } else {
          self.storedRepresentatives = response;
          self.generateResults(response);
        }
      },
      error: function(jqXHR, textStatus, errorThrown) {
        self.showError('ERROR: ' + errorThrown);
      }
    });
  },

  /** Generate Results */
  generateResults: function(response){
    var self = this;
    var elm = jQuery('#' + this.elementName);

    setTimeout(function(){
      elm.html('');

      var backgroundImage = 'https://maps.googleapis.com/maps/api/staticmap?center='+ response.location.latitude +','+ response.location.longitude +'&zoom=10&maptype=roadmap&size=800x600&sensor=false&style=feature:administrative|visibility:off&style=feature:landscape.natural.terrain|visibility:off&style=feature:poi|visibility:off&style=element:labels|visibility:off&style=feature:road|element:labels|visibility:off&style=feature:transit|visibility:off&style=feature:road|element:geometry|visibility:simplified|color:0x999999&style=feature:water|element:geometry|color:0xcccccc&style=feature:landscape|element:geometry.fill|color:0xaaaaaa';
      var html = '<div class="wrapper" style="min-height: 298px; background: url('+ backgroundImage +') center center no-repeat; background-size: cover;">';

      if(response && response.results.length === 1){
        self.generateDetails(response.results[0], false);
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
          jQuery('small.back a', elm).click(function(){
            self.init();
          });

          jQuery('a.representative-summary', elm).click(function(){
            var id = jQuery(this).data('id');
            self.generateDetails(response.results[id], true);
          });
        }, 200);

      } else if (response && response.results.length === 0){
        self.showError('No Representatives Found.');
      }

    }, 200);
  },

  /** Generate Representative Details */
  generateDetails: function(rep, multiple){
    var self = this;
    var elm = jQuery('#' + this.elementName);
        elm.html('').append(this.templateDetails(rep));

    jQuery('small.back a', elm).click(function(){
      if(multiple){
        self.generateResults(self.storedRepresentatives);
      } else {
        self.init();
      }
    });
  },

  /** HTML Template for Initial Form */
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
      '<a class="add-to-site" href="https://github.com/manifestinteractive/campaign-zero-widget" target="_blank">Add <span>this</span> to <span>your</span> site</a>' +
      '</div>';
  },

  /** HTML Template for Representative Summary */
  templateSummary: function(key, rep){
    return '<li><a href="javascript:void(0)" class="representative-summary animated fadeIn" data-id="'+ key +'">' +
      '<div class="avatar ' + rep.party.toLowerCase() + '" style="background-image: url(' + rep.photo_url + ')"></div>' +
      '<div class="summary">'+
      '<div class="summary-name ' + rep.party.toLowerCase() + '">' + rep.full_name + '</div>' +
      '<div class="summary-details"><strong>' + rep.party + '</strong> &nbsp;&nbsp; <strong>District:</strong> ' + rep.district + ' &nbsp;&nbsp; <strong>Chamber:</strong> ' + rep.chamber + '</div>' +
      '</div>' +
      '</a></li>';
  },

  /** HTML Template for Representative Details */
  templateDetails: function(rep){
    var backgroundImage = 'https://maps.googleapis.com/maps/api/staticmap?center=' + this.storedRepresentatives.location.latitude + ',' + this.storedRepresentatives.location.longitude + '&zoom=10&maptype=roadmap&size=800x600&sensor=false&style=feature:administrative|visibility:off&style=feature:landscape.natural.terrain|visibility:off&style=feature:poi|visibility:off&style=element:labels|visibility:off&style=feature:road|element:labels|visibility:off&style=feature:transit|visibility:off&style=feature:road|element:geometry|visibility:simplified|color:0x999999&style=feature:water|element:geometry|color:0xcccccc&style=feature:landscape|element:geometry.fill|color:0xaaaaaa';

    return '<div class="wrapper text-center representative" style="min-height: 298px; background: url(' + backgroundImage + ') center center no-repeat; background-size: cover;">' +
      '<div class="summary-name ' + rep.party.toLowerCase() + '">' + rep.full_name + '</div>' +
      '<div class="summary-details"><strong>' + rep.party + '</strong> &nbsp;&nbsp; <strong>District:</strong> ' + rep.district + ' &nbsp;&nbsp; <strong>Chamber:</strong> ' + rep.chamber + '</div>' +
      '<div class="avatar large animated flipInY ' + rep.party.toLowerCase() + '" style="background-image: url(' + rep.photo_url + ')"></div>' +
      '<div class="action-buttons">' +
      '<a href="javascript:void(0)" class="action-button"><i class="fa fa-phone"></i></a>' +
      '<a href="javascript:void(0)" class="action-button"><i class="fa fa-twitter"></i></a>' +
      '<a href="javascript:void(0)" class="action-button"><i class="fa fa-facebook-official"></i></a>' +
      '<a href="javascript:void(0)" class="action-button"><i class="fa fa-envelope"></i></a>' +
      '</div>'+
      '<div class="support"><span class="status">supports</span> ending police violance</div>' +
      '</div>' +
      '<small class="powered-by back"><a href="javascript:void(0);"><i class="fa fa-angle-left"></i>&nbsp; Back</a></small>';
  },

  /** Load Initial Widget Form */
  init: function(){
    var self = this;
    var elm = jQuery('#' + this.elementName);
        elm.html('').append(this.templateForm());

    setTimeout(function(){
      jQuery('.wrapper', elm).show();
      jQuery('#campaign-zero-form').submit(function(event) {

        jQuery('button.submit', elm).attr('disabled', 'disabled').html('<i class="fa fa-circle-o-notch fa-spin fa-fw"></i> Loading');

        var zipcode = jQuery('#zip-code').val();
        var pattern = /[0-9]{5}/g;
        var allowGPS = (navigator.geolocation);

        if(zipcode !== '' && pattern.test(zipcode)){
          self.getRepresentatives(null, zipcode);
        } else if(zipcode !== '' && !pattern.test(zipcode)) {
          self.showError('Invalid Zip Code ( e.g. 90210 )');
        } else if(zipcode === '' && allowGPS) {
          self.getLocation();
        } else {
          self.showError('Enter a Zip Code ( e.g. 90210 )');
        }

        event.preventDefault();
      });
    }, 200);
  }
};
