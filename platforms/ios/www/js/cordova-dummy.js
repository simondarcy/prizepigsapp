//for debugging in browser
if(window.cordova==undefined) {
    console.log("in browser debug mode");
    //test data used by app
    navigator.connection = {};
    navigator.connection.type = "Connection.UNKNOWN";
    device = {};
    device.platform = "Android";
    window.analytics ={};
    window.analytics.startTrackerWithId = function(){return false;};
    window.analytics.trackView = function(){return false;};
    //start
    app.onDeviceReady();
}