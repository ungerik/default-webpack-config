var path = require("path");
var webpack = require("webpack");


function makeStandardConfig(projectDir, appEntry, appOutput) {
	var appOutput = appOutput || "app.js";
	// var outputPath = process.env.NODE_ENV === "production" ? "./dist" : "./build";
	var outputPath = process.env.NODE_ENV === "production" ? path.join(projectDir, "dist") : path.join(projectDir, "build");
	console.log("Webpack", path.join(projectDir, outputPath));

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

		// devtool: "eval",
		devtool: "inline-source-map",

		entry: {
			app: [appEntry],
			libs: [] // will be filled by addLib()
		},

		output: {
			path: outputPath,
			publicPath: "/",
			filename: appOutput
		},

		module: {
			loaders: [
				{test: /\.js$/, exclude: /(node_modules|bower_components)/, loader: "babel"},
				{test: /\.jsx$/, loader: "babel"},
				{test: /\.css$/, loader: "style!css"},
				{test: /\.(woff|woff2)$/, loader: "url?&mimetype=application/font-woff"},
				{test: /glyphicons(.*)\.(ttf|eot|svg)$/, loader: "file?name=fonts/[name].[ext]"}
			],
			noParse: [] // will be filled by addLib()
		},

		resolve: {
			root: [projectDir],
			extensions: ["", ".js", ".jsx"],
			modulesDirectories: ["node_modules", "bower_components"],
			alias: {} // will be filled by addLib()
		},

		plugins: [
			new webpack.optimize.CommonsChunkPlugin("libs", "libs.js"),
			new webpack.optimize.OccurenceOrderPlugin()
		]
	};
}


function makeStandardHotConfig(projectDir, appEntry, appOutput) {
	var config = makeStandardConfig(projectDir, appEntry, appOutput);
	// var hotMiddlewareScript = "webpack-hot-middleware/client?reload=true&timeout=2000";
	var hotMiddlewareScript = "webpack-hot-middleware/client?reload=true";
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


	app.listen(8080, "0.0.0.0", function(err) {
		if (err) {
			console.error(err);
			return;
		}

		console.log("Listening at http://0.0.0.0:8080");
	});
}

module.exports = {
	makeStandardConfig: makeStandardConfig,
	makeStandardHotConfig: makeStandardHotConfig,
	runHotDevServer: runHotDevServer
};
