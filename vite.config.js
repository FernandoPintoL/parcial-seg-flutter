"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var plugin_vue_1 = require("@vitejs/plugin-vue");
var autoprefixer_1 = require("autoprefixer");
var laravel_vite_plugin_1 = require("laravel-vite-plugin");
var path_1 = require("path");
var tailwindcss_1 = require("tailwindcss");
var node_path_1 = require("node:path");
var vite_1 = require("vite");
exports.default = (0, vite_1.defineConfig)({
    plugins: [
        (0, laravel_vite_plugin_1.default)({
            input: ['resources/js/app.ts'],
            ssr: 'resources/js/ssr.ts',
            refresh: true,
        }),
        (0, plugin_vue_1.default)({
            template: {
                transformAssetUrls: {
                    base: null,
                    includeAbsolute: false,
                },
            },
        }),
    ],
    resolve: {
        alias: {
            '@': path_1.default.resolve(__dirname, './resources/js'),
            'ziggy-js': (0, node_path_1.resolve)(__dirname, 'vendor/tightenco/ziggy'),
        },
    },
    css: {
        postcss: {
            plugins: [tailwindcss_1.default, autoprefixer_1.default],
        },
    },
    server: {
        cors: true,
        proxy: {
            '/api/scan': {
                target: 'http://192.168.100.21:10000',
                changeOrigin: true,
                secure: false
            }
        }
    },
});
