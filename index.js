/*eslint-env node */
"use strict";

var fs = require("fs");
var path = require("path");
var webpack = require("webpack");


var NODE_ENV_PRODUCTION = process.env.NODE_ENV === "production";


function isDir(path) {
	try {
		return fs.statSync(path).isDirectory();
	}
	catch (e) {
		return false;
	}
}


function makeStandardConfig(projectDir, appEntry, outputPath, options) {
	if (!outputPath) {
		outputPath = NODE_ENV_PRODUCTION ? "dist" : "build";
	}
	outputPath = path.isAbsolute(outputPath) ? outputPath : path.join(projectDir, outputPath);

	options = options || {};
	options.appFilename = options.appFilename || "app.js";
	options.libsFilename = options.libsFilename || "libs.js";

	// https://webpack.github.io/docs/configuration.html#devtool
	options.devtool = options.devtool || NODE_ENV_PRODUCTION ? null : "inline-source-map";

	// https://webpack.github.io/docs/configuration.html#output-publicpath
	options.publicPath = options.publicPath || "/";

	// https://webpack.github.io/docs/configuration.html#resolve-modulesdirectories
	options.modulesDirectories = options.modulesDirectories || ["src", "source", "node_modules", "bower_components"];

	// https://github.com/webpack/docs/wiki/list-of-plugins#environmentplugin
	options.environmentVars = options.environmentVars || ["NODE_ENV"];

	// https://github.com/webpack/docs/wiki/list-of-plugins#uglifyjsplugin
	var uglifyPlugin = NODE_ENV_PRODUCTION ?
		new webpack.optimize.UglifyJsPlugin({compress: {warnings: false}, mangle: false, comments: false})
	:
		new webpack.BannerPlugin("development build");

	// https://github.com/babel/babel-loader/blob/master/README.md
	options.babel = options.babel || {cacheDirectory: path.join(projectDir, "babel-cache")};

	if (options.babel.cacheDirectory && !isDir(options.babel.cacheDirectory)) {
		fs.mkdirSync(options.babel.cacheDirectory);
	}

	console.log("NODE_ENV:", process.env.NODE_ENV);
	console.log("Webpack:", path.join(projectDir, outputPath));

	return {
		addLib: function(name, filename, parse) {
			this.entry.libs.push(name);
			if (filename) {
				filename = path.join(projectDir, filename);
				this.resolve.alias[name] = filename;
				if (!parse) {
					this.module.noParse.push(new RegExp("^" + filename + "$"));
				}
			}
		},

		addLibES6: function(name) {
			this.entry.libs.push(name);
			this.module.loaders.push({test: new RegExp(name + "/(.*)\.js$"), loader: "babel", query: options.babel});
		},

		print: function() {
			console.log(JSON.stringify(this, function(key, value) {
				return (value instanceof RegExp) ? "RegExp(" + value.source + ")" : value;
			}, 4));
		},

		devtool: options.devtool,

		entry: {
			app: [appEntry],
			libs: [] // will be filled by addLib()
		},

		output: {
			path: outputPath,
			publicPath: options.publicPath,
			filename: options.appFilename,
			pathinfo: !NODE_ENV_PRODUCTION,
		},

		module: {
			loaders: [
				{test: /\.js$/, exclude: /(node_modules|bower_components)/, loader: "babel", query: options.babel},
				{test: /\.jsx$/, loader: "babel", query: options.babel},
				{test: /\.css$/, loader: "style!css"},
				{test: /\.svg$/, loader: "svg"},
				{test: /\.(woff|woff2)$/, loader: "url?&mimetype=application/font-woff"},
				{test: /glyphicons(.*)\.(ttf|eot|svg)$/, loader: "file?name=fonts/[name].[ext]"}
			],
			noParse: [] // will be filled by addLib()
		},

		resolve: {
			root: [projectDir],
			extensions: ["", ".js", ".jsx"],
			modulesDirectories: options.modulesDirectories,
			alias: {} // will be filled by addLib()
		},

		plugins: [
			new webpack.NoErrorsPlugin(),
			new webpack.EnvironmentPlugin(options.environmentVars),
			new webpack.optimize.CommonsChunkPlugin("libs", options.libsFilename),
			new webpack.optimize.OccurenceOrderPlugin(true),
			new webpack.optimize.DedupePlugin(),
			uglifyPlugin
		]
	};
}


function makeStandardHotConfig(projectDir, appEntry, outputPath, options) {
	var config = makeStandardConfig(projectDir, appEntry, outputPath, options);
	// var hotMiddlewareScript = "webpack-hot-middleware/client?reload=true&timeout=2000";
	var hotMiddlewareScript = "webpack-hot-middleware/client?reload=true&timeout=10000";
	config.entry.app.push(hotMiddlewareScript);
	config.entry.libs.push(hotMiddlewareScript);
	config.plugins.push(new webpack.HotModuleReplacementPlugin());
	config.plugins.push(new webpack.NoErrorsPlugin());
	return config;
}


function runHotDevServer(webpackConfig, host, port) {
	host = host || "localhost";
	port = port || 8080;

	var express = require("express");
	var morgan = require("morgan");

	var app = express();
	var compiler = webpack(webpackConfig);


	app.use(morgan("dev"));


	app.use(require("webpack-dev-middleware")(compiler, {
		noInfo: true,
		publicPath: webpackConfig.output.publicPath
	}));


	app.use(require("webpack-hot-middleware")(compiler, {
		log: console.log
	}));


	app.use(express.static(webpackConfig.output.path));


	app.get("/", function(req, res) {
		res.sendFile(path.join(webpackConfig.output.path, "index.html"));
	});


	app.listen(port, host, function(err) {
		if (err) {
			console.error(err);
			return;
		}

		console.log("Listening hot at http://" + host + ":" + port);
	});
}


function runDevServer(webpackConfig, host, port) {
	host = host || "localhost";
	port = port || 8080;

	var express = require("express");
	var morgan = require("morgan");

	var app = express();


	app.use(morgan("dev"));


	app.use(express.static(webpackConfig.output.path));


	app.get("/", function(req, res) {
		res.sendFile(path.join(webpackConfig.output.path, "index.html"));
	});


	app.listen(port, host, function(err) {
		if (err) {
			console.error(err);
			return;
		}

		console.log("Listening at http://" + host + ":" + port);
	});
}


module.exports = {
	makeStandardConfig: makeStandardConfig,
	makeStandardHotConfig: makeStandardHotConfig,
	runHotDevServer: runHotDevServer,
	runDevServer: runDevServer
};
