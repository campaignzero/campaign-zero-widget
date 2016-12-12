var appWidget = {

  geoEnabled: null,
  geoLocation: {},
  geoErrorMessage: null,
  timeout: null,
  elementName: 'campaign-zero-widget',
  storedResponse: {},
  settings: window.CAMPAIGN_ZERO_WIDGET,

  /**
   * Track Event using Google Analytics
   * @param category
   * @param action
   * @param label
   * @param value
   */
  trackEvent: function (category, action, label, value) {
    if (typeof window.ga !== 'undefined') {
      ga('campaignZeroWidget.send', 'event', category, action, label, value);
    }
  },

  /**
   * Get Geo Location
   */
  getLocation: function () {
    if (appWidget.geoLocation && appWidget.geoLocation.latitude && appWidget.geoLocation.longitude) {
      appWidget.geoSuccess({
        coords: appWidget.geoLocation
      });
    } else if (appWidget.supportsGeolocation()) {
      navigator.geolocation.getCurrentPosition(appWidget.geoSuccess, appWidget.geoError);
      appWidget.geoEnabled = true;
    } else {
      appWidget.geoEnabled = false;
    }
  },

  /**
   * Geo Location Success
   * @param position
   */
  geoSuccess: function (position) {
    if (position) {
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
  geoError: function (error) {
    if (error) {
      switch(error.code) {
        case error.PERMISSION_DENIED:
          appWidget.geoErrorMessage = 'Denied Request for Geolocation.';
          break;

        case error.POSITION_UNAVAILABLE:
          appWidget.geoErrorMessage = 'Location Information Unavailable.';
          break;

        case error.TIMEOUT:
          appWidget.geoErrorMessage = 'Location Request Timed Out.';
          break;

        case error.UNKNOWN_ERROR:
          appWidget.geoErrorMessage = 'Unable to Determine Location.';
          break;
      }

      appWidget.trackEvent('Error', 'Geolocation', appWidget.geoErrorMessage);
      appWidget.showError(appWidget.geoErrorMessage);

      if (typeof Bugsnag !== 'undefined') {
        Bugsnag.notify('geoError', error);
      }
    }
  },

  /**
   * Show Error Message
   * @param error
   */
  showError: function (error) {
    if (typeof Bugsnag !== 'undefined') {
      Bugsnag.notifyException(error);
    }

    var elm = jQuery('#' + appWidget.elementName);

    jQuery('small.note', elm).html('<i class="fa fa-exclamation-triangle"></i>&nbsp; ' + error).addClass('error animated shake');
    jQuery('button.submit', elm).removeAttr('disabled').html('Find your rep');

    clearTimeout(appWidget.timeout);

    appWidget.timeout = setTimeout(function () {
      var note = (appWidget.supportsGeolocation()) ? 'leave empty to use your current location' : '';
      jQuery('small.note', elm).removeClass('error animated shake').html(note);
    }, 5000);
  },

  /**
   * Handle Form Submission
   * @param geoLocation
   * @param zipCode
   * @returns {boolean}
   */
  getRepresentatives: function (geoLocation, zipCode) {

    var jsonpUrl = appWidget.settings.api.base + 'legislators/';

    if (geoLocation) {
      jsonpUrl += '?latitude=' + geoLocation.latitude + '&longitude=' + geoLocation.longitude;
      appWidget.trackEvent('Fetch', 'Reps Geo', geoLocation.latitude + ',' + geoLocation.longitude);
    } else if(zipCode) {
      jsonpUrl += '?zipcode=' + zipCode;
      appWidget.trackEvent('Fetch', 'Reps Zipcode', zipCode);
    } else {
      return false;
    }

    jsonpUrl += '&apikey=' + appWidget.settings.api.key;

    jQuery.ajax({
      url: jsonpUrl,
      type: 'GET',
      dataType: 'json',
      success: function (response) {
        if(response && response.error) {
          appWidget.showError(response.errors[0]);
          appWidget.trackEvent('Error', 'Reps Error', response.errors);

          if (typeof Bugsnag !== 'undefined') {
            Bugsnag.notify('getRepresentativesError', response);
          }
        } else if(response.data.results && response.data.results && response.data.results.length > 0) {
          appWidget.getBills(response.data.results[0].state);
          appWidget.getPoliceKillings();

          appWidget.storedResponse = response.data;

          setTimeout(function () {
            appWidget.generateResults(response.data);
          }, 250);

        } else {
          appWidget.showError('Invalid Zip Code');
        }
      },
      error: function (jqXHR, textStatus, errorThrown) {
        appWidget.showError('ERROR: ' + errorThrown);
        appWidget.trackEvent('Error', 'Reps Error', errorThrown);
      }
    });
  },

  getBills: function (state) {
    var jsonpUrl = appWidget.settings.api.base + 'bills/?state=' + state + '&apikey=' + appWidget.settings.api.key;

    jQuery.ajax({
      url: jsonpUrl,
      type: 'GET',
      dataType: 'json',
      success: function (response) {
        if(response && response.error) {
          appWidget.showError(response.errors[0]);
          appWidget.trackEvent('Error', 'Reps Error', response.errors);

          if (typeof Bugsnag !== 'undefined') {
            Bugsnag.notify('getRepresentativesError', response);
          }
          appWidget.storedResponse.bills = {};
        } else {
          appWidget.storedResponse.bills = response.data;
        }
      },
      error: function (jqXHR, textStatus, errorThrown) {
        appWidget.showError('ERROR: ' + errorThrown);
        appWidget.trackEvent('Error', 'Reps Error', errorThrown);
      }
    });
  },

  getPoliceKillings: function () {
    appWidget.storedResponse.killings = {};
  },

  /**
   * Generate Results
   * @param response
   */
  generateResults: function (response) {

    appWidget.trackEvent('API', 'Rep Count Location', response.request.latitude + ',' + response.request.longitude, response.results.length);
    appWidget.trackEvent('API', 'Rep Count Zipcode', response.request.zipcode, response.results.length);

    var elm = jQuery('#' + appWidget.elementName);

    // No Results
    if(response && response.results.length === 0) {
      jQuery(elm).load(appWidget.settings.base + 'template/no-results.html', function () {

        jQuery('a', elm).off('click.widget');
        jQuery('a', elm).on('click.widget', function () {
          appWidget.trackEvent('Nav', 'Link Clicked', jQuery(this).text());
        });

        jQuery('small.back a', elm).off('click.widget');
        jQuery('small.back a', elm).on('click.widget', function () {
          appWidget.init();
          appWidget.trackEvent('Nav', 'Back Button', 'Main Page');
        });
      });
    }

    // Single Result
    if(response && response.results.length === 1) {
      var rep = response.results[0];
      var chamber = response.results[0]['chamber'];
      var bills = response.bills[chamber] || [];
      var killings = response.killings || { count: 0 };

      appWidget.generateDetails(rep, bills, killings, false);
    }

    // Multiple Results
    if(response && response.results.length >= 1) {
      jQuery(elm).load(appWidget.settings.base + 'template/results.html', function () {

        jQuery('.wrapper', elm).css('background-image', 'url(https://maps.googleapis.com/maps/api/staticmap?center=' + response.request.latitude + ',' + response.request.longitude + '&zoom=10&maptype=roadmap&size=800x600&sensor=false&style=feature:administrative|visibility:off&style=feature:landscape.natural.terrain|visibility:off&style=feature:poi|visibility:off&style=element:labels|visibility:off&style=feature:road|element:labels|visibility:off&style=feature:transit|visibility:off&style=feature:road|element:geometry|visibility:simplified|color:0x999999&style=feature:water|element:geometry|color:0xcccccc&style=feature:landscape|element:geometry.fill|color:0xaaaaaa&key=AIzaSyBlgFUsVry1HfM7cbWEfNmbu_RSPNQin9o)');

        var $template = $('<li>');

        jQuery($template).load(appWidget.settings.base + 'template/representative-summary.html', function () {

          for (var key in response.results) {
            if (response.results.hasOwnProperty(key)) {

              var rep = response.results[key];
              var $li = $template.clone();

              jQuery('.representative-summary .avatar', $li).attr('id', '#rep-image-' + key).addClass(rep.party.toLowerCase());
              jQuery('.representative-summary', $li).data('id', key).addClass(rep.party.toLowerCase());

              jQuery('.representative-summary .summary-name', $li).text(rep.full_name).addClass(rep.party.toLowerCase());
              jQuery('.representative-summary .summary-details .party', $li).text(rep.party);
              jQuery('.representative-summary .summary-details .district', $li).text(rep.district);
              jQuery('.representative-summary .summary-details .chamber', $li).text(rep.chamber);

              if (typeof rep.photo_url !== 'undefined' && rep.photo_url !== '') {
                jQuery('.representative-summary .avatar', $li).css('background-image', 'url(https://proxy.joincampaignzero.org/' + rep.photo_url + ')');
              }

              jQuery('ul.representatives', elm).append($li);
            }
          }

          jQuery('a', elm).off('click.widget');
          jQuery('a', elm).on('click.widget', function () {
            appWidget.trackEvent('Nav', 'Link Clicked', jQuery(this).text());
          });

          // Event Handlers
          jQuery('a.representative-summary', elm).off('click.widget');
          jQuery('a.representative-summary', elm).on('click.widget', function () {

            var id = jQuery(this).data('id');
            var rep = response.results[id];
            var chamber = response.results[id]['chamber'];
            var bills = response.bills[chamber] || [];
            var killings = response.killings || { count: 0 };

            appWidget.trackEvent('Nav', 'Selected Rep', rep.full_name);
            appWidget.trackEvent('Nav', 'Selected Rep State', rep.state.toUpperCase());

            appWidget.generateDetails(rep, bills, killings, true);
          });

          jQuery('button', elm).off('click.widget');
          jQuery('button', elm).on('click.widget', function () {
            appWidget.trackEvent('Nav', 'Button Clicked', jQuery(this).text());
          });

          jQuery('small.back a', elm).off('click.widget');
          jQuery('small.back a', elm).on('click.widget', function () {
            appWidget.init();
            appWidget.trackEvent('Nav', 'Back Button', 'Main Page');
          });
        });
      });
    }

    if (!response) {
      appWidget.trackEvent('Error', 'Representatives Error', 'No Representatives Found.');
      appWidget.showError('Currently Unable to Fetch Results');

      if (typeof Bugsnag !== 'undefined') {
        Bugsnag.notify('generateResultsError', response);
      }
    }
  },

  /**
   * Generate Representative Details
   * @param rep
   * @param bills
   * @param multiple
   */
  generateDetails: function (rep, bills, killings, multiple) {
    var elm = jQuery('#' + appWidget.elementName);

    jQuery(elm).load(appWidget.settings.base + 'template/representative-details.html', function () {

      // Prepare Data
      var phoneNumbers = '';
      for (var i = 0; i < rep.offices.length; i++) {
        if (rep.offices[i].phone) {
          phoneNumbers = phoneNumbers.concat('<div class="address-phone"><a href="tel:' + rep.offices[i].phone.replace(/-/g, '') + '">' + rep.offices[i].phone + '</a>&nbsp; <span>( ' + rep.offices[i].name + ' )</span></div>');
        }
      }

      var emailSubject = encodeURIComponent('We need urgent action to end police violence in our district.');
      var emailMessage = '';

      if(killings && killings.count > 0) {
        var label = (killings.count === 1) ? 'person' : 'people';
        emailMessage = encodeURIComponent("Greetings " + rep.full_name +  ",\r\n\r\nI'm from your district, and police violence needs to be urgently addressed in my community. This year alone, police in " + killings.state + " have killed at least " + killings.count + " " + label + ". We need comprehensive legislation to make deadly force a last resort for police officers, establish alternative responses to minor offenses, demilitarize police departments, ensure independent investigations and prosecutions of police killings, as well as other solutions proposed by Campaign Zero. Here's my story:\r\n\r\n[YOUR_REASON_HERE]");
      } else {
        emailMessage = encodeURIComponent("Greetings " + rep.full_name +  ",\r\n\r\nI'm from your district, and police violence needs to be urgently addressed through comprehensive legislation as proposed by Campaign Zero. Here's why:\r\n\r\n[YOUR_REASON_HERE]");
      }

      var emailAddress = '';

      if (rep.email) {
        emailAddress = '<div class="address-email"><a href="mailto:' + rep.email + '?subject=' + emailSubject + '&body=' + emailMessage + '">' + rep.email + '</a></div>';
      } else if(rep.offices && rep.offices[0].email) {
        emailAddress = '<div class="address-email"><a href="mailto:' + rep.offices[0].email + '?subject=' + emailSubject + '&body=' + emailMessage + '">' + rep.offices[0].email + '</a></div>';
      } else {
        emailAddress = '<div class="address-email"><a href="javascript:void(0)">No email address currently available</a></div>';
      }

      var status = appWidget.templateBills(bills, rep.id);

      // Replace Template Data
      jQuery('.representative', elm).css('background-image', 'url(https://maps.googleapis.com/maps/api/staticmap?center=' + appWidget.storedResponse.request.latitude + ',' + appWidget.storedResponse.request.longitude + '&zoom=10&maptype=roadmap&size=800x600&sensor=false&style=feature:administrative|visibility:off&style=feature:landscape.natural.terrain|visibility:off&style=feature:poi|visibility:off&style=element:labels|visibility:off&style=feature:road|element:labels|visibility:off&style=feature:transit|visibility:off&style=feature:road|element:geometry|visibility:simplified|color:0x999999&style=feature:water|element:geometry|color:0xcccccc&style=feature:landscape|element:geometry.fill|color:0xaaaaaa&key=AIzaSyBlgFUsVry1HfM7cbWEfNmbu_RSPNQin9o)');
      jQuery('#rep-image', elm).addClass(rep.party.toLowerCase()).css('background-image', 'url(https://proxy.joincampaignzero.org/' + rep.photo_url + ')');
      jQuery('.summary-name', elm).addClass(rep.party.toLowerCase()).text(rep.full_name);
      jQuery('.summary-details .party', elm).text(rep.party);
      jQuery('.summary-details .district', elm).text(rep.district);
      jQuery('.summary-details .chamber', elm).text(rep.chamber);
      jQuery('.summary-details .widget-bill-results', elm).html(status);

      jQuery('.widget-modal .phone-numbers', elm).html(phoneNumbers);
      jQuery('.widget-modal .email-addresses', elm).html(emailAddress);

      // Event Handlers
      jQuery('a', elm).off('click.widget');
      jQuery('a', elm).on('click.widget', function () {
        appWidget.trackEvent('Nav', 'Link Clicked', jQuery(this).text());
      });

      jQuery('button', elm).off('click.widget');
      jQuery('button', elm).on('click.widget', function () {
        appWidget.trackEvent('Nav', 'Button Clicked', jQuery(this).text());
      });

      jQuery('small.back a', elm).off('click.widget');
      jQuery('small.back a', elm).on('click.widget', function () {
        if(multiple) {
          appWidget.generateResults(appWidget.storedResponse);
          appWidget.trackEvent('Nav', 'Back Button', 'Back to Rep Listing');
        } else {
          appWidget.init();
          appWidget.trackEvent('Nav', 'Back Button', 'Main Page');
        }
      });

      jQuery('.widget-modal-close', elm).off('click.widget');
      jQuery('.widget-modal-close', elm).on('click.widget', function () {
        appWidget.closeModal();
        appWidget.trackEvent('Nav', 'Modal', 'Close Modal');
      });

      jQuery('.widget-modal-phone', elm).off('click.widget');
      jQuery('.widget-modal-phone', elm).on('click.widget', function () {
        appWidget.openModal('phone');
        appWidget.trackEvent('Nav', 'Modal', 'Open Phone Modal');
      });

      jQuery('.widget-modal-twitter', elm).off('click.widget');
      jQuery('.widget-modal-twitter', elm).on('click.widget', function () {
        appWidget.openModal('twitter');
        appWidget.trackEvent('Nav', 'Modal', 'Open Twitter Modal');
      });

      jQuery('.widget-modal-facebook', elm).off('click.widget');
      jQuery('.widget-modal-facebook', elm).on('click.widget', function () {
        appWidget.openModal('facebook');
        appWidget.trackEvent('Nav', 'Modal', 'Open Facebook Modal');
      });

      jQuery('.widget-modal-email', elm).off('click.widget');
      jQuery('.widget-modal-email', elm).on('click.widget', function () {
        appWidget.openModal('email');
        appWidget.trackEvent('Nav', 'Modal', 'Open Email Modal');
      });
    });
  },

  /**
   * Prevent Geolocation usage unless the user is using HTTPS protocol
   * @returns {boolean}
   */
  supportsGeolocation: function () {
    return (navigator.geolocation && window.location.protocol ==='https:');
  },

  /**
   * HTML Template for Bill Details
   * @param bills
   * @param rep_id
   * @returns {string}
   */
  templateBills: function (bills, rep_id) {
    var elm = jQuery('#' + appWidget.elementName);
    var html = '';

    if( !bills || bills.length === 0) {
      html = html.concat('<div class="support text-center">No bills on this issue.</div>');
    } else {

      bills.sort(function (a, b) {
        if(a.status < b. status) return -1;
        if(a.status > b. status) return 1;
        return 0;
      });

      for(var i = 0; i < bills.length; i++) {
        if(bills[i].status === 'considering') {
          html = html.concat('<div class="support"><span class="status ' + bills[i].status + '">' + bills[i].status + '</span> <a target="_blank" rel="noopener" href="' + bills[i].details_url + '">' + bills[i].bill_id + '</a> ' + bills[i].short_description + '</div>');
        } else {
          var billID = bills[i].bill_id;
          setTimeout(function () {
            jQuery('#widget-bill-results').append('<div id="loading-results" class="support text-center"><i class="fa fa-spinner fa-pulse fa-fw"></i> Checking status of ' + billID + ' ...</div>');
          }, 100);
          appWidget.voteStatus(bills[i], rep_id, function (bill, status) {
            jQuery('#loading-results').remove();
            setTimeout(function () {
              jQuery('#loading-results').remove();
            }, 500);
            var label = (status !== 'unknown') ? status : 'did not vote';
            jQuery('#widget-bill-results').append('<div class="support"><span class="status ' + status + ' ' + bill.progress + '">' + label + '</span> <a target="_blank" rel="noopener" href="' + bill.details_url + '">' + bill.bill_id + '</a> ' + bill.short_description + '</div>');

            jQuery('#widget-bill-results a', elm).off('click.widget');
            jQuery('#widget-bill-results a').on('click.widget', function () {
              appWidget.trackEvent('Nav', 'Bill Opened (State)', bill.state);
              appWidget.trackEvent('Nav', 'Bill Opened (Status)', status);
              appWidget.trackEvent('Nav', 'Bill Opened (Bill)', bill.bill_id);
              appWidget.trackEvent('Nav', 'Bill Opened (Session)', bill.session_id);
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
  voteStatus: function (bill, rep_id, callback) {
    var jsonpUrl = appWidget.settings.api.base + 'bills/?state=' + bill.state + '&sessionId=' + bill.session_id + '&billId=' + bill.bill_id + '&repId=' + rep_id + '&apikey=' + appWidget.settings.api.key;

    $.when( jQuery.ajax(jsonpUrl) ).then(function ( response ) {
      appWidget.trackEvent('Vote', 'Status', response.data[bill.chamber][0].vote);
      appWidget.trackEvent('Vote', 'Bill', bill.bill);
      appWidget.trackEvent('Vote', 'State', bill.state);
      appWidget.trackEvent('Vote', 'Session', bill.session);
      return callback(bill, response.data[bill.chamber][0].vote);
    });
  },

  /**
   * Open Modal
   * @param section
   */
  openModal: function (section) {
    if(section === 'email' || section === 'phone') {
      var elm = jQuery('#' + appWidget.elementName);
      jQuery('.widget-modal-content', elm).hide();
      jQuery('.widget-modal-' + section, elm).show();
      jQuery('.widget-modal', elm).fadeIn(250);
    }
  },

  /**
   * Close Modal
   */
  closeModal: function () {
    var elm = jQuery('#' + appWidget.elementName);
    $('.widget-modal', elm).fadeOut(250);
  },

  resize: function () {
    var elm = jQuery('#' + appWidget.elementName);
    var width = elm.width();

    elm.removeClass('w200 w220 w240 w280 w300 w320 w380');

    if (width <= 200) {
      elm.addClass('w200');
    }

    if (width <= 220) {
      elm.addClass('w220');
    }

    if (width <= 240) {
      elm.addClass('w240');
    }

    if (width <= 280) {
      elm.addClass('w280');
    }

    if (width <= 300) {
      elm.addClass('w300');
    }

    if (width <= 320) {
      elm.addClass('w320');
    }

    if (width <= 380) {
      elm.addClass('w380');
    }
  },

  /**
   * Load Initial Widget Form
   */
  init: function () {
    var elm = jQuery('#' + appWidget.elementName);
    var note = (appWidget.supportsGeolocation()) ? 'leave empty to use your current location' : '';

    jQuery(elm).html('');
    jQuery(elm).load(appWidget.settings.base + 'template/form.html', function () {

      // Update Content
      jQuery('.note', elm).html(note);

      // Event Handlers
      jQuery('a', elm).off('click.widget');
      jQuery('a', elm).on('click.widget', function () {
        appWidget.trackEvent('Nav', 'Link Clicked', jQuery(this).text());
      });

      jQuery('button', elm).off('click.widget');
      jQuery('button', elm).on('click.widget', function () {
        appWidget.trackEvent('Nav', 'Button Clicked', jQuery(this).text());
      });

      jQuery('.wrapper', elm).show();

      jQuery('#campaign-zero-form', elm).off('submit.widget');
      jQuery('#campaign-zero-form', elm).on('submit.widget', function (event) {

        jQuery('button.submit', elm).attr('disabled', 'disabled').html('<i class="fa fa-circle-o-notch fa-spin fa-fw"></i> Loading');

        var zipcode = jQuery('#zip-code').val();
        var pattern = /[0-9]{5}/g;
        var allowGPS = appWidget.supportsGeolocation();

        appWidget.trackEvent('Form', 'Submit', zipcode);

        if(zipcode !== '' && pattern.test(zipcode)) {
          appWidget.getRepresentatives(null, zipcode);
        } else if(zipcode !== '' && !pattern.test(zipcode)) {
          appWidget.showError('Invalid Zip Code ( e.g. 90210 )');
          appWidget.trackEvent('Error', 'Submit Form', 'Invalid Zip Code');
          if (typeof Bugsnag !== 'undefined') {
            Bugsnag.notify('invalidZipCode', zipcode);
          }
        } else if(zipcode === '' && allowGPS) {
          appWidget.getLocation();
        } else {
          appWidget.showError('Enter a Zip Code ( e.g. 90210 )');
          appWidget.trackEvent('Error', 'Submit Form', 'No Zip Code Entered');
        }

        event.preventDefault();
        return false;
      });

      appWidget.resize();
    });
  }
};
