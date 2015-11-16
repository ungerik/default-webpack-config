var path = require("path");
var webpack = require("webpack");


function makeStandardConfig(appEntry) {
	var outputPath = process.env.NODE_ENV === "production" ? "./dist" : "./build";
	console.log("Webpack", outputPath);

	return {
		addLib: function(name, filename, parse) {
			this.entry.libs.push(name);
			if (filename) {
				filename = path.join(__dirname, filename);
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
			filename: "app.js"
		},

		module: {
			loaders: [
				{test: /\.jsx?$/, exclude: /(node_modules|bower_components)/, loaders: [/*"react-hot",*/ "babel"]},
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
