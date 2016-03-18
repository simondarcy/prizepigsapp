/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

var PUSHWOOSH_APP_ID = "395AF-9F813";/*developer account: "34747-68125"*/
var GOOGLE_PROJECT_ID = 187063142467;
var GOOGLE_ANALYTICS_ID = "UA-59205026-1";

function alertDismissed() {
    // do something
}


function initPushwooshAndroid(){

    var pushNotification = window.plugins.pushNotification;

    //set push notifications handler
    document.addEventListener('push-notification', function(event) {
        var title = event.notification.title;
        var userData = event.notification.userdata;

        if(typeof(userData) != "undefined") {
            console.warn('user data: ' + JSON.stringify(userData));
        }

        alert(title);
    });

    //initialize Pushwoosh with projectid: "GOOGLE_PROJECT_ID", appid : "PUSHWOOSH_APP_ID". This will trigger all pending push notifications on start.
    pushNotification.onDeviceReady({ projectid: GOOGLE_PROJECT_ID, appid : PUSHWOOSH_APP_ID });

    //register for pushes
    pushNotification.registerDevice(
        function(status) {
            var pushToken = status;
            console.warn('push token: ' + pushToken);
        },
        function(status) {
            console.warn(JSON.stringify(['failed to register ', status]));
        }
    );
}

function initPushwoosh() {
    var pushNotification = window.plugins.pushNotification;

    //set push notification callback before we initialize the plugin
    document.addEventListener('push-notification', function(event) {
        //get the notification payload
        var notification = event.notification;

        //display alert to the user for example
        alert(notification.aps.alert);

        //clear the app badge
        pushNotification.setApplicationIconBadgeNumber(0);
    });

    //initialize the plugin
    pushNotification.onDeviceReady({pw_appid:PUSHWOOSH_APP_ID});

    //register for pushes
    pushNotification.registerDevice(
        function(status) {
            var deviceToken = status['deviceToken'];
            console.warn('registerDevice: ' + deviceToken);
        },
        function(status) {
            console.warn('failed to register : ' + JSON.stringify(status));
            alert(JSON.stringify(['failed to register ', status]));
        }
    );

    //reset badges on app start
    pushNotification.setApplicationIconBadgeNumber(0);
}

function fetchAppData() {
    var initInjector = angular.injector(["ng"]);
    var $http = initInjector.get("$http");

    //get app competitions before load
    var compsUrl = API_ROOT + "competitions_service.php";
    return $http.get(compsUrl).then(function(data) {
        myApp.constant("competitions", data.data.competitions);
    }, function(errorResponse) {

    navigator.notification.alert(
        'Error reaching server. Please try again later.',  // message
        alertDismissed,         // callback
        'Error',            // title
        'Done'                  // buttonName
    );

    });
}

function bootstrapApplication() {
    angular.element(document).ready(function() {
        //bootstrap
        angular.bootstrap(document, ["myApp"]);

        // Add device class to body so we can set up device specific rules in CSS.
        // Annoying bug where on bootstrap the latest comps would animate in, looked bad.
        // To prevent this, only allow animate on initial user touch.
        $('body').addClass(device.platform.toLowerCase()).bind("touchstart", function(){
            $('body').addClass("animate");
            $(this).unbind('touchstart');
        });

        //Initialize foundation menus etc
        $(document).foundation();
        //FastClick helps response time of user tap on android devices
        FastClick.attach(document.body);
        console.log("App Bootstapped");

    });//End angular document ready
}//end bootstrap application

var app = {
    // Application Constructor
    initialize: function() {
        this.bindEvents();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicitly call 'app.receivedEvent(...);'
    onDeviceReady: function() {

        //make sure connected to internet
        if(navigator.connection.type=="none"){
            navigator.notification.alert(
                'It appears you have no network connection. Please close and re-open the app when connectivity returns',  // message
                alertDismissed,        // callback
                'No Connection',      // title
                'OK'                  // buttonName
            );
            return false;
        }

        fetchAppData().then(bootstrapApplication);
        if(device.platform=="Android"){
            initPushwooshAndroid();
        }else if(device.platform=="iOS") {
            initPushwoosh();
        }

        window.analytics.startTrackerWithId(GOOGLE_ANALYTICS_ID);
        window.analytics.trackView('App Opened');

    }
};

app.initialize();

//DOM ready
$( document ).ready(function() {

    $wrapper = $(".off-canvas-wrap");
    $('.close-menu').on("click", function(){
        $wrapper.removeClass("move-left move-right");
    });
});//end dom ready