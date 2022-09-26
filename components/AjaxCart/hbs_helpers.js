(function(Handlebars, Shopify) {
    "use strict";

    //TODO: comma/period radix swap for CHF, CZK, DKK, EUR, HRK, HUF
    var CURRENCIES = {
        "AED": {
            "symbol": "Dhs. ",
            "precision": 2,
        },
        "AUD": {
            "symbol": "$",
            "precision": 2
        },
        "CAD": {
            "symbol": "$",
            "precision": 2
        },
        "CHF": {
            "symbol": "CHF ",
            "precision": 2
        },
        "CZK": {
            "suffix": " Kč",
            "precision": 2
        },
        "DKK": {
            "suffix": " kr",
            "precision": 2
        },
        "EUR": {
            "symbol": "€",
            "precision": 2
        },
        "GBP": {
            "symbol": "£",
            "precision": 2
        },
        "HKD": {
            "symbol": "$",
            "precision": 2
        },
        "HRK": {
            "suffix": " kn",
            "precision": 2
        },
        "HUF": {
            "precision": 2 //HUF doesn't appear to render fractional digits for some reason...
        },
        "ILS": {
            "precision": 2
        },
        "ISK": {
            "suffix": " kr",
            "precision": 0
        },
        "JPY": {
            "symbol": "¥",
            "precision": 0
        },
        "MXN": {
            "symbol": "$",
            "precision": 2
        },
        "NZD": {
            "symbol": "$",
            "precision": 2
        },
        "SEK": {
            "suffix": " kr",
            "precision": 0
        },
        "SGD": {
            "symbol": "$",
            "precision": 2
        },
        "THB": {
            "suffix": " ฿", // no not bitcoin
            "precision": 2
        },
        "USD": {
            "symbol": "$",
            "precision": 2
        }
    };

    /**
     * Format a money value provided by Shopify's API.
     * 
     * This is also available to Handlebars code via the `AjaxCart_money`
     * helper.
     * 
     * @param {Number} value The money value, denominated in the smallest
     * possible unit of that currency.
     * 
     * For example, USD will be denominated in pennies: a USD value of 100
     * indicates $1.00.
     * 
     * @param {String|undefined} money_format The store's money format string.
     * 
     * If not provided, the one in `Shopify.money_format` will be used to
     * format the money value. Since Shopify does not provide a way to obtain
     * presentment currency format strings at this time, we assume USD format
     * and use text replacement hacks
     * 
     * @param {String} currency The current presentment currency the user has
     * selected.
     * 
     * If not provided. the one in `Shopify.currency.active` will be used.
     */
    function format_money_with_currency(value, money_format, currency) {
        if (!currency) {
            currency = Shopify.currency.active;
        }

        if (!money_format) {
            money_format = Shopify.money_format;
        }
        
        var currency_infos = CURRENCIES[currency];
        if (currency_infos) {
            if (currency_infos.symbol) {
                money_format = money_format.replace("$", currency_infos.symbol);
            } else {
                money_format = money_format.replace("$", "");
            }

            if (currency_infos.suffix) {
                money_format += currency_infos.suffix;
            }

            value = value * Math.pow(10, 2 - currency_infos.precision);
        } else {
            console.warn("Could not find currency " + currency);
        }
        
        return Shopify.formatMoney(value, money_format);
    }

    /**
     * This handler is a proxy for `Shopify.formatMoney`.
     */
    Handlebars.registerHelper("AjaxCart_money", function() {
        var a_args = Array.prototype.slice.call(arguments),
            options = a_args.pop(),
            value = a_args.shift(),
            money_format = a_args.shift(),
            currency = a_args.shift();
        
        return format_money_with_currency(value, money_format, currency);
    });
    
    /**
     * This handler emulates the `img_url` filter on Shopify's liquid
     * interpreter.
     * 
     * It works by exploiting the fact that the filter appears to just append
     * it's width/height parameter to the URL and let the CDN handle the
     * resize. Ergo, we can generate new URLs client-sided.
     * 
     * This does not support the crop, scale, or format parameters of the
     * original filter.
     */
    Handlebars.registerHelper("AjaxCart_img-url", function(url, desired_format) {
        if (!url) {
            return "#";
        }
        
        var url_and_query = url.split("?"),
            url_without_query = url_and_query[0],
            query = url_and_query.slice(1).join("?"),
            path_and_extension = url_without_query.split("."),
            path_without_extension = path_and_extension.slice(0, path_and_extension.length - 1).join("."),
            extension = path_and_extension[path_and_extension.length - 1];
        
        if (desired_format !== undefined && extension != "ico") {
            return path_without_extension + "_" + desired_format + "." + extension + "?" + query;
        } else {
            return path_without_extension + "." + extension + "?" + query;
        }
    });

    /**
     * This handler filters out default options from an options list.
     * 
     * For some reason, Shopify doesn't tell you if a product's options
     * actually make sense, so we have to just do this here.
     */
    Handlebars.registerHelper("AjaxCart_not-default-option", function (item, options) {
        if (item.name === "Title" && item.value === "Default Title") {
            return options.inverse(this);
        } else {
            return options.fn(this);
        }
    });

    window.SpaceStation.AjaxCart.CURRENCIES = CURRENCIES;
    window.SpaceStation.AjaxCart.format_money_with_currency = format_money_with_currency;
}(window.Handlebars, window.Shopify));