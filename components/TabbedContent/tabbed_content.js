/*global define, console, document, window*/
(function (root, factory) {
    "use strict";
    if (typeof define === 'function' && define.amd) {
        define("TabbedContent", ["jquery", "Behaviors"], factory);
    } else {
        root.TabbedContent = factory(root.jQuery, root.Behaviors);
    }
}(this, function ($, Behaviors) {
    "use strict";

    var module = {};

    function $do(that, target) {
        return function () {
            target.apply(that, arguments);
        };
    }

    function TabbedContentRegion(elem) {
        Behaviors.init(TabbedContentRegion, this, arguments);

        this.$elem = $(elem);
        this.id = this.$elem.attr("id");
        this.active = this.$elem.data("tabbedcontent-region-active") !== undefined;

        this.links = [];

        this.reflect_status();
    }

    Behaviors.inherit(TabbedContentRegion, Behaviors.Behavior);

    TabbedContentRegion.QUERY = "[data-tabbedcontent-region]";

    TabbedContentRegion.prototype.reflect_status = function (status) {
        var i;

        if (status === undefined) {
            status = this.active;
        }

        if (status) {
            this.$elem.addClass("is-TabbedContent--active");
            this.$elem.removeClass("is-TabbedContent--inactive");
        } else {
            this.$elem.removeClass("is-TabbedContent--active");
            this.$elem.addClass("is-TabbedContent--inactive");
        }

        for (i = 0; i < this.links.length; i += 1) {
            if (status) {
                this.links[i].addClass("is-TabbedContent--target_active");
                this.links[i].removeClass("is-TabbedContent--target_inactive");
            } else {
                this.links[i].removeClass("is-TabbedContent--target_active");
                this.links[i].addClass("is-TabbedContent--target_inactive");
            }
        }
    };

    TabbedContentRegion.prototype.add_incoming_link = function ($li) {
        this.links.push($li);
    };

    function TabbedContentSet(elem) {
        Behaviors.init(TabbedContentSet, this, arguments);

        this.$elem = $(elem);

        this.tabset_name = this.$elem.attr("data-tabbedcontent-set");
        if (this.tabset_name === undefined) {
            this.tabset_name = this.$elem.attr("id");
        }

        this.tab_members = {};
        this.list = [];

        this.find_links();
    }

    Behaviors.inherit(TabbedContentSet, Behaviors.Behavior);

    TabbedContentSet.QUERY = "[data-tabbedcontent-set]";

    TabbedContentSet.prototype.new_tab = function (id) {
        var $elem = $("#" + id);

        if ($elem.length === 0) {
            return false;
        }

        if (this.tab_members[id] === undefined) {
            this.tab_members[id] = {
                "toggles": [],
                "content": TabbedContentRegion.locate($elem)
            };
        }

        return true;
    };

    TabbedContentSet.prototype.set_active_tab = function (id) {
        var k;

        for (k in this.tab_members) {
            if (this.tab_members.hasOwnProperty(k)) {
                this.tab_members[k].content.active = k === id;
                this.tab_members[k].content.reflect_status();
            }
        }
    };

    TabbedContentSet.prototype.navigate_tab_intent = function (id, evt) {
        this.set_active_tab(id);

        if (evt) {
            evt.preventDefault();
        }
    };

    TabbedContentSet.prototype.import_list_item = function (li) {
        var $li = $(li),
            $link = $li.find("a"),
            href = $link.attr("href"),
            id;

        if ($link.length === 0) {
            return;
        }

        if (href.indexOf("#") !== -1) {
            id = href.slice(1);
        }

        if (id === undefined) {
            return;
        }

        if (this.tab_members[id] === undefined && !this.new_tab(id)) {
            return;
        }

        this.list.push({
            "li": $li,
            "id": id
        });
        this.tab_members[id].content.add_incoming_link($li);
        this.tab_members[id].content.reflect_status();
        $link.on("touchend click", this.navigate_tab_intent.bind(this, id));
    };

    TabbedContentSet.prototype.find_links = function () {
        var that = this;

        this.$elem.find("li").each(function (index, elem) {
            return that.import_list_item(elem);
        });
    };

    Behaviors.register_behavior(TabbedContentSet);

    module.TabbedContentSet = TabbedContentSet;

    return module;
}));
