var path = require("path");
var webpack = require("webpack");


function makeStandardConfig(projectDir, appEntry, appOutput) {
	var appOutput = appOutput || "app.js";
	var outputPath = process.env.NODE_ENV === "production" ? "./dist" : "./build";
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
			app: [
				// "webpack-dev-server/client",
				// "webpack/hot/only-dev-server",
				appEntry
			],
			libs: [] // will be filled by addLib()
		},

		output: {
			path: outputPath,
			filename: appOutput
		},

		module: {
			loaders: [
				{test: /\.js$/, exclude: /(node_modules|bower_components)/, loaders: [/*"react-hot",*/ "babel"]},
				{test: /\.jsx$/, loaders: [/*"react-hot",*/ "babel"]},
				{test: /\.css$/, loader: "style!css"},
				{test: /\.(woff|woff2)$/, loader: "url?&mimetype=application/font-woff"},
				{test: /glyphicons(.*)\.(ttf|eot|svg)$/, loader: "file?name=fonts/[name].[ext]"}
			],
			noParse: [] // will be filled by addLib()
		},

		resolve: {
			extensions: ["", ".js", ".jsx"],
			modulesDirectories: ["node_modules"],
			alias: {} // will be filled by addLib()
		},

		plugins: [
			new webpack.optimize.CommonsChunkPlugin("libs", "libs.js")
		]
	};
}

module.exports = {
	makeStandardConfig: makeStandardConfig
};
