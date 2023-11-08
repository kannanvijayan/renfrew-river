"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameClientConnectError = void 0;
const read_map_data_cmd_1 = require("./protocol/commands/read_map_data_cmd");
var GameClientConnectError;
(function (GameClientConnectError) {
    // Failed to create connection.
    GameClientConnectError["CONNECTION_FAILED"] = "connection-failed";
})(GameClientConnectError || (exports.GameClientConnectError = GameClientConnectError = {}));
class GameClient {
    constructor(args) {
        const { url, callbacks } = args;
        this.url_ = url;
        this.callbacks_ = callbacks;
        this.ws_ = new WebSocket(url);
        this.responseAwaiters_ = [];
        this.ws_.addEventListener("open", this.onOpen.bind(this));
        this.ws_.addEventListener("close", this.onClose.bind(this));
        this.ws_.addEventListener("error", e => this.onError("Connection failed", e));
        this.ws_.addEventListener("message", this.onMessage.bind(this));
    }
    disconnect() {
        this.ws_.close();
    }
    getConstants() {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.sendCommand("GetConstants", {});
            if ("Constants" in result) {
                return result.Constants;
            }
            console.error("GetConstants: unexpected response", result);
            throw new Error("GetConstants: unexpected response");
        });
    }
    defaultSettings() {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.sendCommand("DefaultSettings", {});
            if ("DefaultSettings" in result) {
                const settings = result.DefaultSettings.settings;
                const min_world_dims = result.DefaultSettings.min_world_dims;
                const max_world_dims = result.DefaultSettings.max_world_dims;
                return { settings, min_world_dims, max_world_dims };
            }
            console.error("DefaultSettings: unexpected response", result);
            throw new Error("DefaultSettings: unexpected response");
        });
    }
    hasGame() {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.sendCommand("HasGame", {});
            if ("GameExists" in result) {
                return result.GameExists.settings;
            }
            else {
                return false;
            }
        });
    }
    newGame(settings) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.sendCommand("NewGame", { settings });
            if ("Error" in result) {
                throw new Error(result.Error.messages.join(", "));
            }
        });
    }
    readMapData(opts) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.sendCommand("ReadMapData", {
                top_left: opts.topLeft,
                area: opts.area,
                kinds: opts.kinds,
            });
            if ("MapData" in result) {
                const retval = {};
                for (const kind of opts.kinds) {
                    const name = read_map_data_cmd_1.ReadMapDataOutputNameMap[kind];
                    retval[name] = result.MapData[name];
                }
                return retval;
            }
            else {
                throw new Error(result.Error.messages.join(", "));
            }
        });
    }
    miniElevations(opts) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.sendCommand("MiniElevations", {
                mini_dims: opts.miniDims,
            });
            if ("MiniElevations" in result) {
                return result.MiniElevations.elevations;
            }
            else {
                throw new Error(result.Error.messages.join(", "));
            }
        });
    }
    readAnimals() {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.sendCommand("ReadAnimals", {});
            if ("Animals" in result) {
                return result.Animals.animals;
            }
            else {
                throw new Error(result.Error.messages.join(", "));
            }
        });
    }
    takeTurnStep() {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.sendCommand("TakeTurnStep", {});
            if ("TurnTaken" in result) {
                return result.TurnTaken;
            }
            else {
                throw new Error(result.Error.messages.join(", "));
            }
        });
    }
    getCellInfo(coord) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.sendCommand("GetCellInfo", {
                cell_coord: coord,
            });
            if ("CellInfo" in result) {
                return result.CellInfo;
            }
            else {
                throw new Error(result.Error.messages.join(", "));
            }
        });
    }
    getAnimalData(animalId) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.sendCommand("GetAnimalData", {
                animal_id: animalId,
            });
            if ("AnimalData" in result) {
                return result.AnimalData;
            }
            else {
                throw new Error(result.Error.messages.join(", "));
            }
        });
    }
    sendCommand(command, params) {
        return __awaiter(this, void 0, void 0, function* () {
            // Compose the command to send.
            const msgObj = { [command]: params };
            console.debug("GameClient.sendCommand: message", msgObj);
            const msg = JSON.stringify(msgObj);
            // Send the command, but only after the response from the
            // current last command has been received.
            if (this.responseAwaiters_.length > 0) {
                this.responseAwaiters_[this.responseAwaiters_.length - 1].promise.then(() => this.ws_.send(msg));
            }
            else {
                this.ws_.send(msg);
            }
            // Create and push an awaiter for the response.
            let resolve;
            let reject;
            const promise = new Promise((res, rej) => {
                console.debug("GameClient.sendCommand: awaiter created");
                resolve = res;
                reject = rej;
            });
            const awaiter = { command, resolve, reject, promise };
            this.responseAwaiters_.push(awaiter);
            return promise;
        });
    }
    onOpen() {
        console.debug("GameClient.onOpen");
        this.callbacks_.onConnect();
    }
    onClose() {
        var _a, _b;
        console.debug("GameClient.onClose");
        for (const awaiter of this.responseAwaiters_) {
            awaiter.reject("Connection closed");
        }
        this.responseAwaiters_ = [];
        (_b = (_a = this.callbacks_).onClose) === null || _b === void 0 ? void 0 : _b.call(_a);
    }
    onError(msg, err) {
        console.debug("GameClient.onError", err);
        for (const awaiter of this.responseAwaiters_) {
            awaiter.reject(`Connection errored: ${msg}`);
        }
        this.responseAwaiters_ = [];
        this.callbacks_.onError(msg);
    }
    onMessage(msg) {
        console.debug("GameClient.onMessage");
        // Parse a text message.
        if (typeof msg.data === "string") {
            const data = JSON.parse(msg.data);
            console.debug("GameClient.onMessage: data", data);
            const awaiter = this.responseAwaiters_.shift();
            if (!awaiter) {
                console.error("GameClient.onMessage: no awaiter for message", data);
                throw new Error("GameClient.onMessage: no awaiter");
            }
            awaiter.resolve(data);
            console.debug("GameClient.onMessage: awaiter resolved");
        }
        else {
            console.error("GameClient.onMessage: unexpected message type", typeof msg.data);
            throw new Error("GameClient.onMessage: unexpected message type");
        }
    }
}
exports.default = GameClient;
//# sourceMappingURL=game_client.js.map