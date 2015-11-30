(function (app) {

  app.config(['$urlRouterProvider','$stateProvider', '$locationProvider',
    function ($urlRouterProvider,$stateProvider, $locationProvider) {
      $locationProvider.html5Mode(false);
      $urlRouterProvider.otherwise('/torah');
      $stateProvider.
      state('main_ui', {
        url: '/torah',
//         abstract: false,
        templateUrl: '/modules/text-display/content.html?cache='+Math.random()  ,
        resolve: {
          book: ['$http', '$state',
            function ($http, $state) {
              return $http.get('/json/Tanach/Torah/Genesis/Hebrew/Tanach with Nikkud.json');
            }],
          book_en: ['$http', '$state',
            function ($http, $state) {
              return $http.get('/json/Tanach/Torah/Genesis/English/merged.json');
            }]

        },
        controllerAs: 'content',
        controller: 'textDisplayCtrl'
      });
    }
  ]);
}(window.simchatani));