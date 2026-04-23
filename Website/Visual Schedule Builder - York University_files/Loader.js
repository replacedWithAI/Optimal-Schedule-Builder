window.Loader = {
	jss: [],
	to_load: [],
	callback: null,
	loaded: 0,
    pointer: 0,
    version: 0,

	init: function(version, _jss, _callback) {
    this.version = version;
		this.jss = _jss;
		this.callback = _callback;

		this.next();
	},

  next: function() {
        if(this.pointer >= this.jss.length) {
            this.callback();
            return;
        }

        var file = this.jss[this.pointer];
        this.pointer++;
        var script = document.createElement('script');
        script.src = file+"?v="+this.version;
        script.onload = function () {
            window.Loader.next();
        };
        document.getElementsByTagName('head')[0].appendChild(script);
    },

	load: function() {
		for (var i = this.jss.length - 1; i >= 0; i--) {
			var file = this.jss[i];
			var script = document.createElement('script');
			script.src = file;
			script.onload = function () {
			    window.Loader.notifLoaded();
			};

			document.head.appendChild(script);
		}
	},

	notifLoaded: function() {
		this.loaded++;
		if(this.loaded >= this.jss.length) {
			this.callback();
		}
	},

	addJavaScript: function(name) {
		jss.push(name);
	}
};
