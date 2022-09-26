/*global define,google,Promise*/
(function (root, factory) {
    "use strict";
    if (typeof define === 'function' && define.amd) {
        define("GoogleMap", ["jquery", "Behaviors"], factory);
    } else {
        root.GoogleMap = factory(root.jQuery, root.Behaviors);
    }
}(this, function ($, Behaviors) {
    "use strict";
    
    var module = {};
    
    function GoogleMap() {
        Behaviors.init(GoogleMap, this, arguments);
        
        this.load_gmaps().then(this.render_map.bind(this));
    }
    
    Behaviors.inherit(GoogleMap, Behaviors.Behavior);
    
    GoogleMap.QUERY = "[data-googlemap]";
    
    GoogleMap.prototype.center_specified_by_markup = function () {
        return this.$elem.data("googlemap-lat") !== undefined && this.$elem.data("googlemap-lng") !== undefined;
    };
    
    GoogleMap.prototype.determine_default_args = function () {
        var args = {
            center: {lat: 0, lng: 0},
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            disableDefaultUI: true,
            draggable: false,
            scrollwheel: false,
            zoom: 15
        };
        
        if (this.$elem.data("googlemap-draggable") !== undefined) {
            args.draggable = true;
        }
        
        if (this.$elem.data("googlemap-scrollzoom") !== undefined) {
            args.scrollwheel = true;
        }
        
        if (this.center_specified_by_markup()) {
            args.center = {lat: this.$elem.data("googlemap-lat"),
                           lng: this.$elem.data("googlemap-lng")};
        }
        
        if (this.$elem.data("googlemap-zoom") !== undefined) {
            args.zoom = this.$elem.data("googlemap-zoom");
        }
        
        return args;
    };
    
    GoogleMap.prototype.load_gmaps = function () {
        return Promise.resolve().then(function () {
            if (window.google) {
                return;
            } else {
                //TODO: Autoload Gmaps API
                throw new Error("Google Maps API not loaded at time of initialization.");
            }
        });
    };
    
    GoogleMap.prototype.render_map = function () {
        var $markers = this.$elem.find('[data-googlemap-marker]'), i;
        
        // create map
        this.map = new google.maps.Map(this.$elem[0], this.determine_default_args());
        
        this.map.markers = [];
        for (i = 0; i < $markers.length; i += 1) {
            this.add_marker($($markers[i]), this.map);
        }
        
        // center map
        this.center_map();
    };
    
    GoogleMap.prototype.add_marker = function ($marker) {
        var latlng = new google.maps.LatLng($marker.data('googlemap-lat'), $marker.data('googlemap-lng')),
            marker = new google.maps.Marker({
                position: latlng,
                map: this.map
            }),
            infowindow;
        
        this.map.markers.push(marker);
        
        // if marker contains HTML, add it to an infoWindow
        if ($marker.html()) {
            infowindow = new google.maps.InfoWindow({
                content		: $marker.html()
            });
            
            google.maps.event.addListener(marker, 'click', this.marker_click_intent.bind(this, marker, infowindow));
        }
    };
    
    GoogleMap.prototype.marker_click_intent = function (marker, infowindow) {
        infowindow.open(this.map, marker);
    };
    
    GoogleMap.prototype.center_map = function () {
        var i, marker, latlng, bounds = new google.maps.LatLngBounds();
        
        // loop through all markers and create bounds
        for (i = 0; i < this.map.markers.length; i += 1) {
            marker = this.map.markers[i];
            latlng = new google.maps.LatLng(marker.position.lat(), marker.position.lng());
            bounds.extend(latlng);
        }
        
        if (!this.center_specified_by_markup()) {
            if (this.map.markers.length === 1) {
                this.map.setCenter(bounds.getCenter());
            } else {
                this.map.fitBounds(bounds);
            }
        }
    };
    
    Behaviors.register_behavior(GoogleMap);
    
    module.GoogleMap = GoogleMap;
    
    return module;
}));