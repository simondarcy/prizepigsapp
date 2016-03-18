/* Prize Pigs SPA */
var DEBUG  = false;
var API_ROOT = 'https://www.prizepigs.ie/api/';
var IMAGE_ROOT = 'https://www.prizepigs.ie/uploads/';
var TIM_LOCATION = 'https://www.prizepigs.ie/utils/timthumb.php';

if( DEBUG ){
    var API_ROOT = 'http://localhost:8888/prizepigs.ie/api/';
    var IMAGE_ROOT = 'http://localhost:8888/prizepigs.ie/uploads/';
    var TIM_LOCATION = 'http://localhost:8888/prizepigs.ie/utils/timthumb.php';
}

var IMAGE_QUALITY = 90;
var IMAGE_SIZE =  300;
var screenWidth = $(window).width();

if (screenWidth > 400){
    IMAGE_QUALITY = 100;
    IMAGE_SIZE = 500;
}

/* Helper functions */

function hasUserEntered(id, comps){
    /* Check if current competition is in curent users "entered" competitions */
    if (typeof comps == 'undefined') return false;
    for(var i = 0; i < comps.length; i++){
        if ( comps[i].id == id ){
            return true;
        }
    }
    return false;
}

if (typeof String.prototype.startsWith != 'function') {
    // see below for better implementation!
    String.prototype.startsWith = function (str){
        return this.indexOf(str) == 0;
    };
}

/* End helper functions */

/* Initialize app */
var myApp = angular.module('myApp', ['ngRoute', 'ngSanitize', 'ngAnimate',  'myApp']);

/* App configuration */
myApp.config(['$routeProvider',
  function($routeProvider) {
    $routeProvider.
      when('/home', {
        templateUrl: 'templates/competition-list.html',
        controller: 'CompetitionsCtrl'
      }).
      when('/login', {
        templateUrl: 'templates/login.html',
        controller: 'loginCtrl'
      }).
      when('/register', {
        templateUrl: 'templates/register.html',
        controller: 'loginCtrl'
      }).
      when('/category/:category', {
        templateUrl: 'templates/competition-list.html',
        controller: 'CompetitionsCtrl'
      }).
      when('/my-comps', {
            templateUrl: 'templates/user-competitions.html',
            controller: 'UserCompetitionsCtrl'
      }).
      when('/forgot-password', {
            templateUrl: 'templates/forgot-password.html',
            controller: 'ForgotPasswordCtrl'
      }).
      when('/competition/:competitionId', {
        templateUrl: 'templates/competition.html',
        controller: 'CompCtrl'
      }).
      when('/page/:page', {
        templateUrl: 'templates/page.html',
        controller: 'PageCtrl'
      }).
      otherwise({
        redirectTo: '/home'
      });
  }]);

/* End app configuration */

/* App services */

myApp.factory('CompetitionsService', function($http, $rootScope) {

    return {
        getComps : function(callback){
            compsUrl = API_ROOT + "competitions_service.php";
            promise = $http.get(compsUrl).success(function (data) {
                $rootScope.competitions = data.competitions;
            });
            return promise;
        },
        getSingleComp : function(arr, id) {
            for (var d = 0, len = arr.length; d < len; d += 1) {
                if (arr[d].id === id) {
                    return arr[d];
                }
            }
        },
        getUserComps : function(){
            data = {
                uid:$rootScope.uid,
                token:$rootScope.token
            };
            compsUrl = API_ROOT + "user_competitions.php";
            promise =  $http.post(compsUrl, data).success(function (data) {
                $rootScope.userCompetitions = data.competitions;
            });
            return promise;
        },
        flagEnteredComps: function(){
            for(var i = 0; i<$rootScope.competitions.length; i++){
                if( hasUserEntered( $rootScope.competitions[i]["id"], $rootScope.userCompetitions ) ){
                    $rootScope.competitions[i]["hasUserEntered"] = true;
                }
            }//end for
        },
        getPages : function(){
            url = API_ROOT + "pages.php";
            promise =  $http.get(url).success(function (data) {
                $rootScope.pages = data;
            });
            return promise;
        }
    };//end return

});

/* end app services */


/* app run */
myApp.run(function(competitions, $rootScope, $http, CompetitionsService) {
    
    $rootScope.loggedin = false; // user not logged in by default

    $('.hide-when-logged-out').hide();
    $('.show-when-logged-out').show();

    $rootScope.loading = true; //Set UI to loading
    $rootScope.pageClass = "home";

    //update root comps with preloaded competitions
    $rootScope.competitions = competitions;
    $rootScope.userCompetitions = [];

    //if user was previously logged in, try log them in again
    if( localStorage.getItem("ppu") != null ){
        //get credentials from local storage
        credentials = {
            email:localStorage.getItem("ppu"),
            password:localStorage.getItem("ppp"),
        };
        
        $http.defaults.headers.post["Content-Type"] = "application/x-www-form-urlencoded";
        //Try log user in with these credentials using API
        $http.post(API_ROOT + "user_service.php", credentials).success(function (data) {
            if( data.error ){
                //do nothing
            }
            else{
                //Login successful
                $rootScope.loggedin = true;
                $rootScope.user = data.email;
                $rootScope.uid = data.id;
                $rootScope.token = data.token;

                //Update UI
                $('.hide-when-logged-in').hide();
                $('.show-when-logged-in').show();

                //preload user comps
                CompetitionsService.getUserComps().then(function(){
                    CompetitionsService.flagEnteredComps();
                });



            }//end if
        });//end post
    }//end if u and p in LS

    //Load static pages
    CompetitionsService.getPages().then(function(){return true;});

    $rootScope.logout = function(){

        navigator.notification.confirm(
            'Are you sure you want to log out of Prize Pigs', // message
            function(buttonIndex){
                console.log(buttonIndex);
                if (buttonIndex == 2) return false;
                //log user out
                $http.get(API_ROOT + "logout.php").success(function (data) {

                    $rootScope.loggedin = false;
                    localStorage.removeItem("ppu");
                    localStorage.removeItem("ppp");
                    $('.hide-when-logged-out').hide();
                    $('.show-when-logged-out').show();
                    $rootScope.userCompetitions = [];
                    //remove entered flags
                    for(var i=0;i<$rootScope.competitions.length;i++){
                        $rootScope.competitions[i]["hasUserEntered"] = false;
                    }
                }).error(function(){
                    navigator.notification.alert(
                        'There was an error logging you out. Please try again later.',  // message
                        alertDismissed,         // callback
                        'Error',            // title
                        'Done'                  // buttonName
                    );
                });

            },// end callback to invoke with index of button pressed
            'Log Out?',           // title
            ['Yes','No']     // buttonLabels
        );

    };//end logout function


});


myApp.directive('updatelinks', function($timeout) {
    //Change all links so they open in device browser
    return {
        link: function(scope, element) {
            $timeout(function() {
                angular.forEach(element.find("a"), function(value, key){
                    var a = angular.element(value);
                    currentLink = a.prop("href");
                    a.prop("href", "javascript:window.open('"+currentLink+"', '_system')");
                });
                //add property tp all comp <a> links use element.find('a').prop('target', '_system');
            });

        }
    };
});


myApp.directive('pigimage', function () {
    return {
        link: function (scope, element, attrs) {
            //if its a PP image load in correct size
            if(attrs['ngSrc'].startsWith("image_")) {
                scope.competition.image = TIM_LOCATION + '?src=' + IMAGE_ROOT + attrs['ngSrc'] + '&q='+IMAGE_QUALITY + '&w=' + IMAGE_SIZE;
            }
        }
    };
});

/* app filters */

myApp.filter('epochToDate', function(){
    return function(input){
        newDate = new Date(input * 1000);
        return newDate;
    }
});

myApp.filter('humanDate', function(){
    return function(input){
        newDate = moment(input).fromNow();
        return newDate;
    }
});

myApp.filter('simpleDate', function(){
    return function(input){
        newDate = moment(input).format('ha MMMM Do');
        return newDate;
    }
});

/* end app filters */

/* App Controllers */

function loginCtrl($scope, $rootScope, $http, CompetitionsService){
    /* 
       Login Controller 
       Try log a user in using API
    */
    $rootScope.pageClass = "login";
    $rootScope.loading = false;

    $scope.login = function(){
        //get credentials from login form
        $scope.formLoading = true;
        $scope.credentials = {
            email:$scope.login.email,
            password:$scope.login.password
        };
        $http.defaults.headers.post["Content-Type"] = "application/x-www-form-urlencoded";

        //Try log user in with these credentials using API
        $http.post(API_ROOT + "user_service.php", $scope.credentials).success(function (data) {
            if( data.error ){
                //Error returned from server, wrong password etc
                $scope.login.error = data.error;
                //clear password
                $scope.login.password = "";
                $scope.formLoading = false;
            }
            else{
                //Login successful
                $rootScope.loggedin = true;
                $rootScope.user = data.email;
                $rootScope.uid = data.id;
                $rootScope.token = data.token;

                //Update UI
                $('.hide-when-logged-in').hide();
                $('.show-when-logged-in').show();
                $scope.formLoading = false;

                //in app update the username and password so we can log in on page load
                localStorage.setItem("ppu", $scope.login.email);
                localStorage.setItem("ppp", $scope.login.password);

                //clear form
                $scope.login.email = "";
                $scope.login.password = "";
                //clear errors
                $scope.loginForm.$setPristine();
                navigator.notification.alert(
                    'Hey ' + data.email + '. Welcome back to Prize Pigs',  // message
                    alertDismissed,         // callback
                    'Welcome Back',            // title
                    'Lets Go!'                  // buttonName
                );
                window.analytics.trackView('User Logged In');
                //update user competitions
                //preload user comps
                CompetitionsService.getUserComps().then(function(){
                    CompetitionsService.flagEnteredComps();
                });
                window.location.href="#/home";

            }
        });
    };

    $scope.register = function(){
        /* 
           Register Controller 
           Try register a new user using API
        */
        $rootScope.pageClass = "login";
        $scope.formLoading = true;
        //get details from registration form
        $scope.data = {
            email:$scope.register.email,
            password:$scope.register.password,
            captcha:$scope.register.captcha,
            dob:$scope.register.dob,
            gender:$scope.register.gender
        };

        $http.defaults.headers.post["Content-Type"] = "application/x-www-form-urlencoded";

        /* Try register new user with above details using API */
        $http.post(API_ROOT + "register.php", $scope.data).success(function (data) {
            if( data.error ){
                //Error returned, user already exists for example
                $scope.register.error = data.error;
                $scope.formLoading = false;

            }
            else{
                //Log the new user in
                $rootScope.loggedin = true;
                $rootScope.user = data.email;
                $rootScope.uid = data.id;
                $rootScope.token = data.token;
                localStorage.setItem("ppu", $scope.register.email);
                localStorage.setItem("ppp", $scope.register.password);
                //Update UI
                $('.hide-when-logged-in').hide();
                $('.show-when-logged-in').show();
                $scope.formLoading = false;
                //clear form errors
                $scope.regForm.$setPristine();
                //reload captcha
                $("#captcha").attr("src", "https://www.prizepigs.ie/utils/captcha.php?piglets=" + (new Date()).getTime() );

                //Alert user registration was a success and that they are logged in
                navigator.notification.alert(
                    'Welcome to Prize Pigs. You are now logged in.',  // message
                    alertDismissed,         // callback
                    'Welcome',            // title
                    'Lets Go!'                  // buttonName
                );

                window.analytics.trackView('New User Registered');
                window.location.href="#/home";
                
            }
        });
    }
}

function CompetitionsCtrl($scope, $rootScope, $routeParams, CompetitionsService) {
    $rootScope.pageClass = "competition-list";
    $scope.competitions = $rootScope.competitions;
    $rootScope.loading = false;

    //filter results if category present
    if(typeof $routeParams.category != "undefined"){
        $scope.category = $routeParams.category;
        window.analytics.trackView($routeParams.category + ' competitions');
    }else{
        window.analytics.trackView('Latest Competitions');
    }
}//end controller

function UserCompetitionsCtrl($scope, $rootScope, CompetitionsService) {
    window.analytics.trackView('User Competitions');
    $rootScope.pageClass = "user-competitions";
    $scope.competitions = $rootScope.userCompetitions;

}//end controller


function CompCtrl($scope, $rootScope, $http, $routeParams, $sce, CompetitionsService){
    
    $rootScope.pageClass = "competition";

    var id = $routeParams.competitionId;

    $scope.competition = CompetitionsService.getSingleComp($rootScope.competitions, id);
    $rootScope.loading = false;

    window.analytics.trackView('Competition: ' + $scope.competition.title + ' ID: '+$scope.competition.id);

    $scope.share = function(platform) {

        if (typeof platform == 'undefined') {
            //share sheet
            window.plugins.socialsharing.share(
                $scope.competition.title,
                $scope.competition.excerpt,
                $scope.competition.image,
                'https://www.prizepigs.ie/competition.php?id=' + $scope.competition.id)
        }
        else{//share via specific platform
            if(platform == 'facebook'){
                window.plugins.socialsharing.shareViaFacebook($scope.competition.title,
                    $scope.competition.image,
                    'https://www.prizepigs.ie/competition.php?id=' + $scope.competition.id);
            }
            else if(platform == 'twitter'){
                window.plugins.socialsharing.shareViaTwitter($scope.competition.title + " " + 'https://www.prizepigs.ie/competition.php?id=' + $scope.competition.id + " @prizepigs",
                    $scope.competition.image
                    )
            }
        }

    };

    $scope.submitAnswer = function(ans){
        $scope.formLoading = true;

        $scope.data = {
            answer:ans,
            compid:id,
            uid:$rootScope.uid,
            token:$rootScope.token
        };

        $http.post(API_ROOT + "enter_competition.php", $scope.data).success(function (data) {
            if( data.error ){
                $scope.error = data.error;
                $scope.formLoading = false;
            }
            else{
                if( data.message ){
                    $('#answer-form').hide();
                    $scope.formLoading = false;
                    $.grep($rootScope.competitions, function(e){ return e.id == $scope.competition.id; })[0]['hasUserEntered'] = true;
                    $rootScope.userCompetitions.unshift($scope.competition);
                    $scope.message = data.message;
                    window.analytics.trackView('User entered competition with ID: ' + id);
                }
            }
        });


    };//end submit answer

}//end controller

function ForgotPasswordCtrl($scope, $rootScope, $http){
    $rootScope.loading = false;
    window.analytics.trackView('Forgot Password');
    $scope.forgotPassword = function(){
        $scope.formLoading = true;
        $scope.data = {
            email:$scope.email
        };
        $http.post(API_ROOT + "forgot_password.php", $scope.data).success(function (data) {
            if( data.error ){
                $scope.error = data.error;
                $scope.formLoading = false;
            }
            else{
                //clear form
                $scope.email = "";
                //clear errors
                $scope.forgotPasswordForm.$setPristine();
                $scope.formLoading = false;
                if( data.message ){  
                    $scope.message = data.message;
                }
            }
        });



    };//end forget password function
}//end controller

function PageCtrl($scope, $rootScope, $routeParams) {
    $rootScope.pageClass = "competition";
    $rootScope.loading = false;
    $scope.page = $rootScope.pages[$routeParams.page];
    window.analytics.trackView('Page ' + $scope.page.title);
}//end controller


