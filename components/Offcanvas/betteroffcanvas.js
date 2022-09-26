/*global define, console*/
/*jslint bitwise: true */
/* updated 9/14/2016 */

if (!Array.prototype.indexOf) {
    Array.prototype.indexOf = function (elt) { /*, from*/
        "use strict";
        var len = this.length >>> 0, from = Number(arguments[1]) || 0, derparam;
        from = (from < 0) ? Math.ceil(from) : Math.floor(from);
        if (from < 0) {
            from += len;
        }

        for (derparam; from < len; from += 1) {
            if (from in this && this[from] === elt) {
                return from;
            }
        }
        return -1;
    };
}

(function (root, factory) {
    "use strict";
    if (typeof define === 'function' && define.amd) {
        define("betteroffcanvas", ["jquery"], factory);
    } else {
        // Browser globals
        root.betteroffcanvas = factory(root.jQuery);
    }
}(this, function ($) {
    //BetterOffcanvas
    //Works like this:
    /*
    *  <button type="button" data-toggle="offcanvas" data-target="#any-selector">
    */

    "use strict";

    var $openTarget = null, currentLevel = 0, module = {}, isInDebounce = false,
        target_has_touch = false,
        focus_click_inquiry = false, click_keydown_inquiry = false,
        eligibleTouches = {},
        logger;
    
    /* Logger that throws away all data (default)
     */
    function null_logging() {
        return;
    }
    
    /* Logger that sends all logged data to the JS console.
     */
    function console_logging(log_data) {
        return console.log(log_data);
    }
    
    function switchLoggingMode(mode) {
        switch (mode) {
        case "console":
            logger = console_logging;
            break;
        default:
            logger = null_logging;
            break;
        }
    }
    
    //Inform the user they can enable console logging
    console.log("Offcanvas: You can enable detailed event logging by typing betteroffcanvas.switchLoggingMode('console').");
    switchLoggingMode("null");

    function initOffcanvasToggle($theToggle) {
        var $theTarget = $($theToggle.data("target")), toggleOptions = $theToggle.data("toggle-options"),
            state;

        if ($theTarget.data("offcanvas-state") === undefined) {
            $theTarget.data("offcanvas-state", {"open": false, "parents": null, "$openChild": null, "openChildLvl": 0, "toggleOptions": []});
        }

        state = $theTarget.data("offcanvas-state");

        if (state.toggleOptions === undefined) {
            state.toggleOptions = [];
        }

        if (toggleOptions !== undefined) {
            state.toggleOptions.push.apply(state.toggleOptions, toggleOptions.split(" "));
        }

        $theTarget.data("offcanvas-state", state);

        return $theTarget;
    }

    function findParentLevels($theTarget) {
        var parents = [], tgtState = $theTarget.data("offcanvas-state");

        if (tgtState.parents === null) {
            $theTarget.parents().each(function (index, pelem) {
                var $pelem = $(pelem),
                    parState = $pelem.data("offcanvas-state"),
                    $parTgl;

                if (parState === undefined) {
                    if ($pelem.attr("id") !== undefined) {
                        $parTgl = $("[data-toggle='offcanvas'][data-target='#" + $pelem.attr("id") + "']");
                        if ($parTgl.length > 0) {
                            initOffcanvasToggle($parTgl);
                            parents.push(pelem);
                        }
                    }
                } else {
                    parents.push(pelem);
                }
            });

            tgtState.parents = parents;
            $theTarget.data("offcanvas-state", tgtState);

            $(tgtState.parents).each(function (index, pelem) {
                findParentLevels($(pelem));
            });
        }
    }

    function initOffcanvas($theTarget, toggleOptions) {
        if (toggleOptions === undefined) {
            toggleOptions = [];
        }
        
        if ($theTarget.data("offcanvas-state") === undefined) {
            $theTarget.data("offcanvas-state", {"open": false, "parents": null, "$openChild": null, "openChildLvl": 0, "toggleOptions": toggleOptions});
        }

        findParentLevels($theTarget);
    }

    function isOffcanvas($theTargetList) {
        var truth = true;

        $theTargetList.each(function (index, elem) {
            var $theTarget = $(elem), $toggles;

            if ($theTarget.data("offcanvas-state") !== undefined) {
                truth = truth & true;
                return;
            }

            $toggles = $("[data-toggle='offcanvas'][data-target='#" + $theTarget.attr("id") + "']");

            if ($toggles.length > 0) {
                initOffcanvas($theTarget);

                $toggles.each(function (index, elem) {
                    initOffcanvasToggle($(elem));
                });

                truth &= true;
                return;
            }

            truth &= false;
        });

        return truth;
    }

    function isChildOffcanvas($theTarget, $potentialParent) {
        if (!isOffcanvas($theTarget) || !isOffcanvas($potentialParent)) {
            return false;
        }

        if ($theTarget.data("offcanvas-state").parents.indexOf($potentialParent[0]) === -1) {
            return false;
        }

        return true;
    }

    function isTopLevelOffcanvas($theTarget) {
        return isOffcanvas($theTarget) && $theTarget.data("offcanvas-state").parents.length === 0;
    }

    function updateBackdrop(newLevel, openTargetList) {
        var $backdropDivs = $("[data-offcanvas-backdrop]");

        $backdropDivs.each(function (index, bdElem) {
            var $bdElem = $(bdElem),
                bdLevel = $bdElem.data("offcanvas-backdrop"),
                bdFor = $bdElem.data("offcanvas-backdrop-for");

            if (bdFor !== undefined && openTargetList.indexOf(bdFor) === -1) {
                $bdElem.removeClass("is-Offcanvas--backdrop_active");
                $bdElem.addClass("is-Offcanvas--backdrop_inactive");
            } else if (newLevel >= bdLevel) {
                $bdElem.addClass("is-Offcanvas--backdrop_active");
                $bdElem.removeClass("is-Offcanvas--backdrop_inactive");
            } else {
                $bdElem.removeClass("is-Offcanvas--backdrop_active");
                $bdElem.addClass("is-Offcanvas--backdrop_inactive");
            }
        });

        currentLevel = newLevel;
    }

    function scanChildrenWithinLevel($theTarget, cbk) {
        $theTarget.each(function (index, elem) {
            var $elem = $(elem);

            if (isOffcanvas($elem)) {
                return;
            }

            cbk($elem);
            scanChildrenWithinLevel($elem.children(), cbk);
        });
    }

    function setFocusableWithinLevel($theTarget, isFocusable) {
        if (isFocusable === undefined) {
            isFocusable = true;
        }

        logger("changing focus state to " + isFocusable);

        scanChildrenWithinLevel($theTarget.children(), function ($elem) {
            if ($elem.data("offcanvas-tabindex") === undefined) {
                //Determine if this element should be focusable or not...
                if ($elem.attr("tabindex") !== undefined) {
                    $elem.data("offcanvas-tabindex", $elem.attr("offcanvas-tabindex"));
                } else {
                    $elem.data("offcanvas-tabindex", null);
                }
            }

            if (isFocusable) {
                if ($elem.data("offcanvas-tabindex") === null) {
                    $elem.removeAttr("tabindex");
                } else {
                    $elem.attr("tabindex", $elem.data("offcanvas-tabindex"));
                }
            } else {
                $elem.attr("tabindex", -1);
            }
        });
    }

    function openOffcanvas($theTarget, $theToggle, eventType, isRecursive, recursiveCount) {
        var tgtState, $pelem, parState, newLevel = 1, i, targetIDs = [], $topElem, topState, newEvent;
        if ($theTarget !== null && $theTarget !== undefined) {
            logger("Open Offcanvas " + $theTarget.attr("id"));
        } else {
            logger("Open Offcanvas (no target)");
        }

        if ($theTarget === null) {
            return;
        }
        tgtState = $theTarget.data("offcanvas-state");

        if (recursiveCount === undefined) {
            recursiveCount = 1;
        }

        $theTarget.addClass("is-Offcanvas--open");
        $theTarget.removeClass("is-Offcanvas--closed");
        tgtState.open = true;
        tgtState.open_event = eventType;
        $theTarget.data("offcanvas-state", tgtState);

        $("[data-toggle='offcanvas'][data-target='#" + $theTarget.attr("id") + "']").addClass("is-Offcanvas--target_open");

        setFocusableWithinLevel($theTarget, true);

        if (tgtState.parents.length > 0) {
            $pelem = $(tgtState.parents[0]);

            parState = $pelem.data("offcanvas-state");
            parState.$openChild = $theTarget;
            parState.openChildLvl = recursiveCount;
            $pelem.data("offcanvas-state", parState);

            $pelem.addClass("is-Offcanvas--open_sublvl_" + recursiveCount);

            openOffcanvas($pelem, $theToggle, eventType, true, recursiveCount + 1);

            newLevel = newLevel + tgtState.parents.length;

            $topElem = $(tgtState.parents[tgtState.parents.length - 1]);
            if ($topElem.length > 0) {
                topState = $topElem.data("offcanvas-state");

                if (topState !== undefined) {
                    if (topState.childDepthLvl !== undefined) {
                        $topElem.removeClass("is-Offcanvas--depth_" + topState.childDepthLvl);
                    }

                    topState.childDepthLvl = tgtState.parents.length;
                    $topElem.addClass("is-Offcanvas--depth_" + topState.childDepthLvl);
                }
            }
        }

        if (isRecursive !== true) {
            targetIDs.push($theTarget.attr("id"));

            for (i = 0; i < tgtState.parents.length; i += 1) {
                targetIDs.push(tgtState.parents[i].getAttribute("id"));
            }

            updateBackdrop(newLevel, targetIDs);
        }

        $openTarget = $theTarget;

        newEvent = new $.Event({
            "type": "offcanvas-open",
            "target": $theTarget,
            "toggle": $theToggle,
            "from_child": isRecursive,
            "children_count": recursiveCount,
            "source_event_type": eventType,
        });
        $theTarget.trigger(newEvent);
    }
    
    /* Determine if a user-triggered event is allowed to dismiss an offcanvas
     * or not.
     * 
     * This function is consistenly called before dismissOffcanvas in order to
     * gate event-driven dismissals consistently. Programmatic dismissals (e.g.
     * by third-party code or for clearing the way for the next offcanvas) are
     * NOT gated in the same way.
     * 
     * To gate dismissals in the same fashion, call this function with the
     * following four parameters:
     * 
     *  - $_openTarget: The currently open offcanvas at the start of event
     *                 processing. Specify false to automatically select the
     *                 current open target. Specify undefined for no open
     *                 target.
     * 
     *  - $newTarget:  The new offcanvas that you plan to open at the end of
     *                 event processing.
     * 
     *  - evt:         The event that triggered your current event processing.
     *                 Your code is expected to filter mobile emulation events
     *                 such as emulated click-after-touchend through some means
     *                 so that this function can differentiate between the two.
     * 
     *  - $evtToggle:  The element which triggered the event. May be a
     *                 data-toggle or data-dismiss element. This is not,
     *                 strictly speaking, evt.target: client code is allowed and
     *                 expected to traverse the parents of the target to find,
     *                 say, the button containing the actual event target.
     * 
     * In the event of recieving false from this function, event handlers should
     * cease any event processing which would cause the open target to be
     * dismissed, including opening other offcanvas hierarchies as that will
     * implicitly dismiss the current one.
     */
    function eventCanDismissOffcanvas($_openTarget, $newTarget, evt, $evtToggle) {
        var openTargetState = {"toggleOptions": []}, openTargetIsNoHover = false,
            openTargetWasHovered = false,
            targetsAreIdentical = false,
            evtFromToggle = false, evtFromDismiss = false,
            evtWithinOpenTarget = false,
            evtToggleOptions, evtToggleIsNoHover = false,
            evtToggleTargetsOpenTarget = false,
            hasNewTarget,
            hasOpenTarget,
            hasEventToggle;
        
        if ($_openTarget === false) {
            $_openTarget = $openTarget;
        }
        
        hasNewTarget = $newTarget !== undefined && $newTarget !== null && $newTarget.length >= 1;
        hasOpenTarget = $_openTarget !== undefined && $_openTarget !== null && $_openTarget.length >= 1;
        hasEventToggle = $evtToggle !== undefined && $evtToggle !== null && $evtToggle.length >= 1;
        
        if (hasOpenTarget) {
            openTargetState = $_openTarget.data("offcanvas-state");
            openTargetIsNoHover = openTargetState.toggleOptions.indexOf("nohover") > -1;
            openTargetWasHovered = openTargetState.open_event === "mouseover";
            
            if (evt.target) {
                evtWithinOpenTarget = $_openTarget[0] === evt.target || $.contains($_openTarget[0], evt.target);
            }
        } else {
            logger("Dismissals are always allowed if no offcanvas is open");
            return true;
        }
        
        if (hasNewTarget) {
            targetsAreIdentical = $_openTarget[0] === $newTarget[0];
        }
        
        if (hasEventToggle) {
            evtFromToggle = $evtToggle.filter("[data-toggle='offcanvas']").length > 0 ||
                            $evtToggle.parents().filter("[data-toggle='offcanvas']").length > 0;
            evtFromDismiss = $evtToggle.filter("[data-dismiss='offcanvas']").length > 0 ||
                             $evtToggle.parents().filter("[data-dismiss='offcanvas']").length > 0;
            
            evtToggleOptions = $evtToggle.data("toggle-options");
            if (evtToggleOptions !== undefined) {
                evtToggleOptions = evtToggleOptions.split(" ");
            } else {
                evtToggleOptions = [];
            }
            
            evtToggleIsNoHover = evtToggleOptions.indexOf("nohover") > -1;
            evtToggleTargetsOpenTarget = $evtToggle.data("target") === "#" + $_openTarget.attr("id");
        }
        
        //Dismissals by toggling the same target
        if (evt.type === "click" && openTargetWasHovered) {
            if (targetsAreIdentical) {
                logger("Not going to allow dismiss from click on already hovered nav.");
                return false;
            }
        }
        
        if (evt.type === "focusin") {
            if (targetsAreIdentical) { //TODO: should this be evtWithinOpenTarget?
                logger("Not going to allow dismiss from focusin within same target");
                return false;
            }
            
            if (!hasNewTarget && (evtFromToggle || evtFromDismiss)) {
                logger("Ignoring focus-dismiss due to the fact that event target is an offcanvas toggle.");
                logger("Currently focused off-canvas element: " + $_openTarget.attr("id"));
                return false;
            }
        }
        
        if (evt.type === "mouseover" && !evtWithinOpenTarget) {
            if (evtFromDismiss) {
                logger("Not going to allow dismiss until user actually clicks hovered dismiss button.");
                return false;
            } else if (evtToggleIsNoHover || openTargetIsNoHover) {
                logger("Not going to allow dismiss as toggle is nohover.");
                return false;
            } else if (evtFromToggle && targetsAreIdentical) {
                logger("Not going to allow dismiss as toggle is for current offcanvas.");
                return false;
            }
        }
        
        return true;
    }

    function dismissOffcanvas($theTarget, numLvls) {
        var tgtState = $theTarget.data("offcanvas-state"), newLvl = -1, i, targetIDs = [], $topElem, topState, newEvent;

        if ($theTarget !== null && $theTarget !== undefined) {
            logger("Dismiss Offcanvas " + $theTarget.attr("id"));
        } else {
            logger("Dismiss Offcanvas (no target)");
        }

        if (numLvls === undefined) {
            /* NumLvls is the number of recursion levels (children being auto-dismissed) */
            numLvls = 1;

            $topElem = $(tgtState.parents[tgtState.parents.length - 1]);
            if ($topElem.length > 0) {
                topState = $topElem.data("offcanvas-state");

                if (topState !== undefined) {
                    if (topState.childDepthLvl !== undefined) {
                        $topElem.removeClass("is-Offcanvas--depth_" + topState.childDepthLvl);
                    }

                    topState.childDepthLvl = tgtState.parents.length - 1;
                    $topElem.addClass("is-Offcanvas--depth_" + topState.childDepthLvl);
                }
            }
        }

        $theTarget.removeClass("is-Offcanvas--open");
        $theTarget.addClass("is-Offcanvas--closed");
        tgtState.open = false;
        tgtState.open_event = undefined;
        $theTarget.data("offcanvas-state", tgtState);

        $("[data-toggle='offcanvas'][data-target='#" + $theTarget.attr("id") + "']").removeClass("is-Offcanvas--target_open");

        newEvent = new $.Event({
            "type": "offcanvas-dismiss",
            "target": $theTarget
        });
        $theTarget.trigger(newEvent);

        //TODO: How do we actually tell if the offcanvas is visible when closed?
        //(e.g. desktop nav)
        if (!isTopLevelOffcanvas($theTarget)) {
            if ($theTarget !== null) {
                logger("Marking non-top-level offcanvas nav " + $theTarget.attr("id") + " as untabbable");
            }
            setFocusableWithinLevel($theTarget, false);
        }

        if (tgtState.$openChild !== null) {
            dismissOffcanvas(tgtState.$openChild, numLvls + 1);
        } else {
            if (tgtState.parents.length > 0) {
                $openTarget = $(tgtState.parents[numLvls - 1]);
                if ($openTarget.length === 0) {
                    $openTarget = null;
                }

                $(tgtState.parents).each(function (index, pelem) {
                    var $pelem = $(pelem), parState = $pelem.data("offcanvas-state"), childlvl, newChildLvl = parState.openChildLvl - numLvls;

                    $pelem.removeClass("is-Offcanvas--open_sublvl_" + parState.openChildLvl);
                    if (newChildLvl > 0) {
                        $pelem.addClass("is-Offcanvas--open_sublvl_" + newChildLvl);
                    } else {
                        parState.$openChild = null;
                    }

                    parState.openChildLvl = newChildLvl;
                    $pelem.data("offcanvas-state", parState);

                    if (newChildLvl > newLvl) {
                        newLvl = newChildLvl;
                    }
                });
            } else {
                $openTarget = null;
                newLvl = -1;
            }

            for (i = 0; i < tgtState.parents.length; i += 1) {
                targetIDs.push(tgtState.parents[i].getAttribute("id"));
            }

            updateBackdrop(newLvl + 1, targetIDs);
        }
    }

    function dismissOpenOffcanvas() {
        if ($openTarget !== null) {
            dismissOffcanvas($openTarget);
        }
    }

    function enableDebounce() {
        if (!isInDebounce) {
            logger("Debounce timeout enabled");
            isInDebounce = true;
            window.setTimeout(function () {
                logger("Debounce timeout expired - event processing will resume");
                isInDebounce = false;
            }, 100);
        }
    }

    $(document).on("keydown", function (evt) {
        if (evt.keyCode === 27) {
            dismissOpenOffcanvas();
        } else if (evt.keyCode === 13) {
            logger("Keydown event - ENTER. Disabling link clickthrough for the next click event.");
            click_keydown_inquiry = true; //mark that the following click event is
                                        //from a keyboard
        }
    });

    $(document).on("ready", function (evt) {
        var openIDs = [], openState, i;

        if ($openTarget !== null) {
            openState = $openTarget.data("offcanvas-state");

            for (i = 0; i < openState.parents.length; i += 1) {
                openIDs.push(openState.parents[i].getAttribute("id"));
            }

            updateBackdrop(currentLevel, openIDs);
        }
    });

    function on_focusin(evt) {
        var $tgt = $(evt.target), $tgtOffcanvas = null,
            $tgtParents = $tgt.parents(), $toggleTarget,
            dismissAllowed;

        $tgtParents.each(function (index, elem) {
            if ($tgtOffcanvas === null) {
                if (isOffcanvas($(elem))) {
                    $tgtOffcanvas = $(elem);
                }
            }
        });

        if (isInDebounce) {
            logger("Processed event (debounced, type: focusin)");
            return;
        }
        
        if ($tgt.data("toggle") === "offcanvas") {
            $toggleTarget = $($tgt.data("target"));
            if (!isTopLevelOffcanvas($toggleTarget)) {
                if ($toggleTarget !== null) {
                    logger("Marking non-top-level offcanvas nav " + $toggleTarget.attr("id") + " as untabbable");
                }
                setFocusableWithinLevel($toggleTarget, false);
            }
        }
        
        if (!eventCanDismissOffcanvas($openTarget, $tgtOffcanvas, evt, $tgt)) {
            return;
        }

        if ($tgtOffcanvas === null && $openTarget !== null) {
            logger("Focused on something outside of off-canvas nav " + $openTarget.attr("id"));
            logger($tgt);

            enableDebounce(); //prevent subsequent click event handlers from tripping

            while ($openTarget !== null) {
                dismissOpenOffcanvas();
            }
        } else {
            if ($tgtOffcanvas !== null) {
                logger("Focused inside off-canvas nav " + $tgtOffcanvas.attr("id"));
            }

            if ($openTarget !== null) {
                enableDebounce(); //prevent subsequent click event handlers from tripping

                while ($openTarget !== null && !isChildOffcanvas($tgtOffcanvas, $openTarget)) {
                    logger("Dismissing off-canvas menu " + $openTarget.attr("id"));
                    dismissOffcanvas($openTarget);
                }
            }
            openOffcanvas($tgtOffcanvas, $tgt, evt.type);
        }
    }
    
    //Track a specific set of focus events to ensure they don't result in a
    //click.
    $(document).on("focusin", function (evt) {
        logger(evt.type);

        focus_click_inquiry = true;

        window.setTimeout(function () {
            if (focus_click_inquiry) { //e.g. if a click event hasn't happened
                on_focusin(evt);
            }
        }, 300);
    });
    
    //Activate touch-specific behaviors if we have ever recieved a touch event.
    $(document).on("touchstart touchend touchmove touchcancel", function (evt) {
        target_has_touch = true;
    });
    
    /* Track the starting position of every touch we get. */
    $(document).on("touchstart", function (evt) {
        var i, touch;
        
        for (i = 0; i < evt.originalEvent.changedTouches.length; i += 1) {
            touch = evt.originalEvent.changedTouches.item(i);
            eligibleTouches[touch.identifier] = {
                "x": touch.screenX,
                "y": touch.screenY
            };
        }
    });
    
    /* Track and remove touches which have become drags.
     * Assumes a minimum drag distance of 15px.
     * Returns true if any of the given touches are still eligible.
     */
    function testAndPruneTouchList(changedTouches) {
        var i, touch, stTouch, dist, MAX_DIST = 15, num_valid_touches = 0;
        
        for (i = 0; i < changedTouches.length; i += 1) {
            touch = changedTouches.item(i);
            
            if (eligibleTouches.hasOwnProperty(touch.identifier)) {
                stTouch = eligibleTouches[touch.identifier];
                dist = Math.sqrt(Math.pow((touch.screenX - stTouch.x), 2.0)
                               + Math.pow((touch.screenY - stTouch.y), 2.0));
                
                if (dist > MAX_DIST) {
                    delete eligibleTouches[touch.identifier];
                } else {
                    num_valid_touches += 1;
                }
            }
        }
        
        return num_valid_touches > 0;
    }
    
    /* Remove touches that have become drags.
     * This function assumes a minimum drag distance of 15px.
     */
    $(document).on("touchmove", function (evt) {
        testAndPruneTouchList(evt.originalEvent.changedTouches);
    });
    
    /* Remove touches that have cancelled for hardware or OS specific reasons.
     */
    $(document).on("touchcancel", function (evt) {
        var i, touch;
        
        for (i = 0; i < evt.originalEvent.changedTouches.length; i += 1) {
            touch = evt.originalEvent.changedTouches.item(i);
            delete eligibleTouches[touch.identifier];
        }
    });
    
    /* Our main, extremely complicated event handler.
     * We have to track a whole bunch of corner cases, since users expect the
     * following out of their navigation structures:
     * 
     *  1. Hovering over a toggle should open it
     *  2. Touching a toggle with a finger should open it
     *  3. Clicking on a toggle should navigate to it's link target, as it has
     *     already opened from a hover
     *  4. Tab-focusing content should cause offcanvas's open/close state to
     *     follow through it
     *  5. Touches should only be honored if they were not the end of a drag
     */
    $(document).on("click touchend mouseover", function (evt) {
        var i, sentinel = false,
            $theToggle = $(evt.target),
            $theTarget,
            tgtStatus,
            tgtState,
            $btnParent = $theToggle.parents().filter("[data-toggle='offcanvas']"),
            skipToggle = false,
            hoverMin = $("body").data("offcanvas-hover-min"),
            toggleOptions,
            hasEligibleTouches;

        logger(evt.type);

        focus_click_inquiry = false;

        if (hoverMin === undefined) {
            hoverMin = 0;
        }

        if (evt.type === "mouseover") {
            if ($(window).width() < hoverMin) {
                return;
            }
        }

        if ($theToggle.data("toggle") !== "offcanvas" && $btnParent.length > 0) { //Fixup hits on child text, graphical bits, etc
            $theToggle = $btnParent;
        }

        if (($openTarget === null || $openTarget === undefined || $openTarget.length === 0) && $theToggle.data("toggle") !== "offcanvas") {
            return;
        }

        if (evt.type !== "mouseover" && isInDebounce) {
            logger("Processed event (debounced)");
            evt.preventDefault();
            return;
        }
        
        //Check if any of our touches were actually drags so we can ignore em
        if (evt.type === "touchend") {
            hasEligibleTouches = testAndPruneTouchList(evt.originalEvent.changedTouches);
            
            if (!hasEligibleTouches) {
                logger("Ignoring touch event as it is the result of a drag");
                return;
            }
        }

        toggleOptions = $theToggle.data("toggle-options");
        if (toggleOptions !== undefined) {
            toggleOptions = toggleOptions.split(" ");
        } else {
            toggleOptions = [];
        }

        if (evt.type === "mouseover" && toggleOptions.indexOf("nohover") > -1) {
            logger("Not opening a no-hover toggle");
            return;
        }
        
        //Used to allow using the <a>nchor portion of a dropdown toggle
        //but only after it was opened using a mouse
        if ($(window).width() >= hoverMin &&
                $theToggle[0].tagName === "A" &&
                evt.type === "click" &&
                !target_has_touch &&
                !click_keydown_inquiry && //and event is not generated by a keyboard
                toggleOptions.indexOf("nohover") === -1 &&
                toggleOptions.indexOf("nohref") === -1) {

            logger("Allowing link to resolve instead of opening toggle");
            return;
        }

        click_keydown_inquiry = false; //clear the "click event was generated by
                                     //a keyboard event" flag so the user can
                                     //switch back to mouse input
        
        if ($openTarget !== null && $openTarget !== undefined && $openTarget.length > 0) {
            //Determine if it's okay to do anything that might dismiss an offcanvas
            //based on this event
            tgtState = $openTarget.data("offcanvas-state");
            if (tgtState === undefined) {
                //This step is needed if the offcanvas elements were deleted and
                //recreated behind our back (e.g. because PageTransitions). In that
                //case all we can do is drop the current $openTarget entirely.
                $openTarget = undefined;
            }
        }
        
        if ($theToggle.data("toggle") === "offcanvas") {
            $theTarget = initOffcanvasToggle($theToggle);
            findParentLevels($theTarget);
        }

        if (!eventCanDismissOffcanvas($openTarget, $theTarget, evt, $theToggle)) {
            return;
        }
        
        logger("Processed event");
        
        if ($openTarget !== null &&
                $openTarget !== undefined &&
                $openTarget.length > 0 &&
                !$.contains($openTarget[0], evt.target) &&
                $openTarget[0] !== evt.target) {
            
            //Dismiss offcanvas by clicking outside it's area
            if ("#" + $openTarget.attr("id") === $theToggle.data("target")) {
                skipToggle = true;
            }
            
            if ($theToggle.filter("[data-dismiss='offcanvas']").length > 0) {
                logger("Not overridding a click on an existing dismiss button just because the click handler happened to win a race condition");
            } else {
                logger(tgtState.toggleOptions);
                logger(toggleOptions);

                enableDebounce();

                if ($($theToggle.data("target"))[0] === $openTarget[0]) {
                    //If we have clicked on a toggle for the currently open offcanvas, eat the event
                    evt.preventDefault();
                    evt.stopPropagation();
                    evt.stopImmediatePropagation();
                }

                dismissOffcanvas($openTarget);
            }
        }

        if ($theTarget !== undefined && !skipToggle) { //Open offcanvas via a toggle link
            enableDebounce();

            tgtState = $theTarget.data("offcanvas-state");

            //Determine if a different offcanvas tree is active, and, if so, dismiss it first.
            while ($openTarget !== null && $openTarget !== undefined) {
                sentinel = $openTarget[0] === $theTarget[0];

                for (i = 0; i < tgtState.parents.length; i += 1) {
                    if ($openTarget[0] === tgtState.parents[i]) {
                        sentinel = true;
                        break;
                    }
                }

                if (sentinel) {
                    break;
                }

                dismissOffcanvas($openTarget);
            }

            if (tgtState.open) {
                dismissOffcanvas($theTarget);
            } else {
                openOffcanvas($theTarget, $theToggle, evt.type);
            }

            if ($theToggle[0].tagName.toLowerCase() === "a" || $theToggle[0].tagName.toLowerCase() === "button") {
                evt.preventDefault();
            }
        }
    });
    
    /* Another, slightly less complex event handler for dismissing open content
     */
    $(document).on("click touchend", function (evt) {
        var $theToggle = $(evt.target), $theTarget, tgtStatus, tgtState, $btnParent = $theToggle.parents().filter("[data-dismiss='offcanvas']"), skipToggle = false, i, sentinel = false, $toDismiss = $openTarget;

        if ($theToggle.data("dismiss") !== "offcanvas" && $btnParent.length > 0) { //Fixup hits on child text, graphical bits, etc
            $theToggle = $btnParent;
        }

        if ($theToggle.data("dismiss") !== "offcanvas") {
            return;
        }

        if (isInDebounce) {
            logger("Processed event (debounced)");
            evt.preventDefault();
            return;
        }

        enableDebounce();

        if ($theToggle.data("target") !== undefined) {
            $toDismiss = $($theToggle.data("target"));
        }

        if ($toDismiss.length > 0) {
            dismissOffcanvas($toDismiss);
        }
        
        evt.preventDefault();
    });

    module.isOffcanvas = isOffcanvas;
    module.isChildOffcanvas = isChildOffcanvas;
    module.isTopLevelOffcanvas = isTopLevelOffcanvas;
    module.initOffcanvas = initOffcanvas;
    module.initOffcanvasToggle = initOffcanvasToggle;
    module.dismissOpenOffcanvas = dismissOpenOffcanvas;
    module.openOffcanvas = openOffcanvas;
    module.dismissOffcanvas = dismissOffcanvas;
    module.enableDebounce = enableDebounce;
    module.switchLoggingMode = switchLoggingMode;

    return module;
}));
