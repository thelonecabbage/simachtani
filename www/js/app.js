window.simchatani = angular.module('SimchataniApp', [
  'ngMaterial',
  'ngAnimate',
  // 'ngSanitize',
  'restangular',
  'ui.router'
]);

(function (app) {
  app.controller('AppController', function ($mdSidenav) {
    var vm = this;
    vm.clickable = {
      strongs: 1,
      verbs: 1
    };
    vm.toggleSidenav = function (menuId) {
      $mdSidenav(menuId).toggle();
    };

    this.settings = {
      printLayout: true,
      showRuler: true,
      showSpellingSuggestions: true,
      presentationMode: 'edit'
    };
    this.sampleAction = function (name, ev) {
      $mdDialog.show($mdDialog.alert()
        .title(name)
        .content('You triggered the "' + name + '" action')
        .ok('Great')
        .targetEvent(ev)
      );
    };

  });

  app.config(function ($mdIconProvider, RestangularProvider) {
    $mdIconProvider
      .defaultIconSet('/bower_components/angular-material/demos/icon/demoSvgIconSets/assets/core-icons.svg', 24);
    // Set API base URL to something like /api/v1
    RestangularProvider.setBaseUrl('/api');

    // Handle Tastypie list response structure
    RestangularProvider.setResponseExtractor(function (response, operation, what, url) {
      var newResponse;
      if (operation === "getList") {
        newResponse = response.objects;
        newResponse.num_results = response.num_results;
        newResponse.page = response.page;
        newResponse.total_pages = response.total_pages;
        newResponse.refresh_from_server = function() {
          return newResponse.getList(newResponse.reqParams).then(function(result) {
            while(newResponse.length){
              newResponse.pop();
            }
            for(var i=0;i<result.length;i++) {
              newResponse[i] = result[i];
            }
            newResponse.num_results = result.num_results;
            newResponse.page = result.page;
            newResponse.total_pages = result.total_pages;
          });
        }
      } else {
        newResponse = response;
      }
      return newResponse;
    });
  })
    .filter('keyboardShortcut', function ($window) {
      return function (str) {
        if (!str) return;
        var keys = str.split('-');
        var isOSX = /Mac OS X/.test($window.navigator.userAgent);
        var seperator = (!isOSX || keys.length > 2) ? '+' : '';
        var abbreviations = {
          M: isOSX ? '⌘' : 'Ctrl',
          A: isOSX ? 'Option' : 'Alt',
          S: 'Shift'
        };
        return keys.map(function (key, index) {
          var last = index == keys.length - 1;
          return last ? key : abbreviations[key];
        }).join(seperator);
      };
    })
}(window.simchatani));