(function (root, factory) {
    "use strict";
    if (typeof define === 'function' && define.amd) {
        define("siteheader", ["jquery", "betteroffcanvas"], factory);
    } else {
        // Browser globals
        root.siteheader = factory(root.jQuery, root.betteroffcanvas);
    }
}(this, function ($, betteroffcanvas, ajaxCart, Handlebars) {
    "use strict";
    "feel good";

    function update_scroll() {
        var scrollTop = $(window).scrollTop(),
            $SiteHeader = $("[data-siteheader='siteheader']");

        if (scrollTop === 0) {
            $SiteHeader.addClass("is-SiteHeader--at_top");
            $SiteHeader.removeClass("is-SiteHeader--scrolled");
        } else {
            $SiteHeader.removeClass("is-SiteHeader--at_top");
            $SiteHeader.addClass("is-SiteHeader--scrolled");
        }
    };

    $(window).on("scroll", update_scroll);

    update_scroll();
}));
