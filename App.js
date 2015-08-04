$(document).ready(function() {
  "use strict";
  
  ko.bindingHandlers.option = {
      update: function(element, valueAccessor) {
         var value = ko.utils.unwrapObservable(valueAccessor());
         ko.selectExtensions.writeValue(element, value);   
      }        
  };
	
	$('[data-toggle="tooltip"]').tooltip();
  
  var MapModel = function(data) {
		var self = this;
		
		// Flattens the layers object and returns all basemap datasets
		var getAllBasemaps = function() {
			var basemaps = [];
			ko.utils.arrayMap(self.layers(), function(dataset) {
				basemaps = basemaps.concat(dataset.datasets);
			});
			return basemaps;
		};
		
    this.layers = ko.observableArray(data);
    this.map = L.map('map').setView([0, 0], 3);
		this.basemap = null;
		this.overlay = null;
    this.selectedBasemap = ko.observable();
    this.selectedOverlay = ko.observable();
		this.showOverlay = ko.observable(false);
		this.basemapLink = ko.observable();
		
		this.nextBasemap = function() {
			var basemaps = getAllBasemaps();
			
			// Get the index of the currently selected basemaps
			var selected = basemaps.indexOf(self.selectedBasemap());
			
			// Wrap around to the first basemap if at the end
			if (selected == basemaps.length - 1) {
				selected = 0;
			} else {
				selected++;
			}
			
			self.selectedBasemap(basemaps[selected]);
		};
		
		this.prevBasemap = function() {
			var basemaps = getAllBasemaps();
			
			// Get the index of the currently selected basemaps
			var selected = basemaps.indexOf(self.selectedBasemap());
			
			if (selected === 0) {
				selected = basemaps.length - 1;
			} else {
				selected--;
			}
			
			self.selectedBasemap(basemaps[selected]);
		};
		
		this.toggleOverlay = function() {
			self.showOverlay(!self.showOverlay());
		};
		
		// Only show the overlay if enabled
		this.showOverlay.subscribe(function(overlayStatus) {
			if (self.overlay !== null) {
				if (overlayStatus) {
					self.overlay.setOpacity(1);
				} else {
					self.overlay.setOpacity(0);
				}
			}
		});
		
		// Set the basemap tile layer URL when changed
		this.selectedBasemap.subscribe(function(newDataset) {
			if (self.basemap !== null) {
				self.basemap.setUrl(newDataset.endpoint);
			} else {
				self.basemap = L.tileLayer(newDataset.endpoint).addTo(self.map);
			}
		});
		
		// Set the overlay URL if changed 
		this.selectedOverlay.subscribe(function(newDataset) {
				if (self.overlay !== null) {
					self.overlay.setUrl(newDataset.endpoint);
				} else {
					self.overlay = L.tileLayer(newDataset.endpoint);
					
					// If not enabled - then hide it until it gets enabled
					if (!self.showOverlay()) {
						self.overlay.setOpacity(0);
					}
					self.overlay.addTo(self.map);
				}
		});
		
		// Creates the javascript that will be sent to codepen or jsfiddle
		this.createJS = ko.pureComputed(function() {
			var jsString = "var map = L.map('map').setView([0, 0], 3);\n";
			jsString += "L.tileLayer('" + self.selectedBasemap().endpoint + "').addTo(map);\n";
			
			if (self.showOverlay()) {
				jsString += "L.tileLayer('" + self.selectedOverlay().endpoint + "').addTo(map);\n";
			}
			return jsString;
		}, this);
		
		// JSFiddle needs multiple input fields
		this.jsFiddleData = ko.pureComputed(function() {
			return {
				html: '<div id="map"></div>',
				js: self.createJS(),
				dtd: 'html 5',
				css: 'html, body, #map { width: 100%; height: 100%; margin: 0px; }', 
				resources: '',
			};
		}, this);
		
		// While codepen needs a stringified JSON object for its properties
		this.codePenData = ko.pureComputed(function() {
			return JSON.stringify({
				html: '<div id="map"></div>',
				js: self.createJS(),
				editors: '001',
				css: 'html, body, #map { width: 100%; height: 100%; margin: 0px; }', 
				js_external: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.3/leaflet.js',
				css_external: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.3/leaflet.css',
				js_library: 'jquery'
			});
		}, this);
  };
	
  
  $.getJSON('tiles.json', function(data) {
    ko.applyBindings(new MapModel(data));
  }).fail(function() {
  	$('#error-box').toggle('hidden');
  });
});