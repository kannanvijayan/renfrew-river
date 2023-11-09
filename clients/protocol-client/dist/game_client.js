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
        const { transport, callbacks } = args;
        this.callbacks_ = callbacks;
        this.transport_ = transport;
        this.responseAwaiters_ = [];
        this.transport_.addEventListener("open", this.handleOpen.bind(this));
        this.transport_.addEventListener("close", this.handleClose.bind(this));
        this.transport_.addEventListener("error", this.handleError.bind(this));
        this.transport_.addEventListener("message", this.handleMessage.bind(this));
    }
    disconnect() {
        this.transport_.close();
    }
    getConstants() {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.sendCommand("GetConstants", {});
            if ("Constants" in result) {
                return result.Constants;
            }
            throw new Error("GetConstants: unexpected response");
        });
    }
    defaultSettings() {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.sendCommand("DefaultSettings", {});
            if ("DefaultSettings" in result) {
                const settings = result.DefaultSettings.settings;
                const minWorldDims = result.DefaultSettings.minWorldDims;
                const maxWorldDims = result.DefaultSettings.maxWorldDims;
                return { settings, minWorldDims, maxWorldDims };
            }
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
            const result = yield this.sendCommand("ReadMapData", opts);
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
                miniDims: opts.miniDims,
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
                cellCoord: coord,
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
                animalId: animalId,
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
            const msg = JSON.stringify(msgObj);
            // Send the command, but only after the response from the
            // current last command has been received.
            if (this.responseAwaiters_.length > 0) {
                this.responseAwaiters_[this.responseAwaiters_.length - 1].promise.then(() => this.transport_.send(msg));
            }
            else {
                this.transport_.send(msg);
            }
            // Create and push an awaiter for the response.
            let resolve;
            let reject;
            const promise = new Promise((res, rej) => {
                resolve = res;
                reject = rej;
            });
            const awaiter = { command, resolve, reject, promise };
            this.responseAwaiters_.push(awaiter);
            return promise;
        });
    }
    handleOpen() {
        this.callbacks_.onConnect();
    }
    handleClose() {
        var _a, _b;
        for (const awaiter of this.responseAwaiters_) {
            awaiter.reject("Connection closed");
        }
        this.responseAwaiters_ = [];
        (_b = (_a = this.callbacks_).onClose) === null || _b === void 0 ? void 0 : _b.call(_a);
    }
    handleError(err) {
        for (const awaiter of this.responseAwaiters_) {
            if (err instanceof Error) {
                awaiter.reject(err);
            }
            else {
                awaiter.reject(new Error(`Connection error: ${err}`));
            }
        }
        this.responseAwaiters_ = [];
        this.callbacks_.onError(err);
    }
    handleMessage(msg) {
        // Parse a text message.
        const data = JSON.parse(msg);
        const awaiter = this.responseAwaiters_.shift();
        if (!awaiter) {
            throw new Error("GameClient.onMessage: no awaiter");
        }
        awaiter.resolve(data);
    }
}
exports.default = GameClient;
//# sourceMappingURL=game_client.js.map