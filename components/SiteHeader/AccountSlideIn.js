(function (root, factory) {
    "use strict";
    if (typeof define === 'function' && define.amd) {
        define("accountslidein", ["jquery", "betteroffcanvas"], factory);
    } else {
        // Browser globals
        root.accountslidein = factory(root.jQuery, root.betteroffcanvas);
    }
}(this, function ($, betteroffcanvas) {
    "use strict";
    "feel good";

    $('.Account_slide-login--button').click(function(){
        $(this).hide();
        $('.Account_slide-form--password').removeClass('Account_slide-form--visible')
        $('.Account_slide-form--login').addClass('Account_slide-form--visible');
        return false;
    });

    $('.Account_slide-password_recovery').click(function(){
        $('.Account_slide-login--button').show();
        $('.Account_slide-form--login').removeClass('Account_slide-form--visible');
        $('.Account_slide-form--password').addClass('Account_slide-form--visible');
        return false;
    });


    $('.Account_slide-close').click(function(){
        betteroffcanvas.dismissOffcanvas($('#SiteHeader-accounts'));
    });
}));
