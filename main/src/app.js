"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var express = require("express");
var cors = require("cors");
var typeorm_1 = require("typeorm");
require("reflect-metadata");
var amqp = require("amqplib/callback_api");
var product_1 = require("./entity/product");
(0, typeorm_1.createConnection)().then(function (db) {
    var productRepository = db.getMongoRepository(product_1.Product);
    amqp.connect('amqps://uvevpcnn:l0XW3Rqe5b6Tz2avj3tqxZSDB_sCRTRI@toad.rmq.cloudamqp.com/uvevpcnn', function (err, connection) {
        if (err)
            throw err;
        connection.createChannel(function (error, channel) {
            if (error)
                throw error;
            channel.assertQueue('productCreated', { durable: false });
            var app = express();
            app.use(cors({
                origin: ['http://localhost:3000', 'http://localhost:8000', 'http://localhost:4200']
            }));
            app.use(express.json());
            channel.consume('productCreated', function (message) { return __awaiter(void 0, void 0, void 0, function () {
                var receivedProducts, eventProducts, product, savedProduct;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            receivedProducts = message.content.toString();
                            eventProducts = JSON.parse(receivedProducts);
                            product = new product_1.Product();
                            Object.assign(product, __assign(__assign({}, eventProducts), { admin_product_id: eventProducts.id }));
                            return [4 /*yield*/, productRepository.save(product)];
                        case 1:
                            savedProduct = _a.sent();
                            console.log(savedProduct);
                            channel.ack(message);
                            return [2 /*return*/];
                    }
                });
            }); }, { noAck: false });
            app.listen(8001, function () {
                console.log("Server is running on port 8001");
            });
            process.on('beforeExit', function () {
                console.log('closing the connection');
                connection.close();
            });
        });
    });
});
