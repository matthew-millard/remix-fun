import { flatRoutes } from 'remix-flat-routes';

/** @type {import('@remix-run/dev').AppConfig} */
export default {
	ignoredRouteFiles: ['**/.*'],
	routes: async defineRoutes => {
		return flatRoutes('routes', defineRoutes, {
			ignoredRouteFiles: ['.*', '**/*.css', '**/*.test.{js,jsx,ts,tsx}', '**/__*.*'],
		});
	},
	// appDirectory: "app",
	// assetsBuildDirectory: "public/build",
	// publicPath: "/build/",
	// serverBuildPath: "build/index.js",
};
