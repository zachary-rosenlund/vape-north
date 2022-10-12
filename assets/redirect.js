(function($, document, window, undefined) {
  window.IPRedirect = {
    init: function(settings) {
      // Assignment
      var self = this;
        
      self.settings = settings;
      self.redirect = localStorage.getItem("location-redirect");
      self.messageWrap = $("#location-redirect-message");
      self.currentCountry = $('.current-country', self.messageWrap);
      self.RedirectMe = $('.redirect-me', self.messageWrap);
      self.closeBtn = $('.close-redirect-btn', self.messageWrap);
      self.newStore = $('.new-store', self.messageWrap);

      self.catchAllCountries = settings["redirect_catch_all_countries"];
      self.catchAllURL = settings["redirect_catch_all_url"];
      self.catchAllName = settings["redirect_catch_all_name"];

      self.forceRedirect = settings["redirect_force"] ? true : false;
      self.countryTranslations = {
        "Sweden": "Sverige"
      };
      self.domain = "https://server.shortcodesforshopify.com/json/?callback=?";
      self.redirects = [];
      self.urlMap = {};
      self.location = {};

      // Preparation
      self.loadRedirects(settings);
      self.mapURLs(self.redirects, "::");
      self.redirect = (typeof self.redirect == "string") ? JSON.parse(self.redirect) : {shown: false, date: null};
      self.redirect.shown = self.getIsRedirectShown();

      // Initialization successful
      return true;
    },
    run: function() {
      var self = this;

      var successCallback = ( self.forceRedirect ) ? self.fetchAndRedirectOnResponse : self.fetchAndShowRedirect,
        activateRedirect = ( ! self.redirect.shown || self.forceRedirect ) ? true : false;

      if( activateRedirect ) {
        self.makeServerCall( self.fetchLocationInfoAndRunCallback, successCallback );

        if( ! self.forceRedirect )
          self.bindRedirect();
      }
    },
    loadRedirects: function(settings) {
      var self = this;
      for(var i = 1; i < 11; ++i) {
        var name = "redirect_" + i;

        self.redirects.push( settings[name] );
      }
    },
    mapURLs: function(stringList, splitter) {
      var self = this;

      for(var i = 0; i < stringList.length; ++i) {
        if( stringList[i] && stringList[i] != "") {
          var splitString = stringList[i].split(splitter);

          if(splitString[2].indexOf("http://") === -1 && splitString[1].indexOf("https://") === -1 ) {
            splitString[2] = "http://" + splitString[2];
          }

          self.urlMap[splitString[0]] = {
            "name": splitString[1],
            "url": splitString[2]
          };
        }
      }

      if(self.catchAllCountries.length > 0) {
        var countries = self.catchAllCountries.split(/[\s,]+/);

        for(var i = 0; i < countries.length; ++i) {
          self.urlMap[ countries[i] ] = {
            "name": self.catchAllName,
            "url": self.catchAllURL
          }
        }
      }

      return self.urlMap;
    },
    getIsRedirectShown: function() {
      var self = this,
        today = new Date(),
        prevDate = new Date(self.redirect.date),
        dayLength = 1000 * 24 * 60 * 60, // in milliseconds
        diffDate = today - prevDate;

      // display query again if localStorage is older than 30 days
      if( diffDate / dayLength > 30 )
        return false;

      return true;
    },
    makeServerCall: function( serverCall, callback ) {
      return serverCall(callback);
    },
    fetchLocationInfoAndRunCallback: function( successCallback ) {
      var self = IPRedirect;

      $.ajax( {
        url: self.domain,
        type: 'POST',
        dataType: 'jsonp',
        async: false,
        success: successCallback,
        error: successCallback
      });
    },
    fetchAndShowRedirect: function( location ) {
      var self = IPRedirect;

      self.location = location;

      if ( self.urlMap[location.country_code].url != null ) {
        var countryName = (self.countryTranslations[location.country_name]) ? self.countryTranslations[location.country_name] : location.country_name;
        
        self.currentCountry.text(countryName);
        self.newStore.text( self.urlMap[location.country_code].name );
        self.RedirectMe.attr("href", self.urlMap[location.country_code].url);
        self.messageWrap.show();
      }
    },
    fetchAndRedirectOnResponse: function( location ) {
      var self = IPRedirect;

      self.location = location;

      if(self.urlMap[location.country_code].url != null) {
        window.location.assign(self.urlMap[location.country_code].url);
      }
    },
    bindRedirect: function() {
      var self = this;

      // only save to local storage if the user doesn't want to be redirected.
      self.closeBtn.off().on("click", function(e) {
        e.preventDefault();
        e.stopPropagation();
        self.messageWrap.hide();
        self.saveRedirect();
      });

      self.RedirectMe.on("click", function(e) {
        e.stopPropagation();
      });
    },
    saveRedirect: function(key, val) {
      var redirect = {
        shown: true,
        date: Date()
      };
      localStorage.setItem("location-redirect", (JSON.stringify(redirect)));
    }
  };
})(jQuery, document, window);