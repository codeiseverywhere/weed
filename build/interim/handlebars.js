this["SpaceStation"] = this["SpaceStation"] || {};
this["SpaceStation"]["AjaxCart"] = this["SpaceStation"]["AjaxCart"] || {};
this["SpaceStation"]["AjaxCart"]["cart"] = Handlebars.template({"1":function(container,depth0,helpers,partials,data,blockParams) {
    var stack1, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return ((stack1 = lookupProperty(helpers,"each").call(alias1,(depth0 != null ? lookupProperty(depth0,"items") : depth0),{"name":"each","hash":{},"fn":container.program(2, data, 2, blockParams),"inverse":container.noop,"data":data,"blockParams":blockParams,"loc":{"start":{"line":7,"column":8},"end":{"line":45,"column":17}}})) != null ? stack1 : "")
    + "        <hr class=\"AjaxCart-divider\">\r\n        <table class=\"AjaxCart-totals\">\r\n            <tr class=\"AjaxCart-total AjaxCart-total--subtotal\">\r\n                <th>Subtotal</th>\r\n                <td>"
    + alias3((lookupProperty(helpers,"AjaxCart_money")||(depth0 && lookupProperty(depth0,"AjaxCart_money"))||alias2).call(alias1,(depth0 != null ? lookupProperty(depth0,"items_subtotal_price") : depth0),(depth0 != null ? lookupProperty(depth0,"money_format") : depth0),{"name":"AjaxCart_money","hash":{},"data":data,"blockParams":blockParams,"loc":{"start":{"line":50,"column":20},"end":{"line":50,"column":72}}}))
    + "</td>\r\n            </tr>\r\n"
    + ((stack1 = lookupProperty(helpers,"each").call(alias1,(depth0 != null ? lookupProperty(depth0,"cart_level_discount_applications") : depth0),{"name":"each","hash":{},"fn":container.program(12, data, 2, blockParams),"inverse":container.noop,"data":data,"blockParams":blockParams,"loc":{"start":{"line":52,"column":12},"end":{"line":57,"column":21}}})) != null ? stack1 : "")
    + "            <tr class=\"AjaxCart-total AjaxCart-total--tax\">\r\n                <th>Tax <span class=\"AjaxCart-total_note\">(calculated in checkout)</span></th>\r\n                <td>&mdash;</td>\r\n            </tr>\r\n            <tr class=\"AjaxCart-total AjaxCart-total--shipping\" data-ajaxcart-shipping>\r\n                <th>Shipping\r\n                    <span class=\"AjaxCart-total_note\" data-ajaxcart-shipping-destination></span>\r\n                    <button type=\"button\" class=\"AjaxCart-shipping_address_edit_button\" data-ajaxcart-shipping-editbutton>(edit)</button>\r\n                    <form class=\"AjaxCart-shipping_address_form\" data-ajaxcart-shipping-form>\r\n                        <div class=\"AjaxCart-shipping_address_input FormItem FormItem--stacked\">\r\n                            <select type=\"text\" name=\"shipping_address[country]\" data-ajaxcart-shipping-countryinput>\r\n                                <option>Country</option>\r\n                            </select>\r\n                        </div>\r\n                        <div class=\"AjaxCart-shipping_address_input FormItem FormItem--stacked\">\r\n                            <select type=\"text\" name=\"shipping_address[province]\" data-ajaxcart-shipping-provinceinput>\r\n                                <option>Province</option>\r\n                            </select>\r\n                        </div>\r\n                        <div class=\"AjaxCart-shipping_address_input FormItem FormItem--stacked\">\r\n                            <input type=\"text\" name=\"shipping_address[zip]\" placeholder=\"Postal Code\">\r\n                        </div>\r\n                        <div class=\"AjaxCart-shipping_address_action FormItem FormItem--actions\">\r\n                            <button type=\"submit\" class=\"FormItem-action FormItem-action--primary\">Edit</button>\r\n                        </div>\r\n                    </form>\r\n                </th>\r\n                <td data-ajaxcart-shipping-price>&mdash;</td>\r\n            </tr>\r\n            <tr class=\"AjaxCart-total AjaxCart-total--grandtotal\">\r\n                <th>Estimated Total</th>\r\n                <td>"
    + alias3((lookupProperty(helpers,"AjaxCart_money")||(depth0 && lookupProperty(depth0,"AjaxCart_money"))||alias2).call(alias1,(depth0 != null ? lookupProperty(depth0,"total_price") : depth0),(depth0 != null ? lookupProperty(depth0,"money_format") : depth0),{"name":"AjaxCart_money","hash":{},"data":data,"blockParams":blockParams,"loc":{"start":{"line":89,"column":20},"end":{"line":89,"column":63}}}))
    + "</td>\r\n            </tr>\r\n        </table>\r\n";
},"2":function(container,depth0,helpers,partials,data,blockParams) {
    var stack1, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.lambda, alias3=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "            <div class=\"AjaxCart-item\">\r\n                <div class=\"AjaxCart-item_image\">\r\n"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,((stack1 = blockParams[0][0]) != null ? lookupProperty(stack1,"featured_image") : stack1),{"name":"if","hash":{},"fn":container.program(3, data, 0, blockParams),"inverse":container.noop,"data":data,"blockParams":blockParams,"loc":{"start":{"line":10,"column":20},"end":{"line":12,"column":27}}})) != null ? stack1 : "")
    + "                </div>\r\n                <div class=\"AjaxCart-item_details\">\r\n                    <h3 class=\"AjaxCart-item_title\"><a href=\""
    + alias3(alias2(((stack1 = blockParams[0][0]) != null ? lookupProperty(stack1,"url") : stack1), depth0))
    + "\">"
    + alias3(alias2(((stack1 = blockParams[0][0]) != null ? lookupProperty(stack1,"product_title") : stack1), depth0))
    + "</a></h3>\r\n"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,((stack1 = blockParams[0][0]) != null ? lookupProperty(stack1,"options_with_values") : stack1),{"name":"if","hash":{},"fn":container.program(5, data, 0, blockParams),"inverse":container.noop,"data":data,"blockParams":blockParams,"loc":{"start":{"line":16,"column":20},"end":{"line":27,"column":27}}})) != null ? stack1 : "")
    + "                    <div class=\"AjaxCart-item_quantity_selector\" data-ajaxcart-quantity data-ajaxcart-quantity-lineitem=\""
    + alias3(alias2(((stack1 = blockParams[0][0]) != null ? lookupProperty(stack1,"id") : stack1), depth0))
    + "\">\r\n                        <input class=\"AjaxCart-item_quantity\" type=\"number\" value=\""
    + alias3(alias2(((stack1 = blockParams[0][0]) != null ? lookupProperty(stack1,"quantity") : stack1), depth0))
    + "\">\r\n                        <button type=\"button\" class=\"AjaxCart-item_quantity_toggle AjaxCart-item_quantity_toggle--increase\" data-ajaxcart-quantitytoggle=\"1\">+</button>\r\n                        <button type=\"button\" class=\"AjaxCart-item_quantity_toggle AjaxCart-item_quantity_toggle--decrease\" data-ajaxcart-quantitytoggle=\"-1\">-</button>\r\n                    </div>\r\n                    <button type=\"button\" class=\"AjaxCart-item_remove\" data-ajaxcart-remove data-ajaxcart-remove-lineitem=\""
    + alias3(alias2(((stack1 = blockParams[0][0]) != null ? lookupProperty(stack1,"id") : stack1), depth0))
    + "\">Remove</button>\r\n"
    + ((stack1 = lookupProperty(helpers,"each").call(alias1,((stack1 = blockParams[0][0]) != null ? lookupProperty(stack1,"line_level_discount_applications") : stack1),{"name":"each","hash":{},"fn":container.program(9, data, 2, blockParams),"inverse":container.noop,"data":data,"blockParams":blockParams,"loc":{"start":{"line":34,"column":20},"end":{"line":41,"column":29}}})) != null ? stack1 : "")
    + "                    <span class=\"AjaxCart-item_price AjaxCart-item_price--total\">"
    + alias3((lookupProperty(helpers,"AjaxCart_money")||(depth0 && lookupProperty(depth0,"AjaxCart_money"))||container.hooks.helperMissing).call(alias1,((stack1 = blockParams[0][0]) != null ? lookupProperty(stack1,"final_line_price") : stack1),(depth0 != null ? lookupProperty(depth0,"money_format") : depth0),{"name":"AjaxCart_money","hash":{},"data":data,"blockParams":blockParams,"loc":{"start":{"line":42,"column":81},"end":{"line":42,"column":134}}}))
    + "</span>\r\n                </div>\r\n            </div>\r\n";
},"3":function(container,depth0,helpers,partials,data,blockParams) {
    var stack1, alias1=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "                        <img src=\""
    + alias1((lookupProperty(helpers,"AjaxCart_img-url")||(depth0 && lookupProperty(depth0,"AjaxCart_img-url"))||container.hooks.helperMissing).call(depth0 != null ? depth0 : (container.nullContext || {}),((stack1 = ((stack1 = blockParams[1][0]) != null ? lookupProperty(stack1,"featured_image") : stack1)) != null ? lookupProperty(stack1,"url") : stack1),"200x",{"name":"AjaxCart_img-url","hash":{},"data":data,"blockParams":blockParams,"loc":{"start":{"line":11,"column":34},"end":{"line":11,"column":85}}}))
    + "\" alt=\""
    + alias1(container.lambda(((stack1 = ((stack1 = blockParams[1][0]) != null ? lookupProperty(stack1,"featured_image") : stack1)) != null ? lookupProperty(stack1,"alt") : stack1), depth0))
    + "\">\r\n";
},"5":function(container,depth0,helpers,partials,data,blockParams) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "                        <div class=\"AjaxCart-item_options\">\r\n"
    + ((stack1 = lookupProperty(helpers,"each").call(depth0 != null ? depth0 : (container.nullContext || {}),((stack1 = blockParams[1][0]) != null ? lookupProperty(stack1,"options_with_values") : stack1),{"name":"each","hash":{},"fn":container.program(6, data, 2, blockParams),"inverse":container.noop,"data":data,"blockParams":blockParams,"loc":{"start":{"line":18,"column":28},"end":{"line":25,"column":37}}})) != null ? stack1 : "")
    + "                        </div>\r\n";
},"6":function(container,depth0,helpers,partials,data,blockParams) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return ((stack1 = (lookupProperty(helpers,"AjaxCart_not-default-option")||(depth0 && lookupProperty(depth0,"AjaxCart_not-default-option"))||container.hooks.helperMissing).call(depth0 != null ? depth0 : (container.nullContext || {}),blockParams[0][0],{"name":"AjaxCart_not-default-option","hash":{},"fn":container.program(7, data, 0, blockParams),"inverse":container.noop,"data":data,"blockParams":blockParams,"loc":{"start":{"line":19,"column":32},"end":{"line":24,"column":64}}})) != null ? stack1 : "");
},"7":function(container,depth0,helpers,partials,data,blockParams) {
    var stack1, alias1=container.lambda, alias2=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "                                    <div class=\"AjaxCart-item_option\">\r\n                                        <span class=\"AjaxCart-item_option_title\">"
    + alias2(alias1(((stack1 = blockParams[1][0]) != null ? lookupProperty(stack1,"name") : stack1), depth0))
    + "</span>:\r\n                                        <span class=\"AjaxCart-item_option_value\">"
    + alias2(alias1(((stack1 = blockParams[1][0]) != null ? lookupProperty(stack1,"value") : stack1), depth0))
    + "</span>\r\n                                    </div>\r\n";
},"9":function(container,depth0,helpers,partials,data,blockParams) {
    var stack1, alias1=container.escapeExpression, alias2=depth0 != null ? depth0 : (container.nullContext || {}), lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "                        <div class=\"AjaxCart-item_discount\">\r\n                            "
    + alias1(container.lambda(((stack1 = ((stack1 = blockParams[0][0]) != null ? lookupProperty(stack1,"discount_application") : stack1)) != null ? lookupProperty(stack1,"title") : stack1), depth0))
    + ": <span class=\"AjaxCart-item_price AjaxCart-item_price--discount\">"
    + alias1((lookupProperty(helpers,"AjaxCart_money")||(depth0 && lookupProperty(depth0,"AjaxCart_money"))||container.hooks.helperMissing).call(alias2,((stack1 = blockParams[0][0]) != null ? lookupProperty(stack1,"amount") : stack1),(depth0 != null ? lookupProperty(depth0,"money_format") : depth0),{"name":"AjaxCart_money","hash":{},"data":data,"blockParams":blockParams,"loc":{"start":{"line":36,"column":133},"end":{"line":36,"column":180}}}))
    + "</span>\r\n"
    + ((stack1 = lookupProperty(helpers,"if").call(alias2,((stack1 = ((stack1 = blockParams[0][0]) != null ? lookupProperty(stack1,"discount_application") : stack1)) != null ? lookupProperty(stack1,"description") : stack1),{"name":"if","hash":{},"fn":container.program(10, data, 0, blockParams),"inverse":container.noop,"data":data,"blockParams":blockParams,"loc":{"start":{"line":37,"column":28},"end":{"line":39,"column":35}}})) != null ? stack1 : "")
    + "                        </div>\r\n";
},"10":function(container,depth0,helpers,partials,data,blockParams) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "                                <div class=\"AjaxCart-item_discount_description\">"
    + container.escapeExpression(container.lambda(((stack1 = ((stack1 = blockParams[1][0]) != null ? lookupProperty(stack1,"discount_application") : stack1)) != null ? lookupProperty(stack1,"description") : stack1), depth0))
    + "</div>\r\n";
},"12":function(container,depth0,helpers,partials,data,blockParams) {
    var stack1, alias1=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "                <tr class=\"AjaxCart-total AjaxCart-total--discount\">\r\n                    <th>Promotion <span class=\"AjaxCart-total_note\">("
    + alias1(container.lambda(((stack1 = blockParams[0][0]) != null ? lookupProperty(stack1,"title") : stack1), depth0))
    + ")</span></th>\r\n                    <td>"
    + alias1((lookupProperty(helpers,"AjaxCart_money")||(depth0 && lookupProperty(depth0,"AjaxCart_money"))||container.hooks.helperMissing).call(depth0 != null ? depth0 : (container.nullContext || {}),((stack1 = blockParams[0][0]) != null ? lookupProperty(stack1,"total_allocated_amount") : stack1),(depth0 != null ? lookupProperty(depth0,"money_format") : depth0),{"name":"AjaxCart_money","hash":{},"data":data,"blockParams":blockParams,"loc":{"start":{"line":55,"column":24},"end":{"line":55,"column":87}}}))
    + "</td>\r\n                </tr>\r\n";
},"14":function(container,depth0,helpers,partials,data) {
    return "        <div class=\"AjaxCart-empty_state\">Nothing here!</div>\r\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data,blockParams) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class=\"AjaxCart\">\r\n    <hgroup class=\"AjaxCart-cart_header\">\r\n        <button class=\"AjaxCart-dismiss\" type=\"button\" data-dismiss=\"offcanvas\">Dismiss</button>\r\n        <h2 class=\"AjaxCart-cart_title\">Your Cart</h2>\r\n    </hgroup>\r\n"
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"items") : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0, blockParams),"inverse":container.program(14, data, 0, blockParams),"data":data,"blockParams":blockParams,"loc":{"start":{"line":6,"column":4},"end":{"line":94,"column":11}}})) != null ? stack1 : "")
    + "</div>\r\n";
},"useData":true,"useBlockParams":true});
this["SpaceStation"]["AjaxCart"]["cart_error"] = Handlebars.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3="function", alias4=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class=\"AjaxCart AjaxCart--error\">\r\n    <span>"
    + alias4(((helper = (helper = lookupProperty(helpers,"friendly_error") || (depth0 != null ? lookupProperty(depth0,"friendly_error") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"friendly_error","hash":{},"data":data,"loc":{"start":{"line":2,"column":10},"end":{"line":2,"column":28}}}) : helper)))
    + "</span>\r\n    <span class=\"AjaxCart-error_message\">"
    + alias4(((helper = (helper = lookupProperty(helpers,"error") || (depth0 != null ? lookupProperty(depth0,"error") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"error","hash":{},"data":data,"loc":{"start":{"line":3,"column":41},"end":{"line":3,"column":50}}}) : helper)))
    + "</span>\r\n</div>";
},"useData":true});