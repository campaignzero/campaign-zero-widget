var appWidget = {

  timeout: null,
  promptedCityData: false,
  elementName: 'campaign-zero-widget',
  selectedTab: 'representatives',
  storedResponse: {},
  storedLocation: {},
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
   * Title Case
   * @param str
   * @returns {string}
   */
  titleCase: function (str) {
    str = str.replace('-', ' ').replace('_', ' ');
    str = str.toLowerCase().split(' ');
    for (var i = 0; i < str.length; i++) {
      str[i] = str[i].charAt(0).toUpperCase() + str[i].slice(1);
    }
    return str.join(' ');
  },

  /**
   * Show Error Message
   * @param error
   */
  showError: function (error) {
    if (typeof console !== 'undefined') {
      console.error(error);
    }

    if (typeof error !== 'string') {
      return false;
    }

    var elm = jQuery('#' + appWidget.elementName);

    jQuery('small.note', elm).html('<i class="fa fa-exclamation-triangle"></i>&nbsp; ' + error).addClass('error animated shake');
    jQuery('button.submit', elm).removeAttr('disabled').html('Find your rep');

    clearTimeout(appWidget.timeout);

    appWidget.timeout = setTimeout(function () {
      var note = '';
      jQuery('small.note', elm).removeClass('error animated shake').html(note);
    }, 5000);
  },

  /**
   * Handle Form Submission
   * @param geoLocation
   * @returns {boolean}
   */
  getRepresentatives: function (geoLocation) {

    var jsonpUrl = appWidget.settings.api.base + 'legislators/';

    if (geoLocation) {
      jsonpUrl += '?latitude=' + geoLocation.latitude + '&longitude=' + geoLocation.longitude;
      appWidget.trackEvent('Fetch', 'Reps Geo', geoLocation.latitude + ',' + geoLocation.longitude);
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
        } else if(response.data.results && response.data.results && response.data.results.length > 0) {

          appWidget.storedResponse = response.data;

          appWidget.getBills(appWidget.storedLocation.state.state_code);
          appWidget.getPoliceKillings(appWidget.storedLocation.state.state_code);
          appWidget.getGovernment(appWidget.storedLocation.location, appWidget.storedLocation.state.state_code);

          setTimeout(function () {
            appWidget.generateResults(response.data);
          }, 250);

        } else {
          appWidget.showError('Invalid Address');
        }
      },
      error: function (jqXHR, textStatus, errorThrown) {
        appWidget.showError('ERROR: ' + errorThrown);
        appWidget.trackEvent('Error', 'Reps Error', errorThrown);
      }
    });
  },

  /**
   * Get Government for Provided Location
   * @param location
   */
  getGovernment: function (location, state) {
    var jsonpUrl = appWidget.settings.api.base + 'government/?state=' + state + '&latitude=' + location.latitude + '&longitude=' + location.longitude + '&apikey=' + appWidget.settings.api.key;

    jQuery.ajax({
      url: jsonpUrl,
      type: 'GET',
      dataType: 'json',
      success: function (response) {
        appWidget.storedResponse.government = [];

        if(response && response.error) {
          appWidget.showError(response.errors[0]);
          appWidget.trackEvent('Error', 'Government Error', response.errors);
        } else {
          appWidget.government = response.data;
          appWidget.selectedTab = (response.data.city_council && response.data.city_council.length > 0) ? 'city-council' : 'representatives';
        }
      },
      error: function (jqXHR, textStatus, errorThrown) {
        appWidget.showError('ERROR: ' + errorThrown);
        appWidget.trackEvent('Error', 'Senators Error', errorThrown);
      }
    });
  },

  /**
   * Get Bills for given State
   * @param state
   */
  getBills: function (state) {
    var jsonpUrl;
    if (appWidget.settings.type === 'default') {
      jsonpUrl = appWidget.settings.data + 'bills.php?state=' + state;
    } else if (appWidget.settings.type === 'resistance') {
      jsonpUrl = appWidget.settings.data + 'resistance.php?state=' + state;
    }

    jQuery.ajax({
      url: jsonpUrl,
      type: 'GET',
      dataType: 'json',
      success: function (response) {
        if(response && response.error) {
          appWidget.showError(response.errors[0]);
          appWidget.trackEvent('Error', 'Reps Error', response.errors);
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

  /**
   * Get Police Killings
   */
  getPoliceKillings: function (state) {
    appWidget.storedResponse.killings = {};

    var jsonpUrl = appWidget.settings.data + 'police_killings.php?state=' + state;

    jQuery.ajax({
      url: jsonpUrl,
      type: 'GET',
      dataType: 'json',
      success: function (response) {
        if(response && response.error) {
          appWidget.showError('Invalid Police Killings');
          appWidget.trackEvent('Error', 'Police Killings Error');
          appWidget.storedResponse.killings = {};
        } else {
          appWidget.storedResponse.killings = response.data;
        }
      },
      error: function (jqXHR, textStatus, errorThrown) {
        appWidget.showError('ERROR: ' + errorThrown);
        appWidget.trackEvent('Error', 'Reps Error', errorThrown);
      }
    });
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

        jQuery('.pick-rep', elm).text(appWidget.settings.labels.pickRep);

        jQuery('.wrapper', elm).css('background-image', 'url(https://maps.googleapis.com/maps/api/staticmap?center=' + response.request.latitude + ',' + response.request.longitude + '&zoom=10&maptype=roadmap&size=800x600&sensor=false&style=feature:administrative|visibility:off&style=feature:landscape.natural.terrain|visibility:off&style=feature:poi|visibility:off&style=element:labels|visibility:off&style=feature:road|element:labels|visibility:off&style=feature:transit|visibility:off&style=feature:road|element:geometry|visibility:simplified|color:0x999999&style=feature:water|element:geometry|color:0xcccccc&style=feature:landscape|element:geometry.fill|color:0xaaaaaa&key=AIzaSyBlgFUsVry1HfM7cbWEfNmbu_RSPNQin9o)');

        var $template = $('<li>');

        jQuery($template).load(appWidget.settings.base + 'template/representative-summary.html', function () {

          for (var key in response.results) {
            if (response.results.hasOwnProperty(key)) {

              var rep = response.results[key];
              var $li = $template.clone();

              if (!rep.full_name && rep.name) {
                rep.full_name = rep.name;
              }

              var title = (rep.chamber && rep.chamber === 'upper') ? 'Senator' : 'Representative';

              jQuery('.representative-summary .avatar', $li).attr('id', '#rep-image-' + key);
              jQuery('.representative-summary', $li).data('type', 'representative');
              jQuery('.representative-summary', $li).data('id', key).addClass(rep.party.toLowerCase());

              jQuery('.representative-summary .summary-name', $li).text(title + ' ' + rep.full_name);
              jQuery('.representative-summary .summary-details .party', $li).text(rep.party);
              jQuery('.representative-summary .summary-details .district', $li).text(rep.district);
              jQuery('.representative-summary .summary-details .chamber', $li).text(rep.chamber);

              // Hide Element Not Needed
              if (!rep.district || rep.district === '' || (rep.chamber && rep.chamber === 'upper')) {
                jQuery('.summary-details .district, .summary-details .district-label', $li).hide();
              }

              if (!rep.chamber || rep.chamber === '') {
                jQuery('.summary-details .chamber, .summary-details .chamber-label', $li).hide();
              }

              if (typeof rep.photo_url !== 'undefined' && rep.photo_url !== '') {
                var image = (rep.photo_url).startsWith('https://') ? rep.photo_url : 'https://proxy.joincampaignzero.org/' + rep.photo_url;
                jQuery('.representative-summary .avatar', $li).css('background-image', 'url(' + image + ')');
              }

              jQuery('ul.representatives', elm).append($li);
            }
          }

          // Add City Council
          if (appWidget.government && appWidget.government.city_council) {
            for (var i = 0; i < appWidget.government.city_council.length; i++) {
              var rep = appWidget.government.city_council[i];
              var $li = $template.clone();

              if (!rep.full_name && rep.name) {
                rep.full_name = rep.name;
              }

              jQuery('.representative-summary .avatar', $li).attr('id', '#rep-image-' + i);
              jQuery('.representative-summary', $li).data('type', 'city-council');
              jQuery('.representative-summary', $li).data('id', i).addClass(rep.party.toLowerCase());

              jQuery('.representative-summary .summary-name', $li).text(appWidget.titleCase(rep.title) + ' ' + rep.full_name);
              jQuery('.representative-summary .summary-details .party', $li).text(rep.party);
              jQuery('.representative-summary .summary-details .district', $li).text(rep.district);

              // Hide Element Not Needed
              if (!rep.district || rep.district === '') {
                jQuery('.summary-details .district, .summary-details .district-label', $li).hide();
              }

              jQuery('.summary-details .chamber, .summary-details .chamber-label', $li).hide();

              if (typeof rep.photo_url !== 'undefined' && rep.photo_url !== '') {
                var image = (rep.photo_url).startsWith('https://') ? rep.photo_url : 'https://proxy.joincampaignzero.org/' + rep.photo_url;
                jQuery('.representative-summary .avatar', $li).css('background-image', 'url(' + image + ')');
              }

              // fix for issue #10 to set order in which city council members are ordered
              if (rep.title === 'mayor') {
                jQuery('ul.city-council-mayor', elm).append($li);
              } else if (rep.title === 'district-attorney') {
                jQuery('ul.city-council-district-attorney', elm).append($li);
              } else {
                jQuery('ul.city-council-councilor', elm).append($li);
              }
            }
          }

          // Add Senators
          if (appWidget.government && appWidget.government.senate) {
            for (var i = 0; i < appWidget.government.senate.length; i++) {
              var rep = appWidget.government.senate[i];
              var $li = $template.clone();

              if (!rep.full_name && rep.name) {
                rep.full_name = rep.name;
              }

              jQuery('.representative-summary .avatar', $li).attr('id', '#rep-image-' + i);
              jQuery('.representative-summary', $li).data('type', 'senator');
              jQuery('.representative-summary', $li).data('id', i).addClass(rep.party.toLowerCase());

              jQuery('.representative-summary .summary-name', $li).text('Senator ' + rep.name);
              jQuery('.representative-summary .summary-details .party', $li).text(rep.party);

              // Hide Element Not Needed
              if (!rep.district || rep.district === '') {
                jQuery('.summary-details .district, .summary-details .district-label', $li).hide();
              }

              if (!rep.chamber || rep.chamber === '') {
                jQuery('.summary-details .chamber, .summary-details .chamber-label', $li).hide();
              }

              if (typeof rep.photo_url !== 'undefined' && rep.photo_url !== '') {
                var image = (rep.photo_url).startsWith('https://') ? rep.photo_url : 'https://proxy.joincampaignzero.org/' + rep.photo_url;
                jQuery('.representative-summary .avatar', $li).css('background-image', 'url(' + image + ')');
              }

              jQuery('ul.federal', elm).append($li);
            }
          }

          // Add Governor
          if (appWidget.government && appWidget.government.governor) {
            for (var i = 0; i < appWidget.government.governor.length; i++) {
              var rep = appWidget.government.governor[i];
              var $li = $template.clone();

              if (!rep.full_name && rep.name) {
                rep.full_name = rep.name;
              }

              jQuery('.representative-summary .avatar', $li).attr('id', '#rep-image-' + i);
              jQuery('.representative-summary', $li).data('type', 'governor');
              jQuery('.representative-summary', $li).data('id', i).addClass(rep.party.toLowerCase());

              jQuery('.representative-summary .summary-name', $li).text('Governor ' + rep.name);
              jQuery('.representative-summary .summary-details .party', $li).text(rep.party);

              // Hide Element Not Needed
              jQuery('.summary-details .district, .summary-details .district-label', $li).hide();
              jQuery('.summary-details .chamber, .summary-details .chamber-label', $li).hide();

              if (typeof rep.photo_url !== 'undefined' && rep.photo_url !== '') {
                var image = (rep.photo_url).startsWith('https://') ? rep.photo_url : 'https://proxy.joincampaignzero.org/' + rep.photo_url;
                jQuery('.representative-summary .avatar', $li).css('background-image', 'url(' + image + ')');
              }

              jQuery('ul.representatives', elm).append($li);
            }
          }

          // Add House Reps
          if (appWidget.government && appWidget.government.house) {
            for (var i = 0; i < appWidget.government.house.length; i++) {
              var rep = appWidget.government.house[i];
              var $li = $template.clone();

              if (!rep.full_name && rep.name) {
                rep.full_name = rep.name;
              }

              jQuery('.representative-summary .avatar', $li).attr('id', '#rep-image-' + i);
              jQuery('.representative-summary', $li).data('type', 'house');
              jQuery('.representative-summary', $li).data('id', i).addClass(rep.party.toLowerCase());

              jQuery('.representative-summary .summary-name', $li).text('Rep. ' + rep.name);
              jQuery('.representative-summary .summary-details .party', $li).text(rep.party);
              jQuery('.representative-summary .summary-details .district', $li).text(rep.district);

              // Hide Element Not Needed
              if (!rep.district || rep.district === '') {
                jQuery('.summary-details .district, .summary-details .district-label', $li).hide();
              }

              jQuery('.summary-details .chamber, .summary-details .chamber-label', $li).hide();

               if (typeof rep.photo_url !== 'undefined' && rep.photo_url !== '') {
                var image = (rep.photo_url).startsWith('https://') ? rep.photo_url : 'https://proxy.joincampaignzero.org/' + rep.photo_url;
                jQuery('.representative-summary .avatar', $li).css('background-image', 'url(' + image + ')');
               }

              jQuery('ul.federal', elm).append($li);
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
            var type = jQuery(this).data('type');
            var killings = appWidget.storedResponse.killings || { count: 0 };
            var rep, chamber, bill;

            if (type === 'city-council') {
              rep = appWidget.government.city_council[id];
              chamber = null;
              bills = [];
            } else if (type === 'representative') {
              rep = response.results[id];
              chamber = response.results[id]['chamber'];
              bills = response.bills[chamber] || [];
            } else if (type === 'senator') {
              rep = appWidget.government.senate[id];
              chamber = null;
              bills = [];
            } else if (type === 'house') {
              rep = appWidget.government.house[id];
              chamber = null;
              bills = [];
            } else if (type === 'governor') {
              rep = appWidget.government.governor[id];
              chamber = null;
              bills = [];
            }

            appWidget.generateDetails(rep, bills, killings, true);

            if (typeof rep.name !== 'undefined' && typeof rep.state_code !== 'undefined') {
              appWidget.trackEvent('Nav', 'Selected Rep', rep.name);
              appWidget.trackEvent('Nav', 'Selected Rep State', rep.state_code);
            }
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

          if ((appWidget.government.city_council && appWidget.government.city_council.length > 0) || (appWidget.government.senate && appWidget.government.senate.length > 0) || (appWidget.government.house && appWidget.government.house.length > 0) || (appWidget.government.governor && appWidget.government.governor.length > 0)) {

            jQuery('a.tab-button', elm).removeClass('active');
            jQuery('#' + appWidget.selectedTab + '-button', elm).addClass('active');

            jQuery('.tab-content', elm).removeClass('active');
            jQuery('#' + appWidget.selectedTab + '-tab', elm).addClass('active');

            jQuery('.tab-set', elm).show();

            jQuery('a.tab-button', elm).off('click.widget');
            jQuery('a.tab-button', elm).on('click.widget', function () {
              var id = jQuery(this).attr('id');
              var text = jQuery(this).text();

              appWidget.selectedTab = id.replace('-button', '');

              jQuery('a.tab-button', elm).removeClass('active');
              jQuery(this).addClass('active');

              jQuery('.tab-content', elm).removeClass('active');
              jQuery('#' + id.replace('-button', '-tab')).addClass('active');

              appWidget.trackEvent('Nav', 'Selected Tab', text);
            });
          } else {
            jQuery('.federal-tab', elm).removeClass('active');
            jQuery('.city-council-tab', elm).removeClass('active');
            jQuery('.representatives-tab', elm).addClass('active');
          }

          if (!appWidget.government.city_council || appWidget.government.city_council.length === 0) {
            jQuery('a.tab-button', elm).removeClass('active');
            jQuery('#' + appWidget.selectedTab + '-button', elm).addClass('active');

            jQuery('.tab-content', elm).removeClass('active');
            jQuery('#' + appWidget.selectedTab + '-tab', elm).addClass('active');

            jQuery('.tab-set', elm).show();

            jQuery('.city-council-tab', elm).removeClass('active').hide();
            jQuery('#city-council-button', elm).removeClass('active').hide();
          }
        });
      });
    }

    if (!response) {
      appWidget.trackEvent('Error', 'Representatives Error', 'No Representatives Found.');
      appWidget.showError('Currently Unable to Fetch Results');
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
      if (typeof rep.offices !== 'undefined') {
        for (var i = 0; i < rep.offices.length; i++) {
          if (rep.offices[i].phone) {
            phoneNumbers = phoneNumbers.concat('<div class="address-phone"><a href="tel:' + rep.offices[i].phone.replace(/-/g, '') + '">' + rep.offices[i].phone + '</a>&nbsp; <span>( ' + rep.offices[i].name + ' )</span></div>');
          }
        }
      } else if (rep.phone) {
        phoneNumbers = phoneNumbers.concat('<div class="address-phone"><a href="tel:' + rep.phone.replace(/-/g, '') + '">' + rep.phone + '</a></div>');
      }

      var emailSubject = encodeURIComponent(appWidget.settings.email.subject);
      var emailMessage = '';

      if(killings && killings.count > 0 && appWidget.settings.type === 'default') {
        var label = (killings.count === 1) ? 'person' : 'people';
        emailMessage = encodeURIComponent(appWidget.settings.email.greeting + " " + rep.full_name +  ",\r\n\r\n" + appWidget.settings.email.body + " In 2016, police in " + killings.state + " have killed at least " + killings.count + " " + label + ". We need comprehensive legislation to make deadly force a last resort for police officers, establish alternative responses to minor offenses, demilitarize police departments, ensure independent investigations and prosecutions of police killings, as well as other solutions proposed by Campaign Zero.\r\n\r\n" + appWidget.settings.email.action);
      } else {
        emailMessage = encodeURIComponent(appWidget.settings.email.greeting + " " + rep.full_name +  ",\r\n\r\n" + appWidget.settings.email.body + "\r\n\r\n" + appWidget.settings.email.action);
      }

      var emailAddress = '';

      if (rep.email) {
        emailAddress = '<div class="address-email"><a href="mailto:' + rep.email + '?subject=' + emailSubject + '&body=' + emailMessage + '">' + rep.email + '</a></div>';
      } else if(rep.offices && rep.offices[0].email) {
        emailAddress = '<div class="address-email"><a href="mailto:' + rep.offices[0].email + '?subject=' + emailSubject + '&body=' + emailMessage + '">' + rep.offices[0].email + '</a></div>';
      } else if (phoneNumbers !== '') {
        emailAddress = '<div class="address-email"><a href="javascript:void(0)">No email address currently available</a></div><div style="margin-bottom: 12px; font-weight: 300;">Try calling them instead:</div>' + phoneNumbers;
      } else {
        emailAddress = '<div class="address-email"><a href="javascript:void(0)">No email address currently available</a></div>';
      }

      if (typeof rep.photo_url !== 'undefined' && rep.photo_url !== '') {
        var image = (rep.photo_url).startsWith('https://') ? rep.photo_url : 'https://proxy.joincampaignzero.org/' + rep.photo_url;
        jQuery('#rep-image', elm).addClass(rep.party.toLowerCase()).css('background-image', 'url(' + image + ')');
      }

      if (!rep.full_name && rep.name) {
        rep.full_name = rep.name;
      }

      // Replace Template Data
      jQuery('.representative', elm).css('background-image', 'url(https://maps.googleapis.com/maps/api/staticmap?center=' + appWidget.storedResponse.request.latitude + ',' + appWidget.storedResponse.request.longitude + '&zoom=10&maptype=roadmap&size=800x600&sensor=false&style=feature:administrative|visibility:off&style=feature:landscape.natural.terrain|visibility:off&style=feature:poi|visibility:off&style=element:labels|visibility:off&style=feature:road|element:labels|visibility:off&style=feature:transit|visibility:off&style=feature:road|element:geometry|visibility:simplified|color:0x999999&style=feature:water|element:geometry|color:0xcccccc&style=feature:landscape|element:geometry.fill|color:0xaaaaaa&key=AIzaSyBlgFUsVry1HfM7cbWEfNmbu_RSPNQin9o)');
      jQuery('.summary-name', elm).addClass(rep.party.toLowerCase()).text(rep.full_name);
      jQuery('.summary-details .party', elm).text(rep.party);
      jQuery('.summary-details .district', elm).text(rep.district);
      jQuery('.summary-details .chamber', elm).text(rep.chamber);

      jQuery('a.widget-twitter', elm).attr('href', 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(appWidget.settings.twitter.text) + '&hashtags=' + encodeURIComponent(appWidget.settings.twitter.hashtags));
      jQuery('a.widget-facebook', elm).attr('href', 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(appWidget.settings.facebook.link) + '&description=' + encodeURIComponent(appWidget.settings.facebook.description));

      if (appWidget.selectedTab === 'representatives') {
        appWidget.templateBills(bills, rep.id);
      }

      jQuery('.widget-modal .phone-numbers', elm).html(phoneNumbers);
      jQuery('.widget-modal .email-addresses', elm).html(emailAddress);

      jQuery('.widget-modal-phone h1', elm).text(appWidget.settings.labels.call);
      jQuery('.widget-modal-email h1', elm).text(appWidget.settings.labels.email);

      // Hide Element Not Needed
      if (!rep.district || rep.district === '') {
        jQuery('.summary-details .district, .summary-details .district-label', elm).hide();
      }

      if (!rep.chamber || rep.chamber === '') {
        jQuery('.summary-details .chamber, .summary-details .chamber-label', elm).hide();
      }

      if (rep.offices && rep.offices[0].address) {
        jQuery('.action-buttons .widget-map', elm).attr('href', 'https://maps.google.com/maps?q=' + encodeURIComponent(rep.offices[0].address.replace('\n', ', ')));
      } else {
        jQuery('.action-buttons .widget-map', elm).hide();
      }

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
   * Geocode Address
   * @param address
   */
  geoCodeAddress: function (address) {
    var cleanAddress = address.replace(/ /g, '+');

    var jsonpUrl = 'https://maps.googleapis.com/maps/api/geocode/json?address=' + cleanAddress + '&key=AIzaSyBlgFUsVry1HfM7cbWEfNmbu_RSPNQin9o';

    jQuery.ajax({
      url: jsonpUrl,
      type: 'GET',
      dataType: 'json',
      success: function (response) {
        if (response.status && response.status === 'OK' && response && response.results && response.results.length > 0) {
          var geolocation = {
              latitude: response.results[0].geometry.location.lat,
              longitude: response.results[0].geometry.location.lng
          };

          appWidget.storedLocation = {
            location: geolocation,
            address: response.results[0].formatted_address
          };

          var components = response.results[0].address_components;

          for (var i = 0; i < components.length; i++) {
            if (components[i].types.indexOf('administrative_area_level_1') > -1) {
              appWidget.storedLocation.state = {
                state_name: components[i].long_name,
                state_code: components[i].short_name
              }
            }

            if (components[i].types.indexOf('locality') > -1) {
              appWidget.storedLocation.city = components[i].long_name;
            }
          }

          appWidget.getRepresentatives(geolocation);
        }
      },
      error: function (jqXHR, textStatus, errorThrown) {
        appWidget.trackEvent('Error', 'Geo Code Address Error', errorThrown);
      }
    });
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

    if(bills && bills.length > 0) {
      bills.sort(function (a, b) {
        if(a.status < b. status) return -1;
        if(a.status > b. status) return 1;
        return 0;
      });

      for(var i = 0; i < bills.length; i++) {
        if(bills[i].status === 'considering') {
          jQuery('#widget-bill-results', elm).append('<div class="support"><span class="status ' + bills[i].status + '">' + bills[i].status + '</span> <a target="_blank" rel="noopener" href="' + bills[i].url + '">' + bills[i].bill + '</a> ' + bills[i].label + '</div>');
        } else {
          appWidget.voteStatus(bills[i], rep_id, function (bill, status) {
            jQuery('#loading-results', elm).remove();
            setTimeout(function () {
              jQuery('#loading-results', elm).remove();
            }, 500);
            var label = (status !== 'unknown') ? status : 'no vote';

            jQuery('#widget-bill-results', elm).append('<div class="support"><span class="status ' + status + ' ' + bill.progress + '">' + label + '</span> <a target="_blank" rel="noopener" href="' + bill.url + '">' + bill.bill + '</a> ' + bill.label + '</div>');

            jQuery('#widget-bill-results a', elm).off('click.widget');
            jQuery('#widget-bill-results a', elm).on('click.widget', function () {
              appWidget.trackEvent('Nav', 'Bill Opened (State)', bill.state);
              appWidget.trackEvent('Nav', 'Bill Opened (Status)', status);
              appWidget.trackEvent('Nav', 'Bill Opened (Bill)', bill.bill);
              appWidget.trackEvent('Nav', 'Bill Opened (Session)', bill.session);
            });
          });
        }
      }
    }
  },

  /**
   * Check for Voting Status
   * @param bill
   * @param rep_id
   * @param callback
   */
  voteStatus: function (bill, rep_id, callback) {
    var jsonpUrl;

    if (appWidget.settings.type === 'default') {
      jsonpUrl = appWidget.settings.data + 'bills.php?state=' + bill.state + '&session=' + bill.session + '&bill=' + bill.bill + '&rep=' + rep_id;
    } else if (appWidget.settings.type === 'resistance') {
      jsonpUrl = appWidget.settings.data + 'resistance.php?state=' + bill.state + '&session=' + bill.session + '&bill=' + bill.bill + '&rep=' + rep_id;
    }

    $.when( jQuery.ajax(jsonpUrl) ).then(function ( response ) {
      appWidget.trackEvent('Vote', 'Status', response.results.status);
      appWidget.trackEvent('Vote', 'Bill', bill.bill);
      appWidget.trackEvent('Vote', 'State', bill.state);
      appWidget.trackEvent('Vote', 'Session', bill.session);
      return callback(bill, response.results.status);
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

  /**
   * Handle Widget Resize
   */
  resize: function () {
    var elm = jQuery('#' + appWidget.elementName);
    var width = elm.width();

    elm.removeClass('w200 w220 w240 w280 w300 w320 w380');

    if (width <= 200) {
      elm.addClass('w200');
    }

    if (width > 200 && width <= 220) {
      elm.addClass('w220');
    }

    if (width > 220 && width <= 240) {
      elm.addClass('w240');
    }

    if (width > 240 && width <= 280) {
      elm.addClass('w280');
    }

    if (width > 280 && width <= 300) {
      elm.addClass('w300');
    }

    if (width > 300 && width <= 320) {
      elm.addClass('w320');
    }

    if (width >= 320) {
      elm.addClass('w380');
    }
  },

  /**
   * Load Initial Widget Form
   */
  init: function () {
    var elm = jQuery('#' + appWidget.elementName);
    var note = '';

    appWidget.promptedCityData = false;
    appWidget.selectedTab = 'city-council';

    jQuery(elm).html('');
    jQuery(elm).load(appWidget.settings.base + 'template/form.html', function () {

      jQuery('h2', elm).text(appWidget.settings.labels.title);
      jQuery('p.intro', elm).text(appWidget.settings.labels.subtitle);
      jQuery('button.submit', elm).text(appWidget.settings.labels.button);

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

        var address = jQuery('#address').val();

        appWidget.trackEvent('Form', 'Submit', address);

        if(address !== '') {
          appWidget.geoCodeAddress(address);
        } else if(address !== '' && !pattern.test(address)) {
          appWidget.showError('Invalid Address ( e.g. 123 Any Street, New York, NY 10001 )');
          appWidget.trackEvent('Error', 'Submit Form', 'Invalid Address');
        } else {
          appWidget.showError('Enter a Address ( e.g. 123 Any Street, New York, NY 10001 )');
          appWidget.trackEvent('Error', 'Submit Form', 'No Address Entered');
        }

        event.preventDefault();
        return false;
      });

      appWidget.resize();
    });
  }
};
