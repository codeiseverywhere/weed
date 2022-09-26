/*global define, window, document, Promise*/
(function (root, factory) {
    "use strict";
    if (typeof define === 'function' && define.amd) {
        define("VideoPlayer", ["jquery", "Behaviors"], factory);
    } else {
        root.VideoPlayer = factory(root.jQuery, root.Behaviors);
    }
}(this, function ($, Behaviors) {
    "use strict";

    var module = {};

    function VideoPlayer(elem) {
        Behaviors.init(VideoPlayer, this, arguments);

        this.$elem = $(elem);
        
        if (this.ready) {
            this.ready().then(this.locate_children.bind(this));
        } else {
            this.locate_children();
        }
    }

    Behaviors.inherit(VideoPlayer, Behaviors.Behavior);

    /* Returns a promise which resolves when the player is ready to accept
     * other API calls.
     *
     * Calling those other API calls outside of a then() block from the promise
     * returned by this function is a good way to have a bad time.
     *
     * By default, the video player is always ready.
     */
    VideoPlayer.prototype.ready = function () {
        return new Promise(function (resolve, reject) {
            resolve();
        });
    };

    //No QUERY is defined for the base VideoPlayer class as it is not intended
    //to be locatable. Derived classes should locate their VideoPlayer subclass
    //once it's attendant APIs have been loaded.
    //VideoPlayer.QUERY = "";

    VideoPlayer.prototype.locate_children = function () {
        var $parent_modal;
        
        this.playpause = VideoPlayer_playpause.find_markup(this.$elem, this);
        this.scrubbers = VideoPlayer_scrubber.find_markup(this.$elem, this);
        this.mute_btns = VideoPlayer_mute.find_markup(this.$elem, this);
        
        //This is an example of how to locate upwards
        $parent_modal = this.$elem.parents().filter(VideoPlayer_offcanvas.QUERY);
        
        if ($parent_modal.length > 0) {
            this.modal = VideoPlayer_offcanvas.locate($parent_modal[0], this);
        }
        
        //Now see if we're supposed to autoplay...
        if (this.$elem.data("videoplayer-autoplay") !== undefined) {
            this.play();

            if (this.$elem.data("videoplayer-loop") !== undefined) {
                this.add_statechange_listener(this.loopcheck.bind(this));
            }
        }
    };

    VideoPlayer.prototype.loopcheck = function () {
        Promise.all([this.is_paused(), this.get_current_time(), this.get_duration()]).then(function (values) {
            var is_paused = values[0];
            var current_time = values[1];
            var duration = values[2];

            if (is_paused && current_time === duration) {
                this.seek(0);
                this.play();
            }
        }.bind(this));
    };

    /* Determine if the video player is active.
     *
     * Most keyboard events only process on the active video's controls, not
     * other videos. This ensures that you can have multiple VideoPlayers
     * running without them all being controlled by the same limited set of
     * keyboard shortcuts.
     *
     * A video player is active if any of the following apply:
     *
     *  - The video is marked primary with [data-videoplayer-primary].
     *  - The video is currently playing.
     *  - The VideoPlayer element or one of it's children has keyboard focus.
     * 
     * This function returns a promise which resolves to the return value.
     */
    VideoPlayer.prototype.is_active = function () {
        return this.is_paused(function (is_paused) {
            if (this.$elem.data("videoplayer-primary") !== undefined) {
                return true;
            }

            if (!is_paused) {
                return true;
            }

            if (this.$elem.find(":focus").length > 0) {
                return true;
            }

            return false;
        }.bind(this));
    };

    /* Serves as a play/pause button for a connected VideoPlayer.
     */
    function VideoPlayer_playpause(elem, parent) {
        var that = this;

        Behaviors.init(VideoPlayer_playpause, that, arguments);

        that.parent = parent;

        that.parent.ready().then(function () {
            that.parent.add_statechange_listener(that.on_statechange.bind(that));
            that.$elem.on("click touchend", that.on_play_intent.bind(that));

            that.update_css_classes();
        });
    }

    Behaviors.inherit(VideoPlayer_playpause, Behaviors.Behavior);

    VideoPlayer_playpause.QUERY = "[data-videoplayer-playpause]";

    VideoPlayer_playpause.prototype.update_css_classes = function () {
        this.parent.is_paused().then(function (is_paused) {
            if (is_paused) {
                this.$elem.addClass("is-VideoPlayer--paused");
                this.$elem.removeClass("is-VideoPlayer--playing");
            } else {
                this.$elem.removeClass("is-VideoPlayer--paused");
                this.$elem.addClass("is-VideoPlayer--playing");
            }
        }.bind(this));
    };

    VideoPlayer_playpause.prototype.toggle_playback = function () {
        this.parent.is_paused().then(function (is_paused) {
            if (is_paused) {
                this.parent.play();
            } else {
                this.parent.pause();
            }
        }.bind(this));
    };

    VideoPlayer_playpause.prototype.on_statechange = function () {
        this.update_css_classes();
    };

    VideoPlayer_playpause.prototype.on_play_intent = function () {
        this.toggle_playback();
    };

    /* Allows a video modal to be started and stopped as the modal is opened
     * and closed.
     * 
     * Place this on the Offcanvas element that gets dismissed and/or opened.
     */
    function VideoPlayer_offcanvas(elem, parent) {
        var that = this;

        Behaviors.init(VideoPlayer_offcanvas, that, arguments);

        that.parent = parent;

        that.$elem.on("offcanvas-open", that.on_open_intent.bind(that));
        that.$elem.on("offcanvas-dismiss", that.on_dismiss_intent.bind(that));
    }

    Behaviors.inherit(VideoPlayer_offcanvas, Behaviors.Behavior);

    VideoPlayer_offcanvas.QUERY = "[data-videoplayer-offcanvas]";

    VideoPlayer_offcanvas.prototype.on_open_intent = function () {
        var that = this;

        that.parent.is_paused().then(function (is_paused) {
            if (is_paused) {
                that.parent.play();
            }
        });
    };

    VideoPlayer_offcanvas.prototype.on_dismiss_intent = function () {
        var that = this;

        that.parent.is_paused().then(function (is_paused) {
            if (!is_paused) {
                that.parent.pause();
            }
        });
    };

    /* Serves as a scrub bar for a connected VideoPlayer.
     *
     * A Scrubber contains additional elements inside of it that do not have an
     * associated behavior:
     *
     *  - [data-videoplayer-scrubberfill]: The filled range of the scrubber.
     *  - [data-videoplayer-scrubberknob]: A knob which indicates the current
     *     scrubber point.
     */
    function VideoPlayer_scrubber(elem, parent) {
        var err, that = this;

        Behaviors.init(VideoPlayer_scrubber, that, arguments);

        that.parent = parent;

        //EVENT STATE VARIABLES
        that.is_dragging = false;
        that.in_debounce = false;

        //OPTIONAL COMPONENTS
        that.$scrubfill = that.$elem.find("[data-videoplayer-scrubberfill]");
        that.$scrubknob = that.$elem.find("[data-videoplayer-scrubberknob]");

        that.parent.ready().then(function () {
            //EVENT HANDLERS
            that.$elem.on("mousedown touchstart", that.on_dragstart_intent.bind(that));
            that.$elem.on("mousemove touchmove", that.on_drag_intent.bind(that));
            $(document).on("mouseup touchend touchcancel", that.on_dragend_intent.bind(that));
            $(document).on("keydown", that.on_keyboard_nav.bind(that));

            err = that.parent.add_timeupdate_listener(that.on_timeupdate.bind(that));
            if (err === false) {
                window.setInterval(that.on_timeupdate.bind(that), 1000);
            }
        });

        that.update_scrubber();
    }

    Behaviors.inherit(VideoPlayer_scrubber, Behaviors.Behavior);

    VideoPlayer_scrubber.QUERY = "[data-videoplayer-scrubber]";

    VideoPlayer_scrubber.prototype.css_percent = function (value) {
        return (value * 100) + "%";
    };

    /* This defines the dynamic CSS properties that are applied to scrubber
     * elements.
     *
     * Specifically, fills get a width equal to the current play percentage;
     * knobs get a left position equal to the current play percentage.
     *
     * This assumes knobs and fills get positioned relative to the scrubber.
     */
    VideoPlayer_scrubber.prototype.update_scrubber = function () {
        var that = this, currentTime, ratio;
        
        that.parent.ready().then(function () {
            return that.parent.get_current_time();
        }.bind(this)).then(function (newCurrentTime) {
            currentTime = newCurrentTime;
            return that.parent.get_duration();
        }.bind(this)).then(function (duration) {
            ratio = 0;

            if (!isFinite(duration)) {
                //Livestreams always show as complete.
                ratio = 1;
            } else if (!isNaN(duration)) {
                ratio = currentTime / duration;
            }

            that.$scrubfill.css("width", that.css_percent(ratio));
            that.$scrubknob.css("left", that.css_percent(ratio));
        });
    };

    /* Given an X coordinate, calculate the corresponding video seek time and
     * return it.
     *
     * Input is in page co-ordinates. Input is scaled to output based on the
     * CSS width and position of the scrubber. Output is bounded within the
     * closed range [0, 1].
     * 
     * Returns a promise with the correct seek time.
     */
    VideoPlayer_scrubber.prototype.mouse_to_ctime = function (page_x) {
        return this.parent.get_duration().then(function (duration) {
            return (page_x - this.$elem.offset().left) / this.$elem.width() * duration;
        }.bind(this));
    };

    /* Seek the parent player, but only if the proposed new time is valid.
     */
    VideoPlayer_scrubber.prototype.seek_if_valid = function (newTime, isFinal) {
        if (isNaN(newTime) || !isFinite(newTime)) {
            return;
        }

        this.parent.seek(newTime, isFinal);
    };

    // Drag event filtering

    /* Start a drag operation; configuring the event filtering machinery to
     * only recognize the click or touch that started the event chain.
     */
    VideoPlayer_scrubber.prototype.start_drag = function (evt) {
        this.is_dragging = true;

        if (evt.changedTouches !== undefined && evt.changedTouches.length > 0) {
            this.drag_touch_id = evt.changedTouches[0].identifier;
            return evt.changedTouches[0].pageX;
        } else {
            this.drag_touch_id = undefined;
            return evt.pageX;
        }
    };

    /* Retrieves the Page X coordinate from an event, ensuring that the correct
     * finger is tracked across the entire event chain.
     *
     * Events will be ignored, and FALSE returned, if the event type that
     * started the drag does not match the given event; or, if it's a touch
     * event type, it will be ignored if there is no touch matching the current
     * one.
     */
    VideoPlayer_scrubber.prototype.validate_drag = function (evt) {
        var i;

        if (this.is_dragging) {
            if (this.drag_touch_id !== undefined) {
                if (evt.changedTouches !== undefined) {
                    for (i = 0; i < evt.changedTouches.length; i += 1) {
                        if (evt.changedTouches[i].identifier === this.drag_touch_id) {
                            return evt.changedTouches[i].pageX;
                        }
                    }
                }
            } else {
                if (evt.changedTouches === undefined) {
                    return evt.pageX;
                }
            }
        }

        return false;
    };

    /* Retrieves the Page X coordinate from an event and turns off further drag
     * processing.
     *
     * For the same reasons as validate_drag, non-matching events will not
     * cancel drag processing. This function returns FALSE if this event was
     * ignored.
     */
    VideoPlayer_scrubber.prototype.end_drag = function (evt) {
        var px = this.validate_drag(evt);
        if (px === false) {
            return px;
        }

        this.is_dragging = false;
        this.drag_touch_id = undefined;

        return px;
    };

    /* Process a drag event given the incoming Page X.
     *
     * If FALSE is given, indicating an event filtered by validate_drag, this
     * does nothing.
     */
    VideoPlayer_scrubber.prototype.handle_drag = function (pageX, final) {
        var newtime;

        if (pageX === false) {
            return;
        }

        return this.mouse_to_ctime(pageX).then(function (newtime) {
            this.seek_if_valid(newtime, final);
            this.update_scrubber();
        }.bind(this));
    };

    // Event handlers

    VideoPlayer_scrubber.prototype.on_timeupdate = function () {
        this.update_scrubber();
    };

    VideoPlayer_scrubber.prototype.on_dragstart_intent = function (evt) {
        this.handle_drag(this.start_drag(evt), false);
    };

    VideoPlayer_scrubber.prototype.on_drag_intent = function (evt) {
        this.handle_drag(this.validate_drag(evt), false);
    };

    VideoPlayer_scrubber.prototype.on_dragend_intent = function (evt) {
        this.handle_drag(this.end_drag(evt), true);
    };

    VideoPlayer_scrubber.prototype.on_keyboard_nav = function (evt) {
        var currentTime;
        
        this.parent.ready().then(function () {
            return this.parent.get_current_time();
        }.bind(this)).then(function (newCurrentTime) {
            currentTime = newCurrentTime;
            return this.parent.is_active();
        }.bind(this)).then(function (is_active) {
            if (!is_active) {
                return;
            }
            
            if (evt.keyCode === 37) { //LEFT
                evt.preventDefault();
                this.parent.seek(currentTime - 1.0);
                this.update_scrubber();
            } else if (evt.keyCode === 39) { // RIGHT
                evt.preventDefault();
                this.parent.seek(currentTime + 1.0);
                this.update_scrubber();
            }
        });
    };

    /* Serves as a play/pause button for a connected VideoPlayer.
     */
    function VideoPlayer_mute(elem, parent) {
        var that = this;
        
        Behaviors.init(VideoPlayer_mute, that, arguments);

        that.parent = parent;

        that.parent.ready().then(function () {
            that.$elem.on("click touchend", that.on_mute_intent.bind(that));

            that.update_css_classes();
        });
    }

    Behaviors.inherit(VideoPlayer_mute, Behaviors.Behavior);

    VideoPlayer_mute.QUERY = "[data-videoplayer-mute]";

    VideoPlayer_mute.prototype.update_css_classes = function () {
        this.parent.is_muted().then(function (is_muted) {
            if (is_muted) {
                this.$elem.addClass("is-VideoPlayer--muted");
                this.$elem.removeClass("is-VideoPlayer--audible");
            } else {
                this.$elem.removeClass("is-VideoPlayer--muted");
                this.$elem.addClass("is-VideoPlayer--audible");
            }
        }.bind(this));
    };

    VideoPlayer_mute.prototype.toggle_mute = function () {
        this.parent.is_muted().then(function (is_muted) {
            if (is_muted) {
                this.parent.unmute();
            } else {
                this.parent.mute();
            }
        }.bind(this));
    };

    VideoPlayer_mute.prototype.on_mute_intent = function () {
        this.toggle_mute();
        this.update_css_classes();
    };

    // Player API adaptations


    /* Thin implementation for a VideoPlayer that consumes an HTML5 video
     * directly. Also provides a good demonstration that the VideoPlayer APIs
     * are a very thin wrapper over HTMLMediaElement.
     */
    function VideoPlayer__html5(elem) {
        this.$video = $(elem).find("video");

        Behaviors.init(VideoPlayer__html5, this, arguments);
    }

    Behaviors.inherit(VideoPlayer__html5, VideoPlayer);

    VideoPlayer__html5.QUERY = "[data-videoplayer='html5']";

    /* Plays the video, if loaded.
     */
    VideoPlayer__html5.prototype.play = function () {
        this.$video[0].play();
    };

    /* Pauses the video.
     */
    VideoPlayer__html5.prototype.pause = function () {
        this.$video[0].pause();
    };

    /* Mute the video
     */
    VideoPlayer__html5.prototype.mute = function () {
        this.$video[0].muted = true;
    };

    /* Unmute the video
     */
    VideoPlayer__html5.prototype.unmute = function () {
        this.$video[0].muted = false;
    };

    /* Returns the current player position.
     * 
     * This function returns a promise which resolves to the current time.
     */
    VideoPlayer__html5.prototype.get_current_time = function () {
        return Promise.resolve(this.$video[0].currentTime);
    };

    /* Seek the video to the number of seconds indicated in time.
     */
    VideoPlayer__html5.prototype.seek = function (time) {
        this.$video[0].currentTime = time;
    };

    /* Check the video's duration.
     *
     * Returns the media's length in seconds.
     *
     * NaN is returned if the duration is unknown (check with isNaN).
     * Infinity is returned if this is a streaming video.
     * 
     * This function returns a promise which resolves to the aformentioned
     * return value.
     */
    VideoPlayer__html5.prototype.get_duration = function () {
        return Promise.resolve(this.$video[0].duration);
    };

    /* Check if the video is paused.
     * 
     * This function returns a promise which resolves to the aformentioned
     * return value.
     */
    VideoPlayer__html5.prototype.is_paused = function () {
        return Promise.resolve(this.$video[0].paused);
    };

    /* Check if the video is muted.
     * 
     * This function returns a promise which resolves to the aformentioned
     * return value.
     */
    VideoPlayer__html5.prototype.is_muted = function () {
        return Promise.resolve(this.$video[0].muted);
    };

    /* Check the volume of the video.
     * 
     * This function returns a promise which resolves to the aformentioned
     * return value.
     */
    VideoPlayer__html5.prototype.get_volume = function () {
        return Promise.resolve(this.$video[0].volume);
    };

    /* Register an event handler for changes to the video's playback state.
     *
     * This corresponds exactly to matching the playing, play, and pause events
     * and other video service APIs should ensure their event handler triggers
     * on similar conditions.
     */
    VideoPlayer__html5.prototype.add_statechange_listener = function (listen) {
        this.$video.on("playing play pause", listen);
    };

    /* Register an event handler for changes to the video's playback time.
     *
     * This corresponds to the timeupdate event on HTMLMediaElement. This event
     * is permitted not to register an event if it returns FALSE, indicating
     * that timeupdates are not provided by this player type.
     */
    VideoPlayer__html5.prototype.add_timeupdate_listener = function (listen) {
        this.$video.on("timeupdate", listen);
    };

    /* This VideoPlayer consumes a YouTube iframe using the YouTube API.
     * See https://developers.google.com/youtube/iframe_api_reference
     */
    function VideoPlayer__youtube(elem) {
        var that = this;

        Behaviors.init(VideoPlayer__youtube, that, arguments);

        this.$iframe = $(elem).find("iframe");
        this.id = this.$iframe.attr("id");
        if (this.id === undefined) {
            //Randomly generate an ID if one was not provided.
            this.id = "VideoPlayer-random_id--" + Math.random() * 1024 * 1024;
            this.$iframe.attr("id", this.id);
        }

        this.player_fully_loaded = false;
    }

    Behaviors.inherit(VideoPlayer__youtube, VideoPlayer);

    VideoPlayer__youtube.QUERY = "[data-videoplayer='youtube']";

    /* Install the YouTube API, if not already installed.
     *
     * This is an asynchronous operation, so we return a Promise that resolves
     * when YouTube's API is available. Invocation works like so:
     *
     * VideoPlayer__youtube.api().then(function () {
     *     //do stuff...
     * })
     */
    VideoPlayer__youtube.api = function () {
        if (VideoPlayer__youtube.install_promise === undefined) {
            VideoPlayer__youtube.install_promise = new Promise(function (resolve, reject) {
                var tag, firstScriptTag;

                tag = document.createElement("script");
                tag.src = "https://www.youtube.com/iframe_api";
                firstScriptTag = document.getElementsByTagName('script')[0];
                firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

                window.onYouTubeIframeAPIReady = VideoPlayer__youtube.api_ready_handler(resolve, reject);
            });
        }

        return VideoPlayer__youtube.install_promise;
    };

    /* Creates the function that gets called when the YouTube API is ready.
     */
    VideoPlayer__youtube.api_ready_handler = function (resolve, reject) {
        return function () {
            resolve();
        };
    };

    /* Returns a promise which resolves when the player is ready to accept
     * other API calls.
     *
     * Calling those other API calls outside of a then() block from the promise
     * returned by this function is a good way to have a bad time.
     */
    VideoPlayer__youtube.prototype.ready = function () {
        var that = this;
        
        if (that.ready_promise === undefined) {
            that.ready_promise = VideoPlayer__youtube.api().then(function () {
                that.player = new window.YT.Player(that.id, {
                    "playerVars": {
                        "enablejsapi": true
                    }
                });

                return new Promise(function (resolve, reject) {
                    if (that.player_fully_loaded) {
                        resolve();
                    } else {
                        that.player.addEventListener("onReady", function () {
                            that.player_fully_loaded = true;
                            resolve();
                        });
                    }
                });
            });
        }
        
        return that.ready_promise;
    };

    /* Plays the video, if loaded.
     */
    VideoPlayer__youtube.prototype.play = function () {
        this.ready().then(function () {
            this.player.playVideo();
        }.bind(this));
    };

    /* Pauses the video.
     */
    VideoPlayer__youtube.prototype.pause = function () {
        this.ready().then(function () {
            this.player.pauseVideo();
        }.bind(this));
    };

    /* Mute the video
     */
    VideoPlayer__youtube.prototype.mute = function () {
        this.ready().then(function () {
            this.player.mute();
        }.bind(this));
    };

    /* Unmute the video
     */
    VideoPlayer__youtube.prototype.unmute = function () {
        this.ready().then(function () {
            this.player.unMute();
        }.bind(this));
    };

    /* Returns the current player position.
     * 
     * This function returns a promise which resolves to the current time.
     */
    VideoPlayer__youtube.prototype.get_current_time = function () {
        return this.ready().then(function () {
            return this.player.getCurrentTime();
        }.bind(this));
    };

    /* Seek the video to the number of seconds indicated in time.
     *
     * The seek_commit parameter should be FALSE if and only if the seek
     * resulted from a mousedrag and you expect to get more seek operations.
     */
    VideoPlayer__youtube.prototype.seek = function (time, seek_commit) {
        return this.ready().then(function () {
            return this.player.seekTo(time, seek_commit);
        }.bind(this));
    };

    /* Check the video's duration.
     *
     * Returns the media's length in seconds.
     *
     * NaN is returned if the duration is unknown (check with isNaN).
     * Infinity is returned if this is a streaming video.
     *
     * SPEC VIOLATION: YouTube does not indicate if the player is playing a
     * live event, so live-streaming players will have incorrect duration info.
     * 
     * This function returns a promise which resolves to the aformentioned
     * return value.
     */
    VideoPlayer__youtube.prototype.get_duration = function () {
        return this.ready().then(function () {
            var duration = this.player.getDuration();

            if (duration === 0) {
                return NaN;
            }

            return duration;
        }.bind(this));
    };

    /* Check if the video is paused.
     *
     * TODO: We naively interpret YouTube's player state, does player state 2
     * correspond to HTMLMediaElement/VideoPlayer__html5's .paused attribute?
     * Or are there other player states that count as paused by HTML5?
     * 
     * This function returns a promise which resolves to the aformentioned
     * return value.
     */
    VideoPlayer__youtube.prototype.is_paused = function () {
        return this.ready().then(function () {
            var ps = this.player.getPlayerState();
            return ps === 2 || ps === -1 || ps === 5;
        }.bind(this));
    };

    /* Check if the video is muted.
     * 
     * This function returns a promise which resolves to the aformentioned
     * return value.
     */
    VideoPlayer__youtube.prototype.is_muted = function () {
        return this.ready().then(function () {
            return this.player.isMuted();
        }.bind(this));
    };

    /* Check the volume of the video.
     *
     * YouTube works in percentage units for some reason.
     * 
     * This function returns a promise which resolves to the aformentioned
     * return value.
     */
    VideoPlayer__youtube.prototype.get_volume = function () {
        return this.ready().then(function () {
            return this.player.getVolume() / 100;
        }.bind(this));
    };

    /* Register an event handler for changes to the video's playback state.
     *
     * This corresponds exactly to matching the playing, play, and pause events
     * and other video service APIs should ensure their event handler triggers
     * on similar conditions.
     */
    VideoPlayer__youtube.prototype.add_statechange_listener = function (listen) {
        this.ready().then(function () {
            this.player.addEventListener("onStateChange", listen);
        }.bind(this));
    };

    /* Register an event handler for changes to the video's playback time.
     *
     * YouTube doesn't have this event type for some reason.
     */
    VideoPlayer__youtube.prototype.add_timeupdate_listener = function (listen) {
        return false;
    };

    VideoPlayer__youtube.content_ready = function ($context) {
        var Class = this;

        if ($context.find(Class.QUERY).length > 0) {
            Class.api().then(function () {
                Class.find_markup($context);
            });
        }
    };
    
    /* This VideoPlayer consumes a Vimeo iframe using their player controller.
     * See https://github.com/vimeo/player.js
     */
    function VideoPlayer__vimeo(elem) {
        var that = this;

        Behaviors.init(VideoPlayer__vimeo, that, arguments);
        
        this.ready();
    }

    VideoPlayer__vimeo.QUERY = "[data-videoplayer='vimeo']";
    
    Behaviors.inherit(VideoPlayer__vimeo, VideoPlayer);
    
    /* Install the Vimeo API, if not already installed.
     *
     * This is an asynchronous operation, so we return a Promise that resolves
     * when Vimeo's API is available. Invocation works like so:
     *
     * VideoPlayer__vimeo.api().then(function () {
     *     //do stuff...
     * })
     */
    VideoPlayer__vimeo.api = function () {
        if (VideoPlayer__vimeo.install_promise === undefined) {
            VideoPlayer__vimeo.install_promise = new Promise(function (resolve, reject) {
                var tag, firstScriptTag;

                tag = document.createElement("script");
                tag.src = "https://player.vimeo.com/api/player.js";
                tag.onload = VideoPlayer__vimeo.api_ready_handler(resolve, reject);
                tag.async = true;
                firstScriptTag = document.getElementsByTagName('script')[0];
                firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
            });
        }

        return VideoPlayer__vimeo.install_promise;
    };

    /* Creates the function that gets called when the Vimeo API is ready.
     */
    VideoPlayer__vimeo.api_ready_handler = function (resolve, reject) {
        function wait_for_vimeo() {
            if (window.Vimeo !== undefined) {
                resolve();
            } else {
                window.setTimeout(wait_for_vimeo, 10);
            }
        }
        
        return wait_for_vimeo;
    };
    
    /* Returns a promise which resolves when the player is ready to accept
     * other API calls.
     *
     * Calling those other API calls outside of a then() block from the promise
     * returned by this function is a good way to have a bad time.
     */
    VideoPlayer__vimeo.prototype.ready = function () {
        var that = this;
        
        if (this.ready_promise === undefined) {
            this.ready_promise = VideoPlayer__vimeo.api().then(function () {
                this.player = new window.Vimeo.Player(this.$elem);
            }.bind(this));
        }
        
        return this.ready_promise;
    };

    /* Plays the video, if loaded.
     */
    VideoPlayer__vimeo.prototype.play = function () {
        return this.ready().then(function () {
            this.player.play();
        }.bind(this));
    };

    /* Pauses the video.
     */
    VideoPlayer__vimeo.prototype.pause = function () {
        return this.ready().then(function () {
            this.player.pause();
        }.bind(this));
    };

    /* Mute the video
     */
    VideoPlayer__vimeo.prototype.mute = function () {
        return this.ready().then(function () {
            return this.player.getVolume();
        }.bind(this)).then(function (volume) {
            this.preMuteVolume = volume;
            this.player.setVolume(0);
        }.bind(this));
    };

    /* Unmute the video
     */
    VideoPlayer__vimeo.prototype.unmute = function () {
        return this.ready().then(function () {
            return this.player.setVolume(this.preMuteVolume || 1.0);
        }.bind(this));
    };

    /* Returns the current player position.
     * 
     * This function returns a promise which resolves to the current time.
     */
    VideoPlayer__vimeo.prototype.get_current_time = function () {
        return this.ready().then(function () {
            return this.player.getCurrentTime();
        }.bind(this));
    };

    /* Seek the video to the number of seconds indicated in time.
     *
     * The seek_commit parameter should be FALSE if and only if the seek
     * resulted from a mousedrag and you expect to get more seek operations.
     * 
     * As a unique quirk of the Vimeo API, the returned promise will resolve
     * to the actual seek time adopted by the player.
     */
    VideoPlayer__vimeo.prototype.seek = function (time, seek_commit) {
        return this.ready().then(function () {
            return this.player.setCurrentTime(time);
        }.bind(this));
    };

    /* Check the video's duration.
     *
     * Returns the media's length in seconds.
     *
     * NaN is returned if the duration is unknown (check with isNaN).
     * Infinity is returned if this is a streaming video.
     * 
     * This function returns a promise which resolves to the aformentioned
     * return value.
     */
    VideoPlayer__vimeo.prototype.get_duration = function () {
        return this.ready().then(function () {
            return this.player.getDuration();
        }.bind(this));
    };

    /* Check if the video is paused.
     * 
     * This function returns a promise which resolves to the aformentioned
     * return value.
     */
    VideoPlayer__vimeo.prototype.is_paused = function () {
        return this.ready().then(function () {
            return this.player.getPaused();
        }.bind(this));
    };

    /* Check if the video is muted.
     * 
     * This function returns a promise which resolves to the aformentioned
     * return value.
     */
    VideoPlayer__vimeo.prototype.is_muted = function () {
        return this.ready().then(function () {
            return this.get_volume();
        }.bind(this)).then(function (volume) {
            return volume === 0.0;
        }.bind(this));
    };

    /* Check the volume of the video.
     * 
     * This function returns a promise which resolves to the aformentioned
     * return value.
     */
    VideoPlayer__vimeo.prototype.get_volume = function () {
        return this.ready().then(function () {
            return this.player.getVolume();
        }.bind(this));
    };

    /* Register an event handler for changes to the video's playback state.
     *
     * This corresponds exactly to matching the playing, play, and pause events
     * and other video service APIs should ensure their event handler triggers
     * on similar conditions.
     */
    VideoPlayer__vimeo.prototype.add_statechange_listener = function (listen) {
        return this.ready().then(function () {
            return this.player.on("play", listen);
            return this.player.on("pause", listen);
            return this.player.on("ended", listen);
        }.bind(this));
    };

    /* Register an event handler for changes to the video's playback time.
     */
    VideoPlayer__vimeo.prototype.add_timeupdate_listener = function (listen) {
        return this.ready().then(function () {
            return this.player.on("timeupdate", listen);
        }.bind(this));
    };
    
    VideoPlayer__vimeo.content_ready = function ($context) {
        var Class = this;

        if ($context.find(Class.QUERY).length > 0) {
            Class.api().then(function () {
                Class.find_markup($context);
            });
        }
    };

    Behaviors.register_behavior(VideoPlayer__html5);
    Behaviors.register_behavior(VideoPlayer__youtube);
    Behaviors.register_behavior(VideoPlayer__vimeo);
    
    module.VideoPlayer = VideoPlayer;
    module.VideoPlayer_playpause = VideoPlayer_playpause;
    module.VideoPlayer_scrubber = VideoPlayer_scrubber;
    module.VideoPlayer_mute = VideoPlayer_mute;
    module.VideoPlayer_offcanvas = VideoPlayer_offcanvas;
    module.VideoPlayer__html5 = VideoPlayer__html5;
    module.VideoPlayer__youtube = VideoPlayer__youtube;
    module.VideoPlayer__vimeo = VideoPlayer__vimeo;
    return module;
}));
