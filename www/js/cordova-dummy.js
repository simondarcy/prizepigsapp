//for debugging in browser
if(window.cordova==undefined) {
    console.log("in browser debug mode");
    //test data used by app
    navigator.connection = {};
    navigator.connection.type = "Connection.UNKNOWN";
    navigator.notification = {};
    navigator.notification.alert = function(){return false;};
    device = {};
    device.platform = "Android";
    window.plugins = {};
    window.plugins.pushNotification = function(){return false;};
    window.plugins.pushNotification.onDeviceReady = function(){return false;};
    window.plugins.pushNotification.registerDevice = function(){return false;};
    window.analytics = {};
    window.analytics.startTrackerWithId = function(){return false;};
    window.analytics.trackView = function(){return false;};
    //start
    app.onDeviceReady();
}